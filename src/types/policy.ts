export interface Policy {
  id: string;
  agent_id: string;
  date: string;
  company: string;
  client_name: string;
  client_first_name: string | null;
  client_last_name: string | null;
  status: 'emitido' | 'cobrado' | 'pendiente' | 'fondo_insuficiente' | 'descalificado' | 'cancelado' | 'chargeback' | 'aprobado';
  policy_number: string | null;
  location: string | null;
  policy_type: string | null;
  payment_method: string | null;
  target_premium: number | null;
  prima_payment: number | null;
  agent_premium: number | null;
  total_commission: number | null;
  bank_amount: number | null;
  notes: string | null;
  notes_updated_at: string | null;
  phone_number: string | null;
  collection_date: string | null;
  created_at: string;
  updated_at: string;
}
