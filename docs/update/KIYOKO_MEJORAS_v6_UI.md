# 🎨 KIYOKO AI — Mejoras UI/UX v6: Análisis Visual de Pantallas

## Revisión completa de las 10 pantallas actuales + mejoras

---

## 1. STORYBOARD (Pantalla Principal)

### Estado actual
- Header con stats (28 escenas, 2m 6s, 4 personajes, 3 fondos)
- Filtros por tipo y fase, toggle Completo/Compacto
- Scene cards con imagen 16:9, descripción, metadata, prompts

### Problemas detectados
1. **Las imágenes de escena son demasiado grandes** — ocupan ~200px de alto en la card, empujan los prompts muy abajo. En un monitor normal solo cabe 1 escena completa en pantalla.
2. **Los prompts ocupan todo el ancho** — son bloques monospace enormes que hacen scroll infinito.
3. **No hay separación visual clara entre escenas** — las cards se mezclan, difícil saber dónde empieza una y acaba otra.
4. **Los badges (Nueva, Gancho, 3s, Prompt listo) están muy a la derecha** — lejos del título, cuesta asociarlos.
5. **El sidebar izquierdo ("Expandido/Compacto") se come espacio** sin aportar mucho en esta vista.
6. **No hay botón para añadir escena entre dos existentes** — falta la línea "+" de inserción.
7. **No se ve el chat IA como panel lateral** — está en otra pestaña.
8. **No hay indicador de duración total vs objetivo** en el header.
9. **La búsqueda está muy pequeña** — no invita a usarla.

### Mejoras propuestas

```
IMAGEN DE ESCENA → REDUCIR A THUMBNAIL
───────────────────────────────────────
Antes: 300x200px (enorme, domina la card)
Ahora: 120x68px (thumbnail 16:9 a la izquierda de la card)

La card pasa a ser HORIZONTAL:
┌─────────────────────────────────────────────────────────────────┐
│ ┌────────┐  #1 N1 · Cold open tijeras              [Nueva🔵]   │
│ │ 🖼️ thumb│  Apertura en frío: primer plano extremo  [Gancho🔴]  │
│ │ 120x68 │  de tijeras cortando un mechón dorado...  [3s] [✅]   │
│ │        │  👥 Sin personajes · 🏠 Sin fondo                     │
│ └────────┘  📹 extreme_close_up · static · dramatic             │
│             🔊 Silente                                           │
│                                                        [▼ Expand]│
└─────────────────────────────────────────────────────────────────┘

Click en ▼ → se expande mostrando:
- Prompt imagen (colapsado por defecto, 3 líneas + "ver más")
- Prompt vídeo (colapsado)
- Narración (si hay)
- Mejoras
- Acciones: Copiar, Mejorar IA, Editar, Generar imagen, Eliminar

Click en la thumbnail → LIGHTBOX a pantalla completa
Click en 🖼️ si no hay imagen → dropzone para subir
```

```
ACCIONES SOBRE LA IMAGEN (hover en thumbnail):
───────────────────────────────────────────────
┌────────────┐
│ 🖼️         │
│   [🔄] [📤]│  ← iconos overlay al hacer hover
│   [⬇️] [🗑️]│
└────────────┘

🔄 = Regenerar imagen con IA (usa el prompt actual)
📤 = Subir imagen nueva / sustituir
⬇️ = Descargar imagen
🗑️ = Eliminar imagen

Si no hay imagen:
┌────────────┐
│  📷        │
│  Generar   │  ← click → genera con IA o abre dropzone
│  o subir   │
└────────────┘
```

```
LÍNEA DE INSERCIÓN ENTRE ESCENAS:
──────────────────────────────────
┌─ Escena N1 ────────────────────────┐
└────────────────────────────────────┘
  ·····  [+]  ·····                    ← línea sutil, botón aparece en hover
┌─ Escena E1 ────────────────────────┐
└────────────────────────────────────┘

Click [+] → popover:
  [📋 Plano detalle (IA genera)]
  [🎬 Nueva escena en blanco]
```

