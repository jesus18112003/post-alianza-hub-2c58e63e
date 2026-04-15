
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  policy_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = agent_id);

CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for quick agent lookup
CREATE INDEX idx_notifications_agent_id ON public.notifications(agent_id);

-- Trigger: create notification when bank_amount is set
CREATE OR REPLACE FUNCTION public.notify_commission_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.bank_amount IS NULL OR OLD.bank_amount = 0)
     AND NEW.bank_amount IS NOT NULL AND NEW.bank_amount > 0 THEN
    INSERT INTO public.notifications (agent_id, policy_id, message, expires_at)
    VALUES (
      NEW.agent_id,
      NEW.id,
      'Comisión pagada: $' || ROUND(NEW.bank_amount::numeric, 2) || ' - ' || NEW.client_name || ' (' || NEW.company || ')',
      now() + interval '24 hours'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commission_paid
AFTER UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.notify_commission_paid();
