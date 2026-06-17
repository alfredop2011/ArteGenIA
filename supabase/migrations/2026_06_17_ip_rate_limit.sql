-- ════════════════════════════════════════════════════════════════════════
-- RATE LIMIT POR IP PARA ENDPOINTS PÚBLICOS (2026-06-17)
--
-- waitlist y feedback son públicos (sin auth) e insertan vía service_role
-- (bypass RLS). Sin throttle, cualquiera puede inundar las tablas con curl.
-- Esta tabla + RPC permiten un rate limit por IP best-effort (anti-spam).
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ip_rate_limit (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip          text NOT NULL,
  action      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ip_rate_limit_lookup
  ON public.ip_rate_limit (ip, action, created_at);

ALTER TABLE public.ip_rate_limit ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo service_role (que bypassa RLS) puede leer/escribir.

-- Cuenta hits de una IP+acción en los últimos N minutos.
CREATE OR REPLACE FUNCTION public.count_ip_rate_limit(
  p_ip text, p_action text, p_minutes integer
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM ip_rate_limit
  WHERE ip = p_ip
    AND action = p_action
    AND created_at >= now() - make_interval(mins => p_minutes)
$$;

-- Solo service_role ejecuta (los endpoints públicos usan SERVICE_ROLE_KEY).
REVOKE EXECUTE ON FUNCTION public.count_ip_rate_limit(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.count_ip_rate_limit(text, text, integer) TO service_role;
