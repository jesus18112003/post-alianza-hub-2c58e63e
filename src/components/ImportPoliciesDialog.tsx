import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseSheet, findSheet, type ParsedRow, type DateFormat, type ParseResult } from '@/lib/excelParser';

interface ImportPoliciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
}

export function ImportPoliciesDialog({ open, onOpenChange, agentId, agentName }: ImportPoliciesDialogProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [workbookData, setWorkbookData] = useState<XLSX.WorkBook | null>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>('auto');
  const [detectedFormat, setDetectedFormat] = useState<'us' | 'international' | 'ambiguous' | null>(null);
  const [mappedColumns, setMappedColumns] = useState<string[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);

  const resetState = () => {
    setFile(null);
    setWorkbookData(null);
    setPreview(null);
    setResult(null);
    setDateFormat('auto');
    setDetectedFormat(null);
    setMappedColumns([]);
    setMissingColumns([]);
    setSelectedSheet(null);
    setSheetNames([]);
  };

  const processWorkbook = (wb: XLSX.WorkBook, fmt: DateFormat, sheet?: string) => {
    try {
      const res: ParseResult = parseSheet(wb, fmt, sheet);
      setDetectedFormat(res.detectedFormat);
      setMappedColumns(Object.keys(res.columnMap));
      setMissingColumns(res.missingColumns);

      if (res.missingColumns.length > 0) {
        toast.error(`Columnas requeridas no encontradas: ${res.missingColumns.join(', ')}`);
        setPreview(null);
        return;
      }

      if (res.rows.length === 0) {
        toast.error('No se encontraron registros válidos');
        setPreview(null);
      } else {
        setPreview(res.rows);
        toast.success(`Se encontraron ${res.rows.length} registros (${Object.keys(res.columnMap).length} columnas mapeadas)`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el archivo');
      setPreview(null);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setResult(null);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      setWorkbookData(wb);
      setSheetNames(wb.SheetNames);
      const defaultSheet = findSheet(wb);
      setSelectedSheet(defaultSheet);
      processWorkbook(wb, 'auto', defaultSheet);
    } catch (err: any) {
      toast.error(err.message || 'Error al leer el archivo');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    try {
      const { data: existing } = await supabase
        .from('policies')
        .select('client_name, date, company')
        .eq('agent_id', agentId);

      const existingSet = new Set(
        (existing ?? []).map((p) => `${p.client_name}|${p.date}|${p.company}`.toLowerCase())
      );

      const toInsert = preview
        .filter((r) => !existingSet.has(`${r.client_name}|${r.date}|${r.company}`.toLowerCase()))
        .map((r) => ({
          agent_id: agentId,
          date: r.date,
          company: r.company,
          client_name: r.client_name,
          phone_number: r.phone_number,
          status: r.status as any,
          policy_number: r.policy_number,
          notes: r.notes,
          notes_updated_at: r.notes ? new Date().toISOString() : null,
          location: r.location,
          collection_date: r.collection_date,
          agent_premium: r.agent_premium,
          target_premium: r.target_premium,
          total_commission: r.total_commission,
          payment_method: r.payment_method,
        }));

      const skipped = preview.length - toInsert.length;

      if (toInsert.length > 0) {
        for (let i = 0; i < toInsert.length; i += 50) {
          const batch = toInsert.slice(i, i + 50);
          const { error } = await supabase.from('policies').insert(batch);
          if (error) throw error;
        }
      }

      setResult({ inserted: toInsert.length, skipped });
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success(`${toInsert.length} pólizas importadas${skipped > 0 ? `, ${skipped} duplicados omitidos` : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    date: 'Fecha', company: 'Compañía', collection_date: 'Fecha cobro',
    client_name: 'Cliente', phone_number: 'Teléfono', status: 'Estado',
    policy_number: 'No. Póliza', notes: 'Notas', location: 'Ubicación',
    agent_premium: 'Prima agente', target_premium: 'Prima objetivo',
    total_commission: 'Comisión', payment_method: 'Método pago',
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Pólizas — {agentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={loading || importing}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {file ? file.name : 'Seleccionar archivo Excel'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Las columnas se detectan automáticamente por nombre
            </p>
          </div>

          {/* Sheet selector */}
          {workbookData && sheetNames.length > 1 && !result && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Hoja del archivo</p>
              <div className="flex flex-wrap gap-2">
                {sheetNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSelectedSheet(name); processWorkbook(workbookData, dateFormat, name); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                      selectedSheet === name
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column mapping info */}
          {mappedColumns.length > 0 && !result && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Columnas detectadas ({mappedColumns.length}/13)
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(FIELD_LABELS).map((field) => (
                  <span
                    key={field}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      mappedColumns.includes(field)
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {FIELD_LABELS[field]}
                  </span>
                ))}
              </div>
              {missingColumns.length > 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Columnas requeridas faltantes: {missingColumns.map(f => FIELD_LABELS[f] || f).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Date format */}
          {preview && !result && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Formato de fecha</p>
              {detectedFormat && detectedFormat !== 'ambiguous' && (
                <p className="text-xs text-muted-foreground">
                  Detectado: {detectedFormat === 'us' ? 'MM/DD (US)' : 'DD/MM (Internacional)'}
                </p>
              )}
              {detectedFormat === 'ambiguous' && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> No se pudo detectar. Selecciona el formato.
                </p>
              )}
              <div className="flex gap-2">
                {(['auto', 'us', 'international'] as DateFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => { setDateFormat(fmt); if (workbookData) processWorkbook(workbookData, fmt, selectedSheet || undefined); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                      dateFormat === fmt ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {fmt === 'auto' ? 'Auto' : fmt === 'us' ? 'MM/DD (US)' : 'DD/MM (Internacional)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && !result && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <p className="text-sm font-medium text-foreground">{preview.length} registros encontrados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rango: {preview[preview.length - 1]?.date} — {preview[0]?.date}
                </p>
              </div>
              <div className="border border-border rounded-md overflow-hidden">
                <div className="bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">Vista previa (primeros 5)</div>
                <div className="divide-y divide-border">
                  {preview.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-3 py-2 text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-medium text-foreground">{r.client_name}</span>
                        <span className="text-muted-foreground">{r.date}</span>
                      </div>
                      <div className="flex gap-3 text-muted-foreground">
                        <span>{r.company}</span>
                        <span className="capitalize">{r.status}</span>
                        {r.total_commission && <span>${r.total_commission.toFixed(2)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full gap-2" onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? 'Importando...' : `Importar ${preview.length} pólizas`}
              </Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">Importación completada</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {result.inserted} pólizas importadas{result.skipped > 0 && `, ${result.skipped} duplicados omitidos`}
              </p>
              <Button variant="outline" size="sm" onClick={resetState} className="mt-2">Importar otro archivo</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
