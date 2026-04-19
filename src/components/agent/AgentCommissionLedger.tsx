import { useMemo, useState, useEffect } from 'react';
import { Policy } from '@/types/policy';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useLedgerNotes } from '@/hooks/useLedgerNotes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StickyNote, CheckCircle2, CalendarDays, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  policies: Policy[];
  isLoading: boolean;
}

const NOTES_ENABLED_USERNAMES = ['nerioriera'];

export function AgentCommissionLedger({ policies, isLoading }: Props) {
  const { profile } = useAuth();
  const notesEnabled = !!profile?.username && NOTES_ENABLED_USERNAMES.includes(profile.username.toLowerCase());
  const { notesByPolicy, upsert } = useLedgerNotes();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const ledgerPolicies = useMemo(() => {
    return policies
      .filter(
        (p) =>
          p.status === 'cobrado' ||
          p.status === 'chargeback' ||
          ((p.status === 'cancelado' ||
            p.status === 'fondo_insuficiente' ||
            p.status === 'no_seguimiento') &&
            (p.chargeback_amount ?? 0) > 0)
      )
      .filter((p) => {
        if (dateFrom && p.date < dateFrom) return false;
        if (dateTo && p.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [policies, dateFrom, dateTo]);

  const hasDateFilter = dateFrom || dateTo;


  const totalCommission = useMemo(
    () => ledgerPolicies.reduce((sum, p) => sum + (p.bank_amount ?? 0), 0),
    [ledgerPolicies]
  );

  const totalChargeback = useMemo(
    () => ledgerPolicies.reduce((sum, p) => sum + (p.chargeback_amount ?? 0), 0),
    [ledgerPolicies]
  );

  const fmt = (v: number | null | undefined) =>
    v != null && v !== 0
      ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '-';

  const gridCols = notesEnabled
    ? 'sm:grid-cols-[6rem_6rem_11rem_1fr_8rem_6rem_6rem]'
    : 'sm:grid-cols-[6rem_8rem_1fr_9rem_8rem_8rem]';

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3
            className="text-lg text-accent tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            LIBRO DIARIO
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Comisiones cobradas y chargebacks a partir del 14 de abril 2026.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent border-0 text-sm w-36 h-7 p-0 focus-visible:ring-0"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent border-0 text-sm w-36 h-7 p-0 focus-visible:ring-0"
          />
          {hasDateFilter && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>


      {/* Table header */}
      <div className={`px-5 py-2.5 border-b border-border/50 hidden sm:grid ${gridCols} gap-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium`}>
        <span>FECHA</span>
        <span>CARRIER</span>
        <span>NOMBRE DEL CLIENTE</span>
        {notesEnabled && <span>NOTA</span>}
        <span>NÚMERO DE PÓLIZA</span>
        <span className="text-right">COMISIÓN</span>
        <span className="text-right">CHARGEBACK</span>
      </div>

      <div className="divide-y divide-border/30">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 h-12 animate-pulse" />
            ))}
          </div>
        ) : ledgerPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No hay registros de comisiones aún.
            </p>
          </div>
        ) : (
          ledgerPolicies.map((p) => {
            const formattedDate = format(
              new Date(p.date + 'T12:00:00'),
              'dd/MM/yyyy',
              { locale: es }
            );
            const note = notesByPolicy[p.id]?.note ?? '';
            return (
              <div
                key={p.id}
                className={`px-5 py-3 grid grid-cols-1 ${gridCols} gap-2 sm:gap-4 items-center hover:bg-secondary/30 transition-colors`}
              >
                <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {formattedDate}
                </span>
                <span className="text-sm text-secondary-foreground">{p.company}</span>
                <span className="text-sm text-card-foreground">{p.client_name}</span>
                {notesEnabled && (
                  <NoteCell
                    policyId={p.id}
                    currentNote={note}
                    onSave={(value) => upsert.mutate({ policy_id: p.id, note: value })}
                  />
                )}
                <span className="text-sm text-muted-foreground">{p.policy_number ?? '-'}</span>
                <span className="text-sm text-right text-emerald-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {p.status === 'cobrado' ? fmt(p.bank_amount) : '-'}
                </span>
                <span className="text-sm text-right text-destructive" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {p.chargeback_amount ? fmt(p.chargeback_amount) : '-'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Totals */}
      {!isLoading && ledgerPolicies.length > 0 && (
        <div className={`px-5 py-3 border-t border-border grid grid-cols-1 ${gridCols} gap-2 sm:gap-4 items-center bg-secondary/20`}>
          <span />
          <span />
          <span />
          {notesEnabled && <span />}
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium text-right">
            TOTALES
          </span>
          <span className="text-sm font-semibold text-right text-emerald-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            {fmt(totalCommission)}
          </span>
          <span className="text-sm font-semibold text-right text-destructive" style={{ fontFamily: "'Inter', sans-serif" }}>
            {fmt(totalChargeback)}
          </span>
        </div>
      )}
    </div>
  );
}

function NoteCell({
  policyId,
  currentNote,
  onSave,
}: {
  policyId: string;
  currentNote: string;
  onSave: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(currentNote);

  useEffect(() => {
    if (open) setDraft(currentNote);
  }, [open, currentNote]);

  const hasNote = currentNote.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={hasNote ? currentNote : 'Agregar nota'}
          className={`text-left text-sm truncate w-full px-2 py-1 rounded-md border border-dashed transition-colors ${
            hasNote
              ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/5'
              : 'text-muted-foreground/60 border-border/60 hover:text-foreground hover:border-border italic'
          }`}
        >
          {hasNote ? currentNote : '+ agregar nota'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-card-foreground">Nota personal</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recordatorios sobre el cobro de esta comisión.
            </p>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ej: Ya cobrado en efectivo el 15/11..."
            rows={4}
            className="text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onSave(draft.trim());
                setOpen(false);
              }}
            >
              Guardar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
