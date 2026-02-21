"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/user-store";
import { useChannelStore } from "@/stores/channel-store";
import { CameraButton } from "./camera-button";
import { MicButton } from "./mic-button";
import { KeyboardButton } from "./keyboard-button";
import { Headphones } from "lucide-react";

export function InputBar() {
  const { currentUser } = useUserStore();
  const { isConnectedToGroup, photographerUserId } = useChannelStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // FR17: Oyentes (no fotógrafo) en canal grupal → solo lectura
  const isListener =
    isConnectedToGroup &&
    currentUser != null &&
    photographerUserId != null &&
    currentUser.id !== photographerUserId;

  if (isListener) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-border bg-card px-4 py-3">
        <Headphones className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Escuchando al grupo
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 border-t border-border bg-card px-4 py-3">
      {isKeyboardOpen ? (
        <KeyboardButton isOpen onClose={() => setIsKeyboardOpen(false)} />
      ) : (
        <>
          <MicButton />
          <CameraButton />
          <KeyboardButton isOpen={false} onOpen={() => setIsKeyboardOpen(true)} />
        </>
      )}
    </div>
  );
}
