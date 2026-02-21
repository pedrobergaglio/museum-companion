import { NextResponse } from "next/server";
import { getSettings, updateSettings, getAllUsers } from "@/lib/db/queries/settings";
import { broadcastPhotographerChanged, getIO } from "@/lib/socket/server";

export async function GET() {
  try {
    const settings = await getSettings();
    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      data: { settings, users },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SETTINGS_FETCH_ERROR", message: "Error al obtener la configuración" },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const previousSettings = await getSettings();
    const updated = await updateSettings(body);

    // Si cambió el fotógrafo, broadcast a todos los canales activos
    if (
      body.photographerUserId !== undefined &&
      body.photographerUserId !== previousSettings.photographerUserId
    ) {
      const users = await getAllUsers();
      const newPhotographer = users.find(
        (u) => u.id === body.photographerUserId
      );
      if (newPhotographer) {
        // Broadcast a todas las rooms activas (todos los proyectos)
        const io = getIO();
        if (io) {
          const rooms = io.sockets.adapter.rooms;
          for (const [roomName] of rooms) {
            if (roomName.startsWith("project:")) {
              const projectId = parseInt(roomName.split(":")[1]);
              broadcastPhotographerChanged(projectId, {
                userId: newPhotographer.id,
                userName: newPhotographer.name,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SETTINGS_UPDATE_ERROR", message: "Error al actualizar la configuración" },
      },
      { status: 500 }
    );
  }
}
