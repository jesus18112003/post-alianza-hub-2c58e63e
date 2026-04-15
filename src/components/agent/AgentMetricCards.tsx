import { DollarSign, FileText, Clock, TrendingUp, Users } from 'lucide-react';

interface AgentMetricCardsProps {
  totalCommission: number;
  policiesEmitted: number;
  pendingCases: number;
  totalAnnualPremium: number;
  totalBankAmount: number;
}

export function AgentMetricCards({
  totalCommission,
  policiesEmitted,
  pendingCases,
  totalAnnualPremium,
  totalBankAmount,
}: AgentMetricCardsProps) {
  const cards = [
    {
      title: 'COMISIÓN TOTAL',
      value: `$${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: totalCommission > 0 ? (
        <span className="flex items-center gap-1 text-green-500">
          <TrendingUp className="h-3 w-3" />
          Acumulado
        </span>
      ) : null,
      icon: DollarSign,
      accent: true,
    },
    {
      title: 'PÓLIZAS EMITIDAS',
      value: policiesEmitted.toString(),
      subtitle: <span className="text-muted-foreground">En periodo</span>,
      icon: FileText,
      accent: false,
    },
    {
      title: 'CASOS PENDIENTES',
      value: pendingCases.toString(),
      subtitle: pendingCases > 0 ? (
        <span className="text-orange-500">! Requiere acción</span>
      ) : (
        <span className="text-muted-foreground">Sin pendientes</span>
      ),
      icon: Clock,
      accent: pendingCases > 0,
    },
    {
      title: 'ANNUAL PREMIUM',
      value: `$${totalAnnualPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: <span className="text-muted-foreground">Acumulado anual</span>,
      icon: TrendingUp,
      accent: false,
    },
    {
      title: 'ENTRÓ AL BANCO',
      value: `$${totalBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: <span className="text-muted-foreground">Total depositado</span>,
      icon: DollarSign,
      accent: true,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border">
        {cards.map((card) => (
          <div key={card.title} className="px-5 py-4 space-y-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              {card.title}
            </span>
            <p
              className={`text-2xl font-semibold tracking-tight ${
                card.accent ? 'text-accent' : 'text-card-foreground'
              }`}
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              {card.value}
            </p>
            <div className="text-xs">{card.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
