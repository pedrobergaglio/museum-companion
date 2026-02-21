"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/project-store";
import { useUserStore } from "@/stores/user-store";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { projects, setActiveProject, fetchProjects } =
    useProjectStore();
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !currentUser) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), userId: currentUser.id }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveProject(json.data);
        setNewName("");
        fetchProjects();
        router.push("/");
      } else {
        toast.error(json.error.message);
      }
    } catch {
      toast.error("Error al crear el proyecto");
    } finally {
      setIsCreating(false);
    }
  }

  function handleSelect(project: Project) {
    setActiveProject(project);
    router.push("/");
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <nav className="flex h-12 items-center gap-3 border-b border-border bg-card px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Proyectos</h1>
      </nav>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del proyecto (ej: Florencia)"
            className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!newName.trim() || isCreating}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Crear
          </button>
        </form>

        {projects.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-muted-foreground">
              No hay proyectos. Creá uno para empezar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project)}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent active:scale-[0.99]"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
