# Prompt para Claude — Sistema de créditos + Storage + Analíticas + Roadmap

> Copia este archivo entero y pégalo en una nueva conversación con Claude
> (ChatGPT, Claude.ai, o Claude Code). Edita los **[BLOQUES ENTRE
> CORCHETES]** con tus decisiones antes de enviarlo.

---

## CONTEXTO DEL PRODUCTO

Soy fundador de **ArteGenIA** (artegenia.vercel.app), un editor de flyers
con IA para el mercado hispanohablante (España + LATAM). Target: organizadores
de eventos de música/baile (salsa, bachata, kizomba), academias, DJs,
promotoras, fotógrafos freelance.

**Stack técnico**: Next.js 16 + Fabric.js + Supabase + Cloudflare R2 + Stripe.

**Estado actual**: ~0-10 usuarios reales. Lanzamiento público próximo.
Necesito definir el modelo económico ANTES de captar usuarios para no
prometer cosas que no escalan.

---

## MÓDULOS ACTUALES Y COSTE REAL POR USO

| # | Módulo | Backend | Modelo IA | Coste/uso (USD) | Tiempo |
|---|---|---|---|---|---|
| 1 | **Editor base** (texto/imagen/forma) | Fabric.js | — | 0 | inmediato |
| 2 | **48+ plantillas** | catálogo data/templates | — | 0 | inmediato |
| 3 | **Quitar fondo** | /api/remove-bg | BiRefNet vía fal.ai | $0.025 | 3-5s |
| 4 | **Extraer persona** (con prompt punto) | /api/segment-person | SAM-2 vía fal.ai | $0.04 | 4-6s |
| 5 | **Capas Mágicas** (foto → plantilla editable) | /api/photo-to-template | Sonnet 4.6 + SAM-3 | $0.041 | 8-15s |
| 6 | **Asistente IA chat** (idea → flyer) | /api/assistant | Sonnet (texto) | ~$0.005 | 2-3s |
| 7 | **Generador IA** (texto → imagen) | /api/generate | Flux vía fal.ai | ~$0.04 | 5-8s |
| 8 | **Surya OCR** (opcional, refina Capas) | Replicate | Surya | $0.0026 | 12s |
| 9 | **Exportar PNG/JPG** | client-side canvas | — | 0 | inmediato |
| 10 | **Exportar PDF imprenta** | jsPDF | — | 0 | inmediato |

**Coste mensual fijo independiente del uso**:
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- Cloudflare R2: $0.015/GB-mes + $0 egress
- Total infra: **~$45/mes** + variable IA

---

## PLANES ACTUALES Y CUOTAS

### Plan FREE — 0€
- Editor completo sin watermark
- 48+ plantillas
- 10 quitar-fondo/mes (BiRefNet)
- 3 quitar-fondo HD/mes
- 5 Capas Mágicas/mes (admin-only por ahora, beta privada)
- Mis flyers (guardar proyectos) — sin límite definido

### Plan PRO — 9,99€/mes ó 95,90€/año
- Todo lo de Free
- Quitar fondo ilimitado
- Capas Mágicas 50/mes
- PDF imprenta
- Generaciones IA premium ilimitadas
- Soporte prioritario email

### Plan ENTERPRISE — Próximamente (34,99€/mes)
- Multi-usuario, Brand Kit, factura IVA, etc.

---

## PROBLEMA A RESOLVER (lo que necesito de ti, Claude)

Tengo 5 decisiones pendientes y necesito que las diseñes en conjunto.

### 1. Sistema de créditos unificado
Hoy cada módulo tiene su propia cuota numérica ("10/mes de X, 50/mes de Y"),
lo cual confunde al usuario. Propón un **sistema de créditos** donde:
- 1 crédito = X céntimos de coste interno (define X)
- Cada acción IA cuesta N créditos según su coste real
- El usuario ve "Te quedan 80 créditos" en el header

Diseño esperado:
- Tabla `Acción → Créditos consumidos`
- Cuántos créditos da cada plan al mes
- Política de roll-over (¿caducan? ¿se acumulan?)
- Política de top-up (¿puede comprar más sueltos?)

### 2. Storage limits (almacenamiento de proyectos + fotos)

Hoy "Mis flyers" guarda proyectos pero sin límite. Quiero añadir:
- Galería "Mis fotos sin fondo" para que el usuario reutilice PNGs
  transparentes en cualquier flyer
