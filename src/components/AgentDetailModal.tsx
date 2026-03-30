import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Plus, Trash2, Save, Shield, Hash, KeyRound, Mail, Calendar } from 'lucide-react';
import {
  useAgentDetails,
  useProducerNumbers,
  usePortalCredentials,
  useUpsertAgentDetails,
  useUpsertProducerNumber,
  useDeleteProducerNumber,
  useUpsertPortalCredential,
  useDeletePortalCredential,
} from '@/hooks/useAgentDetails';

interface AgentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
}

export function AgentDetailModal({ open, onOpenChange, agentId, agentName }: AgentDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-accent flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
            <Shield className="h-5 w-5 text-primary/70" />
            {agentName}
          </DialogTitle>
        </DialogHeader>
        {open && <AgentDetailContent agentId={agentId} />}
      </DialogContent>
    </Dialog>
  );
}

function AgentDetailContent({ agentId }: { agentId: string }) {
  const { data: details, isLoading: loadingDetails } = useAgentDetails(agentId);
  const { data: producers, isLoading: loadingProducers } = useProducerNumbers(agentId);
  const { data: credentials, isLoading: loadingCredentials } = usePortalCredentials(agentId);

  if (loadingDetails || loadingProducers || loadingCredentials) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Cargando información...</div>;
  }

  return (
    <div className="space-y-6 py-2">
      <PersonalInfoSection agentId={agentId} details={details} />
      <ProducerNumbersSection agentId={agentId} producers={producers ?? []} />
      <PortalCredentialsSection agentId={agentId} credentials={credentials ?? []} />
    </div>
  );
}

