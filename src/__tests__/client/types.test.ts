/**
 * Cross-Epic — Type Definitions
 * Verifies all required type interfaces exist and have correct shapes.
 */
import { describe, it, expect } from "vitest";
import type {
  User,
  Project,
  Message,
  Settings,
  CapturePayload,
  MessagePayload,
  NewCaptureEvent,
  TextStreamEvent,
  TtsReadyEvent,
  PhotographerChangedEvent,
} from "@/types";

describe("Cross-Epic — Type Definitions", () => {
  describe("Epic 1: Core data types", () => {
    it("User type has id, name, createdAt", () => {
      const user: User = { id: 1, name: "Pedro", createdAt: "2026-01-01" };
      expect(user.id).toBe(1);
      expect(user.name).toBe("Pedro");
    });

    it("Project type has id, name, createdAt", () => {
      const project: Project = { id: 1, name: "Florencia", createdAt: "2026-01-01" };
      expect(project.name).toBe("Florencia");
    });

    it("Message type includes geo and audio fields", () => {
      const msg: Message = {
        id: 1,
        conversationId: 1,
        role: "user",
        contentText: null,
        imageUrl: "/photo.webp",
        audioUrl: null,
        ttsAudioUrl: null,
        latitude: 43.77,
        longitude: 11.25,
        createdAt: "2026-01-01",
      };
      expect(msg.latitude).toBe(43.77);
      expect(msg.ttsAudioUrl).toBeNull();
    });

    it("Settings type includes photographer, prompt, and ambient music", () => {
      const settings: Settings = {
        id: 1,
        photographerUserId: 1,
        systemPrompt: "Sos un guía de museo",
        ambientMusicEnabled: false,
        updatedAt: "2026-01-01",
      };
      expect(settings.systemPrompt).toContain("guía");
    });
  });

  describe("Epic 1: API payload types", () => {
    it("CapturePayload includes optional geo and audio fields", () => {
      // Type-check only — if this compiles, the types are correct
      const payload: CapturePayload = {
        projectId: 1,
        userId: 1,
        image: new File([""], "test.webp"),
        latitude: 43.77,
        longitude: 11.25,
      };
      expect(payload.projectId).toBe(1);
      expect(payload.latitude).toBe(43.77);
    });

    it("MessagePayload has text and optional audio", () => {
      const payload: MessagePayload = {
        projectId: 1,
        userId: 1,
        text: "¿Qué es esto?",
      };
      expect(payload.text).toBe("¿Qué es esto?");
    });
  });

  describe("Epic 4: Socket.IO event types", () => {
    it("NewCaptureEvent includes geo coordinates", () => {
      const event: NewCaptureEvent = {
        messageId: 1,
        imageUrl: "/photo.webp",
        projectId: 1,
        userId: 1,
        latitude: 43.77,
        longitude: null,
      };
      expect(event.latitude).toBe(43.77);
    });

    it("TextStreamEvent has delta, done flag, userId, and optional full text", () => {
      const event: TextStreamEvent = {
        messageId: 1,
        delta: "Esta ",
        done: false,
        userId: 1,
      };
      expect(event.done).toBe(false);
      expect(event.userId).toBe(1);

      const doneEvent: TextStreamEvent = {
        messageId: 1,
        delta: "",
        done: true,
        fullText: "Esta es la Catedral",
        assistantMessageId: 2,
        userId: 1,
      };
      expect(doneEvent.done).toBe(true);
      expect(doneEvent.fullText).toContain("Catedral");
    });

    it("TtsReadyEvent has audioUrl", () => {
      const event: TtsReadyEvent = {
        messageId: 2,
        audioUrl: "/api/audio/1/2.mp3",
        userId: 1,
      };
      expect(event.audioUrl).toContain("audio");
    });

    it("PhotographerChangedEvent has userId and userName", () => {
      const event: PhotographerChangedEvent = {
        userId: 2,
        userName: "María",
      };
      expect(event.userName).toBe("María");
    });
  });
});
