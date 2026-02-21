/**
 * Epic 1 — Story 1.4, 1.5: OpenAI Vision & Text Streaming
 * Verifies streaming generators, retry logic, and conversation history handling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the OpenAI client
vi.mock("@/lib/openai/client", () => {
  return {
    default: {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    },
  };
});

import openai from "@/lib/openai/client";
import { streamVisionResponse, streamTextResponse } from "@/lib/openai/vision";

const mockCreate = openai.chat.completions.create as ReturnType<typeof vi.fn>;

describe("Epic 1 — OpenAI Vision & Text Streaming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Story 1.4 AC: GPT-4o with system prompt + conversation history + image", () => {
    it("streamVisionResponse sends system prompt, history, and image to gpt-4o", async () => {
      // Mock streaming response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "Esta " } }] };
          yield { choices: [{ delta: { content: "es la Catedral" } }] };
        },
      };
      mockCreate.mockResolvedValueOnce(mockStream);

      const gen = streamVisionResponse({
        systemPrompt: "Sos un guía de museo experto.",
        imageBase64: "abc123base64",
        conversationHistory: [
          { role: "user", content: "Hola" },
          { role: "assistant", content: "¡Hola!" },
        ],
      });

      const chunks: string[] = [];
      for await (const delta of gen) {
        chunks.push(delta);
      }

      expect(chunks).toEqual(["Esta ", "es la Catedral"]);

      // Verify the call was made with correct params
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o",
          stream: true,
          max_tokens: 1000,
        })
      );

      // Verify messages structure
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0]).toEqual({
        role: "system",
        content: "Sos un guía de museo experto.",
      });
      // History messages should be present
      expect(callArgs.messages[1]).toEqual({ role: "user", content: "Hola" });
      expect(callArgs.messages[2]).toEqual({ role: "assistant", content: "¡Hola!" });
      // Last message should contain image
      const lastMsg = callArgs.messages[callArgs.messages.length - 1];
      expect(lastMsg.role).toBe("user");
      expect(lastMsg.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "image_url" }),
          expect.objectContaining({ type: "text" }),
        ])
      );
    });

    it("streamVisionResponse uses custom question when provided", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "Respuesta" } }] };
        },
      };
      mockCreate.mockResolvedValueOnce(mockStream);

      const gen = streamVisionResponse({
        systemPrompt: "System",
        imageBase64: "abc",
        question: "¿De qué época es?",
        conversationHistory: [],
      });

      for await (const _chunk of gen) { /* consume */ }

      const lastMsg = mockCreate.mock.calls[0][0].messages.at(-1);
      const textPart = lastMsg.content.find((c: { type: string }) => c.type === "text");
      expect(textPart.text).toBe("¿De qué época es?");
    });

    it("streamVisionResponse uses default prompt when no question provided", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "ok" } }] };
        },
      };
      mockCreate.mockResolvedValueOnce(mockStream);

      const gen = streamVisionResponse({
        systemPrompt: "System",
        imageBase64: "abc",
        conversationHistory: [],
      });

      for await (const _chunk of gen) { /* consume */ }

      const lastMsg = mockCreate.mock.calls[0][0].messages.at(-1);
      const textPart = lastMsg.content.find((c: { type: string }) => c.type === "text");
      expect(textPart.text).toContain("Describí lo que ves");
    });
  });

  describe("Story 1.4 AC: conversation history limited to last 10 messages", () => {
    it("only includes last 10 messages from history", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "ok" } }] };
        },
      };
      mockCreate.mockResolvedValueOnce(mockStream);

      const longHistory = Array.from({ length: 20 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `Message ${i}`,
      }));

      const gen = streamVisionResponse({
        systemPrompt: "System",
        imageBase64: "abc",
        conversationHistory: longHistory,
      });

      for await (const _chunk of gen) { /* consume */ }

      // 1 system + 10 history + 1 user with image = 12 messages
      const messages = mockCreate.mock.calls[0][0].messages;
      expect(messages).toHaveLength(12);
    });
  });

  describe("NFR9 AC: retry with exponential backoff", () => {
    it("retries up to 3 times on failure then throws", async () => {
      mockCreate.mockRejectedValue(new Error("API Error"));

      const gen = streamVisionResponse({
        systemPrompt: "System",
        imageBase64: "abc",
        conversationHistory: [],
      });

      await expect(async () => {
        for await (const _chunk of gen) { /* consume */ }
      }).rejects.toThrow("API Error");

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("succeeds on second attempt after initial failure", async () => {
      mockCreate.mockRejectedValueOnce(new Error("Transient"));

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "recovered" } }] };
        },
      };
      mockCreate.mockResolvedValueOnce(mockStream);

      const gen = streamVisionResponse({
        systemPrompt: "System",
        imageBase64: "abc",
        conversationHistory: [],
      });

      const chunks: string[] = [];
      for await (const delta of gen) {
        chunks.push(delta);
      }

      expect(chunks).toEqual(["recovered"]);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Story 1.5 AC: text follow-up streaming with conversation context", () => {
    it("streamTextResponse sends text with conversation history", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "El Duomo fue " } }] };
          yield { choices: [{ delta: { content: "construido en 1436." } }] };
        },
      };
      mockCreate.mockResolvedValueOnce(mockStream);

      const gen = streamTextResponse({
        systemPrompt: "Sos un guía",
        text: "Contame más sobre el Duomo",
        conversationHistory: [
          { role: "user", content: "¿Qué es eso?" },
          { role: "assistant", content: "Es la Catedral de Florencia." },
        ],
      });

      const chunks: string[] = [];
      for await (const delta of gen) {
        chunks.push(delta);
      }

      expect(chunks).toEqual(["El Duomo fue ", "construido en 1436."]);

      // Verify conversation context is passed
      const messages = mockCreate.mock.calls[0][0].messages;
      expect(messages[0].content).toBe("Sos un guía");
      expect(messages[1].content).toBe("¿Qué es eso?");
      expect(messages[2].content).toBe("Es la Catedral de Florencia.");
      expect(messages[3].content).toBe("Contame más sobre el Duomo");
    });
  });
});
