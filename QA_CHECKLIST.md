# Checklist QA — ArteGenIA

Lista de verificación manual antes de cada release importante.

Las pruebas **automatizadas** cubren lo crítico técnico (seguridad, validación,
i18n, rate limit, headers, RLS). Esta checklist cubre lo que solo se puede
verificar con un humano usando el producto: UX, flow real, edge cases visuales.

**Tiempo total ~30 min.** Hacer en un browser limpio (incógnito) para
simular usuario nuevo.

---

## 🧪 Tests automatizados (correr antes de empezar)

```bash
npm test            # 75+ unit tests (~400ms)
npm run test:e2e    # 8 E2E contra producción (~2s)
```

Ambos deben pasar al 100%. Si alguno falla, NO releases.

---

## 1. 🏠 Home (`/`)

- [ ] Carga sin scroll horizontal en mobile (375px)
- [ ] Animación de entrada del hero suave (no jank)
- [ ] Stack 3 flyers se ve correcto, no se solapan mal
- [ ] Botones "Explorar plantillas" + "Ver categorías" llevan a /templates
- [ ] Filtros (categoría / formato / audience) cambian el grid
- [ ] Búsqueda filtra plantillas en tiempo real
- [ ] Toggle tema sol/luna funciona y persiste tras recarga
- [ ] Selector idioma cambia textos visibles del home
- [ ] Card "Pro Ver planes" SOLO visible si admin login (alfredop2011)

## 2. 📚 Plantillas (`/templates`)

- [ ] Sidebar de filtros visible desktop, drawer en mobile
- [ ] Filtro por red social ("Instagram Feed") cambia formato del grid
- [ ] Filtro "Para qué" funciona (categoria=Clases muestra workshops)
- [ ] Toggle Grid / List funciona ambas vistas
- [ ] "Cargar más plantillas" carga 10 más sin recargar
- [ ] Click en una plantilla abre el editor con el formato correcto
- [ ] Card promo "PRO Ver planes" solo aparece si admin

## 3. 🎨 Editor desktop (primera vez)

- [ ] Aparece tour de bienvenida con 4 pasos
- [ ] "Empezar a diseñar" cierra el tour y NO vuelve a aparecer al recargar
- [ ] Reset: `localStorage.removeItem("artegenia-desktop-editor-tour-seen")` lo trae de vuelta
- [ ] Sidebar Tools: Diseño / Texto / Elementos / Fotos / Fondo / Capas
- [ ] Click en cualquier capa muestra barra flotante con: Editar / Imagen / Estilos / Alinear / Bloquear / Eliminar / Más
- [ ] Doble click en texto entra a edición inline
- [ ] Botón "Imagen" en barra flotante abre file picker y añade imagen como capa nueva
- [ ] Drag para mover capa funciona
- [ ] Esquinas con handles para escalar
- [ ] ⌘Z deshace, ⌘⇧Z rehace
- [ ] ⌘S guarda (toast confirmación o estado "Guardado")
- [ ] Descargar PNG sin marca de agua (en plan pro)
- [ ] Descargar JPG sin marca de agua

## 4. 📱 Editor mobile (primera vez, viewport iPhone)

- [ ] Aparece hint inicial con 3 emojis (👆 ✏️ 🤏)
- [ ] "Empezar a diseñar" cierra el hint
- [ ] Tap en capa la selecciona
- [ ] Sheet aparece desde abajo con propiedades
- [ ] Doble tap en texto abre fullscreen edit con teclado
- [ ] Botón "Foto" abre file picker NATIVO (Cámara + Galería + Archivos)
  **NO solo cámara forzada** ← bug arreglado recientemente
- [ ] Panel de Capas muestra mini-preview real (no icono genérico)
- [ ] Pellizco para hacer zoom funciona y NO se "resetea" al cambiar de capa
- [ ] Botón Exportar descarga PNG

## 5. 🔐 Auth

- [ ] AuthModal se abre al click en "Iniciar sesión / Regístrate gratis"
- [ ] En tema CLARO: inputs visibles con fondo blanco + texto oscuro (no invisible)
- [ ] Toggle login/registro funciona
- [ ] Checkbox "He leído y acepto los Términos" obligatorio en registro
- [ ] Login con Google funciona (popup OAuth)
- [ ] Login con email funciona
- [ ] Tras login, dropdown user muestra plan + Cerrar sesión
- [ ] Modal "¿Qué tipo de organizador eres?" aparece 1 vez tras primer login
- [ ] Skip del modal lo deja en `skipped`, no vuelve a aparecer

## 6. 📧 Email branding

- [ ] Email de bienvenida llega desde `cuentas@peligroficial.com` (no Supabase)
- [ ] Tiene logo AG + botón morado "Confirmar mi email"
- [ ] Link de confirmación funciona y entra logueado al home
- [ ] Reset password: mismo branding

