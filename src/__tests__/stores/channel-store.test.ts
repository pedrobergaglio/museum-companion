/**
 * Epic 4 — Channel Store (used by Epic 1 for group mode awareness)
 * Verifies group connection state and photographer tracking.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useChannelStore } from "@/stores/channel-store";

describe("Epic 4 — Channel Store", () => {
  beforeEach(() => {
    useChannelStore.setState({
      isConnectedToGroup: false,
      photographerUserId: null,
      photographerName: null,
      isLoading: false,
    });
  });

  describe("Story 4.1 AC: group connection toggle", () => {
    it("defaults to disconnected (solo mode)", () => {
      expect(useChannelStore.getState().isConnectedToGroup).toBe(false);
    });

    it("setConnectedToGroup connects to group channel", () => {
      useChannelStore.getState().setConnectedToGroup(true);
      expect(useChannelStore.getState().isConnectedToGroup).toBe(true);
    });

    it("setConnectedToGroup disconnects back to solo", () => {
      useChannelStore.getState().setConnectedToGroup(true);
      useChannelStore.getState().setConnectedToGroup(false);
      expect(useChannelStore.getState().isConnectedToGroup).toBe(false);
    });
  });

  describe("Story 4.3 AC: photographer tracking", () => {
    it("setPhotographer stores photographer userId and name", () => {
      useChannelStore.getState().setPhotographer(2, "María");
      expect(useChannelStore.getState().photographerUserId).toBe(2);
      expect(useChannelStore.getState().photographerName).toBe("María");
    });
  });
});
