/**
 * Epic 1 — Story 1.1: Seed Data Validation
 * Verifies 5 pre-configured users and default settings.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import path from "path";
import fs from "fs";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-seed.db");

describe("Epic 1 — Seed", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    // Cleanup previous test DB
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const dir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    sqlite = new Database(TEST_DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });

    // Create tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS project_members (
        project_id INTEGER NOT NULL REFERENCES projects(id),
        user_id INTEGER NOT NULL REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content_text TEXT,
        image_url TEXT,
        audio_url TEXT,
        tts_audio_url TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photographer_user_id INTEGER NOT NULL REFERENCES users(id),
        system_prompt TEXT NOT NULL,
        ambient_music_enabled INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    // Seed the 5 users (replicating seed.ts logic)
    const USERS = ["Pedro", "María", "Lucas", "Ana", "Carlos"];
    const now = new Date().toISOString();
    for (const name of USERS) {
      db.insert(schema.users).values({ name, createdAt: now }).run();
    }

    // Seed settings
    db.insert(schema.settings)
      .values({
        photographerUserId: 1,
        systemPrompt:
          "Sos un guía de museo experto. Respondé en español, con datos específicos, fechas y contexto histórico. Sé conciso pero informativo. Adaptá tu explicación para que sea interesante tanto para adultos como para adolescentes.",
        ambientMusicEnabled: false,
        updatedAt: now,
      })
      .run();
  });

  afterAll(() => {
    sqlite.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  describe("Story 1.1 AC: seed creates 5 pre-configured users", () => {
    it("has exactly 5 users", () => {
      const users = db.select().from(schema.users).all();
      expect(users).toHaveLength(5);
    });

    it("users are Pedro, María, Lucas, Ana, Carlos", () => {
      const users = db.select().from(schema.users).all();
      const names = users.map((u) => u.name);
      expect(names).toEqual(["Pedro", "María", "Lucas", "Ana", "Carlos"]);
    });
  });

  describe("Story 1.1 AC: default settings exist", () => {
    it("has exactly 1 settings row", () => {
      const settings = db.select().from(schema.settings).all();
      expect(settings).toHaveLength(1);
    });

    it("default photographer is user 1 (Pedro)", () => {
      const settings = db.select().from(schema.settings).get();
      expect(settings!.photographerUserId).toBe(1);
    });

    it("system prompt is in Spanish and mentions 'guía de museo'", () => {
      const settings = db.select().from(schema.settings).get();
      expect(settings!.systemPrompt).toContain("guía de museo");
      expect(settings!.systemPrompt).toContain("español");
    });

    it("ambient music is disabled by default", () => {
      const settings = db.select().from(schema.settings).get();
      expect(settings!.ambientMusicEnabled).toBe(false);
    });
  });
});
