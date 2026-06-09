# Email branding — ArteGenIA

Plantillas HTML personalizadas para los emails transaccionales de Supabase + setup de SMTP custom (Resend) para que salgan desde tu dominio en vez del de Supabase.

## Resultado esperado

| Sin branding (default) | Con branding (este setup) |
|---|---|
| From: `noreply@mail.app.supabase.io` | From: `cuentas@peligroficial.com` |
| Asunto genérico en inglés | Asunto y cuerpo en español con tu marca |
| Sin logo | Logo AG · "Arte Gen" arriba |
| Botón gris/azul Supabase | Botón gradient morado de marca |
| Footer Supabase | Footer con links Privacidad/Términos/Cookies |

## Archivos

- `confirm-signup.html` → Email de bienvenida tras registro
- `magic-link.html` → Login sin contraseña
- `reset-password.html` → Restablecer contraseña
- `change-email.html` → Confirmar cambio de email
- `invite.html` → Invitación a colaboradores (vía Supabase admin API)
- `_base.html` → Plantilla base (referencia, no usar directa)

---

## Setup paso a paso

### Paso 1: Configurar SMTP custom con Resend (gratis 100 emails/día)

Sin esto, los emails salen desde `noreply@mail.app.supabase.io` aunque uses los templates personalizados.

1. **Crea cuenta en Resend** → https://resend.com/signup (gratis, 100 emails/día)

2. **Verifica tu dominio** en Resend → Domains → Add Domain → `peligroficial.com`
   - Añade los 4 registros DNS que te dan (TXT × 2 + MX + CNAME)
   - Si usas Cloudflare, ten cuidado: el CNAME para DKIM **debe ser DNS only** (no proxied)
   - Espera 5-10 min y pulsa "Verify DNS records"

3. **Crea una API key** → API Keys → Create API Key → `Supabase SMTP` con permisos `Sending access`
   - Copia la key (empieza con `re_`)

4. **Configura SMTP en Supabase Dashboard**:
   - Settings → Auth → SMTP Settings → Enable Custom SMTP
   - Host: `smtp.resend.com`
   - Port: `465` (SSL/TLS)
   - User: `resend`
   - Password: `re_xxxxxxxxxx` (la API key de Resend)
   - Sender email: `cuentas@peligroficial.com`
   - Sender name: `ArteGenIA`

5. **Guarda** y pulsa "Send test email" para verificar

### Paso 2: Pegar las plantillas HTML

En Supabase Dashboard → Auth → Email Templates:

1. **Confirm signup**
   - Subject: `Confirma tu cuenta en ArteGenIA`
   - Message body: pegar el contenido completo de `confirm-signup.html`

2. **Magic Link**
   - Subject: `Tu link de acceso a ArteGenIA`
   - Body: pegar `magic-link.html`

3. **Reset Password**
   - Subject: `Restablece tu contraseña — ArteGenIA`
   - Body: pegar `reset-password.html`

4. **Change Email Address**
   - Subject: `Confirma tu nuevo email — ArteGenIA`
   - Body: pegar `change-email.html`

5. **Invite user** (opcional, solo si usas Supabase invites)
   - Subject: `Te han invitado a ArteGenIA`
   - Body: pegar `invite.html`

### Paso 3: Verificar

1. Cierra sesión en https://artegenia.vercel.app
2. Crea cuenta nueva con un email tuyo
3. Mira la bandeja → debería llegar el email de confirmación con:
   - From: ArteGenIA `<cuentas@peligroficial.com>` (no Supabase)
   - Logo AG arriba
   - Botón morado gradient "Confirmar mi email"
   - Footer con links legales

Si el From sigue siendo de Supabase, revisa el paso 1 (SMTP custom).
Si llega con HTML roto, copia/pega de nuevo (a veces el editor de Supabase mete caracteres extra).

---

## Variables disponibles en los templates

Supabase reemplaza estas variables al enviar:

| Variable | Qué pone |
|---|---|
| `{{ .ConfirmationURL }}` | Link de acción (confirmar/reset/etc.) |
| `{{ .Email }}` | Email del destinatario |
| `{{ .Token }}` | Token bruto (no usar en UI, solo si pides código manual) |
| `{{ .TokenHash }}` | Hash del token |
| `{{ .SiteURL }}` | El Site URL configurado en Auth → URL Configuration |
| `{{ .RedirectTo }}` | URL de redirect tras confirmar |

---

## Restricciones de email HTML

Si quieres editar las plantillas, ten en cuenta:

- **Solo inline styles**: Gmail y Outlook ignoran `<style>` externos
- **Tablas para layout**: divs/flexbox no funcionan bien en Outlook 2007+
- **Logo inline (texto + fondo)**: imagen externa se rompe por proxies de email (Gmail Image proxy)
- **Max 600px wide**: estándar email para que se vea bien en clientes que no son responsive
- **Texto plano fallback**: idealmente generar versión texto también (Supabase no lo soporta nativo aún, pero los HTML actuales son legibles incluso si se ve como texto plano)

---

## Próximos pasos (post-MVP)

Cuando crezcas más:

1. **Versión texto plano** además de HTML (mejor deliverability)
2. **Tracking de aperturas** (Resend lo soporta nativo)
3. **Emails de notificación dentro de la app**: cuando un colaborador acepta invitación, cuando un proyecto se completa, etc. → Resend API directa desde tu route handlers
4. **Newsletter**: Resend Audiences + un endpoint `/api/newsletter/subscribe`
