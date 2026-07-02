# WhatsApp Cloud API — Setup Meta para notificaciones transaccionales

> **Objetivo**: que cuando llegue una foto solicitada al organizador, le
> llegue un WhatsApp instantáneo (no email, no campana — WhatsApp).
>
> **Tiempo total**: 1-2 semanas (la mayoría es esperar verificación de Meta
> y aprobación de templates).
>
> **Coste real 2026**: ~$0.005-0.04 USD por conversación de 24h (categoría
> Utility en España/LATAM). Primeras 1.000 conversaciones/mes gratis.

---

## Diferencia vs. `whatsapp-business-setup.md`

| Doc | Uso |
|---|---|
| `whatsapp-business-setup.md` | App WhatsApp Business (móvil) para hablar 1-a-1 con leads |
| **este doc** | Cloud API para que el SERVIDOR mande mensajes automáticos |

Los dos pueden coexistir con el mismo número o con números distintos.

---

## Decisión clave antes de empezar

**Templates**: Meta NO permite enviar texto libre desde Cloud API. Cada
mensaje "iniciado por el business" debe ser un **template pre-aprobado**
por Meta. Cada template tarda 24-48h en aprobación.

**v1 ArteGenIA**: 2 templates
1. `phone_otp_v1` (Authentication) — para verificar el teléfono del user
2. `collaborator_photo_received_v1` (Utility) — "te llegó una foto de X"

---

## Paso 1 — Crear Meta Business Manager (Día 1, 15 min)

1. Ir a https://business.facebook.com
2. Click "Crear cuenta" → datos del business (puede ser nombre comercial
   "ArteGenIA" aunque no estés dado de alta como autónomo aún)
3. Confirmar email
4. Llegar a https://business.facebook.com/settings

---

## Paso 2 — Verificar Business (Día 1-3, ESPERA)

1. Business Manager → Configuración del Negocio → Información del Negocio
2. Click "Iniciar verificación"
3. Sube uno de estos:
   - Si eres autónomo: DNI + alta de actividad (modelo 036/037)
   - Si tienes S.L.: escrituras + CIF
   - **Si NO eres autónomo**: pueden rechazar, pero PRUEBA. Algunos
     business pasan con solo DNI + dominio verificado. Si rechazan,
     toca darse de alta como autónomo simplificado (1 día) o esperar.
4. Verifica el dominio `artegenia.com`:
   - Configuración → Marca → Dominios → Agregar `artegenia.com`
   - Te dan un meta tag tipo `<meta name="facebook-domain-verification" content="abc123" />`
   - Lo añades en el `<head>` de `app/layout.tsx`
   - Click "Verificar"

⏳ **La verificación de business puede tardar 1-7 días**. Mientras tanto
puedes hacer los siguientes pasos (excepto enviar mensajes a usuarios
reales — antes de la verificación solo funciona con 5 números de prueba).

---

## Paso 3 — Crear App en developers.facebook.com (Día 1, 10 min)

1. https://developers.facebook.com → "Mis apps" → "Crear app"
2. Tipo: **"Negocio"**
3. Nombre: `ArteGenIA WhatsApp`
4. Email de contacto: `hola@artegenia.com`
5. Asociar a Business Account creado en paso 1
6. Crear app

---

## Paso 4 — Añadir producto WhatsApp (Día 1, 5 min)

1. En la app recién creada → Panel → "Agregar productos"
2. WhatsApp → "Configurar"
3. Aceptar condiciones → se crea automáticamente un **número de prueba**
   y un **WhatsApp Business Account (WABA)**

Apunta:
- **Phone Number ID** (número largo tipo `123456789012345`)
- **WhatsApp Business Account ID** (otro número largo)
- **App ID** y **App Secret** (Panel → Configuración → Básica)

---

## Paso 5 — Generar Access Token permanente (Día 1, 10 min)

El token temporal de 24h que te dan al inicio NO sirve para producción.
Necesitas un **System User token** que no caduca.

1. Business Manager → Configuración → **Usuarios → Usuarios del Sistema**
2. Agregar → Nombre `artegenia-api`, Rol `Administrador`
3. Asignar activos: Apps → seleccionar tu app → "Control total"
4. Asignar activos: WhatsApp Accounts → seleccionar tu WABA → "Control total"
5. Click "Generar nuevo token":
   - App: tu app ArteGenIA WhatsApp
   - Caducidad: **Nunca**
   - Permisos: `whatsapp_business_messaging`, `whatsapp_business_management`
6. Copia el token (se muestra UNA vez). Guarda en password manager.

---

## Paso 6 — Crear templates (Día 2-4, ESPERA aprobación)

Templates → "Crear plantilla" desde Business Manager → WhatsApp Manager.

### Template 1: `phone_otp_v1`

- **Categoría**: Authentication
- **Idioma**: Spanish (es)
- **Nombre exacto**: `phone_otp_v1`
- **Componente Body**:
  ```
  Tu código de verificación de ArteGenIA es: {{1}}

  No compartas este código con nadie.
  ```
  - Ejemplo para {{1}}: `123456`
- **Botón**: ⚠️ Elegir tipo **"Contraseña de un solo uso (OTP)"**
  (NO "Copy code" genérico). Esto activa el copy-code automático
  en el teléfono del usuario y es el tipo esperado por Meta para
  templates de Authentication.

Esta categoría tiene reglas estrictas: el body NO puede tener nada de
marketing, solo el código.

### Template 2: `collaborator_photo_received_v1`

