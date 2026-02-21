"use client";

import { create } from "zustand";

interface ChannelStoreState {
  isConnectedToGroup: boolean;
  photographerUserId: number | null;
  photographerName: string | null;
  isLoading: boolean;
  setConnectedToGroup: (connected: boolean) => void;
  setPhotographer: (userId: number, name: string) => void;
}

export const useChannelStore = create<ChannelStoreState>((set) => ({
  isConnectedToGroup: false,
  photographerUserId: null,
  photographerName: null,
  isLoading: false,

  setConnectedToGroup: (isConnectedToGroup: boolean) =>
    set({ isConnectedToGroup }),

  setPhotographer: (userId: number, name: string) =>
    set({ photographerUserId: userId, photographerName: name }),
}));
