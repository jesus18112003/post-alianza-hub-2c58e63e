import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Policy } from '@/types/policy';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const PAGE_SIZE = 50;

/**
 * Loads up to 50 policies marked for call follow-up that have a phone number.
 * Ordered with overdue/today first, then upcoming scheduled, then unscheduled.
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
        .order('scheduled_call_date', { ascending: true, nullsFirst: false })
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

/** Updates the scheduled call date for a policy. Pass null to clear. */
export function useSetScheduledCallDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, date }: { policyId: string; date: string | null }) => {
      const { error } = await supabase
        .from('policies')
        .update({ scheduled_call_date: date })
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
 * Logs a call by:
 *  1) Creating an internal task prefixed with #D so Diana sees it.
 *  2) Inserting a row into `policy_call_logs` (separate from client notes).
 *  3) Optionally updating scheduled_call_date.
 */
export function useLogCall() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      policy,
      note,
      scheduledDate,
    }: {
      policy: Policy;
      note: string;
      scheduledDate?: string | null;
    }) => {
      if (!user) throw new Error('No user');
      const trimmed = note.trim();
      if (!trimmed) throw new Error('La nota no puede estar vacía');

      const today = format(new Date(), 'yyyy-MM-dd');
      const taskContent = `#D Llamada · ${policy.client_name} (${policy.company}${
        policy.phone_number ? ` · ${policy.phone_number}` : ''
      }) — ${trimmed}`;

      // 1) Internal task for Diana
      const { error: taskErr } = await supabase.from('internal_tasks').insert({
        content: taskContent,
        mentions: ['D'],
        created_by: user.id,
      });
      if (taskErr) throw taskErr;

      // 2) Call log entry (separate table — does NOT touch policy.notes)
      const { error: logErr } = await supabase.from('policy_call_logs').insert({
        policy_id: policy.id,
        created_by: user.id,
        note: trimmed,
        call_date: today,
      });
      if (logErr) throw logErr;

      // 3) Optionally update scheduled date
      if (scheduledDate !== undefined) {
        const { error: polErr } = await supabase
          .from('policies')
          .update({ scheduled_call_date: scheduledDate })
          .eq('id', policy.id);
        if (polErr) throw polErr;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['internal_tasks'] });
      qc.invalidateQueries({ queryKey: ['call-followup-policies'] });
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      qc.invalidateQueries({ queryKey: ['policies'] });
      qc.invalidateQueries({ queryKey: ['policy-call-logs', vars.policy.id] });
    },
  });
}

/** Fetch call logs for a single policy (admin view). */
export function usePolicyCallLogs(policyId: string | null) {
  return useQuery({
    queryKey: ['policy-call-logs', policyId],
    enabled: !!policyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_call_logs')
        .select('*')
        .eq('policy_id', policyId!)
        .order('call_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
