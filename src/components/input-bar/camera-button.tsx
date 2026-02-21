"use client";

import { useRef, useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/utils/image-compression";
import { getCurrentPosition } from "@/lib/utils/geolocation";
import { useCapture } from "@/hooks/use-capture";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { useProjectStore } from "@/stores/project-store";

/**
 * CameraButton — tap to open camera, hold to record audio then open camera.
 *
 * IMPORTANT iOS Safari constraints:
 * 1. file input .click() MUST be called synchronously within a user gesture
 *    handler (touchend / click). Wrapping in setTimeout or await breaks
 *    the gesture chain and iOS silently ignores the click or drops onChange.
 * 2. The file input must NOT use `display:none` — iOS doesn't reliably fire
 *    onChange for invisible inputs. Use off-screen positioning instead.
 * 3. The `capture` attribute opens the native camera directly. We keep it
 *    to provide the museum use-case (photo of exhibit) but accept that the
 *    user can only take a fresh photo, not pick from gallery.
 */

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

      try {
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
      } catch (error) {
        console.error("[CameraButton] Error processing capture:", error);
      }

      // Reset input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [sendCapture]
  );

  /**
   * Open the file picker / camera.
   * MUST be called synchronously within a user gesture — no setTimeout, no await before this.
   */
  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /**
   * Press start — start a timer. If released before threshold → tap.
   * If held past threshold → start recording audio.
   */
  const handlePressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // On touch devices, prevent the subsequent mouse events from firing
      if ("touches" in e) {
        e.stopPropagation();
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
   * Press end — if tap, open camera synchronously.
   * If hold, stop recording, open camera synchronously, store audio for later.
   *
   * KEY: openFilePicker() is called SYNCHRONOUSLY in this handler — no await
   * before it, no setTimeout wrapping. This preserves the iOS user gesture chain.
   */
  const handlePressEnd = useCallback(() => {
    // Clear the hold timer if it hasn't fired yet
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldingRef.current) {
      // Was holding → open camera first (synchronously!), then stop recording async
      isHoldingRef.current = false;
      setShowRecordingIndicator(false);
      // Open camera BEFORE awaiting stopRecording — the gesture chain must not break
      openFilePicker();
      // Stop recording in background — the blob will be ready by the time handleCapture runs
      stopRecording().then((audioBlob) => {
        pendingAudioRef.current = audioBlob;
      });
    } else {
      // Was a tap → open camera immediately (no audio)
      pendingAudioRef.current = null;
      openFilePicker();
    }
  }, [stopRecording, openFilePicker]);

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

  /**
   * onClick is the most reliable event for triggering file inputs across all browsers.
   * On touch devices, this fires after touchend. We use it as a fallback — if the
   * touchend handler already opened the picker, click() on an already-open input is a no-op.
   */
  const handleClick = useCallback(() => {
    // Only handle if this wasn't already handled by touch events
    // On desktop (no touch), this is the primary trigger
    openFilePicker();
  }, [openFilePicker]);

  return (
    <>
      {/* 
        Off-screen positioning instead of display:none.
        iOS Safari doesn't reliably fire onChange for display:none inputs.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        // Desktop fallback: use onClick instead of mouseDown/mouseUp for simplicity
        // onClick fires after touchend on mobile, but openFilePicker is idempotent
        onClick={handleClick}
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
