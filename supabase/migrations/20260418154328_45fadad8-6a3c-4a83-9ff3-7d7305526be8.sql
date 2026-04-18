ALTER TABLE public.policies
ADD COLUMN assignees TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_policies_assignees ON public.policies USING GIN(assignees);