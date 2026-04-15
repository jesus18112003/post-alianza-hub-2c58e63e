import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClosingAssignment {
  id: string;
  discord_message_id: string;
  raw_message: string;
  amount: number | null;
  company: string | null;
  policy_type: string | null;
  payment_method: string | null;
  location: string | null;
  client_name: string | null;
  status: string;
  assigned_agent_id: string | null;
  created_policy_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useClosingAssignments() {
  return useQuery({
    queryKey: ['closing-assignments'],
    queryFn: async (): Promise<ClosingAssignment[]> => {
      const { data, error } = await supabase
        .from('closing_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClosingAssignment[];
    },
  });
}

export function usePollDiscord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('discord-poll');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-assignments'] });
    },
  });
}

export function useAssignClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      agentId,
      customDate,
    }: {
      assignmentId: string;
      agentId: string;
      customDate?: string;
    }) => {
      // Create the policy from assignment data
      const { data: assignment, error: fetchErr } = await supabase
        .from('closing_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      if (fetchErr) throw fetchErr;

      // Use custom date, or fallback to the date the discord message was created
      const policyDate = customDate || assignment.created_at.split('T')[0];

      const { data: policy, error: policyErr } = await supabase
        .from('policies')
        .insert({
          agent_id: agentId,
          company: assignment.company || 'Sin asignar',
          client_name: assignment.client_name || 'Sin nombre',
          status: 'pendiente',
          policy_type: assignment.policy_type,
          payment_method: assignment.payment_method,
          target_premium: assignment.amount ?? null,
          prima_payment: assignment.amount ? Math.round((assignment.amount / 12) * 100) / 100 : null,
          total_commission: null,
          date: policyDate,
          location: assignment.location || null,
        })
        .select('id')
        .single();
      if (policyErr) throw policyErr;

      // Update assignment as assigned
      const { error: updateErr } = await supabase
        .from('closing_assignments')
        .update({
          status: 'assigned',
          assigned_agent_id: agentId,
          created_policy_id: policy.id,
        })
        .eq('id', assignmentId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
    },
  });
}

export function useDismissAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('closing_assignments')
        .update({ status: 'dismissed' })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-assignments'] });
    },
  });
}