/* ─── Personal Info ─── */
function PersonalInfoSection({ agentId, details }: { agentId: string; details: any }) {
  const upsert = useUpsertAgentDetails();
  const [ssn, setSsn] = useState(details?.ssn ?? '');
  const [dob, setDob] = useState(details?.date_of_birth ?? '');
  const [email1, setEmail1] = useState(details?.personal_email ?? '');
  const [email2, setEmail2] = useState(details?.secondary_email ?? '');
  useEffect(() => {
    setSsn(details?.ssn ?? '');
    setDob(details?.date_of_birth ?? '');
    setEmail1(details?.personal_email ?? '');
    setEmail2(details?.secondary_email ?? '');
  }, [details]);
  const [showSsn, setShowSsn] = useState(false);

  const handleSave = () => {
    upsert.mutate(
      {
        agentId,
        details: {
          ssn: ssn.trim() || null,
          date_of_birth: dob || null,
          personal_email: email1.trim() || null,
          secondary_email: email2.trim() || null,
        },
      },
      {
        onSuccess: () => toast.success('Información personal guardada'),
        onError: () => toast.error('Error al guardar'),
      }
    );
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
        <Mail className="h-3.5 w-3.5" /> Información Personal
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Social Security Number</Label>
          <div className="relative">
            <Input
              type={showSsn ? 'text' : 'password'}
              value={ssn}
              onChange={(e) => setSsn(e.target.value)}
              placeholder="XXX-XX-XXXX"
              className="bg-secondary border-border text-foreground text-sm pr-9"
            />
            <button
              type="button"
              onClick={() => setShowSsn(!showSsn)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSsn ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fecha de Nacimiento</Label>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="bg-secondary border-border text-foreground text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Correo Principal</Label>
          <Input
            type="email"
            value={email1}
            onChange={(e) => setEmail1(e.target.value)}
            className="bg-secondary border-border text-foreground text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Correo Secundario</Label>
          <Input
            type="email"
            value={email2}
            onChange={(e) => setEmail2(e.target.value)}
            className="bg-secondary border-border text-foreground text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={upsert.isPending} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {upsert.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Producer Numbers ─── */
function ProducerNumbersSection({
  agentId,
  producers,
}: {
  agentId: string;
  producers: { id: string; company: string; producer_number: string }[];
}) {
  const upsert = useUpsertProducerNumber();
  const remove = useDeleteProducerNumber();
  const [rows, setRows] = useState(producers);
  useEffect(() => { setRows(producers); }, [producers]);
  const [newCompany, setNewCompany] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const handleSaveRow = (row: (typeof rows)[0]) => {
    upsert.mutate(
      { id: row.id, agent_id: agentId, company: row.company, producer_number: row.producer_number },
      {
        onSuccess: () => toast.success('Producer number guardado'),
        onError: () => toast.error('Error al guardar'),
      }
    );
  };

  const handleAdd = () => {
    if (!newCompany.trim() || !newNumber.trim()) return;
    upsert.mutate(
      { agent_id: agentId, company: newCompany.trim(), producer_number: newNumber.trim() },
      {
        onSuccess: () => {
          toast.success('Producer number agregado');
          setNewCompany('');
          setNewNumber('');
        },
        onError: () => toast.error('Error al agregar'),
      }
    );
  };

  const handleDelete = (id: string) => {
    remove.mutate(
      { id, agentId },
      { onSuccess: () => toast.success('Eliminado') }
    );
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-3 border-t border-border/30 pt-4">
      <h4 className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
        <Hash className="h-3.5 w-3.5" /> Producer Numbers
      </h4>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <Input
              value={row.company}
              onChange={(e) => updateRow(row.id, 'company', e.target.value)}
              placeholder="Compañía"
              className="bg-secondary border-border text-foreground text-sm flex-1"
            />
            <Input
              value={row.producer_number}
              onChange={(e) => updateRow(row.id, 'producer_number', e.target.value)}
              placeholder="Número"
              className="bg-secondary border-border text-foreground text-sm w-40"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary/80 shrink-0" onClick={() => handleSaveRow(row)}>
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(row.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {/* New row */}
        <div className="flex items-center gap-2">
          <Input
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="Nueva compañía"
            className="bg-secondary border-border text-foreground text-sm flex-1"
          />
          <Input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="Número"
            className="bg-secondary border-border text-foreground text-sm w-40"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary/80 shrink-0" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <div className="h-8 w-8 shrink-0" /> {/* spacer */}
        </div>
      </div>
    </div>
  );
}

/* ─── Portal Credentials ─── */
function PortalCredentialsSection({
  agentId,
  credentials,
}: {
  agentId: string;
  credentials: { id: string; portal_name: string; portal_username: string; portal_password: string }[];
}) {
  const upsert = useUpsertPortalCredential();
  const remove = useDeletePortalCredential();
  const [rows, setRows] = useState(credentials);
  useEffect(() => { setRows(credentials); }, [credentials]);
  const [newPortal, setNewPortal] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => setVisiblePasswords((v) => ({ ...v, [id]: !v[id] }));

  const handleSaveRow = (row: (typeof rows)[0]) => {
    upsert.mutate(
      { id: row.id, agent_id: agentId, portal_name: row.portal_name, portal_username: row.portal_username, portal_password: row.portal_password },
      {
        onSuccess: () => toast.success('Credencial guardada'),
        onError: () => toast.error('Error al guardar'),
      }
    );
  };

  const handleAdd = () => {
    if (!newPortal.trim() || !newUser.trim() || !newPass.trim()) return;
    upsert.mutate(
      { agent_id: agentId, portal_name: newPortal.trim(), portal_username: newUser.trim(), portal_password: newPass.trim() },
      {
        onSuccess: () => {
          toast.success('Credencial agregada');
          setNewPortal('');
          setNewUser('');
          setNewPass('');
        },
        onError: () => toast.error('Error al agregar'),
      }
    );
  };

  const handleDelete = (id: string) => {
    remove.mutate({ id, agentId }, { onSuccess: () => toast.success('Eliminado') });
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-3 border-t border-border/30 pt-4">
      <h4 className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
        <KeyRound className="h-3.5 w-3.5" /> Credenciales de Portales
      </h4>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <Input
              value={row.portal_name}
              onChange={(e) => updateRow(row.id, 'portal_name', e.target.value)}
              placeholder="Portal"
              className="bg-secondary border-border text-foreground text-sm flex-1"
            />
            <Input
              value={row.portal_username}
              onChange={(e) => updateRow(row.id, 'portal_username', e.target.value)}
              placeholder="Usuario"
              className="bg-secondary border-border text-foreground text-sm w-32"
            />
            <div className="relative w-32">
              <Input
                type={visiblePasswords[row.id] ? 'text' : 'password'}
                value={row.portal_password}
                onChange={(e) => updateRow(row.id, 'portal_password', e.target.value)}
                placeholder="Contraseña"
                className="bg-secondary border-border text-foreground text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => togglePassword(row.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {visiblePasswords[row.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary/80 shrink-0" onClick={() => handleSaveRow(row)}>
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(row.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {/* New row */}
        <div className="flex items-center gap-2">
          <Input
            value={newPortal}
            onChange={(e) => setNewPortal(e.target.value)}
            placeholder="Nuevo portal"
            className="bg-secondary border-border text-foreground text-sm flex-1"
          />
          <Input
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            placeholder="Usuario"
            className="bg-secondary border-border text-foreground text-sm w-32"
          />
          <div className="relative w-32">
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Contraseña"
              className="bg-secondary border-border text-foreground text-sm"
            />
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary/80 shrink-0" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <div className="h-8 w-8 shrink-0" />
        </div>
      </div>
    </div>
  );
}
