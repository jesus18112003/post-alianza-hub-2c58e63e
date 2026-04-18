import { useState, useMemo } from 'react';
import { Phone, PhoneCall, Check, MessageSquare, Users, ChevronDown, CalendarIcon, Sparkles } from 'lucide-react';
import {
  useCallFollowupPolicies,
  useToggleCallFollowup,
  useSetScheduledCallDate,
} from '@/hooks/useCallFollowups';
import { useAgentProfiles } from '@/hooks/useAdminData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Policy } from '@/types/policy';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogCallDialog } from './LogCallDialog';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CallFollowupPage() {
  const { data: policies, isLoading } = useCallFollowupPolicies();
  const { data: agents } = useAgentProfiles();
  const toggle = useToggleCallFollowup();
  const setSchedule = useSetScheduledCallDate();
  const [callPolicy, setCallPolicy] = useState<Policy | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [agentDropdown, setAgentDropdown] = useState(false);
  const [openCalFor, setOpenCalFor] = useState<string | null>(null);

  useRealtimeSubscription('policies', [['call-followup-policies']]);

  const agentMap: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    (agents ?? []).forEach((a) => {
      m[a.id] = a.full_name || a.username || 'Sin nombre';
    });
    return m;
  }, [agents]);

  // Only agents with at least one followup in this list
  const agentsWithFollowups = useMemo(() => {
    const ids = new Set((policies ?? []).map((p) => p.agent_id));
    return (agents ?? []).filter((a) => ids.has(a.id));
  }, [policies, agents]);

  const filteredPolicies = useMemo(() => {
    const base = policies ?? [];
    const list = agentFilter === 'all' ? base : base.filter((p) => p.agent_id === agentFilter);
    // Sort: overdue first, then today, then upcoming by date asc, then unscheduled
    return [...list].sort((a, b) => {
      const ad = a.scheduled_call_date ? parseISO(a.scheduled_call_date).getTime() : Infinity;
      const bd = b.scheduled_call_date ? parseISO(b.scheduled_call_date).getTime() : Infinity;
      return ad - bd;
    });
  }, [policies, agentFilter]);

  const todayCount = useMemo(
    () =>
      (filteredPolicies ?? []).filter(
        (p) => p.scheduled_call_date && isToday(parseISO(p.scheduled_call_date))
      ).length,
    [filteredPolicies]
  );

  const handleResolve = (policy: Policy) => {
    toggle.mutate(
      { policyId: policy.id, value: false },
      {
        onSuccess: () => toast.success('Removido de seguimiento'),
        onError: () => toast.error('Error al actualizar'),
      }
    );
  };

  const handleSchedule = (policy: Policy, date: Date | undefined) => {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : null;
    setSchedule.mutate(
      { policyId: policy.id, date: dateStr },
      {
        onSuccess: () => {
          toast.success(date ? `Programada para ${format(date, 'dd MMM yyyy', { locale: es })}` : 'Fecha eliminada');
          setOpenCalFor(null);
        },
        onError: () => toast.error('Error al programar'),
      }
    );
  };

  const selectedAgentLabel =
    agentFilter === 'all' ? 'Todos los Agentes' : agentMap[agentFilter] ?? 'Agente';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="text-2xl text-accent tracking-tight flex items-center gap-2"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            <PhoneCall className="h-5 w-5" />
            Seguimiento de Llamadas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pólizas marcadas para gestión telefónica · máx. 50 contactos
            {todayCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-medium">
                <Sparkles className="h-3 w-3" />
                {todayCount} para hoy
              </span>
            )}
          </p>
        </div>

        {/* Agent filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setAgentDropdown(!agentDropdown)}
            className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 min-w-[12rem]"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate flex-1 text-left">{selectedAgentLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {agentDropdown && (
            <div className="absolute top-full right-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-[14rem] max-h-[18rem] overflow-y-auto">
              <button
                onClick={() => { setAgentFilter('all'); setAgentDropdown(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 ${agentFilter === 'all' ? 'bg-secondary/40 text-primary' : 'text-foreground'}`}
              >
                Todos los Agentes ({(policies ?? []).length})
              </button>
              {agentsWithFollowups.map((a) => {
                const count = (policies ?? []).filter((p) => p.agent_id === a.id).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => { setAgentFilter(a.id); setAgentDropdown(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 flex justify-between gap-2 ${agentFilter === a.id ? 'bg-secondary/40 text-primary' : 'text-foreground'}`}
                  >
                    <span className="truncate">{a.full_name || a.username}</span>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : !filteredPolicies || filteredPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <Phone className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay pólizas marcadas para seguimiento de llamadas.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Activa el ícono de teléfono en cualquier póliza para añadirla aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredPolicies.map((p) => {
              const sched = p.scheduled_call_date ? parseISO(p.scheduled_call_date) : null;
              const todayFlag = sched && isToday(sched);
              const overdue = sched && isPast(sched) && !isToday(sched);
              const upcoming = sched && isFuture(sched);

              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors',
                    todayFlag && 'bg-amber-500/5 border-l-2 border-l-amber-400/60',
                    overdue && 'bg-rose-500/5 border-l-2 border-l-rose-400/60'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-card-foreground truncate font-medium">
                        {p.client_name}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-secondary-foreground">{p.company}</span>
                      {todayFlag && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase tracking-wide">
                          Hoy
                        </span>
                      )}
                      {overdue && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold uppercase tracking-wide">
                          Vencida
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span>Agente: {agentMap[p.agent_id] ?? '—'}</span>
                      <span>·</span>
                      <span>{format(parseISO(p.date), 'dd MMM yyyy', { locale: es })}</span>
                      {p.policy_number && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">{p.policy_number}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Schedule date picker */}
                  <Popover open={openCalFor === p.id} onOpenChange={(o) => setOpenCalFor(o ? p.id : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          'h-8 px-2 text-xs gap-1.5',
                          todayFlag && 'text-amber-300',
                          overdue && 'text-rose-300',
                          upcoming && 'text-sky-300',
                          !sched && 'text-muted-foreground'
                        )}
                        title="Programar llamada"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {sched ? format(sched, 'dd MMM', { locale: es }) : 'Programar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="end">
                      <Calendar
                        mode="single"
                        selected={sched ?? undefined}
                        onSelect={(d) => handleSchedule(p, d)}
                        initialFocus
                        locale={es}
                        className={cn('p-3 pointer-events-auto')}
                      />
                      {sched && (
                        <div className="p-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => handleSchedule(p, undefined)}
                          >
                            Quitar fecha
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  {p.phone_number && (
                    <a
                      href={`tel:${p.phone_number.replace(/[^\d+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs tabular-nums"
                      title="Llamar"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {p.phone_number}
                    </a>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => setCallPolicy(p)}
                    title="Registrar gestión"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Registrar
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-emerald-400"
                    onClick={() => handleResolve(p)}
                    disabled={toggle.isPending}
                    title="Marcar como gestionado"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {callPolicy && (
        <LogCallDialog
          policy={callPolicy}
          open={!!callPolicy}
          onOpenChange={(open) => !open && setCallPolicy(null)}
        />
      )}
    </div>
  );
}
