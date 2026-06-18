-- Engagement + avisos del bot (aditivo).
--   - view_count / click_count: cuánta gente ve el evento y pulsa "comprar".
--   - bot_subscribers: preferencias del organizador en el bot (silenciar).
--   - RPCs para incrementar contadores desde el cliente público (anónimo).
-- =====================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;

-- Preferencias del organizador en el bot (identificado por su chat).
CREATE TABLE IF NOT EXISTS public.bot_subscribers (
  channel        text NOT NULL,           -- 'telegram' | 'whatsapp'
  ref            text NOT NULL,           -- chat id / teléfono
  name           text,
  muted          boolean NOT NULL DEFAULT false, -- el organizador pidió no recibir avisos
  last_digest_at timestamptz,             -- último resumen enviado (anti-spam)
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel, ref)
);
-- Solo el service role (bot/cron) la toca. RLS activa sin policies = nadie más.
ALTER TABLE public.bot_subscribers ENABLE ROW LEVEL SECURITY;

-- Incrementos atómicos llamables por el público anónimo (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.increment_event_view(p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.events SET view_count = view_count + 1
   WHERE id = p_id AND status IN ('published','cancelled');
$$;

CREATE OR REPLACE FUNCTION public.increment_event_click(p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.events SET click_count = click_count + 1
   WHERE id = p_id AND status IN ('published','cancelled');
$$;
