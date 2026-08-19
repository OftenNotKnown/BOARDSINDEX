import { Link, useRoute } from "wouter";
import { Hash, User, ShieldAlert } from "lucide-react";
import { useUsersList, useGroupsList, useBanUser } from "@/hooks/use-chat";
import { useUser } from "@/hooks/use-auth";
import { CreateGroupDialog } from "../CreateGroupDialog";
import { ProfileModal } from "../ProfileModal";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { data: users } = useUsersList();
  const { data: groups } = useGroupsList();
  const { data: currentUser } = useUser();
  const { mutate: banUser } = useBanUser();
  const [matchDM, paramsDM] = useRoute("/dm/:id");
  const [matchGroup, paramsGroup] = useRoute("/group/:id");

  const isAdmin = currentUser?.email === 'arduinodebugstick@outlook.com';
  const otherUsers = users?.filter(u => u.id !== currentUser?.id && !u.isBanned) || [];

  return (
    <div className="w-64 md:w-72 bg-sidebar-background flex flex-col h-screen border-r border-sidebar-border shadow-xl z-10 flex-shrink-0">
      <div className="h-12 flex items-center px-4 shadow-sm border-b border-sidebar-border shrink-0">
        <h2 className="font-display font-bold text-[15px] shadow-sm">Quantum Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        
        {/* GROUPS */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1 group">
            <h3 className="text-xs font-bold text-sidebar-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
              Groups
            </h3>
            <CreateGroupDialog />
          </div>
          <div className="space-y-0.5">
            {groups?.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted-foreground italic">No groups yet</div>
            )}
            {groups?.map(group => {
              const isActive = matchGroup && paramsGroup?.id === group.id.toString();
              return (
                <Link key={`group-${group.id}`} href={`/group/${group.id}`} className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all
                  ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'}
                `}>
                  <Hash className="w-4 h-4 opacity-70" />
                  <span className="font-medium text-[15px] truncate">{group.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* DIRECT MESSAGES */}
        <div>
          <h3 className="text-xs font-bold text-sidebar-foreground uppercase tracking-wider px-2 mb-2">
            Direct Messages
          </h3>
          <div className="space-y-0.5">
            {otherUsers.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted-foreground italic">No users available</div>
            )}
            {otherUsers.map(user => {
              const isActive = matchDM && paramsDM?.id === user.id.toString();
              return (
                <div key={`user-${user.id}`} className={`
                  flex items-center justify-between px-2 py-1.5 rounded-md transition-all group
                  ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'}
                `}>
                  <Link href={`/dm/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-sidebar-background"></div>
                    </div>
                    <span className="font-medium text-[15px] truncate">{user.username}</span>
                  </Link>

                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Ban ${user.username}?`)) banUser(user.id);
                      }}
                      title="Ban User"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#111214] mt-auto shrink-0 border-t border-sidebar-border">
        <ProfileModal />
      </div>
    </div>
  );
}
