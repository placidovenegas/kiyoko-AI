# Kiyoko AI — Conversaciones de Ejemplo (Diseño de Interacción)

> Este documento define EXACTAMENTE cómo debe responder la IA en cada situación.
> Cada bloque `[COMPONENTE]` representa un elemento visual interactivo en el chat.
> Revisar y validar antes de implementar.

---

## CONTEXTO: DASHBOARD (`/dashboard`)

---

### Conversación D-1: El usuario abre el chat en el dashboard

```
🤖 Kiyoko:
  ¡Hola! Estás en el dashboard. Tienes 3 proyectos activos.

  [WIDGET:proyectos]
  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
  │ 🎬 Campaña Verano    │  │ 🎬 Tutorial Café      │  │ 🎬 Spot Navidad      │
  │ 3 videos · En curso  │  │ 1 video · Borrador    │  │ 2 videos · Archivado │
  │ [Abrir]              │  │ [Abrir]               │  │ [Abrir]              │
  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
  [/WIDGET]

  ¿Qué quieres hacer?
  [🆕 Nuevo proyecto] [✅ Ver mis tareas] [🕐 Continuar donde lo dejé]
```

---

### Conversación D-2: "Edita el video"

```
👤 Usuario: edita el video

🤖 Kiyoko:
  Tengo 6 videos en tus proyectos. ¿A cuál te refieres?

  [SELECTOR:videos]
  ┌─ Campaña Verano ──────────────────────────────┐
  │  📹 Spot principal (45s) · Instagram · Activo  │
  │  📹 Version corta (15s) · TikTok · Borrador   │
  │  📹 Making of (2min) · YouTube · Archivado    │
  ├─ Tutorial Café ───────────────────────────────┤
  │  📹 Tutorial completo (8min) · YouTube · Draft │
  ├─ Spot Navidad ────────────────────────────────┤
  │  📹 Spot 30s · TV · Finalizado                │
  │  📹 Versión digital · Instagram · Finalizado  │
  └───────────────────────────────────────────────┘
  [/SELECTOR]

  Pulsa en el video que quieres editar.
```

---

### Conversación D-3: "Crea un nuevo proyecto"

```
👤 Usuario: quiero crear un proyecto nuevo

🤖 Kiyoko:
  Vamos a crear tu nuevo proyecto. Cuéntame:

  ¿Sobre qué trata?
  ┌─────────────────────────────────────────────┐
  │ [INPUT] Describe brevemente el proyecto...  │
  └─────────────────────────────────────────────┘

  ¿Para qué plataforma principal?
  [📸 Instagram]  [▶️ YouTube]  [🎵 TikTok]  [💼 LinkedIn]  [📺 TV/Streaming]

  ¿Qué tipo de contenido?
  [📢 Publicitario]  [🎓 Educativo]  [🎭 Entretenimiento]  [🏢 Corporativo]
```

```
👤 Usuario: [escribe] "Campaña para lanzar una app de meditación"
            [elige] YouTube
            [elige] Educativo

🤖 Kiyoko:
  He generado los datos para tu proyecto. Aquí está lo que voy a crear:

  ╔══════════════════════════════════════════════════╗
  ║  NUEVO PROYECTO                                  ║
  ╠══════════════════════════════════════════════════╣
  ║  Nombre:      Lanzamiento App Meditación Zen     ║
  ║  Descripción: Campaña educativa para presentar   ║
  ║               la app de meditación, mostrando    ║
  ║               sus beneficios y funcionalidades   ║
  ║  Plataforma:  YouTube (principal)                ║
  ║  Tipo:        Educativo                          ║
  ║  Estilo:      Minimalista y relajante            ║
  ║  Paleta:      Azules y verdes suaves             ║
  ╚══════════════════════════════════════════════════╝

  [💾 Guardar proyecto] [✏️ Cambiar algo] [❌ Cancelar]
```

```
👤 Usuario: [pulsa] ✏️ Cambiar algo

🤖 Kiyoko:
  ¿Qué quieres cambiar?

  [📝 Cambiar nombre]
  [📄 Cambiar descripción]
  [📱 Cambiar plataforma]
  [🎨 Cambiar estilo]
  [🔄 Regenerar todo desde cero]
```

