import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Policy } from '@/types/policy';

export function usePolicies() {
  return useQuery({
    queryKey: ['policies'],
    queryFn: async (): Promise<Policy[]> => {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Policy[];
    },
  });
}