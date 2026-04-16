
CREATE TABLE public.ledger_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  policy_id uuid NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, policy_id)
);

ALTER TABLE public.ledger_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage own ledger notes"
  ON public.ledger_notes FOR ALL
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Admins manage all ledger notes"
  ON public.ledger_notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ledger_notes_updated_at
  BEFORE UPDATE ON public.ledger_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