```
👤 Usuario: [pulsa] 📝 Cambiar nombre

🤖 Kiyoko:
  El nombre actual es: **"Lanzamiento App Meditación Zen"**

  ¿Cómo quieres llamarlo?
  ┌─────────────────────────────────────────────┐
  │ [INPUT] Nuevo nombre del proyecto...        │
  └─────────────────────────────────────────────┘

  O elige una sugerencia:
  [🧘 Zen en Movimiento]  [🌿 MindfulLaunch]  [✨ Meditación para Todos]
```

```
👤 Usuario: [escribe] "ZenApp - Campaña de Lanzamiento"

🤖 Kiyoko:
  Actualizado. Aquí está el proyecto con el cambio:

  ╔══════════════════════════════════════════════════╗
  ║  NUEVO PROYECTO                                  ║
  ╠══════════════════════════════════════════════════╣
  ║  Nombre:      ZenApp - Campaña de Lanzamiento   ║  ← cambiado
  ║  Descripción: Campaña educativa para presentar  ║
  ║               la app de meditación...           ║
  ║  Plataforma:  YouTube                           ║
  ║  Tipo:        Educativo                         ║
  ╚══════════════════════════════════════════════════╝

  [💾 Guardar proyecto] [✏️ Cambiar algo más] [❌ Cancelar]
```

```
👤 Usuario: [pulsa] 💾 Guardar proyecto

🤖 Kiyoko:
  ✅ Proyecto creado correctamente.

  ¿Quieres crear el primer video ahora?
  [🎬 Sí, crear primer video] [⏸️ Luego, ir al proyecto]
```

---

### Conversación D-4: "Ver mis tareas"

```
👤 Usuario: [pulsa] ✅ Ver mis tareas

🤖 Kiyoko:
  Tienes 4 tareas pendientes:

  [WIDGET:tareas]
  🔴 URGENTE
  ├── Revisar escenas del spot principal · Campaña Verano · Vence hoy
  │   [Ir a escenas] [Marcar como hecha]

  🟡 ESTA SEMANA
  ├── Subir personaje Elena · Tutorial Café · Vence en 2 días
  │   [Ir al video] [Marcar como hecha]
  ├── Generar narración escena 3 · Spot Navidad · Vence en 3 días
  │   [Ir a escena] [Marcar como hecha]

  🟢 PRÓXIMAMENTE
  └── Exportar versión final · Campaña Verano · Vence en 7 días
      [Ir al proyecto] [Marcar como hecha]
  [/WIDGET]

  [➕ Crear nueva tarea] [✅ Ver tareas completadas]
```

---

## CONTEXTO: PROYECTO (`/project/abc`)

---

### Conversación P-1: El usuario abre el chat en un proyecto

```
🤖 Kiyoko:
  Estás en el proyecto **"Campaña Verano 2026"**.

  Tiene 3 videos y 12 escenas en total.
  2 personajes · 4 fondos · Estado: En producción

  ¿Qué necesitas?
  [🎬 Nuevo video]  [👤 Añadir personaje]  [🏙️ Añadir fondo]  [📊 Ver resumen]
```

---

### Conversación P-2: "Crea un video"

```
👤 Usuario: crea un video

🤖 Kiyoko:
  Para el proyecto **"Campaña Verano 2026"**. Dime:

  ¿Sobre qué trata este video?
  ┌─────────────────────────────────────────────┐
  │ [INPUT] ¿Cuál es el tema o mensaje?         │
  └─────────────────────────────────────────────┘
```

```
👤 Usuario: sobre los descuentos de verano en ropa de playa

🤖 Kiyoko:
  ¿Cuánto debe durar?

  [⚡ 15 segundos · Story/Reel]
  [📱 30 segundos · Anuncio corto]
  [🎬 60 segundos · Anuncio completo]
  [🎥 +2 minutos · Video largo]
  [✏️ Otro, lo especifico]
```

```
👤 Usuario: [pulsa] 📱 30 segundos

🤖 Kiyoko:
  ¿Para qué plataforma?

  [📸 Instagram Feed]  [📲 Instagram Stories]  [🎵 TikTok]
  [▶️ YouTube]  [💼 LinkedIn]  [📺 Otros]
```

