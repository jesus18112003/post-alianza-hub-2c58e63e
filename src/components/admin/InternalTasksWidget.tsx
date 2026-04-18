import { useState, useMemo, KeyboardEvent } from 'react';
import {
  useInternalTasks,
  useCreateInternalTask,
  useToggleInternalTask,
  useArchiveInternalTask,
  extractMentions,
  MENTION_MAP,
} from '@/hooks/useInternalTasks';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAuth } from '@/hooks/useAuth';
import { ListTodo, Send, Archive, Check } from 'lucide-react';
import { toast } from 'sonner';

const FILTER_KEYS = ['D', 'J', 'A', 'M'] as const;

export function InternalTasksWidget() {
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'D' | 'J' | 'A' | 'M'>('all');
  const [input, setInput] = useState('');

  useRealtimeSubscription('internal_tasks', [['internal_tasks']]);

  const filterArr = useMemo(() => {
    if (activeFilter === 'all') return undefined;
    if (activeFilter === 'mine') {
      const initial = (profile?.full_name || '').trim().charAt(0).toUpperCase();
      return FILTER_KEYS.includes(initial as any) ? [initial] : [];
    }
    return [activeFilter];
  }, [activeFilter, profile]);

  const { data: tasks, isLoading } = useInternalTasks(filterArr);
  const createTask = useCreateInternalTask();
  const toggle = useToggleInternalTask();
  const archive = useArchiveInternalTask();

  const previewMentions = useMemo(() => extractMentions(input), [input]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    createTask.mutate(text, {
      onSuccess: () => {
        setInput('');
      },
      onError: (e: any) => toast.error(e?.message || 'Error al crear tarea'),
    });
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-accent" />
          <h3 className="text-base text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Tareas del Equipo
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {tasks?.filter((t) => !t.status).length ?? 0} pendientes
        </span>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-accent/40">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Nueva tarea... usa #D #J #A #M para mencionar"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || createTask.isPending}
            className="p-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        {previewMentions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {previewMentions.map((m) => (
              <MentionPill key={m} code={m} />
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
          Todas
        </FilterChip>
        <FilterChip active={activeFilter === 'mine'} onClick={() => setActiveFilter('mine')}>
          Mis Tareas
        </FilterChip>
        {FILTER_KEYS.map((k) => (
          <FilterChip key={k} active={activeFilter === k} onClick={() => setActiveFilter(k)}>
            {MENTION_MAP[k].name}
          </FilterChip>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {isLoading && <p className="text-xs text-muted-foreground">Cargando...</p>}
        {!isLoading && (tasks?.length ?? 0) === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">Sin tareas por aquí.</p>
        )}
        {tasks?.map((t) => (
          <div
            key={t.id}
            className={`group rounded-lg border border-border/60 bg-background/40 p-2.5 flex items-start gap-2 ${
              t.status ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() => toggle.mutate({ id: t.id, status: !t.status })}
              className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                t.status
                  ? 'bg-accent border-accent text-accent-foreground'
                  : 'border-muted-foreground/40 hover:border-accent'
              }`}
            >
              {t.status && <Check className="h-3 w-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${t.status ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {t.content}
              </p>
              {t.mentions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {t.mentions.map((m) => (
                    <MentionPill key={m} code={m} />
                  ))}
                </div>
              )}
            </div>
            {t.status && (
              <button
                onClick={() => archive.mutate(t.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                title="Archivar"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MentionPill({ code }: { code: string }) {
  const info = MENTION_MAP[code];
  if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${info.color}`}>
      <span className="opacity-70">@</span>
      {info.name}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-accent/15 border-accent/40 text-accent'
          : 'bg-background/40 border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
