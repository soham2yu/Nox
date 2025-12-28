import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMessage } from "@shared/routes";
import { useRef, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./use-auth";
import { WS_EVENTS } from "@shared/schema";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useMessages(userId: number | undefined) {
  return useQuery({
    queryKey: [api.messages.list.path, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const url = buildUrl(api.messages.list.path, { userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (newMessage) => {
      // Optimistically update or invalidate. 
      // We will invalidate both sender and receiver queries to be safe, 
      // though typically Socket handles the real-time part.
      // This is a fallback/initial sync.
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(api.messages.upload.path, {
        method: api.messages.upload.method,
        body: formData, // Browser sets Content-Type to multipart/form-data automatically
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("File upload failed");
      return api.messages.upload.responses[200].parse(await res.json());
    }
  });
}

// Socket.IO Hook
export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Connect to the same host
    const socket = io(window.location.origin, {
      path: "/socket.io",
    });
    
    socketRef.current = socket;

    socket.on(WS_EVENTS.CONNECT, () => {
      console.log("Connected to websocket");
    });

    socket.on(WS_EVENTS.RECEIVE_MESSAGE, (message) => {
      // Invalidate relevant queries to fetch new message
      // Or update cache manually for instant feel
      const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
      
      queryClient.setQueryData([api.messages.list.path, otherUserId], (oldData: any[]) => {
        if (!oldData) return [message];
        // Check if message already exists to avoid dupes
        if (oldData.some(m => m.id === message.id)) return oldData;
        return [...oldData, message];
      });
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, otherUserId] });
    });

    socket.on(WS_EVENTS.USER_ONLINE, (userId: number) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    socket.on(WS_EVENTS.USER_OFFLINE, (userId: number) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on(WS_EVENTS.TYPING, ({ userId }: { userId: number }) => {
      setTypingUsers(prev => new Set(prev).add(userId));
    });

    socket.on(WS_EVENTS.STOP_TYPING, ({ userId }: { userId: number }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  const emitTyping = (isTyping: boolean, receiverId: number) => {
    if (socketRef.current) {
      const event = isTyping ? WS_EVENTS.TYPING : WS_EVENTS.STOP_TYPING;
      socketRef.current.emit(event, { receiverId });
    }
  };

  return { 
    socket: socketRef.current,
    onlineUsers,
    typingUsers,
    emitTyping 
  };
}
