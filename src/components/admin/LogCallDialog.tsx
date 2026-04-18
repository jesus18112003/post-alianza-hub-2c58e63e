import { useState } from 'react';
import { Policy } from '@/types/policy';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLogCall, useToggleCallFollowup } from '@/hooks/useCallFollowups';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';

interface LogCallDialogProps {
  policy: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogCallDialog({ policy, open, onOpenChange }: LogCallDialogProps) {
  const [note, setNote] = useState('');
  const [resolveAfter, setResolveAfter] = useState(false);
  const logCall = useLogCall();
  const toggleFlag = useToggleCallFollowup();

  const handleSave = () => {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error('Escribe una nota antes de guardar');
      return;
    }
    logCall.mutate(
      { policy, note: trimmed },
      {
        onSuccess: async () => {
          if (resolveAfter) {
            try {
              await toggleFlag.mutateAsync({ policyId: policy.id, value: false });
            } catch (e) {
              // not fatal, the call was logged
            }
          }
          toast.success('Llamada registrada y enviada a #Diana');
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
              Se guarda en Tareas del Equipo con <span className="text-rose-300 font-semibold">#D</span> para Diana.
            </p>
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
