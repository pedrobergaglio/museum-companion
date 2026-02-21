/**
 * Epic 1 — Story 1.4: Image Compression
 * Verifies browser-image-compression is configured with correct options.
 */
import { describe, it, expect, vi } from "vitest";

// Mock browser-image-compression since it requires browser APIs
vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File, options: Record<string, unknown>) => {
    // Return a smaller blob simulating compression
    const compressed = new Blob(["compressed"], { type: "image/webp" });
    // Store options for assertion
    (compressed as unknown as Record<string, unknown>).__options = options;
    return compressed;
  }),
}));

import { compressImage } from "@/lib/utils/image-compression";
import imageCompression from "browser-image-compression";

describe("Epic 1 — Image Compression", () => {
  describe("Story 1.4 AC: photo compressed client-side < 500KB", () => {
    it("calls imageCompression with maxSizeMB = 0.5", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await compressImage(file);

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.5,
        })
      );
    });

    it("outputs webp format", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await compressImage(file);

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          fileType: "image/webp",
        })
      );
    });

    it("uses web worker for non-blocking compression", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await compressImage(file);

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          useWebWorker: true,
        })
      );
    });

    it("limits max dimension to 1920px", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await compressImage(file);

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxWidthOrHeight: 1920,
        })
      );
    });

    it("returns a Blob", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await compressImage(file);
      expect(result).toBeInstanceOf(Blob);
    });
  });
});
