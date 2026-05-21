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

- **Auth/OAuth**: Site URL = `https://artegenia.vercel.app`. Redirect URLs permitidas en URL Configuration: `http://localhost:3000/auth/callback`, `https://artegenia.vercel.app/auth/callback`, `https://*.vercel.app/auth/callback`.
- **Google provider** activado en Auth → Providers con el OAuth Client ID de Google Cloud.
- Google Cloud OAuth Client tiene como Authorized redirect URIs las 3 anteriores + `https://tbuszlffgtjnbvkxhkti.supabase.co/auth/v1/callback`.

# Variables de entorno requeridas

En `.env.local` y en Vercel (Production + Preview + Development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, NUNCA exponerla al cliente)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- Otras: Fal.ai, remove.bg, etc.

