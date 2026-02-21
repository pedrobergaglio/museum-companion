"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/project-store";
import { ChatMessage } from "./chat-message";
import { StreamingText } from "./streaming-text";

export function ChatView() {
  const { messages, isStreaming, streamingText, activeProject } =
    useProjectStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (!activeProject) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div>
          <p className="text-lg font-medium text-muted-foreground">
            Sin proyecto activo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá o seleccioná un proyecto para empezar
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div>
          <p className="text-4xl">📸</p>
          <p className="mt-3 text-lg font-medium text-muted-foreground">
            ¡Sacá una foto!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Apuntá a una obra de arte y tocá el botón de cámara
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isStreaming && streamingText && <StreamingText text={streamingText} />}
      <div ref={bottomRef} />
    </div>
  );
}
