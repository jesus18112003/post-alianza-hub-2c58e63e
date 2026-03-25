import { useState } from 'react';
import { useClosingAssignments, usePollDiscord, useAssignClosing, useDismissAssignment, ClosingAssignment } from '@/hooks/useClosingAssignments';
import { useAgentProfiles } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus, X, ChevronDown, MessageSquare, DollarSign, Building } from 'lucide-react';
import { toast } from 'sonner';

export function ClosingAssignments() {
  const { data: assignments, isLoading } = useClosingAssignments();
  const { data: agents } = useAgentProfiles();
  const pollDiscord = usePollDiscord();
  const assignClosing = useAssignClosing();
  const dismissAssignment = useDismissAssignment();

  const pending = (assignments ?? []).filter((a) => a.status === 'pending');
  const assigned = (assignments ?? []).filter((a) => a.status === 'assigned');

  const handlePoll = () => {
    pollDiscord.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`Sincronizado: ${data?.inserted ?? 0} nuevos mensajes`);
      },
      onError: () => toast.error('Error al sincronizar con Discord'),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary/70" />
          <h3 className="text-sm text-primary tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
            Asignación de Cierre
          </h3>
          {pending.length > 0 && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full tabular-nums">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePoll}
          disabled={pollDiscord.isPending}
          className="text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pollDiscord.isPending ? 'animate-spin' : ''}`} />
          Sincronizar Discord
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card h-16 animate-pulse" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No hay asignaciones pendientes. Sincroniza para obtener nuevos mensajes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              agents={agents ?? []}
              onAssign={(agentId) => {
                assignClosing.mutate(
                  { assignmentId: assignment.id, agentId },
                  {
                    onSuccess: () => toast.success('Póliza creada y asignada'),
                    onError: () => toast.error('Error al asignar'),
                  }
                );
              }}
              onDismiss={() => {
                dismissAssignment.mutate(assignment.id, {
                  onSuccess: () => toast.success('Mensaje descartado'),
                  onError: () => toast.error('Error al descartar'),
                });
              }}
              isAssigning={assignClosing.isPending}
            />
          ))}
        </div>
      )}

      {/* Recently assigned */}
      {assigned.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">
            Asignados recientemente ({assigned.length})
          </p>
          <div className="space-y-1">
            {assigned.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-card/50 border border-border/50 text-xs text-muted-foreground">
                <span className="truncate flex-1">{a.raw_message}</span>
                <span className="text-primary/60 shrink-0">✓ Asignado</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  agents,
  onAssign,
  onDismiss,
  isAssigning,
}: {
  assignment: ClosingAssignment;
  agents: { id: string; full_name: string | null; username: string | null }[];
  onAssign: (agentId: string) => void;
  onDismiss: () => void;
  isAssigning: boolean;
}) {
  const [agentDropdown, setAgentDropdown] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm">
      {/* Raw message */}
      <p className="text-xs text-muted-foreground font-mono mb-3 bg-secondary/50 rounded px-2 py-1.5">
        {assignment.raw_message}
      </p>

      {/* Parsed data */}
      <div className="flex flex-wrap gap-3 mb-3">
        {assignment.client_name && (
          <div className="flex items-center gap-1.5 text-sm text-card-foreground">
            <UserPlus className="h-3.5 w-3.5 text-primary/60" />
            {assignment.client_name}
          </div>
        )}
        {assignment.amount != null && (
          <div className="flex items-center gap-1.5 text-sm text-accent tabular-nums">
            <DollarSign className="h-3.5 w-3.5 text-primary/60" />
            ${assignment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        )}
        {assignment.company && (
          <div className="flex items-center gap-1.5 text-xs text-secondary-foreground">
            <Building className="h-3.5 w-3.5 text-primary/60" />
            {assignment.company}
          </div>
        )}
        {assignment.policy_type && (
          <span className="text-xs text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
            {assignment.policy_type}
          </span>
        )}
        {assignment.payment_method && (
          <span className="text-xs text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
            {assignment.payment_method}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <button
            onClick={() => setAgentDropdown(!agentDropdown)}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 w-full"
          >
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">Asignar a agente...</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {agentDropdown && (
            <div className="absolute bottom-full left-0 mb-1 z-20 bg-popover border border-border rounded-lg shadow-xl shadow-black/20 p-1 min-w-full max-h-[12rem] overflow-y-auto">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setAgentDropdown(false);
                    onAssign(agent.id);
                  }}
                  disabled={isAssigning}
                  className="w-full text-left px-3 py-2 rounded-md text-xs transition-colors hover:bg-secondary/60 active:scale-95 text-foreground"
                >
                  {agent.full_name || agent.username || 'Sin nombre'}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onDismiss}
          title="Descartar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
