import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Policy } from '@/types/policy';
import { Copy, Plus, Trash2, Check, Search } from 'lucide-react';
import { toast } from 'sonner';

type ListColor = 'green' | 'orange' | 'red';

interface ListItem {
  id: string;
  clientName: string;
  company: string;
  notes: string;
  color: ListColor;
  policyId?: string;
}

const COLOR_EMOJI: Record<ListColor, string> = {
  green: '🟢',
  orange: '🟠',
  red: '🔴',
};

const COLOR_LABELS: Record<ListColor, string> = {
  green: 'En revisión / Sin pendientes',
  orange: 'Requerimientos pendientes',
  red: 'Cancelado / Descalificado',
};

// Map policy status to default list color
function statusToColor(status: Policy['status']): ListColor {
  if (status === 'cancelado' || status === 'descalificado') return 'red';
  if (status === 'emitido' || status === 'cobrado' || status === 'aprobado') return 'green';
  return 'orange'; // pendiente, fondo_insuficiente, chargeback
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentPolicies: Policy[];
  agentName: string;
}

export function GeneralListDialog({ open, onOpenChange, agentPolicies, agentName }: Props) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Auto-generate list when dialog opens
  const initializeList = useCallback(() => {
    // Filter: only pendiente, chargeback, fondo_insuficiente; exclude cancelado/descalificado
    const eligible = agentPolicies
      .filter((p) =>
        p.status === 'pendiente' ||
        p.status === 'chargeback' ||
        p.status === 'fondo_insuficiente' ||
        p.status === 'emitido'
      )
      // Sort by date descending (most recent first)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const generated: ListItem[] = eligible.map((p) => ({
      id: crypto.randomUUID(),
      clientName: p.client_name,
      company: p.company,
      notes: p.notes ?? '',
      color: statusToColor(p.status),
      policyId: p.id,
    }));

    setItems(generated);
    setInitialized(true);
    setCopied(false);
    setShowAddPanel(false);
    setAddSearch('');
  }, [agentPolicies]);

  // Reset when dialog opens
  if (open && !initialized) {
    initializeList();
  }
  if (!open && initialized) {
    setInitialized(false);
  }

  // Group items by company
  const grouped = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.company]) groups[item.company] = [];
      groups[item.company].push(item);
    });
    // Sort companies alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  // Policies not yet in the list (for adding)
  const availableToAdd = useMemo(() => {
    const existingPolicyIds = new Set(items.filter((i) => i.policyId).map((i) => i.policyId));
    return agentPolicies
      .filter((p) => !existingPolicyIds.has(p.id))
      .filter((p) => p.status !== 'cancelado' && p.status !== 'descalificado')
      .filter((p) =>
        addSearch === '' ||
        p.client_name.toLowerCase().includes(addSearch.toLowerCase()) ||
        p.company.toLowerCase().includes(addSearch.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [agentPolicies, items, addSearch]);

  const updateItem = (id: string, updates: Partial<ListItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setCopied(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setCopied(false);
  };

  const addFromPolicy = (policy: Policy) => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        clientName: policy.client_name,
        company: policy.company,
        notes: policy.notes ?? '',
        color: statusToColor(policy.status),
        policyId: policy.id,
      },
    ]);
    setCopied(false);
  };

  // Generate the formatted text
  const generateText = useCallback(() => {
    let text = '';
    grouped.forEach(([company, companyItems]) => {
      text += `${company}\n\n`;
      companyItems.forEach((item) => {
        const emoji = COLOR_EMOJI[item.color];
        const notePart = item.notes ? `: ${item.notes}` : '';
        text += `${emoji}${item.clientName}${notePart}\n\n`;
      });
    });
    return text.trim();
  }, [grouped]);

  const handleCopy = async () => {
    const text = generateText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Lista copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const cycleColor = (current: ListColor): ListColor => {
    const order: ListColor[] = ['green', 'orange', 'red'];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
            Lista General — {agentName}
          </DialogTitle>
        </DialogHeader>

        {/* Color legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border border-border rounded-lg p-3 bg-secondary/30">
          {(Object.keys(COLOR_EMOJI) as ListColor[]).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className="text-sm">{COLOR_EMOJI[c]}</span>
              {COLOR_LABELS[c]}
            </span>
          ))}
        </div>

        {/* List items grouped by company */}
        {grouped.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No hay pólizas elegibles. Agrega clientes manualmente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([company, companyItems]) => (
              <div key={company}>
                <h4 className="text-sm font-semibold text-accent mb-2 tracking-wide">
                  {company}
                </h4>
                <div className="space-y-2">
                  {companyItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 group rounded-lg border border-border bg-card p-3"
                    >
                      {/* Color selector - click to cycle */}
                      <button
                        onClick={() => updateItem(item.id, { color: cycleColor(item.color) })}
                        className="text-lg shrink-0 mt-0.5 hover:scale-125 transition-transform active:scale-95"
                        title={`Color: ${COLOR_LABELS[item.color]}. Click para cambiar.`}
                      >
                        {COLOR_EMOJI[item.color]}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Input
                          value={item.clientName}
                          onChange={(e) => updateItem(item.id, { clientName: e.target.value })}
                          className="h-7 text-sm bg-transparent border-none px-1 focus-visible:ring-1"
                          placeholder="Nombre del cliente"
                        />
                        <Textarea
                          value={item.notes}
                          onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                          className="min-h-[2rem] text-xs bg-transparent border-none px-1 resize-none focus-visible:ring-1"
                          placeholder="Notas / seguimiento..."
                          rows={1}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add clients section */}
        <div className="border-t border-border pt-4 space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            <Plus className="h-3.5 w-3.5" />
            {showAddPanel ? 'Ocultar' : 'Agregar clientes'}
          </Button>

          {showAddPanel && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar póliza por cliente o compañía..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-secondary border-border"
                />
              </div>
              <div className="max-h-[12rem] overflow-y-auto space-y-1 rounded-lg border border-border bg-secondary/30 p-2">
                {availableToAdd.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No hay más pólizas disponibles
                  </p>
                ) : (
                  availableToAdd.slice(0, 30).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addFromPolicy(p)}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-secondary/80 transition-colors active:scale-[0.98]"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate">{p.client_name}</span>
                      <span className="text-muted-foreground ml-auto shrink-0">{p.company}</span>
                      <span className="text-muted-foreground shrink-0">
                        {COLOR_EMOJI[statusToColor(p.status)]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview & copy */}
        {items.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Vista previa
            </h4>
            <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[16rem] overflow-y-auto">
              {generateText()}
            </div>
            <Button onClick={handleCopy} className="w-full gap-2" size="sm">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar lista'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