- Posiblemente "Mis stickers IA" (de Capas Mágicas)

Necesito definir:
- Cuánto storage por plan (en MB y/o en nº de archivos)
- Free: ¿100 MB? ¿20 archivos? ¿qué es razonable?
- Pro: ¿1 GB? ¿100 archivos?
- Política cuando se agota (block upload, auto-delete oldest, etc.)
- Coste real (R2 = $0.015/GB-mes) → traducir a unidades del plan

### 3. Nombre del apartado "galería personal"

En "Mis flyers" quiero un sub-tab para fotos sin fondo + stickers IA
reutilizables. Sugiéreme 5 nombres alternativos y di cuál es mejor para
el target hispanohablante (preferencia clara/descriptiva, no marketinera).

Ejemplos a evaluar:
- "Mis fotos sin fondo"
- "Mis creaciones"
- "Mi biblioteca"
- "Mi galería IA"
- "Recursos guardados"

### 4. Sistema de analíticas (qué medir y cómo)

Necesito tomar decisiones de roadmap basadas en datos, no intuición.
Diseña:
- **Qué eventos trackear** (uso de módulo, abandono, conversión...)
- **Stack técnico recomendado** (PostHog vs Mixpanel vs Plausible —
  ya uso PostHog, di si sirve o si conviene cambiar)
- **Dashboard mínimo viable** que debería ver yo cada semana
- **KPIs concretos**: ¿qué % de free→pro es buena señal?, ¿qué retention
  D7/D30 es objetivo realista?, ¿qué módulos son "engagement drivers" vs
  "conversion drivers"?

### 5. Roadmap priorizado con framework de decisión

Dame un framework para decidir qué construir basándome en datos. Por ejemplo:
- "Si el módulo X tiene >40% de DAU pero conversión baja → mejorar UX"
- "Si el módulo Y se usa <5% pero los que lo usan convierten 3× más →
  prioridad MARKETING, no producto"
- Sugiere features candidatas para próximos 3 meses: ya implementado
  (Quitar fondo, Capas Mágicas, Asistente IA) o roadmap obvio
  (multi-user, Brand Kit, plantillas exclusivas por industria).

---

## RESTRICCIONES Y PREFERENCIAS

- **Bootstrapped**: no tengo inversores. Cada euro cuenta.
- **Target inicial**: ~50 usuarios pagantes en 6 meses sería el "yes,
  está funcionando".
- **Mercado**: precios de competencia → Canva Free es ultra-generoso,
  Adobe Express es premium, Stencil tiene tier $9/mes. Tengo que estar
  competitivo en Free Y honesto en Pro.
- **Honestidad legal**: ya quité promesas que no cumplía. No quiero
  prometer "ilimitado" si en realidad limito por costes ocultos.
- **Margen sano Pro**: si Pro paga 9,99€ ≈ $10.79, y consume todo el
  límite IA, quiero margen > 60% (≈ $4 USD coste IA máximo por user/mes).

---

## FORMATO DEL OUTPUT QUE QUIERO DE TI

Estructura tu respuesta así:

1. **Resumen ejecutivo** (5 bullets máximo con tus decisiones clave)
2. **Sistema de créditos** (tabla + políticas)
3. **Storage limits** (tabla por plan + edge cases)
4. **Nombre del apartado** (top-1 + por qué)
5. **Analíticas** (qué trackear + stack + dashboard semanal)
6. **Roadmap framework** (cómo decidir + 3 features candidatas)
7. **Métricas a vigilar las primeras 6 semanas tras lanzamiento**
8. **Riesgos** (qué puede salir mal y cómo mitigarlo)

Sé concreto con números. No me digas "razonable" — dime "Free = 100 créditos
mensuales basado en que esperas 5 quitar-fondo + 2 Capas Mágicas".

---

## DATOS QUE NO TENGO Y NECESITO ASUMIR

Si necesitas datos que no te di, **asume razonablemente** y márcalo:
- ARPU esperado del mercado hispanohablante: tú decides
- Tasa de conversión free→pro objetivo: tú propones
- LTV/CAC objetivo: tú propones
- Stickiness target (DAU/MAU): tú propones

---

**FIN DEL PROMPT.** Espero tu respuesta estructurada. Si algo no está
claro o necesitas que decida algo antes de seguir, pregúntame con
opciones concretas (no abiertas).
