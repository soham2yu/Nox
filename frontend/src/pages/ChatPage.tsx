import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading ChatApp...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile if chat is open */}
      <div className={`
        w-full md:w-[380px] lg:w-[420px] h-full flex-shrink-0 
        ${selectedUser ? 'hidden md:flex' : 'flex'}
      `}>
        <Sidebar 
          selectedUser={selectedUser} 
          onSelectUser={setSelectedUser} 
          className="w-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 h-full relative
        ${!selectedUser ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedUser ? (
          <ChatArea 
            currentUser={user} 
            recipient={selectedUser} 
            onBack={() => setSelectedUser(null)}
            className="w-full"
          />
        ) : (
          /* Empty State */
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center border-l border-border">
            <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
              {/* Using a friendly illustration or icon here */}
              <MessageSquare className="w-24 h-24 text-primary/40" />
            </div>
            <h2 className="text-3xl font-light text-gray-700 mb-4 font-display">
              ChatApp Web
            </h2>
            <p className="text-gray-500 max-w-md leading-relaxed">
              Send and receive messages without keeping your phone online.
              <br />
              Use ChatApp on up to 4 linked devices and 1 phone.
            </p>
            <div className="mt-12 flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </span>
              End-to-end encrypted
            </div>
            <div className="absolute bottom-0 w-full h-2 bg-gradient-to-t from-black/5 to-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}