```
HEADER DEL STORYBOARD MEJORADO:
────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ Storyboard · Domenech Peluquerías · Pixar · YouTube             │
│                                                                  │
│ 28 escenas │ ⏱️ 2m06s / 1m15s objetivo │ 4 person. │ 3 fondos  │
│            │ ████████████████████████░░ 167% ⚠️ EXCEDIDO        │
│                                                                  │
│ [🔍 Buscar escena...]  Tipo: [•Todas •Orig •Mej •Nue •Rell •Vid]│
│ Fase: [Todas Gancho Desarrollo Clímax Cierre]                    │
│ Vista: [≡ Completo] [☰ Compacto] [⊞ Grid]                       │
│                                                                  │
│ [📊 Analizar]  [☑️ Seleccionar]  [↕️ Reordenar]                  │
└─────────────────────────────────────────────────────────────────┘

NOTA: La barra de duración muestra WARNING rojo porque 2m06s 
excede el objetivo de 1m15s. Esto es inmediatamente visible.
```

```
CHAT IA COMO PANEL LATERAL (ya definido en v4, pero recordar):
──────────────────────────────────────────────────────────────
El chat aparece como panel derecho redimensionable en /storyboard.
Toggle con botón [💬] en la esquina superior derecha.
Por defecto cerrado, se abre al hacer click.
```

---

## 2. OVERVIEW

### Estado actual
- Hero vacío (no hay cover image), demasiado espacio en blanco arriba
- Stats en 4 cards horizontales
- Botones: Ir al Storyboard, Chat IA, Exportar
- Info del proyecto a la izquierda, Actividad reciente a la derecha
- Progreso general: 0%

### Problemas detectados
1. **Hero enorme y vacío** — 40% de la pantalla es espacio muerto gris. Si no hay cover image, no debería haber hero tan grande.
2. **El nombre del proyecto aparece 3 veces** — en el breadcrumb, en el título, y en "DOMENECH PELUQUERÍAS" sobre el título. Redundante.
3. **Progreso 0%** — debería ser más visible y explicar qué falta.
4. **Actividad reciente sin iconos descriptivos** — solo badges de colores que no dicen mucho.
5. **No se ven thumbnails de escenas** — sería útil ver las últimas escenas generadas.

### Mejoras propuestas

```
HERO COMPACTO:
──────────────
Si no hay cover image → hero compacto de 120px con gradiente de marca:

┌─────────────────────────────────────────────────────────────────┐
│ ██████████████████████████████████████████████████████████████  │
│ █  Domenech Peluquerías                              [📤 Cover]█
│ █  En progreso · Pixar · YouTube · 1m15s objetivo              █
│ ██████████████████████████████████████████████████████████████  │
└─────────────────────────────────────────────────────────────────┘

Si hay cover image → hero de 200px con imagen + overlay gradiente.
Botón [📤 Cover] para subir/cambiar.
```

```
PROGRESO DESGLOSADO:
────────────────────
En vez de solo "0%", mostrar:

┌─ PROGRESO DEL PROYECTO ──────────────────────────────────────┐
│                                                               │
│  ████████████████████░░░░░░░░░░  45% completado              │
│                                                               │
│  ✅ Personajes definidos (4/4)                                │
│  ✅ Fondos definidos (3/3)                                    │
│  ✅ Escenas con prompt de imagen (28/28)                      │
│  ✅ Escenas con prompt de vídeo (28/28)                       │
│  ⬜ Escenas con imagen generada (1/28) ← esto baja el %      │
│  ⬜ Narraciones escritas (0/28)                               │
│  ⬜ Audio generado (0/28)                                     │
│  ⬜ Escenas aprobadas (0/28)                                  │
└───────────────────────────────────────────────────────────────┘
```

```
ÚLTIMAS ESCENAS CON THUMBNAILS:
────────────────────────────────
┌─ ÚLTIMAS ESCENAS ────────────────────────────────────────────┐
│                                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │🖼️ N1 │ │🖼️ E1 │ │🖼️ E2 │ │📷 E3 │ │📷 E4A│ │📷 E4B│     │
│  │tijera│ │logo  │ │exter│ │      │ │      │ │      │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  🖼️ = con imagen     📷 = sin imagen                [Ver todas→]│
└───────────────────────────────────────────────────────────────┘
```

---

## 3. DIAGNÓSTICO

