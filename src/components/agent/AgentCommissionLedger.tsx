import { useMemo } from 'react';
import { Policy } from '@/types/policy';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  policies: Policy[];
  isLoading: boolean;
}

export function AgentCommissionLedger({ policies, isLoading }: Props) {
  const ledgerPolicies = useMemo(() => {
    return policies
      .filter((p) => p.status === 'cobrado' || p.status === 'chargeback')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [policies]);

  const totalCommission = useMemo(
    () => ledgerPolicies.reduce((sum, p) => sum + (p.bank_amount ?? 0), 0),
    [ledgerPolicies]
  );

  const totalChargeback = useMemo(
    () => ledgerPolicies.reduce((sum, p) => sum + (p.chargeback_amount ?? 0), 0),
    [ledgerPolicies]
  );

  const fmt = (v: number | null | undefined) =>
    v != null && v !== 0
      ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '-';

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h3
          className="text-lg text-accent tracking-tight"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          LIBRO DIARIO
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Comisiones cobradas y chargebacks a partir del 14 de abril 2026.
        </p>
      </div>

      {/* Table header */}
      <div className="px-5 py-2.5 border-b border-border/50 hidden sm:grid grid-cols-[6rem_8rem_1fr_9rem_8rem_8rem] gap-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
        <span>FECHA</span>
        <span>CARRIER</span>
        <span>NOMBRE DEL CLIENTE</span>
        <span>NÚMERO DE PÓLIZA</span>
        <span className="text-right">COMISIÓN</span>
        <span className="text-right">CHARGEBACK</span>
      </div>

      <div className="divide-y divide-border/30">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 h-12 animate-pulse" />
            ))}
          </div>
        ) : ledgerPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No hay registros de comisiones aún.
            </p>
          </div>
        ) : (
          ledgerPolicies.map((p) => {
            const formattedDate = format(
              new Date(p.date + 'T12:00:00'),
              'dd/MM/yyyy',
              { locale: es }
            );
            return (
              <div
                key={p.id}
                className="px-5 py-3 grid grid-cols-1 sm:grid-cols-[6rem_8rem_1fr_9rem_8rem_8rem] gap-2 sm:gap-4 items-center hover:bg-secondary/30 transition-colors"
              >
                <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {formattedDate}
                </span>
                <span className="text-sm text-secondary-foreground">{p.company}</span>
                <span className="text-sm text-card-foreground">{p.client_name}</span>
                <span className="text-sm text-muted-foreground">{p.policy_number ?? '-'}</span>
                <span className="text-sm text-right text-card-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {p.status === 'cobrado' ? fmt(p.bank_amount) : '-'}
                </span>
                <span className="text-sm text-right text-destructive" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {p.chargeback_amount ? fmt(p.chargeback_amount) : '-'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Totals */}
      {!isLoading && ledgerPolicies.length > 0 && (
        <div className="px-5 py-3 border-t border-border grid grid-cols-1 sm:grid-cols-[6rem_8rem_1fr_9rem_8rem_8rem] gap-2 sm:gap-4 items-center bg-secondary/20">
          <span />
          <span />
          <span />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium text-right">
            TOTALES
          </span>
          <span className="text-sm font-semibold text-right text-accent" style={{ fontFamily: "'Inter', sans-serif" }}>
            {fmt(totalCommission)}
          </span>
          <span className="text-sm font-semibold text-right text-destructive" style={{ fontFamily: "'Inter', sans-serif" }}>
            {fmt(totalChargeback)}
          </span>
        </div>
      )}
    </div>
  );
}
