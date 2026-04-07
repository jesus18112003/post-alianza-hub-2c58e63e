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

function detectDateFormat(rows: any[], dateColName: string): 'us' | 'international' | 'ambiguous' {
  let hasFirstGt12 = false;
  let hasSecondGt12 = false;

  for (const row of rows) {
    const val = row[dateColName];
    if (typeof val !== 'string') continue;
    const match = String(val).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!match) continue;
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    if (first > 12) hasFirstGt12 = true;
    if (second > 12) hasSecondGt12 = true;
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

function parseSheet(
  workbook: XLSX.WorkBook, 
  dateFormat: DateFormat, 
  mapping: Record<string, string>
): { rows: ParsedRow[]; detectedFormat: 'us' | 'international' | 'ambiguous' } {
  
  const sheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase().includes('aplicacion') && n.toLowerCase().includes('base')
  );
  if (!sheetName) throw new Error('No se encontró la hoja "Aplicaciones BASE"');

  const ws = workbook.Sheets[sheetName];
  const allRows = XLSX.utils.sheet_to_json<any>(ws, { raw: true, defval: null });

  if (allRows.length === 0) throw new Error('El archivo está vacío');

  const detectedFormat = detectDateFormat(allRows, mapping['date']);
  const effectiveFormat = dateFormat === 'auto' ? (detectedFormat === 'ambiguous' ? 'us' : detectedFormat) : dateFormat;

  const parsed: ParsedRow[] = [];
  for (const r of allRows) {
    const clientName = r[mapping['client_name']] ? String(r[mapping['client_name']]).trim() : '';
    const dateVal = parseExcelDate(r[mapping['date']], effectiveFormat);
    const company = r[mapping['company']] ? String(r[mapping['company']]).trim() : '';

    if (!clientName || !dateVal || !company) continue;

    parsed.push({
      date: dateVal,
      company,
      client_name: clientName,
      collection_date: parseExcelDate(r[mapping['collection_date']], effectiveFormat),
      phone_number: cleanPhone(r[mapping['phone_number']]),
      status: mapStatus(r[mapping['status']]),
      policy_number: r[mapping['policy_number']] ? String(r[mapping['policy_number']]).trim() : null,
      notes: r[mapping['notes']] ? String(r[mapping['notes']]).trim() : null,
      location: r[mapping['location']] ? String(r[mapping['location']]).trim() : null,
      agent_premium: typeof r[mapping['agent_premium']] === 'number' ? r[mapping['agent_premium']] : null,
      target_premium: typeof r[mapping['target_premium']] === 'number' ? r[mapping['target_premium']] : null,
      total_commission: typeof r[mapping['total_commission']] === 'number' ? r[mapping['total_commission']] : null,
      payment_method: typeof r[mapping['agent_premium']] === 'number' ? `$${r[mapping['agent_premium']]}/mes` : null,
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
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [excelColumns, setExcelColumns] = useState<string[]>([]);

  const resetState = () => {
    setFile(null);
    setWorkbookData(null);
    setPreview(null);
    setResult(null);
    setDateFormat('auto');
    setDetectedFormat(null);
    setColumnMapping({});
    setExcelColumns([]);
  };

  const processWorkbook = (wb: XLSX.WorkBook, fmt: DateFormat) => {
    try {
      const { rows, detectedFormat: df } = parseSheet(wb, fmt, columnMapping);
      setDetectedFormat(df);
      if (rows.length === 0) {
        toast.error('No se encontraron registros válidos con las columnas seleccionadas');
        setPreview(null);
      } else {
        setPreview(rows);
        toast.success(`Se encontraron ${rows.length} registros para importar`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setResult(null);
    setPreview(null);
    setColumnMapping({}); // Limpiamos mapeos anteriores
    
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      setWorkbookData(wb);
      
      // Buscamos cualquier hoja que contenga "aplicacion" (más flexible)
      const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('aplicacion'));
      
      if (sheetName) {
        const ws = wb.Sheets[sheetName];
        // Obtenemos las cabeceras de la primera fila
        const jsonData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
        const headers = jsonData[0]; 
        
        if (headers && Array.isArray(headers)) {
          const cleanHeaders = headers.filter(h => h != null && h !== "").map(String);
          console.log("Columnas detectadas:", cleanHeaders); // Revisa esto en F12
          setExcelColumns(cleanHeaders);
        } else {
          toast.error('No se detectaron encabezados en la primera fila');
        }
      } else {
        toast.error('No se encontró una hoja con el nombre "Aplicaciones"');
      }
    } catch (err: any) {
      console.error("Error al leer:", err);
      toast.error('Error al leer el archivo');
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
      toast.success(`${toInsert.length} pólizas importadas`);
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

          {excelColumns.length > 0 && !preview && !result && (
            <div className="space-y-4 p-4 border rounded-lg bg-secondary/20 mt-2">
              <p className="text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> 
                Relacionar Columnas
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'client_name', label: 'Nombre del Cliente' },
                  { id: 'date', label: 'Fecha de Cierre' },
                  { id: 'company', label: 'Compañía' },
                  { id: 'policy_number', label: 'Número de Póliza' },
                  { id: 'status', label: 'Estatus/Estado' }
                ].map((field) => (
                  <div key={field.id} className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">{field.label}</label>
                    <select 
                      className="text-sm p-2 rounded border bg-background"
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.id]: e.target.value }))}
                      value={columnMapping[field.id] || ''}
                    >
                      <option value="">-- Seleccionar columna --</option>
                      {excelColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-2" 
                onClick={() => { if (workbookData) processWorkbook(workbookData, dateFormat); }}
                disabled={!columnMapping.client_name || !columnMapping.date || !columnMapping.company}
              >
                Confirmar y Ver Vista Previa
              </Button>
            </div>
          )}

          {preview && !result && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Formato de fecha</p>
              <div className="flex gap-2">
                {(['auto', 'us', 'international'] as DateFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setDateFormat(fmt);
                      if (workbookData) processWorkbook(workbookData, fmt);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      dateFormat === fmt
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {fmt === 'auto' ? 'Auto' : fmt === 'us' ? 'MM/DD (US)' : 'DD/MM (Int)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {preview && preview.length > 0 && !result && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <p className="text-sm font-medium">{preview.length} registros encontrados</p>
              </div>

              <div className="border border-border rounded-md overflow-hidden">
                <div className="bg-secondary/50 px-3 py-1.5 text-xs font-medium">Vista previa (primeros 5)</div>
                <div className="divide-y divide-border">
                  {preview.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-3 py-2 text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-medium">{r.client_name}</span>
                        <span className="text-muted-foreground">{r.date}</span>
                      </div>
                      <div className="text-muted-foreground">{r.company} • {r.status}</div>
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

          {result && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">Importación completada</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {result.inserted} pólizas importadas {result.skipped > 0 && `, ${result.skipped} omitidos`}
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
