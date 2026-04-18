import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InternalTask {
  id: string;
  content: string;
  status: boolean;
  mentions: string[];
  archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const MENTION_MAP: Record<string, { name: string; color: string }> = {
  D: { name: 'Diana', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  J: { name: 'Jesus', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  A: { name: 'Ariadna', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  M: { name: 'Melody', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
};

export function extractMentions(text: string): string[] {
  const re = /#([DJAM])\b/gi;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1].toUpperCase());
  }
  return Array.from(set);
}

export function useInternalTasks(filter?: string[]) {
  return useQuery({
    queryKey: ['internal_tasks', filter ?? []],
    queryFn: async () => {
      let q = supabase
        .from('internal_tasks')
        .select('*')
        .eq('archived', false)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (filter && filter.length > 0) {
        q = q.overlaps('mentions', filter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as InternalTask[];
    },
  });
}

export function useCreateInternalTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('No user');
      const mentions = extractMentions(content);
      const { error } = await supabase.from('internal_tasks').insert({
        content,
        mentions,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal_tasks'] }),
  });
}

export function useToggleInternalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase.from('internal_tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal_tasks'] }),
  });
}

export function useArchiveInternalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('internal_tasks').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal_tasks'] }),
  });
}
