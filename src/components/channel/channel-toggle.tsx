"use client";

import { useChannelStore } from "@/stores/channel-store";
import { Users, UserRoundX } from "lucide-react";

interface ChannelToggleProps {
  onToggle: () => void;
}

/**
 * Boton toggle grupo/solo — lee y refleja el estado de channelStore.
 * Arquitectura: components/channel/ solo lee y escribe channelStore.
 */
export function ChannelToggle({ onToggle }: ChannelToggleProps) {
  const { isConnectedToGroup } = useChannelStore();

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        isConnectedToGroup
          ? "bg-green-500/15 text-green-600"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
      aria-label={isConnectedToGroup ? "Desconectar del grupo" : "Conectar al grupo"}
    >
      {isConnectedToGroup ? (
        <>
          <Users className="h-3.5 w-3.5" />
          <span>Grupo</span>
        </>
      ) : (
        <>
          <UserRoundX className="h-3.5 w-3.5" />
          <span>Solo</span>
        </>
      )}
    </button>
  );
}
