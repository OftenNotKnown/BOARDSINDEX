import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useUsersList() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.users.ban.path, { id });
      const res = await fetch(url, {
        method: api.users.ban.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to ban user");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.users.list.path] }),
  });
}

export function useGroupsList() {
  return useQuery({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return api.groups.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.groups.create.input>) => {
      const res = await fetch(api.groups.create.path, {
        method: api.groups.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create group");
      return api.groups.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.groups.list.path] }),
  });
}

export function useMessages(userId?: number, groupId?: number) {
  return useQuery({
    queryKey: [api.messages.list.path, userId, groupId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId.toString());
      if (groupId) params.append("groupId", groupId.toString());
      
      const url = `${api.messages.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Poll every 2 seconds as requested
    enabled: !!userId || !!groupId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.messages.create.input>) => {
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate to trigger instant refetch
      queryClient.invalidateQueries({ 
        queryKey: [api.messages.list.path, variables.receiverId, variables.groupId] 
      });
    },
  });
}

export function useDownloadMessages(userId?: number, groupId?: number) {
  return useQuery({
    queryKey: [api.messages.download.path, userId, groupId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId.toString());
      if (groupId) params.append("groupId", groupId.toString());
      
      const url = `${api.messages.download.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download");
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `chat_history_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      return true;
    },
    enabled: false, // Only trigger manually
  });
}
