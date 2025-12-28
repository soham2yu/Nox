import { z } from "zod";

//
// ==============================================
// AUTH SCHEMAS
// ==============================================
export const SignupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
});

//
// ==============================================
// MESSAGE SCHEMAS
// ==============================================
export const MessageCreateSchema = z.object({
  to: z.string(),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  type: z.enum(["text", "image", "video", "file"]),
});

//
// ==============================================
// GENERIC ERROR SCHEMA
// ==============================================
export const ErrorSchema = z.object({
  message: z.string(),
});

//
// ==============================================
// API ROUTES USED BY FRONTEND
// ==============================================
export const API = {
  auth: {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },

  users: {
    list: "/api/users",
  },

  messages: {
    list: (userId: string) => `/api/messages/${userId}`,
    create: "/api/messages",
    upload: "/api/upload",
  },
};

//
// ==============================================
// URL HELPER
// ==============================================
export function buildUrl(
  path: string,
  params?: Record<string, string | number>
) {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

//
// ==============================================
// BACKWARD COMPATIBILITY FOR OLD CODE
// ==============================================
export const api = API;

// Used in use-auth.ts
export type InsertUser = z.infer<typeof SignupSchema>;
