import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WelcomeTemplate {
  id: string;
  agent_id: string | null;
  name: string;
  template_text: string;
  created_at: string;
  updated_at: string;
}

export function useWelcomeTemplates() {
  return useQuery({
    queryKey: ['welcome-templates'],
    queryFn: async (): Promise<WelcomeTemplate[]> => {
      const { data, error } = await supabase
        .from('welcome_templates')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as WelcomeTemplate[];
    },
  });
}

export function useUpsertWelcomeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: {
      id?: string;
      agent_id: string | null;
      name: string;
      template_text: string;
    }) => {
      if (template.id) {
        const { error } = await supabase
          .from('welcome_templates')
          .update({
            agent_id: template.agent_id,
            name: template.name,
            template_text: template.template_text,
          })
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('welcome_templates')
          .insert({
            agent_id: template.agent_id,
            name: template.name,
            template_text: template.template_text,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['welcome-templates'] }),
  });
}

export function useDeleteWelcomeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('welcome_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['welcome-templates'] }),
  });
}

/**
 * Resolves the best template for a given agent:
 * 1. Agent-specific template (if exists)
 * 2. Global template (agent_id = null)
 */
export function resolveTemplate(
  templates: WelcomeTemplate[],
  agentId: string
): WelcomeTemplate | null {
  const agentTemplate = templates.find((t) => t.agent_id === agentId);
  if (agentTemplate) return agentTemplate;
  const global = templates.find((t) => t.agent_id === null);
  return global ?? null;
}

/**
 * Available placeholders for template interpolation
 */
export const TEMPLATE_PLACEHOLDERS = [
  { key: '{{cliente}}', desc: 'Nombre del cliente' },
  { key: '{{compañia}}', desc: 'Compañía aseguradora' },
  { key: '{{poliza}}', desc: 'Número de póliza' },
  { key: '{{cobertura}}', desc: 'Tipo de póliza / cobertura' },
  { key: '{{agente}}', desc: 'Nombre del agente' },
  { key: '{{telefono}}', desc: 'Teléfono del cliente' },
  { key: '{{fecha_cobro}}', desc: 'Fecha de cobro' },
  { key: '{{metodo_pago}}', desc: 'Método de pago' },
  { key: '{{prima}}', desc: 'Target premium' },
];

export function interpolateTemplate(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(key, value || '');
  }
  return result;
}
