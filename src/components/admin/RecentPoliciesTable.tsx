import { useState, useMemo } from 'react';
import { Policy } from '@/types/policy';
import { StatusBadge, STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';
import { AdminPolicyRow } from '@/components/AdminPolicyRow';
import { Filter, SlidersHorizontal } from 'lucide-react';

interface RecentPoliciesTableProps {
  policies: Policy[];
  agentMap: Record<string, string>;
  isLoading: boolean;
  search: string;
  agentFilter: string;
  companyFilter: string;
}

export function RecentPoliciesTable({
  policies,
  agentMap,
  isLoading,
  search,
  agentFilter,
  companyFilter,
}: RecentPoliciesTableProps) {
  const [statusFilters, setStatusFilters] = useState<Set<PolicyStatus>>(new Set());
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'with' | 'without'>('all');
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'with' | 'without'>('all');
  const [showAll, setShowAll] = useState(false);

  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];

  const filtered = useMemo(() => {
    if (!policies) return [];
    return policies.filter((p) => {
      const matchSearch =
        search === '' ||
        p.client_name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        (agentMap[p.agent_id] ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilters.size === 0 || statusFilters.has(p.status);
      const matchAgent = agentFilter === 'all' || p.agent_id === agentFilter;
      const matchCompany = companyFilter === 'all' || p.company === companyFilter;
      const matchPhone =
        phoneFilter === 'all' ||
        (phoneFilter === 'with' ? !!p.phone_number : !p.phone_number);
      return matchSearch && matchStatus && matchAgent && matchCompany && matchPhone;
    });
  }, [policies, search, statusFilters, agentFilter, companyFilter, agentMap, phoneFilter]);

  const displayed = showAll ? filtered : filtered.slice(0, 20);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
          Pólizas Recientes
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? 'Ver menos' : 'Ver todo'}
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="px-5 py-3 border-b border-border/50 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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

        <span className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => setPhoneFilter(phoneFilter === 'with' ? 'all' : 'with')}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
            phoneFilter === 'with'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Con Teléfono
        </button>
        <button
          onClick={() => setPhoneFilter(phoneFilter === 'without' ? 'all' : 'without')}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
            phoneFilter === 'without'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Sin Teléfono
        </button>
      </div>

      {/* Policy rows */}
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
              {search || statusFilters.size > 0 || agentFilter !== 'all'
                ? 'No se encontraron pólizas con esos filtros.'
                : 'No hay pólizas registradas.'}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {displayed.map((policy) => (
              <AdminPolicyRow
                key={policy.id}
                policy={policy}
                agentName={agentMap[policy.agent_id] ?? 'Desconocido'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            Mostrando {displayed.length} de {filtered.length} pólizas
            {policies.length !== filtered.length && ` (${policies.length} total)`}
          </p>
        </div>
      )}
    </div>
  );
}
