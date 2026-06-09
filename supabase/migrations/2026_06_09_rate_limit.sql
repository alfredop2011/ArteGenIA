-- Migration: helper de rate limit reusando ai_usage
--
-- Aprovecha la tabla `ai_usage` que ya existe para cuotas mensuales y
-- añade una funcion `count_ai_usage_last_minutes(user, action, minutes)`
-- que cuenta cuantas operaciones hizo el user en los ultimos N minutos.
--
-- Asi tenemos rate limit corto (anti-burst) sin necesidad de tabla nueva
-- ni servicio externo (Upstash). Si el user esta dentro del limite mensual
-- pero hace 50 calls en 1 minuto, el endpoint le devuelve 429.
--
-- Ejecutar manualmente en SQL editor de Supabase.

create or replace function count_ai_usage_last_minutes(
  p_user_id uuid,
  p_action text,
  p_minutes int
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from ai_usage
  where user_id = p_user_id
    and action = p_action
    and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

grant execute on function count_ai_usage_last_minutes(uuid, text, int) to authenticated;

comment on function count_ai_usage_last_minutes is
  'Cuenta cuantas filas de ai_usage del user/action existen en los ultimos N minutos. Usado para rate limiting anti-burst.';