### Estado actual
- 4 métricas en cards, fortalezas/advertencias/sugerencias, botón "Marcar como resuelto"

### Problemas detectados
1. **Los issues son solo texto** — no muestran a qué escenas afectan.
2. **"Marcar como resuelto" no tiene feedback** — no se ve qué se hizo para resolver.
3. **No hay link entre issue y acción** — "Pacing Inconsistente" debería poder arreglarse con un click.

### Mejoras propuestas

```
CADA ISSUE CON ESCENAS AFECTADAS + ACCIÓN IA:
──────────────────────────────────────────────
┌─ ⚠️ Pacing Inconsistente · Pacing ──────────────────────────┐
│                                                               │
│ El ritmo de la narrativa es inconsistente, con algunas        │
│ escenas que se sienten apresuradas y otras demasiado largas.  │
│                                                               │
│ Escenas afectadas: [E3 7s⚠️] [E6 15s⚠️] [E9 10s⚠️]         │
│                                                               │
│ [🤖 Que Kiyoko lo arregle]  [✅ Marcar resuelto]  [🗑️ Ignorar]│
└───────────────────────────────────────────────────────────────┘

"Que Kiyoko lo arregle" → abre el chat con el contexto del issue
y Kiyoko propone cambios específicos.
```

---

## 4. ARCO NARRATIVO

### Estado actual
- Barra de tiempo proporcional con colores, 6 fases con escenas vinculadas. Se ve bien.

### Problemas detectados
1. **Los badges de escenas no son clickables visualmente** — parecen etiquetas estáticas.
2. **No se puede editar el arco desde aquí** — habría que ir al chat o editar manualmente.
3. **La barra de tiempo no tiene marcadores de escena** — sería útil ver dónde cae cada escena.

### Mejoras propuestas

```
BARRA DE TIEMPO CON MARCADORES:
────────────────────────────────
┌─ BARRA DE TIEMPO ────────────────────────────────────────────┐
│                                                               │
│ [Gancho][Presentación][ Servicios    ][ Especialidad   ][T][CTA]│
│ 0s  ↑  5s  ↑   15s      ↑    ↑   35s    ↑   ↑   55s ↑  65s 75s│
│     N1     E2        E6  E7       R4  E4A    N7   E5     E9   │
│     │      │         │   │        │   │      │    │      │    │
│  (marcadores individuales por escena en la barra)             │
└───────────────────────────────────────────────────────────────┘

Hover en marcador → tooltip con thumbnail + título + duración
Click en marcador → scroll a esa escena en el storyboard
```

```
BADGES CLICKABLES CON HOVER:
────────────────────────────
[EN1] → hover muestra mini-preview, click navega al storyboard
Los badges deben tener cursor:pointer y underline en hover
```

---

## 5. ESCENAS (Lista Colapsada)

### Estado actual
- Lista de escenas con badges: tipo, duración, fase, estado. Click para expandir.

### Problemas detectados
1. **Todas las escenas se ven iguales** — no hay diferencia visual entre una escena con imagen y sin imagen.
2. **No se ve la descripción en la vista colapsada** — solo título.
3. **No se puede reordenar arrastrando** — falta drag & drop.
4. **Los badges están MUY juntos a la derecha** — difícil leer.

### Mejoras propuestas

```
ESCENA COLAPSADA MEJORADA:
──────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ ≡ ┌────┐ N1  Cold open tijeras                                  │
│   │🖼️  │ Apertura en frío: primer plano de tijeras...           │
│   │tiny│ 👥 — · 🏠 — · 📹 extreme_close_up                     │
│   └────┘                    [nueva🔵] [gancho🔴] [3s] [✅ ready] │
└─────────────────────────────────────────────────────────────────┘

≡ = Handle de drag & drop (aparece en hover)
🖼️ tiny = Thumbnail 48x27 (o placeholder gris si no hay imagen)
Primera línea: Número + Título
Segunda línea: Descripción truncada (max 1 línea)
Tercera línea: Personajes · Fondo · Cámara
Badges a la derecha con espacio entre ellos
```

---

## 6. ESCENAS (Expandida con Imagen Grande)

### Estado actual
- Al expandir una escena, la imagen ocupa TODO el ancho de la pantalla. Es enorme.

