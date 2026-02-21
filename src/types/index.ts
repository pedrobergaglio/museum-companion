// Tipos compartidos para Museum Companion

export interface User {
  id: number;
  name: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  createdAt: string;
}

export interface ProjectMember {
  projectId: number;
  userId: number;
}

export interface Conversation {
  id: number;
  projectId: number;
  userId: number;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  contentText: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  ttsAudioUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface Settings {
  id: number;
  photographerUserId: number;
  systemPrompt: string;
  ambientMusicEnabled: boolean;
  updatedAt: string;
}

export interface CapturePayload {
  projectId: number;
  userId: number;
  image: File;
  audio?: Blob;
  latitude?: number;
  longitude?: number;
}

export interface MessagePayload {
  projectId: number;
  userId: number;
  text?: string;
  audio?: Blob;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Socket.IO event payloads
export interface NewCaptureEvent {
  messageId: number;
  imageUrl: string;
  projectId: number;
  userId: number;
  latitude: number | null;
  longitude: number | null;
}

export interface TextStreamEvent {
  messageId: number;
  delta: string;
  done: boolean;
  fullText?: string;
  assistantMessageId?: number;
  userId: number;
}

export interface TtsReadyEvent {
  messageId: number;
  audioUrl: string;
  userId: number;
}

export interface PhotographerChangedEvent {
  userId: number;
  userName: string;
}
