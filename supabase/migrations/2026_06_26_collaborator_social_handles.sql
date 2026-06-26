-- Colaboradores: añadir handles de redes sociales opcionales.
--
-- Hasta ahora solo guardábamos `phone` para contactar al colaborador (vía
-- WhatsApp). Para la feature "Enviar a colaboradores" del editor (publicar
-- flyer + pedir a cada colab que lo comparta en su privado) necesitamos
-- también Telegram e Instagram.
--
-- AMBOS OPCIONALES — el colaborador los rellena al subir su foto, pero
-- puede dejarlos en blanco. Sin handle = no aparece el botón de ese canal
-- en el modal de "Enviar a colaboradores".
--
-- Formato:
--   telegram_handle: sin '@' (normalizado en backend). Ej: "djnayaoficial"
--   instagram_handle: sin '@'. Ej: "djnayaoficial"
-- Validación frontend ya quita el '@' si el user lo pone.

ALTER TABLE public.collaborators
    ADD COLUMN IF NOT EXISTS telegram_handle  TEXT,
    ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

COMMENT ON COLUMN public.collaborators.telegram_handle  IS 'Telegram username sin @ (ej. "djnayaoficial"). NULL si el colab no lo proporcionó.';
COMMENT ON COLUMN public.collaborators.instagram_handle IS 'Instagram handle sin @ (ej. "djnayaoficial"). NULL si el colab no lo proporcionó.';
