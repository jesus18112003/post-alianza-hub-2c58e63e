import { useMemo, useState } from 'react';
import { AlertTriangle, FileWarning, Truck, ShieldCheck, FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useAllPolicyRequirements,
  useResolvePolicyRequirement,
  useDeletePolicyRequirement,
  PolicyRequirement,
} from '@/hooks/usePolicyRequirements';
import { Policy } from '@/types/policy';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  policies: Policy[];
  agentMap: Record<string, string>;
}

const VISIBLE_COUNT = 3;

/** Pick an icon based on the first words of the requirement description. */
function pickIcon(description: string) {
  const d = description.toLowerCase();
  if (/(firm|ilustra|contrato|documento|acta|formul)/.test(d)) return FileWarning;
  if (/(deliver|envio|envío|entrega|paquete|recibo)/.test(d)) return Truck;
  if (/(kyc|identidad|valida|verifica)/.test(d)) return ShieldCheck;
  return FileText;
}

/** Build the short bold title (first line, max ~40 chars) and the rest as meta. */
function splitTitle(description: string) {
  const firstLine = description.split('\n')[0].trim();
  if (firstLine.length <= 48) return { title: firstLine, rest: '' };
  // Try to split at a natural break (period, comma) before 48 chars
  const cut = firstLine.slice(0, 48);
  const lastBreak = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '), cut.lastIndexOf(' '));
  const sliceAt = lastBreak > 20 ? lastBreak : 48;
  return { title: firstLine.slice(0, sliceAt).trim(), rest: firstLine.slice(sliceAt).trim() };
}

function shortAgo(date: string) {
  const s = formatDistanceToNowStrict(new Date(date), { locale: es });
  // Compact: "2 horas" -> "2h", "5 días" -> "5d", "30 minutos" -> "30m"
  return s
    .replace(/\s*minutos?/, 'm')
    .replace(/\s*horas?/, 'h')
    .replace(/\s*d[ií]as?/, 'd')
    .replace(/\s*meses?/, 'mo')
    .replace(/\s*a[ñn]os?/, 'y')
    .replace(/\s*segundos?/, 's');
}

interface CardProps {
  req: PolicyRequirement;
  policy: Policy;
  agentName: string;
  onResolve: () => void;
  onDelete: () => void;
  busy: boolean;
}

function RequirementCard({ req, policy, agentName, onResolve, onDelete, busy }: CardProps) {
  const Icon = pickIcon(req.description);
  const { title, rest } = splitTitle(req.description);
  const policyRef = policy.policy_number ? `#${policy.policy_number}` : `#${policy.id.slice(0, 6).toUpperCase()}`;
  const clientShort = (() => {
    const first = (policy.client_first_name || policy.client_name.split(' ')[0] || '').trim();
    const last = (policy.client_last_name || policy.client_name.split(' ').slice(1).join(' ') || '').trim();
    if (last) return `${first.charAt(0)}. ${last}`.trim();
    return policy.client_name;
  })();

  return (
    <div className="group relative flex items-start gap-3 rounded-lg border border-border/60 bg-card/80 px-3.5 py-3 shadow-sm transition-colors hover:border-destructive/40">
      {/* Icon badge */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <Icon className="h-4 w-4" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-card-foreground">
            {title}
            {rest && <span className="font-normal text-muted-foreground"> {rest}</span>}
          </p>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {shortAgo(req.created_at)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          <span>Policy: {policyRef}</span>
          <span className="mx-1.5">•</span>
          <span>Client: {clientShort}</span>
          <span className="mx-1.5">•</span>
          <span className="text-primary/80">{agentName}</span>
        </p>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10"
          title="Marcar como resuelto"
          onClick={onResolve}
          disabled={busy}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          title="Descartar"
          onClick={onDelete}
          disabled={busy}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function PriorityRequirements({ policies, agentMap }: Props) {
  const { data: requirements = [] } = useAllPolicyRequirements();
  const resolve = useResolvePolicyRequirement();
  const del = useDeletePolicyRequirement();
  const [historyOpen, setHistoryOpen] = useState(false);

  const policyMap = useMemo(() => {
    const m: Record<string, Policy> = {};
    policies.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [policies]);

  const active = useMemo(
    () => requirements.filter((r) => !r.resolved && policyMap[r.policy_id]),
    [requirements, policyMap]
  );

  if (active.length === 0) return null;

  const visible = active.slice(0, VISIBLE_COUNT);
  const hasMore = active.length > VISIBLE_COUNT;

  const handleResolve = (policyId: string) =>
    resolve.mutate(policyId, {
      onSuccess: () => toast.success('Requerimiento resuelto'),
      onError: () => toast.error('Error'),
    });

  const handleDelete = (policyId: string) =>
    del.mutate(policyId, {
      onSuccess: () => toast.success('Descartado'),
      onError: () => toast.error('Error'),
    });

  return (
    <>
      <section className="rounded-xl border border-destructive/30 bg-destructive/[0.04] p-4">
        {/* Header */}
        <header className="mb-3 flex items-center gap-2">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-destructive"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Prioridad — Requerimientos
          </h3>
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="ml-auto text-[11px] tabular-nums text-destructive/70">
            {active.length}
          </span>
        </header>

        {/* Cards */}
        <div className="space-y-2">
          {visible.map((req) => (
            <RequirementCard
              key={req.id}
              req={req}
              policy={policyMap[req.policy_id]}
              agentName={agentMap[policyMap[req.policy_id].agent_id] ?? 'Agente'}
              onResolve={() => handleResolve(req.policy_id)}
              onDelete={() => handleDelete(req.policy_id)}
              busy={resolve.isPending || del.isPending}
            />
          ))}
        </div>

        {/* Footer */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="mt-3 block w-full rounded-md border border-border/60 bg-background/40 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:border-destructive/40 hover:text-destructive"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Ver todo el historial
          </button>
        )}
      </section>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Georgia', serif" }}>
              Todos los Requerimientos Pendientes
            </DialogTitle>
            <DialogDescription>
              {active.length} requerimiento{active.length === 1 ? '' : 's'} activo{active.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {active.map((req) => (
              <RequirementCard
                key={req.id}
                req={req}
                policy={policyMap[req.policy_id]}
                agentName={agentMap[policyMap[req.policy_id].agent_id] ?? 'Agente'}
                onResolve={() => handleResolve(req.policy_id)}
                onDelete={() => handleDelete(req.policy_id)}
                busy={resolve.isPending || del.isPending}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
