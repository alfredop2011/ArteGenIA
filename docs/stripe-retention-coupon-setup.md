# Cupones de retención en Stripe Portal — Setup paso a paso

> **Objetivo**: cuando un Pro intenta cancelar, ofrecerle automáticamente
> 50% off durante 3 meses para que se quede. Recupera ~15-20% de los
> que cancelarían sin esta opción.
>
> **Coste**: 0€ de desarrollo. ~10 min en Stripe Dashboard.
> **ROI esperado**: 15-20% de retención sobre churn voluntario.

## Por qué funciona

El user que entra al portal a cancelar suele estar en uno de 2 estados:

1. **"Es caro / no lo uso tanto"** → cupón le da incentivo de quedarse 3 meses más para evaluar mejor.
2. **"Decisión firme, no me gusta"** → no acepta el cupón. Lo pierdes igual, pero al menos lo intentaste.

Stripe lo ha medido a escala: **~17% de los churns voluntarios se recuperan** con un descuento de retención bien presentado.

---

## Setup Stripe Dashboard (10 min)

### Paso 1 — Crear el cupón (3 min)

1. Stripe Dashboard → **Products → Coupons** → "Create coupon"
2. Configurar:
   - **ID**: `RETENCION50` (será visible en logs/webhook)
   - **Name**: "Descuento de retención 50%"
   - **Type**: Percentage discount
   - **Percent off**: 50
   - **Duration**: `repeating`
   - **Duration in months**: 3
   - **Currency**: EUR (España) — o multi-currency si vas a expandir
3. Limits (importante para evitar abuso):
   - **Max redemptions**: 0 (sin límite — se controla por portal, no por cupón)
   - **Redeem by**: dejar vacío (sin expiración)
4. **Create coupon**

### Paso 2 — Crear promotion code (opcional pero recomendado)

Stripe distingue entre:
- **Coupon**: definición técnica del descuento
- **Promotion code**: el código user-facing (lo que se muestra/aplica)

1. Stripe Dashboard → **Products → Coupons** → seleccionar `RETENCION50`
2. "Create a promotion code"
3. Config:
   - **Code**: `STAY50` (lo que verá el user en el portal — corto, memorable)
   - **First-time customer order**: ❌ NO (queremos que aplique a quien ya tiene sub)
   - **Eligibility restrictions**: dejar vacío
4. **Create promotion code**

### Paso 3 — Activar en Customer Portal (3 min)

1. Stripe Dashboard → **Settings → Billing → Customer portal**
2. Sección "Subscription cancellation" → asegurar que está habilitada
3. Activar **"Offer a discount"** (toggle nuevo)
4. Seleccionar el cupón `RETENCION50` que creaste
5. Configurar el copy que verá el user:
   - **Title**: "¿Seguro que quieres irte?"
   - **Body**: "Te ofrecemos **50% de descuento durante 3 meses** si decides quedarte. Sin compromiso de permanencia — puedes cancelar después."
   - **Button**: "Quedarme con 50% off"
   - **Decline button**: "Cancelar igualmente"
6. **Save**

### Paso 4 — Verificar Mode (test vs live)

⚠️ **Crítico**: Stripe Dashboard tiene Test mode y Live mode separados.
Repite los 3 pasos en **ambos** entornos:

1. Toggle "Test mode" en sidebar → repetir pasos 1-3
2. Toggle "Live mode" → repetir pasos 1-3

Si solo lo haces en uno, en el otro entorno NO aparecerá el descuento.

---

## Cómo funciona end-to-end (flow real)

```
1. User Pro va a /pricing → click "Gestionar suscripción"
2. Nuestro endpoint /api/stripe/portal abre billing portal Stripe
3. User va a "Cancel subscription"
4. Stripe Portal le muestra el descuento ANTES de cancelar
   → "¿Seguro? Te ofrecemos 50% off durante 3 meses"
5a. Si acepta:
    - Stripe aplica el cupón a su subscription
    - Webhook `customer.subscription.updated` se dispara con
      `previous_attributes.discount = null` y `sub.discount` con el coupon
    - NO se cancela la sub — sigue activa con descuento aplicado
5b. Si rechaza:
    - Stripe marca `cancel_at_period_end = true`
    - Webhook `customer.subscription.updated` con `cancel_at_period_end`
    - La sub se cancela al final del período actual
```

