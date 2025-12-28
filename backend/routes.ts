import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { WS_EVENTS } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize Auth
  setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // === Socket.IO Setup ===
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Track online users
  const onlineUsers = new Map<number, string>(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("identify", async (userId: number) => {
      onlineUsers.set(userId, socket.id);
      await storage.updateUserOnlineStatus(userId, true);
      io.emit(WS_EVENTS.USER_ONLINE, { userId });
    });

    socket.on(WS_EVENTS.SEND_MESSAGE, async (data) => {
      // Data should contain { receiverId, content, type, etc. }
      // We rely on the REST API to save the message usually, 
      // but for real-time we can broadcast it immediately if valid.
      // Better approach: User sends via API -> API saves -> API emits via IO
    });

    socket.on(WS_EVENTS.TYPING, ({ receiverId, userId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit(WS_EVENTS.TYPING, { userId });
      }
    });

    socket.on("disconnect", async () => {
      let disconnectedUserId: number | undefined;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        await storage.updateUserOnlineStatus(disconnectedUserId, false);
        io.emit(WS_EVENTS.USER_OFFLINE, { userId: disconnectedUserId });
      }
    });
  });

  // === REST API Routes ===

  // Users
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    // Don't send passwords
    const safeUsers = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(safeUsers);
  });

  // Messages
  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUserId = req.user!.id;
    const otherUserId = parseInt(req.params.userId);
    
    const msgs = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
    res.json(msgs);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.messages.create.input.parse(req.body);
      
      // Ensure sender is current user
      const messageData = {
        ...input,
        senderId: req.user!.id
      };
      
      const message = await storage.createMessage(messageData);
      
      // Real-time broadcast
      const receiverSocketId = onlineUsers.get(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit(WS_EVENTS.RECEIVE_MESSAGE, message);
      }
      
      // Also send back to sender (for multiple tabs/devices)
      // io.emit to self? No, client updates optimistically or via query invalidation.
      
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(err.errors);
      }
      throw err;
    }
  });

  // File Upload
  app.post(api.messages.upload.path, upload.single('file'), (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      name: req.file.originalname,
      type: req.file.mimetype
    });
  });

  return httpServer;
}
