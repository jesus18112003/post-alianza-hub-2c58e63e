import { DollarSign, FileText, Clock, TrendingUp, Target } from 'lucide-react';

interface AdminMetricCardsProps {
  totalBankAmount: number;
  policiesEmitted: number;
  pendingCases: number;
}

export function AdminMetricCards({ totalBankAmount, policiesEmitted, pendingCases }: AdminMetricCardsProps) {
  const cards = [
    {
      title: 'Entró al Banco',
      value: `$${totalBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Total acumulado',
      icon: DollarSign,
      accent: true,
    },
    {
      title: 'Pólizas Emitidas',
      value: policiesEmitted.toString(),
      subtitle: '98% cumplimiento meta',
      icon: FileText,
      accent: false,
    },
    {
      title: 'Casos Pendientes',
      value: pendingCases.toString(),
      subtitle: 'Promedio 4h de espera',
      icon: Clock,
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-xl border border-border bg-card p-5 space-y-3 transition-shadow hover:shadow-md hover:shadow-black/10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                {card.title}
              </span>
            </div>
            <p
              className={`text-3xl font-semibold tracking-tight ${
                card.accent ? 'text-accent' : 'text-card-foreground'
              }`}
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {card.accent && <TrendingUp className="h-3 w-3 text-green-500" />}
              {!card.accent && <Target className="h-3 w-3 text-muted-foreground" />}
              {card.subtitle}
            </p>
            {/* Decorative icon */}
            <Icon className="absolute right-4 top-4 h-12 w-12 text-muted-foreground/5" />
          </div>
        );
      })}
    </div>
  );
}
