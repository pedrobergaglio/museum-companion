"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { useAudioStore } from "@/stores/audio-store";
import { useChannelStore } from "@/stores/channel-store";
import { toast } from "sonner";

/**
 * Shared SSE stream reader for capture and message responses.
 * Parses SSE events and dispatches them to the store.
 */
function createStreamHandler(deps: {
  addMessage: ReturnType<typeof useProjectStore.getState>["addMessage"];
  updateMessageText: ReturnType<typeof useProjectStore.getState>["updateMessageText"];
  updateMessageTtsUrl: ReturnType<typeof useProjectStore.getState>["updateMessageTtsUrl"];
  setStreamingText: ReturnType<typeof useProjectStore.getState>["setStreamingText"];
  appendStreamingText: ReturnType<typeof useProjectStore.getState>["appendStreamingText"];
  setStreamingMessageId: ReturnType<typeof useProjectStore.getState>["setStreamingMessageId"];
  setCurrentTtsUrl: ReturnType<typeof useAudioStore.getState>["setCurrentTtsUrl"];
  /** Optional: fields for the user message (capture with image) */
  userMessageOverrides?: {
    question?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  /** Optional: placeholder message ID to update with transcription (voice messages) */
  placeholderMessageId?: number;
}) {
  const {
    addMessage,
    updateMessageText,
    updateMessageTtsUrl,
    setStreamingText,
    appendStreamingText,
    setStreamingMessageId,
    setCurrentTtsUrl,
    userMessageOverrides,
    placeholderMessageId,
  } = deps;

  return async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let data;
        try {
          data = JSON.parse(line.slice(6));
        } catch {
          console.warn("[SSE] Malformed event:", line);
          continue;
        }

        if (data.type === "meta") {
          setStreamingMessageId(data.messageId);
          if (data.imageUrl) {
            // Story 3.1: For camera captures, show transcription as contentText
            addMessage({
              id: data.messageId,
              conversationId: 0,
              role: "user",
              contentText: data.transcription || userMessageOverrides?.question || null,
              imageUrl: data.imageUrl,
              audioUrl: null,
              ttsAudioUrl: null,
              latitude: userMessageOverrides?.latitude || null,
              longitude: userMessageOverrides?.longitude || null,
              createdAt: new Date().toISOString(),
            });
          }
          // Story 3.2: For voice-only messages, replace the placeholder text
          if (data.transcription && placeholderMessageId) {
            updateMessageText(placeholderMessageId, data.transcription);
          }
        } else if (data.type === "text-delta") {
          appendStreamingText(data.content);
        } else if (data.type === "text-done") {
          addMessage({
            id: data.assistantMessageId,
            conversationId: 0,
            role: "assistant",
            contentText: data.content,
            imageUrl: null,
            audioUrl: null,
            ttsAudioUrl: null,
            latitude: null,
            longitude: null,
            createdAt: new Date().toISOString(),
          });
          setStreamingText("");
          setStreamingMessageId(null);
        } else if (data.type === "tts-ready") {
          updateMessageTtsUrl(data.messageId, data.audioUrl);
          setCurrentTtsUrl(data.audioUrl);
        } else if (data.type === "tts-error") {
          toast.warning(data.content);
        } else if (data.type === "error") {
          toast.error(data.content);
        }
      }
    }
  };
}

