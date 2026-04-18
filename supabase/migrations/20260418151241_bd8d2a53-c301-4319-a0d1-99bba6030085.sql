-- 1. Carriers configurables por agente (cada admin define qué carriers existen para cada agente)
CREATE TABLE public.carrier_totals_carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (agent_id, name)
);

-- 2. Comisiones diarias por carrier para cada agente
CREATE TABLE public.carrier_totals_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  carrier_id UUID NOT NULL REFERENCES public.carrier_totals_carriers(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (carrier_id, entry_date)
);

-- 3. Toggle por agente: ¿está habilitada la página "Total de Carrier" en su sidebar?
CREATE TABLE public.carrier_totals_access (
  agent_id UUID NOT NULL PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_carrier_totals_carriers_agent ON public.carrier_totals_carriers(agent_id, position);
CREATE INDEX idx_carrier_totals_entries_agent_date ON public.carrier_totals_entries(agent_id, entry_date DESC);

-- Triggers para updated_at
CREATE TRIGGER update_carrier_totals_entries_updated_at
  BEFORE UPDATE ON public.carrier_totals_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_totals_access_updated_at
  BEFORE UPDATE ON public.carrier_totals_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.carrier_totals_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_totals_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_totals_access ENABLE ROW LEVEL SECURITY;

-- Admins: control total
CREATE POLICY "Admins manage carrier_totals_carriers"
  ON public.carrier_totals_carriers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage carrier_totals_entries"
  ON public.carrier_totals_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage carrier_totals_access"
  ON public.carrier_totals_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Agentes: solo lectura de sus propios datos, y solo si tienen acceso habilitado
CREATE POLICY "Agents view own carriers when enabled"
  ON public.carrier_totals_carriers FOR SELECT
  USING (
    auth.uid() = agent_id
    AND EXISTS (SELECT 1 FROM public.carrier_totals_access a WHERE a.agent_id = auth.uid() AND a.enabled = true)
  );

CREATE POLICY "Agents view own entries when enabled"
  ON public.carrier_totals_entries FOR SELECT
  USING (
    auth.uid() = agent_id
    AND EXISTS (SELECT 1 FROM public.carrier_totals_access a WHERE a.agent_id = auth.uid() AND a.enabled = true)
  );

CREATE POLICY "Agents view own access flag"
  ON public.carrier_totals_access FOR SELECT
  USING (auth.uid() = agent_id);