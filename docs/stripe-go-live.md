# Runbook — Pasar Stripe de TEST a LIVE (cobros reales)

Estado detectado (jul 2026): producción estaba en **modo prueba**
(`STRIPE_SECRET_KEY = sk_test_...`). El checkout mostraba la franja
"Entorno de prueba" y la Visa 4242 (tarjeta test) funcionaba = dinero
ficticio. Este runbook lo pasa a LIVE para cobrar de verdad.

El código es **agnóstico de modo** — usa las env vars que haya. NO hay que
tocar código. Solo cambiar env vars en Vercel + crear el webhook live.

---

## Prerrequisito: cuenta Stripe activada para pagos reales

En Stripe → Configuración → el negocio debe estar **activado** (datos
fiscales + cuenta bancaria para payouts). Señal de que ya lo está: los
productos live muestran "Cumple los requisitos" en el catálogo.

---

## Paso 1 — Crear el webhook en modo LIVE

1. Stripe Dashboard → arriba a la derecha, **quitar "Modo de prueba"**
   (toggle) para entrar a modo LIVE.
2. Desarrolladores → **Webhooks** → **Añadir endpoint**.
3. URL del endpoint:
   ```
   https://artegenia.com/api/stripe/webhook
   ```
4. Selecciona estos **5 eventos** (los que escucha el código):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
5. Guardar → copia el **"Signing secret"** (`whsec_...`). Es el nuevo
   `STRIPE_WEBHOOK_SECRET`.

## Paso 2 — Copiar la Secret Key LIVE

Stripe (en modo LIVE) → Desarrolladores → **Claves de API** →
**Clave secreta** → revelar/copiar. Empieza por `sk_live_...`.

## Paso 3 — Setear env vars en Vercel (entorno Production)

Vercel → proyecto → Settings → Environment Variables. Cambia/crea:

| Env var | Valor (modo LIVE) |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (Paso 2) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del webhook live (Paso 1) |
| `STRIPE_PRO_PRICE_ID` | `price_1TjNoB1P95T0MPNdFng2KWX7` (Pro 9,99€/mes) |
| `STRIPE_PRO_PRICE_ID_YEARLY` | `price_1TjNoB1P95T0MPNdwGUQDRqb` (YEARLY 95,90€/año) |
| `STRIPE_ENTERPRISE_PRICE_ID` | `price_1TjNoE1P95T0MPNdvPVHp41E` (Enterprise 34,99€/mes) |
| `STRIPE_PRO_FOUNDER_PRICE_ID` | `price_1Tr0ln1P95T0MPNdxYDjSq3G` (Fundador 7,99€/mes) |

> ⚠️ VERIFICA cada price ID en el catálogo LIVE antes de pegar: entra en
> Stripe LIVE → Catálogo de productos → click en el producto → copia su
> price ID. Los de la tabla son los que enviaste (`livemode: true`), pero
> un error aquí = cobrar el importe equivocado.

`STRIPE_ENTERPRISE_PRICE_ID_YEARLY` no hace falta (no hay Enterprise anual;
el código cae a mensual si no está seteada).

## Paso 4 — Redeploy

Vercel no aplica env vars nuevas sin redeploy. Deployments → Redeploy
(o pushea cualquier commit).

## Paso 5 — Verificar

1. Ve a artegenia.com/pricing → intenta suscribirte a Pro.
2. En la página de Stripe **YA NO** debe salir la franja "Entorno de
   prueba". Si no sale → estás en LIVE.
3. Paga con una tarjeta **real** (la tuya) → confirma que:
   - La cuenta pasa a Pro (webhook OK)
   - Aparece el cobro real en Stripe (Pagos → verás el importe real)
4. Reembólsate desde Stripe (Pagos → el pago → Reembolsar) para no
   perder dinero en la prueba.

## Paso 6 — Payment Link del Fundador (para vender por DM/WhatsApp)

En Stripe LIVE → producto "ArteGenIA Fundador" → **Crear enlace de pago**
con el price 7,99€/mes. Ese link es el que mandas por WhatsApp. Al pagarlo,
el webhook (`checkout.session.completed`) asigna plan Pro automáticamente.

---

## Rollback (volver a test si algo falla)

Cambia `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de vuelta a los
valores `sk_test_` / `whsec_` de test + los price IDs de test, y redeploy.
