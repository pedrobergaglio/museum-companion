"use client";

import { Volume2 } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { setCurrentTtsUrl, isPlayingTts } = useAudioStore();

  const handlePlayTts = () => {
    if (message.ttsAudioUrl) {
      setCurrentTtsUrl(message.ttsAudioUrl);
    }
  };

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-card-foreground"
        }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Captura"
            className="mb-2 w-full rounded-lg"
            loading="lazy"
          />
        )}
        {message.contentText && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.contentText}
          </p>
        )}
        {!message.contentText && message.imageUrl && (
          <p className="text-xs opacity-70">Foto enviada</p>
        )}
        {message.ttsAudioUrl && !isUser && (
          <button
            onClick={handlePlayTts}
            className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Reproducir audio"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>{isPlayingTts ? "Reproduciendo..." : "Escuchar"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