- **Categoría**: Utility
- **Idioma**: Spanish (es)
- **Nombre exacto**: `collaborator_photo_received_v1`
- **Componente Header** (Text): `Foto recibida ✨`
  - Soporte Meta confirmó: 1 emoji en Header es aceptable. Evitar
    ≥2 emojis o iconos decorativos innecesarios.
- **Componente Body**:
  ```
  Hola {{1}}, {{2}} ha subido su foto al flyer "{{3}}".

  {{4}}

  Abre la app para revisarla.
  ```
  - Ejemplo {{1}}: `Alfredo`
  - Ejemplo {{2}}: `DJ Asesina`
  - Ejemplo {{3}}: `Festival Bass Revolution`
  - Ejemplo {{4}}: `Ya está colocada en su slot del flyer.` (o `Quedan 2 fotos pendientes.`)
- **Componente Footer**: `ArteGenIA · Notificación automática`
- **Botón** (Call to Action): "Abrir flyer" → URL dinámica
  - ⚠️ Configurar como URL dinámica con parte fija separada:
    - Parte fija: `https://artegenia.com/editor/`
    - Variable: `{{1}}` (project_id)
  - NO usar `https://artegenia.com/editor/{{1}}` como URL completa —
    Meta requiere el split explícito de fija + variable.

### Validación previa (soporte Meta, jul 2026)

Antes de la aprobación oficial, un agente de soporte revisó ambas
plantillas y confirmó que **cumplen las normas generales**. Puntos
clave que validaron:

1. Body de OTP: sencillo y directo, sin marketing → ✅
2. Variables `{{n}}` bien rodeadas de texto claro → ✅
3. URL dinámica con parte fija + variable final → ✅
4. Emoji moderado en Header ("Foto recibida ✨") → ✅

⏳ Aprobación real: 24-48h típico tras submit. Con validación previa
del soporte, riesgo de rechazo es bajo.

---

## Paso 7 — Configurar Webhook (Día 4-5, 15 min)

Para recibir confirmación de entrega y status updates.

1. App en developers.facebook.com → WhatsApp → Configuración → Webhook
2. URL de devolución de llamada: `https://artegenia.com/api/webhooks/whatsapp`
3. **Verify Token**: invéntate un string aleatorio largo (ej. `wa_verify_8f3a92b1c4d`).
   Guárdalo, lo necesitarás como env var.
4. Click "Verificar y guardar" → debe responder 200 OK con el challenge.
5. Suscribirse a campos: `messages`, `message_template_status_update`

---

## Paso 8 — Variables de entorno (Día 5, 5 min)

Añadir a `.env.local` y a Vercel (Production + Preview):

```bash
# WhatsApp Cloud API (Meta)
WHATSAPP_PHONE_NUMBER_ID=123456789012345         # Paso 4
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765     # Paso 4
WHATSAPP_ACCESS_TOKEN=EAAxxx...                   # Paso 5 (system user token permanente)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=wa_verify_8f3a92b1c4d  # Paso 7
WHATSAPP_APP_SECRET=abcdef0123456789              # Paso 4 (para verificar firma de webhooks)
```

Si alguna falta, el código hace no-op silencioso (no rompe nada).

---

## Paso 9 — Modo desarrollo vs. producción

**Mientras la app está en modo desarrollo** (default):
- Solo puedes enviar a hasta 5 números de teléfono pre-añadidos
- Añade tu propio número en App → WhatsApp → Configuración → "Recipientes de prueba"
- Útil para testear todo el flow sin afectar usuarios reales

**Pasar a producción** (cuando todo funcione):
- Requiere business verification COMPLETA del paso 2
- Requiere review de tu app (~1-2 días)
- App → Configuración → "Revisión de la app" → enviar a revisión
- Una vez aprobado, puedes enviar a cualquier número del mundo

---

## Resumen — qué tienes que tener al final

- [ ] Business Manager creado y verificado (paso 1-2)
- [ ] Dominio `artegenia.com` verificado en Business Manager (paso 2)
- [ ] App `ArteGenIA WhatsApp` en developers.facebook.com (paso 3)
- [ ] WhatsApp Business Account + Phone Number ID (paso 4)
- [ ] System User Token permanente (paso 5)
- [ ] Template `phone_otp_v1` APROBADO (paso 6)
- [ ] Template `collaborator_photo_received_v1` APROBADO (paso 6)
- [ ] Webhook configurado y verificado (paso 7)
- [ ] 5 env vars en Vercel (paso 8)
- [ ] App pasada a modo producción (paso 9)

Cuando los 5 env vars estén en Vercel, el código YA funciona — yo lo dejo
todo listo en paralelo a tu setup de Meta.

---

## Coste real esperado

Para ArteGenIA con 100 organizadores activos × 4 fotos solicitadas/mes
= **400 conversaciones/mes** en categoría Utility:

- Primeras 1.000 conversaciones/mes: **GRATIS** (Meta marketing 2025)
- A partir de ahí (España): **~$0.0319 USD/conversación de 24h**
- 400 conv × $0.0319 = $12.76/mes si superas el free tier

Conversación de 24h = una vez abierta por la primera notificación, todos
los mensajes en las siguientes 24h cuentan como la misma conversación. En
nuestro caso solo enviamos 1 mensaje por evento, así que cada notificación
= 1 conversación.

OTPs (categoría Authentication): **GRATIS** indefinido.

---

## Lo que NO incluye este v1

- Que los colaboradores reciban el link de subida por WhatsApp directo
  (siguen usando el wa.me deep-link compartible)
- Recordatorios automáticos a colaboradores que no han subido (requiere
  cron + template adicional)
- Bot conversacional para responder mensajes (responde el wa.me normal)

Si el flow inicial funciona, añadimos esos en v2.
