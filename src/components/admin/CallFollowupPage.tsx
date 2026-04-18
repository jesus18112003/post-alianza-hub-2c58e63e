import { useState } from 'react';
import { Phone, PhoneCall, Check, MessageSquare } from 'lucide-react';
import { useCallFollowupPolicies, useToggleCallFollowup } from '@/hooks/useCallFollowups';
import { useAgentProfiles } from '@/hooks/useAdminData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Policy } from '@/types/policy';
import { Button } from '@/components/ui/button';
import { LogCallDialog } from './LogCallDialog';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function CallFollowupPage() {
  const { data: policies, isLoading } = useCallFollowupPolicies();
  const { data: agents } = useAgentProfiles();
  const toggle = useToggleCallFollowup();
  const [callPolicy, setCallPolicy] = useState<Policy | null>(null);

  // Realtime: refresh when any policy flag flips
  useRealtimeSubscription('policies', [['call-followup-policies']]);

  const agentMap: Record<string, string> = {};
  (agents ?? []).forEach((a) => {
    agentMap[a.id] = a.full_name || a.username || 'Sin nombre';
  });

  const handleResolve = (policy: Policy) => {
    toggle.mutate(
      { policyId: policy.id, value: false },
      {
        onSuccess: () => toast.success('Removido de seguimiento'),
        onError: () => toast.error('Error al actualizar'),
      }
    );
  };

  return (
    <div className="space-y-6">
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
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : !policies || policies.length === 0 ? (
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
            {policies.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-card-foreground truncate font-medium">
                      {p.client_name}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-secondary-foreground">{p.company}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
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
            ))}
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
