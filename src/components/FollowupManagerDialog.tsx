import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Policy } from '@/types/policy';
import {
  usePolicyFollowups,
  useCreateFollowup,
  useReviewFollowup,
  useDeleteFollowup,
  FOLLOWUP_TEMPLATES,
} from '@/hooks/usePolicyFollowups';
import { Check, Trash2, Clock, Plus } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface FollowupManagerDialogProps {
  policy: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const d = result.getDay();
    if (d !== 0 && d !== 6) added++;
  }
  return result;
}

export function FollowupManagerDialog({ policy, open, onOpenChange }: FollowupManagerDialogProps) {
  const { data: followups = [] } = usePolicyFollowups(policy.id);
  const createFollowup = useCreateFollowup();
  const reviewFollowup = useReviewFollowup();
  const deleteFollowup = useDeleteFollowup();

  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 5), 'yyyy-MM-dd'));
  const [notifyDays, setNotifyDays] = useState(1);

  const applyTemplate = (tmpl: typeof FOLLOWUP_TEMPLATES[number]) => {
    setReason(tmpl.reason);
    setDueDate(format(addBusinessDays(new Date(), tmpl.days), 'yyyy-MM-dd'));
  };

  const handleCreate = () => {
    if (!reason.trim()) {
      toast.error('Escribe una razón');
      return;
    }
    createFollowup.mutate(
      { policy_id: policy.id, reason: reason.trim(), due_date: dueDate, notify_days_before: notifyDays },
      {
        onSuccess: () => {
          toast.success('Seguimiento agregado');
          setReason('');
          setDueDate(format(addDays(new Date(), 5), 'yyyy-MM-dd'));
          setNotifyDays(1);
        },
        onError: () => toast.error('Error al crear seguimiento'),
      }
    );
  };

  const pending = followups.filter((f) => f.status === 'pending');
  const reviewed = followups.filter((f) => f.status === 'reviewed');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-accent" style={{ fontFamily: "'Georgia', serif" }}>
            Tiempos de Espera
          </DialogTitle>
          <DialogDescription>
            {policy.client_name} · {policy.company}
          </DialogDescription>
        </DialogHeader>

        {/* Active followups */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Pendientes</h4>
            {pending.map((f) => {
              const days = differenceInDays(parseISO(f.due_date), new Date());
              const overdue = days < 0;
              return (
                <div
                  key={f.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    overdue ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-secondary/30'
                  }`}
                >
                  <Clock className={`h-4 w-4 shrink-0 ${overdue ? 'text-destructive' : 'text-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{f.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {format(parseISO(f.due_date), 'dd MMM yyyy', { locale: es })} ·{' '}
                      <span className={overdue ? 'text-destructive font-semibold' : ''}>
                        {overdue ? `Vencido hace ${Math.abs(days)}d` : days === 0 ? 'Hoy' : `en ${days}d`}
                      </span>{' '}
                      · Avisar {f.notify_days_before}d antes
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-emerald-500 hover:text-emerald-400"
                    onClick={() =>
                      reviewFollowup.mutate(f.id, {
                        onSuccess: () => toast.success('Marcado como revisado'),
                      })
                    }
                  >
                    <Check className="h-4 w-4 mr-1" /> Revisado
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteFollowup.mutate(f.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new */}
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Agregar seguimiento</h4>

          <div>
            <Label className="text-xs text-muted-foreground">Plantillas rápidas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FOLLOWUP_TEMPLATES.map((t) => (
                <button
                  key={t.reason}
                  onClick={() => applyTemplate(t)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {t.reason} · {t.days}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <Label htmlFor="reason" className="text-xs">Razón</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Revisando récords médicos"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="due" className="text-xs">Fecha límite</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notify" className="text-xs">Avisar antes</Label>
              <Input
                id="notify"
                type="number"
                min={0}
                max={30}
                value={notifyDays}
                onChange={(e) => setNotifyDays(parseInt(e.target.value) || 0)}
                className="mt-1 w-24"
              />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={createFollowup.isPending} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Agregar seguimiento
          </Button>
        </div>

        {/* History */}
        {reviewed.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Historial</h4>
            {reviewed.slice(0, 5).map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="line-through">{f.reason}</span>
                <span>· {format(parseISO(f.due_date), 'dd MMM yyyy', { locale: es })}</span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
