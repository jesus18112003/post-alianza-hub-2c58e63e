import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, Settings2, Eye, AlertCircle } from 'lucide-react';
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

const getColumnLetter = (n: number) => {
  let letter = "";
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
};

function parseExcelDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    
    // Intento manual para formatos DD/MM/YYYY o MM/DD/YYYY
    const parts = val.split(/[\/\-.]/);
    if (parts.length === 3) {
      let d = parseInt(parts[0]), m = parseInt(parts[1]), y = parseInt(parts[2]);
      if (y < 100) y += 2000;
      // Si el primer número es > 12, asumimos DD/MM
      if (d > 12) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      // Por defecto intentamos MM/DD si es ambiguo o según Date
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
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
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:ZZ500');
      // Forzamos al menos 26 columnas (A-Z) si el archivo reporta pocas
      setAvailableCols(Math.max(range.e.c + 1, 26));
    } catch (err) {
      toast.error('Error al leer el archivo');
    } finally {
      setLoading(false);
    }
  };

  const onProcess = () => {
    if (!workbookData) return;
    const ws = workbookData.Sheets[workbookData.SheetNames[0]];
    // Leemos TODA la hoja como matriz, incluyendo filas vacías al inicio
    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null }) as any[][];

    const rows: ParsedRow[] = [];
    
    data.forEach((r, index) => {
      if (!r || r.length === 0) return;

      const clientName = r[columnMapping['client_name']] ? String(r[columnMapping['client_name']]).trim() : '';
      const dateVal = parseExcelDate(r[columnMapping['date']]);
      const company = r[columnMapping['company']] ? String(r[columnMapping['company']]).trim() : '';

      // Filtro dinámico: Saltamos si no hay nombre o fecha válida
      // También saltamos si el nombre contiene la palabra "cliente" (probablemente el encabezado)
      if (!clientName || !dateVal || clientName.toLowerCase() === 'cliente' || clientName.toLowerCase() === 'nombre') return;

      rows.push({
        date: dateVal,
        company: company || 'N/A',
        client_name: clientName,
        collection_date: parseExcelDate(r[columnMapping['collection_date']]),
        phone_number: r[columnMapping['phone']] ? String(r[columnMapping['phone']]) : null,
        status: STATUS_MAP[String(r[columnMapping['status']]).toLowerCase().trim()] || 'pendiente',
        policy_number: r[columnMapping['policy']] ? String(r[columnMapping['policy']]) : null,
        notes: r[columnMapping['notes']] ? String(r[columnMapping['notes']]) : null,
        location: r[columnMapping['location']] ? String(r[columnMapping['location']]) : null,
        agent_premium: typeof r[columnMapping['premium']] === 'number' ? r[columnMapping['premium']] : null,
        target_premium: typeof r[columnMapping['target']] === 'number' ? r[columnMapping['target']] : null,
        total_commission: typeof r[columnMapping['commission']] === 'number' ? r[columnMapping['commission']] : null,
        payment_method: typeof r[columnMapping['premium']] === 'number' ? `$${r[columnMapping['premium']]}/mes` : null,
      });
    });

    if (rows.length === 0) {
      toast.error('No se encontraron datos. Asegúrate de elegir las letras correctas donde están los nombres y fechas.');
    } else {
      setPreview(rows);
      toast.success(`${rows.length} filas detectadas correctamente.`);
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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            Importación Manual — {agentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="w-full h-16 border-dashed" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
            {file ? `Archivo: ${file.name}` : 'Haz clic para subir el Excel'}
          </Button>

          {availableCols > 0 && !preview && !result && (
            <div className="bg-muted/50 p-4 rounded-lg border space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Settings2 className="h-4 w-4" /> CONFIGURA LAS LETRAS DE TU EXCEL
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'client_name', label: 'Nombre Cliente' },
                  { id: 'date', label: 'Fecha Cierre' },
                  { id: 'company', label: 'Compañía' },
                  { id: 'status', label: 'Estatus' },
                  { id: 'policy', label: 'Nro Póliza' },
                  { id: 'premium', label: 'Prima/Monto' }
                ].map(field => (
                  <div key={field.id} className="space-y-1">
                    <p className="text-[10px] font-bold text-primary">{field.label}</p>
                    <select 
                      className="w-full text-[11px] p-2 rounded border bg-background"
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
                className="w-full font-bold" 
                disabled={columnMapping.client_name === undefined || columnMapping.date === undefined}
                onClick={onProcess}
              >
                <Eye className="h-4 w-4 mr-2" /> Analizar Columnas Seleccionadas
              </Button>
            </div>
          )}

          {preview && !result && (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-[11px] text-amber-800">
                  Verifica que los datos coincidan. Si ves nombres donde deberían ir fechas, dale a "Corregir" y cambia las letras.
                </p>
              </div>
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted px-3 py-1.5 text-[10px] font-bold uppercase">Vista previa de datos</div>
                <div className="max-h-40 overflow-y-auto text-xs divide-y bg-white">
                  {preview.slice(0, 10).map((r, i) => (
                    <div key={i} className="p-2 flex justify-between">
                      <span className="font-medium">{r.client_name}</span>
                      <span className="text-muted-foreground">{r.date} | {r.company}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>Corregir</Button>
                <Button className="flex-[2] bg-green-600 hover:bg-green-700" onClick={handleImport} disabled={importing}>
                  {importing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Importar {preview.length} pólizas
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <div>
                <p className="font-bold text-green-800 text-lg">¡Importación Exitosa!</p>
                <p className="text-xs text-green-700">Se agregaron {result.inserted} pólizas nuevas y se saltaron {result.skipped} duplicados.</p>
              </div>
              <Button variant="outline" size="sm" onClick={resetState}>Cargar otro Excel</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
