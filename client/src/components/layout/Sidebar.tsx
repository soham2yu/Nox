import { useAuth } from "@/hooks/use-auth";
import { useUsers, useSocket } from "@/hooks/use-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LogOut, MoreVertical, MessageSquare } from "lucide-react";
import { useState } from "react";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SidebarProps {
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  className?: string;
}

export function Sidebar({ selectedUser, onSelectUser, className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { data: users, isLoading } = useUsers();
  const { onlineUsers } = useSocket();
  const [search, setSearch] = useState("");

  const filteredUsers = users?.filter((u) => {
    if (u.id === user?.id) return false; // Don't show self
    return u.displayName.toLowerCase().includes(search.toLowerCase()) || 
           u.username.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-white border-r border-border", className)}>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-border", className)}>
      {/* Header */}
      <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center h-16 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold hidden sm:block truncate max-w-[120px]">
            {user?.displayName}
          </span>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:bg-destructive/10"
            onClick={() => logout.mutate()}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search or start new chat" 
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto scrollbar-default">
        {filteredUsers?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No users found.
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredUsers?.map((u) => {
              const isOnline = onlineUsers.has(u.id);
              const isActive = selectedUser?.id === u.id;
              
              return (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={cn(
                    "w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left group border-b border-transparent",
                    isActive && "bg-muted hover:bg-muted border-border"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-border/50">
                      <AvatarImage src={u.avatarUrl || undefined} />
                      <AvatarFallback className="bg-secondary text-primary font-medium">
                        {u.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-foreground truncate">{u.displayName}</h4>
                      {/* Placeholder for last message time - in a real app this comes from query */}
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {u.lastSeen ? format(new Date(u.lastSeen), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
