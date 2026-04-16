CREATE TABLE public.policy_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage policy_requirements"
ON public.policy_requirements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_policy_requirements_updated_at
BEFORE UPDATE ON public.policy_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_policy_requirements_unresolved ON public.policy_requirements(policy_id) WHERE resolved = false;