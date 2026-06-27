# Spec: `/organizador` debe leer query params para pre-rellenar el form

> **Para el agente que lleva `/eventos`** — implementación pendiente.
>
> El editor de flyers de ArteGenIA tiene desde `2026-06-26` un botón
> "Publicar en Peligro Oficial" que envía datos del flyer al panel
> del organizador como query params. Hoy `/organizador` solo lee
> `?claim=<token>` (línea 227 de `app/(main)/organizador/page.tsx`).
> Si lee también los siguientes params, el organizador llega al panel
> con el form de "Nuevo evento" pre-rellenado y solo confirma.

## Origen de la llamada

`components/editor/PublishModal.tsx` línea ~150 (`publishToPeligro`):

```ts
const params = new URLSearchParams();
params.set("title", flyerTitle);
params.set("image", publicUrl);
params.set("source", "artegenia");
if (eventMetadata?.date) params.set("date", eventMetadata.date);
if (eventMetadata?.city) params.set("city", eventMetadata.city);
if (eventMetadata?.category) params.set("category", eventMetadata.category);
if (eventMetadata?.priceText) params.set("price", eventMetadata.priceText);

window.open(`https://peligroficial.com/organizador?${params.toString()}`, "_blank");
```

URL final ejemplo (con todos los params posibles):
```
https://peligroficial.com/organizador
  ?title=Kizomba+Workshop
  &image=https%3A%2F%2Fartegenia.com%2Fflyer%2Fcba79e19-dd44-4285-929b-08aecafaf2d4
  &source=artegenia
  &date=2026-07-15
  &city=Madrid
  &category=clases
  &price=15%E2%82%AC
```

## Query params a leer

| Param | Tipo | Siempre presente | Mapea al campo del form | Notas |
|---|---|---|---|---|
| `title` | string (≤200) | ✅ Sí | `title` | Sanitizar HTML (trim, max chars) |
| `image` | URL https | ✅ Sí | `image_url` | Apunta a `https://artegenia.com/flyer/<uuid>` — página pública con OG tags, **NO es URL directa de imagen** (ver sección abajo) |
| `source` | literal `artegenia` | ✅ Sí | (tracking) | Usar para analytics: distinguir eventos que vienen del editor vs creados a mano |
| `date` | ISO `YYYY-MM-DD` o texto libre | ❌ No | `event_date` | Si viene como ISO usar directo; si no, intentar parsear o dejar el texto en un campo `date_text` y que el organizador lo formatee |
| `city` | string | ❌ No | `city` | |
| `category` | enum: `fiesta` \| `concierto` \| `festival` \| `clases` \| `club` \| `corporativo` | ❌ No | `category` | Si no matchea ninguna conocida, ignorar |
| `price` | string libre (ej. `15€`, `Gratis`, `Desde 10€`) | ❌ No | `price_text` | No parsear como número — el formato varía |

## Manejo de `image`

El param `image` NO es una URL de imagen — es una página HTML pública del flyer
con OG tags. Si la pones en `<img src={image}>` no funciona.

Opciones para el agente de `/organizador`:

### Opción A (recomendada) — fetch del OG tag al mostrar preview

```ts
// Cuando se monta el form pre-rellenado:
const res = await fetch(`/api/og-image-extract?url=${encodeURIComponent(image)}`);
const { ogImage } = await res.json();
// ogImage es la URL directa de la PNG en R2
form.image_url = ogImage;
form.image_key = null; // No tenemos key directo
```

Endpoint sugerido `/api/og-image-extract`:
- GET `?url=https://artegenia.com/flyer/<uuid>`
- Fetch al HTML, parsea `<meta property="og:image" content="...">`
- Devuelve `{ ogImage: string }`

### Opción B (más simple) — usar el endpoint existente `/api/events/from-flyer`

Ya existe (línea `app/api/events/from-flyer/route.ts`) que recibe una imagen
y extrae datos con visión IA. Si haces fetch del og:image y se lo pasas a este
endpoint, además de la imagen tienes datos extraídos automáticamente.

### Opción C — Backend descargue + cache

Cuando el organizador confirma el evento, descargas la imagen del og:image en
backend, la subes a tu R2 con `key=eventos/<event-id>.png`, y guardas `image_url`
ya apuntando a tu propio R2. Más limpio para la base de datos del evento.

## Comportamiento esperado del form