---

## Detección en código (qué tenemos / qué falta)

Nuestro webhook actual maneja `customer.subscription.updated` pero
**solo mira status y price_id**. NO detecta cambios de discount.

Cambio aplicado en commit asociado (ver siguiente sección):

- Diferenciar "user aplicó cupón retención" vs "user canceló de verdad"
- Email diferente para cada caso
- Tracking PostHog server-side con event `retention_coupon_redeemed`

Sin este código, el cupón funciona técnicamente (Stripe aplica el descuento) pero:
- No sabes cuántos lo usaron (sin métricas)
- El user que aceptó recibe email genérico de "tu plan cambió"
- No puedes optimizar el copy del portal según conversion rate

---

## Cómo medir efectividad (después del setup)

Tras 1 mes con el cupón activo, ejecuta esta query en Supabase para
ver tasa de retención:

```sql
-- Cupones de retención usados últimos 30 días
SELECT
  COUNT(*) FILTER (WHERE distinct_id IS NOT NULL) as redeemed,
  COUNT(*) FILTER (WHERE event = 'subscription_canceled') as canceled
FROM events
WHERE event IN ('retention_coupon_redeemed', 'subscription_canceled')
  AND created_at > NOW() - INTERVAL '30 days';
```

O en PostHog:
- Funnel: `clicked_portal_cancel` → `retention_coupon_offered` →
  (`retention_coupon_redeemed` | `subscription_canceled`)
- Tasa de retención = `redeemed / (redeemed + canceled)`

**Benchmark esperado**: 15-20% de retention rate sobre cancelaciones intentadas.

Si tras 1 mes estás por debajo del 10%:
- El copy del portal no convence → mejorar `Title`/`Body` en Paso 3.5
- O el descuento es bajo → considerar `60%/3 meses` o `40%/6 meses`

Si superas el 25%:
- Estás dejando dinero sobre la mesa con un descuento demasiado generoso
- Bajar a `30%/3 meses` y A/B test

---

## Riesgos a vigilar

1. **Abuso**: user cancela cada 3 meses para renovar el cupón eternamente.
   - **Mitigación**: el cupón es `duration: repeating, 3 months`, así que solo aplica 3 cargos. Después vuelve al precio normal. El user tendría que **cancelar Y volver a pagar** para entrar de nuevo en el flow.
   - **Detección**: query users con `>1 redeemed` en 6 meses, marcar para revisión manual.

2. **Devaluación del producto**: si todos saben que basta con amagar cancelación para 50% off, el plan completo pierde valor percibido.
   - **Mitigación**: cupón solo se ve en el flow de cancelación. No promocionarlo nunca en marketing ni en /pricing.

3. **Impacto en CAC payback**: el descuento alarga el tiempo de recuperar coste de adquisición.
   - **Mitigación**: solo afecta a churns intentados (no a nuevos pagos). Si tu CAC payback es < 6 meses, 3 meses al 50% son aceptables.

---

## Checklist final

- [ ] Cupón `RETENCION50` creado en Test mode
- [ ] Promotion code `STAY50` creado en Test mode
- [ ] Portal config activado con descuento en Test mode
- [ ] Probar flow completo en Test mode (cancelar sub de prueba)
- [ ] Cupón `RETENCION50` creado en **Live mode**
- [ ] Promotion code `STAY50` creado en **Live mode**
- [ ] Portal config activado en **Live mode**
- [ ] Webhook handler actualizado para tracking (ver código)
- [ ] PostHog event `retention_coupon_redeemed` aparece tras prueba
- [ ] Query de métricas guardada para revisión mensual

Tiempo total real: 12-15 min.
