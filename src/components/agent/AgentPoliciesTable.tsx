import { useState, useMemo } from 'react';
import { Policy } from '@/types/policy';
import { StatusBadge, STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';
import { Search, SlidersHorizontal, ChevronDown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgentPoliciesTableProps {
  policies: Policy[];
  isLoading: boolean;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm text-secondary-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
        {typeof value === 'number'
          ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : value}
      </span>
    </div>
  );
}

export function AgentPoliciesTable({ policies, isLoading }: AgentPoliciesTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<PolicyStatus>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        search === '' ||
        p.client_name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        (p.policy_number ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilters.size === 0 || statusFilters.has(p.status);
      return matchSearch && matchStatus;
    });
  }, [policies, search, statusFilters]);

  const displayed = showAll ? filtered : filtered.slice(0, 20);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
          Últimas Pólizas
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o nº..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-56 bg-secondary border-border text-sm placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${
              showFilters || statusFilters.size > 0
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      {showFilters && (
        <div className="px-5 py-3 border-b border-border/50 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilters(new Set())}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
              statusFilters.size === 0
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilters((prev) => {
                  const next = new Set(prev);
                  if (next.has(s)) next.delete(s);
                  else next.add(s);
                  return next;
                });
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
                statusFilters.has(s)
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}

      {/* Table header */}
      <div className="px-5 py-2.5 border-b border-border/50 hidden sm:grid grid-cols-[6rem_1fr_1fr_8rem_7rem_3rem] gap-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
        <span>FECHA</span>
        <span>EMPRESA</span>
        <span>CLIENTE</span>
        <span>Nº PÓLIZA</span>
        <span>ESTATUS</span>
        <span></span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 h-14 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              {search || statusFilters.size > 0
                ? 'No se encontraron pólizas con esos filtros.'
                : 'Aún no tienes pólizas registradas.'}
            </p>
          </div>
        ) : (
          displayed.map((policy) => {
            const isOpen = expandedId === policy.id;
            const formattedDate = format(new Date(policy.date + 'T12:00:00'), 'dd MMM, yyyy', { locale: es });
            const hasFinancials = policy.target_premium || policy.prima_payment || policy.total_commission || policy.bank_amount;
            const hasTechnical = policy.policy_type || policy.payment_method || policy.location;

            return (
              <div key={policy.id}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : policy.id)}
                  className="w-full px-5 py-3 grid grid-cols-1 sm:grid-cols-[6rem_1fr_1fr_8rem_7rem_3rem] gap-2 sm:gap-4 items-center text-left hover:bg-secondary/30 transition-colors active:scale-[0.998]"
                >
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {formattedDate}
                  </span>
                  <span className="text-sm text-secondary-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                      {policy.company.charAt(0)}
                    </span>
                    {policy.company}
                  </span>
                  <span className="text-sm text-card-foreground">{policy.client_name}</span>
                  <span className="text-xs tabular-nums">
                    {policy.policy_number ? (
                      <span className="text-secondary-foreground">{policy.policy_number}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-[10px] font-medium uppercase tracking-wide">Sin Nº</span>
                      </span>
                    )}
                  </span>
                  <StatusBadge status={policy.status} />
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 justify-self-end ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-4 pt-1 border-t border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
                      {hasFinancials && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                            Datos Financieros
                          </h4>
                          <DetailRow label="Annual Premium" value={policy.target_premium} />
                          <DetailRow label="Pago de Prima" value={policy.prima_payment} />
                          <DetailRow label="Comisión Total" value={policy.total_commission} />
                          <DetailRow label="Adelanto (75%)" value={policy.total_commission ? Math.round(policy.total_commission * 0.75 * 100) / 100 : null} />
                          <DetailRow label="Resto (25%)" value={policy.total_commission ? Math.round(policy.total_commission * 0.25 * 100) / 100 : null} />
                          <DetailRow label="Entró al Banco" value={policy.bank_amount} />
                        </div>
                      )}
                      {(hasTechnical || policy.collection_date || policy.folder_sent_date) && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                            Detalles Técnicos
                          </h4>
                          <DetailRow label="Tipo de Póliza" value={policy.policy_type} />
                          <DetailRow label="Método de Pago" value={policy.payment_method} />
                          <DetailRow label="Ubicación" value={policy.location} />
                          <DetailRow label="Fecha de Cobro" value={policy.collection_date ? format(new Date(policy.collection_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es }) : null} />
                          <DetailRow label="Envío de Carpeta" value={policy.folder_sent_date ? format(new Date(policy.folder_sent_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es }) : null} />
                        </div>
                      )}
                      {policy.notes && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                            Notas
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{policy.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {displayed.length} de {filtered.length} pólizas
          </p>
          {filtered.length > 20 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-primary hover:underline"
            >
              {showAll ? 'Ver menos' : 'Ver todo'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
