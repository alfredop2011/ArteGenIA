-- ═══════════════════════════════════════════════════════════════════
-- RESET COMPLETO — dejar SOLO al admin en toda la base
-- ═══════════════════════════════════════════════════════════════════
--
-- QUÉ HACE ESTE SCRIPT:
--   Borra TODOS los usuarios de auth.users y TODAS las filas de las
--   tablas de aplicación EXCEPTO las del admin (alfredop2011@gmail.com).
--
-- ⚠️  DESTRUCTIVO E IRREVERSIBLE ⚠️
--   NO hay UNDO. Antes de ejecutar en producción:
--     1. Descarga un backup manual desde Supabase Dashboard →
--        Database → Backups → "Create backup now"
--     2. Ejecuta primero la sección [DRY-RUN] para contar qué se borra
--     3. Solo si los conteos tienen sentido, ejecuta [BORRADO]
--
-- CÓMO EJECUTARLO:
--   Supabase Dashboard → SQL Editor → New query → pega el contenido
--   → Run. Todo el script está dentro de un solo transaction — si
--   algo falla se hace ROLLBACK automático.
--
-- ORDEN DE BORRADO:
--   Sigue las FK: primero tablas hijas, luego padres. Termina con
--   auth.users (que a través de CASCADE borraría el resto igualmente,
--   pero mejor explícito por si hay tablas sin CASCADE).
-- ═══════════════════════════════════════════════════════════════════

-- ─── [DRY-RUN] cuenta qué se BORRARÍA (comentado por defecto) ────
-- Descomenta este bloque para VER qué se va a borrar antes del wipe.
-- Vuélvelo a comentar cuando pases al bloque de borrado real.
--
-- DO $$
-- DECLARE
--     admin_uid uuid;
--     n bigint;
-- BEGIN
--     SELECT id INTO admin_uid FROM auth.users
--     WHERE email = 'alfredop2011@gmail.com' LIMIT 1;
--
--     IF admin_uid IS NULL THEN
--         RAISE EXCEPTION '✖ Admin no encontrado. Revisa el email en el script.';
--     END IF;
--     RAISE NOTICE '✓ Admin UID: %', admin_uid;
--
--     SELECT COUNT(*) INTO n FROM auth.users WHERE id != admin_uid;
--     RAISE NOTICE 'auth.users a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.profiles WHERE id != admin_uid;
--     RAISE NOTICE 'profiles a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.projects WHERE user_id != admin_uid;
--     RAISE NOTICE 'projects a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.collaborators WHERE owner_id != admin_uid;
--     RAISE NOTICE 'collaborators a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.user_assets WHERE user_id != admin_uid;
--     RAISE NOTICE 'user_assets a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.user_credits WHERE user_id != admin_uid;
--     RAISE NOTICE 'user_credits a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.credit_transactions WHERE user_id != admin_uid;
--     RAISE NOTICE 'credit_transactions a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.notifications WHERE user_id != admin_uid;
--     RAISE NOTICE 'notifications a borrar: %', n;
--     SELECT COUNT(*) INTO n FROM public.shared_flyers WHERE user_id != admin_uid;
--     RAISE NOTICE 'shared_flyers a borrar: %', n;
-- END $$;

-- ─── [BORRADO] wipe real (comentado por defecto) ─────────────────
-- Descomenta este bloque SOLO cuando el dry-run confirmó los conteos.
-- Todo el bloque va en un solo transaction — ROLLBACK atómico si falla.
--
BEGIN;

DO $$
DECLARE
    admin_uid uuid;
    admin_email text := 'alfredop2011@gmail.com';
BEGIN
    -- Localizar UUID del admin
    SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email LIMIT 1;
    IF admin_uid IS NULL THEN
        RAISE EXCEPTION '✖ Admin no encontrado con email %. Aborto.', admin_email;
    END IF;
    RAISE NOTICE '✓ Admin UID preservado: %', admin_uid;

    -- ─── Tablas de aplicación (hijas primero por FK) ───────────
    DELETE FROM public.credit_transactions WHERE user_id != admin_uid;
    DELETE FROM public.notifications      WHERE user_id != admin_uid;
    DELETE FROM public.phone_verifications WHERE user_id != admin_uid;
    DELETE FROM public.user_assets        WHERE user_id != admin_uid;
    DELETE FROM public.user_credits       WHERE user_id != admin_uid;

    -- collaborators tiene owner_id (no user_id)
    DELETE FROM public.collaborators      WHERE owner_id != admin_uid;

    -- Invites: si la tabla existe con FK a owner
    DELETE FROM public.collaborator_invites WHERE owner_id != admin_uid;

    -- Proyectos y flyers compartidos
    DELETE FROM public.projects           WHERE user_id != admin_uid;
    DELETE FROM public.shared_flyers      WHERE user_id != admin_uid;

    -- Feedback + waitlist: opcional. Waitlist se vacía completo
    -- (no tiene user_id, son leads externos que ya no valen).
    DELETE FROM public.feedback           WHERE user_id != admin_uid;
    TRUNCATE TABLE public.waitlist;

    -- AI usage tracking (uso histórico ajeno)
    DELETE FROM public.ai_usage           WHERE user_id != admin_uid;

    -- Bot subscribers (Telegram) — si tiene user_id FK
    DELETE FROM public.bot_subscribers    WHERE user_id != admin_uid;

    -- Stripe events: histórico completo. Se vacía TODO (los eventos
    -- del admin también son ruido si son de pruebas anteriores).
    TRUNCATE TABLE public.stripe_events;

    -- IP rate limit: cache, vaciar todo.
    TRUNCATE TABLE public.ip_rate_limit;

    -- Eventos de la agenda cultural (peligroficial): si son públicos
    -- y no ligados a user, mantenerlos. Si prefieres wipe total,
    -- descomenta la siguiente línea.
    -- TRUNCATE TABLE public.events;

    -- ─── Profiles: borrar todo excepto admin ──────────────────
    DELETE FROM public.profiles           WHERE id != admin_uid;

    -- ─── Finalmente auth.users ────────────────────────────────
    -- Esto borra sesiones, refresh tokens, magic links,
    -- identidades OAuth, etc. de todos menos el admin.
    DELETE FROM auth.users                WHERE id != admin_uid;

    RAISE NOTICE '✓ Reset completado. Solo % queda en la base.', admin_email;
END $$;

COMMIT;

-- ─── VERIFICACIÓN POST-WIPE ──────────────────────────────────────
-- Estas SELECTs deben devolver todas 1 (o 0 si el admin no había
-- creado datos en esa tabla). Si alguna devuelve > 1, hay fugas.
--
-- SELECT 'auth.users', COUNT(*) FROM auth.users;
-- SELECT 'profiles',   COUNT(*) FROM public.profiles;
-- SELECT 'projects',   COUNT(*) FROM public.projects;
-- SELECT 'collaborators', COUNT(*) FROM public.collaborators;
-- SELECT 'user_assets', COUNT(*) FROM public.user_assets;
