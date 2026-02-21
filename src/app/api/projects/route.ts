import { NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/db/queries/projects";

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "PROJECTS_FETCH_ERROR", message: "Error al obtener proyectos" },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Nombre y usuario son requeridos" },
        },
        { status: 400 }
      );
    }

    const project = await createProject(name, userId);
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "PROJECT_CREATE_ERROR", message: "Error al crear el proyecto" },
      },
      { status: 500 }
    );
  }
}
