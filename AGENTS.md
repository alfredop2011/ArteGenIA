<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Infraestructura — Cloudflare R2

El bucket público de R2 (`pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev`) requiere una política CORS para que Fabric.js (y cualquier `<img crossOrigin="anonymous">`) pueda cargar las imágenes desde el navegador.

Si en consola aparece `Access-Control-Allow-Origin not allowed` o `fabric: Error loading https://pub-...r2.dev/...`, configurar la política CORS en Cloudflare Dashboard → R2 → bucket → Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://artegenia.com",
      "https://www.artegenia.com",
      "https://artegenia.vercel.app",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Tras guardar, esperar ~1 min de propagación y hacer hard refresh (Cmd+Shift+R) para vaciar caché de respuestas sin CORS.

# Infraestructura — Supabase

- **Auth/OAuth**: Site URL = `https://artegenia.com` (dominio propio desde 2026-06-16). Redirect URLs permitidas en URL Configuration: `http://localhost:3000/auth/callback`, `https://artegenia.com/auth/callback`, `https://www.artegenia.com/auth/callback`, `https://artegenia.vercel.app/auth/callback` (legacy), `https://*.vercel.app/auth/callback`.
- **Google provider** activado en Auth → Providers con el OAuth Client ID de Google Cloud.
- Google Cloud OAuth Client tiene como Authorized redirect URIs las 5 anteriores + `https://tbuszlffgtjnbvkxhkti.supabase.co/auth/v1/callback`.
- **Custom SMTP (emails de Auth)**: Resend SMTP. Host `smtp.resend.com`, port 465, username `resend`, password = `RESEND_API_KEY`. Sender: `hola@artegenia.com` (ArteGenIA).

# Infraestructura — Resend (email transactional)

Dominio `artegenia.com` verificado en Resend (DKIM + SPF + DMARC publicados como DNS records en Vercel Domains).

4 emails transactional implementados en [lib/email.ts](lib/email.ts):
- Welcome (tras signup confirmado)
- LowCredits (cron diario si balance < 20% del grant)
- UpgradePro (tras `checkout.session.completed` de Stripe)
- Cancel (tras `customer.subscription.deleted`)

Env vars requeridas (en Vercel + `.env.local`):
- `RESEND_API_KEY` — API key personal de Resend
- `RESEND_FROM_EMAIL` — `ArteGenIA <hola@artegenia.com>` (dominio verificado)
- `NEXT_PUBLIC_APP_URL` — `https://artegenia.com` (usado en CTAs de los emails)

Si las env vars faltan, los emails son NO-OP con warning en logs (no rompen producción).

# Variables de entorno requeridas

En `.env.local` y en Vercel (Production + Preview + Development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, NUNCA exponerla al cliente)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (auth Bearer para Vercel Cron endpoints)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_PRICE_ID_YEARLY`, etc.
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Otras: Fal.ai, remove.bg, etc.

