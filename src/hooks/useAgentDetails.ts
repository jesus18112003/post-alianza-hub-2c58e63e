import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentDetails {
  id: string;
  agent_id: string;
  ssn: string | null;
  date_of_birth: string | null;
  personal_email: string | null;
  secondary_email: string | null;
}

export interface ProducerNumber {
  id: string;
  agent_id: string;
  company: string;
  producer_number: string;
}

export interface PortalCredential {
  id: string;
  agent_id: string;
  portal_name: string;
  portal_username: string;
  portal_password: string;
}

export function useAgentDetails(agentId: string) {
  return useQuery({
    queryKey: ['agent-details', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_details')
        .select('*')
        .eq('agent_id', agentId)
        .maybeSingle();
      if (error) throw error;
      return data as AgentDetails | null;
    },
    enabled: !!agentId,
  });
}

export function useProducerNumbers(agentId: string) {
  return useQuery({
    queryKey: ['producer-numbers', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_producer_numbers')
        .select('*')
        .eq('agent_id', agentId)
        .order('company');
      if (error) throw error;
      return (data ?? []) as ProducerNumber[];
    },
    enabled: !!agentId,
  });
}

export function usePortalCredentials(agentId: string) {
  return useQuery({
    queryKey: ['portal-credentials', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_portal_credentials')
        .select('*')
        .eq('agent_id', agentId)
        .order('portal_name');
      if (error) throw error;
      return (data ?? []) as PortalCredential[];
    },
    enabled: !!agentId,
  });
}

export function useUpsertAgentDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, details }: { agentId: string; details: Partial<AgentDetails> }) => {
      const { error } = await supabase
        .from('agent_details')
        .upsert({ agent_id: agentId, ...details }, { onConflict: 'agent_id' });
      if (error) throw error;
    },
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ['agent-details', agentId] });
    },
  });
}

export function useUpsertProducerNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string; agent_id: string; company: string; producer_number: string }) => {
      if (row.id) {
        const { error } = await supabase
          .from('agent_producer_numbers')
          .update({ company: row.company, producer_number: row.producer_number })
          .eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agent_producer_numbers')
          .insert({ agent_id: row.agent_id, company: row.company, producer_number: row.producer_number });
        if (error) throw error;
      }
    },
    onSuccess: (_, row) => {
      qc.invalidateQueries({ queryKey: ['producer-numbers', row.agent_id] });
    },
  });
}

export function useDeleteProducerNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase.from('agent_producer_numbers').delete().eq('id', id);
      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      qc.invalidateQueries({ queryKey: ['producer-numbers', agentId] });
    },
  });
}

export function useUpsertPortalCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string; agent_id: string; portal_name: string; portal_username: string; portal_password: string }) => {
      if (row.id) {
        const { error } = await supabase
          .from('agent_portal_credentials')
          .update({ portal_name: row.portal_name, portal_username: row.portal_username, portal_password: row.portal_password })
          .eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agent_portal_credentials')
          .insert({ agent_id: row.agent_id, portal_name: row.portal_name, portal_username: row.portal_username, portal_password: row.portal_password });
        if (error) throw error;
      }
    },
    onSuccess: (_, row) => {
      qc.invalidateQueries({ queryKey: ['portal-credentials', row.agent_id] });
    },
  });
}

export function useDeletePortalCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase.from('agent_portal_credentials').delete().eq('id', id);
      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      qc.invalidateQueries({ queryKey: ['portal-credentials', agentId] });
    },
  });
}
