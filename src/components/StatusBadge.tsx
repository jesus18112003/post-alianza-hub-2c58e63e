import { Policy } from '@/types/policy';

export type PolicyStatus = Policy['status'];

export const STATUS_CONFIG: Record<PolicyStatus, { label: string; className: string }> = {
  // ... (tus estados anteriores)
  emitido: {
    label: 'Emitido',
    className: 'bg-[hsl(var(--status-emitido))] text-white',
  },
  cobrado: {
    label: 'Cobrado',
    className: 'bg-[hsl(var(--status-cobrado))] text-white',
  },
  pendiente: {
    label: 'Pendiente',
    className: 'bg-[hsl(var(--status-pendiente))] text-white',
  },
  fondo_insuficiente: {
    label: 'Fondo Insuficiente',
    className: 'bg-[hsl(var(--status-fondo-insuficiente))] text-white',
  },
  descalificado: {
    label: 'Descalificado',
    className: 'bg-[hsl(var(--status-descalificado))] text-white',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-[hsl(var(--status-cancelado))] text-white',
  },
  chargeback: {
    label: 'Chargeback',
    className: 'bg-[hsl(var(--status-chargeback))] text-white',
  },
  // NUEVO ESTADO AGREGADO
  aprobado: {
    label: 'Aprobado',
    className: 'bg-[hsl(var(--status-aprobado,142_70%_45%))] text-white', 
  },
  no_seguimiento: {
    label: 'No Seguimiento',
    className: 'bg-[hsl(var(--status-no-seguimiento))] text-white',
  },
};

export function StatusBadge({ status }: { status: PolicyStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
