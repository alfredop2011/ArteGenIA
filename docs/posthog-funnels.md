# PostHog: Funnels y dashboard de North Star (UX#7)

> **Para qué**: Antes de gastar 1€ en ads, necesitas medir qué hacen los
> usuarios. Sin funnels reales no sabes dónde se caen, si el copy nuevo
> convierte o si el cambio de pricing ayuda. Esta guía monta lo mínimo
> útil en 30 min.

## Métrica única (North Star) del trimestre

**Usuarios que completan `export_completed` ≥2 veces en una semana.**

Justificación: 1 export podría ser curiosidad. 2+ en 7 días = el user
volvió porque le sirve = retención real = candidato a Pro. Es la métrica
que el estratega recomendó y la única que importa este trimestre.

---

## Setup inicial (5 min)

1. Entra a https://eu.posthog.com (o el host que tengas en
   `NEXT_PUBLIC_POSTHOG_HOST`).
2. Confirma que ves eventos llegando:
   - Sidebar → **Activity** → debes ver eventos recientes: `module_opened`,
     `export_completed`, `upgrade_clicked`, etc.
   - Si NO ves nada, los eventos no llegan. Revisa que
     `NEXT_PUBLIC_POSTHOG_KEY` esté en Vercel Production.

## Eventos ya instrumentados

| Evento | Cuándo se dispara | Properties principales |
|---|---|---|
| `module_opened` | User abre un módulo IA (quitar fondo, asistente…) | module, source, plan, credits_remaining |
| `module_completed` | Módulo terminó OK | module, credits_consumed, duration_seconds, plan |
| `module_abandoned` | User salió a mitad | module, step_reached, seconds_before_leaving |
| `export_completed` | Descarga finalizada | format, credits_consumed, has_ai_layers, source |
| `credits_exhausted` | Balance llegó a 0 | attempted_module, current_balance, days_until_reset |
| `upgrade_clicked` | Click en CTA upgrade | source, current_plan, current_balance |
| `upgrade_completed` | Pago Stripe OK (server-side) | plan, interval, amount_cents |
| `subscription_canceled` | Cancel sub (server-side) | plan, reason |
| `payment_failed` | Cobro falló (server-side) | attempt_count, amount_cents |

---

## Funnel 1: Activación (de visitor a primera victoria)

**Objetivo**: ver qué % de visitors llega a su primera descarga.

1. PostHog → **Product analytics** → sidebar **Insights** → **+ New
   insight** → **Funnels**.
2. Steps (en orden):
   1. **Pageview** (filter: `$pathname` = `/`)
   2. **Identify** (cuando user se loguea — PostHog lo registra solo si
      configuraste identify en signin)
   3. **module_opened** (cualquier módulo)
   4. **module_completed**
   5. **export_completed**
3. Conversion window: **7 days**.
4. Display as: **Steps**.
5. Save como **"Activation: visitor → first export"**.

**Qué mirar**: el step 1→2 (visit → signup) debería ser el más bajo.
Si <5%, el problema es el hero/value prop. Si 1→2 va bien pero 4→5 se cae,
el problema es la UX del editor (probablemente confusión post-creación).

---

## Funnel 2: Conversión (free → pago)

**Objetivo**: ver qué % de usuarios free acaban pagando Pro.

1. **+ New insight** → **Funnels**.
2. Steps:
   1. **export_completed** (= ya tienen valor demostrado)
   2. **credits_exhausted** (= necesitan más)
   3. **upgrade_clicked** (filter property `source` = cualquiera)
   4. **upgrade_completed** (server-side, llega del webhook)
3. Conversion window: **30 days**.
4. Save como **"Conversion: free → Pro"**.

**Qué mirar**: si llegan a credits_exhausted pero no clican upgrade,
el modal de upgrade no convence. Si clican pero no completan, hay fricción
en checkout (probablemente la antigua del trial 30d que YA hemos quitado).

---

## Funnel 3: Retención semanal (North Star)

**Objetivo**: ¿Cuántos usuarios vuelven a hacer export la semana siguiente?

1. **+ New insight** → **Retention**.
2. Target event: **export_completed**.
3. Returning event: **export_completed**.
4. Period: **Weekly**.
5. Date range: **Last 8 weeks**.
6. Save como **"NORTH STAR: weekly export retention"**.

**Qué mirar**: la diagonal de la matriz. Si la celda "Semana 0 → Semana 1"
es <10%, no hay retención y el producto no engancha al ICP. Si es >25%,
estás en buen camino.

---

## Dashboard "Health check semanal"

1. PostHog → **Dashboards** → **+ New dashboard**.
2. Nombre: **"ArteGenIA · weekly health"**.
3. Añadir las 3 insights de arriba + estos números:

   - **Total signups** (event `$identify` count, last 7 days)
   - **MRR estimado**: number tile con `upgrade_completed` count × 9.99 +
     adjustments por cancels
   - **Cancel rate** = `subscription_canceled` / suscribers activos
   - **Payment fail rate** = `payment_failed` / `upgrade_completed`

4. Configurar **Subscriptions** → enviar el dashboard por email cada lunes
   a las 09:00 a tu email.

---

## Cohortes para campañas

Crea estas 3 cohortes en PostHog para targetear en email/ads:

1. **"Casi-activated"**: usuarios que hicieron `module_opened` pero NO
   `module_completed` en últimos 14 días. → Email "¿problemas con la IA?"
2. **"Pre-converters"**: usuarios con `credits_exhausted` ≥2 veces que
   NO han hecho `upgrade_completed`. → Email "tu siguiente diseño te
   espera, te regalamos 5 créditos."
3. **"Churn risk"**: Pro users sin `module_completed` en últimos 21 días.
   → Email "te echamos de menos" antes del próximo cobro.

---

## Validación rápida (5 min después del setup)

1. Abre tu navegador en modo incógnito.
2. https://artegenia.com → registra cuenta nueva.
3. Click en quitar fondo, sube una imagen, descarga.
4. Vuelve a PostHog → **Activity** (5-10 segundos después).
5. Debes ver: `$pageview` → `$identify` (signup) → `module_opened` →
   `module_completed` → `export_completed`. Si falta alguno, problema
   en el código.

---

## Lo que NO está medido todavía (TODO futuro)

- **A/B tests del hero**: PostHog Feature Flags permite testear variantes
  del h1 (controla con `useFeatureFlag('hero-copy-variant')`). Útil
  para validar UX#2 vs el copy anterior.
- **Heatmaps del editor**: PostHog Toolbar → click "Heatmap" sobre
  /editor para ver dónde clica el user. Útil para validar UX#10 overlay.
- **Session replays**: ver grabaciones de las primeras 50 sesiones de
  DJs reales tras el beachhead launch (EST#13). Es lo más educativo
  que harás.

---

## Si algo no funciona

- **No llega ningún evento**: Comprueba `NEXT_PUBLIC_POSTHOG_KEY` en
  Vercel. Comprueba que el user ha aceptado cookies (banner RGPD bloquea
  PostHog hasta consent).
- **Llega `$pageview` pero nada más**: el lib/analytics.ts no está
  llamando trackEvent. Verifica `useToast`/PostHogProvider envuelve el
  layout.
- **Funnel sale en 0**: revisa que los nombres de eventos coincidan
  exactamente (case sensitive). Verifica en Activity que el evento
  aparece con el mismo nombre que pusiste en el funnel.

---

**Tiempo estimado total para setup**: 30-45 min en posthog.com.
Después dejas que se llene de datos 7-14 días antes de tomar decisiones.
