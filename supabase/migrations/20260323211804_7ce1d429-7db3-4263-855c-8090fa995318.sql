
-- Agent details (SSN, DOB, personal emails)
CREATE TABLE public.agent_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ssn text,
  date_of_birth date,
  personal_email text,
  secondary_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agent_details"
  ON public.agent_details FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own details"
  ON public.agent_details FOR SELECT
  USING (auth.uid() = agent_id);

-- Producer numbers per insurance company
CREATE TABLE public.agent_producer_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  producer_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_producer_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage producer_numbers"
  ON public.agent_producer_numbers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own producer_numbers"
  ON public.agent_producer_numbers FOR SELECT
  USING (auth.uid() = agent_id);

-- Portal credentials (username/password per portal)
CREATE TABLE public.agent_portal_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  portal_username text NOT NULL,
  portal_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_portal_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage portal_credentials"
  ON public.agent_portal_credentials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own portal_credentials"
  ON public.agent_portal_credentials FOR SELECT
  USING (auth.uid() = agent_id);
