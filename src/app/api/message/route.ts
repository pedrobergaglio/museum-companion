import { NextResponse } from "next/server";
import {
  getOrCreateConversation,
  createMessage,
  getConversationMessages,
  updateMessageTtsUrl,
} from "@/lib/db/queries/messages";
import { getSettings } from "@/lib/db/queries/settings";
import { streamTextResponse } from "@/lib/openai/vision";
import { generateTts } from "@/lib/openai/tts";
import { transcribeAudio } from "@/lib/openai/whisper";
import { broadcastTextStream, broadcastTtsReady } from "@/lib/socket/server";

/**
 * Parse request body — supports JSON (text messages) and FormData (voice messages).
 */
async function parseRequestBody(
  request: Request
): Promise<{ projectId: number; userId: number; text: string; transcription?: string; soloMode: boolean }> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // Voice message via FormData
    const formData = await request.formData();
    const projectId = parseInt(formData.get("projectId") as string);
    const userId = parseInt(formData.get("userId") as string);
    const textFromForm = formData.get("text") as string | null;
    const audioFile = formData.get("audio") as File | null;
    // FR20: Modo solo — no broadcast al grupo
    const soloMode = formData.get("soloMode") === "true";

    let text = textFromForm || "";
    let transcription: string | undefined;

    // Transcribe audio via Whisper if present
    // M2-new Fix: Wrap in try/catch like capture/route.ts — don't crash if Whisper fails
    if (audioFile && audioFile.size > 0) {
      try {
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
        transcription = await transcribeAudio(audioBuffer, audioFile.name || "audio.webm");
        if (!text && transcription) {
          text = transcription;
        }
      } catch (whisperError) {
        console.error("Error transcribing audio:", whisperError);
        // Continue without transcription — will fail validation if no text was provided
      }
    }

    if (isNaN(projectId) || projectId <= 0 || isNaN(userId) || userId <= 0 || !text) {
      throw new Error("VALIDATION_ERROR");
    }

    return { projectId, userId, text, transcription, soloMode };
  } else {
    // JSON text message
    const body = await request.json();
    const projectId = Number(body.projectId);
    const userId = Number(body.userId);
    const { text, soloMode } = body;

    if (isNaN(projectId) || projectId <= 0 || isNaN(userId) || userId <= 0 || !text) {
      throw new Error("VALIDATION_ERROR");
    }

    return { projectId, userId, text, soloMode: soloMode === true };
  }
}

export async function POST(request: Request) {
  try {
    let parsed;
    try {
      parsed = await parseRequestBody(request);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "projectId, userId y text (o audio) son requeridos",
          },
        },
        { status: 400 }
      );
    }

    const { projectId, userId, text, transcription, soloMode } = parsed;

    // Obtener o crear conversacion
    const conversation = await getOrCreateConversation(projectId, userId);

    // M2-prev Fix: Fetch history BEFORE creating the user message
    // to avoid including the current message as duplicate context for OpenAI
    const history = await getConversationMessages(conversation.id);
    const conversationHistory = history
      .filter((m) => m.contentText)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.contentText!,
      }));

    // Crear mensaje de usuario
    const userMessage = await createMessage({
      conversationId: conversation.id,
      role: "user",
      contentText: text,
    });

    // Obtener settings para el system prompt y verificacion de fotografo
    const settingsData = await getSettings();
    // FR20: No broadcast si el usuario esta en modo solo, incluso si es el fotografo designado
    const shouldBroadcast = !soloMode && userId === settingsData.photographerUserId;

    // Stream response from OpenAI
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "meta",
                messageId: userMessage.id,
                ...(transcription ? { transcription } : {}),
              })}\n\n`
            )
          );

          const generator = streamTextResponse({
            systemPrompt: settingsData.systemPrompt,
            text,
            conversationHistory,
          });

          for await (const delta of generator) {
            fullText += delta;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text-delta",
                  content: delta,
                })}\n\n`
              )
            );

            // Broadcast cada chunk al canal grupal — solo fotografo
            if (shouldBroadcast) {
              broadcastTextStream(projectId, {
                messageId: userMessage.id,
                delta,
                done: false,
                userId,
              });
            }
          }

          // Crear mensaje de assistant
          const assistantMessage = await createMessage({
            conversationId: conversation.id,
            role: "assistant",
            contentText: fullText,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "text-done",
                content: fullText,
                assistantMessageId: assistantMessage.id,
              })}\n\n`
            )
          );

          // Broadcast text-done al canal grupal — solo fotografo
          if (shouldBroadcast) {
            broadcastTextStream(projectId, {
              messageId: userMessage.id,
              delta: "",
              done: true,
              fullText,
              assistantMessageId: assistantMessage.id,
              userId,
            });
          }

          // Generar TTS en paralelo
          try {
            const ttsAudioUrl = await generateTts(
              fullText,
              projectId,
              assistantMessage.id
            );

            // Guardar URL de TTS en el mensaje
            await updateMessageTtsUrl(assistantMessage.id, ttsAudioUrl);

            // Enviar evento tts-ready al cliente directo (SSE)
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "tts-ready",
                  audioUrl: ttsAudioUrl,
                  messageId: assistantMessage.id,
                })}\n\n`
              )
            );

            // Broadcast tts-ready al canal grupal — solo fotografo
            if (shouldBroadcast) {
              broadcastTtsReady(projectId, {
                messageId: assistantMessage.id,
                audioUrl: ttsAudioUrl,
                userId,
              });
            }
          } catch (ttsError) {
            console.error("Error generating TTS:", ttsError);
            // NFR14: Modo degradado — texto sin audio si TTS falla
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "tts-error",
                  content:
                    "No se pudo generar el audio. El texto esta disponible.",
                })}\n\n`
              )
            );
          }
        } catch (error) {
          console.error("Error streaming from OpenAI:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                content: "Error al conectar con la IA. Intenta de nuevo.",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in message:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MESSAGE_ERROR",
          message: "Error al procesar el mensaje",
        },
      },
      { status: 500 }
    );
  }
}