## 7. 💳 /planes (admin only)

- [ ] Si NO admin → URL directa `/planes` redirige a `/`
- [ ] Si admin: ve los 3 planes con toggle Mensual/Anual
- [ ] Toggle Anual muestra precio efectivo /mes + total /año + ahorro 17%
- [ ] Plan Pro destacado con badge "Más popular"
- [ ] Botones CTA disabled con disclaimer "pendiente LemonSqueezy"
- [ ] FAQ visible al final
- [ ] Banner rojo "VISTA PREVIA · SOLO ADMIN" arriba

## 8. 📊 /admin/usuarios (admin only)

- [ ] Si NO admin → redirige a `/`
- [ ] 4 KPIs muestran números correctos
- [ ] Bar chart de organizer_type con accent colors
- [ ] Tabla de usuarios recientes con email/tipo/plan
- [ ] Botón "📊 Usuarios" en `/admin/templates` lleva aquí

## 9. 🌍 Internacionalización

Cambiar idioma desde el selector del header:

- [ ] ES: textos correctos en home, /templates, /create, /admin, footer
- [ ] EN: textos correctos
- [ ] FR: textos correctos
- [ ] PT: textos correctos
- [ ] Páginas legales: en idioma != ES muestran banner "translation pending" + versión ES debajo
- [ ] Fechas en /projects y /history en formato del idioma activo
- [ ] LocalStorage persiste idioma tras recarga

## 10. 🎨 Tema claro/oscuro

- [ ] Default es CLARO (usuario nuevo en incógnito)
- [ ] Toggle sol/luna en header cambia inmediato
- [ ] LocalStorage persiste tema tras recarga
- [ ] Home/templates/admin/projects: TODOS los textos legibles en tema claro
- [ ] Modales (AuthModal, OrganizerType, FormatPicker) legibles en claro
- [ ] Editor sigue oscuro en ambos temas (decisión de producto)

## 11. ⚠️ Cuotas y rate limits

- [ ] Como usuario free: 11ª descarga del mes falla (cuota mensual)
- [ ] Como pro: descarga ilimitada
- [ ] Rate limit: hacer 6 segment-person en 1 minuto → la 6ª devuelve 429
- [ ] Mensaje 429 en español: "Has hecho demasiadas peticiones..."

## 12. 🔒 Seguridad

```bash
# Headers en producción
curl -sI https://artegenia.vercel.app | grep -iE "strict|csp|x-frame"

# Endpoint sin auth debe rechazar
curl -X POST https://artegenia.vercel.app/api/generate-bg \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test"}'
# Esperado: {"error":"Inicia sesion para usar esta funcion"}
```

- [ ] Headers presentes (HSTS, CSP, X-Frame-Options DENY)
- [ ] Endpoints IA rechazan sin auth
- [ ] SSRF: payload con `169.254.169.254` rechazado
- [ ] No console.error en producción (DevTools Console limpio)
- [ ] HTTPS forzado (intentar HTTP → redirect HTTPS)

## 13. 📐 Responsive

Verificar a estos breakpoints (DevTools → Device toolbar):

- [ ] iPhone SE (375px): nada se sale del viewport
- [ ] iPhone 14 Pro (393px): OK
- [ ] iPad Mini (768px): grids cambian a 2-3 columnas
- [ ] iPad Pro (1024px): editor desktop completo visible
- [ ] Desktop 1440px: ningún elemento estira raro

## 14. 🐛 Errores

- [ ] Sentry recibe errores en producción (forzar uno y verificar)
- [ ] No hay errores en Console al navegar normal
- [ ] Network tab: no requests fallidas (404, 500)
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 90

## 15. 📊 Analytics

- [ ] PostHog recibe `$pageview` al navegar (Dashboard PostHog → Live events)
- [ ] PostHog recibe `flyer_downloaded` al descargar un PNG
- [ ] Identifica al user logueado con su email

---

## Bugs conocidos / Limitaciones aceptadas (no bloquean release)

- ⚠️ Editor desktop: en tema claro algunos textos dentro del editor siguen oscuros (decisión: editor se mantiene dark estilo Photoshop)
- ⚠️ 3 vulnerabilidades npm en PostCSS embebido en Next 16 (falso positivo build-time)
- ⚠️ /history no muestra downloads aún (falta tabla `download_log`)
- ⚠️ Notificaciones campana del header sin lógica funcional
- ⚠️ ArtistLibrary (componente admin) no está internacionalizado

---

## Plantilla de bug report (cuando encuentres uno)

```markdown
**Qué pasa:** [descripción corta]
**Esperado:** [lo que debería pasar]
**Pasos:**
1.
2.
3.
**Browser/Device:** [Chrome 130 macOS / iPhone 14 Safari / etc.]
**URL:** https://artegenia.vercel.app/...
**Screenshot:** [si aplica]
**Console errors:** [si hay]
```