```
👤 Usuario: [pulsa] 📸 Instagram Feed

🤖 Kiyoko:
  Generando datos del video...

  ╔══════════════════════════════════════════════════╗
  ║  NUEVO VIDEO                                     ║
  ╠══════════════════════════════════════════════════╣
  ║  Título:      Verano Sin Límites - Descuentos   ║
  ║  Descripción: Video publicitario de 30 segundos ║
  ║               mostrando colección de playa con  ║
  ║               descuentos de hasta el 50%        ║
  ║  Plataforma:  Instagram Feed                    ║
  ║  Duración:    30 segundos                       ║
  ║  Formato:     Cuadrado 1:1                      ║
  ╚══════════════════════════════════════════════════╝

  [💾 Guardar video] [✏️ Cambiar algo] [❌ Cancelar]
```

```
👤 Usuario: [pulsa] 💾 Guardar video

🤖 Kiyoko:
  ✅ Video creado. Entrando en **"Verano Sin Límites - Descuentos"**...

  Ahora necesitamos las escenas. Antes de generarlas:

  ¿Hay personajes específicos en este video?
  [👤 Sí, subo imágenes]  [🤖 No, usa personajes del proyecto]  [⏭️ Sin personajes]
```

---

## CONTEXTO: VIDEO (`/project/abc/video/xyz`)

---

### Conversación V-1: El usuario abre el chat en un video sin escenas

```
🤖 Kiyoko:
  Estás editando **"Verano Sin Límites - Descuentos"**
  📱 Instagram Feed · 30s · 0 escenas todavía

  Para empezar, necesitamos las escenas.
  ¿Primero subes los personajes o generamos las escenas directamente?

  [👤 Subir personajes primero]
  [🏙️ Subir fondos primero]
  [🎬 Generar escenas ya]
```

---

### Conversación V-2: "Quiero subir un personaje"

```
👤 Usuario: [pulsa] 👤 Subir personajes primero

🤖 Kiyoko:
  Perfecto. Sube la imagen del personaje principal
  y lo analizo para ti automáticamente.

  [ZONA DE SUBIDA]
  ┌─────────────────────────────────────────────┐
  │                                             │
  │    📎  Arrastra una imagen aquí             │
  │        o haz clic para seleccionar          │
  │                                             │
  │    JPG, PNG, WEBP · Máx 10MB               │
  └─────────────────────────────────────────────┘
  [/ZONA DE SUBIDA]

  También puedes adjuntarla directamente en el input de abajo ↓
```

```
👤 Usuario: [sube imagen de una chica joven con ropa de playa]

🤖 Kiyoko:
  He analizado la imagen. Esto es lo que veo:

  ╔══════════════════════════════════════════════════╗
  ║  [FOTO]  Mujer joven, aprox. 22-27 años          ║
  ║          Cabello rubio ondulado, sonrisa amplia  ║
  ║          Ropa de playa: bañador y pareo           ║
  ║          Expresión: alegre y desenfadada          ║
  ╚══════════════════════════════════════════════════╝

  ¿Cómo se llama este personaje?
  ┌─────────────────────────────────────────────┐
  │ [INPUT] Nombre del personaje...             │
  └─────────────────────────────────────────────┘
```

```
👤 Usuario: Laura

🤖 Kiyoko:
  ¿Cuál es el rol de Laura en el video?

  [⭐ Protagonista · Aparece en la mayoría de escenas]
  [👥 Secundaria · Aparece puntualmente]
  [🎙️ Narradora · Voz en off o presentadora]
  [🎭 Extra · Aparición de fondo]
```

```
👤 Usuario: [pulsa] ⭐ Protagonista

🤖 Kiyoko:
  Listo. Esto es lo que voy a guardar:

  ╔══════════════════════════════════════════════════╗
  ║  NUEVO PERSONAJE                                 ║
  ╠══════════════════════════════════════════════════╣
  ║  Nombre:      Laura                             ║
  ║  Rol:         Protagonista                      ║
  ║  Descripción: Joven mujer de 22-27 años,        ║
  ║               desenfadada y alegre              ║
  ║  Visual:      Mujer joven, cabello rubio        ║
  ║               ondulado, ropa de playa colorida  ║
  ║  Prompt IA:   "Young woman 22-27, wavy blonde   ║
  ║               hair, beach outfit, bright smile, ║
  ║               summer vibes, cheerful"           ║
  ║  Imagen:      ✅ Subida                          ║
  ╚══════════════════════════════════════════════════╝

  [💾 Guardar a Laura] [✏️ Cambiar algo] [❌ Cancelar]
```

