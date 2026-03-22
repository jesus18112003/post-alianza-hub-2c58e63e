-- Create policy status enum
CREATE TYPE public.policy_status AS ENUM (
  'emitido',
  'cobrado',
  'pendiente',
  'fondo_insuficiente',
  'descalificado',
  'cancelado',
  'chargeback'
);

-- Create policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 4 Required pillars
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  company TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status policy_status NOT NULL DEFAULT 'pendiente',
  
  -- Optional fields
  policy_number TEXT,
  location TEXT,
  policy_type TEXT,
  payment_method TEXT,
  
  -- Financial
  target_premium NUMERIC(12,2),
  agent_premium NUMERIC(12,2),
  total_commission NUMERIC(12,2),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Agents can only see their own policies
CREATE POLICY "Agents can view own policies"
  ON public.policies FOR SELECT
  USING (auth.uid() = agent_id);

-- Admins can view all policies
CREATE POLICY "Admins can view all policies"
  ON public.policies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert policies
CREATE POLICY "Admins can insert policies"
  ON public.policies FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update policies
CREATE POLICY "Admins can update policies"
  ON public.policies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete policies
CREATE POLICY "Admins can delete policies"
  ON public.policies FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for agent lookup
CREATE INDEX idx_policies_agent_id ON public.policies(agent_id);
CREATE INDEX idx_policies_status ON public.policies(status);