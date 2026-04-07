import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportPoliciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
}

interface ParsedRow {
  date: string;
  company: string;
  collection_date: string | null;
  client_name: string;
  phone_number: string | null;
  status: string;
  policy_number: string | null;
  notes: string | null;
  location: string | null;
  agent_premium: number | null;
  target_premium: number | null;
  total_commission: number | null;
  payment_method: string | null;
}

const STATUS_MAP: Record<string, string> = {
  'cobrado': 'cobrado',
  'cancelado': 'cancelado',
  'pendiente': 'pendiente',
  'descalificado': 'descalificado',
  'issued': 'emitido',
  'emitido': 'emitido',
  'fondo insuficiente': 'fondo_insuficiente',
  'chargeback': 'chargeback',
};

type DateFormat = 'auto' | 'us' | 'international';

/**
 * Detect date format by scanning all string dates in the dataset.
 * If any first-position value > 12 → DD/MM (international).
 * If any second-position value > 12 → MM/DD (US).
 * If ambiguous, returns 'auto' (defaults to US parsing via Date).
 */
function detectDateFormat(rows: unknown[][], dateColIndices: number[]): 'us' | 'international' | 'ambiguous' {
  let hasFirstGt12 = false;
  let hasSecondGt12 = false;

  for (const row of rows) {
    if (!row) continue;
    for (const idx of dateColIndices) {
      const val = row[idx];
      if (typeof val !== 'string') continue;
      const match = String(val).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (!match) continue;
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      if (first > 12) hasFirstGt12 = true;
      if (second > 12) hasSecondGt12 = true;
    }
  }

  if (hasFirstGt12 && !hasSecondGt12) return 'international';
  if (hasSecondGt12 && !hasFirstGt12) return 'us';
  return 'ambiguous';
}

function parseExcelDate(val: unknown, format: DateFormat): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const match = String(val).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (match) {
      let month: number, day: number, year: number;
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      let y = parseInt(match[3], 10);
      if (y < 100) y += 2000;

      if (format === 'international' || (format === 'auto' && a > 12)) {
        day = a; month = b;
      } else {
        month = a; day = b;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  return null;
}

function cleanPhone(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).trim();
  return s || null;
}

function mapStatus(val: unknown): string {
  if (!val) return 'pendiente';
  const key = String(val).trim().toLowerCase();
  return STATUS_MAP[key] || 'pendiente';
}

function parseSheet(workbook: XLSX.WorkBook, dateFormat: DateFormat): { rows: ParsedRow[]; detectedFormat: 'us' | 'international' | 'ambiguous' } {
  const sheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase().includes('aplicacion') && n.toLowerCase().includes('base')
  );
  if (!sheetName) throw new Error('No se encontró la hoja "Aplicaciones BASE"');

  const ws = workbook.Sheets[sheetName];
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null }) as unknown[][];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, allRows.length); i++) {
    const row = allRows[i];
    if (!row) continue;
    if (row.some((c) => typeof c === 'string' && c.toLowerCase().includes('fecha de cierre'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('No se encontró la fila de encabezados');

  const dataRows = allRows.slice(headerIdx + 1);
  const detectedFormat = detectDateFormat(dataRows, [1, 4]);
  const effectiveFormat = dateFormat === 'auto' ? (detectedFormat === 'ambiguous' ? 'us' : detectedFormat) : dateFormat;

  const parsed: ParsedRow[] = [];
  for (const r of dataRows) {
    if (!r) continue;
    const clientName = r[5] ? String(r[5]).trim() : '';
    if (!clientName) continue;
    const dateVal = parseExcelDate(r[1], effectiveFormat);
    if (!dateVal) continue;
    const company = r[3] ? String(r[3]).trim() : '';
    if (!company) continue;

    parsed.push({
      date: dateVal,
      company,
      collection_date: parseExcelDate(r[4], effectiveFormat),
      client_name: clientName,
      phone_number: cleanPhone(r[6]),
      status: mapStatus(r[7]),
      policy_number: r[8] ? String(r[8]).trim() : null,
      notes: r[9] ? String(r[9]).trim() : null,
      location: r[12] ? String(r[12]).trim() : null,
      agent_premium: typeof r[13] === 'number' ? r[13] : null,
      target_premium: typeof r[16] === 'number' ? r[16] : null,
      total_commission: typeof r[18] === 'number' ? r[18] : null,
      payment_method: typeof r[13] === 'number' ? `$${r[13]}/mes` : null,
    });
  }

  return { rows: parsed, detectedFormat };
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

  const resetState = () => {
    setFile(null);
    setWorkbookData(null);
    setPreview(null);
    setResult(null);
    setDateFormat('auto');
    setDetectedFormat(null);
  };

  const processWorkbook = (wb: XLSX.WorkBook, fmt: DateFormat) => {
    const { rows, detectedFormat: df } = parseSheet(wb, fmt);
    setDetectedFormat(df);
    if (rows.length === 0) {
      toast.error('No se encontraron registros válidos en la hoja "Aplicaciones BASE"');
      setPreview(null);
    } else {
      setPreview(rows);
      toast.success(`Se encontraron ${rows.length} registros para importar`);
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
      processWorkbook(wb, 'auto');
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
      // Fetch existing policies for this agent to avoid duplicates
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
        // Insert in batches of 50
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
          {/* File input */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={loading || importing}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {file ? file.name : 'Seleccionar archivo Excel'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Se leerá la hoja "Aplicaciones BASE" automáticamente
            </p>
          </div>

          {/* Date format selector */}
          {preview && !result && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Formato de fecha</p>
              {detectedFormat && detectedFormat !== 'ambiguous' && (
                <p className="text-xs text-muted-foreground">
                  Formato detectado: {detectedFormat === 'us' ? 'Estadounidense (MM/DD)' : 'Internacional (DD/MM)'}
                </p>
              )}
              {detectedFormat === 'ambiguous' && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  No se pudo detectar automáticamente. Selecciona el formato correcto.
                </p>
              )}
              <div className="flex gap-2">
                {(['auto', 'us', 'international'] as DateFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setDateFormat(fmt);
                      if (workbookData) {
                        processWorkbook(workbookData, fmt);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                      dateFormat === fmt
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
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
                <p className="text-sm font-medium text-foreground">
                  {preview.length} registros encontrados
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rango de fechas: {preview[preview.length - 1]?.date} — {preview[0]?.date}
                </p>
              </div>

              {/* Sample rows */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className="bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Vista previa (primeros 5)
                </div>
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

              <Button
                className="w-full gap-2"
                onClick={handleImport}
                disabled={importing}
              >
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
                {result.inserted} pólizas importadas
                {result.skipped > 0 && `, ${result.skipped} duplicados omitidos`}
              </p>
              <Button variant="outline" size="sm" onClick={resetState} className="mt-2">
                Importar otro archivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