### Problemas detectados
1. **La imagen es DEMASIADO grande** — ocupa toda la pantalla, no se ven los prompts sin scroll.
2. **No hay acciones sobre la imagen** — no puedo descargarla, regenerarla, o sustituirla desde aquí.
3. **No se ve el prompt debajo** — hay que hacer scroll para llegar al contenido útil.

### Mejoras propuestas

```
IMAGEN EXPANDIDA → TAMAÑO CONTROLADO:
──────────────────────────────────────
Máximo 400px de alto para la imagen expandida.
A la derecha de la imagen: metadata + acciones.

┌─ N1 · Cold open tijeras ──────────────────── [nueva] [3s] ──┐
│                                                               │
│  ┌─────────────────────────┐  📝 QUÉ PASA:                   │
│  │                         │  Apertura en frío: primer plano  │
│  │    🖼️ IMAGEN             │  extremo de tijeras cortando un │
│  │    (max 400px alto)     │  mechón dorado en cámara lenta.  │
│  │    (max 50% ancho)      │                                  │
│  │                         │  👥 Sin personajes                │
│  │  [🔄] [📤] [⬇️] [🗑️]    │  🏠 Sin fondo                    │
│  │  regen subir bajar quitar│  📹 extreme_close_up · static   │
│  └─────────────────────────┘  💡 dramatic side lighting       │
│                               🎭 mysterious                   │
│  ── PROMPT IMAGEN ─── [📋] [🤖 IA] [✏️] ──                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Pixar Studios 3D animated render, extreme close-up...   │  │
│  │ (3 líneas visibles, expandible)                    [▼]  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ── PROMPT VÍDEO ──── [📋] [🤖 IA] [✏️] ──                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ SILENT SCENE. Extreme close-up. Scissors open slowly... │  │
│  │ (3 líneas visibles, expandible)                    [▼]  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ── 🎤 NARRACIÓN ──── [📋] [🤖 IA] [🔊 Generar voz] ──       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ "El sonido del acero. Una tijera se cierra con           │  │
│  │  precisión milimétrica." (2.8s / 3s ✅)                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  [🌐 Traducir prompts]  [⏱️ Ajustar duración]  [🗑️ Eliminar] │
└───────────────────────────────────────────────────────────────┘
```

---

## 7. PERSONAJES

### Estado actual
- Grid de 3 cards con character sheets (imágenes con fondo verde), nombre, rol, descripción, prompt snippet, "aparece en" badges. Se ve profesional.

### Problemas detectados
1. **Las imágenes de personaje son ENORMES** — ocupan 70% de la card. Demasiado grandes para una vista de overview.
2. **No hay acciones sobre la imagen** — no puedo descargarla, regenerarla desde el prompt, o subir otra.
3. **El prompt snippet se corta** — no se ve completo, no hay expansión.
4. **No se puede editar inline** — hay que ir a otro sitio para cambiar datos.
5. **No hay "reglas del personaje"** — no se ve qué puede y qué no puede hacer (definido en v4).
6. **Falta el botón de regenerar character sheet** — si cambio algo del personaje, debería poder regenerar la imagen.

### Mejoras propuestas

```
CHARACTER CARD MEJORADA:
────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐│
│ │                                                          ││
│ │  🖼️ CHARACTER SHEET (max 250px alto)                      ││
│ │                                                          ││
│ │  [🔄 Regenerar] [📤 Cambiar] [⬇️ Descargar] [🗑️ Quitar]  ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│  [JO]  José · Director · El jefe         [✏️ Editar ficha]  │
│                                                             │
│  Hombre corpulento y confiado, pelo castaño rojizo          │
│  peinado hacia atrás, pecas, blazer azul acero...           │
│                                                             │
│  ── PROMPT SNIPPET ── [📋 Copy] [🌐 Traducir] ──           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ a heavyset confident man, auburn-brown swept-back   │    │
│  │ hair, freckles, wearing a blue steel blazer over... │    │
│  └─────────────────────────────────────────────── [▼ +]┘    │
│                                                             │
│  ── REGLAS ──────────────────────────────────────────────   │
│  ✅ Cortar pelo (maestro)  ✅ Asesorar prótesis             │
│  ✅ Hablar a cámara        ✅ Supervisar equipo             │
│  ❌ Lavar cabezas          ❌ Aplicar tintes                │
│  [✏️ Editar reglas]                                         │
│                                                             │
│  Aparece en: [E3] [E5] [E6] [E8] [E9] [N5] [N8]           │
│                                                             │
│  [🤖 Regenerar sheet desde foto]  ← sube foto → IA genera  │
│  [📷 Subir nueva foto de referencia]                        │
└─────────────────────────────────────────────────────────────┘
```

