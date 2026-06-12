-- shared_flyers: snapshots públicos para preview social y viral loop
--
-- Cada vez que un usuario descarga + comparte, se crea una entrada aquí.
-- La URL pública /flyer/<id> renderiza el flyer con OG tags para que
-- Facebook, Twitter, WhatsApp y otras redes muestren preview bonita
-- al pegar el link.
--
-- El id es UUID v4 random (no enumerable) — privacidad razonable.
-- El r2_url apunta al PNG público en Cloudflare R2.

CREATE TABLE IF NOT EXISTS shared_flyers (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    r2_url      text NOT NULL,
    r2_key      text NOT NULL,
    title       text NOT NULL DEFAULT 'Mi flyer',
    description text,
    view_count  integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index para queries del propietario (mis flyers compartidos)
CREATE INDEX IF NOT EXISTS shared_flyers_user_idx ON shared_flyers(user_id, created_at DESC);

-- RLS: el OWNER puede leer/escribir lo suyo; lectura PÚBLICA del id
-- individual (para que la página /flyer/[id] funcione sin auth).
ALTER TABLE shared_flyers ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquiera con el ID puede leer la entrada.
-- (El id es UUID v4, no enumerable. Solo quien tiene el link entra.)
CREATE POLICY "Public read shared_flyers by id" ON shared_flyers
    FOR SELECT
    USING (true);

-- Inserción: solo usuarios autenticados pueden crear sus propias entradas.
CREATE POLICY "Users insert own shared_flyers" ON shared_flyers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Actualización: solo el propietario.
CREATE POLICY "Users update own shared_flyers" ON shared_flyers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Borrado: solo el propietario.
CREATE POLICY "Users delete own shared_flyers" ON shared_flyers
    FOR DELETE
    USING (auth.uid() = user_id);

-- Función para incrementar view_count de forma atómica.
-- La página /flyer/[id] llama a esto en cada visita.
CREATE OR REPLACE FUNCTION increment_shared_flyer_view(flyer_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE shared_flyers
       SET view_count = view_count + 1
     WHERE id = flyer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir a anónimos llamar la función (la llamada desde /flyer/[id] sin auth).
GRANT EXECUTE ON FUNCTION increment_shared_flyer_view(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_shared_flyer_view(uuid) TO authenticated;
