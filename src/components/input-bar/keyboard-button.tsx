"use client";

import { useState } from "react";
import { Keyboard, Send } from "lucide-react";
import { useCapture } from "@/hooks/use-capture";
import { useProjectStore } from "@/stores/project-store";

interface KeyboardButtonProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function KeyboardButton({ isOpen, onOpen, onClose }: KeyboardButtonProps) {
  const [text, setText] = useState("");
  const { sendTextMessage } = useCapture();
  const { isStreaming } = useProjectStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendTextMessage(text.trim());
    setText("");
    onClose?.();
  }

  if (isOpen) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribi tu pregunta..."
          autoFocus
          className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs text-muted-foreground"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={onOpen}
      disabled={isStreaming}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow transition-transform active:scale-90 disabled:opacity-50"
      aria-label="Escribir texto"
    >
      <Keyboard className="h-6 w-6" />
    </button>
  );
}
