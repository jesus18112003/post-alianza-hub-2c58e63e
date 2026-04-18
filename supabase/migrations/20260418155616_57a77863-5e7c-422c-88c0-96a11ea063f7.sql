ALTER TABLE public.policies
ADD COLUMN needs_call_followup boolean NOT NULL DEFAULT false;

CREATE INDEX idx_policies_needs_call_followup
ON public.policies (needs_call_followup)
WHERE needs_call_followup = true;