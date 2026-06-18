-- Nueva categoría "Bailes sociales" (social). Quitamos el CHECK rígido de
-- category para poder añadir categorías sin romper inserciones cada vez (la app
-- controla los valores válidos vía la UI/extractor). Aditivo, no borra datos.
-- =====================================================
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;
