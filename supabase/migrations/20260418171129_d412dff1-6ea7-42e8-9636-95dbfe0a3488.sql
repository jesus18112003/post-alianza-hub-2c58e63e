-- 1) Agregar columna internal_notes
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS internal_notes text;

-- 2) Revocar el SELECT de la columna internal_notes para el rol authenticated
-- Esto evita que cualquier cliente Supabase (agente o admin) pueda leerla directamente desde la tabla
REVOKE SELECT (internal_notes) ON public.policies FROM authenticated;
REVOKE UPDATE (internal_notes) ON public.policies FROM authenticated;
REVOKE INSERT (internal_notes) ON public.policies FROM authenticated;

-- 3) Función SECURITY DEFINER para que admins puedan leer internal_notes de una póliza
CREATE OR REPLACE FUNCTION public.get_policy_internal_notes(_policy_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notes text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NULL;
  END IF;
  SELECT internal_notes INTO v_notes FROM public.policies WHERE id = _policy_id;
  RETURN v_notes;
END;
$$;

-- 4) Función SECURITY DEFINER para que admins actualicen internal_notes
CREATE OR REPLACE FUNCTION public.set_policy_internal_notes(_policy_id uuid, _notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can edit internal notes';
  END IF;
  UPDATE public.policies SET internal_notes = _notes, updated_at = now() WHERE id = _policy_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_policy_internal_notes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_policy_internal_notes(uuid, text) TO authenticated;