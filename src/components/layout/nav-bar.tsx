"use client";

import Link from "next/link";
import { useProjectStore } from "@/stores/project-store";
import { FolderOpen, Image as ImageIcon, Settings } from "lucide-react";
import { ChannelToggle } from "@/components/channel/channel-toggle";

interface NavBarProps {
  onToggleChannel?: () => void;
}

export function NavBar({ onToggleChannel }: NavBarProps) {
  const { activeProject } = useProjectStore();

  return (
    <nav className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-primary">
          {activeProject?.name || "Sin proyecto"}
        </span>
        {activeProject && onToggleChannel && (
          <ChannelToggle onToggle={onToggleChannel} />
        )}
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/projects"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Proyectos"
        >
          <FolderOpen className="h-5 w-5" />
        </Link>

        {activeProject && (
          <Link
            href={`/projects/${activeProject.id}/gallery`}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Galería"
          >
            <ImageIcon className="h-5 w-5" />
          </Link>
        )}

        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Configuración"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </nav>
  );
}
