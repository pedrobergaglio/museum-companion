/**
 * Epic 1 — Story 1.3, 1.4: Project Store
 * Verifies project selection, message management, streaming state.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProjectStore } from "@/stores/project-store";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("Epic 1 — Project Store", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useProjectStore.setState({
      activeProject: null,
      projects: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingText: "",
      streamingMessageId: null,
    });
  });

  describe("Story 1.3 AC: selecting project saves to localStorage", () => {
    it("setActiveProject stores in state and localStorage", () => {
      const project = { id: 1, name: "Florencia", createdAt: "2026-01-01" };
      useProjectStore.getState().setActiveProject(project);

      expect(useProjectStore.getState().activeProject).toEqual(project);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "museum-companion-project",
        JSON.stringify(project)
      );
    });
  });

  describe("Story 1.3 AC: loadFromStorage restores active project", () => {
    it("restores project from localStorage on app reload", () => {
      const project = { id: 2, name: "Roma", createdAt: "2026-01-01" };
      localStorageMock.setItem("museum-companion-project", JSON.stringify(project));

      useProjectStore.getState().loadFromStorage();
      expect(useProjectStore.getState().activeProject).toEqual(project);
    });
  });

  describe("Story 1.4 AC: messages management", () => {
    it("addMessage appends to messages array", () => {
      const msg = {
        id: 1,
        conversationId: 1,
        role: "user" as const,
        contentText: null,
        imageUrl: "/api/photos/1/test.webp",
        audioUrl: null,
        ttsAudioUrl: null,
        latitude: 43.77,
        longitude: 11.25,
        createdAt: "2026-01-01T10:00:00Z",
      };

      useProjectStore.getState().addMessage(msg);
      expect(useProjectStore.getState().messages).toHaveLength(1);
      expect(useProjectStore.getState().messages[0].imageUrl).toBe("/api/photos/1/test.webp");
    });

    it("updateMessageTtsUrl updates ttsAudioUrl on specific message", () => {
      const msg = {
        id: 42,
        conversationId: 1,
        role: "assistant" as const,
        contentText: "Description",
        imageUrl: null,
        audioUrl: null,
        ttsAudioUrl: null,
        latitude: null,
        longitude: null,
        createdAt: "2026-01-01T10:00:00Z",
      };

      useProjectStore.getState().addMessage(msg);
      useProjectStore.getState().updateMessageTtsUrl(42, "/api/audio/1/42.mp3");

      const updated = useProjectStore.getState().messages.find((m) => m.id === 42);
      expect(updated?.ttsAudioUrl).toBe("/api/audio/1/42.mp3");
    });
  });

  describe("Story 1.4 AC: streaming state for real-time text", () => {
    it("setStreaming toggles isStreaming flag", () => {
      useProjectStore.getState().setStreaming(true);
      expect(useProjectStore.getState().isStreaming).toBe(true);

      useProjectStore.getState().setStreaming(false);
      expect(useProjectStore.getState().isStreaming).toBe(false);
    });

    it("appendStreamingText accumulates deltas", () => {
      useProjectStore.getState().setStreamingText("");
      useProjectStore.getState().appendStreamingText("Esta ");
      useProjectStore.getState().appendStreamingText("es la ");
      useProjectStore.getState().appendStreamingText("Catedral");

      expect(useProjectStore.getState().streamingText).toBe("Esta es la Catedral");
    });

    it("setStreamingText resets streaming buffer", () => {
      useProjectStore.getState().appendStreamingText("Some text");
      useProjectStore.getState().setStreamingText("");
      expect(useProjectStore.getState().streamingText).toBe("");
    });
  });

  describe("Story 1.3 AC: fetchProjects from API", () => {
    it("populates projects from API response", async () => {
      const mockProjects = [
        { id: 1, name: "Florencia", createdAt: "2026-01-01" },
        { id: 2, name: "Roma", createdAt: "2026-01-02" },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockProjects }),
      });

      await useProjectStore.getState().fetchProjects();
      expect(useProjectStore.getState().projects).toHaveLength(2);
      expect(useProjectStore.getState().projects[0].name).toBe("Florencia");
    });
  });

  describe("Story 1.4 AC: fetchMessages for project+user", () => {
    it("loads conversation messages for active project", async () => {
      const mockMessages = [
        {
          id: 1, conversationId: 1, role: "user",
          contentText: null, imageUrl: "/photo.webp",
          audioUrl: null, ttsAudioUrl: null,
          latitude: 43.77, longitude: 11.25,
          createdAt: "2026-01-01",
        },
        {
          id: 2, conversationId: 1, role: "assistant",
          contentText: "La Catedral...", imageUrl: null,
          audioUrl: null, ttsAudioUrl: "/api/audio/1/2.mp3",
          latitude: null, longitude: null,
          createdAt: "2026-01-01",
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockMessages }),
      });

      await useProjectStore.getState().fetchMessages(1, 1);
      expect(useProjectStore.getState().messages).toHaveLength(2);
      expect(useProjectStore.getState().messages[1].ttsAudioUrl).toBe("/api/audio/1/2.mp3");
    });
  });
});
