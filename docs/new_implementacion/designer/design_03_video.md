# Kiyoko AI — Diseño Detallado: Parte 3 — Vídeo y Escenas

---

## 1. `/project/[shortId]/video/[videoShortId]` — Overview del vídeo

### Carga de datos

```
page.tsx prefetch con HydrationBoundary:
  queryKey: ['video', videoShortId]
  queryFn: video + scenes (con scene_camera, scene_characters→characters, scene_backgrounds→backgrounds)

  queryKey: ['video-analysis', video.id]
  queryFn: video_analysis WHERE video_id AND is_current = true

  queryKey: ['narrative-arcs', video.id]
  queryFn: narrative_arcs WHERE video_id ORDER BY sort_order

Recarga:
  - Supabase Realtime: scenes (UPDATE/INSERT/DELETE) → setQueryData
  - Realtime: videos (UPDATE) → invalidate ['video', videoShortId]
  - TanStack Query: refetchOnWindowFocus tras 30s stale
  - Al cambiar de vídeo en dropdown header
```

### Header del vídeo

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Presentación Domenech — YouTube 90s          [StatusBadge] [⋯] │
│  ← h1 editable inline (click → input, blur → save)              │
│                                                                  │
│  📺 YouTube  ·  16:9  ·  90s objetivo  ·  72s actual            │
│  ← Badges: plataforma (icono+texto), aspect ratio, duración     │
│     objetivo (del campo), actual (suma de scenes.duration)       │
│     Si actual > objetivo: texto en rojo "72s / 90s ⚠️"          │
│     Si actual = objetivo: texto en verde "90s / 90s ✅"          │
│                                                                  │
│  [⋯] dropdown:                                                   │
│  ┌──────────────────────────────┐                                │
│  │ ✏️ Renombrar                 │                                │
│  │ 📋 Duplicar vídeo            │                                │
│  │ 🔄 Derivar nuevo vídeo       │  → /derive                    │
│  │ ── separador ──              │                                │
│  │ 📝 Cambiar estado ▸         │  → Sub-dropdown estados       │
│  │ 📺 Cambiar plataforma ▸    │  → Sub-dropdown plataformas   │
│  │ ── separador ──              │                                │
│  │ 🗑 Eliminar vídeo            │  → ConfirmDeleteModal         │
│  └──────────────────────────────┘                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### ArcBar (arco narrativo visual)

```
┌──────────────────────────────────────────────────────────────────┐
│ ████ HOOK 10s ████ ██████████ BUILD 22s ██████████ ███ PEAK 24s │
│ ████████████████████████████████████████████████████ CTA 8s ████ │
└──────────────────────────────────────────────────────────────────┘

- Barra horizontal de 100% ancho.
- Cada sección proporcional a su duración (10s/90s = 11.1%).
- Colores: hook=#EF4444, build=#EAB308, peak=#22C55E, close=#3B82F6.
- Hover sobre sección: tooltip con nombre, duración, nº escenas.
- Click sobre sección: filtra las escenas del grid a esa fase.
- Si no hay arcs: barra gris con texto "Sin arco narrativo. [Generar con IA]"
- Debajo: leyenda mini con dots de color + nombre de cada fase.
```

### Botones de acción

```
[+ Nueva escena]  [🤖 Crear con IA]  ·  [📊 Analizar]  [🎙 Narración]  [🔄 Derivar]  [🔗 Compartir]  [📤 Exportar]

[+ Nueva escena]: Abre modal de crear escena manual:
  ┌──────────────────────────────┐
  │ Nueva escena                 │
  │                              │
  │ Título *                     │
  │ [                      ]     │
  │                              │
  │ Posición: [Al final ▾]      │
  │   ├── Al inicio              │
  │   ├── Después de escena [▾]  │
  │   └── Al final               │
  │                              │
  │    [Cancelar] [Crear]        │
  └──────────────────────────────┘

[🤖 Crear con IA]: Abre el chat panel (o lo enfoca si ya está abierto).
  La IA envía: "¿Qué quieres ver en la nueva escena?"
  Flujo: anotación → plano → descripción → prompt → crear.
```

---

## 2. `/project/[shortId]/video/[videoShortId]/scenes` — Board de escenas

**Esta es la página principal de trabajo.** Tiene 4 vistas diferentes que el usuario elige.

### Barra de vista y filtros

