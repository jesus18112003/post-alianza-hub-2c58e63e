import { DollarSign, FileText, Clock, TrendingUp, Trophy, Landmark } from 'lucide-react';

interface AgentMetricCardsProps {
  totalCommission: number;
  policiesEmitted: number;
  pendingCases: number;
  totalAnnualPremium: number;
  totalBankAmount: number;
  agentName?: string;
}

const COMMISSION_ALLOWED_FIRST_NAMES = ['aneisali', 'nerio', 'alexander'];

export function AgentMetricCards({
  totalCommission,
  policiesEmitted,
  pendingCases,
  totalAnnualPremium,
  totalBankAmount,
  agentName,
}: AgentMetricCardsProps) {
  const firstName = (agentName ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  const showCommission = COMMISSION_ALLOWED_FIRST_NAMES.includes(firstName);
  const regularCards = [
    {
      title: 'PÓLIZAS EMITIDAS',
      value: policiesEmitted.toString(),
      subtitle: <span className="text-muted-foreground">En periodo</span>,
      icon: FileText,
    },
    {
      title: 'CASOS PENDIENTES',
      value: pendingCases.toString(),
      subtitle: pendingCases > 0 ? (
        <span className="text-destructive">! Requiere acción</span>
      ) : (
        <span className="text-muted-foreground">Sin pendientes</span>
      ),
      icon: Clock,
    },
    {
      title: 'ANNUAL PREMIUM',
      value: `$${totalAnnualPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: <span className="text-muted-foreground">Acumulado anual</span>,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hero cards for Comisión Total and Entró al Banco */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Comisión Total */}
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <div className="absolute top-3 right-3 rounded-full bg-primary/15 p-2.5">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold">
            COMISIÓN TOTAL
          </span>
          <p
            className="text-3xl font-bold tracking-tight text-accent mt-2"
            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
          >
            ${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          {totalCommission > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 mt-2">
              <TrendingUp className="h-3 w-3" />
              Acumulado
            </span>
          )}
        </div>

        {/* Entró al Banco */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6">
          <div className="absolute top-3 right-3 rounded-full bg-emerald-500/15 p-2.5">
            <Landmark className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/80 font-semibold">
            ENTRÓ AL BANCO
          </span>
          <p
            className="text-3xl font-bold tracking-tight text-accent mt-2"
            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
          >
            ${totalBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-muted-foreground mt-2 inline-block">Total depositado</span>
        </div>
      </div>

      {/* Regular metric cards */}
      <div className="rounded-xl border border-border bg-card p-1">
        <div className="grid grid-cols-3 divide-x divide-border">
          {regularCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="px-5 py-4 space-y-1">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  {card.title}
                </span>
                <p
                  className="text-2xl font-semibold tracking-tight text-card-foreground"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                >
                  {card.value}
                </p>
                <div className="text-xs">{card.subtitle}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
