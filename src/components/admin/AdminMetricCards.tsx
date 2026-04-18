import { TrendingUp, Wallet, FileText, Clock } from 'lucide-react';

interface AdminMetricCardsProps {
  totalBankAmount: number;
  policiesEmitted: number;
  pendingCases: number;
}

export function AdminMetricCards({ totalBankAmount, policiesEmitted, pendingCases }: AdminMetricCardsProps) {
  // Goal for emitted policies progress bar (visual only)
  const emittedGoal = Math.max(50, Math.ceil(policiesEmitted / 10) * 10 + 10);
  const emittedPct = Math.min(100, (policiesEmitted / emittedGoal) * 100);
  // Pending alert level (visual only): >50 considered high
  const pendingPct = Math.min(100, (pendingCases / Math.max(pendingCases, 100)) * 100);

  return (
    <div className="space-y-4">
      {/* Hero card — Entró al Banco */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent)/0.85)] px-7 py-6 text-accent-foreground shadow-lg shadow-black/10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-foreground/70">
              Entró al Banco
            </span>
            <p
              className="text-5xl font-semibold tracking-tight tabular-nums leading-none"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              ${totalBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/10 px-3 py-1 text-[11px] font-medium text-accent-foreground/90 backdrop-blur-sm">
              <TrendingUp className="h-3 w-3" />
              Total acumulado
            </div>
          </div>

          {/* Decorative icon */}
          <div className="hidden sm:flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-foreground/5">
            <Wallet className="h-10 w-10 text-accent-foreground/15" strokeWidth={1.5} />
          </div>
        </div>

        {/* Soft glow */}
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-accent-foreground/5 blur-3xl" />
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pólizas Emitidas */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md hover:shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pólizas Emitidas
            </span>
            <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className="text-4xl font-semibold tracking-tight tabular-nums text-card-foreground leading-none"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              {policiesEmitted}
            </p>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${emittedPct}%` }}
            />
          </div>
        </div>

        {/* Casos Pendientes */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md hover:shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Casos Pendientes
            </span>
            <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className="text-4xl font-semibold tracking-tight tabular-nums text-card-foreground leading-none"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              {pendingCases}
            </p>
            <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Alerta
            </span>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-destructive/70 transition-all"
              style={{ width: `${pendingPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
