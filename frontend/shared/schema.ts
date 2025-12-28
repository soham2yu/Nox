import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().optional(),
  status: z.enum(["online", "offline", "busy", "away"]).optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  type: z.enum(["text", "image", "video", "file"]),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Message = z.infer<typeof MessageSchema>;
