import { useAuth } from '@/hooks/useAuth';
import { usePolicies } from '@/hooks/usePolicies';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { MetricCards } from '@/components/MetricCards';
import { PolicyCard } from '@/components/PolicyCard';
import { AgentCharts } from '@/components/AgentCharts';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { LogOut, Search, Filter } from 'lucide-react';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';

export default function Dashboard() {
  const { role } = useAuth();

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  return <AgentDashboard />;
}

function AgentDashboard() {
  const { profile, role, signOut } = useAuth();
  const { data: policies, isLoading } = usePolicies();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'all'>('all');

  // Realtime subscription for agent's own policies
  useRealtimeSubscription('policies', [['policies']]);

  const filtered = useMemo(() => {
    if (!policies) return [];
    return policies.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.client_name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [policies, search, statusFilter]);

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
      (policies ?? []).filter(
        (p) => p.status === 'pendiente' || p.status === 'fondo_insuficiente'
      ).length,
    [policies]
  );

  const totalAnnualPremium = useMemo(
    () => (policies ?? []).reduce((sum, p) => sum + (p.agent_premium ?? 0), 0),
    [policies]
  );

  const allStatuses = Object.keys(STATUS_CONFIG) as PolicyStatus[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Post Alianza
          </h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground border border-border rounded px-2 py-0.5">
            {role ?? 'agent'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {profile?.full_name || profile?.username}
          </span>
          <ThemeToggleButton />
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Bienvenido, {profile?.full_name || 'Agente'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Resumen de tu actividad y pólizas</p>
        </div>

        <MetricCards totalCommission={totalCommission} policiesEmitted={policiesEmitted} pendingCases={pendingCases} totalAnnualPremium={totalAnnualPremium} />

        <AgentCharts policies={policies ?? []} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o compañía..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card h-14 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground text-sm">
                {search || statusFilter !== 'all'
                  ? 'No se encontraron pólizas con esos filtros.'
                  : 'Aún no tienes pólizas registradas.'}
              </p>
            </div>
          ) : (
            filtered.map((policy) => <PolicyCard key={policy.id} policy={policy} />)
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {filtered.length} de {policies?.length ?? 0} pólizas
          </p>
        )}
      </main>
    </div>
  );
}


