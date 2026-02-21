"use client";

import { create } from "zustand";
import type { Project, Message } from "@/types";

interface ProjectStoreState {
  activeProject: Project | null;
  projects: Project[];
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  streamingMessageId: number | null;
  setActiveProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageText: (messageId: number, contentText: string) => void;
  updateMessageTtsUrl: (messageId: number, ttsAudioUrl: string) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (delta: string) => void;
  setStreamingMessageId: (id: number | null) => void;
  fetchProjects: () => Promise<void>;
  fetchMessages: (projectId: number, userId: number) => Promise<void>;
  loadFromStorage: () => void;
}

const PROJECT_STORAGE_KEY = "museum-companion-project";

export const useProjectStore = create<ProjectStoreState>((set) => ({
  activeProject: null,
  projects: [],
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingText: "",
  streamingMessageId: null,

  setActiveProject: (project: Project) => {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
    set({ activeProject: project });
  },

  setProjects: (projects: Project[]) => set({ projects }),

  setMessages: (messages: Message[]) => set({ messages }),

  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessageText: (messageId: number, contentText: string) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, contentText } : m
      ),
    })),

  updateMessageTtsUrl: (messageId: number, ttsAudioUrl: string) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, ttsAudioUrl } : m
      ),
    })),

  setStreaming: (isStreaming: boolean) => set({ isStreaming }),

  setStreamingText: (streamingText: string) => set({ streamingText }),

  appendStreamingText: (delta: string) =>
    set((state) => ({ streamingText: state.streamingText + delta })),

  setStreamingMessageId: (streamingMessageId: number | null) =>
    set({ streamingMessageId }),

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.success) {
        set({ projects: json.data });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (projectId: number, userId: number) => {
    set({ isLoading: true });
    try {
      const res = await fetch(
        `/api/projects/${projectId}/messages?userId=${userId}`
      );
      const json = await res.json();
      if (json.success) {
        set({ messages: json.data });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (stored) {
        const project = JSON.parse(stored) as Project;
        set({ activeProject: project });
      }
    } catch {
      // localStorage no disponible o corrupto
    }
  },
}));
