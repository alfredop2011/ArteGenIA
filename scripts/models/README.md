# Pipeline de modelos generados

Genera personas fotorrealistas con Flux, les quita el fondo con BiRefNet y las
sube a R2. De aquí salen los 49 modelos de [`data/generatedModels.ts`](../../data/generatedModels.ts).

Existe porque el catálogo se sostenía sobre **22 caras** para 78 plantillas, con
5 de ellas cubriendo el 48% de las apariciones — los usuarios se quejaban de que
"los modelos se parecen todos".

## Uso

```bash
node gen.mjs ./salida ./batch-lote.mjs   # generar (Flux + BiRefNet)
node validate.mjs ./salida               # control automático — IMPRESCINDIBLE, ver abajo
node upload-r2.mjs                       # subir a R2 (solo escribe, nunca borra)
node build-catalog.mjs                   # medir bboxes → data/generatedModels.ts
```

Requiere `FAL_KEY` y las `R2_*` en `.env.local`. Los scripts se ejecutan desde
este directorio y esperan los PNG en `./lote` y `./out2`.

## Lo que se aprendió a base de fallos

**`validate.mjs` no es opcional.** El safety checker de Flux se dispara con
palabras inocentes ("crop top") y devuelve un **fotograma negro** — pero la API
responde `200` con una URL válida, así que un contador ingenuo de éxitos dice
"42/42" cuando una está vacía. `validate.mjs` mide el bbox del recorte y el
brillo del raw para cazar esos fallos silenciosos.

**Encuadre = todo.** Los slots del catálogo asumen un encuadre concreto. Sin
"tight close-up ... face fills a large portion of the frame", Flux devuelve
planos más abiertos y la cara sale pequeña al escalar en el flyer.

**Poses simples > poses gesticulando.** Pedir "gesto de bienvenida" devolvió a la
profesora *de espaldas*, y al segundo intento tapándose la cara con las manos.
"De pie, relajado, mirando a cámara" sale bien a la primera. Hay que pedir
**zapatos explícitamente** o salen descalzos, y **"faces the camera"** en todo lo
que no sea un busto.

**Manos: puño cerrado sí, dedos abiertos no.** Una mano cerrada sobre un cilindro
(micro) sale perfecta. Dedos abiertos sobre un mástil de guitarra sale una garra.
Los bustos son 100% fiables porque las manos no entran en cuadro.

**BiRefNet se come los instrumentos planos.** A una teclista le borró el teclado
(lo tomó por fondo) y quedó tecleando en el aire. Descartada.

**Los grupos no se generan: se componen.** Flux ignora el número de personas
(pedí 4 bailarines, hizo 8) y rompe manos e instrumentos al acumular gente. Un
"grupo de 8" se monta con 8 recortes individuales vía `lineup()` de
`data/generatedModels.ts` — y de paso cada persona queda sustituible por la foto
real del artista.

## Coste

~0,025 €/imagen (flux/dev) + BiRefNet. Las 49 salieron por ~1,60 € en total.
