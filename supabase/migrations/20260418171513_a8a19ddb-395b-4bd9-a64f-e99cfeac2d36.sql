-- 1) Agregar columna
ALTER TABLE public.agent_details
ADD COLUMN IF NOT EXISTS personal_email_password text;

-- 2) Bloquear acceso directo a la columna desde el rol authenticated
REVOKE SELECT (personal_email_password) ON public.agent_details FROM authenticated;
REVOKE INSERT (personal_email_password) ON public.agent_details FROM authenticated;
REVOKE UPDATE (personal_email_password) ON public.agent_details FROM authenticated;

-- 3) Funciones SECURITY DEFINER restringidas a admins
CREATE OR REPLACE FUNCTION public.get_agent_email_password(_agent_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NULL;
  END IF;
  SELECT personal_email_password INTO v FROM public.agent_details WHERE agent_id = _agent_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_agent_email_password(_agent_id uuid, _password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can manage email passwords';
  END IF;

  -- Upsert: ensure agent_details row exists
  INSERT INTO public.agent_details (agent_id, personal_email_password)
  VALUES (_agent_id, _password)
  ON CONFLICT (agent_id) DO UPDATE
    SET personal_email_password = EXCLUDED.personal_email_password,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_email_password(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_agent_email_password(uuid, text) TO authenticated;

-- 4) Asegurar UNIQUE constraint en agent_id para que el ON CONFLICT funcione
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agent_details_agent_id_key'
  ) THEN
    ALTER TABLE public.agent_details ADD CONSTRAINT agent_details_agent_id_key UNIQUE (agent_id);
  END IF;
END $$;