import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users } from "lucide-react";
import { useUsersList, useCreateGroup } from "@/hooks/use-chat";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  const { data: users } = useUsersList();
  const { data: currentUser } = useUser();
  const { mutate: createGroup, isPending } = useCreateGroup();
  const { toast } = useToast();

  const handleToggleUser = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId);
      if (prev.length >= 9) { // Max 10 including self (so 9 others)
        toast({ title: "Limit reached", description: "You can only invite up to 10 people.", variant: "destructive" });
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createGroup(
      { name: name.trim(), memberIds: selectedUsers },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setSelectedUsers([]);
          toast({ title: "Group created", description: `Group ${name} created successfully.` });
        }
      }
    );
  };

  const otherUsers = users?.filter(u => u.id !== currentUser?.id && !u.isBanned) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-sidebar-accent hover:text-primary">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Users className="w-6 h-6 text-primary" />
            Create a Group Chat
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Group Name</label>
            <Input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. The Cool Kids"
              className="bg-input border-none focus-visible:ring-primary h-12"
              maxLength={30}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Invite Friends</label>
              <span className="text-xs text-muted-foreground">{selectedUsers.length}/9 selected</span>
            </div>
            <div className="bg-input rounded-md p-2 h-48 overflow-y-auto custom-scrollbar space-y-1">
              {otherUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center p-4">No other users found.</p>
              ) : (
                otherUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-sidebar-accent rounded cursor-pointer transition-colors">
                    <Checkbox 
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={() => handleToggleUser(u.id)}
                      className="border-white/20 data-[state=checked]:bg-primary"
                    />
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{u.username}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isPending || !name.trim() || selectedUsers.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
