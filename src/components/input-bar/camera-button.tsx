"use client";

import { useRef, useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/utils/image-compression";
import { getCurrentPosition } from "@/lib/utils/geolocation";
import { useCapture } from "@/hooks/use-capture";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { useProjectStore } from "@/stores/project-store";

/** Milliseconds to distinguish tap from hold */
const HOLD_THRESHOLD = 300;

export function CameraButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendCapture } = useCapture();
  const { isStreaming } = useProjectStore();
  const { isRecording, startRecording, stopRecording } = useMediaRecorder();

  // Track hold state
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const pendingAudioRef = useRef<Blob | null>(null);
  const [showRecordingIndicator, setShowRecordingIndicator] = useState(false);

  /**
   * After the user picks/takes a photo, send it (with optional audio from hold).
   */
  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        // User cancelled the camera — discard any pending audio
        pendingAudioRef.current = null;
        return;
      }

      const audioBlob = pendingAudioRef.current;
      pendingAudioRef.current = null;

      // Compress image and get geolocation in parallel
      const [compressed, position] = await Promise.all([
        compressImage(file),
        getCurrentPosition(),
      ]);

      await sendCapture(
        compressed,
        undefined,
        position?.latitude,
        position?.longitude,
        audioBlob || undefined
      );

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [sendCapture]
  );

  /**
   * Press start — start a timer. If released before threshold → tap (photo only).
   * If held past threshold → start recording audio.
   */
  const handlePressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Prevent default to avoid ghost clicks on touch
      if ("touches" in e) {
        e.preventDefault();
      }

      isHoldingRef.current = false;
      pendingAudioRef.current = null;

      holdTimerRef.current = setTimeout(() => {
        // Hold detected — start recording
        isHoldingRef.current = true;
        setShowRecordingIndicator(true);
        startRecording();
      }, HOLD_THRESHOLD);
    },
    [startRecording]
  );

  /**
   * Press end — stop recording if holding, then open camera.
   * If it was a tap (< HOLD_THRESHOLD), just open camera normally.
   */
  const handlePressEnd = useCallback(async () => {
    // Clear the hold timer if it hasn't fired yet
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldingRef.current) {
      // Was holding → stop recording, save audio, then open camera
      isHoldingRef.current = false;
      setShowRecordingIndicator(false);
      const audioBlob = await stopRecording();
      pendingAudioRef.current = audioBlob;
      // Open camera picker — the handleCapture will use the pending audio
      inputRef.current?.click();
    } else {
      // Was a tap → open camera immediately (no audio)
      pendingAudioRef.current = null;
      inputRef.current?.click();
    }
  }, [stopRecording]);

  /**
   * If the user moves finger off the button, cancel the hold.
   */
  const handlePressCancel = useCallback(async () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setShowRecordingIndicator(false);
      await stopRecording(); // discard
      pendingAudioRef.current = null;
    }
  }, [stopRecording]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
      <button
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        disabled={isStreaming}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
          showRecordingIndicator || isRecording
            ? "bg-red-500 text-white animate-pulse"
            : "bg-primary text-primary-foreground"
        }`}
        aria-label={
          showRecordingIndicator
            ? "Grabando pregunta de voz..."
            : "Tomar foto (mantene presionado para grabar pregunta)"
        }
      >
        <Camera className="h-6 w-6" />
        {(showRecordingIndicator || isRecording) && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        )}
      </button>
    </>
  );
}
