-- Precios múltiples + contacto del remitente (aditivo).
--
-- price_info: muchos eventos tienen varias tarifas (Anticipada/Taquilla,
--   General/VIP…). `price` sigue siendo el precio "desde" (mínimo, para chip y
--   orden); `price_info` guarda el detalle tal cual:
--     ej. "Anticipada 12€ · Taquilla 15€"  |  "General 20€ / VIP 50€"
--
-- submitter_email: email del remitente del bot (mínimo de contacto). Si al
--   flyer le faltan datos y no está registrado, podemos avisarle por email e
--   invitarle a registrarse para completarlo.
-- =====================================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price_info text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS submitter_email text;
