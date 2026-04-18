CREATE TABLE public.internal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT false,
  mentions TEXT[] NOT NULL DEFAULT '{}',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_internal_tasks_mentions ON public.internal_tasks USING GIN(mentions);
CREATE INDEX idx_internal_tasks_status ON public.internal_tasks(status, archived);

ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage internal_tasks"
ON public.internal_tasks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_internal_tasks_updated_at
BEFORE UPDATE ON public.internal_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_tasks;