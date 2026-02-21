import { eq } from "drizzle-orm";
import { db } from "../index";
import { projects, projectMembers, conversations } from "../schema";

export async function getAllProjects() {
  return db.select().from(projects).orderBy(projects.createdAt).all();
}

export async function createProject(name: string, userId: number) {
  const now = new Date().toISOString();

  const project = db
    .insert(projects)
    .values({ name, createdAt: now })
    .returning()
    .get();

  // Agregar al usuario como miembro
  db.insert(projectMembers)
    .values({ projectId: project.id, userId })
    .run();

  // Crear conversacion para el usuario
  db.insert(conversations)
    .values({ projectId: project.id, userId, createdAt: now })
    .run();

  return project;
}

export async function getProjectById(id: number) {
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export async function addMemberToProject(projectId: number, userId: number) {
  const existing = db
    .select()
    .from(projectMembers)
    .where(
      eq(projectMembers.projectId, projectId)
    )
    .all()
    .find((m) => m.userId === userId);

  if (existing) return;

  db.insert(projectMembers)
    .values({ projectId, userId })
    .run();

  // Crear conversacion si no existe
  const existingConv = db
    .select()
    .from(conversations)
    .all()
    .find((c) => c.projectId === projectId && c.userId === userId);

  if (!existingConv) {
    db.insert(conversations)
      .values({ projectId, userId, createdAt: new Date().toISOString() })
      .run();
  }
}
