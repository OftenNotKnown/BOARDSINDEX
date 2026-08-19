import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, ExternalLink, Mail, User as UserIcon } from "lucide-react";
import { useUser, useLogout } from "@/hooks/use-auth";

export function ProfileModal() {
  const { data: user } = useUser();
  const { mutate: logout, isPending } = useLogout();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-sidebar-accent/50 p-2 rounded-xl transition-colors text-left w-full group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-lg text-white shadow-lg group-hover:shadow-primary/25 transition-all">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{user.username}</div>
            <div className="text-xs text-muted-foreground truncate">Online</div>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-card border-white/10 text-foreground p-0 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-accent/80 relative"></div>
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6 p-1 bg-card rounded-full">
            <div className="w-20 h-20 rounded-full bg-secondary border-4 border-card flex items-center justify-center text-3xl font-bold">
              {user.username[0].toUpperCase()}
            </div>
          </div>
          
          <div className="mt-12 space-y-6">
            <div>
              <DialogTitle className="font-display text-2xl">{user.username}</DialogTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-3 h-3" /> {user.email}
              </p>
            </div>

            <div className="space-y-3 bg-input/50 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Account Actions</h4>
              
              <Button 
                variant="outline" 
                className="w-full justify-start border-white/10 hover:bg-white/5"
                onClick={() => window.open("https://example.com", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit External Site
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"
                onClick={() => logout()}
                disabled={isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isPending ? "Logging out..." : "Log Out"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
