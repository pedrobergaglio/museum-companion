/**
 * Epic 2 — Story 2.1, 2.2: Audio Store
 * Verifies TTS state, ambient music state, random track selection, and audio unlock.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAudioStore } from "@/stores/audio-store";

describe("Epic 2 — Audio Store", () => {
  beforeEach(() => {
    useAudioStore.setState({
      isPlayingTts: false,
      currentTtsUrl: null,
      isPlayingAmbient: false,
      ambientMusicEnabled: false,
      isAudioUnlocked: false,
    });
  });

  describe("Story 2.1 AC: TTS state management", () => {
    it("defaults to not playing TTS", () => {
      expect(useAudioStore.getState().isPlayingTts).toBe(false);
      expect(useAudioStore.getState().currentTtsUrl).toBeNull();
    });

    it("setCurrentTtsUrl sets the URL for auto-playback trigger", () => {
      useAudioStore.getState().setCurrentTtsUrl("/api/audio/1/42.mp3");
      expect(useAudioStore.getState().currentTtsUrl).toBe("/api/audio/1/42.mp3");
    });

    it("setPlayingTts toggles playback state", () => {
      useAudioStore.getState().setPlayingTts(true);
      expect(useAudioStore.getState().isPlayingTts).toBe(true);

      useAudioStore.getState().setPlayingTts(false);
      expect(useAudioStore.getState().isPlayingTts).toBe(false);
    });

    it("clearing currentTtsUrl signals end of playback intent", () => {
      useAudioStore.getState().setCurrentTtsUrl("/api/audio/1/42.mp3");
      useAudioStore.getState().setCurrentTtsUrl(null);
      expect(useAudioStore.getState().currentTtsUrl).toBeNull();
    });
  });

  describe("Story 2.2 AC: ambient music state", () => {
    it("defaults to ambient music disabled", () => {
      expect(useAudioStore.getState().ambientMusicEnabled).toBe(false);
      expect(useAudioStore.getState().isPlayingAmbient).toBe(false);
    });

    it("setAmbientMusicEnabled toggles the feature flag", () => {
      useAudioStore.getState().setAmbientMusicEnabled(true);
      expect(useAudioStore.getState().ambientMusicEnabled).toBe(true);
    });

    it("setPlayingAmbient tracks ambient playback state", () => {
      useAudioStore.getState().setPlayingAmbient(true);
      expect(useAudioStore.getState().isPlayingAmbient).toBe(true);
    });
  });

  describe("Story 2.2 AC: 5 random ambient tracks (FR13)", () => {
    it("getRandomAmbientTrack returns a valid /music/ path", () => {
      const track = useAudioStore.getState().getRandomAmbientTrack();
      expect(track).toMatch(/^\/music\/track-\d\.mp3$/);
    });

    it("getRandomAmbientTrack returns one of 5 possible tracks", () => {
      const validTracks = new Set([
        "/music/track-1.mp3",
        "/music/track-2.mp3",
        "/music/track-3.mp3",
        "/music/track-4.mp3",
        "/music/track-5.mp3",
      ]);

      // Call many times to verify distribution
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const track = useAudioStore.getState().getRandomAmbientTrack();
        expect(validTracks.has(track)).toBe(true);
        results.add(track);
      }

      // With 100 draws from 5 tracks, we should see at least 3 distinct tracks
      expect(results.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Story 2.1 AC: audio unlock state for Safari/Chrome", () => {
    it("defaults to audio NOT unlocked", () => {
      expect(useAudioStore.getState().isAudioUnlocked).toBe(false);
    });

    it("setAudioUnlocked marks audio as unlocked after user gesture", () => {
      useAudioStore.getState().setAudioUnlocked(true);
      expect(useAudioStore.getState().isAudioUnlocked).toBe(true);
    });
  });
});
