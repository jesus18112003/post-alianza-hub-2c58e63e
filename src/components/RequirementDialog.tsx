import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  usePolicyRequirement,
  useUpsertPolicyRequirement,
  useDeletePolicyRequirement,
} from '@/hooks/usePolicyRequirements';
import { toast } from 'sonner';

interface Props {
  policyId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequirementDialog({ policyId, clientName, open, onOpenChange }: Props) {
  const { data: req } = usePolicyRequirement(policyId);
  const upsert = useUpsertPolicyRequirement();
  const del = useDeletePolicyRequirement();
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText(req && !req.resolved ? req.description : '');
  }, [open, req]);

  const handleSave = () => {
    if (!text.trim()) {
      toast.error('Describe qué necesita la póliza');
      return;
    }
    upsert.mutate(
      { policyId, description: text.trim() },
      {
        onSuccess: () => {
          toast.success('Requerimiento guardado');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al guardar'),
      }
    );
  };

  const handleRemove = () => {
    del.mutate(policyId, {
      onSuccess: () => {
        toast.success('Requerimiento eliminado');
        onOpenChange(false);
      },
      onError: () => toast.error('Error al eliminar'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Requerimiento Pendiente</DialogTitle>
          <DialogDescription>
            Describe qué necesita la póliza de <strong>{clientName}</strong>. Aparecerá en la sección de prioridad del panel.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: Falta enviar acta de nacimiento, validar identidad, confirmar pago..."
          rows={5}
          className="resize-none"
        />
        <DialogFooter className="flex sm:justify-between gap-2">
          {req && !req.resolved ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleRemove} disabled={del.isPending}>
              Quitar requerimiento
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
