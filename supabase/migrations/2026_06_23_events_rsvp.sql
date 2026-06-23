-- RSVP / asistencia de eventos (aditivo).
--   - rsvp_count: cuánta gente ha pulsado "Voy".
--   - set_event_rsvp: suma/resta 1 de forma atómica desde el cliente público
--     (anónimo). El navegador recuerda en localStorage si ya marcó "Voy" para
--     poder alternar y no contar doble. Devuelve el nuevo total.
-- =====================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rsvp_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.set_event_rsvp(p_id uuid, p_delta int)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.events SET rsvp_count = GREATEST(0, rsvp_count + p_delta)
   WHERE id = p_id AND status IN ('published','cancelled')
  RETURNING rsvp_count;
$$;