1. Al cargar `/organizador?title=X&image=Y&...`:
   - Detectar que hay query params (no solo `?claim=`)
   - Mostrar form en modo **"Nuevo evento"** con los datos pre-rellenados
   - Banner arriba: *"Datos importados desde tu flyer en ArteGenIA. Revisa y completa."*
   - Si `source=artegenia` → marcar internamente que el evento vino del editor (analytics)

2. El usuario revisa, completa lo que falte, click "Publicar".

3. Tras publicar:
   - Limpiar los query params de la URL (replaceState)
   - Mostrar el evento en la lista de "Próximos eventos"

## Casos edge a manejar

| Caso | Comportamiento esperado |
|---|---|
| No hay auth | Redirect a login con `?next=/organizador?<params>` para que tras login vuelva con los params intactos |
| `image` apunta a un flyer borrado (404) | Form se carga sin imagen, el resto de campos pre-rellenados |
| `title` viene vacío o solo espacios | No pre-rellenar (mostrar form vacío como ahora) |
| `category` con valor desconocido | Ignorar ese param, no pre-seleccionar |
| `date` con formato no parseable | Mostrar en un campo de texto auxiliar para que el user lo ajuste |
| `claim` y `image` ambos presentes | Modo claim tiene prioridad (es un evento existente que se está reclamando, no nuevo) |

## Seguridad

- **Sanitizar todo** — son query params públicos, no confiar
- **`title`**: trim + escapeHtml + max 200 chars
- **`image`**: validar que es URL https y que el host es `artegenia.com` (whitelist) — sino el atacante podría inyectar URLs externas
- **`category`**: validar contra enum conocido
- **No persistir nada** hasta que el user haga click "Publicar evento"

## Implementación sugerida (pseudocódigo)

```tsx
// app/(main)/organizador/page.tsx

const searchParams = useSearchParams();
const claimToken = searchParams.get("claim");
const importedFromArtegenia = searchParams.get("source") === "artegenia";

// Si viene de artegenia y NO es claim, pre-rellenar form
const initialFormData = useMemo(() => {
  if (claimToken) return undefined; // modo claim, no aplicar

  if (importedFromArtegenia) {
    return {
      title: searchParams.get("title")?.slice(0, 200) ?? "",
      city: searchParams.get("city") ?? "",
      event_date: parseISODate(searchParams.get("date")),
      category: validateCategory(searchParams.get("category")),
      price_text: searchParams.get("price") ?? "",
      image_url: "", // se rellena después con fetch og
      __sourcePublicUrl: searchParams.get("image"), // marcador interno
    };
  }
  return undefined;
}, [searchParams, claimToken, importedFromArtegenia]);

// Tras mount, si hay __sourcePublicUrl, fetch og image
useEffect(() => {
  if (initialFormData?.__sourcePublicUrl) {
    fetch(`/api/og-image-extract?url=${encodeURIComponent(initialFormData.__sourcePublicUrl)}`)
      .then(r => r.json())
      .then(({ ogImage }) => {
        setForm(prev => ({ ...prev, image_url: ogImage }));
      });
  }
}, []);
```

## Limpieza

Tras consumir los query params (o tras publicar el evento), limpiar la URL:

```ts
const router = useRouter();
useEffect(() => {
  if (importedFromArtegenia) {
    // Mantén solo ?claim si lo hubiera, quita el resto
    router.replace("/organizador", { scroll: false });
  }
}, []);
```

Esto evita que el usuario refresque y vea valores que ya rellenó.

## Test manual

Pegar en navegador:
```
https://peligroficial.com/organizador?title=Kizomba+Workshop&image=https%3A%2F%2Fartegenia.com%2Fflyer%2Fcba79e19-dd44-4285-929b-08aecafaf2d4&source=artegenia&date=2026-07-15&city=Madrid&category=clases&price=15%E2%82%AC
```

Resultado esperado:
- Form de nuevo evento con title="Kizomba Workshop", city="Madrid", date="2026-07-15", category="clases", price="15€"
- Imagen del flyer cargada (tras fetch og)
- Banner "Importado desde tu flyer en ArteGenIA"

## Estado actual

- ✅ ArteGenIA ya envía estos params correctos (`PublishModal.tsx`)
- ✅ Mientras tanto, ArteGenIA copia la URL del flyer al portapapeles para
  que el organizador la pegue manualmente (workaround)
- ❌ `/organizador` los ignora — implementar esta spec desbloquea la
  experiencia full

## Contacto

Si tienes dudas de la spec, el código en ArteGenIA está en
`components/editor/PublishModal.tsx` líneas 150-185 (función `publishToPeligro`).
