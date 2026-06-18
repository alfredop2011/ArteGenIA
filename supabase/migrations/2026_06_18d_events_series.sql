-- Series recurrentes (aditivo): agrupar las ocurrencias del mismo evento
-- (ej. "Eco Tumbao" cada jueves) por una clave normalizada del título.
-- Permite: agrupar la serie + detectar/actualizar la ocurrencia correcta
-- cuando llega un flyer de cambio o cancelación (en vez de duplicar).
-- =====================================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series_key text;

-- Índice para localizar rápido la ocurrencia (remitente + fecha + serie).
CREATE INDEX IF NOT EXISTS idx_events_series_match
  ON public.events(submitter_ref, event_date, series_key);
