import { useState } from 'react';
import { useAgentProfiles, useCreatePolicy } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ClipboardPaste, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

const COMPANY_MAP: Record<string, string> = {
  'AMAN': 'AMAM', 'AMAM': 'AMAM',
  'MOO': 'MUTUAL OF OMAHA',
  'NLG': 'NL', 'NL': 'NL',
  'COB': 'Corebridge',
  'AMERICO': 'AMERICO',
};

const COMMISSION_RATES: Record<string, number> = {
  default: 0.55,
};

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC','PR',
]);

function parseClosingMessage(raw: string) {
  const match = raw.trim().match(
    /^\$?([\d,]+(?:\.\d+)?)\s+(\S+)\s+(\S+)\s+(.+?)\s+\(([^)]+)\)\s*(.*)$/
  );
  if (!match) return null;
  const amount = parseFloat(match[1].replace(/,/g, ''));
  let company = match[2].toUpperCase();
  company = COMPANY_MAP[company] || company;
  const policyType = match[3].toUpperCase();
  const paymentMethod = match[4].trim();
  let clientName = match[5].trim();
  const trailing = match[6]?.trim().toUpperCase() || '';

  // Detect state: could be trailing after () or leading/trailing inside ()
  let location: string | null = null;

  if (US_STATES.has(trailing)) {
    location = trailing;
  } else {
    // Check if state is at the end of client name: "(jose c justin AZ)"
    const lastWord = clientName.split(/\s+/).pop()?.toUpperCase() || '';
    if (US_STATES.has(lastWord)) {
      location = lastWord;
      clientName = clientName.replace(/\s+\S+\s*$/, '').trim();
    } else {
      // Check if state is at the beginning: "(AZ jose c justin)"
      const firstWord = clientName.split(/\s+/)[0]?.toUpperCase() || '';
      if (US_STATES.has(firstWord)) {
        location = firstWord;
        clientName = clientName.replace(/^\S+\s+/, '').trim();
      }
    }
  }

  return { amount, company, policyType, paymentMethod, clientName, location };
}

export function AddClosingByMessage() {
  const { data: agents } = useAgentProfiles();
  const createPolicy = useCreatePolicy();

  const [message, setMessage] = useState('');
  const [parsed, setParsed] = useState<{
    amount: string;
    company: string;
    policyType: string;
    paymentMethod: string;
    clientName: string;
    location: string;
    agentId: string;
    date: string;
    commissionRate: string;
  } | null>(null);

  const handleExtract = () => {
    if (!message.trim()) {
      toast.error('Pega un mensaje de cierre primero');
      return;
    }
    const result = parseClosingMessage(message);
    if (!result) {
      toast.error('No se pudo parsear el mensaje. Formato esperado: $Monto Compañía Tipo Método (Cliente)');
      return;
    }
    const rate = COMMISSION_RATES[result.company.toLowerCase()] ?? COMMISSION_RATES.default;
    setParsed({
      amount: result.amount.toString(),
      company: result.company,
      policyType: result.policyType,
      paymentMethod: result.paymentMethod,
      clientName: result.clientName,
      location: result.location || '',
      agentId: '',
      date: new Date().toISOString().split('T')[0],
      commissionRate: (rate * 100).toString(),
    });
  };

  const handleSave = () => {
    if (!parsed) return;
    if (!parsed.agentId) {
      toast.error('Selecciona un agente');
      return;
    }
    const amount = parseFloat(parsed.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número válido');
      return;
    }

    const rate = parseFloat(parsed.commissionRate) / 100;
    const annualPremium = amount; // Full value
    const primaPago = Math.round((annualPremium / 12) * 100) / 100;
    const totalCommission = Math.round(annualPremium * rate * 100) / 100;

    createPolicy.mutate(
      {
        agent_id: parsed.agentId,
        date: parsed.date,
        company: parsed.company.trim() || 'Sin asignar',
        client_name: parsed.clientName.trim() || 'Sin nombre',
        status: 'pendiente',
        policy_type: parsed.policyType.trim() || null,
        payment_method: parsed.paymentMethod.trim() || null,
        location: parsed.location.trim() || null,
        target_premium: annualPremium,
        prima_payment: primaPago,
        total_commission: totalCommission,
      },
      {
        onSuccess: () => {
          toast.success('Cierre guardado como póliza');
          setMessage('');
          setParsed(null);
        },
        onError: () => toast.error('Error al guardar el cierre'),
      }
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardPaste className="h-4 w-4 text-primary/70" />
        <h3 className="text-sm text-primary tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
          Agregar Cierre por Mensaje
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Pega el mensaje de cierre y se extraerán los datos automáticamente
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Mensaje de cierre</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ej: $2400 IUL Américo Upon Issue (Josefa Garcia) Tx"
          rows={3}
          className="bg-secondary border-border text-foreground text-sm resize-y"
        />
      </div>

      <Button onClick={handleExtract} size="sm" className="gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        Extraer datos
      </Button>

      {parsed && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-4">
          <p className="text-xs text-muted-foreground">Datos extraídos (editable):</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Agente <span className="text-destructive">*</span>
              </Label>
              <select
                value={parsed.agentId}
                onChange={(e) => setParsed({ ...parsed, agentId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleccionar agente</option>
                {(agents ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name || a.username || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Monto ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={parsed.amount}
                onChange={(e) => setParsed({ ...parsed, amount: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Carrier</Label>
              <Input
                value={parsed.company}
                onChange={(e) => setParsed({ ...parsed, company: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Producto</Label>
              <Input
                value={parsed.policyType}
                onChange={(e) => setParsed({ ...parsed, policyType: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Input
                value={parsed.clientName}
                onChange={(e) => setParsed({ ...parsed, clientName: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Forma de Pago</Label>
              <Input
                value={parsed.paymentMethod}
                onChange={(e) => setParsed({ ...parsed, paymentMethod: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Estado (Location)</Label>
              <Input
                value={parsed.location}
                onChange={(e) => setParsed({ ...parsed, location: e.target.value })}
                placeholder="TX, FL, CA..."
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha del cierre</Label>
              <Input
                type="date"
                value={parsed.date}
                onChange={(e) => setParsed({ ...parsed, date: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">% Comisión</Label>
              <Input
                type="number"
                step="1"
                value={parsed.commissionRate}
                onChange={(e) => setParsed({ ...parsed, commissionRate: e.target.value })}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>

          {/* Preview calculations */}
          {parsed.amount && !isNaN(parseFloat(parsed.amount)) && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>Annual Premium: <strong className="text-accent">${parseFloat(parsed.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
              <span>Pago de Prima: <strong className="text-accent">${(parseFloat(parsed.amount) / 12).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
              <span>Comisión: <strong className="text-accent">${(parseFloat(parsed.amount) * (parseFloat(parsed.commissionRate || '55') / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={createPolicy.isPending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {createPolicy.isPending ? 'Guardando...' : 'Guardar Cierre'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
