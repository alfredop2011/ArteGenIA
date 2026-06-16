# Brand assets — fuentes originales

Aqui van los **3 PNGs originales** del logo (generados con ChatGPT/DALL-E).
NO los modifiques — son la fuente de verdad. Si necesitas otros tamanos,
ejecuta `npm run brand:export` que genera versiones derivadas en
`public/brand/exports/`.

## Archivos requeridos

| Nombre exacto | Que es | Tamano ideal |
|---|---|---|
| `logo-horizontal.png` | Icono + wordmark "ArteGenIA" + tagline | ~2000x700 |
| `logo-app-icon.png` | Cuadrado con fondo gradiente (estilo app icon iOS) | 1024x1024 |
| `logo-icon.png` | Solo el isotipo, fondo transparente | 1024x1024 |

## Como anadirlos

1. Arrastra los 3 PNGs (los que generaste en ChatGPT) a esta carpeta
   `public/brand/source/`
2. Renombralos exactamente como indica la tabla
3. Desde la raiz del proyecto: `npm run brand:export`
4. Se generan automaticamente todos los tamanos en `public/brand/exports/`

## Generaciones derivadas (automaticas via script)

| Output | Tamano | Uso |
|---|---|---|
| `exports/icon-32.png` | 32x32 | Favicon |
| `exports/icon-180.png` | 180x180 | Apple touch icon |
| `exports/icon-512.png` | 512x512 | PWA, Android |
| `exports/icon-1024.png` | 1024x1024 | Alta resolucion |
| `exports/og-default.png` | 1200x630 | Open Graph (links en redes) |
| `exports/ig-profile.png` | 1080x1080 | Foto perfil Instagram/TikTok |

## Versionado

Si actualizas el logo, mantén el mismo nombre del PNG y re-ejecuta el script.
Los exports se regeneran automaticamente.
