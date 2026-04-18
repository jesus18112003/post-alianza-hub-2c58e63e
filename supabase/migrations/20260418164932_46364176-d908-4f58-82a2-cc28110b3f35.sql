CREATE TABLE public.policy_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  created_by uuid NOT NULL,
  note text NOT NULL,
  call_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage call_logs"
ON public.policy_call_logs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_call_logs_policy_date ON public.policy_call_logs (policy_id, call_date DESC);