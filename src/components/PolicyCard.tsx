import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Policy } from '@/types/policy';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PolicyCardProps {
  policy: Policy;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm text-secondary-foreground" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
        {typeof value === 'number'
          ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : value}
      </span>
    </div>
  );
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const [open, setOpen] = useState(false);

  const formattedDate = format(new Date(policy.date + 'T12:00:00'), 'dd MMM yyyy', { locale: es });

  const hasFinancials = policy.target_premium || policy.agent_premium || policy.total_commission;
  const hasTechnical = policy.policy_type || policy.payment_method || policy.location;

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        open
          ? 'border-primary/30 bg-card shadow-lg shadow-black/10'
          : 'border-border bg-card hover:border-border/80 hover:shadow-md hover:shadow-black/5'
      }`}
    >
      {/* Main row — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors active:scale-[0.995]"
      >
        {/* Date */}
        <span
          className="text-xs text-muted-foreground w-[5.5rem] shrink-0"
          style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
        >
          {formattedDate}
        </span>

        {/* Company */}
        <span
          className="text-sm text-secondary-foreground w-[7rem] shrink-0 truncate"
          style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
        >
          {policy.company}
        </span>

        {/* Client Name */}
        <span className="text-sm text-card-foreground flex-1 truncate">
          {policy.client_name}
        </span>

        {/* Status */}
        <StatusBadge status={policy.status} />

        {/* Policy Number */}
        <span
          className="text-xs w-[7rem] shrink-0 text-right tabular-nums"
          style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
        >
          {policy.policy_number ? (
            <span className="text-secondary-foreground">{policy.policy_number}</span>
          ) : (
            <span className="text-muted-foreground italic">Pendiente</span>
          )}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable detail */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
            {/* Financial data */}
            {hasFinancials && (
              <div className="space-y-1">
                <h4
                  className="text-xs font-medium text-primary mb-2"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  Datos Financieros
                </h4>
                <DetailRow label="Target Premium" value={policy.target_premium} />
                <DetailRow label="Annual Premium" value={policy.agent_premium} />
                <DetailRow label="Comisión Total" value={policy.total_commission} />
              </div>
            )}

            {/* Technical details */}
            {hasTechnical && (
              <div className="space-y-1">
                <h4
                  className="text-xs font-medium text-primary mb-2"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  Detalles Técnicos
                </h4>
                <DetailRow label="Tipo de Póliza" value={policy.policy_type} />
                <DetailRow label="Método de Pago" value={policy.payment_method} />
                <DetailRow label="Ubicación" value={policy.location} />
              </div>
            )}

            {/* Notes */}
            {policy.notes && (
              <div className="space-y-1">
                <h4
                  className="text-xs font-medium text-primary mb-2"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  Notas
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {policy.notes}
                </p>
                {policy.notes_updated_at && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Nota actualizada: {format(new Date(policy.notes_updated_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}