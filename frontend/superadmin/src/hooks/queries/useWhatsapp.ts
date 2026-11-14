import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "@/services/api/whatsappApi";

const KEY = ["whatsapp"] as const;

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...parts: string[]) => queryClient.invalidateQueries({ queryKey: [...KEY, ...parts] });
}

export function useWhatsappSettings() {
  return useQuery({ queryKey: [...KEY, "settings"], queryFn: api.fetchWhatsappSettings });
}

export function useUpdateWhatsappSettings() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.updateWhatsappSettings,
    onSuccess: () => invalidate("settings"),
  });
}

export function useWhatsappAccounts() {
  return useQuery({ queryKey: [...KEY, "accounts"], queryFn: api.fetchWhatsappAccounts });
}

export function useSaveWhatsappAccount() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: api.WhatsappAccountWrite }) =>
      id ? api.updateWhatsappAccount(id, values) : api.createWhatsappAccount(values),
    onSuccess: () => invalidate("accounts"),
  });
}

export function useRegenerateVerifyToken() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.regenerateVerifyToken,
    onSuccess: () => invalidate("accounts"),
  });
}

export function useTestWhatsappAccount() {
  return useMutation({ mutationFn: api.testWhatsappAccount });
}

export function useKnowledge() {
  return useQuery({ queryKey: [...KEY, "knowledge"], queryFn: api.fetchKnowledge });
}

export function useSaveKnowledge() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: api.KnowledgeWrite }) =>
      id ? api.updateKnowledge(id, values) : api.createKnowledge(values),
    onSuccess: () => invalidate("knowledge"),
  });
}

export function useDeleteKnowledge() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: api.deleteKnowledge, onSuccess: () => invalidate("knowledge") });
}

export function useConcernMappings() {
  return useQuery({ queryKey: [...KEY, "mappings"], queryFn: api.fetchMappings });
}

export function useSaveConcernMapping() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: api.ConcernMappingWrite }) =>
      id ? api.updateMapping(id, values) : api.createMapping(values),
    onSuccess: () => invalidate("mappings"),
  });
}

export function useDeleteConcernMapping() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: api.deleteMapping, onSuccess: () => invalidate("mappings") });
}

export function useCatalogueSearch(q: string) {
  return useQuery({
    queryKey: [...KEY, "catalogue", q],
    queryFn: () => api.searchCatalogue(q),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function useTryWhatsappAssistant() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.tryWhatsappAssistant,
    onSuccess: () => invalidate("ai-log"),
  });
}

export function useWhatsappStats() {
  return useQuery({
    queryKey: [...KEY, "stats"],
    queryFn: api.fetchWhatsappStats,
    refetchInterval: 30_000,
  });
}

export function useConversations(params: { view?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: [...KEY, "conversations", params],
    queryFn: () => api.fetchConversations({ ...params, limit: 25 }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "conversation", id],
    queryFn: () => api.fetchConversation(id as string),
    enabled: !!id,
    refetchInterval: 10_000,
  });
}

export function useConversationActions(id: string) {
  const invalidate = useInvalidate();
  const refresh = () => {
    invalidate("conversation", id);
    invalidate("conversations");
    invalidate("stats");
  };
  return {
    reply: useMutation({
      mutationFn: (body: string) => api.sendStaffReply(id, body),
      onSuccess: refresh,
    }),
    takeover: useMutation({
      mutationFn: (on: boolean) => api.setTakeover(id, on),
      onSuccess: refresh,
    }),
    resolve: useMutation({ mutationFn: () => api.resolveHandoff(id), onSuccess: refresh }),
  };
}

export function useAiLog(params: {
  status?: string;
  handoff?: boolean;
  dryRun?: boolean;
  page?: number;
}) {
  return useQuery({
    queryKey: [...KEY, "ai-log", params],
    queryFn: () => api.fetchAiLog({ ...params, limit: 25 }),
    placeholderData: keepPreviousData,
  });
}

export function useFollowUps(params: { status?: string; page?: number }) {
  return useQuery({
    queryKey: [...KEY, "follow-ups", params],
    queryFn: () => api.fetchFollowUps({ ...params, limit: 25 }),
    placeholderData: keepPreviousData,
  });
}
