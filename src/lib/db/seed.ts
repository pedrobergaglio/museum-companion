import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), "data", "museum-companion.db");

// Asegurar que el directorio data/ exista
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

const PRECONFIGURED_USERS = ["Pedro", "Hernan", "Leticia", "Ana", "Juan"];

const DEFAULT_SYSTEM_PROMPT =
  "Sos un guía de museo experto. Respondé en español, con datos específicos, fechas y contexto histórico. Sé conciso pero informativo. Adaptá tu explicación para que sea interesante tanto para adultos como para adolescentes.";

async function seed() {
  console.log("🌱 Seeding database...");

  // Aplicar migraciones de Drizzle (crea tablas si no existen, aplica cambios de schema)
  const migrationsPath = path.join(process.cwd(), "drizzle", "migrations");
  try {
    migrate(db, { migrationsFolder: migrationsPath });
    console.log("📦 Migrations applied");
  } catch (err: unknown) {
    // If tables already exist, that's fine — continue with seeding
    const errStr = String(err);
    const causeStr = (err as { cause?: unknown })?.cause ? String((err as { cause?: unknown }).cause) : "";
    if (errStr.includes("already exists") || causeStr.includes("already exists")) {
      console.log("📦 Tables already exist, skipping migrations");
    } else {
      throw err;
    }
  }

  // Check if users already exist
  const existingUsers = db.select().from(schema.users).all();
  if (existingUsers.length > 0) {
    // Update existing user names to match current configuration
    let updated = false;
    const updateStmt = sqlite.prepare("UPDATE users SET name = ? WHERE id = ?");
    for (let i = 0; i < Math.min(existingUsers.length, PRECONFIGURED_USERS.length); i++) {
      if (existingUsers[i].name !== PRECONFIGURED_USERS[i]) {
        updateStmt.run(PRECONFIGURED_USERS[i], existingUsers[i].id);
        updated = true;
      }
    }
    if (updated) {
      console.log(`✅ Updated user names: ${PRECONFIGURED_USERS.join(", ")}`);
    } else {
      console.log("✅ Database already seeded, skipping.");
    }
    return;
  }

  // Seed users
  const now = new Date().toISOString();
  for (const name of PRECONFIGURED_USERS) {
    db.insert(schema.users).values({ name, createdAt: now }).run();
  }
  console.log(`👥 Created ${PRECONFIGURED_USERS.length} users: ${PRECONFIGURED_USERS.join(", ")}`);

  // Seed default settings (Pedro as default photographer)
  db.insert(schema.settings)
    .values({
      photographerUserId: 1,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      ambientMusicEnabled: false,
      updatedAt: now,
    })
    .run();
  console.log("⚙️ Created default settings (photographer: Pedro)");

  console.log("✅ Seed complete!");
}

seed().catch(console.error);
