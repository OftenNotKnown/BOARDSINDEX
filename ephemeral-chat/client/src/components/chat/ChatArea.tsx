import { useState, useRef, useEffect } from "react";
import { Send, Hash, User, Download, Lock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useMessages, useSendMessage, useDownloadMessages } from "@/hooks/use-chat";
import { useUser } from "@/hooks/use-auth";

interface ChatAreaProps {
  type: "dm" | "group";
  id: number;
  name: string;
}

export function ChatArea({ type, id, name }: ChatAreaProps) {
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: currentUser } = useUser();
  const userId = type === "dm" ? id : undefined;
  const groupId = type === "group" ? id : undefined;
  
  const { data: messages, isLoading } = useMessages(userId, groupId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { refetch: downloadChat } = useDownloadMessages(userId, groupId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    sendMessage({
      content: content.trim(),
      senderId: currentUser.id,
      receiverId: userId,
      groupId: groupId,
    }, {
      onSuccess: () => setContent("")
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 text-foreground">
          {type === "group" ? <Hash className="w-5 h-5 text-muted-foreground" /> : <User className="w-5 h-5 text-muted-foreground" />}
          <span className="font-bold text-[15px]">{name}</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          onClick={() => downloadChat()}
          title="Download chat history"
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Save Chat</span>
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6" ref={scrollRef}>
        <div className="pt-20 pb-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-primary">
            {type === "group" ? <Hash className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Welcome to the start of {name}</h1>
          <p className="text-muted-foreground mb-4">
            Messages here are evaporative and may not be kept forever. Use the download button if this conversation is important.
          </p>
          <div className="h-px w-full bg-border" />
        </div>

        {isLoading && <div className="text-center text-muted-foreground animate-pulse">Loading messages...</div>}
        
        {messages?.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          const showHeader = i === 0 || messages[i - 1].senderId !== msg.senderId || 
            new Date(msg.createdAt!).getTime() - new Date(messages[i - 1].createdAt!).getTime() > 300000; // 5 mins

          return (
            <div key={msg.id} className={`flex gap-4 group hover:bg-black/20 p-1 -mx-2 px-2 rounded-md transition-colors ${!showHeader && 'mt-1'}`}>
              {showHeader ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-accent flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:shadow-lg transition-all">
                  <span className="font-bold text-sm">{msg.sender.username[0].toUpperCase()}</span>
                </div>
              ) : (
                <div className="w-10 shrink-0 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt!), 'HH:mm')}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {showHeader && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`font-semibold text-[15px] cursor-pointer hover:underline ${isMe ? 'text-primary/90' : 'text-foreground'}`}>
                      {msg.sender.username}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {format(new Date(msg.createdAt!), 'MM/dd/yyyy HH:mm')}
                    </span>
                  </div>
                )}
                <div className="text-[15px] text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 shrink-0 bg-background/95 backdrop-blur z-10 pb-6">
        <form onSubmit={handleSend} className="relative">
          <div className="bg-input border border-white/5 rounded-xl flex items-end shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={`Message ${type === 'group' ? '#' : '@'}${name}`}
              className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground p-4 max-h-[50vh] min-h-[56px] resize-none focus:outline-none custom-scrollbar"
              rows={1}
            />
            <div className="p-2 shrink-0 flex items-center">
              <Button 
                type="submit" 
                size="icon" 
                variant="ghost"
                disabled={!content.trim() || isSending}
                className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="absolute -bottom-5 left-2 text-[10px] text-muted-foreground flex items-center gap-1 opacity-60">
            <Lock className="w-3 h-3" /> End-to-end simulated encryption
          </div>
        </form>
      </div>
    </div>
  );
}
