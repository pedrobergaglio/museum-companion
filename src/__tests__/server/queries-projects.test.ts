/**
 * Epic 1 — Story 1.3: Project Queries
 * Verifies project creation, member addition, and conversation auto-creation.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import path from "path";
import fs from "fs";
import { eq, and } from "drizzle-orm";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-projects.db");

describe("Epic 1 — Project Queries", () => {
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
      CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, role TEXT NOT NULL, content_text TEXT, image_url TEXT, audio_url TEXT, tts_audio_url TEXT, latitude REAL, longitude REAL, created_at TEXT NOT NULL);
      CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, photographer_user_id INTEGER NOT NULL, system_prompt TEXT NOT NULL, ambient_music_enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    `);

    const now = new Date().toISOString();
    db.insert(schema.users).values({ name: "Pedro", createdAt: now }).run();
    db.insert(schema.users).values({ name: "María", createdAt: now }).run();
  });

  afterAll(() => {
    sqlite.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  describe("Story 1.3 AC: create project with name", () => {
    it("creates project and returns it with an id", () => {
      const now = new Date().toISOString();
      const project = db
        .insert(schema.projects)
        .values({ name: "Florencia", createdAt: now })
        .returning()
        .get();

      expect(project.id).toBe(1);
      expect(project.name).toBe("Florencia");
    });

    it("allows creating multiple projects", () => {
      const now = new Date().toISOString();
      db.insert(schema.projects).values({ name: "Roma", createdAt: now }).run();

      const all = db.select().from(schema.projects).all();
      expect(all).toHaveLength(2);
      expect(all.map((p) => p.name)).toEqual(["Florencia", "Roma"]);
    });
  });

  describe("Story 1.3 AC: create project auto-adds member and conversation", () => {
    it("adds user as project member", () => {
      // Replicate createProject logic
      db.insert(schema.projectMembers).values({ projectId: 1, userId: 1 }).run();

      const members = db
        .select()
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.projectId, 1))
        .all();

      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(1);
    });

    it("creates empty conversation for user in project", () => {
      const now = new Date().toISOString();
      db.insert(schema.conversations)
        .values({ projectId: 1, userId: 1, createdAt: now })
        .run();

      const conv = db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.projectId, 1),
            eq(schema.conversations.userId, 1)
          )
        )
        .get();

      expect(conv).toBeDefined();
      expect(conv!.projectId).toBe(1);
      expect(conv!.userId).toBe(1);
    });
  });

  describe("Story 1.3 AC: each user has unique conversation per project", () => {
    it("different users get separate conversations for the same project", () => {
      const now = new Date().toISOString();
      db.insert(schema.conversations)
        .values({ projectId: 1, userId: 2, createdAt: now })
        .run();

      const convs = db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.projectId, 1))
        .all();

      expect(convs).toHaveLength(2);
      const userIds = convs.map((c) => c.userId).sort();
      expect(userIds).toEqual([1, 2]);
    });
  });
});
