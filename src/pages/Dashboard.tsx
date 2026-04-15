import { useAuth } from '@/hooks/useAuth';
import { usePolicies } from '@/hooks/usePolicies';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { AgentCharts } from '@/components/AgentCharts';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AgentSidebar } from '@/components/agent/AgentSidebar';
import { AgentMetricCards } from '@/components/agent/AgentMetricCards';
import { AgentPoliciesTable } from '@/components/agent/AgentPoliciesTable';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { CalendarDays, X, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import type { AgentSection } from '@/components/agent/AgentSidebar';

export default function Dashboard() {
  const { role } = useAuth();

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  return <AgentDashboard />;
}

function AgentDashboard() {
  const { profile } = useAuth();
  const { data: policies, isLoading } = usePolicies();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeSection, setActiveSection] = useState<AgentSection>('overview');

  useRealtimeSubscription('policies', [['policies']]);

  const dateFiltered = useMemo(() => {
    if (!policies) return [];
    return policies.filter((p) => {
      if (dateFrom && p.date < dateFrom) return false;
      if (dateTo && p.date > dateTo) return false;
      return true;
    });
  }, [policies, dateFrom, dateTo]);

  const totalCommission = useMemo(
    () =>
      dateFiltered
        .filter((p) => p.status === 'emitido' || p.status === 'cobrado')
        .reduce((sum, p) => sum + (p.total_commission ?? 0), 0),
    [dateFiltered]
  );

  const policiesEmitted = useMemo(
    () => dateFiltered.filter((p) => p.status === 'emitido').length,
    [dateFiltered]
  );

  const pendingCases = useMemo(
    () =>
      dateFiltered.filter(
        (p) => p.status === 'pendiente' || p.status === 'fondo_insuficiente'
      ).length,
    [dateFiltered]
  );

  const totalAnnualPremium = useMemo(
    () => dateFiltered.reduce((sum, p) => sum + (p.target_premium ?? 0), 0),
    [dateFiltered]
  );

  const totalBankAmount = useMemo(
    () => dateFiltered.reduce((sum, p) => sum + (p.bank_amount ?? 0), 0),
    [dateFiltered]
  );

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background flex">
      <AgentSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-lg text-accent font-semibold tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
              {profile?.full_name || 'Agente'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Welcome + Date Range */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                Bienvenido, {profile?.full_name || 'Agente'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Aquí tienes el resumen ejecutivo de tu cartera.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent border-0 text-sm w-36 h-7 p-0 focus-visible:ring-0"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent border-0 text-sm w-36 h-7 p-0 focus-visible:ring-0"
              />
              {hasDateFilter && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Metric Cards */}
          <AgentMetricCards
            totalCommission={totalCommission}
            policiesEmitted={policiesEmitted}
            pendingCases={pendingCases}
            totalAnnualPremium={totalAnnualPremium}
            totalBankAmount={totalBankAmount}
          />

          {/* Charts */}
          <AgentCharts policies={dateFiltered} />

          {/* Policies Table */}
          <AgentPoliciesTable policies={dateFiltered} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
