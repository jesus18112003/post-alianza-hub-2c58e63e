import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgentDialog({ open, onOpenChange }: AddAgentDialogProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast.error('Usuario, nombre completo y contraseña son obligatorios');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('create-agent', {
        body: {
          username: username.trim(),
          password,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Agente "${fullName.trim()}" creado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['agent-profiles'] });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || 'Error al crear el agente';
      if (msg.includes('already been registered')) {
        toast.error('Ese nombre de usuario ya existe');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Agregar Agente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="agent-fullname">Nombre Completo *</Label>
            <Input
              id="agent-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-username">Usuario *</Label>
            <Input
              id="agent-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jperez"
            />
            <p className="text-xs text-muted-foreground">Se usará para iniciar sesión</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-email">Email (opcional)</Label>
            <Input
              id="agent-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-password">Contraseña *</Label>
            <Input
              id="agent-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Agente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
