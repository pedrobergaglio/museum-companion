/**
 * Epic 1 — Story 1.2: User Store
 * Verifies user selection, localStorage persistence, and user fetch.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUserStore } from "@/stores/user-store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("Epic 1 — User Store", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useUserStore.setState({
      currentUser: null,
      users: [],
      isLoading: false,
    });
  });

  describe("Story 1.2 AC: selecting user saves to localStorage", () => {
    it("setCurrentUser stores user in state and localStorage", () => {
      const user = { id: 1, name: "Pedro", createdAt: "2026-01-01" };
      useUserStore.getState().setCurrentUser(user);

      expect(useUserStore.getState().currentUser).toEqual(user);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "museum-companion-user",
        JSON.stringify(user)
      );
    });
  });

  describe("Story 1.2 AC: returning user loads from localStorage", () => {
    it("loadFromStorage restores user from localStorage", () => {
      const user = { id: 2, name: "María", createdAt: "2026-01-01" };
      localStorageMock.setItem("museum-companion-user", JSON.stringify(user));

      useUserStore.getState().loadFromStorage();
      expect(useUserStore.getState().currentUser).toEqual(user);
    });

    it("loadFromStorage handles empty localStorage gracefully", () => {
      useUserStore.getState().loadFromStorage();
      expect(useUserStore.getState().currentUser).toBeNull();
    });
  });

  describe("Story 1.2 AC: fetches 5 pre-configured users", () => {
    it("fetchUsers populates users array from API", async () => {
      const mockUsers = [
        { id: 1, name: "Pedro", createdAt: "2026-01-01" },
        { id: 2, name: "María", createdAt: "2026-01-01" },
        { id: 3, name: "Lucas", createdAt: "2026-01-01" },
        { id: 4, name: "Ana", createdAt: "2026-01-01" },
        { id: 5, name: "Carlos", createdAt: "2026-01-01" },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { users: mockUsers } }),
      });

      await useUserStore.getState().fetchUsers();
      expect(useUserStore.getState().users).toHaveLength(5);
      expect(useUserStore.getState().users.map((u) => u.name)).toEqual([
        "Pedro", "María", "Lucas", "Ana", "Carlos",
      ]);
    });
  });
});
