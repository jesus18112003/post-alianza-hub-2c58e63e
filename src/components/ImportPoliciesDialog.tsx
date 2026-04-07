import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, Settings2, Eye } from 'lucide-react';
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

// Convierte índice 0 -> A, 1 -> B, etc.
const getColumnLetter = (n: number) => String.fromCharCode(65 + n);

function parseExcelDate(val: unknown, format: DateFormat): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
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

function mapStatus(val: unknown): string {
  if (!val) return 'pendiente';
  const key = String(val).trim().toLowerCase();
  return STATUS_MAP[key] || 'pendiente';
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
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [availableCols, setAvailableCols] = useState<number>(0);

  const resetState = () => {
    setFile(null);
    setWorkbookData(null);
    setPreview(null);
    setResult(null);
    setColumnMapping({});
    setAvailableCols(0);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setPreview(null);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      setWorkbookData(wb);
      
      const ws = wb.Sheets[wb.SheetNames[0]];
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z1');
      setAvailableCols(range.e.c + 1);
    } catch (err) {
      toast.error('Error al leer el archivo Excel');
    } finally {
      setLoading(false);
    }
  };

  const onProcess = () => {
    if (!workbookData) return;
    const ws = workbookData.Sheets[workbookData.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null }) as unknown[][];

    const rows: ParsedRow[] = [];
    for (const r of data) {
      if (!r || r.length === 0) continue;

      const clientName = r[columnMapping['client_name']] ? String(r[columnMapping['client_name']]).trim() : '';
      const dateVal = parseExcelDate(r[columnMapping['date']], 'auto');
      const company = r[columnMapping['company']] ? String(r[columnMapping['company']]).trim() : '';

      // Saltamos encabezados o filas incompletas
      if (!clientName || !dateVal || !company || clientName.toLowerCase().includes('cliente')) continue;

      rows.push({
        date: dateVal,
        company,
        client_name: clientName,
        collection_date: parseExcelDate(r[columnMapping['collection_date']], 'auto'),
        phone_number: r[columnMapping['phone']] ? String(r[columnMapping['phone']]) : null,
        status: mapStatus(r[columnMapping['status']]),
        policy_number: r[columnMapping['policy']] ? String(r[columnMapping['policy']]) : null,
        notes: r[columnMapping['notes']] ? String(r[columnMapping['notes']]) : null,
        location: r[columnMapping['location']] ? String(r[columnMapping['location']]) : null,
        agent_premium: typeof r[columnMapping['premium']] === 'number' ? r[columnMapping['premium']] : null,
        target_premium: typeof r[columnMapping['target']] === 'number' ? r[columnMapping['target']] : null,
        total_commission: typeof r[columnMapping['commission']] === 'number' ? r[columnMapping['commission']] : null,
        payment_method: typeof r[columnMapping['premium']] === 'number' ? `$${r[columnMapping['premium']]}/mes` : null,
      });
    }

    if (rows.length === 0) {
      toast.error('No se detectaron datos. Verifica si las letras de las columnas coinciden con tu Excel.');
    } else {
      setPreview(rows);
      toast.success(`${rows.length} pólizas listas para procesar.`);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const { data: existing } = await supabase.from('policies').select('client_name, date, company').eq('agent_id', agentId);
      const existingSet = new Set((existing ?? []).map(p => `${p.client_name}|${p.date}|${p.company}`.toLowerCase()));

      const toInsert = preview
        .filter(r => !existingSet.has(`${r.client_name}|${r.date}|${r.company}`.toLowerCase()))
        .map(r => ({
          agent_id: agentId,
          ...r,
          notes_updated_at: r.notes ? new Date().toISOString() : null,
          status: r.status as any
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from('policies').insert(toInsert);
        if (error) throw error;
      }

      setResult({ inserted: toInsert.length, skipped: preview.length - toInsert.length });
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('¡Importación completada!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Importador Inteligente — {agentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="w-full h-12 border-dashed border-2" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
            {file ? file.name : 'Cargar archivo de Excel'}
          </Button>

          {availableCols > 0 && !preview && !result && (
            <div className="bg-secondary/30 p-4 rounded-xl border border-primary/10 space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
                <Settings2 className="h-4 w-4" /> Asignar Columnas del Excel
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'client_name', label: 'Nombre Cliente' },
                  { id: 'date', label: 'Fecha Cierre' },
                  { id: 'company', label: 'Compañía' },
                  { id: 'status', label: 'Estatus' },
                  { id: 'policy', label: 'Nro Póliza' },
                  { id: 'premium', label: 'Prima/Premium' }
                ].map(field => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase">{field.label}</label>
                    <select 
                      className="w-full text-xs p-2 rounded-lg border bg-background focus:ring-2 ring-primary/20 outline-none"
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.id]: parseInt(e.target.value) }))}
                    >
                      <option value="">Columna...</option>
                      {Array.from({ length: availableCols }).map((_, i) => (
                        <option key={i} value={i}>Columna {getColumnLetter(i)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full font-bold h-10" 
                disabled={columnMapping.client_name === undefined || columnMapping.date === undefined || columnMapping.company === undefined}
                onClick={onProcess}
              >
                <Eye className="h-4 w-4 mr-2" /> Procesar Datos
              </Button>
            </div>
          )}

          {preview && !result && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="rounded-xl border border-primary/20 overflow-hidden">
                <div className="bg-primary/10 px-4 py-2 text-xs font-bold flex justify-between">
                  <span>VISTA PREVIA DE DATOS</span>
                  <span>{preview.length} filas encontradas</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y bg-background/50">
                  {preview.slice(0, 5).map((r, i) => (
                    <div key={i} className="p-3 text-[11px] flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold">{r.client_name}</span>
                        <span className="text-muted-foreground">{r.company}</span>
                      </div>
                      <span className="bg-secondary px-2 py-1 rounded text-muted-foreground">{r.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 text-xs" onClick={() => setPreview(null)}>Corregir Columnas</Button>
                <Button className="flex-[2]" onClick={handleImport} disabled={importing}>
                  {importing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Confirmar e Importar
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-3">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-green-700">¡Importación Exitosa!</p>
                <p className="text-sm text-green-600/80">
                  Nuevas pólizas: <strong>{result.inserted}</strong> <br/> 
                  Duplicadas omitidas: <strong>{result.skipped}</strong>
                </p>
              </div>
              <Button variant="outline" className="w-full mt-2" onClick={resetState}>Cargar otro archivo</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