```
ACCIONES EN HOVER SOBRE LA IMAGEN DEL PERSONAJE:
─────────────────────────────────────────────────
Al pasar el ratón sobre el character sheet, overlay semitransparente 
con 4 botones:

🔄 Regenerar — Usa el prompt snippet + estilo del proyecto para
   generar un nuevo character sheet con IA (Gemini/DALL-E)
📤 Cambiar — Dropzone para subir nueva imagen
⬇️ Descargar — Descarga la imagen actual en resolución completa  
🗑️ Quitar — Elimina la imagen (vuelve a placeholder)
```

```
TAMAÑO DE IMAGEN:
─────────────────
Actual: ~500px de alto (demasiado grande)
Propuesto: max 250px de alto, mantener aspect ratio
En vista de GRID: max 200px
En vista de DETALLE (click en personaje): imagen full-size en lightbox
```

---

## 8. FONDOS

### Estado actual
- Grid de 3 cards con placeholder "Subir imagen de referencia", código, nombre, tipo, hora del día, prompt snippet, "usado en" badges.

### Problemas detectados
1. **Las áreas de imagen son enormes y vacías** — ~300px de alto para un placeholder. Desperdicio de espacio.
2. **No se ve que se pueda arrastrar una imagen** — el dropzone no es obvio.
3. **Falta botón de generar imagen con IA** — podría generar una imagen del fondo a partir del prompt snippet.
4. **No hay acciones sobre la imagen una vez subida**.

### Mejoras propuestas

```
FONDO CARD MEJORADA:
────────────────────
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐│
│ │                                                          ││
│ │  🖼️ IMAGEN DE REFERENCIA (max 200px alto)                 ││
│ │  o: placeholder con dropzone más pequeño (150px)         ││
│ │                                                          ││
│ │  [🔄 Generar con IA] [📤 Subir] [⬇️] [🗑️]                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│  REF-EXT · Fachada exterior del salón     [✏️ Editar]       │
│  [Exterior] [Hora dorada]                                   │
│                                                             │
│  ── PROMPT SNIPPET ── [📋 Copy] ──                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ exterior facade of Domenech hair salon, modern      │    │
│  │ glass storefront with golden DOMENECH lettering...  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Usado en: [E2] [E9] [N2]                                  │
└─────────────────────────────────────────────────────────────┘

"Generar con IA" → Usa el prompt snippet para generar una imagen
de referencia del fondo directamente en la app.
```

---

## 9. TIMELINE

### Estado actual
- Header con duración total (85s), escenas (15), versión (Completa)
- Tabs: Completa, 30s, 15s
- Lista vertical con: tiempo, título, descripción, duración, color de fase

### Problemas detectados
1. **No se pueden reordenar las escenas arrastrando** — solo lista estática.
2. **No hay thumbnails junto a cada entrada** — solo texto.
3. **La descripción es muy corta** — "Misterio. Sin música, solo sonido de tijeras." podría tener más contexto.
4. **No hay barra visual proporcional** como en el Arco Narrativo.
5. **No se puede ajustar la duración desde aquí** — hay que ir a editar la escena.

### Mejoras propuestas

