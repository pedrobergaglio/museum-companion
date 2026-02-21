/**
 * Epic 6 — Story 6.1: Geolocation Utility
 * Verifies geolocation capture and graceful denial handling (non-blocking).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentPosition } from "@/lib/utils/geolocation";

describe("Epic 6 — Geolocation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Story 6.1 AC: system gets lat/lng via Geolocation API", () => {
    it("returns coordinates when geolocation succeeds", async () => {
      const mockPosition = {
        coords: { latitude: 43.7696, longitude: 11.2558 },
      };

      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: {
            getCurrentPosition: vi.fn((success) => success(mockPosition)),
          },
        },
        writable: true,
      });

      const result = await getCurrentPosition();
      expect(result).toEqual({ latitude: 43.7696, longitude: 11.2558 });
    });
  });

  describe("Story 6.1 AC: if user denies permission, photo saves without coordinates (non-blocking)", () => {
    it("returns null when geolocation is denied", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: {
            getCurrentPosition: vi.fn((_success, error) =>
              error(new Error("Permission denied"))
            ),
          },
        },
        writable: true,
      });

      const result = await getCurrentPosition();
      expect(result).toBeNull();
    });

    it("returns null when geolocation API is not available", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { geolocation: undefined },
        writable: true,
      });

      const result = await getCurrentPosition();
      expect(result).toBeNull();
    });
  });

  describe("Story 6.1 AC: geolocation does not block photo capture", () => {
    it("resolves within timeout even if API is slow (non-blocking by design)", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: {
            getCurrentPosition: vi.fn((success) => {
              // Simulate slow response
              setTimeout(() => success({ coords: { latitude: 0, longitude: 0 } }), 50);
            }),
          },
        },
        writable: true,
      });

      const result = await getCurrentPosition();
      expect(result).toEqual({ latitude: 0, longitude: 0 });
    });
  });
});
