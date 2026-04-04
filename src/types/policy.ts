export interface Policy {
  id: string;
  agent_id: string;
  date: string;
  company: string;
  client_name: string;
  status: 'emitido' | 'cobrado' | 'pendiente' | 'fondo_insuficiente' | 'descalificado' | 'cancelado' | 'chargeback';
  policy_number: string | null;
  location: string | null;
  policy_type: string | null;
  payment_method: string | null;
  target_premium: number | null;
  agent_premium: number | null;
  total_commission: number | null;
  notes: string | null;
  notes_updated_at: string | null;
  phone_number: string | null;
  collection_date: string | null;
  created_at: string;
  updated_at: string;
}