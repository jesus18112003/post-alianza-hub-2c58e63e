import { useState } from 'react';
import { useCreatePolicy } from '@/hooks/useAdminData';
import { STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreatePolicyDialogProps {
  agentId: string;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COMMISSION_RATE = 55;

export function CreatePolicyDialog({ agentId, agentName, open, onOpenChange }: CreatePolicyDialogProps) {
  const createPolicy = useCreatePolicy();

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    company: '',
    client_name: '',
    status: 'pendiente' as PolicyStatus,
    policy_number: '',
    policy_type: '',
    payment_method: '',
    location: '',
    target_premium: '',
    prima_payment: '',
    total_commission: '',
    bank_amount: '',
    notes: '',
    phone_number: '',
    collection_date: '',
    commission_rate: DEFAULT_COMMISSION_RATE.toString(),
  });

  const set = (key: string, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'target_premium' || key === 'commission_rate') {
        const tp = parseFloat(key === 'target_premium' ? value : next.target_premium);
        const rate = parseFloat(key === 'commission_rate' ? value : next.commission_rate) / 100;
        if (!isNaN(tp) && tp > 0) {
          next.prima_payment = (Math.round((tp / 12) * 100) / 100).toString();
          if (!isNaN(rate)) {
            next.total_commission = (Math.round(tp * rate * 100) / 100).toString();
          }
        }
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      company: '',
      client_name: '',
      status: 'pendiente',
      policy_number: '',
      policy_type: '',
      payment_method: '',
      location: '',
      target_premium: '',
      prima_payment: '',
      total_commission: '',
      bank_amount: '',
      notes: '',
      phone_number: '',
      collection_date: '',
      commission_rate: DEFAULT_COMMISSION_RATE.toString(),
    });
  };

  const handleSave = () => {
    if (!form.company.trim() || !form.client_name.trim()) {
      toast.error('Compañía y Nombre del Cliente son obligatorios');
      return;
    }

    createPolicy.mutate(
      {
        agent_id: agentId,
        date: form.date,
        company: form.company.trim(),
        client_name: form.client_name.trim(),
        status: form.status,
        policy_number: form.policy_number.trim() || null,
        policy_type: form.policy_type.trim() || null,
        payment_method: form.payment_method.trim() || null,
        location: form.location.trim() || null,
        target_premium: form.target_premium ? parseFloat(form.target_premium) : null,
        prima_payment: form.prima_payment ? parseFloat(form.prima_payment) : null,
        total_commission: form.total_commission ? parseFloat(form.total_commission) : null,
        bank_amount: form.bank_amount ? parseFloat(form.bank_amount) : null,
        notes: form.notes.trim() || null,
        phone_number: form.phone_number.trim() || null,
        collection_date: form.collection_date || null,
      },
      {
        onSuccess: () => {
          toast.success('Póliza creada exitosamente');
          resetForm();
          onOpenChange(false);
        },
        onError: () => toast.error('Error al crear la póliza'),
      }
    );
  };

  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-accent" style={{ fontFamily: "'Georgia', serif" }}>
            Nueva Póliza
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Para: {agentName}</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
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
                <select value={form.status} onChange={(e) => set('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha de Cobro</Label>
              <Input type="date" value={form.collection_date} onChange={(e) => set('collection_date', e.target.value)}
                className="bg-secondary border-border text-foreground text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-medium text-primary uppercase tracking-widest">Datos Financieros</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Annual Premium</Label>
                <Input type="number" step="0.01" value={form.target_premium}
                  onChange={(e) => set('target_premium', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">% Comisión</Label>
                <Input type="number" step="1" value={form.commission_rate}
                  onChange={(e) => set('commission_rate', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pago de Prima</Label>
                <Input type="number" step="0.01" value={form.prima_payment}
                  onChange={(e) => set('prima_payment', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
                <p className="text-[10px] text-muted-foreground/60">Auto: Annual Premium ÷ 12</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Comisión Total</Label>
                <Input type="number" step="0.01" value={form.total_commission}
                  onChange={(e) => set('total_commission', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
                <p className="text-[10px] text-muted-foreground/60">Auto: Annual Premium × %</p>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Entró al Banco</Label>
                <Input type="number" step="0.01" value={form.bank_amount}
                  onChange={(e) => set('bank_amount', e.target.value)}
                  className="bg-secondary border-border text-foreground text-sm" />
              </div>
            </div>
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notas</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
              rows={3} className="bg-secondary border-border text-foreground text-sm resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSave} disabled={createPolicy.isPending}>
            {createPolicy.isPending ? 'Creando...' : 'Crear Póliza'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

