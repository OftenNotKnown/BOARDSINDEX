import { useRoute } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { useUsersList, useGroupsList } from "@/hooks/use-chat";
import { Atom } from "lucide-react";

export function ChatPage() {
  const [matchDM, paramsDM] = useRoute("/dm/:id");
  const [matchGroup, paramsGroup] = useRoute("/group/:id");
  
  const { data: users } = useUsersList();
  const { data: groups } = useGroupsList();

  let activeView: "none" | "dm" | "group" = "none";
  let activeId: number | undefined;
  let activeName = "";

  if (matchDM && paramsDM?.id) {
    activeView = "dm";
    activeId = parseInt(paramsDM.id);
    const user = users?.find(u => u.id === activeId);
    activeName = user?.username || "Unknown User";
  } else if (matchGroup && paramsGroup?.id) {
    activeView = "group";
    activeId = parseInt(paramsGroup.id);
    const group = groups?.find(g => g.id === activeId);
    activeName = group?.name || "Unknown Group";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        {activeView === "none" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Atom className="w-12 h-12 opacity-50" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">No connection selected</h2>
            <p className="text-sm">Select a friend or group from the sidebar to start talking.</p>
          </div>
        ) : (
          <ChatArea 
            type={activeView} 
            id={activeId!} 
            name={activeName} 
            key={`${activeView}-${activeId}`} // Force remount on change to clear state
          />
        )}
      </main>
    </div>
  );
}
