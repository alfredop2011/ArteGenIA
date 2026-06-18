# Plantillas DJ/lineup — Plan de curaduría (UX#9 / EST beachhead)

> Curar 10 plantillas TOP específicas de discoteca/lineup nocturno. NO 50
> genéricas — el estratega fue claro: calidad > cantidad para el nicho.

## Por qué importa

El plan estratégico identifica **DJs/discotecas/productoras nocturnas**
como beachhead. Tu home y /templates hoy muestra plantillas genéricas
(academia, freelance, agencias, etc.). Cuando llegue un DJ desde el
DM personalizado (semanas 3-6 del plan), debe encontrar:

1. Plantilla que se siente "para él" (estética dark/neón/bold)
2. Texto pre-rellenado con nombres tipo "RAVE NIGHT", "DJ SET", "DOORS"
3. Formato adecuado (story IG vertical principalmente para esta industria)

Si encuentra "plantilla para academia de inglés", se va.

## Las 10 plantillas — lineup

| # | Nombre interno | Estética | Caso de uso |
|---|---|---|---|
| 1 | `dj-tropical-house` | Sunset orange + photo persona | Open air, beach party |
| 2 | `dj-techno-dark` | Grayscale + glitch glow violeta | Underground techno |
| 3 | `dj-reggaeton-neon` | Pink + lime neon | Latin urban club |
| 4 | `dj-hip-hop-graffiti` | Spray fonts + textura concrete | Hip-hop night |
| 5 | `dj-electronic-grid` | Wireframe + cyber pink | Tech-house, EDM |
| 6 | `dj-festival-multi` | Stack 3 DJs + barra colores | Festival multi-DJ |
| 7 | `dj-vinyl-vintage` | Sepia + texturas grano | Vinyl-only, soul, funk |
| 8 | `dj-vip-luxury` | Black + dorado + serif elegante | Champagne party, VIP |
| 9 | `dj-day-pool` | Cyan + white sun rays | Pool party, brunch |
| 10 | `dj-anniversary-confetti` | Confetti animation feel | Anniversary, special edition |

## Estructura técnica por plantilla

Cada plantilla en `data/templates.ts` debe tener:

```ts
{
  id: <number>,
  title: "<nombre visible>",
  category: "discoteca",           // categoría nueva
  audience: ["productora"],         // o ["freelance"] para DJ solo
  image: "<thumbnail R2 url>",
  premium: false,
  internalTags: ["dj", "nightclub", "lineup"],
  variants: [
    {
      format: "story",              // 1080x1920 — el principal para DJs
      width: 1080,
      height: 1920,
      layers: [
        // 1. Fondo (degradado o imagen)
        { type: "shape", id: "bg", x: 0, y: 0, width: 1080, height: 1920,
          fill: "#0a0a14", ... },
        // 2. Imagen DJ (placeholder editable)
        { type: "image", id: "dj-photo", src: "<placeholder>", ... },
        // 3. Texto lineup principal
        { type: "text", id: "lineup-name", text: "DJ SHADOW",
          fontSize: 140, fontFamily: "Anton", fill: "#fff", ... },
        // 4. Fecha
        { type: "text", id: "date", text: "VIE 28 JUN", ... },
        // 5. Lugar
        { type: "text", id: "venue", text: "SALA APOLO · BCN", ... },
        // 6. Hora puerta
        { type: "text", id: "doors", text: "DOORS 00:00 · 15€ ANT", ... },
      ]
    },
    { format: "instagram", width: 1080, height: 1080, layers: [...] },
    { format: "a4-print", width: 2480, height: 3508, layers: [...] },
    { format: "wide-banner", width: 1920, height: 1080, layers: [...] },
  ]
}
```

## Categoría nueva en /templates

Añadir en `data/categories.ts`:

```ts
{
  id: "discoteca",
  label: "Discoteca / Eventos nocturnos",
  icon: "🎧",
  description: "Lineups, DJ sets, fiestas, festivales",
  audiences: ["productora", "freelance"],
}
```

## Estética guía (para el diseñador)

- **Tipografías**: Anton (display), Bebas Neue (alternative), Space Mono
  (tech feel). Todas Google Fonts gratis.
- **Paleta nocturna**: #0a0a14 (bg), #a855f7 (primary), #ec4899 (accent),
  #facc15 (highlight CTA), #ffffff (text). Glow effects.
- **NO**: tipografías cursivas, paletas pastel, fondos blancos.
- **Sí**: contraste alto, glows neón, photo overlays con tinte.

## Generación del thumbnail / preview

Para cada plantilla:
1. Diseñar 1 vez en Figma o con el editor propio (mode admin → publicar)
2. Capturar thumbnail 600×800 (formato Story preview)
3. Subir a R2 bajo `templates/discoteca/{slug}.jpg`
4. URL pegada en `image:` del template object

Alternativa más rápida: usar Flux (que ya tienes integrado en
`/api/generate-bg`) con prompts tipo:
```
"Modern nightclub flyer template, lineup style,
dark neon aesthetic, DJ photo placeholder centered,
glowing typography, vertical 9:16 format,
photorealistic, magazine-quality, no text just layout"
```

Luego añadir las layers de texto/imagen editables encima en el editor.

## Cómo seguir

### Si tienes diseñador
Pásale este doc + acceso a admin. Que diseñe las 10 en el editor admin
y haga "Publicar" cuando estén listas.

### Si lo haces solo
1. Empieza con la #1 (`dj-tropical-house`) como prueba de concepto end-to-end
2. Diseña 1 variante (Instagram Story 1080×1920) primero
3. Cuando esté publicada, replica el patrón para las otras 9
4. Las variantes para otros formatos las puedes adaptar después

### Si quieres que yo haga el esqueleto técnico
Dime "haz el código de las plantillas DJ" en otra sesión y genero:
- Entry en `data/categories.ts`
- 1 ejemplo completo en `data/templates.ts` para que la copies
- Tipo `TemplateLayer` ajustado si hace falta

Pero los assets visuales (thumbnails, fondos generados con Flux) NO los
puedo generar yo — necesitan tu API key + supervisión humana sobre el
resultado.

---

**Coste estimado**:
- Sin diseñador, con Flux: ~$0.50 por plantilla × 10 = $5 + 2-3h de tu tiempo
- Con diseñador: 1-2 días de diseñador