```
👤 Usuario: [pulsa] ✏️ Cambiar algo

🤖 Kiyoko:
  ¿Qué quieres cambiar de Laura?

  [📝 Cambiar nombre]
  [👤 Cambiar descripción]
  [✨ Cambiar prompt de IA]
  [🖼️ Cambiar imagen]
  [🔄 Regenerar descripción con la misma imagen]
```

```
👤 Usuario: [pulsa] ✨ Cambiar prompt de IA

🤖 Kiyoko:
  El prompt actual es:
  *"Young woman 22-27, wavy blonde hair, beach outfit, bright smile, summer vibes, cheerful"*

  ¿Lo editas tú o quieres que sugiera variantes?

  [✏️ Editar manualmente]  [💡 Ver 3 variantes]
```

```
👤 Usuario: [pulsa] 💡 Ver 3 variantes

🤖 Kiyoko:
  Aquí tienes 3 opciones de prompt:

  [OPCIÓN 1]
  "Young woman, early 20s, sun-kissed skin, wavy golden hair, colorful bikini, warm smile, golden hour beach, editorial fashion style"

  [OPCIÓN 2]
  "Attractive young female model, 22-27, blonde wavy hair, summer beach fashion, vibrant colors, candid happy expression, lifestyle photography"

  [OPCIÓN 3]
  "Woman in summer outfit, blonde, joyful energy, beach backdrop, lifestyle ad style, natural lighting, approachable and friendly"

  [Usar Opción 1] [Usar Opción 2] [Usar Opción 3] [✏️ Escribir el mío]
```

```
👤 Usuario: [pulsa] Usar Opción 2

🤖 Kiyoko:
  Actualizado. Aquí está Laura lista para guardar:

  ╔══════════════════════════════════════════════════╗
  ║  NUEVO PERSONAJE                                 ║
  ╠══════════════════════════════════════════════════╣
  ║  Nombre:   Laura · Protagonista                 ║
  ║  Prompt:   "Attractive young female model,      ║  ← actualizado
  ║            22-27, blonde wavy hair..."          ║
  ║  Imagen:   ✅                                   ║
  ╚══════════════════════════════════════════════════╝

  [💾 Guardar a Laura] [✏️ Cambiar más] [❌ Cancelar]
```

```
👤 Usuario: [pulsa] 💾 Guardar a Laura

🤖 Kiyoko:
  ✅ Laura guardada como protagonista.

  ¿Añadir otro personaje?
  [👤 Sí, otro personaje]  [🏙️ Ahora añado fondos]  [🎬 Generar escenas]
```

---

### Conversación V-3: Generar escenas

```
👤 Usuario: [pulsa] 🎬 Generar escenas

🤖 Kiyoko:
  Voy a generar las escenas para **"Verano Sin Límites"** (30s · Instagram).
  Tengo en cuenta a **Laura** (protagonista).

  ¿Qué estilo visual quieres?

  [🎭 Cómico y viral · Humor y dinamismo]
  [📢 Publicitario clásico · Profesional y persuasivo]
  [🌈 Lifestyle · Natural y aspiracional]
  [✨ Glamour · Lujo y sofisticación]
  [📸 UGC · Estilo usuario real, sin filtros]
```

```
👤 Usuario: [pulsa] 🌈 Lifestyle

🤖 Kiyoko:
  ¿Cuántas escenas quieres aproximadamente?

  [3 escenas · Muy dinámico]
  [5 escenas · Equilibrado]  ← recomendado para 30s
  [7 escenas · Detallado]
  [Decide tú · La IA elige lo óptimo]
```

