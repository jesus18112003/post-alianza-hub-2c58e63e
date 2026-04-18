import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the admin-only `internal_notes` value for a policy via a
 * SECURITY DEFINER RPC. Returns null if the caller is not an admin.
 */
export function useInternalNotes(policyId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['internal-notes', policyId],
    enabled: !!policyId && enabled,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc('get_policy_internal_notes', {
        _policy_id: policyId!,
      });
      if (error) throw error;
      return (data as string | null) ?? '';
    },
  });
}

export function useSetInternalNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, notes }: { policyId: string; notes: string }) => {
      const { error } = await supabase.rpc('set_policy_internal_notes', {
        _policy_id: policyId,
        _notes: notes,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['internal-notes', vars.policyId] });
    },
  });
}