```
┌──────────────────────────────────────────────────────────────────┐
│  Escenas (16)                                                    │
│                                                                  │
│  Vistas:  [▦ Storyboard]  [📋 Lista]  [📊 Tabla]  [⏱ Timeline] │
│                                                                  │
│  Filtros: [Todas las fases ▾]  [Todos los estados ▾]            │
│           [Todos los personajes ▾]                               │
│                                                                  │
│  Ordenar: [Por número ▾]                                        │
│                                                                  │
│  [+ Nueva escena]  [🤖 Crear con IA]                            │
└──────────────────────────────────────────────────────────────────┘

La vista seleccionada se guarda en useUIStore.scenesView (persistido).
```

### VISTA 1: ▦ Storyboard (default)

Tarjetas visuales tipo storyboard cinematográfico. Cada tarjeta muestra la imagen y los datos clave.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ ┌─── 1 ───────┐ │ │ ┌─── 2 ───────┐ │ │ ┌─── 3 ───────┐ │   │
│  │ │              │ │ │ │              │ │ │ │              │ │   │
│  │ │  🖼 IMAGEN   │ │ │ │  🖼 IMAGEN   │ │ │ │  🖼 IMAGEN   │ │   │
│  │ │  de la       │ │ │ │  de la       │ │ │ │  de la       │ │   │
│  │ │  escena      │ │ │ │  escena      │ │ │ │  escena      │ │   │
│  │ │  (16:9)      │ │ │ │  (16:9)      │ │ │ │  (16:9)      │ │   │
│  │ │              │ │ │ │              │ │ │ │              │ │   │
│  │ │ 🔴 hook      │ │ │ │ 🔴 hook      │ │ │ │ 🟡 build     │ │   │
│  │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │   │
│  │                   │ │                   │ │                   │   │
│  │ Cold open tijeras │ │ Logo reveal       │ │ Fachada exterior  │   │
│  │                   │ │                   │ │                   │   │
│  │ 📝 "Quiero algo   │ │ 📝 "Que el logo  │ │ 📝 "Que se vea   │   │
│  │ ASMR con tijeras" │ │ aparezca elegant" │ │ el salón premium"│   │
│  │ ← anotación client│ │                   │ │                   │   │
│  │                   │ │                   │ │                   │   │
│  │ 5s · [■]          │ │ 5s · [■]          │ │ 6s · [■]          │   │
│  │ ← duración + clips│ │                   │ │ 🏔 BG-EXT         │   │
│  │                   │ │                   │ │                   │   │
│  │ [prompt_ready 🟢] │ │ [prompt_ready 🟢] │ │ [prompt_ready 🟢] │   │
│  │              [⋯] │ │              [⋯] │ │              [⋯] │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                  │
│  ┌─────────────────┐ ┌─────────────────┐                       │
│  │ ┌─── 4 ───────┐ │ │ ┌─── 5 ───────┐ │                       │
│  │ │              │ │ │ │              │ │                       │
│  │ │  🖼 IMAGEN   │ │ │ │  🖼 IMAGEN   │ │                       │
│  │ │              │ │ │ │              │ │                       │
│  │ │ 🟡 build     │ │ │ │ 🟡 build     │ │                       │
│  │ └──────────────┘ │ │ └──────────────┘ │                       │
│  │                   │ │                   │                       │
│  │ Equipo completo   │ │ Estilismo en     │                       │
│  │                   │ │ acción            │                       │
│  │ 📝 "Que se vea   │ │ 📝 "Que fluya    │                       │
│  │ al equipo junto"  │ │ el salón activo"  │                       │
│  │                   │ │                   │                       │
│  │ 8s · [■][+1] ←ext│ │ 6s · [■]          │                       │
│  │ 👤 JO CO NE RA   │ │ 👤 JO CO RA       │                       │
│  │ 🏔 BG-MAIN       │ │ 🏔 BG-MAIN       │                       │
│  │                   │ │                   │                       │
│  │ [prompt_ready 🟢] │ │ [prompt_ready 🟢] │                       │
│  │              [⋯] │ │              [⋯] │                       │
│  └─────────────────┘ └─────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Grid: 3 columnas desktop, 2 tablet, 1 móvil.
Drag & drop: reordenar arrastrando tarjetas (actualiza sort_order + scene_number).
Click en imagen: navega a detalle de escena.
Click en avatar de personaje: tooltip con nombre, click navega a personaje.
Click en fondo: tooltip con nombre.