```
👤 Usuario: [pulsa] 5 escenas

🤖 Kiyoko:
  Generando el plan de escenas...

  He preparado 5 escenas para tu video. Aquí está el plan completo:

  ┌─────────────────────────────────────────────────────────────────┐
  │  PLAN DE ESCENAS — "Verano Sin Límites"                        │
  │  Estilo: Lifestyle · 5 escenas · 30s total                     │
  ├─────────────────────────────────────────────────────────────────┤
  │  1. Amanecer en la playa (5s)                                   │
  │     Laura despierta en su hamaca, estira los brazos sonriente  │
  │     Personaje: Laura · Fondo: Playa al amanecer                │
  │                                                                 │
  │  2. El descubrimiento (6s)                                      │
  │     Laura revisa su móvil y ve la notificación de descuentos   │
  │     Personaje: Laura · Fondo: Cerca del mar                    │
  │                                                                 │
  │  3. La selección (7s)                                           │
  │     Laura prueba distintos looks de ropa de playa              │
  │     Personaje: Laura · Fondo: Tienda en primer plano           │
  │                                                                 │
  │  4. La pasarela (7s)                                            │
  │     Laura camina por la orilla luciendo el outfit elegido      │
  │     Personaje: Laura · Fondo: Playa, hora dorada              │
  │                                                                 │
  │  5. El cierre (5s)                                              │
  │     Laura mira a cámara, logo y claim "Hasta -50% este verano" │
  │     Personaje: Laura · Fondo: Playa, atardecer                 │
  └─────────────────────────────────────────────────────────────────┘

  [✅ Crear todas las escenas] [📝 Revisar una por una] [🔄 Regenerar] [❌ Cancelar]
```

```
👤 Usuario: [pulsa] 📝 Revisar una por una

🤖 Kiyoko:
  Vamos escena por escena. Empezamos con la primera:

  ╔══════════════════════════════════════════════════╗
  ║  ESCENA 1 — "Amanecer en la playa" (5s)          ║
  ╠══════════════════════════════════════════════════╣
  ║  Descripción: Laura despierta en su hamaca,      ║
  ║  estira los brazos sonriente al sol de la mañana ║
  ║                                                  ║
  ║  Prompt visual:                                  ║
  ║  "Laura, young woman, waking up in beach         ║
  ║  hammock, stretching arms, golden morning light, ║
  ║  warm smile, summer lifestyle, soft bokeh"       ║
  ║                                                  ║
  ║  Personaje: Laura (protagonista)                 ║
  ║  Fondo: Playa al amanecer                        ║
  ║  Duración: 5 segundos                            ║
  ╚══════════════════════════════════════════════════╝

  [✅ Aceptar escena 1] [✏️ Modificar] [🔄 Regenerar esta escena] [⏭️ Saltar]
```

```
👤 Usuario: [pulsa] ✏️ Modificar

🤖 Kiyoko:
  ¿Qué quieres modificar de la escena 1?

  [📝 Cambiar descripción]
  [✨ Cambiar prompt visual]
  [⏱️ Cambiar duración]
  [👤 Cambiar personaje asignado]
  [🏙️ Cambiar fondo]
  [🔄 Regenerar todo con otras instrucciones]
```

```
👤 Usuario: [pulsa] ⏱️ Cambiar duración

🤖 Kiyoko:
  La duración actual es **5 segundos**.
  ¿Cuántos segundos quieres para esta escena?

  [3s] [4s] [5s ✓] [6s] [7s] [8s] [✏️ Otro]

  Nota: Si cambias la duración de esta escena,
  ajustaré las demás para mantener el total en 30s.
```

```
👤 Usuario: [pulsa] 7s

🤖 Kiyoko:
  Actualizado a 7s. Para mantener el total en 30s,
  reduciré 2s de las últimas escenas.

  ╔══════════════════════════════════════════════════╗
  ║  ESCENA 1 — "Amanecer en la playa" — 7s  ✓       ║
  ╚══════════════════════════════════════════════════╝

  [✅ Aceptar y pasar a escena 2] [✏️ Cambiar otra cosa]
```

---

### Conversación V-4: El usuario pide editar una escena existente

```
👤 Usuario: cambia la descripción de la escena 3

🤖 Kiyoko:
  La escena 3 es **"La selección"** (7s):

  *"Laura prueba distintos looks de ropa de playa mientras sonríe y juega con los colores de las prendas"*

  ¿Cómo quieres que quede?

  [✏️ Escribir nueva descripción]  [💡 Pídeme sugerencias]
```

