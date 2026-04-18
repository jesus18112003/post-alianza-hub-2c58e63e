import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CalendarPlus } from 'lucide-react';
import {
  useCarriers,
  useCarrierEntries,
  useAddCarrier,
  useDeleteCarrier,
  useUpsertEntry,
  CarrierTotalsCarrier,
  CarrierTotalsEntry,
} from '@/hooks/useCarrierTotals';
import { toast } from 'sonner';

interface Props {
  agentId: string;
  agentName: string;
  /** Admin can edit; agents are read-only */
  editable: boolean;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatDateLabel(iso: string) {
  // dd/mm
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function formatAmount(n: number) {
  if (!n) return '-';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CellInput({
  value,
  onCommit,
  disabled,
}: {
  value: number;
  onCommit: (n: number) => void;
  disabled?: boolean;
}) {
  const [v, setV] = useState(value ? String(value) : '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => setV(value ? String(value) : ''), [value]);

  const commit = () => {
    const parsed = parseFloat(v.replace(/,/g, ''));
    const next = Number.isFinite(parsed) ? parsed : 0;
    if (next !== value) onCommit(next);
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      placeholder="0.00"
      className="w-full bg-transparent text-right tabular-nums text-xs px-2 py-1.5 rounded border border-transparent hover:border-border/60 focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:hover:border-transparent"
    />
  );
}

export function CarrierTotalsTable({ agentId, agentName, editable }: Props) {
  const { data: carriers = [], isLoading: loadingCarriers } = useCarriers(agentId);
  const { data: entries = [], isLoading: loadingEntries } = useCarrierEntries(agentId);
  const addCarrier = useAddCarrier();
  const deleteCarrier = useDeleteCarrier();
  const upsert = useUpsertEntry();

  const [newCarrier, setNewCarrier] = useState('');
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState(todayISO());
  const [extraDates, setExtraDates] = useState<string[]>([]);

  // All dates: union of entries + manually added (extraDates)
  const allDates = useMemo(() => {
    const set = new Set<string>(entries.map((e) => e.entry_date));
    extraDates.forEach((d) => set.add(d));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries, extraDates]);

  // Quick lookup: { `${carrierId}|${date}` -> entry }
  const entryMap = useMemo(() => {
    const m: Record<string, CarrierTotalsEntry> = {};
    entries.forEach((e) => {
      m[`${e.carrier_id}|${e.entry_date}`] = e;
    });
    return m;
  }, [entries]);

  // Per-carrier monthly totals (all months, all entries) - exclude negatives (debts)
  const monthlyTotalsByCarrier = useMemo(() => {
    const m: Record<string, Record<string, number>> = {}; // carrierId -> 'YYYY-MM' -> sum
    entries.forEach((e) => {
      const amount = Number(e.amount ?? 0);
      if (amount < 0) return; // Skip negative amounts (debts)
      const ym = e.entry_date.slice(0, 7);
      m[e.carrier_id] ??= {};
      m[e.carrier_id][ym] = (m[e.carrier_id][ym] ?? 0) + amount;
    });
    return m;
  }, [entries]);

  const monthsPresent = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.entry_date.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // Per-date row total - exclude negatives (debts)
  const rowTotal = (date: string) =>
    carriers.reduce((sum, c) => {
      const amount = Number(entryMap[`${c.id}|${date}`]?.amount ?? 0);
      return amount >= 0 ? sum + amount : sum;
    }, 0);

  // Grand total per carrier - exclude negatives (debts)
  const grandTotalByCarrier = (carrierId: string) =>
    entries
      .filter((e) => e.carrier_id === carrierId)
      .reduce((s, e) => {
        const amount = Number(e.amount ?? 0);
        return amount >= 0 ? s + amount : s;
      }, 0);

  const handleAddCarrier = () => {
    const name = newCarrier.trim();
    if (!name) return;
    if (carriers.some((c) => c.name.toUpperCase() === name.toUpperCase())) {
      toast.error('Esa aseguradora ya existe');
      return;
    }
    addCarrier.mutate(
      { agentId, name, position: carriers.length },
      {
        onSuccess: () => {
          setNewCarrier('');
          toast.success('Aseguradora agregada');
        },
        onError: () => toast.error('Error al agregar'),
      }
    );
  };

  const handleAddDate = () => {
    if (!newDate) return;
    if (allDates.includes(newDate)) {
      toast.info('Esa fecha ya está en la tabla');
    } else {
      setExtraDates((d) => [...d, newDate]);
    }
    setShowAddDate(false);
  };

  const handleDeleteCarrier = (c: CarrierTotalsCarrier) => {
    if (!confirm(`¿Eliminar la aseguradora "${c.name}" y todas sus entradas?`)) return;
    deleteCarrier.mutate(
      { id: c.id, agentId },
      {
        onSuccess: () => toast.success('Aseguradora eliminada'),
        onError: () => toast.error('Error'),
      }
    );
  };

  if (loadingCarriers || loadingEntries) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
              Total de Carrier
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comisiones diarias por aseguradora — {agentName}
            </p>
          </div>

          {editable && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Nueva aseguradora (ej: NL)"
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCarrier();
                  }}
                  className="h-8 w-44 text-xs"
                />
                <Button size="sm" variant="outline" onClick={handleAddCarrier} disabled={addCarrier.isPending}>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>

              {!showAddDate ? (
                <Button size="sm" variant="outline" onClick={() => setShowAddDate(true)}>
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Agregar día
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                  <Button size="sm" onClick={handleAddDate}>OK</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddDate(false)}>Cancelar</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {carriers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {editable ? 'Agrega tu primera aseguradora arriba para comenzar.' : 'El admin aún no ha configurado aseguradoras.'}
          </p>
        </div>
      ) : (
        <>
          {/* Main table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground sticky left-0 bg-secondary/40 z-10">
                      Fecha
                    </th>
                    {carriers.map((c) => (
                      <th key={c.id} className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground text-right whitespace-nowrap min-w-[100px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{c.name}</span>
                          {editable && (
                            <button
                              onClick={() => handleDeleteCarrier(c)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors"
                              title="Eliminar aseguradora"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allDates.length === 0 ? (
                    <tr>
                      <td colSpan={carriers.length + 2} className="text-center py-8 text-muted-foreground">
                        {editable ? 'Agrega un día para comenzar a registrar comisiones.' : 'Sin registros aún.'}
                      </td>
                    </tr>
                  ) : (
                    allDates.map((date) => (
                      <tr key={date} className="border-t border-border hover:bg-secondary/20 transition-colors">
                        <td className="px-3 py-1 text-card-foreground font-medium tabular-nums sticky left-0 bg-card z-10">
                          {formatDateLabel(date)}
                        </td>
                        {carriers.map((c) => {
                          const e = entryMap[`${c.id}|${date}`];
                          const amount = Number(e?.amount ?? 0);
                          return (
                            <td key={c.id} className="px-1 py-0.5 text-right">
                              {editable ? (
                                <CellInput
                                  value={amount}
                                  onCommit={(n) =>
                                    upsert.mutate(
                                      { agentId, carrierId: c.id, entryDate: date, amount: n },
                                      { onError: () => toast.error('Error al guardar') }
                                    )
                                  }
                                />
                              ) : (
                                <span className={`tabular-nums ${amount === 0 ? 'text-muted-foreground/50' : 'text-card-foreground'}`}>
                                  {formatAmount(amount)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-1 text-right tabular-nums font-semibold text-accent bg-secondary/20">
                          {formatAmount(rowTotal(date))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Footer: grand totals per carrier */}
                {allDates.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-accent/30 bg-secondary/30">
                      <td className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px] text-accent sticky left-0 bg-secondary/30 z-10">
                        Total
                      </td>
                      {carriers.map((c) => (
                        <td key={c.id} className="px-3 py-2.5 text-right tabular-nums font-semibold text-card-foreground">
                          {formatAmount(grandTotalByCarrier(c.id))}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right tabular-nums font-bold text-accent bg-secondary/50">
                        {formatAmount(carriers.reduce((s, c) => s + grandTotalByCarrier(c.id), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Monthly totals */}
          {monthsPresent.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-secondary/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Totales mensuales
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/30">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                        Mes
                      </th>
                      {carriers.map((c) => (
                        <th key={c.id} className="px-3 py-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground text-right whitespace-nowrap">
                          {c.name}
                        </th>
                      ))}
                      <th className="px-3 py-2 font-semibold uppercase tracking-wider text-[10px] text-accent text-right whitespace-nowrap bg-secondary/40">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthsPresent.map((ym) => {
                      const monthTotal = carriers.reduce(
                        (s, c) => s + (monthlyTotalsByCarrier[c.id]?.[ym] ?? 0),
                        0
                      );
                      const [y, m] = ym.split('-');
                      return (
                        <tr key={ym} className="border-t border-border hover:bg-secondary/20">
                          <td className="px-3 py-2 font-medium text-card-foreground tabular-nums">
                            {m}/{y}
                          </td>
                          {carriers.map((c) => {
                            const v = monthlyTotalsByCarrier[c.id]?.[ym] ?? 0;
                            return (
                              <td key={c.id} className={`px-3 py-2 text-right tabular-nums ${v === 0 ? 'text-muted-foreground/50' : 'text-card-foreground'}`}>
                                {formatAmount(v)}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-accent bg-secondary/20">
                            {formatAmount(monthTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
