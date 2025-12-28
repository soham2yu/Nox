// shared/schema.ts
// Shared types between frontend + backend

// WebSocket events used by both client & server
export const WS_EVENTS = {
  CONNECTED: "connected",
  USERS: "users",
  NEW_MESSAGE: "new_message",
  TYPING: "typing",
  STOP_TYPING: "stop_typing",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
} as const;

// Type for WS events
export type WSEvent = keyof typeof WS_EVENTS;

// Message type
export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  content?: string;
  fileUrl?: string;
  type: "text" | "image" | "video" | "file";
  createdAt: string;
}

// User type
export interface User {
  id: string;
  username: string;
  avatar?: string;
  status?: "online" | "offline" | "away" | "busy";
}
