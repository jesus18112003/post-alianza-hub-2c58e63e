-- Add notification_type to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_type text NOT NULL DEFAULT 'commission';

-- Create followups table
CREATE TABLE public.policy_followups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id uuid NOT NULL,
  reason text NOT NULL,
  due_date date NOT NULL,
  notify_days_before integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_followups_policy_id ON public.policy_followups(policy_id);
CREATE INDEX idx_policy_followups_status_due ON public.policy_followups(status, due_date);

ALTER TABLE public.policy_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage followups"
ON public.policy_followups
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_policy_followups_updated_at
BEFORE UPDATE ON public.policy_followups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create followup notifications for all admins
CREATE OR REPLACE FUNCTION public.check_followup_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fu RECORD;
  admin_rec RECORD;
  policy_rec RECORD;
  days_left integer;
  msg text;
BEGIN
  FOR fu IN 
    SELECT * FROM public.policy_followups 
    WHERE status = 'pending' 
    AND due_date <= CURRENT_DATE + (notify_days_before || ' days')::interval
  LOOP
    days_left := fu.due_date - CURRENT_DATE;
    
    SELECT client_name, company INTO policy_rec FROM public.policies WHERE id = fu.policy_id;
    IF NOT FOUND THEN CONTINUE; END IF;

    IF days_left < 0 THEN
      msg := '⚠️ VENCIDO (' || ABS(days_left) || 'd): ' || fu.reason || ' - ' || policy_rec.client_name || ' (' || policy_rec.company || ')';
    ELSIF days_left = 0 THEN
      msg := '🔔 HOY vence: ' || fu.reason || ' - ' || policy_rec.client_name || ' (' || policy_rec.company || ')';
    ELSE
      msg := '⏰ En ' || days_left || 'd: ' || fu.reason || ' - ' || policy_rec.client_name || ' (' || policy_rec.company || ')';
    END IF;

    FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE agent_id = admin_rec.user_id 
        AND policy_id = fu.policy_id 
        AND notification_type = 'followup'
        AND read = false
        AND created_at > now() - interval '23 hours'
      ) THEN
        INSERT INTO public.notifications (agent_id, policy_id, message, expires_at, notification_type)
        VALUES (admin_rec.user_id, fu.policy_id, msg, now() + interval '30 days', 'followup');
      END IF;
    END LOOP;
  END LOOP;
END;
$$;