import { useState } from 'react';
import { Policy } from '@/types/policy';
import { StatusBadge, STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';
import { useUpdatePolicyStatus, useDeletePolicy } from '@/hooks/useAdminData';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, Trash2, Check, X, Pencil, Phone, AlertTriangle, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditPolicyDialog } from '@/components/EditPolicyDialog';
import { WelcomeMessageDialog } from '@/components/WelcomeMessageDialog';
import { toast } from 'sonner';

interface AdminPolicyRowProps {
  policy: Policy;
  agentName: string;
}

export function AdminPolicyRow({ policy, agentName }: AdminPolicyRowProps) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const updateStatus = useUpdatePolicyStatus();
  const deletePolicy = useDeletePolicy();

  const formattedDate = format(new Date(policy.date + 'T12:00:00'), 'dd MMM yyyy', { locale: es });
  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];

  const handleStatusChange = (newStatus: PolicyStatus) => {
    updateStatus.mutate(
      { policyId: policy.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Estado actualizado a "${STATUS_CONFIG[newStatus].label}"`);
          setStatusOpen(false);
        },
        onError: () => toast.error('Error al actualizar el estado'),
      }
    );
  };

  const handleDelete = () => {
    deletePolicy.mutate(policy.id, {
      onSuccess: () => toast.success('Póliza eliminada'),
      onError: () => toast.error('Error al eliminar'),
    });
  };

  const hasFinancials = policy.target_premium || policy.prima_payment || policy.total_commission || policy.bank_amount;
  const hasTechnical = policy.policy_type || policy.payment_method || policy.location;

  // Collection date countdown
  const collectionCountdown = (() => {
    if (!policy.collection_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const collDate = parseISO(policy.collection_date);
    const days = differenceInDays(collDate, today);
    if (days < 0) return { days, label: 'Vencido', urgent: true };
    if (days === 0) return { days: 0, label: 'Hoy', urgent: true };
    if (days <= 5) return { days, label: `${days}d`, urgent: days <= 3 };
    return { days, label: `${days}d`, urgent: false };
  })();

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        open
          ? 'border-primary/30 bg-card shadow-lg shadow-black/10'
          : 'border-border bg-card hover:border-border/80 hover:shadow-md hover:shadow-black/5'
      }`}
    >
      {/* Main row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:scale-[0.995]"
      >
        <span className="text-xs text-muted-foreground w-[5rem] shrink-0 tabular-nums">
          {formattedDate}
        </span>
        <span className="text-xs text-primary/70 w-[6rem] shrink-0 truncate">
          {agentName}
        </span>
        <span className="text-sm text-secondary-foreground w-[5.5rem] shrink-0 truncate">
          {policy.company}
        </span>
        <span className="text-sm text-card-foreground flex-1 truncate">
          {policy.client_name}
        </span>
        {policy.phone_number && (
          <Phone className="h-3.5 w-3.5 text-green-500 shrink-0" />
        )}
        {collectionCountdown && collectionCountdown.days <= 5 && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
              collectionCountdown.urgent
                ? 'bg-destructive/15 text-destructive animate-pulse'
                : 'bg-amber-500/15 text-amber-500'
            }`}
          >
            <Clock className="h-3 w-3" />
            {collectionCountdown.label}
          </span>
        )}
        {policy.status === 'pendiente' && !policy.notes?.trim() && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 shrink-0" title="Pendiente sin notas">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Sin Nota</span>
          </span>
        )}
        <StatusBadge status={policy.status} />
        <span className="text-xs w-[7rem] shrink-0 text-right tabular-nums">
          {policy.policy_number ? (
            <span className="text-secondary-foreground">{policy.policy_number}</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Sin Nro.</span>
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded detail */}
      <div
        className={`transition-all duration-300 ease-out ${
          open ? 'max-h-[600px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-border/50">
          {/* Status changer */}
          <div className="flex items-center justify-between py-3 border-b border-border/30 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Cambiar Estado</span>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusOpen(!statusOpen);
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95"
                >
                  <StatusBadge status={policy.status} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>

                {statusOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-[10rem] max-h-[14rem] overflow-y-auto">
                    {allStatuses.map((s) => (
                      <button
                        key={s}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(s);
                        }}
                        disabled={updateStatus.isPending}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors hover:bg-secondary/60 active:scale-95 ${
                          policy.status === s ? 'bg-secondary/40' : ''
                        }`}
                      >
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Delete */}
            <div className="flex items-center gap-2">
              {/* Welcome message */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-green-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setWelcomeOpen(true);
                }}
                title="Mensaje de bienvenida"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>

              {/* Edit */}
              <Button
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              {/* Delete */}
              {confirmDelete ? (
                <>
                  <span className="text-xs text-destructive">¿Eliminar?</span>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={deletePolicy.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hasFinancials && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                  Datos Financieros
                </h4>
                <DetailItem label="Annual Premium" value={policy.target_premium} isCurrency />
                <DetailItem label="Pago de Prima" value={policy.prima_payment} isCurrency />
                <DetailItem label="Comisión Total" value={policy.total_commission} isCurrency />
                <DetailItem label="Adelanto de Comisión (75%)" value={policy.total_commission ? Math.round(policy.total_commission * 0.75 * 100) / 100 : null} isCurrency />
                <DetailItem label="Resto de Meses (25%)" value={policy.total_commission ? Math.round(policy.total_commission * 0.25 * 100) / 100 : null} isCurrency />
                <DetailItem label="Entró al Banco" value={policy.bank_amount} isCurrency />
              </div>
            )}
            {hasTechnical && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                  Detalles Técnicos
                </h4>
                <DetailItem label="Tipo de Póliza" value={policy.policy_type} />
                <DetailItem label="Método de Pago" value={policy.payment_method} />
                <DetailItem label="Ubicación" value={policy.location} />
              </div>
            )}
            {policy.notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                  Notas
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{policy.notes}</p>
                {policy.notes_updated_at && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Nota actualizada: {format(new Date(policy.notes_updated_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Agent info, phone & collection date */}
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">
              Agente: <span className="text-primary/80">{agentName}</span>
            </span>
            <div className="flex items-center gap-4">
              {policy.collection_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Cobro: <span className="text-secondary-foreground">{format(parseISO(policy.collection_date), 'dd MMM yyyy', { locale: es })}</span>
                  {collectionCountdown && (
                    <span className={`ml-1 font-semibold ${collectionCountdown.urgent ? 'text-destructive' : 'text-amber-500'}`}>
                      ({collectionCountdown.days < 0 ? 'Vencido' : collectionCountdown.days === 0 ? 'Hoy' : `en ${collectionCountdown.days} días`})
                    </span>
                  )}
                </span>
              )}
              {policy.phone_number && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 text-green-500" />
                  <span className="text-secondary-foreground">{policy.phone_number}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <EditPolicyDialog policy={policy} open={editOpen} onOpenChange={setEditOpen} />
      <WelcomeMessageDialog policy={policy} agentName={agentName} open={welcomeOpen} onOpenChange={setWelcomeOpen} />
    </div>
  );
}

function DetailItem({
  label,
  value,
  isCurrency,
}: {
  label: string;
  value: string | number | null | undefined;
  isCurrency?: boolean;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm text-secondary-foreground tabular-nums">
        {isCurrency && typeof value === 'number'
          ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : value}
      </span>
    </div>
  );
}