```
👤 Usuario: que Laura esté en una tienda de ropa y pruebe 3 outfits diferentes

🤖 Kiyoko:
  He reescrito la escena 3. Esto es lo que voy a guardar:

  ╔══════════════════════════════════════════════════╗
  ║  ESCENA 3 — CAMBIO PROPUESTO                     ║
  ╠══════════════════════════════════════════════════╣
  ║  Antes: "Laura prueba distintos looks de ropa    ║
  ║  de playa mientras sonríe..."                   ║
  ║                                                  ║
  ║  Ahora: "Laura en una boutique de ropa de        ║
  ║  playa, prueba 3 outfits distintos frente al     ║
  ║  espejo: un bañador amarillo, un pareo floreado  ║
  ║  y un conjunto deportivo turquesa. Sonríe        ║
  ║  comparando los precios de oferta"               ║
  ║                                                  ║
  ║  Prompt visual actualizado:                      ║
  ║  "Laura in beach clothing boutique, trying on 3  ║
  ║  summer outfits, mirror reflection, bright       ║
  ║  colors, sale tags visible, lifestyle ad"        ║
  ╚══════════════════════════════════════════════════╝

  [💾 Guardar cambios] [✏️ Ajustar más] [❌ Descartar]
```

---

### Conversación V-5: Cambio ambiguo

```
👤 Usuario: cambia el prompt

🤖 Kiyoko:
  Este video tiene 5 escenas. ¿De cuál quieres cambiar el prompt?

  [1. Amanecer en la playa (5s)]
  [2. El descubrimiento (6s)]
  [3. La selección (7s)]
  [4. La pasarela (7s)]
  [5. El cierre (5s)]
  [🔄 Cambiar todos los prompts a la vez]
```

---

### Conversación V-6: "Cambia todo"

```
👤 Usuario: cambia todo el video, quiero que sea de estilo publicitario

🤖 Kiyoko:
  Voy a regenerar las 5 escenas de **"Verano Sin Límites"**
  cambiando el estilo de **Lifestyle** a **Publicitario clásico**.

  Esto reemplazará las descripciones y prompts de todas las escenas.
  Los personajes y fondos se mantienen.

  ¿Confirmas el cambio?

  [🔄 Sí, regenerar todas las escenas]  [❌ No, cancelar]
```

```
👤 Usuario: [pulsa] 🔄 Sí, regenerar todas las escenas

🤖 Kiyoko:
  Regenerando con estilo publicitario...

  Nuevo plan generado. Revisa los cambios:

  ┌─────────────────────────────────────────────────────┐
  │  CAMBIOS PROPUESTOS — Estilo Publicitario           │
  ├─────────────────────────────────────────────────────┤
  │  1. "El producto estrella" (5s)   ← antes amanecer  │
  │     Laura presenta la colección mirando a cámara    │
  │                                                      │
  │  2. "Las ofertas" (6s)   ← antes descubrimiento    │
  │     Texto sobreimpreso con porcentajes de descuento │
  │                                                      │
  │  3. "La experiencia" (7s)   ← antes selección      │
  │     Laura en tienda, señalando ropa con entusiasmo  │
  │  ... (2 más)                                        │
  └─────────────────────────────────────────────────────┘

  [✅ Aplicar todos los cambios] [📝 Revisar uno por uno] [❌ Cancelar]
```

---

## CONTEXTO: ESCENA (`/project/abc/video/xyz/scene/s1`)

---

### Conversación E-1: El usuario abre el chat en una escena específica

```
🤖 Kiyoko:
  Estás en la **Escena 3 — "La selección"** del video "Verano Sin Límites".

  Escena de 7s · Plano medio · Estilo lifestyle
  Personaje: Laura · Fondo: Boutique de playa

  ¿Qué necesitas?
  [✨ Mejorar prompt] [🎬 Cambiar cámara] [📝 Editar descripción] [🔊 Generar narración]
```

---

### Conversación E-2: "Mejora el prompt"

