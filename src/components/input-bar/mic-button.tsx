"use client";

import { useCallback } from "react";
import { Mic } from "lucide-react";
import { useCapture } from "@/hooks/use-capture";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { useProjectStore } from "@/stores/project-store";
import { toast } from "sonner";

/**
 * MicButton — Hold to record voice follow-up (no photo).
 * Press and hold → start recording → release → transcribe via Whisper → send to GPT-4o.
 */
export function MicButton() {
  const { isStreaming } = useProjectStore();
  const { isRecording, startRecording, stopRecording } = useMediaRecorder();
  const { sendVoiceMessage } = useCapture();

  const handlePressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if ("touches" in e) {
        e.preventDefault();
      }
      startRecording();
    },
    [startRecording]
  );

  const handlePressEnd = useCallback(async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob || audioBlob.size === 0) {
      toast.info("No se grabo audio. Mantene presionado para grabar.");
      return;
    }
    await sendVoiceMessage(audioBlob);
  }, [stopRecording, sendVoiceMessage]);

  const handlePressCancel = useCallback(async () => {
    await stopRecording(); // discard
  }, [stopRecording]);

  return (
    <button
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressCancel}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressCancel}
      disabled={isStreaming}
      className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow transition-all active:scale-95 disabled:opacity-50 ${
        isRecording
          ? "bg-red-500 text-white animate-pulse border-red-500"
          : "border border-border bg-card text-muted-foreground"
      }`}
      aria-label={
        isRecording
          ? "Grabando... soltar para enviar"
          : "Mantene presionado para preguntar con voz"
      }
    >
      <Mic className="h-6 w-6" />
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
      )}
    </button>
  );
}
