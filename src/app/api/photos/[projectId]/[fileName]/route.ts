import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; fileName: string }> }
) {
  try {
    const { projectId, fileName } = await params;

    // H7 Fix: Sanitize fileName to prevent path traversal attacks (e.g. "../../etc/passwd")
    const sanitizedFileName = path.basename(fileName);
    const sanitizedProjectId = path.basename(projectId);
    const filePath = path.join(
      process.cwd(),
      "data",
      "photos",
      sanitizedProjectId,
      sanitizedFileName
    );

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Foto no encontrada" },
        },
        { status: 404 }
      );
    }

    const file = await fs.readFile(filePath);
    const contentType = sanitizedFileName.endsWith(".jpg") || sanitizedFileName.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/webp";
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving photo:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "PHOTO_ERROR", message: "Error al servir la foto" },
      },
      { status: 500 }
    );
  }
}
