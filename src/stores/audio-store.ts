"use client";

import { create } from "zustand";

const AMBIENT_TRACKS = [
  "/music/track-1.mp3",
  "/music/track-2.mp3",
  "/music/track-3.mp3",
  "/music/track-4.mp3",
  "/music/track-5.mp3",
];

interface AudioStoreState {
  // TTS state
  isPlayingTts: boolean;
  currentTtsUrl: string | null;
  // Ambient state
  isPlayingAmbient: boolean;
  ambientMusicEnabled: boolean;
  // Audio unlock state (Safari/Chrome autoplay policy)
  isAudioUnlocked: boolean;

  // Actions
  setPlayingTts: (playing: boolean) => void;
  setCurrentTtsUrl: (url: string | null) => void;
  setPlayingAmbient: (playing: boolean) => void;
  setAmbientMusicEnabled: (enabled: boolean) => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  getRandomAmbientTrack: () => string;
}

export const useAudioStore = create<AudioStoreState>((set) => ({
  isPlayingTts: false,
  currentTtsUrl: null,
  isPlayingAmbient: false,
  ambientMusicEnabled: false,
  isAudioUnlocked: false,

  setPlayingTts: (isPlayingTts: boolean) => set({ isPlayingTts }),
  setCurrentTtsUrl: (currentTtsUrl: string | null) => set({ currentTtsUrl }),
  setPlayingAmbient: (isPlayingAmbient: boolean) => set({ isPlayingAmbient }),
  setAmbientMusicEnabled: (ambientMusicEnabled: boolean) =>
    set({ ambientMusicEnabled }),
  setAudioUnlocked: (isAudioUnlocked: boolean) => set({ isAudioUnlocked }),
  getRandomAmbientTrack: () =>
    AMBIENT_TRACKS[Math.floor(Math.random() * AMBIENT_TRACKS.length)],
}));
