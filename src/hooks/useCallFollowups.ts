import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Policy } from '@/types/policy';
import { useAuth } from '@/hooks/useAuth';

const PAGE_SIZE = 50;

/**
 * Loads up to 50 policies marked for call follow-up that have a phone number.
 * Limit is enforced server-side to keep the Supabase Mini instance responsive.
 */
export function useCallFollowupPolicies() {
  return useQuery({
    queryKey: ['call-followup-policies'],
    queryFn: async (): Promise<Policy[]> => {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('needs_call_followup', true)
        .not('phone_number', 'is', null)
        .neq('phone_number', '')
        .order('updated_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return (data ?? []) as Policy[];
    },
  });
}

export function useToggleCallFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, value }: { policyId: string; value: boolean }) => {
      const { error } = await supabase
        .from('policies')
        .update({ needs_call_followup: value })
        .eq('id', policyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['call-followup-policies'] });
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      qc.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

/**
 * Logs a call by creating an internal task prefixed with #D so Diana
 * sees it in the Tareas del Equipo widget.
 */
export function useLogCall() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      policy,
      note,
    }: {
      policy: Policy;
      note: string;
    }) => {
      if (!user) throw new Error('No user');
      const trimmed = note.trim();
      if (!trimmed) throw new Error('La nota no puede estar vacía');
      const content = `#D Llamada · ${policy.client_name} (${policy.company}${
        policy.phone_number ? ` · ${policy.phone_number}` : ''
      }) — ${trimmed}`;
      const { error } = await supabase.from('internal_tasks').insert({
        content,
        mentions: ['D'],
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internal_tasks'] });
    },
  });
}