Elementos de cada tarjeta:
├── Nº escena (badge negro esquina sup-izq de la imagen)
├── Imagen (scene_media is_current, o gradiente gris)
├── Badge fase (esquina inf-izq de la imagen): hook/build/peak/close con color
├── Título (bold, 1 línea truncada)
├── Anotación del cliente (📝 italic, 2 líneas max, text-muted)
│   Si no hay anotación: no se muestra
├── Duración + indicador de clips:
│   [■] = 1 clip base
│   [■][+1] = base + 1 extensión
│   [■][+2] = base + 2 extensiones
├── Avatares de personajes (círculos mini con iniciales, max 4 + "+N")
├── Badge de fondo (código corto: BG-MAIN, BG-EXT)
├── StatusBadge del estado de la escena
└── [⋯] menú contextual
```

### VISTA 2: 📋 Lista (expandida con prompts visibles)

Filas expandidas que muestran más información sin entrar al detalle.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌── 1 ─────────────────────────────────────────────────────┐   │
│  │ ┌─────┐  Cold open tijeras                    5s  🟢 [⋯]│   │
│  │ │ 🖼  │  Pantalla en negro. Se escucha un sonido         │   │
│  │ │     │  amplificado de tijeras...                       │   │
│  │ │     │                                                   │   │
│  │ └─────┘  📝 Anotación: "Algo ASMR con tijeras"           │   │
│  │          💬 Diálogo: (sin diálogo)                        │   │
│  │          📷 Cámara: extreme_close_up · static             │   │
│  │          🖼 Clips: [■ base 6s] — pending                  │   │
│  │          Prompt img: "Pixar Studios 3D animated render,   │   │
│  │          extreme close-up of professional chrome..."      │   │
│  │          [▸ Ver prompt vídeo]                              │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── 2 ─────────────────────────────────────────────────────┐   │
│  │ ┌─────┐  Logo reveal DOMENECH                 5s  🟢 [⋯]│   │
│  │ │ 🖼  │  El mechón dorado se transforma en partículas    │   │
│  │ │     │  doradas formando DOMENECH...                     │   │
│  │ └─────┘                                                   │   │
│  │          📝 "Que el logo aparezca elegante y premium"     │   │
│  │          📷 Cámara: medium · dolly_in                     │   │
│  │          🖼 Clips: [■ base 6s] — pending                  │   │
│  │          Prompt img: "Pixar Studios 3D animated render,   │   │
│  │          golden particles magically reorganizing..."      │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── 4 ─────────────────────────────────────────────────────┐   │
│  │ ┌─────┐  Equipo completo                      8s  🟢 [⋯]│   │
│  │ │ 🖼  │  Los cuatro miembros del equipo de pie juntos... │   │
│  │ │     │                                                   │   │
│  │ └─────┘  📝 "Que se vea al equipo profesional"            │   │
│  │          👤 José · Conchi · Nerea · Raúl                  │   │
│  │          🏔 Sala principal de estilismo                   │   │
│  │          📷 Cámara: medium · pan_left                     │   │
│  │          🖼 Clips: [■ base 6s][■ ext1 6s] — pending      │   │
│  │          ⚠️ Extensión: "Necesita 8s para revelar a los 4" │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Cada fila es expandible/colapsable (click en el header de la fila).
Por defecto: 3 primeras expandidas, resto colapsadas.
[▸ Ver prompt vídeo]: expande el prompt de vídeo (normalmente oculto).
Los prompts se muestran en font-mono, bg-surface-input, text-xs.
```

### VISTA 3: 📊 Tabla (datos compactos, rápido de escanear)

