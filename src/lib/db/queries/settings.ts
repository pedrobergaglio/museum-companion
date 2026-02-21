import { eq } from "drizzle-orm";
import { db } from "../index";
import { settings, users } from "../schema";

export async function getSettings() {
  const result = db.select().from(settings).get();

  if (!result) {
    // Crear settings por defecto si no existen
    const defaultSettings = db
      .insert(settings)
      .values({
        photographerUserId: 1,
        systemPrompt:
          "Sos un guía de museo experto. Respondé en español, con datos específicos, fechas y contexto histórico. Sé conciso pero informativo. Adaptá tu explicación para que sea interesante tanto para adultos como para adolescentes.",
        ambientMusicEnabled: false,
        updatedAt: new Date().toISOString(),
      })
      .returning()
      .get();
    return defaultSettings;
  }

  return result;
}

export async function updateSettings(data: {
  photographerUserId?: number;
  systemPrompt?: string;
  ambientMusicEnabled?: boolean;
}) {
  const current = await getSettings();

  return db
    .update(settings)
    .set({
      ...(data.photographerUserId !== undefined && {
        photographerUserId: data.photographerUserId,
      }),
      ...(data.systemPrompt !== undefined && {
        systemPrompt: data.systemPrompt,
      }),
      ...(data.ambientMusicEnabled !== undefined && {
        ambientMusicEnabled: data.ambientMusicEnabled,
      }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(settings.id, current.id))
    .returning()
    .get();
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(users.id).all();
}
