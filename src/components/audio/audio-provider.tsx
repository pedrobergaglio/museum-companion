"use client";

import { TtsPlayer } from "./tts-player";
import { AmbientMusic } from "./ambient-music";
import { useAudioUnlock } from "@/hooks/use-audio-unlock";

/**
 * Provider global de audio. Monta los componentes invisibles de TTS y
 * musica ambiental, y ejecuta la estrategia de audio unlock.
 * Debe montarse una sola vez en el layout raiz.
 */
export function AudioProvider() {
  // Desbloquear AudioContext con el primer gesto de usuario
  useAudioUnlock();

  return (
    <>
      <TtsPlayer />
      <AmbientMusic />
    </>
  );
}