```
┌──────┬────────────────────┬──────┬───────┬────────────┬──────────┬────────┬──────┐
│  #   │ Título              │ Dur. │ Fase  │ Personajes │ Fondo    │ Clips  │Estado│
├──────┼────────────────────┼──────┼───────┼────────────┼──────────┼────────┼──────┤
│  1   │ Cold open tijeras   │  5s  │ 🔴hook│            │          │ [■]    │  🟢  │
│  2   │ Logo reveal         │  5s  │ 🔴hook│            │          │ [■]    │  🟢  │
│  3   │ Fachada exterior    │  6s  │ 🟡bld │            │ BG-EXT   │ [■]    │  🟢  │
│  4   │ Equipo completo     │  8s  │ 🟡bld │ JO CO NE RA│ BG-MAIN │ [■]+1  │  🟢  │
│  5   │ Estilismo acción    │  6s  │ 🟡bld │ JO CO RA   │ BG-MAIN │ [■]    │  🟢  │
│  6   │ Raúl degradado      │  6s  │ 🟡bld │ RA         │ BG-MAIN │ [■]    │  🟢  │
│  7   │ Conchi coloración   │  5s  │ 🟡bld │ CO         │ BG-MAIN │ [■]    │  🟢  │
│  8   │ Nerea consulta      │  5s  │ 🟡bld │ NE         │ BG-PROT │ [■]    │  🟢  │
│  9   │ Rótulo prótesis     │  3s  │ 🟢peak│            │          │ [■]    │  ⬜  │
│ 10   │ Adhesivo close-up   │  8s  │ 🟢peak│ NE         │ BG-PROT │ [■]+1  │  🟢  │
│ 11   │ Colocación prótesis │  8s  │ 🟢peak│ NE         │ BG-PROT │ [■]+1  │  🟢  │
│ 12   │ Reveal              │  5s  │ 🟢peak│ NE         │ BG-PROT │ [■]    │  🟢  │
│ 13   │ Celebración equipo  │  7s  │ 🟢peak│ JO CO NE RA│ BG-MAIN │ [■]+1  │  🟢  │
│ 14   │ Montaje final       │  5s  │ 🔵clo │ JO         │ BG-MAIN │ [■]    │  🟢  │
│ 15   │ Tagline             │  3s  │ 🔵clo │            │          │ [■]    │  ⬜  │
│ 16   │ CTA exterior        │  5s  │ 🔵clo │            │ BG-EXT  │ [■]    │  🟢  │
├──────┼────────────────────┼──────┼───────┼────────────┼──────────┼────────┼──────┤
│ TOTAL│                     │ 90s  │       │            │          │ 20clips│      │
└──────┴────────────────────┴──────┴───────┴────────────┴──────────┴────────┴──────┘

- Tabla ordenable por cualquier columna (click en header).
- Hover sobre fila: bg-surface-hover.
- Click en fila: navega al detalle de escena.
- Click en personaje: tooltip con nombre completo.
- Columna "Clips": [■] = base, +N = extensiones. Hover muestra duración total.
- Fila TOTAL al final: suma de duraciones y total de clips.
- Columnas redimensionables arrastrando el borde.
- Checkbox a la izquierda para selección múltiple:
  Al seleccionar varias → barra de acciones bulk aparece arriba:
  [Aprobar seleccionadas] [Cambiar estado ▾] [Eliminar seleccionadas]
```

### VISTA 4: ⏱ Timeline (visual horizontal)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  0s        15s         30s         45s         60s       75s 90s │
│  │          │           │           │           │         │   │  │
│  ├──────────┼───────────┼───────────┼───────────┼─────────┼───┤  │
│                                                                  │
│  ████ HOOK ████                                                  │
│  ┌───┐┌───┐                                                     │
│  │ 1 ││ 2 │                                                     │
│  │5s ││5s │                                                     │
│  └───┘└───┘                                                     │
│                                                                  │
│  ████████████████████ BUILD ████████████████████                 │
│  ┌────┐┌──────┐┌────┐┌────┐┌───┐┌───┐                          │
│  │ 3  ││  4   ││ 5  ││ 6  ││ 7 ││ 8 │                          │
│  │ 6s ││ 8s   ││ 6s ││ 6s ││5s ││5s │                          │
│  │    ││[■]+1 ││    ││    ││   ││   │                          │
│  └────┘└──────┘└────┘└────┘└───┘└───┘                          │
│                                                                  │
│  ████████████████████████████ PEAK ████████████                 │
│  ┌─┐┌──────┐┌──────┐┌───┐┌─────┐                               │
│  │9││ 10   ││ 11   ││12 ││ 13  │                               │
│  │3││ 8s   ││ 8s   ││5s ││ 7s  │                               │
│  │ ││[■]+1 ││[■]+1 ││   ││[■]+1│                               │
│  └─┘└──────┘└──────┘└───┘└─────┘                               │
│                                                                  │
│  ██████████ CLOSE █████████                                     │
│  ┌───┐┌─┐┌───┐                                                 │
│  │14 ││15││16 │                                                 │
│  │5s ││3s││5s │                                                 │
│  └───┘└─┘└───┘                                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