export function useCapture() {
  const {
    activeProject,
    addMessage,
    updateMessageText,
    updateMessageTtsUrl,
    setStreaming,
    setStreamingText,
    appendStreamingText,
    setStreamingMessageId,
  } = useProjectStore();
  const { currentUser } = useUserStore();
  const { setCurrentTtsUrl } = useAudioStore();
  const { isConnectedToGroup } = useChannelStore();

  /**
   * Send a photo capture, optionally with an audio blob (voice question).
   * - Tap: imageBlob only (question = undefined, audioBlob = undefined)
   * - Hold: imageBlob + audioBlob (transcribed server-side via Whisper)
   */
  const sendCapture = useCallback(
    async (
      imageBlob: Blob,
      question?: string,
      latitude?: number,
      longitude?: number,
      audioBlob?: Blob
    ) => {
      if (!activeProject || !currentUser) {
        toast.error("Selecciona un proyecto primero");
        return;
      }

      const formData = new FormData();
      formData.append("projectId", String(activeProject.id));
      formData.append("userId", String(currentUser.id));
      formData.append("image", imageBlob, "photo.webp");
      if (question) formData.append("question", question);
      if (latitude != null) formData.append("latitude", String(latitude));
      if (longitude != null) formData.append("longitude", String(longitude));
      if (audioBlob) formData.append("audio", audioBlob, "audio.webm");
      // FR20: Modo solo — no broadcast al grupo
      if (!isConnectedToGroup) formData.append("soloMode", "true");

      setStreaming(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/capture", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Error al enviar la captura");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const handleStream = createStreamHandler({
          addMessage,
          updateMessageText,
          updateMessageTtsUrl,
          setStreamingText,
          appendStreamingText,
          setStreamingMessageId,
          setCurrentTtsUrl,
          userMessageOverrides: {
            question: question || null,
            latitude: latitude || null,
            longitude: longitude || null,
          },
        });

        await handleStream(reader);
      } catch (error) {
        console.error("Capture error:", error);
        toast.error("Error al procesar la captura. Intenta de nuevo.");
      } finally {
        setStreaming(false);
      }
    },
    [
      activeProject,
      currentUser,
      isConnectedToGroup,
      addMessage,
      updateMessageText,
      updateMessageTtsUrl,
      setStreaming,
      setStreamingText,
      appendStreamingText,
      setStreamingMessageId,
      setCurrentTtsUrl,
    ]
  );

  /**
   * Send a text follow-up message (keyboard input).
   */
  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!activeProject || !currentUser) {
        toast.error("Selecciona un proyecto primero");
        return;
      }

      addMessage({
        id: Date.now(),
        conversationId: 0,
        role: "user",
        contentText: text,
        imageUrl: null,
        audioUrl: null,
        ttsAudioUrl: null,
        latitude: null,
        longitude: null,
        createdAt: new Date().toISOString(),
      });

      setStreaming(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: activeProject.id,
            userId: currentUser.id,
            text,
            // FR20: Modo solo — no broadcast al grupo
            soloMode: !isConnectedToGroup,
          }),
        });

        if (!res.ok) {
          throw new Error("Error al enviar el mensaje");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const handleStream = createStreamHandler({
          addMessage,
          updateMessageText,
          updateMessageTtsUrl,
          setStreamingText,
          appendStreamingText,
          setStreamingMessageId,
          setCurrentTtsUrl,
        });

        await handleStream(reader);
      } catch (error) {
        console.error("Message error:", error);
        toast.error("Error al enviar el mensaje. Intenta de nuevo.");
      } finally {
        setStreaming(false);
      }
    },
    [
      activeProject,
      currentUser,
      isConnectedToGroup,
      addMessage,
      updateMessageText,
      updateMessageTtsUrl,
      setStreaming,
      setStreamingText,
      appendStreamingText,
      setStreamingMessageId,
      setCurrentTtsUrl,
    ]
  );

  /**
   * Send a voice follow-up message (mic hold, no photo).
   * Audio is sent to /api/message as FormData, server transcribes via Whisper.
   */
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (!activeProject || !currentUser) {
        toast.error("Selecciona un proyecto primero");
        return;
      }

      // Add a placeholder user message showing voice input
      const placeholderId = Date.now();
      addMessage({
        id: placeholderId,
        conversationId: 0,
        role: "user",
        contentText: "Transcribiendo...",
        imageUrl: null,
        audioUrl: null,
        ttsAudioUrl: null,
        latitude: null,
        longitude: null,
        createdAt: new Date().toISOString(),
      });

      setStreaming(true);
      setStreamingText("");

      try {
        const formData = new FormData();
        formData.append("projectId", String(activeProject.id));
        formData.append("userId", String(currentUser.id));
        formData.append("audio", audioBlob, "audio.webm");
        // FR20: Modo solo — no broadcast al grupo
        if (!isConnectedToGroup) formData.append("soloMode", "true");

        const res = await fetch("/api/message", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Error al enviar el mensaje de voz");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const handleStream = createStreamHandler({
          addMessage,
          updateMessageText,
          updateMessageTtsUrl,
          setStreamingText,
          appendStreamingText,
          setStreamingMessageId,
          setCurrentTtsUrl,
          placeholderMessageId: placeholderId,
        });

        await handleStream(reader);
      } catch (error) {
        console.error("Voice message error:", error);
        toast.error("Error al enviar el mensaje de voz. Intenta de nuevo.");
      } finally {
        setStreaming(false);
      }
    },
    [
      activeProject,
      currentUser,
      isConnectedToGroup,
      addMessage,
      updateMessageText,
      updateMessageTtsUrl,
      setStreaming,
      setStreamingText,
      appendStreamingText,
      setStreamingMessageId,
      setCurrentTtsUrl,
    ]
  );

  return { sendCapture, sendTextMessage, sendVoiceMessage };
}
