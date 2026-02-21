"use client";

import { create } from "zustand";
import type { User } from "@/types";

interface UserStoreState {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  fetchUsers: () => Promise<void>;
  loadFromStorage: () => void;
}

const USER_STORAGE_KEY = "museum-companion-user";

export const useUserStore = create<UserStoreState>((set) => ({
  currentUser: null,
  users: [],
  isLoading: false,

  setCurrentUser: (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ currentUser: user });
  },

  setUsers: (users: User[]) => set({ users }),

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        set({ users: json.data.users });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ currentUser: user });
      }
    } catch {
      // localStorage no disponible o corrupto
    }
  },
}));
