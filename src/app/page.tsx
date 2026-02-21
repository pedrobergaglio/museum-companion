"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/user-store";
import { useProjectStore } from "@/stores/project-store";
import { useAudioStore } from "@/stores/audio-store";
import { useChannelStore } from "@/stores/channel-store";
import { useSocket } from "@/lib/socket/client";
import { NavBar } from "@/components/layout/nav-bar";
import { ChatView } from "@/components/chat/chat-view";
import { InputBar } from "@/components/input-bar/input-bar";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, loadFromStorage } = useUserStore();
  const {
    activeProject,
    loadFromStorage: loadProject,
    fetchMessages,
  } = useProjectStore();
  const { setAmbientMusicEnabled } = useAudioStore();
  const { isConnectedToGroup } = useChannelStore();

  // Socket.IO — connect/disconnect al canal grupal
  const { connect, disconnect } = useSocket(
    currentUser?.id ?? null,
    activeProject?.id ?? null
  );

  const handleToggleChannel = useCallback(() => {
    if (isConnectedToGroup) {
      disconnect();
      // FR22: Al desconectarse del grupo, recargar conversacion individual del usuario
      if (activeProject && currentUser) {
        fetchMessages(activeProject.id, currentUser.id);
      }
    } else {
      connect();
    }
  }, [isConnectedToGroup, connect, disconnect, activeProject, currentUser, fetchMessages]);

  // Load settings (photographer + ambient music) — must resolve before socket connects
  useEffect(() => {
    loadFromStorage();
    loadProject();

    // Cargar settings (musica ambiental + fotografo) al iniciar
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success) {
          setAmbientMusicEnabled(json.data.settings.ambientMusicEnabled);
          // Cargar fotografo en channel store
          const photographerUser = json.data.users?.find(
            (u: { id: number; name: string }) =>
              u.id === json.data.settings.photographerUserId
          );
          if (photographerUser) {
            useChannelStore
              .getState()
              .setPhotographer(photographerUser.id, photographerUser.name);
          }
        }
      } catch {
        // No bloquear si falla — ambientMusicEnabled queda en false (default)
      }
    };

    loadSettings();
  }, [loadFromStorage, loadProject, setAmbientMusicEnabled]);

  useEffect(() => {
    if (currentUser === null) {
      // Esperar un tick para que loadFromStorage termine
      const timer = setTimeout(() => {
        const stored = localStorage.getItem("museum-companion-user");
        if (!stored) {
          router.push("/select-user");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (activeProject && currentUser) {
      fetchMessages(activeProject.id, currentUser.id);
    }
  }, [activeProject, currentUser, fetchMessages]);

  // Desconectar del grupo al cambiar de proyecto
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  if (!currentUser) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <NavBar onToggleChannel={handleToggleChannel} />
      <ChatView />
      <InputBar />
    </div>
  );
}
