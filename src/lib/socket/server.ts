import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import type {
  NewCaptureEvent,
  TextStreamEvent,
  TtsReadyEvent,
  PhotographerChangedEvent,
} from "@/types";

// Singleton — una sola instancia de Socket.IO por proceso
let io: SocketIOServer | null = null;

/** Inicializa Socket.IO sobre un HttpServer existente. Idempotente. */
export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*", // MVP: 5 usuarios fijos, no necesitamos restriccion
    },
    // Reconexion y transporte
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    // --- Room management (project-level) ---

    socket.on("join-channel", (data: { projectId: number; userId: number }) => {
      const room = `project:${data.projectId}`;
      socket.join(room);
      socket.data.projectId = data.projectId;
      socket.data.userId = data.userId;
      console.log(
        `[Socket.IO] User ${data.userId} joined room ${room} (socket ${socket.id})`
      );
    });

    socket.on("leave-channel", () => {
      const room = `project:${socket.data.projectId}`;
      if (room) {
        socket.leave(room);
        console.log(
          `[Socket.IO] User ${socket.data.userId} left room ${room} (socket ${socket.id})`
        );
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket.IO] Disconnected: ${socket.id} (reason: ${reason})`
      );
    });
  });

  console.log("[Socket.IO] Server initialized on path /api/socketio");
  return io;
}

/** Devuelve la instancia de IO. Null si el server aún no arrancó. */
export function getIO(): SocketIOServer | null {
  return io;
}

// --- Broadcast helpers (usados desde API routes) ---

export function broadcastNewCapture(projectId: number, event: NewCaptureEvent) {
  io?.to(`project:${projectId}`).emit("new-capture", event);
}

export function broadcastTextStream(
  projectId: number,
  event: TextStreamEvent
) {
  io?.to(`project:${projectId}`).emit("text-stream", event);
}

export function broadcastTtsReady(projectId: number, event: TtsReadyEvent) {
  io?.to(`project:${projectId}`).emit("tts-ready", event);
}

export function broadcastPhotographerChanged(
  projectId: number,
  event: PhotographerChangedEvent
) {
  io?.to(`project:${projectId}`).emit("photographer-changed", event);
}
