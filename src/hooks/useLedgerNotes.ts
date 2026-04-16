import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LedgerNote {
  id: string;
  agent_id: string;
  policy_id: string;
  note: string;
  updated_at: string;
}

export function useLedgerNotes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['ledger_notes', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_notes')
        .select('*')
        .eq('agent_id', user!.id);
      if (error) throw error;
      return data as LedgerNote[];
    },
  });

  const map: Record<string, LedgerNote> = {};
  (query.data ?? []).forEach((n) => { map[n.policy_id] = n; });

  const upsert = useMutation({
    mutationFn: async ({ policy_id, note }: { policy_id: string; note: string }) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await supabase
        .from('ledger_notes')
        .upsert(
          { agent_id: user.id, policy_id, note },
          { onConflict: 'agent_id,policy_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ledger_notes', user?.id] });
      toast.success('Nota guardada');
    },
    onError: (e: Error) => toast.error('Error al guardar: ' + e.message),
  });

  return { notesByPolicy: map, isLoading: query.isLoading, upsert };
}
