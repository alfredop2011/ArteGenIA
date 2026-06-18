# WhatsApp Business — Setup canal #2 LATAM

> **Objetivo**: tener WhatsApp Business operativo en 1h, listo para que
> los primeros leads de Beachhead DJs (Madrid + LATAM) puedan contactarte
> sin fricción.
>
> **Coste**: 0€ (app gratis). API solo si volumen >100 mensajes/día.

## Por qué WhatsApp en LATAM

| Mercado | Canal #1 business | Canal #2 | Canal #3 |
|---|---|---|---|
| España | Email | WhatsApp | Instagram DM |
| México | **WhatsApp** | Instagram DM | Email |
| Argentina | **WhatsApp** | Instagram DM | Email |
| Colombia | **WhatsApp** | Instagram DM | Llamada |

Un DJ mexicano te contesta el WhatsApp en 30 min. El email lo abre la semana siguiente. Sin WhatsApp, **pierdes el 70% de los leads LATAM** simplemente porque no hay canal.

España es híbrido: si dejas WhatsApp, lo usan; si solo dejas email, también funciona. Pero ofrecer WhatsApp **reduce fricción en ambos mercados**.

---

## Decisión 1 — ¿Qué número usar?

3 opciones con tradeoffs reales:

### A) Tu número personal español (+34)
- ✅ Gratis, ya lo tienes
- ✅ Funciona en LATAM sin problemas (WhatsApp es internacional)
- ❌ Mezcla personal/business en mismo número
- ❌ Los LATAM ven prefijo +34 = "está en España" (puede sonar lejos)
- ❌ No puedes delegar (es tu móvil personal)

**Cuándo elegirla**: si quieres empezar YA y validar antes de invertir.