```
👤 Usuario: mejora el prompt de esta escena

🤖 Kiyoko:
  El prompt actual de la escena 3 es:

  *"Laura in beach clothing boutique, trying on 3 summer outfits, mirror reflection, bright colors, sale tags visible, lifestyle ad"*

  He generado 3 versiones mejoradas:

  ╔══════════════════════════════════════════════════╗
  ║  OPCIÓN A — Más cinemático                      ║
  ║  "Attractive young woman in colorful beach      ║
  ║  boutique, trying summer outfits, golden hour   ║
  ║  window light, joy and excitement, fashion film  ║
  ║  style, shallow depth of field, sale price tags"║
  ╠══════════════════════════════════════════════════╣
  ║  OPCIÓN B — Más comercial                       ║
  ║  "Beautiful female model shopping summer        ║
  ║  collection, boutique interior, vibrant colors, ║
  ║  three outfit changes, smiling, advertising     ║
  ║  photography, clean background"                 ║
  ╠══════════════════════════════════════════════════╣
  ║  OPCIÓN C — Más lifestyle                       ║
  ║  "Candid shot of young woman in beachwear       ║
  ║  store, natural moment trying outfits, warm     ║
  ║  light, genuine smile, lifestyle content,       ║
  ║  summery atmosphere, discount tags"             ║
  ╚══════════════════════════════════════════════════╝

  [Usar Opción A] [Usar Opción B] [Usar Opción C]
  [✏️ Combinar o editar manualmente]
```

---

## REGLAS GENERALES DE INTERACCIÓN

> Estas reglas definen el comportamiento de la IA en TODAS las situaciones.

---

### R-1: Nunca guardar sin confirmar

```
❌ MAL:
  Usuario: "crea una escena de la playa"
  IA: He creado la escena. ✅

✅ BIEN:
  Usuario: "crea una escena de la playa"
  IA: [Muestra los datos de la escena]
      [💾 Guardar escena] [✏️ Cambiar algo] [❌ Cancelar]
```

---

### R-2: Cuando algo es ambiguo, preguntar con opciones visuales

```
❌ MAL:
  Usuario: "cambia el video"
  IA: ¿A qué video te refieres? Por favor escribe el nombre.

✅ BIEN:
  Usuario: "cambia el video"
  IA: Tengo 3 videos en este proyecto. ¿Cuál?
      [📹 Video 1 · Spot principal]
      [📹 Video 2 · Versión corta]
      [📹 Video 3 · Making of]
```

---

### R-3: Siempre mostrar qué había antes y qué cambia

```
✅ BIEN:
  ╔═════════════════════════════╗
  ║ CAMBIO PROPUESTO            ║
  ╠═════════════════════════════╣
  ║ Antes: "Laura en la playa" ║
  ║ Ahora: "Laura en boutique" ║
  ╚═════════════════════════════╝
  [💾 Guardar] [❌ Cancelar]
```

---

### R-4: La opción "Cambiar algo" siempre muestra QUÉ se puede cambiar

```
✅ BIEN:
  [✏️ Cambiar algo] → despliega:
    [📝 Nombre/Título]
    [📄 Descripción]
    [✨ Prompt de IA]
    [⏱️ Duración]
    [📱 Plataforma]
    [🔄 Regenerar todo]
```

---

### R-5: Después de guardar, siempre ofrecer el siguiente paso lógico

```
✅ BIEN:
  Guardado personaje Laura ✅

  ¿Qué hacemos ahora?
  [👤 Añadir otro personaje]
  [🏙️ Añadir fondos]
  [🎬 Generar escenas]
```

---

### R-6: En el dashboard, nunca responder solo con texto sobre el contenido

```
❌ MAL:
  Usuario: "¿cuántos videos tengo?"
  IA: Tienes 6 videos en tus proyectos.

✅ BIEN:
  Usuario: "¿cuántos videos tengo?"
  IA: Tienes 6 videos en 3 proyectos:
      [WIDGET:videos con miniaturas y botones]
```

---

### R-7: Confirmar antes de operaciones destructivas

```
✅ BIEN:
  Usuario: "borra la escena 3"
  IA:
    ⚠️ Vas a eliminar la escena 3: "La selección" (7s, con personaje Laura)
    Esta acción se puede deshacer.

    [🗑️ Sí, borrar] [❌ Cancelar]
```

---

*Estas conversaciones son el diseño de referencia. Cada bloque [COMPONENTE] debe ser implementado como un componente React interactivo en ChatMessage.tsx*
