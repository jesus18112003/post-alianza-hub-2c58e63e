import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarrierTotalsCarrier {
  id: string;
  agent_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface CarrierTotalsEntry {
  id: string;
  agent_id: string;
  carrier_id: string;
  entry_date: string;
  amount: number;
}

export interface CarrierTotalsAccess {
  agent_id: string;
  enabled: boolean;
}

/* ============================ ACCESS ============================ */

export function useCarrierTotalsAccess(agentId: string | undefined) {
  return useQuery({
    queryKey: ['carrier-totals-access', agentId],
    queryFn: async (): Promise<CarrierTotalsAccess | null> => {
      if (!agentId) return null;
      const { data, error } = await supabase
        .from('carrier_totals_access')
        .select('*')
        .eq('agent_id', agentId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!agentId,
  });
}

export function useSetCarrierTotalsAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, enabled }: { agentId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('carrier_totals_access')
        .upsert({ agent_id: agentId, enabled }, { onConflict: 'agent_id' });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['carrier-totals-access', vars.agentId] });
    },
  });
}

/* ============================ CARRIERS ============================ */

export function useCarriers(agentId: string | undefined) {
  return useQuery({
    queryKey: ['carrier-totals-carriers', agentId],
    queryFn: async (): Promise<CarrierTotalsCarrier[]> => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from('carrier_totals_carriers')
        .select('*')
        .eq('agent_id', agentId)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CarrierTotalsCarrier[];
    },
    enabled: !!agentId,
  });
}

export function useAddCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, name, position }: { agentId: string; name: string; position: number }) => {
      const { error } = await supabase
        .from('carrier_totals_carriers')
        .insert({ agent_id: agentId, name: name.trim().toUpperCase(), position });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['carrier-totals-carriers', vars.agentId] });
    },
  });
}

export function useDeleteCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; agentId: string }) => {
      const { error } = await supabase.from('carrier_totals_carriers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['carrier-totals-carriers', vars.agentId] });
      qc.invalidateQueries({ queryKey: ['carrier-totals-entries', vars.agentId] });
    },
  });
}

/* ============================ ENTRIES ============================ */

export function useCarrierEntries(agentId: string | undefined) {
  return useQuery({
    queryKey: ['carrier-totals-entries', agentId],
    queryFn: async (): Promise<CarrierTotalsEntry[]> => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from('carrier_totals_entries')
        .select('*')
        .eq('agent_id', agentId)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CarrierTotalsEntry[];
    },
    enabled: !!agentId,
  });
}

export function useUpsertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      carrierId,
      entryDate,
      amount,
    }: {
      agentId: string;
      carrierId: string;
      entryDate: string;
      amount: number;
    }) => {
      // If amount is 0/empty and entry exists, delete it. Else upsert.
      if (!amount || Number.isNaN(amount)) {
        const { error } = await supabase
          .from('carrier_totals_entries')
          .delete()
          .eq('carrier_id', carrierId)
          .eq('entry_date', entryDate);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from('carrier_totals_entries')
        .upsert(
          { agent_id: agentId, carrier_id: carrierId, entry_date: entryDate, amount },
          { onConflict: 'carrier_id,entry_date' }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['carrier-totals-entries', vars.agentId] });
    },
  });
}
