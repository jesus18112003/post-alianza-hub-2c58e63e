import { useState } from 'react';
import { Policy } from '@/types/policy';
import { Users, UserPlus, ChevronDown, ChevronUp, Plus, FileSpreadsheet, ListChecks, Info, Trash2, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportPoliciesToCsv } from '@/lib/exportCsv';
import { toast } from 'sonner';

interface AgentProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
}

interface AgentCardsProps {
  agents: AgentProfile[];
  policies: Policy[];
  agentMap: Record<string, string>;
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
  agentMap,
  agentFilter,
  onAgentFilter,
  onAddAgent,
  onCreatePolicy,
  onImportExcel,
  onGeneralList,
  onAgentDetail,
  onDeleteAgent,
}: AgentCardsProps) {
  const [expanded, setExpanded] = useState(true);

  const handleExportAgent = (agentId: string, agentName: string) => {
    const agentPolicies = policies.filter((p) => p.agent_id === agentId);
    if (agentPolicies.length === 0) {
      toast.error(`${agentName} no tiene pólizas para exportar`);
      return;
    }
    exportPoliciesToCsv(agentPolicies, agentMap, `polizas_${agentName.replace(/\s+/g, '_')}.csv`);
    toast.success(`CSV de ${agentName} descargado`);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header - clickable to collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 border-b border-border flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary/70" />
          <h3 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Agentes
          </h3>
          <span className="text-xs text-muted-foreground ml-1">({agents.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={(e) => { e.stopPropagation(); onAddAgent(); }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Agregar
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Collapsible content */}
      <div className={`transition-all duration-300 ease-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {agents.map((agent) => {
            const agentPolicies = policies.filter((p) => p.agent_id === agent.id);
            const agentBankAmount = agentPolicies
              .filter((p) => p.status === 'emitido' || p.status === 'cobrado')
              .reduce((sum, p) => sum + (p.bank_amount ?? 0), 0);
            const agentName = agent.full_name || agent.username || 'Sin nombre';

            return (
              <div
                key={agent.id}
                className={`rounded-lg border p-3 text-left transition-all ${
                  agentFilter === agent.id
                    ? 'border-primary/40 bg-primary/5 shadow-md shadow-black/10'
                    : 'border-border hover:border-border/80 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => onAgentFilter(agentFilter === agent.id ? 'all' : agent.id)}
                    className="flex-1 text-left active:scale-[0.97] transition-transform min-w-0"
                  >
                    <p className="text-sm text-card-foreground truncate">{agentName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {agentPolicies.length} póliza{agentPolicies.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-accent mt-1.5 tabular-nums">
                      ${agentBankAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </button>

                  {/* Compact action menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 -mt-0.5 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onCreatePolicy(agent.id)}>
                        <Plus className="h-3.5 w-3.5 mr-2" /> Crear póliza
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onImportExcel(agent.id)}>
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Importar Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportAgent(agent.id, agentName)}>
                        <Download className="h-3.5 w-3.5 mr-2" /> Exportar CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onGeneralList(agent.id)}>
                        <ListChecks className="h-3.5 w-3.5 mr-2" /> Lista General
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAgentDetail(agent.id)}>
                        <Info className="h-3.5 w-3.5 mr-2" /> Información
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeleteAgent(agent.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar agente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
