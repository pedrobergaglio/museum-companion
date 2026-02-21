"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useChannelStore } from "@/stores/channel-store";
import { useProjectStore } from "@/stores/project-store";
import { useAudioStore } from "@/stores/audio-store";
import type {
  NewCaptureEvent,
  TextStreamEvent,
  TtsReadyEvent,
  PhotographerChangedEvent,
} from "@/types";
import { toast } from "sonner";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 3000; // NFR11: cada 3 segundos

/** Hook que gestiona la conexión Socket.IO del cliente. */
export function useSocket(userId: number | null, projectId: number | null) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  /** Track whether we ever successfully connected (to distinguish first-connect errors from reconnects) */
  const hasConnectedRef = useRef(false);

  const { setConnectedToGroup, setPhotographer } = useChannelStore();
  const {
    addMessage,
    updateMessageTtsUrl,
    appendStreamingText,
    setStreaming,
    setStreamingText,
    setStreamingMessageId,
  } = useProjectStore();
  const { setCurrentTtsUrl } = useAudioStore();

  // --- Manual reconnect con fallback a modo solo (NFR12) ---
  const attemptReconnect = useCallback(() => {
    reconnectAttemptsRef.current += 1;
    if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
      setConnectedToGroup(false);
      toast.warning("No se pudo reconectar al grupo. Modo solo activado.");
      return;
    }
    console.log(
      `[Socket.IO] Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`
    );
    setTimeout(() => {
      socketRef.current?.connect();
    }, RECONNECT_INTERVAL);
  }, [setConnectedToGroup]);

  // --- Connect ---
  const connect = useCallback(() => {
    if (!userId || !projectId) return;

    // Fix M1-prev: Clean up any existing socket before creating a new one
    // (prevents leaks if connect() is called while a socket exists in disconnected/reconnecting state)
    if (socketRef.current) {
      if (socketRef.current.connected) return; // already connected, nothing to do
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    hasConnectedRef.current = false;

    const socket = io(SOCKET_URL, {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
      reconnection: false, // gestionamos manual para cumplir NFR11/12
    });

    socket.on("connect", () => {
      console.log("[Socket.IO] Client connected:", socket.id);
      hasConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      socket.emit("join-channel", { projectId, userId });
      setConnectedToGroup(true);
    });

    // --- Inbound events ---

    socket.on("new-capture", (event: NewCaptureEvent) => {
      // Solo procesar si no soy el autor
      if (event.userId === userId) return;
      addMessage({
        id: event.messageId,
        conversationId: 0,
        role: "user",
        contentText: null,
        imageUrl: event.imageUrl,
        audioUrl: null,
        ttsAudioUrl: null,
        latitude: event.latitude ?? null,
        longitude: event.longitude ?? null,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("text-stream", (event: TextStreamEvent) => {
      // Ignorar eventos propios — el autor ya recibe texto via SSE
      if (event.userId === userId) return;

      if (event.done) {
        // Agregar mensaje de assistant completo al store
        if (event.fullText && event.assistantMessageId) {
          addMessage({
            id: event.assistantMessageId,
            conversationId: 0,
            role: "assistant",
            contentText: event.fullText,
            imageUrl: null,
            audioUrl: null,
            ttsAudioUrl: null,
            latitude: null,
            longitude: null,
            createdAt: new Date().toISOString(),
          });
        }
        setStreaming(false);
        setStreamingText("");
        setStreamingMessageId(null);
      } else {
        setStreaming(true);
        setStreamingMessageId(event.messageId);
        appendStreamingText(event.delta);
      }
    });

    socket.on("tts-ready", (event: TtsReadyEvent) => {
      // Solo reproducir para oyentes — el remitente ya recibe via SSE
      if (event.userId === userId) return;
      // Actualizar el mensaje con la URL del TTS para el boton "Escuchar"
      updateMessageTtsUrl(event.messageId, event.audioUrl);
      // Reproducir TTS automaticamente para oyentes del grupo
      setCurrentTtsUrl(event.audioUrl);
    });

    socket.on("photographer-changed", (event: PhotographerChangedEvent) => {
      setPhotographer(event.userId, event.userName);
      toast.info(`Nuevo fotógrafo: ${event.userName}`);
    });

    // --- Disconnect + reconexion manual (NFR11/12) ---

    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Client disconnected, reason:", reason);
      setConnectedToGroup(false);
      // Only attempt reconnect for non-intentional disconnects
      if (reason === "io server disconnect" || reason === "io client disconnect") {
        // Intentional disconnect — don't reconnect
        return;
      }
      // Transport close, ping timeout, etc. — try to reconnect
      attemptReconnect();
    });

    // Fix C3: Only count reconnect attempts if we previously connected successfully.
    // Before first connection, connect_error is expected (server might be starting up)
    // and should not exhaust the reconnect counter.
    socket.on("connect_error", () => {
      console.log("[Socket.IO] Connection error");
      if (hasConnectedRef.current) {
        // Lost connection after being connected — count toward reconnect limit
        attemptReconnect();
      } else {
        // First connection attempt failed — retry without counting toward limit
        console.log("[Socket.IO] Initial connection failed, retrying...");
        setTimeout(() => {
          socketRef.current?.connect();
        }, RECONNECT_INTERVAL);
      }
    });

    socketRef.current = socket;
  }, [
    userId,
    projectId,
    attemptReconnect,
    setConnectedToGroup,
    setPhotographer,
    addMessage,
    updateMessageTtsUrl,
    appendStreamingText,
    setStreaming,
    setStreamingText,
    setStreamingMessageId,
    setCurrentTtsUrl,
  ]);

  // --- Disconnect ---
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("leave-channel");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    hasConnectedRef.current = false;
    setConnectedToGroup(false);
  }, [setConnectedToGroup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { connect, disconnect, socket: socketRef };
}
