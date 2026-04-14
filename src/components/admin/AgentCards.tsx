import { Policy } from '@/types/policy';
import { Users, UserPlus, FileSpreadsheet, ListChecks, Info, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
}

interface AgentCardsProps {
  agents: AgentProfile[];
  policies: Policy[];
  agentFilter: string;
  onAgentFilter: (id: string) => void;
  onAddAgent: () => void;
  onCreatePolicy: (agentId: string) => void;
  onImportExcel: (agentId: string) => void;
  onGeneralList: (agentId: string) => void;
  onAgentDetail: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
}

export function AgentCards({
  agents,
  policies,
  agentFilter,
  onAgentFilter,
  onAddAgent,
  onCreatePolicy,
  onImportExcel,
  onGeneralList,
  onAgentDetail,
  onDeleteAgent,
}: AgentCardsProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary/70" />
          <h3 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Agentes
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={onAddAgent}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Agregar Agente
        </Button>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {agents.map((agent) => {
          const agentPolicies = policies.filter((p) => p.agent_id === agent.id);
          const agentBankAmount = agentPolicies
            .filter((p) => p.status === 'emitido' || p.status === 'cobrado')
            .reduce((sum, p) => sum + (p.bank_amount ?? 0), 0);

          return (
            <div
              key={agent.id}
              className={`rounded-lg border p-4 text-left transition-all ${
                agentFilter === agent.id
                  ? 'border-primary/40 bg-primary/5 shadow-md shadow-black/10'
                  : 'border-border hover:border-border/80 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <button
                  onClick={() => onAgentFilter(agentFilter === agent.id ? 'all' : agent.id)}
                  className="flex-1 text-left active:scale-[0.97] transition-transform"
                >
                  <p className="text-sm text-card-foreground truncate">
                    {agent.full_name || agent.username}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {agentPolicies.length} póliza{agentPolicies.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-accent mt-2 tabular-nums">
                    ${agentBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </button>
                <div className="flex flex-col gap-1 shrink-0 -mt-1 -mr-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onCreatePolicy(agent.id)} title="Crear póliza">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onImportExcel(agent.id)} title="Importar Excel">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onGeneralList(agent.id)} title="Lista General">
                    <ListChecks className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onAgentDetail(agent.id)} title="Detalles">
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDeleteAgent(agent.id)} title="Eliminar agente">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
