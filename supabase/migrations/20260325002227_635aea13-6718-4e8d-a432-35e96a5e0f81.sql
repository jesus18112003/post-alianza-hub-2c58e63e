
CREATE TABLE public.closing_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_message_id text UNIQUE NOT NULL,
  raw_message text NOT NULL,
  amount numeric NULL,
  company text NULL,
  policy_type text NULL,
  payment_method text NULL,
  client_name text NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_agent_id uuid NULL,
  created_policy_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.closing_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage closing_assignments"
  ON public.closing_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_closing_assignments_updated_at
  BEFORE UPDATE ON public.closing_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
