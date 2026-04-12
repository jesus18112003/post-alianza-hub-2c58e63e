import { DollarSign, FileText, Clock, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  totalCommission: number;
  policiesEmitted: number;
  pendingCases: number;
  totalAnnualPremium?: number;
  totalBankAmount?: number;
}

export function MetricCards({ totalCommission, policiesEmitted, pendingCases, totalAnnualPremium, totalBankAmount }: MetricCardsProps) {
  const cards = [
    {
      title: 'Comisión Total',
      value: `$${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      accent: true,
    },
    {
      title: 'Pólizas Emitidas',
      value: policiesEmitted.toString(),
      icon: FileText,
      accent: false,
    },
    {
      title: 'Casos Pendientes',
      value: pendingCases.toString(),
      icon: Clock,
      accent: false,
    },
    ...(totalAnnualPremium !== undefined
      ? [
          {
            title: 'Total Annual Premium',
            value: `$${totalAnnualPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            accent: true,
          },
        ]
      : []),
    ...(totalBankAmount !== undefined
      ? [
          {
            title: 'Entró al Banco',
            value: `$${totalBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            accent: true,
          },
        ]
      : []),
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cards.length > 3 ? 'lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-lg border border-border bg-card p-5 space-y-3 transition-shadow hover:shadow-md hover:shadow-black/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {card.title}
            </span>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p
            className={`text-2xl font-semibold tracking-tight ${
              card.accent ? 'text-accent' : 'text-card-foreground'
            }`}
            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}