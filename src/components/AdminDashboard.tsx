import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllPolicies, useAgentProfiles, useDeleteAgent } from '@/hooks/useAdminData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { MetricCards } from '@/components/MetricCards';
import { AdminPolicyRow } from '@/components/AdminPolicyRow';
import { AgentDetailModal } from '@/components/AgentDetailModal';
import { STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';
import { ClosingAssignments } from '@/components/ClosingAssignments';
import { WelcomeTemplateManager } from '@/components/WelcomeTemplateManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, Search, Filter, Users, ChevronDown, Building2, Info, Phone, UserPlus, FileSpreadsheet, Trash2 } from 'lucide-react';
import { AddAgentDialog } from '@/components/AddAgentDialog';
import { ImportPoliciesDialog } from '@/components/ImportPoliciesDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const { data: policies, isLoading: loadingPolicies } = useAllPolicies();
  const { data: agents } = useAgentProfiles();
  const deleteAgent = useDeleteAgent();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [agentDropdown, setAgentDropdown] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [agentModalId, setAgentModalId] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'with' | 'without'>('all');
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [importAgentId, setImportAgentId] = useState<string | null>(null);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);

  // Realtime subscriptions
  useRealtimeSubscription('policies', [['admin-policies']]);
  useRealtimeSubscription('profiles', [['agent-profiles']]);

  const agentMap = useMemo(() => {
    const map: Record<string, string> = {};
    (agents ?? []).forEach((a) => {
      map[a.id] = a.full_name || a.username || 'Sin nombre';
    });
    return map;
  }, [agents]);

  // Companies available for current agent filter
  const availableCompanies = useMemo(() => {
    const source = agentFilter === 'all' ? (policies ?? []) : (policies ?? []).filter((p) => p.agent_id === agentFilter);
    return [...new Set(source.map((p) => p.company))].sort();
  }, [policies, agentFilter]);

  // Reset company filter when agent changes and company no longer available
  const effectiveCompanyFilter = availableCompanies.includes(companyFilter) ? companyFilter : 'all';

  const filtered = useMemo(() => {
    if (!policies) return [];
    return policies.filter((p) => {
      const matchSearch =
        search === '' ||
        p.client_name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        (agentMap[p.agent_id] ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchAgent = agentFilter === 'all' || p.agent_id === agentFilter;
      const matchCompany = effectiveCompanyFilter === 'all' || p.company === effectiveCompanyFilter;
      const matchPhone =
        phoneFilter === 'all' ||
        (phoneFilter === 'with' ? !!p.phone_number : !p.phone_number);
      return matchSearch && matchStatus && matchAgent && matchCompany && matchPhone;
    });
  }, [policies, search, statusFilter, agentFilter, effectiveCompanyFilter, agentMap, phoneFilter]);

  const totalCommission = useMemo(
    () =>
      (policies ?? [])
        .filter((p) => p.status === 'emitido' || p.status === 'cobrado')
        .reduce((sum, p) => sum + (p.total_commission ?? 0), 0),
    [policies]
  );
  const policiesEmitted = useMemo(
    () => (policies ?? []).filter((p) => p.status === 'emitido').length,
    [policies]
  );
  const pendingCases = useMemo(
    () =>
      (policies ?? []).filter((p) => p.status === 'pendiente' || p.status === 'fondo_insuficiente').length,
    [policies]
  );

  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];
  const selectedAgentLabel =
    agentFilter === 'all' ? 'Todos los Agentes' : agentMap[agentFilter] ?? 'Agente';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Post Alianza
          </h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground border border-border rounded px-2 py-0.5">
            admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {profile?.full_name || profile?.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title */}
        <div>
          <h2 className="text-2xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Panel de Administración
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vista global de agentes, pólizas y métricas
          </p>
        </div>

        <MetricCards
          totalCommission={totalCommission}
          policiesEmitted={policiesEmitted}
          pendingCases={pendingCases}
        />

        {/* Closing Assignments from Discord */}
        <ClosingAssignments />

        {/* Welcome Templates */}
        <WelcomeTemplateManager />

        {/* Agent summary cards */}
        {agents && agents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary/70" />
                <h3 className="text-sm text-primary tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
                  Agentes
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => setAddAgentOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Agregar Agente
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {agents.map((agent) => {
                const agentPolicies = (policies ?? []).filter((p) => p.agent_id === agent.id);
                const agentCommission = agentPolicies
                  .filter((p) => p.status === 'emitido' || p.status === 'cobrado')
                  .reduce((sum, p) => sum + (p.total_commission ?? 0), 0);
                
                return (
                  <div
                    key={agent.id}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      agentFilter === agent.id
                        ? 'border-primary/40 bg-primary/5 shadow-md shadow-black/10'
                        : 'border-border bg-card hover:border-border/80 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => setAgentFilter(agentFilter === agent.id ? 'all' : agent.id)}
                        className="flex-1 text-left active:scale-[0.97] transition-transform"
                      >
                        <p className="text-sm text-card-foreground truncate">
                          {agent.full_name || agent.username}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {agentPolicies.length} póliza{agentPolicies.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-accent mt-2 tabular-nums">
                          ${agentCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </button>
                      <div className="flex flex-col gap-1 shrink-0 -mt-1 -mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setImportAgentId(agent.id)}
                          title="Importar Excel"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setAgentModalId(agent.id)}
                          title="Detalles"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, compañía o agente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Agent filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setAgentDropdown(!agentDropdown)}
              className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 min-w-[10rem]"
            >
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate flex-1 text-left">{selectedAgentLabel}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {agentDropdown && (
              <div className="absolute top-full right-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-[12rem] max-h-[16rem] overflow-y-auto">
                <button
                  onClick={() => {
                    setAgentFilter('all');
                    setAgentDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${
                    agentFilter === 'all' ? 'bg-secondary/40 text-primary' : 'text-foreground'
                  }`}
                >
                  Todos los Agentes
                </button>
                {(agents ?? []).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAgentFilter(a.id);
                      setAgentDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${
                      agentFilter === a.id ? 'bg-secondary/40 text-primary' : 'text-foreground'
                    }`}
                  >
                    {a.full_name || a.username}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setCompanyDropdown(!companyDropdown)}
              className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 min-w-[10rem]"
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate flex-1 text-left">
                {effectiveCompanyFilter === 'all' ? 'Todas las Compañías' : effectiveCompanyFilter}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {companyDropdown && (
              <div className="absolute top-full right-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-[12rem] max-h-[16rem] overflow-y-auto">
                <button
                  onClick={() => {
                    setCompanyFilter('all');
                    setCompanyDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${
                    effectiveCompanyFilter === 'all' ? 'bg-secondary/40 text-primary' : 'text-foreground'
                  }`}
                >
                  Todas las Compañías
                </button>
                {availableCompanies.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCompanyFilter(c);
                      setCompanyDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${
                      effectiveCompanyFilter === c ? 'bg-secondary/40 text-primary' : 'text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
              statusFilter === 'all'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
                statusFilter === s
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}

          <span className="w-px h-4 bg-border mx-1" />

          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <button
            onClick={() => setPhoneFilter(phoneFilter === 'with' ? 'all' : 'with')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
              phoneFilter === 'with'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Con Teléfono
          </button>
          <button
            onClick={() => setPhoneFilter(phoneFilter === 'without' ? 'all' : 'without')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
              phoneFilter === 'without'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Sin Teléfono
          </button>
        </div>

        {/* Policy list */}
        <div className="space-y-2">
          {loadingPolicies ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card h-14 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground text-sm">
                {search || statusFilter !== 'all' || agentFilter !== 'all'
                  ? 'No se encontraron pólizas con esos filtros.'
                  : 'No hay pólizas registradas.'}
              </p>
            </div>
          ) : (
            filtered.map((policy) => (
              <AdminPolicyRow
                key={policy.id}
                policy={policy}
                agentName={agentMap[policy.agent_id] ?? 'Desconocido'}
              />
            ))
          )}
        </div>

        {!loadingPolicies && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {filtered.length} de {policies?.length ?? 0} pólizas
          </p>
        )}
      </main>

      {/* Agent detail modal */}
      {agentModalId && (
        <AgentDetailModal
          open={!!agentModalId}
          onOpenChange={(open) => { if (!open) setAgentModalId(null); }}
          agentId={agentModalId}
          agentName={agentMap[agentModalId] ?? 'Agente'}
        />
      )}
      <AddAgentDialog open={addAgentOpen} onOpenChange={setAddAgentOpen} />
      {importAgentId && (
        <ImportPoliciesDialog
          open={!!importAgentId}
          onOpenChange={(open) => { if (!open) setImportAgentId(null); }}
          agentId={importAgentId}
          agentName={agentMap[importAgentId] ?? 'Agente'}
        />
      )}
    </div>
  );
}