- Scroll horizontal si el vídeo es largo.
- Cada bloque es proporcional a la duración real.
- Color del bloque = color de la fase (hook, build, peak, close).
- Bloques con extensiones muestran [■]+N debajo.
- Hover sobre bloque: tooltip con título + duración + personajes.
- Click en bloque: navega a detalle de la escena.
- Arriba: regla de tiempo con marcas cada 15 segundos.
- Drag de bloques: reordenar escenas (actualiza sort_order + tiempos).
- Zoom: scroll + ctrl para zoom in/out del timeline.
```

### Menú [⋯] de cada escena (común a todas las vistas)

```
┌──────────────────────────┐
│ 👁 Ver detalle           │  → /scene/[sceneShortId]
│ ✏️ Editar inline         │  → Abre editor en modal/sheet
│ ── separador ──          │
│ 📷 Regenerar imagen      │  → Nuevo prompt + genera
│ 🎬 Regenerar clips       │  → Regenera clips de vídeo
│ 🤖 Mejorar con IA       │  → IA mejora descripción + prompt
│ ── separador ──          │
│ 📋 Duplicar escena       │
│ ➕ Insertar escena antes  │  → Crea escena con sort_order - 1
│ ➕ Insertar escena después│
│ ── separador ──          │
│ 📝 Cambiar estado ▸     │  → draft, prompt_ready, generating,
│                          │    generated, approved, rejected
│ 🔀 Cambiar fase ▸       │  → hook, build, peak, close
│ ── separador ──          │
│ 🗑 Eliminar escena       │  → ConfirmDeleteModal
└──────────────────────────┘

ConfirmDeleteModal para escena:
  "Esta acción eliminará la escena, sus prompts, media y clips.
   Escribe el título de la escena para confirmar."
  Input: "Cold open tijeras"
  [Cancelar] [Eliminar] ← rojo, habilitado solo si texto coincide
