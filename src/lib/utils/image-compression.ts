import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

const FALLBACK_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: false,
  fileType: "image/jpeg" as const,
};

export async function compressImage(file: File): Promise<Blob> {
  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    return compressed;
  } catch (error) {
    console.warn("[ImageCompression] WebP compression failed, trying JPEG fallback:", error);
    try {
      const compressed = await imageCompression(file, FALLBACK_COMPRESSION_OPTIONS);
      return compressed;
    } catch (fallbackError) {
      console.warn("[ImageCompression] All compression failed, using original file:", fallbackError);
      return file;
    }
  }
}
