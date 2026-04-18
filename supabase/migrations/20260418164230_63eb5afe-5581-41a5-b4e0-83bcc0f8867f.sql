ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS scheduled_call_date date;

CREATE INDEX IF NOT EXISTS idx_policies_call_followup ON public.policies (needs_call_followup, scheduled_call_date) WHERE needs_call_followup = true;
CREATE INDEX IF NOT EXISTS idx_policies_agent_scheduled ON public.policies (agent_id, scheduled_call_date);