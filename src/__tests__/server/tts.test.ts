/**
 * Epic 2 — Story 2.1: TTS Generation
 * Verifies TTS calls OpenAI, stores MP3, and returns correct URL.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

// Mock OpenAI client
vi.mock("@/lib/openai/client", () => ({
  default: {
    audio: {
      speech: {
        create: vi.fn(),
      },
    },
  },
}));

// Mock fs/promises (async version used by tts.ts)
vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn(async () => undefined),
    writeFile: vi.fn(async () => undefined),
  },
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
}));

import openai from "@/lib/openai/client";
import fs from "fs/promises";
import { generateTts } from "@/lib/openai/tts";

const mockCreate = openai.audio.speech.create as ReturnType<typeof vi.fn>;
const mockMkdir = fs.mkdir as ReturnType<typeof vi.fn>;
const mockWriteFile = fs.writeFile as ReturnType<typeof vi.fn>;

describe("Epic 2 — TTS Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Story 2.1 AC: server sends text to OpenAI TTS API", () => {
    it("calls OpenAI TTS with correct model and Spanish voice", async () => {
      const mockAudioBuffer = new ArrayBuffer(100);
      mockCreate.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      await generateTts("Esta es la Catedral de Florencia", 1, 42);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "tts-1",
          voice: "nova",
          input: "Esta es la Catedral de Florencia",
          response_format: "mp3",
        })
      );
    });
  });

  describe("Story 2.1 AC: audio stored as MP3 in /data/audio/", () => {
    it("creates audio directory", async () => {
      const mockAudioBuffer = new ArrayBuffer(100);
      mockCreate.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      await generateTts("Test", 1, 42);

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining(path.join("data", "audio", "1")),
        { recursive: true }
      );
    });

    it("writes MP3 file to data/audio/{projectId}/{messageId}.mp3", async () => {
      const mockAudioBuffer = new ArrayBuffer(100);
      mockCreate.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      await generateTts("Test", 1, 42);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join("data", "audio", "1", "42.mp3")),
        expect.any(Buffer)
      );
    });
  });

  describe("Story 2.1 AC: returns URL associated with message", () => {
    it("returns /api/audio/{projectId}/{messageId}.mp3", async () => {
      const mockAudioBuffer = new ArrayBuffer(100);
      mockCreate.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const url = await generateTts("Test", 5, 99);
      expect(url).toBe("/api/audio/5/99.mp3");
    });
  });

  describe("Story 2.1 AC: TTS failure propagates for degraded mode (NFR14)", () => {
    it("throws when OpenAI TTS fails", async () => {
      mockCreate.mockRejectedValue(new Error("TTS service unavailable"));

      await expect(generateTts("Test", 1, 42)).rejects.toThrow("TTS service unavailable");
    });
  });
});
