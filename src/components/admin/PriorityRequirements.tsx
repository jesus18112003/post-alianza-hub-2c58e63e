import { useMemo } from 'react';
import { AlertOctagon, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAllPolicyRequirements, useResolvePolicyRequirement, useDeletePolicyRequirement } from '@/hooks/usePolicyRequirements';
import { Policy } from '@/types/policy';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  policies: Policy[];
  agentMap: Record<string, string>;
}

export function PriorityRequirements({ policies, agentMap }: Props) {
  const { data: requirements = [] } = useAllPolicyRequirements();
  const resolve = useResolvePolicyRequirement();
  const del = useDeletePolicyRequirement();

  const policyMap = useMemo(() => {
    const m: Record<string, Policy> = {};
    policies.forEach((p) => { m[p.id] = p; });
    return m;
  }, [policies]);

  const active = useMemo(
    () => requirements.filter((r) => !r.resolved && policyMap[r.policy_id]),
    [requirements, policyMap]
  );

  if (active.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertOctagon className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider" style={{ fontFamily: "'Georgia', serif" }}>
          Prioridad — Requerimientos Pendientes
        </h3>
        <span className="ml-auto text-xs text-destructive/80 tabular-nums">{active.length}</span>
      </div>
      <div className="space-y-2">
        {active.map((req) => {
          const policy = policyMap[req.policy_id];
          const agentName = agentMap[policy.agent_id] ?? 'Agente';
          return (
            <div
              key={req.id}
              className="flex items-start gap-3 rounded-md border border-destructive/20 bg-card px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-medium text-card-foreground">{policy.client_name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-secondary-foreground">{policy.company}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-primary/80">{agentName}</span>
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    hace {formatDistanceToNow(new Date(req.created_at), { locale: es })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                  {req.description}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-green-500 hover:bg-green-500/10"
                  title="Marcar como resuelto"
                  onClick={() =>
                    resolve.mutate(req.policy_id, {
                      onSuccess: () => toast.success('Requerimiento resuelto'),
                      onError: () => toast.error('Error'),
                    })
                  }
                  disabled={resolve.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Descartar"
                  onClick={() =>
                    del.mutate(req.policy_id, {
                      onSuccess: () => toast.success('Descartado'),
                      onError: () => toast.error('Error'),
                    })
                  }
                  disabled={del.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
