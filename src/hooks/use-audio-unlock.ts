"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAudioStore } from "@/stores/audio-store";

/**
 * Hook para desbloquear audio autoplay en Safari/Chrome.
 * Safari y Chrome requieren un gesto de usuario para reproducir audio.
 * Este hook escucha el primer tap/click y reproduce un audio silencioso
 * via HTMLAudioElement para desbloquear la capacidad de reproducir audio
 * programaticamente despues.
 */
export function useAudioUnlock() {
  const { isAudioUnlocked, setAudioUnlocked } = useAudioStore();
  const unlockAttemptedRef = useRef(false);

  const unlock = useCallback(() => {
    if (unlockAttemptedRef.current) return;
    unlockAttemptedRef.current = true;

    // Desbloquear HTMLAudioElement: crear y reproducir un audio silencioso
    // Esto "registra" la interaccion de usuario para futuras llamadas a .play()
    const silentAudio = new Audio(
      "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZAAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZAAAAAAAAAAAAAAAAAAAAA"
    );
    silentAudio.volume = 0.01;

    silentAudio
      .play()
      .then(() => {
        silentAudio.pause();
        setAudioUnlocked(true);
        console.log("[Audio] HTMLAudioElement desbloqueado");
      })
      .catch(() => {
        // Resetear para intentar en el proximo gesto
        unlockAttemptedRef.current = false;
      });
  }, [setAudioUnlocked]);

  useEffect(() => {
    if (isAudioUnlocked) return;

    const events = ["touchstart", "touchend", "click", "keydown"];
    const handler = () => {
      unlock();
      // Remover listeners despues del primer intento exitoso
      events.forEach((event) =>
        document.removeEventListener(event, handler, true)
      );
    };

    events.forEach((event) =>
      document.addEventListener(event, handler, { capture: true })
    );

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handler, true)
      );
    };
  }, [isAudioUnlocked, unlock]);

  return { isAudioUnlocked };
}
