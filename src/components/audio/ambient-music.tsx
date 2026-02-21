"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAudioStore } from "@/stores/audio-store";

const FADE_DURATION = 2000; // 2 segundos fade in/out
const AMBIENT_VOLUME = 0.11; // Volumen bajo de fondo (25% mas bajo que 0.15)
const FADE_STEPS = 40; // Pasos para el fade (suavidad)

/**
 * Componente invisible que gestiona la musica ambiental.
 * Se sincroniza con el estado de TTS:
 * - Cuando TTS empieza a sonar → fade-in de musica ambiental (track aleatorio)
 * - Cuando TTS termina → fade-out y detener musica
 * - Solo activo si ambientMusicEnabled es true
 */
export function AmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    isPlayingTts,
    ambientMusicEnabled,
    isPlayingAmbient,
    setPlayingAmbient,
    getRandomAmbientTrack,
  } = useAudioStore();

  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const fadeIn = useCallback(
    (audio: HTMLAudioElement) => {
      clearFade();
      audio.volume = 0;

      const stepDuration = FADE_DURATION / FADE_STEPS;
      const volumeStep = AMBIENT_VOLUME / FADE_STEPS;
      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.min(volumeStep * currentStep, AMBIENT_VOLUME);
        audio.volume = newVolume;

        if (currentStep >= FADE_STEPS) {
          clearFade();
        }
      }, stepDuration);
    },
    [clearFade]
  );

  const fadeOut = useCallback(
    (audio: HTMLAudioElement) => {
      clearFade();

      const startVolume = audio.volume;
      const stepDuration = FADE_DURATION / FADE_STEPS;
      const volumeStep = startVolume / FADE_STEPS;
      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(startVolume - volumeStep * currentStep, 0);
        audio.volume = newVolume;

        if (currentStep >= FADE_STEPS) {
          clearFade();
          audio.pause();
          audio.currentTime = 0;
          setPlayingAmbient(false);
        }
      }, stepDuration);
    },
    [clearFade, setPlayingAmbient]
  );

  // Reaccionar a cambios en isPlayingTts y ambientMusicEnabled
  useEffect(() => {
    // Si se desactivo la musica ambiental y esta sonando, fade-out inmediato
    if (!ambientMusicEnabled && isPlayingAmbient) {
      if (audioRef.current) {
        fadeOut(audioRef.current);
      }
      return;
    }

    if (!ambientMusicEnabled) return;

    if (isPlayingTts && !isPlayingAmbient) {
      // TTS empezo → fade-in musica ambiental
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
      }

      const audio = audioRef.current;
      const track = getRandomAmbientTrack();
      audio.src = track;
      audio.volume = 0;

      audio
        .play()
        .then(() => {
          setPlayingAmbient(true);
          fadeIn(audio);
        })
        .catch((err) => {
          console.error("[Ambient] Error reproduciendo musica:", err);
        });
    } else if (!isPlayingTts && isPlayingAmbient) {
      // TTS termino → fade-out musica ambiental
      if (audioRef.current) {
        fadeOut(audioRef.current);
      }
    }
  }, [
    isPlayingTts,
    ambientMusicEnabled,
    isPlayingAmbient,
    fadeIn,
    fadeOut,
    getRandomAmbientTrack,
    setPlayingAmbient,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [clearFade]);

  // Componente invisible — no renderiza UI
  return null;
}
