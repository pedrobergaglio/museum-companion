import { NextResponse } from "next/server";
import { getOrCreateConversation, createMessage, getConversationMessages, updateMessageTtsUrl } from "@/lib/db/queries/messages";
import { getSettings } from "@/lib/db/queries/settings";
import { streamVisionResponse } from "@/lib/openai/vision";
import { generateTts } from "@/lib/openai/tts";
import { transcribeAudio } from "@/lib/openai/whisper";
import { broadcastNewCapture, broadcastTextStream, broadcastTtsReady } from "@/lib/socket/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const projectId = parseInt(formData.get("projectId") as string);
    const userId = parseInt(formData.get("userId") as string);
    const image = formData.get("image") as File;
    let question = formData.get("question") as string | null;
    const audioFile = formData.get("audio") as File | null;
    const latitude = formData.get("latitude")
      ? parseFloat(formData.get("latitude") as string)
      : null;
    const longitude = formData.get("longitude")
      ? parseFloat(formData.get("longitude") as string)
      : null;
    // FR20: Modo solo — el cliente indica que no quiere broadcast al grupo
    const soloMode = formData.get("soloMode") === "true";

    if (isNaN(projectId) || projectId <= 0 || isNaN(userId) || userId <= 0 || !image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "projectId, userId e image son requeridos",
          },
        },
        { status: 400 }
      );
    }

    // Guardar foto en disco
    const photoDir = path.join(
      process.cwd(),
      "data",
      "photos",
      String(projectId)
    );
    await fs.mkdir(photoDir, { recursive: true });

    const timestamp = Date.now();
    // Determine extension from image type (webp preferred, fallback to jpeg)
    const ext = image.type === "image/jpeg" ? "jpg" : "webp";
    const fileName = `${timestamp}_${userId}.${ext}`;
    const filePath = path.join(photoDir, fileName);
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    await fs.writeFile(filePath, imageBuffer);

    const imageUrl = `/api/photos/${projectId}/${fileName}`;

    // Si hay audio, transcribirlo via Whisper y usarlo como pregunta
    let transcription: string | null = null;
    if (audioFile && audioFile.size > 0) {
      try {
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
        transcription = await transcribeAudio(audioBuffer, audioFile.name || "audio.webm");
        // Si no habia question de texto, usar la transcripcion
        if (!question && transcription) {
          question = transcription;
        }
      } catch (whisperError) {
        console.error("Error transcribing audio:", whisperError);
        // No bloquear — continuar sin transcripcion
      }
    }

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
      contentText: question || null,
      imageUrl,
      latitude,
      longitude,
    });

    // Obtener settings para el system prompt y verificacion de fotografo
    const settingsData = await getSettings();
    // FR20: No broadcast si el usuario esta en modo solo, incluso si es el fotografo designado
    const shouldBroadcast = !soloMode && userId === settingsData.photographerUserId;

    // Convertir imagen a base64
    const imageBase64 = imageBuffer.toString("base64");

    // Stream response from OpenAI
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        try {
          // Enviar messageId, imageUrl y transcripcion como primer evento
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "meta",
                messageId: userMessage.id,
                imageUrl,
                ...(transcription ? { transcription } : {}),
              })}\n\n`
            )
          );

          // Broadcast foto al canal grupal — solo si es el fotografo designado
          if (shouldBroadcast) {
            broadcastNewCapture(projectId, {
              messageId: userMessage.id,
              imageUrl,
              projectId,
              userId,
              latitude,
              longitude,
            });
          }

          const generator = streamVisionResponse({
            systemPrompt: settingsData.systemPrompt,
            imageBase64,
            question: question || undefined,
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

            // Broadcast cada chunk de texto al canal grupal — solo fotografo
            if (shouldBroadcast) {
              broadcastTextStream(projectId, {
                messageId: userMessage.id,
                delta,
                done: false,
                userId,
              });
            }
          }

          // Crear mensaje de assistant con el texto completo
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

          // Generar TTS en paralelo (no bloquea el stream de texto)
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
                  content: "No se pudo generar el audio. El texto está disponible.",
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
                content: "Error al conectar con la IA. Intentá de nuevo.",
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
    console.error("Error in capture:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CAPTURE_ERROR",
          message: "Error al procesar la captura",
        },
      },
      { status: 500 }
    );
  }
}
