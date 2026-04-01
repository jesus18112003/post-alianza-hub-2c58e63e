
CREATE TABLE public.welcome_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID DEFAULT NULL,
  name TEXT NOT NULL DEFAULT 'Plantilla por defecto',
  template_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage welcome_templates"
  ON public.welcome_templates
  FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