```
TIMELINE CON THUMBNAILS + DRAG + BARRA:
────────────────────────────────────────

┌─ BARRA VISUAL PROPORCIONAL ──────────────────────────────────┐
│ [🔴N1][🔴E1][🟠E2][🟠E3][🟠Montaje serv.][🟢R4][🟢N6]...    │
│ 0s         8s        20s           35s    38s  43s           │
└──────────────────────────────────────────────────────────────┘

┌─ ENTRIES ────────────────────────────────────────────────────┐
│                                                               │
│ ≡ 0:00  🔴  ┌────┐  N1 · Cold open tijeras              3s  │
│    0:03     │🖼️  │  Misterio. Sin música, solo tijeras.     │
│             └────┘                          [⏱️ 3s ◀▶]       │
│                                                               │
│ ≡ 0:03  🔴  ┌────┐  E1 · Logo reveal                    5s  │
│    0:08     │🖼️  │  Entra música. Mechón dorado.            │
│             └────┘                          [⏱️ 5s ◀▶]       │
│                                                               │
│ ≡ = handle drag (reordenar arrastrando)                       │
│ 🖼️ = thumbnail 48x27 de la escena                            │
│ ⏱️ = input de duración editable inline (click → input)        │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. REFERENCIAS

### Estado actual
- Tabla cruzada: escenas × fondos/personajes con ✅ y "—"
- Tips en la última columna

### Problemas detectados
1. **Los headers de columna están en colores pero no se leen bien** — texto pequeño con colores que se confunden.
2. **Los "—" son ruido visual** — demasiadas celdas vacías.
3. **No se puede hacer nada desde aquí** — es solo informativo.
4. **Falta indicador de si hay imagen subida** para esa referencia.

### Mejoras propuestas

```
TABLA MEJORADA:
───────────────
- En vez de "—", celdas vacías (nada, limpio)
- ✅ → ✅ con tooltip "REF-EXT necesaria para generar E2"
- Añadir ícono 🖼️ si la referencia ya está subida, ⬜ si falta
- Click en ✅ → navega al fondo/personaje
- Headers con mini-thumbnail del personaje/fondo

┌─ # ─ Escena ──────── [🖼️ Ext] [🖼️ Prót] [🖼️ Estil] [👤 JO] [👤 CO] ...
│ N1   Cold open         ·        ·          ·         ·       ·
│ E2   Exterior Dolly   🖼️✅      ·          ·         ·       ·
│ E3   Equipo completo   ·        ·         ⬜✅       ⬜✅    ⬜✅

🖼️✅ = referencia necesaria Y ya subida
⬜✅ = referencia necesaria pero NO subida todavía (warning)
·    = no necesaria
```

---

## 11. REGLAS GLOBALES DE TAMAÑO DE IMÁGENES

### Tabla resumen de tamaños

| Lugar | Actual | Propuesto | Notas |
|-------|--------|-----------|-------|
| Storyboard card colapsada | — | 48x27px | Thumbnail mini |
| Storyboard card expandida | 100% ancho (~800px) | max 400px alto, 50% ancho | Imagen + metadata al lado |
| Escenas lista colapsada | — | 48x27px | Igual que storyboard |
| Escenas lista expandida | 100% ancho | max 400px alto, 50% ancho | Misma regla |
| Personaje card | ~500px alto | max 250px alto | En grid |
| Personaje detalle/lightbox | — | full-size | Click para ampliar |
| Fondo card | ~300px alto (placeholder) | max 200px alto | Placeholder más compacto |
| Timeline entry | — | 48x27px | Thumbnail mini |
| Overview últimas escenas | — | 80x45px | Thumbnails en fila |
| Chat IA (imagen adjunta) | — | 200px ancho max | Preview inline |

### Todas las imágenes deben tener estas acciones (en hover)

```
[🔄 Regenerar] — Regenera con IA usando el prompt actual
[📤 Sustituir] — Dropzone para subir otra imagen
[⬇️ Descargar] — Descarga en resolución completa
[🗑️ Eliminar]  — Quita la imagen (vuelve a placeholder)
[🔍 Ampliar]   — Lightbox a pantalla completa (click en imagen)
```

Para personajes, añadir:
```
[🤖 Regenerar sheet desde foto] — Sube una foto → IA genera 
   character sheet con vistas (frente, perfil, espalda) en el 
   estilo del proyecto
