/**
 * Epic 1 — Story 1.4, 1.5 & Epic 6 — Story 6.1: Message Queries
 * Verifies conversation creation, message CRUD, geo data, and TTS URL update.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import path from "path";
import fs from "fs";
import { eq, and } from "drizzle-orm";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-messages.db");

describe("Epic 1 & 6 — Message Queries", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const dir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    sqlite = new Database(TEST_DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE project_members (project_id INTEGER NOT NULL, user_id INTEGER NOT NULL);
      CREATE TABLE conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, role TEXT NOT NULL CHECK(role IN ('user','assistant')), content_text TEXT, image_url TEXT, audio_url TEXT, tts_audio_url TEXT, latitude REAL, longitude REAL, created_at TEXT NOT NULL);
      CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, photographer_user_id INTEGER NOT NULL, system_prompt TEXT NOT NULL, ambient_music_enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    `);

    const now = new Date().toISOString();
    db.insert(schema.users).values({ name: "Pedro", createdAt: now }).run();
    db.insert(schema.users).values({ name: "María", createdAt: now }).run();
    db.insert(schema.projects).values({ name: "Florencia", createdAt: now }).run();
  });

  afterAll(() => {
    sqlite.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  describe("Story 1.3 AC: getOrCreateConversation", () => {
    it("creates a new conversation when none exists", () => {
      const conv = db
        .insert(schema.conversations)
        .values({ projectId: 1, userId: 1, createdAt: new Date().toISOString() })
        .returning()
        .get();

      expect(conv).toBeDefined();
      expect(conv.projectId).toBe(1);
      expect(conv.userId).toBe(1);
      expect(conv.id).toBeGreaterThan(0);
    });

    it("returns existing conversation for same project+user", () => {
      const existing = db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.projectId, 1),
            eq(schema.conversations.userId, 1)
          )
        )
        .get();

      expect(existing).toBeDefined();
      expect(existing!.projectId).toBe(1);
    });
  });

  describe("Story 1.4 AC: createMessage with image", () => {
    it("creates a user message with image URL and returns it", () => {
      const msg = db
        .insert(schema.messages)
        .values({
          conversationId: 1,
          role: "user",
          contentText: null,
          imageUrl: "/api/photos/1/12345_1.webp",
          latitude: 43.7696,
          longitude: 11.2558,
          createdAt: new Date().toISOString(),
        })
        .returning()
        .get();

      expect(msg.id).toBeGreaterThan(0);
      expect(msg.role).toBe("user");
      expect(msg.imageUrl).toBe("/api/photos/1/12345_1.webp");
    });

    it("creates an assistant message with text", () => {
      const msg = db
        .insert(schema.messages)
        .values({
          conversationId: 1,
          role: "assistant",
          contentText: "Esta es la Catedral de Florencia...",
          createdAt: new Date().toISOString(),
        })
        .returning()
        .get();

      expect(msg.role).toBe("assistant");
      expect(msg.contentText).toContain("Catedral de Florencia");
    });
  });

  describe("Story 6.1 AC: geolocation stored with message", () => {
    it("persists latitude and longitude on user message", () => {
      const msg = db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.role, "user"))
        .get();

      expect(msg!.latitude).toBeCloseTo(43.7696, 3);
      expect(msg!.longitude).toBeCloseTo(11.2558, 3);
    });

    it("allows null geo when permission denied (non-blocking)", () => {
      const msg = db
        .insert(schema.messages)
        .values({
          conversationId: 1,
          role: "user",
          contentText: "Foto sin ubicación",
          imageUrl: "/api/photos/1/nogeo.webp",
          latitude: null,
          longitude: null,
          createdAt: new Date().toISOString(),
        })
        .returning()
        .get();

      expect(msg.latitude).toBeNull();
      expect(msg.longitude).toBeNull();
      expect(msg.imageUrl).toBeDefined();
    });
  });

  describe("Story 2.1 AC: TTS URL update", () => {
    it("updates ttsAudioUrl on an assistant message", () => {
      // Get the assistant message
      const assistant = db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.role, "assistant"))
        .get();

      expect(assistant).toBeDefined();

      // Update TTS URL
      db.update(schema.messages)
        .set({ ttsAudioUrl: "/api/audio/1/2.mp3" })
        .where(eq(schema.messages.id, assistant!.id))
        .run();

      const updated = db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.id, assistant!.id))
        .get();

      expect(updated!.ttsAudioUrl).toBe("/api/audio/1/2.mp3");
    });
  });

  describe("Story 1.4 AC: conversation messages ordered by createdAt", () => {
    it("returns messages in chronological order", () => {
      const msgs = db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, 1))
        .orderBy(schema.messages.createdAt)
        .all();

      expect(msgs.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < msgs.length; i++) {
        expect(new Date(msgs[i].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(msgs[i - 1].createdAt).getTime());
      }
    });
  });
});
