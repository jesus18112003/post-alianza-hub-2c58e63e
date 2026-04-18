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
 *  2) Appending an automated entry to the policy's notes field with the
 *     format: "Llamada realizada el DD/MM/YYYY - <resumen> #D".
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

      const today = format(new Date(), 'dd/MM/yyyy');
      const taskContent = `#D Llamada · ${policy.client_name} (${policy.company}${
        policy.phone_number ? ` · ${policy.phone_number}` : ''
      }) — ${trimmed}`;

      // 1) Create internal task for Diana
      const { error: taskErr } = await supabase.from('internal_tasks').insert({
        content: taskContent,
        mentions: ['D'],
        created_by: user.id,
      });
      if (taskErr) throw taskErr;

      // 2) Append entry to policy notes (with #D hashtag)
      const newEntry = `Llamada realizada el ${today} - ${trimmed} #D`;
      const updatedNotes = policy.notes ? `${policy.notes}\n${newEntry}` : newEntry;

      const updates: Record<string, unknown> = {
        notes: updatedNotes,
        notes_updated_at: new Date().toISOString(),
      };
      if (scheduledDate !== undefined) {
        updates.scheduled_call_date = scheduledDate;
      }

      const { error: polErr } = await supabase
        .from('policies')
        .update(updates as never)
        .eq('id', policy.id);
      if (polErr) throw polErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internal_tasks'] });
      qc.invalidateQueries({ queryKey: ['call-followup-policies'] });
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      qc.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}
