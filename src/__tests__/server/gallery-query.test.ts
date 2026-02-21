/**
 * Epic 6 — Story 6.2: Gallery Query Logic
 * Verifies gallery returns ALL users' photos with descriptions, geo data,
 * and correctly associates assistant descriptions with user photos.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-gallery.db");

describe("Epic 6 — Gallery Query", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const dir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    sqlite = new Database(TEST_DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    db = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE project_members (project_id INTEGER NOT NULL, user_id INTEGER NOT NULL);
      CREATE TABLE conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, role TEXT NOT NULL, content_text TEXT, image_url TEXT, audio_url TEXT, tts_audio_url TEXT, latitude REAL, longitude REAL, created_at TEXT NOT NULL);
      CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, photographer_user_id INTEGER NOT NULL, system_prompt TEXT NOT NULL, ambient_music_enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    `);

    const now = new Date().toISOString();
    // 2 users
    db.insert(schema.users).values({ name: "Pedro", createdAt: now }).run();
    db.insert(schema.users).values({ name: "María", createdAt: now }).run();
    // 1 project
    db.insert(schema.projects).values({ name: "Florencia", createdAt: now }).run();
    // 2 conversations (one per user)
    db.insert(schema.conversations).values({ projectId: 1, userId: 1, createdAt: now }).run();
    db.insert(schema.conversations).values({ projectId: 1, userId: 2, createdAt: now }).run();

    // Pedro's photo with geo + assistant response
    db.insert(schema.messages)
      .values({
        conversationId: 1,
        role: "user",
        imageUrl: "/api/photos/1/pedro1.webp",
        latitude: 43.77,
        longitude: 11.25,
        createdAt: "2026-02-20T10:00:00Z",
      })
      .run();
    db.insert(schema.messages)
      .values({
        conversationId: 1,
        role: "assistant",
        contentText: "Esta es la Catedral de Santa María del Fiore...",
        createdAt: "2026-02-20T10:00:05Z",
      })
      .run();

    // Pedro's photo WITHOUT geo
    db.insert(schema.messages)
      .values({
        conversationId: 1,
        role: "user",
        imageUrl: "/api/photos/1/pedro2.webp",
        latitude: null,
        longitude: null,
        createdAt: "2026-02-20T10:05:00Z",
      })
      .run();
    db.insert(schema.messages)
      .values({
        conversationId: 1,
        role: "assistant",
        contentText: "Interior del Battistero...",
        createdAt: "2026-02-20T10:05:05Z",
      })
      .run();

    // María's photo with geo (solo mode contributes to shared gallery)
    db.insert(schema.messages)
      .values({
        conversationId: 2,
        role: "user",
        imageUrl: "/api/photos/1/maria1.webp",
        latitude: 43.768,
        longitude: 11.254,
        createdAt: "2026-02-20T11:00:00Z",
      })
      .run();
    db.insert(schema.messages)
      .values({
        conversationId: 2,
        role: "assistant",
        contentText: "El David de Miguel Ángel...",
        createdAt: "2026-02-20T11:00:05Z",
      })
      .run();

    // Text-only message from Pedro (no photo — should NOT appear in gallery)
    db.insert(schema.messages)
      .values({
        conversationId: 1,
        role: "user",
        contentText: "Contame más sobre el Duomo",
        createdAt: "2026-02-20T10:10:00Z",
      })
      .run();
  });

  afterAll(() => {
    sqlite.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  /**
   * Replicate gallery/route.ts logic for testing
   */
  function getGalleryPhotos(projectId: number) {
    const projectConversations = db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.projectId, projectId))
      .all();

    const allUsers = db.select().from(schema.users).all();
    const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

    const photos: Array<{
      id: number;
      imageUrl: string | null;
      contentText: string | null;
      latitude: number | null;
      longitude: number | null;
      createdAt: string;
      userId: number | undefined;
      userName: string | null;
    }> = [];

    for (const conv of projectConversations) {
      const convMessages = db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conv.id))
        .orderBy(schema.messages.createdAt)
        .all();

      for (let i = 0; i < convMessages.length; i++) {
        const msg = convMessages[i];
        if (msg.imageUrl === null) continue;

        let description: string | null = null;
        if (i + 1 < convMessages.length && convMessages[i + 1].role === "assistant") {
          description = convMessages[i + 1].contentText;
        }

        photos.push({
          id: msg.id,
          imageUrl: msg.imageUrl,
          contentText: description,
          latitude: msg.latitude,
          longitude: msg.longitude,
          createdAt: msg.createdAt,
          userId: conv.userId,
          userName: userMap.get(conv.userId) ?? null,
        });
      }
    }

    photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return photos;
  }

  describe("Story 6.2 AC: gallery shows ALL project photos from ALL users", () => {
    it("returns 3 photos total (2 Pedro + 1 María)", () => {
      const photos = getGalleryPhotos(1);
      expect(photos).toHaveLength(3);
    });

    it("includes photos from both Pedro and María", () => {
      const photos = getGalleryPhotos(1);
      const userNames = [...new Set(photos.map((p) => p.userName))].sort();
      expect(userNames).toEqual(["María", "Pedro"]);
    });

    it("excludes text-only messages (no imageUrl)", () => {
      const photos = getGalleryPhotos(1);
      expect(photos.every((p) => p.imageUrl !== null)).toBe(true);
    });
  });

  describe("Story 6.2 AC: each photo shows user name and date", () => {
    it("every photo has a userName and createdAt", () => {
      const photos = getGalleryPhotos(1);
      for (const photo of photos) {
        expect(photo.userName).toBeTruthy();
        expect(photo.createdAt).toBeTruthy();
      }
    });
  });

  describe("Story 6.2 AC: tapping photo shows AI description", () => {
    it("each photo with a following assistant message has a description", () => {
      const photos = getGalleryPhotos(1);
      // All 3 photos have assistant responses following them
      expect(photos.every((p) => p.contentText !== null)).toBe(true);
      expect(photos.find((p) => p.imageUrl?.includes("maria1"))?.contentText).toContain("David");
    });
  });

  describe("Story 6.3 AC: map shows only photos WITH geolocation", () => {
    it("filters to photos with latitude and longitude for map view", () => {
      const photos = getGalleryPhotos(1);
      const photosWithGeo = photos.filter(
        (p) => p.latitude !== null && p.longitude !== null
      );
      expect(photosWithGeo).toHaveLength(2); // Pedro's first + María's
      expect(photosWithGeo.every((p) => p.latitude !== null)).toBe(true);
    });

    it("photos without geo still appear in gallery (all 3)", () => {
      const photos = getGalleryPhotos(1);
      expect(photos).toHaveLength(3);
    });
  });

  describe("Story 6.2 AC: photos sorted by date descending (newest first)", () => {
    it("returns most recent photo first", () => {
      const photos = getGalleryPhotos(1);
      expect(photos[0].userName).toBe("María"); // 11:00 is latest
      for (let i = 1; i < photos.length; i++) {
        expect(new Date(photos[i].createdAt).getTime())
          .toBeLessThanOrEqual(new Date(photos[i - 1].createdAt).getTime());
      }
    });
  });
});