```

---

## 3. Detalle de escena — `/project/.../video/.../scene/[sceneShortId]`

### Layout en 2 paneles

```
┌──────────────────────────────┬─────────────────────────────────┐
│  PANEL IZQUIERDO (60%)       │  PANEL DERECHO (40%)            │
│  Info + Media                │  Técnico + Prompts              │
│                              │                                 │
│  ┌── INFO ───────────────┐  │  ┌── CÁMARA ─────────────────┐ │
│  │                        │  │  │                             │ │
│  │  Título (editable)     │  │  │  Ángulo: [extreme_close ▾] │ │
│  │  [Cold open tijeras ]  │  │  │  Movim.: [static ▾]        │ │
│  │                        │  │  │  Notas:  [Cámara fija... ] │ │
│  │  Descripción (editable)│  │  │  Luz:    [Dramatic side  ] │ │
│  │  [Pantalla en negro. ] │  │  │  Mood:   [Dramatic, ASMR ] │ │
│  │  [Se escucha un soni] │  │  │                             │ │
│  │  [do amplificado de ] │  │  │  IA reasoning:              │ │
│  │  [tijeras...         ] │  │  │  "Plano extremo estático    │ │
│  │                        │  │  │   para maximizar ASMR..."   │ │
│  │  ── Anotación ──      │  │  │  ← text-xs text-muted italic│ │
│  │  [🏷 client]          │  │  └─────────────────────────────┘ │
│  │  "Quiero que el vídeo │  │                                 │
│  │   empiece con algo    │  │  ┌── PROMPTS ─────────────────┐ │
│  │   ASMR, hipnótico."  │  │  │                             │ │
│  │                        │  │  │  Tabs: [Imagen] [Vídeo]    │ │
│  │  ── Diálogo ──        │  │  │                             │ │
│  │  [Sin diálogo en esta │  │  │  ═══ Prompt de imagen ═══  │ │
│  │   escena]             │  │  │  ┌───────────────────────┐ │ │
│  │  ← textarea. Si vacío │  │  │  │ Pixar Studios 3D      │ │ │
│  │    muestra placeholder │  │  │  │ animated render,      │ │ │
│  │                        │  │  │  │ extreme close-up of   │ │ │
│  │  ── Notas director ── │  │  │  │ professional chrome... │ │ │
│  │  [ASMR visual puro. ] │  │  │  └───────────────────────┘ │ │
│  │  [El sonido de las  ] │  │  │  ← font-mono, editable     │ │
│  │  [tijeras debe ser  ] │  │  │  [✏ Editar] [🤖 Mejorar]  │ │
│  │  [satisfactorio...  ] │  │  │  [📋 Copiar]               │ │
│  │                        │  │  │                             │ │
│  └────────────────────────┘  │  │  ═══ Prompt de vídeo ═══  │ │
│                              │  │  (mismo formato)            │ │
│  ┌── MEDIA ──────────────┐  │  │                             │ │
│  │                        │  │  │  ═══ Extensiones ═══       │ │
│  │  Imagen generada       │  │  │  [ext 1]                   │ │
│  │  ┌────────────────────┐│  │  │  ┌───────────────────────┐│ │
│  │  │                    ││  │  │  │ Continuing from last  ││ │
│  │  │   🖼 PREVIEW       ││  │  │  │ frame, gloved hands   ││ │
│  │  │   (click = zoom)   ││  │  │  │ smoothing prosthetic  ││ │
│  │  │                    ││  │  │  │ edges with precision  ││ │
│  │  │                    ││  │  │  │ tweezers...           ││ │
│  │  └────────────────────┘│  │  │  └───────────────────────┘│ │
│  │  [◀ v1]    v1 de 2    │  │  │  ← Solo visible si la     │ │
│  │       [v2 ▶]          │  │  │    escena tiene extensiones│ │
│  │                        │  │  │                             │ │
│  │  [🔄 Regenerar imagen] │  │  └─────────────────────────────┘ │
│  │                        │  │                                 │
│  └────────────────────────┘  │  ┌── PERSONAJES ─────────────┐ │
│                              │  │                             │ │
│  ┌── CLIPS DE VÍDEO ────┐  │  │  👤 Nerea — protagonista    │ │
│  │                        │  │  │     Esp. prótesis capilares │ │
│  │  ┌───────────────────┐│  │  │     [✏ Cambiar rol] [🗑]   │ │
│  │  │ ▶ PLAYER          ││  │  │                             │ │
│  │  │                   ││  │  │  [+ Añadir personaje]       │ │
│  │  │ ━━━━━●━━━━━━ 4/12s││  │  │  ← Dropdown: personajes   │ │
│  │  │                   ││  │  │    del proyecto no asignados│ │
│  │  └───────────────────┘│  │  │                             │ │
│  │                        │  │  └─────────────────────────────┘ │
│  │  Clips:               │  │                                 │
│  │  ┌──────────┐┌───────┐│  │  ┌── FONDOS ──────────────────┐ │
│  │  │ ■ Base   ││■ Ext1 ││  │  │                             │ │
│  │  │ 6s ●     ││ 6s    ││  │  │  🏔 Sala prótesis — ✓      │ │
│  │  │ pending  ││pending││  │  │     Ángulo: detail table    │ │
│  │  └──────────┘└───────┘│  │  │     [✏ Cambiar] [🗑]       │ │
│  │  ← Click en bloque    │  │  │                             │ │
│  │    para ver solo ese   │  │  │  [+ Añadir fondo]           │ │
│  │    clip en el player.  │  │  │                             │ │
│  │  ← ● indica cuál se   │  │  └─────────────────────────────┘ │
│  │    está reproduciendo. │  │                                 │
│  │                        │  │  ┌── HISTORIAL PROMPTS ───────┐ │
│  │  Total: 12s            │  │  │                             │ │
│  │  [▶ Reproducir todo]   │  │  │  ▸ v2 img — hace 1h (IA)  │ │
│  │  [🔄 Regenerar clips]  │  │  │  ▸ v1 img — hace 3h (man) │ │
│  │                        │  │  │  ▸ v1 vid — hace 3h (IA)  │ │
│  └────────────────────────┘  │  │  ← Click expande el prompt│ │
│                              │  │    completo de esa versión.│ │
│                              │  │    Botón [Restaurar] para  │ │
│                              │  │    usar ese prompt de nuevo│ │
│                              │  └─────────────────────────────┘ │
│                              │                                 │
└──────────────────────────────┴─────────────────────────────────┘
```

### Player de clips — detalle del comportamiento

```
┌────────────────────────────────────────────────┐
│  ▶ ━━━━━━━━━●━━━━━━━━━━━━━━━━━━━  4s / 12s    │
│                                                │
│  Clips: [■ Base 6s ●] [■ Ext1 6s]             │
│         ↑ reproduciendo                        │
└────────────────────────────────────────────────┘

