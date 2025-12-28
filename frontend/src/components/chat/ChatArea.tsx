import { useAuth } from "@/hooks/use-auth";
import { useMessages, useSendMessage, useUploadFile, useSocket } from "@/hooks/use-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  ArrowLeft,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { User, Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  currentUser: User;
  recipient: User;
  onBack: () => void;
  className?: string;
}

export function ChatArea({ currentUser, recipient, onBack, className }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const { data: messages, isLoading } = useMessages(recipient.id);
  const sendMessage = useSendMessage();
  const uploadFile = useUploadFile();
  const { socket, typingUsers, emitTyping } = useSocket();
  const { toast } = useToast();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage.mutateAsync({
        senderId: currentUser.id,
        receiverId: recipient.id,
        content: messageText,
        messageType: "text"
      });
      setMessageText("");
      emitTyping(false, recipient.id);
    } catch (error) {
      toast({
        title: "Error sending message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    emitTyping(true, recipient.id);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false, recipient.id);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine type
    let messageType = "file";
    if (file.type.startsWith("image/")) messageType = "image";
    else if (file.type.startsWith("video/")) messageType = "video";

    try {
      toast({ title: "Uploading file..." });
      const { url, name } = await uploadFile.mutateAsync(file);
      
      await sendMessage.mutateAsync({
        senderId: currentUser.id,
        receiverId: recipient.id,
        content: "",
        fileUrl: url,
        fileName: name,
        messageType
      });
      
      toast({ title: "Sent successfully" });
    } catch (error) {
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isTyping = typingUsers.has(recipient.id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#efeae2]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#efeae2]", className)}>
      {/* Chat Header */}
      <div className="h-16 shrink-0 bg-white border-b border-border flex items-center px-4 justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={recipient.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {recipient.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-sm md:text-base leading-none">
              {recipient.displayName}
            </h3>
            {isTyping ? (
              <span className="text-xs text-primary font-medium animate-pulse">
                typing...
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Click here for contact info
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-opacity-50"
        style={{
          backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
          backgroundBlendMode: "overlay",
          backgroundColor: "#e5ddd5"
        }}
      >
        <AnimatePresence initial={false}>
          {messages?.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex w-full",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative max-w-[85%] sm:max-w-[65%] px-3 py-2 rounded-lg shadow-sm text-sm",
                    isMe 
                      ? "bg-[#d9fdd3] rounded-tr-none text-gray-800" 
                      : "bg-white rounded-tl-none text-gray-800"
                  )}
                >
                  {/* Message Content */}
                  {msg.messageType === "text" && (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  
                  {msg.messageType === "image" && (
                    <div className="mb-1 rounded-md overflow-hidden">
                      <img 
                        src={msg.fileUrl || ""} 
                        alt="Shared image" 
                        className="max-w-full rounded-md object-cover max-h-[300px]"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {msg.messageType === "file" && (
                    <a 
                      href={msg.fileUrl || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-black/5 rounded-md hover:bg-black/10 transition-colors mb-1"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate text-xs">{msg.fileName || "Document"}</p>
                        <p className="text-[10px] text-muted-foreground">Download</p>
                      </div>
                    </a>
                  )}

                  {/* Timestamp */}
                  <span className={cn(
                    "text-[10px] block text-right mt-1 opacity-60",
                    isMe ? "text-gray-600" : "text-gray-500"
                  )}>
                    {msg.createdAt && format(new Date(msg.createdAt), 'HH:mm')}
                  </span>
                  
                  {/* Triangle Decorator */}
                  <div className={cn(
                    "absolute top-0 w-0 h-0 border-[6px] border-transparent",
                    isMe 
                      ? "right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]" 
                      : "left-[-6px] border-t-white border-r-white"
                  )} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-border flex items-end gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 mb-1">
          <Smile className="h-6 w-6" />
        </Button>
        
        <div className="relative shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground mb-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 bg-white relative">
          <Input
            value={messageText}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            placeholder="Type a message"
            className="w-full bg-white border border-input focus-visible:ring-1 focus-visible:ring-primary/50 min-h-[44px] py-3 rounded-xl"
          />
        </div>

        <Button 
          onClick={handleSend}
          disabled={!messageText.trim()} 
          size="icon"
          className={cn(
            "mb-1 shrink-0 rounded-full transition-all duration-200",
            messageText.trim() ? "bg-primary text-white shadow-md hover:bg-primary/90" : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="h-5 w-5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
