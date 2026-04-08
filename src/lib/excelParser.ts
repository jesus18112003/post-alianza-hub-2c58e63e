import * as XLSX from 'xlsx';

export interface ParsedRow {
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

export type DateFormat = 'auto' | 'us' | 'international';

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

// Maps of possible header variations → canonical field names
const HEADER_ALIASES: Record<string, string[]> = {
  date: ['fecha de cierre', 'fecha cierre', 'fecha', 'date', 'closing date', 'close date'],
  company: ['compañia', 'compania', 'company', 'aseguradora', 'carrier', 'insurance company', 'compañía'],
  collection_date: ['fecha de cobro', 'fecha cobro', 'collection date', 'payment date', 'fecha pago'],
  client_name: ['nombre del cliente', 'nombre cliente', 'client name', 'cliente', 'client', 'nombre', 'asegurado', 'insured', 'nombre del asegurado'],
  phone_number: ['telefono', 'teléfono', 'phone', 'phone number', 'celular', 'tel', 'número de teléfono', 'numero de telefono'],
  status: ['status', 'estado', 'estatus'],
  policy_number: ['numero de poliza', 'número de póliza', 'numero poliza', 'policy number', 'poliza', 'póliza', 'no. poliza', 'no. póliza', 'no poliza', '# poliza', '# póliza'],
  notes: ['notas', 'notes', 'observaciones', 'comentarios', 'comments'],
  location: ['ubicacion', 'ubicación', 'location', 'estado/ciudad', 'ciudad', 'city', 'state'],
  agent_premium: ['prima agente', 'agent premium', 'prima del agente', 'premium agente'],
  target_premium: ['prima objetivo', 'target premium', 'prima target', 'prima meta', 'annual premium', 'prima anual'],
  total_commission: ['comision total', 'comisión total', 'total commission', 'commission', 'comision', 'comisión'],
  payment_method: ['metodo de pago', 'método de pago', 'payment method', 'forma de pago', 'tipo de pago'],
};

interface ColumnMap {
  [field: string]: number; // field name → column index
}

function normalizeHeader(val: unknown): string {
  if (!val) return '';
  return String(val).trim().toLowerCase()
    .replace(/[áà]/g, 'a')
    .replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óò]/g, 'o')
    .replace(/[úù]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ');
}

function buildColumnMap(headerRow: unknown[]): ColumnMap {
  const map: ColumnMap = {};
  for (let i = 0; i < headerRow.length; i++) {
    const normalized = normalizeHeader(headerRow[i]);
    if (!normalized) continue;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (map[field] !== undefined) continue; // already found
      if (aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
        map[field] = i;
        break;
      }
    }
  }
  return map;
}

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
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const match = String(val).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      let y = parseInt(match[3], 10);
      if (y < 100) y += 2000;
      let month: number, day: number;
      if (format === 'international' || (format === 'auto' && a > 12)) { day = a; month = b; }
      else { month = a; day = b; }
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
  return STATUS_MAP[String(val).trim().toLowerCase()] || 'pendiente';
}

function getVal(row: unknown[], map: ColumnMap, field: string): unknown {
  const idx = map[field];
  return idx !== undefined ? row[idx] : undefined;
}

function getStr(row: unknown[], map: ColumnMap, field: string): string | null {
  const v = getVal(row, map, field);
  if (!v) return null;
  const s = String(v).trim();
  return s || null;
}

function getNum(row: unknown[], map: ColumnMap, field: string): number | null {
  const v = getVal(row, map, field);
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[,$]/g, ''));
    return isNaN(n) ? null : n;
  }
  return null;
}

export interface ParseResult {
  rows: ParsedRow[];
  detectedFormat: 'us' | 'international' | 'ambiguous';
  columnMap: ColumnMap;
  missingColumns: string[];
}

export function findSheet(workbook: XLSX.WorkBook): string {
  // Try to find "Aplicaciones BASE" first
  const match = workbook.SheetNames.find(
    (n) => normalizeHeader(n).includes('aplicacion') && normalizeHeader(n).includes('base')
  );
  if (match) return match;
  // Fallback: first sheet
  if (workbook.SheetNames.length > 0) return workbook.SheetNames[0];
  throw new Error('El archivo no contiene hojas');
}

export function parseSheet(workbook: XLSX.WorkBook, dateFormat: DateFormat, sheetName?: string): ParseResult {
  const sheet = sheetName || findSheet(workbook);
  const ws = workbook.Sheets[sheet];
  if (!ws) throw new Error(`No se encontró la hoja "${sheet}"`);

  const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null }) as unknown[][];

  // Find header row by looking for a row with multiple recognized headers
  let headerIdx = -1;
  let bestMap: ColumnMap = {};
  let bestScore = 0;

  for (let i = 0; i < Math.min(15, allRows.length); i++) {
    const row = allRows[i];
    if (!row) continue;
    const candidateMap = buildColumnMap(row);
    const score = Object.keys(candidateMap).length;
    if (score > bestScore) {
      bestScore = score;
      bestMap = candidateMap;
      headerIdx = i;
    }
  }

  if (headerIdx === -1 || bestScore < 2) {
    throw new Error('No se encontró una fila de encabezados reconocible. Verifica que el archivo tenga columnas como "Fecha", "Cliente", "Compañía", etc.');
  }

  const requiredFields = ['date', 'client_name', 'company'];
  const missingColumns = requiredFields.filter(f => bestMap[f] === undefined);

  const dataRows = allRows.slice(headerIdx + 1);

  // Detect date format using mapped date columns
  const dateIndices = [bestMap.date, bestMap.collection_date].filter((i): i is number => i !== undefined);
  const detectedFormat = detectDateFormat(dataRows, dateIndices);
  const effectiveFormat = dateFormat === 'auto' ? (detectedFormat === 'ambiguous' ? 'us' : detectedFormat) : dateFormat;

  const parsed: ParsedRow[] = [];
  for (const r of dataRows) {
    if (!r) continue;
    const clientName = getStr(r, bestMap, 'client_name');
    if (!clientName) continue;
    const dateVal = parseExcelDate(getVal(r, bestMap, 'date'), effectiveFormat);
    if (!dateVal) continue;
    const company = getStr(r, bestMap, 'company');
    if (!company) continue;

    const agentPremium = getNum(r, bestMap, 'agent_premium');

    parsed.push({
      date: dateVal,
      company,
      collection_date: parseExcelDate(getVal(r, bestMap, 'collection_date'), effectiveFormat),
      client_name: clientName,
      phone_number: cleanPhone(getVal(r, bestMap, 'phone_number')),
      status: mapStatus(getVal(r, bestMap, 'status')),
      policy_number: getStr(r, bestMap, 'policy_number'),
      notes: getStr(r, bestMap, 'notes'),
      location: getStr(r, bestMap, 'location'),
      agent_premium: agentPremium,
      target_premium: (() => { const v = getNum(r, bestMap, 'target_premium'); return v !== null ? Math.round((v / 12) * 100) / 100 : null; })(),
      total_commission: getNum(r, bestMap, 'total_commission'),
      payment_method: getStr(r, bestMap, 'payment_method') || (agentPremium ? `$${agentPremium}/mes` : null),
    });
  }

  return { rows: parsed, detectedFormat, columnMap: bestMap, missingColumns };
}
