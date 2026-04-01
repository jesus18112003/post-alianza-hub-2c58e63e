import { useState } from 'react';
import { useWelcomeTemplates, useUpsertWelcomeTemplate, useDeleteWelcomeTemplate, TEMPLATE_PLACEHOLDERS } from '@/hooks/useWelcomeTemplates';
import { useAgentProfiles } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, MessageSquareText, ChevronDown, X } from 'lucide-react';

export function WelcomeTemplateManager() {
  const { data: templates, isLoading } = useWelcomeTemplates();
  const { data: agents } = useAgentProfiles();
  const upsert = useUpsertWelcomeTemplate();
  const remove = useDeleteWelcomeTemplate();

  const [editing, setEditing] = useState<{
    id?: string;
    agent_id: string | null;
    name: string;
    template_text: string;
  } | null>(null);

  const [expanded, setExpanded] = useState(false);

  const agentMap: Record<string, string> = {};
  (agents ?? []).forEach((a) => {
    agentMap[a.id] = a.full_name || a.username || 'Sin nombre';
  });

  const handleSave = () => {
    if (!editing) return;
    if (!editing.template_text.trim()) {
      toast.error('La plantilla no puede estar vacía');
      return;
    }
    upsert.mutate(
      {
        id: editing.id,
        agent_id: editing.agent_id,
        name: editing.name || 'Plantilla',
        template_text: editing.template_text,
      },
      {
        onSuccess: () => {
          toast.success(editing.id ? 'Plantilla actualizada' : 'Plantilla creada');
          setEditing(null);
        },
        onError: () => toast.error('Error al guardar'),
      }
    );
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <MessageSquareText className="h-4 w-4 text-primary/70" />
        <h3 className="text-sm text-primary tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
          Plantillas de Bienvenida
        </h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="h-20 rounded-lg border border-border bg-card animate-pulse" />
          ) : (
            <>
              {(templates ?? []).map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-card-foreground">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {t.agent_id ? `(${agentMap[t.agent_id] ?? 'Agente'})` : '(Global)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-primary"
                        onClick={() =>
                          setEditing({
                            id: t.id,
                            agent_id: t.agent_id,
                            name: t.name,
                            template_text: t.template_text,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          remove.mutate(t.id, {
                            onSuccess: () => toast.success('Plantilla eliminada'),
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-secondary/50 rounded p-3 max-h-32 overflow-y-auto">
                    {t.template_text}
                  </pre>
                </div>
              ))}

              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setEditing({ agent_id: null, name: '', template_text: '' })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Nueva Plantilla
                </Button>
              )}
            </>
          )}

          {/* Editor */}
          {editing && (
            <div className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-card-foreground font-medium">
                  {editing.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Ej: Bienvenida MOO"
                    className="bg-secondary border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Agente (vacío = global)</label>
                  <select
                    value={editing.agent_id ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, agent_id: e.target.value || null })
                    }
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                  >
                    <option value="">Global (todos los agentes)</option>
                    {(agents ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name || a.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Plantilla (usa los placeholders abajo)
                </label>
                <Textarea
                  value={editing.template_text}
                  onChange={(e) => setEditing({ ...editing, template_text: e.target.value })}
                  placeholder="Hola {{cliente}}, bienvenido a {{compañia}}..."
                  rows={6}
                  className="bg-secondary border-border text-sm font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        template_text: editing.template_text + p.key,
                      })
                    }
                    className="text-[10px] px-2 py-1 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    title={p.desc}
                  >
                    {p.key}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={upsert.isPending} className="text-xs">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {upsert.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
