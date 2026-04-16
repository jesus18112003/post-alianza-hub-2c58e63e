import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PolicyRequirement {
  id: string;
  policy_id: string;
  description: string;
  resolved: boolean;
  created_by: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAllPolicyRequirements() {
  return useQuery({
    queryKey: ['policy-requirements'],
    queryFn: async (): Promise<PolicyRequirement[]> => {
      const { data, error } = await supabase
        .from('policy_requirements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PolicyRequirement[];
    },
  });
}

export function usePolicyRequirement(policyId: string | undefined) {
  return useQuery({
    queryKey: ['policy-requirement', policyId],
    queryFn: async (): Promise<PolicyRequirement | null> => {
      if (!policyId) return null;
      const { data, error } = await supabase
        .from('policy_requirements')
        .select('*')
        .eq('policy_id', policyId)
        .maybeSingle();
      if (error) throw error;
      return (data as PolicyRequirement | null) ?? null;
    },
    enabled: !!policyId,
  });
}

export function useUpsertPolicyRequirement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      policyId,
      description,
    }: {
      policyId: string;
      description: string;
    }) => {
      if (!user) throw new Error('No auth');
      const { error } = await supabase
        .from('policy_requirements')
        .upsert(
          {
            policy_id: policyId,
            description,
            resolved: false,
            resolved_at: null,
            resolved_by: null,
            created_by: user.id,
          },
          { onConflict: 'policy_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['policy-requirements'] });
      qc.invalidateQueries({ queryKey: ['policy-requirement', vars.policyId] });
    },
  });
}

export function useResolvePolicyRequirement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (policyId: string) => {
      if (!user) throw new Error('No auth');
      const { error } = await supabase
        .from('policy_requirements')
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('policy_id', policyId);
      if (error) throw error;
    },
    onSuccess: (_d, policyId) => {
      qc.invalidateQueries({ queryKey: ['policy-requirements'] });
      qc.invalidateQueries({ queryKey: ['policy-requirement', policyId] });
    },
  });
}

export function useDeletePolicyRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (policyId: string) => {
      const { error } = await supabase
        .from('policy_requirements')
        .delete()
        .eq('policy_id', policyId);
      if (error) throw error;
    },
    onSuccess: (_d, policyId) => {
      qc.invalidateQueries({ queryKey: ['policy-requirements'] });
      qc.invalidateQueries({ queryKey: ['policy-requirement', policyId] });
    },
  });
}
