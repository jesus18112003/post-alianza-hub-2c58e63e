import { Policy } from '@/types/policy';

export function exportPoliciesToCsv(
  policies: Policy[],
  agentMap: Record<string, string>,
  filename = 'polizas_respaldo.csv'
) {
  const headers = [
    'Fecha',
    'Agente',
    'Compañía',
    'Cliente',
    'Estado',
    'Número de Póliza',
    'Tipo de Póliza',
    'Método de Pago',
    'Ubicación',
    'Annual Premium',
    'Pago de Prima',
    'Prima Agente',
    'Comisión Total',
    'Entró al Banco',
    'Chargeback',
    'Teléfono',
    'Fecha de Cobro',
    'Notas',
  ];

  const rows = policies.map((p) => [
    p.date,
    agentMap[p.agent_id] ?? p.agent_id,
    p.company,
    p.client_name,
    p.status,
    p.policy_number ?? '',
    p.policy_type ?? '',
    p.payment_method ?? '',
    p.location ?? '',
    p.target_premium ?? '',
    p.prima_payment ?? '',
    p.agent_premium ?? '',
    p.total_commission ?? '',
    p.bank_amount ?? '',
    p.chargeback_amount ?? '',
    p.phone_number ?? '',
    p.collection_date ?? '',
    p.notes ?? '',
  ]);

  const escapeCsv = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
