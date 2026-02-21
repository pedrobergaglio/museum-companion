"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAudioStore } from "@/stores/audio-store";
import { toast } from "sonner";

/**
 * Componente invisible que reproduce TTS automaticamente
 * cuando currentTtsUrl cambia en el audio store.
 * Emite eventos de inicio/fin para que ambient-music se sincronice.
 */
export function TtsPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTtsUrl,
    isAudioUnlocked,
    setPlayingTts,
    setCurrentTtsUrl,
  } = useAudioStore();

  const playTts = useCallback(
    async (url: string) => {
      try {
        // Reusar o crear elemento de audio
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        // Detener audio previo si esta sonando
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }

        audio.src = url;
        audio.volume = 1.0;

        audio.onplay = () => {
          setPlayingTts(true);
        };

        audio.onended = () => {
          setPlayingTts(false);
          setCurrentTtsUrl(null);
        };

        audio.onerror = () => {
          console.error("[TTS] Error reproduciendo audio:", url);
          setPlayingTts(false);
          setCurrentTtsUrl(null);
          toast.warning(
            "No se pudo reproducir el audio. El texto está disponible."
          );
        };

        await audio.play();
      } catch (error) {
        console.error("[TTS] Error en playTts:", error);
        setPlayingTts(false);
        setCurrentTtsUrl(null);
        // NFR14: Modo degradado — no bloquear si audio falla
        toast.warning(
          "No se pudo reproducir el audio. El texto está disponible."
        );
      }
    },
    [setPlayingTts, setCurrentTtsUrl]
  );

  // Reaccionar a cambios en currentTtsUrl
  useEffect(() => {
    if (!currentTtsUrl) return;

    if (!isAudioUnlocked) {
      console.warn(
        "[TTS] Audio no desbloqueado. Esperando gesto de usuario..."
      );
      // Intentar reproducir de todas formas — puede funcionar si el user
      // ya interactuo con la pagina en esta sesion
    }

    playTts(currentTtsUrl);
  }, [currentTtsUrl, isAudioUnlocked, playTts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Componente invisible — no renderiza UI
  return null;
}
