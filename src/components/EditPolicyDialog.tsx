import { useState } from 'react';
import { Policy } from '@/types/policy';
import { useUpdatePolicy } from '@/hooks/useAdminData';
import { STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditPolicyDialogProps {
  policy: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPolicyDialog({ policy, open, onOpenChange }: EditPolicyDialogProps) {
  const updatePolicy = useUpdatePolicy();

  const [form, setForm] = useState({
    date: policy.date,
    company: policy.company,
    client_name: policy.client_name,
    status: policy.status as PolicyStatus,
    policy_number: policy.policy_number ?? '',
    policy_type: policy.policy_type ?? '',
    payment_method: policy.payment_method ?? '',
    location: policy.location ?? '',
    target_premium: policy.target_premium?.toString() ?? '',
    agent_premium: policy.agent_premium?.toString() ?? '',
    total_commission: policy.total_commission?.toString() ?? '',
    notes: policy.notes ?? '',
    phone_number: policy.phone_number ?? '',
    collection_date: policy.collection_date ?? '',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.company.trim() || !form.client_name.trim()) {
      toast.error('Compañía y Nombre del Cliente son obligatorios');
      return;
    }

    updatePolicy.mutate(
      {
        policyId: policy.id,
        updates: {
          date: form.date,
          company: form.company.trim(),
          client_name: form.client_name.trim(),
          status: form.status,
          policy_number: form.policy_number.trim() || null,
          policy_type: form.policy_type.trim() || null,
          payment_method: form.payment_method.trim() || null,
          location: form.location.trim() || null,
          target_premium: form.target_premium ? parseFloat(form.target_premium) : null,
          agent_premium: form.agent_premium ? parseFloat(form.agent_premium) : null,
          total_commission: form.total_commission ? parseFloat(form.total_commission) : null,
          notes: form.notes.trim() || null,
          phone_number: form.phone_number.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Póliza actualizada');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al actualizar'),
      }
    );
  };

  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-accent" style={{ fontFamily: "'Georgia', serif" }}>
            Editar Póliza
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Required fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-primary uppercase tracking-widest">Datos Principales</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fecha</Label>
                <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {allStatuses.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Compañía *</Label>
              <Input value={form.company} onChange={(e) => set('company', e.target.value)}
                className="bg-secondary border-border text-foreground text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre del Cliente *</Label>
              <Input value={form.client_name} onChange={(e) => set('client_name', e.target.value)}
                className="bg-secondary border-border text-foreground text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nro. de Póliza</Label>
              <Input value={form.policy_number} onChange={(e) => set('policy_number', e.target.value)}
                placeholder="Pendiente" className="bg-secondary border-border text-foreground text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Teléfono del Cliente</Label>
              <Input value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)}
                placeholder="Ej: +1 (555) 123-4567" className="bg-secondary border-border text-foreground text-sm" />
            </div>
          </div>

          {/* Financial */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-primary uppercase tracking-widest">Datos Financieros</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Target Premium</Label>
                <Input type="number" step="0.01" value={form.target_premium}
                  onChange={(e) => set('target_premium', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Agent Premium</Label>
                <Input type="number" step="0.01" value={form.agent_premium}
                  onChange={(e) => set('agent_premium', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Comisión Total</Label>
                <Input type="number" step="0.01" value={form.total_commission}
                  onChange={(e) => set('total_commission', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
            </div>
          </div>

          {/* Technical */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-primary uppercase tracking-widest">Detalles Técnicos</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo de Póliza</Label>
                <Input value={form.policy_type} onChange={(e) => set('policy_type', e.target.value)}
                  placeholder="Ej: FEX" className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Método de Pago</Label>
                <Input value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ubicación</Label>
                <Input value={form.location} onChange={(e) => set('location', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notas</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
              rows={3} className="bg-secondary border-border text-foreground text-sm resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updatePolicy.isPending}>
            {updatePolicy.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