- [▶ Reproducir todo]: reproduce todos los clips en secuencia.
  Base (6s) → pausa imperceptible → Ext1 (6s) = 12s total.
  La barra de progreso es continua (no se reinicia entre clips).
  El indicador ● se mueve del bloque Base al bloque Ext1 cuando cambia.

- Click en bloque individual: reproduce solo ese clip.
  La barra de progreso muestra solo la duración de ese clip.

- Si el clip está en status "pending": muestra placeholder gris con
  texto "Pendiente de generación" + botón [🎬 Generar].

- Si el clip está en status "generating": muestra spinner con
  barra de progreso indeterminada + texto "Generando..." pulsante.

- Si el clip está en status "error": muestra icono ❌ con
  error_message debajo + botón [🔄 Reintentar].

- Si el clip está en status "ready": muestra thumbnail + player.
```

### Edición inline de campos

```
Todos los campos de texto son editables:
  1. Click en el campo → se convierte en input/textarea con borde kiyoko-teal
  2. El usuario edita
  3. Blur (click fuera) → guarda con useMutation (optimistic)
  4. Si falla: rollback + toast "Error al guardar"
  5. Si éxito: toast discreto "Guardado" (desaparece en 2s)

Campos con debounce (guardan mientras escribes):
  - Descripción (debounce 1500ms)
  - Diálogo (debounce 1500ms)
  - Notas del director (debounce 1500ms)

Campos que guardan al blur:
  - Título
  - Anotación del cliente

Campos que guardan al cambiar (select):
  - Camera angle, movement
  - Status, arc_phase

Los prompts se guardan con botón explícito [💾 Guardar prompt]
porque un cambio accidental puede ser destructivo.
```

---

## 4. Exportar — `/project/.../video/.../export`

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Exportar vídeo                                                  │
│                                                                  │
│  Formato:                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 📄 PDF     │ │ 🌐 HTML    │ │ 📋 Markdown│ │ 📦 JSON    │   │
│  │ Storyboard │ │ Interactivo│ │ Texto plano│ │ Datos crudos│   │
│  │    ✓       │ │            │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  Opciones:                                                       │
│  ☑ Incluir imágenes de escenas                                  │
│  ☑ Incluir prompts                                               │
│  ☑ Incluir datos de cámara                                      │
│  ☐ Incluir narración                                             │
│  ☐ Incluir análisis IA                                           │
│                                                                  │
│                              [📥 Exportar]                       │
│                                                                  │
│  Exportaciones anteriores                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📄 PDF — v1 — 20 mar 2025 — 2.3 MB         [📥 Descar]│    │
│  │ 🌐 HTML — v1 — 19 mar 2025 — 1.1 MB        [📥 Descar]│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Tiempo real — Indicadores visuales

### Cuando otro usuario edita una escena

```
┌─────────────────┐
│ ┌─── 4 ───────┐ │
│ │ 🖼           │ │
│ │              │ │
│ │         👤ML │ │  ← Avatar mini de María López en la esquina
│ │ Editando...  │ │     aparece cuando ella tiene la escena abierta
│ └──────────────┘ │
│                   │
│ Equipo completo   │
│ Editado por María │  ← Texto temporal (3s) cuando se detecta UPDATE
│ hace 5 seg        │
│                   │
└─────────────────┘

Si María actualiza la escena mientras tú la ves en el board:
  1. Supabase Realtime envía el UPDATE
  2. queryClient.setQueryData actualiza la escena en caché
  3. La tarjeta se re-renderiza con los nuevos datos
  4. Un borde pulsante kiyoko-teal aparece 2 segundos
  5. Toast: "María actualizó Escena 4"
```

### En el detalle de escena

```
Si estás en el detalle de una escena y otro usuario la edita:
  - Los campos que cambiaron muestran un highlight amarillo breve (500ms)
  - Un banner aparece arriba: "María ha actualizado esta escena. [Ver cambios]"
  - [Ver cambios] hace scroll al campo modificado
  - Si tú también estás editando ese campo: se muestra un conflicto
    "María cambió este campo. ¿Mantener tu versión o aceptar la de María?"
    [Mantener mía] [Aceptar de María]
```
