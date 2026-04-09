import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Policy } from '@/types/policy';

interface AgentProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
}

export function useAllPolicies() {
  return useQuery({
    queryKey: ['admin-policies'],
    queryFn: async (): Promise<Policy[]> => {
      // Fetch all policies in batches to avoid the default 1000-row limit
      const allData: Policy[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('policies')
          .select('*')
          .order('date', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allData.push(...((data ?? []) as Policy[]));
        hasMore = (data?.length ?? 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      return allData;
    },
  });
}

export function useAgentProfiles() {
  return useQuery({
    queryKey: ['agent-profiles'],
    queryFn: async (): Promise<AgentProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, email');
      if (error) throw error;
      return (data ?? []) as AgentProfile[];
    },
  });
}

export function useUpdatePolicyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      policyId,
      status,
    }: {
      policyId: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from('policies')
        .update({ status } as any)
        .eq('id', policyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      policyId,
      updates,
    }: {
      policyId: string;
      updates: Partial<Omit<Policy, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      // Auto-set notes_updated_at when notes change
      const finalUpdates = { ...updates } as typeof updates & { notes_updated_at?: string };
      if ('notes' in updates && updates.notes?.trim()) {
        finalUpdates.notes_updated_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('policies')
        .update(finalUpdates as any)
        .eq('id', policyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const response = await supabase.functions.invoke('delete-agent', {
        body: { agentId },
      });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyId: string) => {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
    },
  });
}
