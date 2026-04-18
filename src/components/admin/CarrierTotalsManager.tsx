import { useMemo, useState } from 'react';
import { useAgentProfiles } from '@/hooks/useAdminData';
import { useCarrierTotalsAccess, useSetCarrierTotalsAccess } from '@/hooks/useCarrierTotals';
import { CarrierTotalsTable } from '@/components/CarrierTotalsTable';
import { Switch } from '@/components/ui/switch';
import { Users, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export function CarrierTotalsManager() {
  const { data: agents = [] } = useAgentProfiles();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  const { data: access } = useCarrierTotalsAccess(selectedAgentId);
  const setAccess = useSetCarrierTotalsAccess();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
          Total de Carrier
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configura las aseguradoras y comisiones diarias para cada agente. Activa la página en su portal cuando esté listo.
        </p>
      </div>

      {/* Agent selector + access toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors min-w-[14rem]"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate flex-1 text-left">
              {selectedAgent ? selectedAgent.full_name || selectedAgent.username : 'Seleccionar agente…'}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl p-1 min-w-[16rem] max-h-[20rem] overflow-y-auto">
              {agents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAgentId(a.id); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 ${
                    selectedAgentId === a.id ? 'bg-secondary/40 text-primary' : 'text-foreground'
                  }`}
                >
                  {a.full_name || a.username}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedAgentId && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card">
            <Switch
              checked={access?.enabled ?? false}
              onCheckedChange={(checked) =>
                setAccess.mutate(
                  { agentId: selectedAgentId, enabled: checked },
                  {
                    onSuccess: () =>
                      toast.success(checked ? 'Página activada en el portal del agente' : 'Página desactivada'),
                    onError: () => toast.error('Error'),
                  }
                )
              }
              disabled={setAccess.isPending}
            />
            <span className="text-xs">
              {access?.enabled
                ? 'Visible en el portal del agente'
                : 'Oculta en el portal del agente'}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {selectedAgentId && selectedAgent ? (
        <CarrierTotalsTable
          agentId={selectedAgentId}
          agentName={selectedAgent.full_name || selectedAgent.username || 'Agente'}
          editable
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">Selecciona un agente para configurar sus aseguradoras.</p>
        </div>
      )}
    </div>
  );
}
