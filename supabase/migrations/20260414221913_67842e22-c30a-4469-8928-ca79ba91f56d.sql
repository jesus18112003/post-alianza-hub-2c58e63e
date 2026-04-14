
-- Add new columns
ALTER TABLE public.policies
  ADD COLUMN client_first_name text,
  ADD COLUMN client_last_name text;

-- Populate existing data: split client_name on first space
UPDATE public.policies
SET
  client_first_name = CASE
    WHEN position(' ' in client_name) > 0 THEN left(client_name, position(' ' in client_name) - 1)
    ELSE client_name
  END,
  client_last_name = CASE
    WHEN position(' ' in client_name) > 0 THEN substring(client_name from position(' ' in client_name) + 1)
    ELSE ''
  END;

-- Create trigger function to auto-sync client_name from first+last
CREATE OR REPLACE FUNCTION public.sync_client_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If first/last provided, build client_name
  IF NEW.client_first_name IS NOT NULL AND NEW.client_last_name IS NOT NULL THEN
    NEW.client_name := trim(NEW.client_first_name || ' ' || NEW.client_last_name);
  -- If only client_name provided (legacy), split it
  ELSIF (NEW.client_first_name IS NULL OR NEW.client_last_name IS NULL) AND NEW.client_name IS NOT NULL AND NEW.client_name != '' THEN
    IF position(' ' in NEW.client_name) > 0 THEN
      NEW.client_first_name := left(NEW.client_name, position(' ' in NEW.client_name) - 1);
      NEW.client_last_name := substring(NEW.client_name from position(' ' in NEW.client_name) + 1);
    ELSE
      NEW.client_first_name := NEW.client_name;
      NEW.client_last_name := '';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_client_name
BEFORE INSERT OR UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.sync_client_name();