### B) Número virtual español dedicado
- ✅ Separa personal/business
- ✅ Delegable a futuro empleado
- ❌ Coste ~3-5€/mes en servicio tipo [TextNow](https://textnow.com) o [Skype Number](https://skype.com)
- ❌ Sigues siendo +34 (mismo "lejos" para LATAM)
- ⚠️ Algunos servicios virtuales NO permiten registrar WhatsApp (verificar antes)

**Cuándo elegirla**: cuando empiezas a generar volumen pero no quieres mezclar.

### C) Número virtual LATAM (+52 México, +54 Argentina, +57 Colombia)
- ✅ Los LATAM ven prefijo local = "es de aquí" (confianza inmediata)
- ✅ Delegable
- ❌ Coste mayor (~10-15€/mes) en servicios como [Nubelfono](https://nubelfono.com) o [TalkRoute](https://talkroute.com)
- ❌ Más setup técnico
- ❌ WhatsApp solo permite 1 cuenta por número, así que si eliges +52, tu cuenta principal de España queda separada

**Cuándo elegirla**: cuando LATAM sea >40% de tus leads y quieras profesionalizar.

### Recomendación arranque

**Opción A (tu número personal)** durante las primeras 4-6 semanas. Cuando tengas >50 contactos activos, migrar a B o C según el mix geográfico real de tus leads.

---

## Decisión 2 — ¿App o API?

| | WhatsApp Business App | WhatsApp Business API |
|---|---|---|
| **Coste** | Gratis | $0.005-0.05/mensaje según país |
| **Volumen** | Hasta ~250 chats/día manual | Ilimitado |
| **Automatización** | Mensajes pre-grabados básicos | Chatbots, integraciones CRM |
| **Multi-agente** | 1 dispositivo + 4 vinculados | Sí, varios agentes |
| **Setup** | 5 min (descargar app) | Semanas (proveedor + Meta) |

**Recomendación**: **App gratis durante 6 meses**. Solo migrar a API cuando:
- Estés contestando >100 mensajes/día (saturación)
- Necesites conectar con CRM/Notion
- Tengas equipo de soporte (>2 personas)

Proveedores API recomendados cuando llegue el momento: [Twilio](https://twilio.com), [Wati](https://wati.io), [360dialog](https://360dialog.com).

---

## Setup paso a paso (App gratis — 15 min)

### Paso 1 — Instalar WhatsApp Business App
- Android: https://play.google.com/store/apps/details?id=com.whatsapp.w4b
- iPhone: App Store → "WhatsApp Business"
- ⚠️ NO instalar sobre tu WhatsApp personal — convive separadamente

### Paso 2 — Registrar tu número
- Si usas tu número personal: WhatsApp te avisa que pierdes tu cuenta personal en ese móvil. Solución: usar el **WhatsApp Business en móvil principal** + WhatsApp personal en otro dispositivo (PC, tablet, móvil viejo) vinculado vía "WhatsApp Web".
- Si usas número virtual: registra ese número siguiendo flow normal.

### Paso 3 — Perfil de negocio
Configuración → Perfil de empresa:

```
Nombre:        ArteGenIA
Categoría:     Diseño · Software · Servicios profesionales
Dirección:     Madrid, España  (no des dirección real personal)
Descripción:   Editor de flyers profesionales con IA en español.
               Plantillas DJ, eventos y workshops.
               9,99€/mes · Pruébalo gratis: artegenia.com
Horario:       Lun-Vie 10:00-19:00 (CET)
               Sáb-Dom: respondemos en 24h
Email:         hola@artegenia.com
Web:           https://artegenia.com
```

Logo: usa el de ArteGenIA (mismo del header de la web).

### Paso 4 — Mensaje de bienvenida automático

Configuración → Herramientas para la empresa → Mensaje de bienvenida:

```
¡Hola! 👋 Gracias por escribirnos a ArteGenIA.

Te respondemos en menos de 4h en horario laboral
(Lun-Vie 10:00-19:00 CET).

Mientras tanto:
✨ Prueba el editor gratis: artegenia.com
🎨 Ve plantillas DJ/eventos: artegenia.com/templates
📖 Tutorial 5 min: artegenia.com/flyer-fiesta-5-minutos

Cuéntanos en qué te ayudamos 👇
```

Activar para: "Todo el mundo".

### Paso 5 — Mensaje de ausencia

Configuración → Herramientas para la empresa → Mensaje de ausencia:

```
Recibimos tu mensaje fuera de horario laboral.

Te contestamos mañana antes de las 13:00 CET.
Si es urgente: hola@artegenia.com

Mientras tanto puedes:
🎨 Empezar a diseñar gratis: artegenia.com
```

Activar fuera de horario: Lun-Vie 19:00-10:00 + fines de semana.

### Paso 6 — Respuestas rápidas (atajos /)

Crear estas 6 respuestas rápidas para los DMs más típicos del Beachhead:

#### `/precio`
```
Plan gratis: 10 créditos IA al mes, sin tarjeta, sin marca de agua.
Plan Pro: 9,99€/mes — IA ilimitada, PDF imprenta, SVG, soporte prioritario.
Detalles: artegenia.com/pricing
```

#### `/plantillas-dj`
```
Tenemos 10 plantillas pensadas para DJs:
🎧 Techno, House, Reggaeton, Hip-Hop, Bachata, Salsa, Kizomba, Festival multi, Vinyl vintage, Pool party.
Velas aquí: artegenia.com/templates?cat=club-discoteca
```

#### `/setup`
```
1. Entra a artegenia.com → "Empezar gratis"
2. Crea cuenta con Google (10 segundos)
3. Elige una plantilla DJ
4. Cambia foto + texto
5. Descarga en PNG/JPG

Total: 5 min. Si te atascas, pregúntame.
```

#### `/diseñador`
```
Si necesitas algo muy personalizado, no podemos hacerlo nosotros directamente, pero te paso 2-3 diseñadores que conocemos y trabajan con ArteGenIA:
(añade aquí tus contactos cuando tengas)
```

#### `/tutorial`
```
Tutorial paso a paso de 5 min: artegenia.com/flyer-fiesta-5-minutos
Vídeos cortos: (link al Instagram/TikTok)
```

#### `/contacto`
```
Email: hola@artegenia.com
Instagram: @artegenia_app
Web: artegenia.com
WhatsApp: aquí mismo 👋
```

### Paso 7 — Catálogo de productos (opcional pero recomendado)

WhatsApp Business permite mostrar "catálogo" — perfecto para enseñar plantillas.

Configuración → Herramientas para la empresa → Catálogo → "Añadir nuevo artículo":

Por cada plantilla DJ destacada (mín 5):
```
Foto:        thumbnail R2 de la plantilla
Nombre:      DJ Techno Dark
Precio:      Gratis
Descripción: Plantilla flyer para fiestas techno underground.
             Sin marca de agua. Edita en 5 min.
Link:        https://artegenia.com/editor/52
```

Beneficio: cuando alguien te pregunta "¿qué plantillas tienes?" → en 2 taps les enseñas el catálogo.

### Paso 8 — Etiquetas para clasificar leads

Configuración → Herramientas para la empresa → Etiquetas:

Crear estas 5 etiquetas:
- 🟢 **Cliente Pro** (paga)
- 🟡 **Trial activo** (registrado free)
- 🔵 **Beachhead DJ** (contacto del plan beachhead)
- 🟣 **Soporte** (necesita ayuda técnica)
- ⚪ **Sin clasificar** (lead nuevo)

Aplicar a cada chat según vaya pasando. Te ayuda a priorizar respuestas.

---

## Flow de respuestas (cómo NO quemarte)

**Mañana (10:00 - 13:00)** — Ventana óptima de respuesta:
1. Revisar todos los chats sin leer
2. Etiquetar nuevos
3. Responder prioridad: Cliente Pro → Soporte → Beachhead DJ → Trial → Sin clasificar
4. Usar respuestas rápidas (`/precio`, `/setup`, etc.) cuando aplique

**Tarde (16:00 - 19:00)** — Segunda ronda:
- Solo follow-ups de chats que pediste algo (datos, imágenes)
- No abrir conversaciones nuevas

**Fuera de horario**: el mensaje de ausencia se ocupa. NO contestar a no ser que sea cliente Pro con urgencia real.

**Sábados-domingos**: 1 vistazo rápido sábado mañana para urgencias. Resto, esperar al lunes.

**Regla de oro**: si la respuesta requiere >5 min de explicación, mejor llamada de 10 min que 50 mensajes ping-pong.

---

## Cómo lo conectas con el resto

### Llevar leads DESDE WhatsApp HACIA tu producto

CTA en cada conversación nueva: link a `artegenia.com/templates` o `artegenia.com/flyer-fiesta-5-minutos`.

Si el lead aún no ha probado: pídele que cree cuenta gratis ANTES de seguir contestando preguntas. Filtra los curiosos.

### Llevar leads DESDE tu producto HACIA WhatsApp

Añade tu número WhatsApp a:
- Página /pricing → footer "¿Dudas? WhatsApp"
- Email transactional welcome → "Cualquier duda, WhatsApp directo"
- Página /quitar-fondo → CTA secundario "WhatsApp si falla"
- Sección Footer del Home

Pero NO en el editor (distrae al user en flujo de pago).

---

## Métricas a vigilar (review mensual)

| Métrica | Cómo medir | Objetivo mes 1 | Objetivo mes 3 |
|---|---|---|---|
| Chats nuevos/semana | Contar manual | 5-10 | 30+ |
| Conversiones desde WhatsApp | Preguntar "¿de dónde nos conoces?" en signup | 1-3 / mes | 10+ / mes |
| Tiempo medio respuesta | App lo muestra automático | <4h | <2h |
| % LATAM | Etiquetas o prefijo número | 30%+ | 50%+ |

Si LATAM % crece >40% del total → momento de considerar número virtual LATAM (Decisión 1 opción C).

---

## Errores comunes a evitar

1. **Mensajes promocionales masivos a contactos** — WhatsApp lo penaliza, te puede banear el número
2. **Responder fuera de horario "porque sí"** — entrenas al user a esperar respuesta 24/7
3. **Usar el mismo número para WhatsApp personal y business** — pierdes contexto, mezclas
4. **No usar etiquetas** — en 1 mes tienes 50 chats sin clasificar y no sabes a quién priorizar
5. **Dar tu número WhatsApp como CTA principal** — convierte tu vida en soporte 24/7. Solo es canal **secundario**

---

## Checklist de arranque (15 min total)

- [ ] Decidir número (recomendación: tu personal para empezar)
- [ ] Descargar WhatsApp Business App
- [ ] Registrar número
- [ ] Configurar perfil de empresa (logo + descripción + horarios)
- [ ] Activar mensaje de bienvenida
- [ ] Activar mensaje de ausencia (fuera 19:00-10:00 + fines semana)
- [ ] Crear 6 respuestas rápidas (`/precio`, `/plantillas-dj`, `/setup`, `/diseñador`, `/tutorial`, `/contacto`)
- [ ] Crear 5 etiquetas
- [ ] Subir 5 plantillas al catálogo
- [ ] Añadir nº WhatsApp al footer de artegenia.com
- [ ] Probar todo enviándote un mensaje desde otro número

Tiempo total real: **15 min activos**. Después: 30-60 min/día contestando (las primeras semanas).
