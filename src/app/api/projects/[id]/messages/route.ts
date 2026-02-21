import { NextResponse } from "next/server";
import { getMessagesByProject } from "@/lib/db/queries/messages";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "userId es requerido" },
        },
        { status: 400 }
      );
    }

    const messages = await getMessagesByProject(
      parseInt(id),
      parseInt(userId)
    );

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "MESSAGES_FETCH_ERROR", message: "Error al obtener mensajes" },
      },
      { status: 500 }
    );
  }
}
