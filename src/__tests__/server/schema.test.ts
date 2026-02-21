/**
 * Epic 1 — Story 1.1: DB Schema Validation
 * Verifies all 6 required tables with correct columns exist in the Drizzle schema.
 */
import { describe, it, expect } from "vitest";
import * as schema from "@/lib/db/schema";

describe("Epic 1 — DB Schema", () => {
  describe("Story 1.1 AC: schema includes tables users, projects, project_members, conversations, messages, settings", () => {
    it("exports users table with required columns", () => {
      expect(schema.users).toBeDefined();
      const cols = Object.keys(schema.users);
      // Drizzle table objects expose column names
      expect(cols).toContain("id");
      expect(cols).toContain("name");
      expect(cols).toContain("createdAt");
    });

    it("exports projects table with required columns", () => {
      expect(schema.projects).toBeDefined();
      const cols = Object.keys(schema.projects);
      expect(cols).toContain("id");
      expect(cols).toContain("name");
      expect(cols).toContain("createdAt");
    });

    it("exports projectMembers table with foreign keys", () => {
      expect(schema.projectMembers).toBeDefined();
      const cols = Object.keys(schema.projectMembers);
      expect(cols).toContain("projectId");
      expect(cols).toContain("userId");
    });

    it("exports conversations table with project and user references", () => {
      expect(schema.conversations).toBeDefined();
      const cols = Object.keys(schema.conversations);
      expect(cols).toContain("id");
      expect(cols).toContain("projectId");
      expect(cols).toContain("userId");
      expect(cols).toContain("createdAt");
    });

    it("exports messages table with all required columns including geo and audio", () => {
      expect(schema.messages).toBeDefined();
      const cols = Object.keys(schema.messages);
      expect(cols).toContain("id");
      expect(cols).toContain("conversationId");
      expect(cols).toContain("role");
      expect(cols).toContain("contentText");
      expect(cols).toContain("imageUrl");
      expect(cols).toContain("audioUrl");
      expect(cols).toContain("ttsAudioUrl");
      expect(cols).toContain("latitude");
      expect(cols).toContain("longitude");
      expect(cols).toContain("createdAt");
    });

    it("exports settings table with photographer, prompt, and ambient music", () => {
      expect(schema.settings).toBeDefined();
      const cols = Object.keys(schema.settings);
      expect(cols).toContain("id");
      expect(cols).toContain("photographerUserId");
      expect(cols).toContain("systemPrompt");
      expect(cols).toContain("ambientMusicEnabled");
      expect(cols).toContain("updatedAt");
    });
  });

  describe("Story 1.1 AC: messages.role is enum user/assistant", () => {
    it("role column has enum constraint with user and assistant", () => {
      // Access the column config — Drizzle stores enum values
      const roleCol = schema.messages.role;
      expect(roleCol).toBeDefined();
      // The column config should have enumValues
      expect(roleCol.enumValues).toEqual(["user", "assistant"]);
    });
  });
});
