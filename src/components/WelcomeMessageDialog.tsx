import { useState, useEffect } from 'react';
import { Policy } from '@/types/policy';
import { useWelcomeTemplates, resolveTemplate, interpolateTemplate } from '@/hooks/useWelcomeTemplates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Copy, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface WelcomeMessageDialogProps {
  policy: Policy;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeMessageDialog({ policy, agentName, open, onOpenChange }: WelcomeMessageDialogProps) {
  const { data: templates } = useWelcomeTemplates();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !templates) return;
    const template = resolveTemplate(templates, policy.agent_id);
    if (!template) {
      setMessage(`Hola ${policy.client_first_name || policy.client_name}, bienvenido/a. Tu póliza con ${policy.company} ha sido registrada.`);
      return;
    }

    const data: Record<string, string> = {
      '{{nombre}}': policy.client_first_name || '',
      '{{apellido}}': policy.client_last_name || '',
      '{{compañia}}': policy.company || '',
      '{{poliza}}': policy.policy_number || '',
      '{{cobertura}}': policy.policy_type || '',
      '{{agente}}': agentName || '',
      '{{telefono}}': policy.phone_number || '',
      '{{fecha_cobro}}': policy.collection_date
        ? format(parseISO(policy.collection_date), 'dd MMM yyyy', { locale: es })
        : '',
      '{{metodo_pago}}': policy.payment_method || '',
      '{{prima}}': policy.target_premium
        ? `$${policy.target_premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '',
    };

    setMessage(interpolateTemplate(template.template_text, data));
  }, [open, templates, policy, agentName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  const handleWhatsApp = () => {
    const phone = policy.phone_number?.replace(/\D/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Mensaje de Bienvenida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {policy.client_name} — {policy.company}
            {!templates?.length && (
              <span className="ml-2 text-amber-500">(Sin plantilla configurada, usando mensaje genérico)</span>
            )}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="bg-secondary border-border text-sm"
            placeholder="Escribe o edita el mensaje de bienvenida..."
          />

          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copiar
            </Button>
            <Button
              size="sm"
              onClick={handleWhatsApp}
              className="text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
