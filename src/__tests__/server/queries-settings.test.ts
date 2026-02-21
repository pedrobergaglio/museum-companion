/**
 * Epic 1 & Epic 7 — Settings Queries
 * Verifies settings CRUD: system prompt, photographer, ambient music toggle.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-settings.db");

describe("Epic 1 & 7 — Settings Queries", () => {
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
      CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, photographer_user_id INTEGER NOT NULL, system_prompt TEXT NOT NULL, ambient_music_enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    `);

    const now = new Date().toISOString();
    db.insert(schema.users).values({ name: "Pedro", createdAt: now }).run();
    db.insert(schema.settings)
      .values({
        photographerUserId: 1,
        systemPrompt: "Sos un guía de museo experto.",
        ambientMusicEnabled: false,
        updatedAt: now,
      })
      .run();
  });

  afterAll(() => {
    sqlite.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  describe("Story 1.1 AC: getSettings returns default settings", () => {
    it("returns settings with system prompt and photographer", () => {
      const settings = db.select().from(schema.settings).get();
      expect(settings).toBeDefined();
      expect(settings!.photographerUserId).toBe(1);
      expect(settings!.systemPrompt).toContain("guía de museo");
    });
  });

  describe("Epic 7 AC: update system prompt", () => {
    it("updates system prompt via settings update", () => {
      const current = db.select().from(schema.settings).get()!;

      db.update(schema.settings)
        .set({
          systemPrompt: "Sos un historiador del arte renacentista.",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.settings.id, current.id))
        .run();

      const updated = db.select().from(schema.settings).get()!;
      expect(updated.systemPrompt).toContain("historiador del arte");
    });
  });

  describe("Epic 2 AC: toggle ambient music", () => {
    it("enables ambient music", () => {
      const current = db.select().from(schema.settings).get()!;
      expect(current.ambientMusicEnabled).toBe(false);

      db.update(schema.settings)
        .set({ ambientMusicEnabled: true, updatedAt: new Date().toISOString() })
        .where(eq(schema.settings.id, current.id))
        .run();

      const updated = db.select().from(schema.settings).get()!;
      expect(updated.ambientMusicEnabled).toBe(true);
    });

    it("disables ambient music", () => {
      const current = db.select().from(schema.settings).get()!;

      db.update(schema.settings)
        .set({ ambientMusicEnabled: false, updatedAt: new Date().toISOString() })
        .where(eq(schema.settings.id, current.id))
        .run();

      const updated = db.select().from(schema.settings).get()!;
      expect(updated.ambientMusicEnabled).toBe(false);
    });
  });

  describe("Story 4.3 AC: change photographer", () => {
    it("updates photographer user ID", () => {
      const now = new Date().toISOString();
      db.insert(schema.users).values({ name: "María", createdAt: now }).run();

      const current = db.select().from(schema.settings).get()!;
      db.update(schema.settings)
        .set({ photographerUserId: 2, updatedAt: now })
        .where(eq(schema.settings.id, current.id))
        .run();

      const updated = db.select().from(schema.settings).get()!;
      expect(updated.photographerUserId).toBe(2);
    });
  });
});