```

---

## 12. MEJORAS GLOBALES DE UI

### 12.1 Vista Grid para Escenas (nueva)

Además de Completo y Compacto, añadir vista GRID:

```
Vista Grid (3 columnas):
┌──────────┐ ┌──────────┐ ┌──────────┐
│🖼️ N1     │ │🖼️ E1     │ │🖼️ E2     │
│Cold open │ │Logo      │ │Exterior  │
│3s 🔴     │ │5s 🔴     │ │5s 🟠     │
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│🖼️ E3     │ │🖼️ E4A    │ │🖼️ E4B    │
│Equipo    │ │Pegamento │ │Colocación│
│7s 🟠     │ │8s 🟢     │ │8s 🟢     │
└──────────┘ └──────────┘ └──────────┘

Ideal para ver el storyboard como "contactos" de foto.
Click en cualquiera → expande inline o navega al detalle.
```

### 12.2 Keyboard Shortcuts

```
Ctrl+K → Búsqueda global (escenas, personajes, acciones)
Ctrl+S → Guardar cambios actuales
Ctrl+Z → Deshacer último cambio
Ctrl+C → Copiar prompt (si hay un prompt seleccionado)
Escape → Cerrar modal/panel/edición
← → → Navegar entre escenas (en vista detalle)
```

### 12.3 Indicadores de Estado más Visibles

Los badges de estado actuales (prompt_ready, draft, etc.) son poco visibles. Propuesta:

```
⬜ draft         → Borde izquierdo gris
📝 prompt_ready  → Borde izquierdo azul
⏳ generating    → Borde izquierdo ámbar + animación pulse
✅ generated     → Borde izquierdo verde
⭐ approved      → Borde izquierdo dorado + icono estrella
❌ rejected      → Borde izquierdo rojo
```

Esto hace que al scrollear la lista, puedas ver de un vistazo el estado de cada escena por el color del borde izquierdo.

### 12.4 Tooltips en Todos los Badges

Cada badge debe tener tooltip explicativo:
- [nueva🔵] → tooltip: "Escena nueva, no existía en el guión original"
- [gancho🔴] → tooltip: "Fase del arco: Gancho (primeros 5 segundos)"
- [3s] → tooltip: "Duración: 3 segundos"
- [prompt_ready] → tooltip: "Los prompts están listos. Falta generar la imagen."

---

## 13. PRIORIDAD DE IMPLEMENTACIÓN UI

| # | Mejora | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Reducir tamaño de imágenes en todas las vistas | Bajo | 🔴 Crítico |
| 2 | Acciones sobre imágenes (regenerar, descargar, sustituir, eliminar) | Medio | 🔴 Crítico |
| 3 | Scene cards horizontales con thumbnail en storyboard | Medio | 🔴 Crítico |
| 4 | Prompts colapsados (3 líneas + expandir) | Bajo | 🔴 Crítico |
| 5 | Línea de inserción [+] entre escenas | Bajo | 🔴 Crítico |
| 6 | Chat como panel lateral en storyboard | Medio | 🔴 Crítico |
| 7 | Barra duración total vs objetivo con warning | Bajo | 🟠 Alto |
| 8 | Hero compacto en overview si no hay cover | Bajo | 🟠 Alto |
| 9 | Progreso desglosado en overview | Bajo | 🟠 Alto |
| 10 | Drag & drop en timeline | Medio | 🟠 Alto |
| 11 | Thumbnails en timeline | Bajo | 🟠 Alto |
| 12 | Duración editable inline en timeline | Bajo | 🟠 Alto |
| 13 | Reglas de personaje visibles en card | Bajo | 🟠 Alto |
| 14 | Regenerar character sheet desde foto (botón en card) | Medio | 🟠 Alto |
| 15 | Vista Grid para escenas (3 columnas) | Medio | 🟡 Medio |
| 16 | Barra visual con marcadores en arco narrativo | Medio | 🟡 Medio |
| 17 | Tabla de referencias mejorada (iconos en vez de —) | Bajo | 🟡 Medio |
| 18 | Issues del diagnóstico con link a escenas + acción IA | Medio | 🟡 Medio |
| 19 | Tooltips en todos los badges | Bajo | 🟡 Medio |
| 20 | Keyboard shortcuts | Medio | 🟢 Nice-to-have |
| 21 | Bordes de estado por color en escenas | Bajo | 🟢 Nice-to-have |

---

*Kiyoko AI — Mejoras UI/UX v6 · Análisis de 10 pantallas · 17 marzo 2026*
