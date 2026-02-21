"use client";

import { useRef, useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/utils/image-compression";
import { getCurrentPosition } from "@/lib/utils/geolocation";
import { useCapture } from "@/hooks/use-capture";
import { useProjectStore } from "@/stores/project-store";
import { toast } from "sonner";

/**
 * CameraButton — simplified for maximum iOS compatibility.
 *
 * Uses a <label> element to trigger the file input instead of programmatic
 * .click(). This is the most reliable pattern across all mobile browsers
 * because the browser natively associates the label tap with the file input —
 * no gesture-chain issues, no timing problems.
 *
 * The hold-to-record-audio feature is temporarily removed to isolate the
 * camera issue. It can be re-added once photo capture works reliably.
 */

export function CameraButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendCapture } = useCapture();
  const { isStreaming } = useProjectStore();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * After the user picks/takes a photo, compress and send it.
   */
  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("[CameraButton] onChange fired, files:", e.target.files?.length);

      const file = e.target.files?.[0];
      if (!file) {
        console.log("[CameraButton] No file selected (user cancelled)");
        return;
      }

      console.log("[CameraButton] File received:", file.name, file.type, file.size, "bytes");
      setIsProcessing(true);

      try {
        // Compress image and get geolocation in parallel
        const [compressed, position] = await Promise.all([
          compressImage(file).catch((err) => {
            console.error("[CameraButton] Compression failed, using original:", err);
            return file as Blob;
          }),
          getCurrentPosition().catch(() => null),
        ]);

        console.log("[CameraButton] Compressed:", compressed.size, "bytes, sending...");

        await sendCapture(
          compressed,
          undefined,
          position?.latitude,
          position?.longitude,
          undefined
        );

        console.log("[CameraButton] sendCapture completed");
      } catch (error) {
        console.error("[CameraButton] Error processing capture:", error);
        toast.error("Error al procesar la foto. Intenta de nuevo.");
      } finally {
        setIsProcessing(false);
        // Reset input so the same file can be selected again
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [sendCapture]
  );

  return (
    <>
      {/*
        The file input is visually hidden but NOT display:none.
        It's associated with the label below via htmlFor/id.
      */}
      <input
        ref={inputRef}
        id="camera-file-input"
        type="file"
        accept="image/*"
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
      />
      {/*
        Using <label htmlFor="..."> is the most reliable way to trigger
        a file input on iOS Safari. No programmatic .click() needed.
        The browser natively opens the file picker when the label is tapped.
      */}
      <label
        htmlFor={isStreaming || isProcessing ? undefined : "camera-file-input"}
        className={`relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
          isStreaming || isProcessing
            ? "opacity-50 cursor-not-allowed bg-primary text-primary-foreground"
            : "bg-primary text-primary-foreground"
        }`}
        aria-label="Tomar foto"
        role="button"
      >
        <Camera className="h-6 w-6" />
        {isProcessing && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
          </span>
        )}
      </label>
    </>
  );
}
