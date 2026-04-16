import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PolicyFollowup {
  id: string;
  policy_id: string;
  reason: string;
  due_date: string;
  notify_days_before: number;
  status: 'pending' | 'reviewed';
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const FOLLOWUP_TEMPLATES = [
  { reason: 'Revisión inicial', days: 5 },
  { reason: 'Revisando récords médicos', days: 7 },
  { reason: 'Esperando respuesta del cliente', days: 3 },
  { reason: 'En suscripción', days: 5 },
  { reason: 'Esperando emisión', days: 10 },
  { reason: 'Verificación de pago', days: 3 },
];

export function useAllFollowups() {
  return useQuery({
    queryKey: ['policy_followups'],
    queryFn: async (): Promise<PolicyFollowup[]> => {
      const { data, error } = await supabase
        .from('policy_followups')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PolicyFollowup[];
    },
  });
}

export function usePolicyFollowups(policyId: string | null | undefined) {
  return useQuery({
    queryKey: ['policy_followups', policyId],
    queryFn: async (): Promise<PolicyFollowup[]> => {
      if (!policyId) return [];
      const { data, error } = await supabase
        .from('policy_followups')
        .select('*')
        .eq('policy_id', policyId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PolicyFollowup[];
    },
    enabled: !!policyId,
  });
}

export function useCreateFollowup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { policy_id: string; reason: string; due_date: string; notify_days_before: number }) => {
      const { error } = await supabase.from('policy_followups').insert({
        ...input,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy_followups'] });
    },
  });
}

export function useReviewFollowup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('policy_followups')
        .update({ status: 'reviewed', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy_followups'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('policy_followups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy_followups'] });
    },
  });
}
