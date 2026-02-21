import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { messages, conversations } from "../schema";

export async function getOrCreateConversation(projectId: number, userId: number) {
  const existing = db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.projectId, projectId),
        eq(conversations.userId, userId)
      )
    )
    .get();

  if (existing) return existing;

  const result = db
    .insert(conversations)
    .values({
      projectId,
      userId,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  return result;
}

export async function getConversationMessages(conversationId: number) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .all();
}

export async function createMessage(data: {
  conversationId: number;
  role: "user" | "assistant";
  contentText?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  ttsAudioUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return db
    .insert(messages)
    .values({
      conversationId: data.conversationId,
      role: data.role,
      contentText: data.contentText ?? null,
      imageUrl: data.imageUrl ?? null,
      audioUrl: data.audioUrl ?? null,
      ttsAudioUrl: data.ttsAudioUrl ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

export async function updateMessageText(messageId: number, contentText: string) {
  return db
    .update(messages)
    .set({ contentText })
    .where(eq(messages.id, messageId))
    .run();
}

export async function updateMessageTtsUrl(messageId: number, ttsAudioUrl: string) {
  return db
    .update(messages)
    .set({ ttsAudioUrl })
    .where(eq(messages.id, messageId))
    .run();
}

export async function getMessagesByProject(projectId: number, userId: number) {
  const conversation = db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.projectId, projectId),
        eq(conversations.userId, userId)
      )
    )
    .get();

  if (!conversation) return [];

  return getConversationMessages(conversation.id);
}
