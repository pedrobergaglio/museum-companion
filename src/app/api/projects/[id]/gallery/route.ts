import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, conversations, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    // Obtener todas las conversaciones del proyecto
    const projectConversations = db
      .select()
      .from(conversations)
      .where(eq(conversations.projectId, projectId))
      .all();

    const conversationIds = projectConversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Obtener todos los usuarios para mapear nombres
    const allUsers = db.select().from(users).all();
    const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

    // Build conversation → userId map
    const convUserMap = new Map(projectConversations.map((c) => [c.id, c.userId]));

    // H4 Fix: Single query with IN clause instead of N+1 loop
    const allMessages = db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(messages.conversationId, messages.createdAt)
      .all();

    // Group messages by conversation for pairing photos with descriptions
    const messagesByConv = new Map<number, typeof allMessages>();
    for (const msg of allMessages) {
      const group = messagesByConv.get(msg.conversationId) || [];
      group.push(msg);
      messagesByConv.set(msg.conversationId, group);
    }

    const photos = [];
    for (const [convId, convMessages] of messagesByConv) {
      const userId = convUserMap.get(convId);

      for (let i = 0; i < convMessages.length; i++) {
        const msg = convMessages[i];
        if (msg.imageUrl === null) continue;

        // Buscar la respuesta del assistant inmediatamente despues
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
          userId,
          userName: userId ? userMap.get(userId) ?? null : null,
        });
      }
    }

    // Ordenar por fecha descendente (mas recientes primero)
    photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "GALLERY_FETCH_ERROR", message: "Error al obtener la galería" },
      },
      { status: 500 }
    );
  }
}
