import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllPolicies, useAgentProfiles, useDeleteAgent } from '@/hooks/useAdminData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { AdminSidebar, AdminSection } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AdminMetricCards } from '@/components/admin/AdminMetricCards';
import { RecentPoliciesTable } from '@/components/admin/RecentPoliciesTable';
import { AgentCards } from '@/components/admin/AgentCards';
import { AddClosingByMessage } from '@/components/AddClosingByMessage';
import { ClosingAssignments } from '@/components/ClosingAssignments';
import { WelcomeTemplateManager } from '@/components/WelcomeTemplateManager';
import { AgentDetailModal } from '@/components/AgentDetailModal';
import { AddAgentDialog } from '@/components/AddAgentDialog';
import { ImportPoliciesDialog } from '@/components/ImportPoliciesDialog';
import { GeneralListDialog } from '@/components/GeneralListDialog';
import { CreatePolicyDialog } from '@/components/CreatePolicyDialog';
import { PriorityRequirements } from '@/components/admin/PriorityRequirements';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, ChevronDown, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const { data: policies, isLoading: loadingPolicies } = useAllPolicies();
  const { data: agents } = useAgentProfiles();
  const deleteAgent = useDeleteAgent();

  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [agentDropdown, setAgentDropdown] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [agentModalId, setAgentModalId] = useState<string | null>(null);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [importAgentId, setImportAgentId] = useState<string | null>(null);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [generalListAgentId, setGeneralListAgentId] = useState<string | null>(null);
  const [createPolicyAgentId, setCreatePolicyAgentId] = useState<string | null>(null);

  useRealtimeSubscription('policies', [['admin-policies']]);
  useRealtimeSubscription('profiles', [['agent-profiles']]);

  const agentMap = useMemo(() => {
    const map: Record<string, string> = {};
    (agents ?? []).forEach((a) => {
      map[a.id] = a.full_name || a.username || 'Sin nombre';
    });
    return map;
  }, [agents]);

  const availableCompanies = useMemo(() => {
    const source = agentFilter === 'all' ? (policies ?? []) : (policies ?? []).filter((p) => p.agent_id === agentFilter);
    return [...new Set(source.map((p) => p.company))].sort();
  }, [policies, agentFilter]);

  const effectiveCompanyFilter = availableCompanies.includes(companyFilter) ? companyFilter : 'all';

  const totalBankAmount = useMemo(
    () =>
      (policies ?? [])
        .filter((p) => p.status === 'emitido' || p.status === 'cobrado')
        .reduce((sum, p) => sum + (p.bank_amount ?? 0), 0),
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

  const selectedAgentLabel =
    agentFilter === 'all' ? 'Todos los Agentes' : agentMap[agentFilter] ?? 'Agente';


  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar search={search} onSearchChange={setSearch} />

        <main className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Title + Priority requirements (top, side by side) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                  Panel de Control
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Resumen administrativo y financiero del día
                </p>
              </div>

              {/* Metric cards */}
              <AdminMetricCards
                totalBankAmount={totalBankAmount}
                policiesEmitted={policiesEmitted}
                pendingCases={pendingCases}
              />
            </div>

            <PriorityRequirements policies={policies ?? []} agentMap={agentMap} />
          </div>

          {/* Agents section (collapsible, moved up) */}
          {agents && agents.length > 0 && (
            <AgentCards
              agents={agents}
              policies={policies ?? []}
              agentMap={agentMap}
              agentFilter={agentFilter}
              onAgentFilter={setAgentFilter}
              onAddAgent={() => setAddAgentOpen(true)}
              onCreatePolicy={setCreatePolicyAgentId}
              onImportExcel={setImportAgentId}
              onGeneralList={setGeneralListAgentId}
              onAgentDetail={setAgentModalId}
              onDeleteAgent={setDeleteAgentId}
            />
          )}

          {/* Agent & Company dropdowns */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => { setAgentDropdown(!agentDropdown); setCompanyDropdown(false); }}
                className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 min-w-[10rem]"
              >
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate flex-1 text-left">{selectedAgentLabel}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {agentDropdown && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-[12rem] max-h-[16rem] overflow-y-auto">
                  <button
                    onClick={() => { setAgentFilter('all'); setAgentDropdown(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${agentFilter === 'all' ? 'bg-secondary/40 text-primary' : 'text-foreground'}`}
                  >
                    Todos los Agentes
                  </button>
                  {(agents ?? []).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setAgentFilter(a.id); setAgentDropdown(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${agentFilter === a.id ? 'bg-secondary/40 text-primary' : 'text-foreground'}`}
                    >
                      {a.full_name || a.username}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setCompanyDropdown(!companyDropdown); setAgentDropdown(false); }}
                className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 min-w-[10rem]"
              >
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate flex-1 text-left">
                  {effectiveCompanyFilter === 'all' ? 'Todas las Compañías' : effectiveCompanyFilter}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {companyDropdown && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-[12rem] max-h-[16rem] overflow-y-auto">
                  <button
                    onClick={() => { setCompanyFilter('all'); setCompanyDropdown(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${effectiveCompanyFilter === 'all' ? 'bg-secondary/40 text-primary' : 'text-foreground'}`}
                  >
                    Todas las Compañías
                  </button>
                  {availableCompanies.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCompanyFilter(c); setCompanyDropdown(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 ${effectiveCompanyFilter === c ? 'bg-secondary/40 text-primary' : 'text-foreground'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Two-column layout: Policies + Closing */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <RecentPoliciesTable
              policies={policies ?? []}
              agentMap={agentMap}
              isLoading={loadingPolicies}
              search={search}
              agentFilter={agentFilter}
              companyFilter={effectiveCompanyFilter}
            />
            <div className="space-y-6">
              <PriorityRequirements policies={policies ?? []} agentMap={agentMap} />
              <AddClosingByMessage />
              <WelcomeTemplateManager />
            </div>
          </div>

          {/* Closing Assignments */}
          <ClosingAssignments />
        </main>
      </div>

      {/* Modals */}
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
      <AlertDialog open={!!deleteAgentId} onOpenChange={(open) => { if (!open) setDeleteAgentId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente a <strong>{deleteAgentId ? (agentMap[deleteAgentId] ?? 'este agente') : ''}</strong> junto con todas sus pólizas, credenciales y datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteAgentId) return;
                const name = agentMap[deleteAgentId] ?? 'Agente';
                deleteAgent.mutate(deleteAgentId, {
                  onSuccess: () => {
                    toast.success(`Agente "${name}" eliminado`);
                    if (agentFilter === deleteAgentId) setAgentFilter('all');
                    setDeleteAgentId(null);
                  },
                  onError: (err: any) => {
                    toast.error(err?.message || 'Error al eliminar el agente');
                  },
                });
              }}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {generalListAgentId && (
        <GeneralListDialog
          open={!!generalListAgentId}
          onOpenChange={(open) => { if (!open) setGeneralListAgentId(null); }}
          agentPolicies={(policies ?? []).filter((p) => p.agent_id === generalListAgentId)}
          agentName={agentMap[generalListAgentId] ?? 'Agente'}
        />
      )}
      {createPolicyAgentId && (
        <CreatePolicyDialog
          open={!!createPolicyAgentId}
          onOpenChange={(open) => { if (!open) setCreatePolicyAgentId(null); }}
          agentId={createPolicyAgentId}
          agentName={agentMap[createPolicyAgentId] ?? 'Agente'}
        />
      )}
    </div>
  );
}
