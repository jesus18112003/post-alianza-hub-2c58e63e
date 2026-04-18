import { useState } from 'react';
import { Policy } from '@/types/policy';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLogCall, useToggleCallFollowup } from '@/hooks/useCallFollowups';
import { toast } from 'sonner';
import { Phone, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LogCallDialogProps {
  policy: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogCallDialog({ policy, open, onOpenChange }: LogCallDialogProps) {
  const [note, setNote] = useState('');
  const [resolveAfter, setResolveAfter] = useState(false);
  const [scheduled, setScheduled] = useState<Date | undefined>(
    policy.scheduled_call_date ? parseISO(policy.scheduled_call_date) : undefined
  );
  const [calOpen, setCalOpen] = useState(false);
  const logCall = useLogCall();
  const toggleFlag = useToggleCallFollowup();

  const handleSave = () => {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error('Escribe una nota antes de guardar');
      return;
    }
    const scheduledStr = scheduled ? format(scheduled, 'yyyy-MM-dd') : null;
    logCall.mutate(
      { policy, note: trimmed, scheduledDate: scheduledStr },
      {
        onSuccess: async () => {
          if (resolveAfter) {
            try {
              await toggleFlag.mutateAsync({ policyId: policy.id, value: false });
            } catch (e) {
              // not fatal
            }
          }
          toast.success('Llamada registrada y guardada en notas');
          setNote('');
          setResolveAfter(false);
          onOpenChange(false);
        },
        onError: (err: any) => toast.error(err?.message ?? 'Error al registrar'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-accent flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
            <Phone className="h-4 w-4 text-green-500" />
            Registrar Llamada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1">
            <div className="text-sm text-card-foreground font-medium">{policy.client_name}</div>
            <div className="text-xs text-muted-foreground">{policy.company}</div>
            {policy.phone_number && (
              <a
                href={`tel:${policy.phone_number.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 mt-1"
              >
                <Phone className="h-3 w-3" />
                {policy.phone_number}
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nota de la llamada</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Ej: Cliente confirmó datos, enviar carpeta hoy..."
              className="bg-secondary border-border text-foreground text-sm resize-none"
            />
            <p className="text-[10px] text-muted-foreground/70">
              Se guarda como <span className="text-rose-300 font-semibold">#D</span> en Tareas y en las notas del cliente.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Programar próxima llamada</Label>
            <div className="flex items-center gap-2">
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal text-xs h-9 bg-secondary border-border',
                      !scheduled && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {scheduled ? format(scheduled, "dd MMM yyyy", { locale: es }) : 'Sin fecha programada'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduled}
                    onSelect={(d) => { setScheduled(d); setCalOpen(false); }}
                    initialFocus
                    locale={es}
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
              {scheduled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground"
                  onClick={() => setScheduled(undefined)}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={resolveAfter}
              onChange={(e) => setResolveAfter(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            Marcar gestión completada (quitar de Seguimiento de Llamadas)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={logCall.isPending}>
            {logCall.isPending ? 'Guardando...' : 'Guardar Llamada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
