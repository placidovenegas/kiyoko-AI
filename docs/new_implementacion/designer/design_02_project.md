# Kiyoko AI — Diseño Detallado: Parte 2 — Dentro del Proyecto

---

## 1. `/project/[shortId]` — Vista general del proyecto

### Carga de datos

```
page.tsx (Server Component) prefetch:
  queryKey: ['projects', shortId]
  queryFn: SELECT * FROM projects WHERE short_id = $1

  queryKey: ['videos', 'project', project.id]
  queryFn: SELECT * FROM videos WHERE project_id = $1 ORDER BY sort_order

  queryKey: ['characters', 'project', project.id]
  queryFn: SELECT id, name, initials, color_accent FROM characters WHERE project_id = $1

  queryKey: ['backgrounds', 'project', project.id]
  queryFn: SELECT id, name, code FROM backgrounds WHERE project_id = $1

¿Cuándo se recarga?
  - Al navegar desde /dashboard
  - Al cambiar proyecto en el header switcher
  - TanStack Query refetchOnWindowFocus tras 30s de stale
  - Supabase Realtime para videos (INSERT/UPDATE/DELETE)
```

### Layout de la página

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──── PORTADA ──────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Imagen de portada (h-48, rounded-xl, object-cover)       │  │
│  │  Si no hay: gradiente de color_palette                    │  │
│  │                                            [📷 Cambiar]  │  │
│  │  ← Botón aparece en hover sobre la portada               │  │
│  │    Click → file picker, sube a Storage, actualiza project │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──── INFO PRINCIPAL ────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Domenech Peluquerías                [⚙️ Ajustes]         │  │
│  │  ← h2, font-semibold, text-lg        ← Botón ghost        │  │
│  │                                                            │  │
│  │  Cliente: Domenech Peluquerías       [StatusBadge]         │  │
│  │  ← text-sm text-muted                ← in_progress        │  │
│  │                                                            │  │
│  │  Estilo: Pixar 3D  ·  [peluquería] [pixar] [prótesis]    │  │
│  │  ← Badge del estilo   ← Tags como badges outline          │  │
│  │                                                            │  │
│  │  Descripción:                                              │  │
│  │  Vídeo promocional estilo Pixar 3D para Domenech...       │  │
│  │  ← text-sm text-muted, max 3 líneas, [ver más] si trunca │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──── STATS ────────────────────────────────────────────────┐  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │ 🎬 2   │ │ 🎞 16  │ │ 👤 4   │ │ 🏔 3   │ │ ⏱ 8h  │ │  │
│  │  │ Vídeos │ │Escenas │ │Personj.│ │ Fondos │ │Trabajad│ │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │  │
│  │  ← Cada stat es clickeable:                              │  │
│  │     Vídeos → /project/[id]/videos                        │  │
│  │     Escenas → primer vídeo /scenes                       │  │
│  │     Personajes → /project/[id]/resources/characters      │  │
│  │     Fondos → /project/[id]/resources/backgrounds         │  │
│  │     Trabajado → /project/[id]/tasks/time                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──── VÍDEOS DEL PROYECTO ──────────────────────────────────┐  │
│  │                                                            │  │
│  │  Vídeos (2)                          [+ Nuevo vídeo]      │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ 📺  Presentación Domenech — YouTube 90s    [⋯]     │  │  │
│  │  │     ▓▓▓▓▓▓▓░░░ 65% · 16 escenas · prompting       │  │  │
│  │  │     YouTube 16:9 · 90s objetivo · 72s actual        │  │  │
│  │  │     Actualizado hace 2h                              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ 📱  Reel TikTok 30s (derivado)              [⋯]     │  │  │
│  │  │     ░░░░░░░░░░  0% · 0 escenas · draft             │  │  │
│  │  │     TikTok 9:16 · 30s objetivo                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [⋯] de cada vídeo → Dropdown:                                  │
│  ┌────────────────────────┐                                      │
│  │ ▶ Abrir vídeo          │                                      │
│  │ ── separador ──        │                                      │
│  │ ✏️ Renombrar           │  → Input inline                     │
│  │ 📋 Duplicar            │  → Crea copia                       │
│  │ ── separador ──        │                                      │
│  │ 📝 Cambiar estado ▸   │  → Sub-dropdown con todos los status │
│  │    │ draft             │                                      │
│  │    │ scripting ✓       │  ← check en el actual               │
│  │    │ prompting         │                                      │
│  │    │ generating        │                                      │
│  │    │ review            │                                      │
│  │    │ completed         │                                      │
│  │    │ published         │                                      │
│  │ ── separador ──        │                                      │
│  │ 🗑 Eliminar            │  → ConfirmDeleteModal (escribir nombre)│
│  └────────────────────────┘                                      │
│                                                                  │
│  ┌──── RECURSOS RÁPIDOS ─────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Personajes                    [Ver todos →]              │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │  │
│  │  │ 🔵   │ │ 🟣   │ │ 🟡   │ │ 🟢   │                    │  │
│  │  │ JO   │ │ CO   │ │ NE   │ │ RA   │                    │  │
│  │  │ José │ │Conchi│ │Nerea │ │ Raúl │                    │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                    │  │
│  │  ← Círculos con iniciales en color_accent.              │  │
│  │    Click → /project/[id]/resources/characters/[charId]  │  │
│  │    [Ver todos →] → /project/[id]/resources/characters   │  │
│  │                                                          │  │
│  │  Fondos                            [Ver todos →]        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │  │
│  │  │ 🖼 Fachada  │ │ 🖼 Sala pró │ │ 🖼 Sala ppal │      │  │
│  │  │   exterior  │ │   tesis     │ │  estilismo   │      │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │  │
│  │  ← Miniatura + nombre. Click → detalle del fondo.      │  │
│  │                                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──── ACTIVIDAD RECIENTE ───────────────────────────────────┐  │
│  │  • 🤖 IA analizó el vídeo: puntuación 82/100 — 1h       │  │
│  │  • 👤 Creadas 3 escenas de prótesis — 2h                 │  │
│  │  • 👤 Personaje Raúl actualizado — 3h                    │  │
│  │  [Ver toda la actividad →]                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. `/project/[shortId]/videos` — Lista de vídeos

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Vídeos (2)                 [Filtrar ▾]        [+ Nuevo vídeo]  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ┌──────────┐                                              │  │
│  │ │ 🖼       │  Presentación Domenech — YouTube 90s  [⋯]   │  │
│  │ │thumbnail │  📺 YouTube · 16:9 · 90s objetivo            │  │
│  │ │          │  ▓▓▓▓▓▓▓░░░ 65%                              │  │
│  │ │          │  16 escenas · 4 personajes                    │  │
│  │ └──────────┘  [prompting]  Actualizado hace 2h            │  │
│  │               ← StatusBadge coloreado                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ┌──────────┐                                              │  │
│  │ │ 🖼       │  Reel TikTok 30s                      [⋯]   │  │
│  │ │(sin img) │  📱 TikTok · 9:16 · 30s objetivo             │  │
│  │ │          │  ░░░░░░░░░░  0%                               │  │
│  │ └──────────┘  0 escenas  ·  Derivado de: Presentación     │  │
│  │               [draft]  Creado hace 1 día                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Filtrar ▾]:                                                    │
│  ├── Todos                                                       │
│  ├── Por plataforma ▸  YouTube, TikTok, Instagram, etc.         │
│  └── Por estado ▸      draft, scripting, generating, etc.        │
│                                                                  │
│  Click en la fila del vídeo → navega a                           │
│    /project/[shortId]/video/[videoShortId]                       │
│                                                                  │
│  Si no hay vídeos: EmptyState "Crea tu primer vídeo"            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. `/project/[shortId]/resources` — Vista combinada

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Recursos del proyecto                                           │
│                                                                  │
│  [👤 Personajes (4)] [🏔 Fondos (3)] [🎨 Estilos (1)] [📝 Templates (0)]│
│  ← Tabs horizontales. El número entre paréntesis. Tab activo    │
│     con borde inferior kiyoko-teal.                              │
│                                                                  │
│  ═══ Tab: Personajes ═══════════════════════════════════════     │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │   │
│  │ │  🔵    │ │ │ │  🟣    │ │ │ │  🟡    │ │ │ │  🟢    │ │   │
│  │ │  JO    │ │ │ │  CO    │ │ │ │  NE    │ │ │ │  RA    │ │   │
│  │ │ avatar │ │ │ │ avatar │ │ │ │ avatar │ │ │ │ avatar │ │   │
│  │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │   │
│  │            │ │            │ │            │ │            │   │
│  │ José      │ │ Conchi     │ │ Nerea      │ │ Raúl       │   │
│  │ Director  │ │ Estilista  │ │ Esp.prót.  │ │ Barbero    │   │
│  │           │ │            │ │            │ │            │   │
│  │ 7 escenas │ │ 6 escenas  │ │ 7 escenas  │ │ 5 escenas  │   │
│  │ 3 imgs    │ │ 2 imgs     │ │ 1 img      │ │ 2 imgs     │   │
│  │     [⋯]  │ │     [⋯]   │ │     [⋯]   │ │     [⋯]   │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│                                            [+ Nuevo personaje]  │
│                                                                  │
│  [⋯] por personaje:                                              │
│  ┌──────────────────────┐                                        │
│  │ 👁 Ver detalle       │  → /resources/characters/[id]         │
│  │ ✏️ Editar            │  → Abre sheet lateral de edición       │
│  │ 📋 Duplicar          │                                        │
│  │ ── separador ──      │                                        │
│  │ 🗑 Eliminar          │  → ConfirmDeleteModal                  │
│  └──────────────────────┘                                        │
│                                                                  │
│  ═══ Tab: Fondos ═══════════════════════════════════════════     │
│  (mismo layout pero con tarjetas de fondo: thumbnail landscape)  │
│                                                                  │
│  ═══ Tab: Estilos ══════════════════════════════════════════     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🎨 Pixar Domenech Cálido              [✓ Default] [⋯]  │   │
│  │    Pixar 3D · Iluminación ámbar                          │   │
│  │    Prefix: "Pixar Studios 3D animated render,"           │   │
│  │    Suffix: "warm amber lighting, cinematic, 4K"          │   │
│  │    Negative: "text, watermark, blurry..."                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  [+ Nuevo estilo]                                                │
│                                                                  │
│  ═══ Tab: Templates ═══════════════════════════════════════      │
│  EmptyState: "No tienes templates de prompts todavía.           │
│   Los templates te permiten reutilizar prompts con variables."  │
│  [+ Crear template]                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. `/project/[shortId]/resources/characters/[charId]` — Detalle personaje

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Personajes]  José — Director · El jefe              [⋯]    │
│                                                                  │
│  ┌────── GALERÍA DE IMÁGENES ──────┐ ┌──── INFORMACIÓN ───────┐ │
│  │                                  │ │                         │ │
│  │  Imagen principal:               │ │  Nombre *               │ │
│  │  ┌────────────────────────────┐  │ │  [José            ]     │ │
│  │  │                            │  │ │                         │ │
│  │  │    🖼 Imagen de referencia │  │ │  Rol                    │ │
│  │  │    (o avatar si no hay)    │  │ │  [Director · El jefe]   │ │
│  │  │                            │  │ │                         │ │
│  │  │    Click → zoom fullscreen │  │ │  Personalidad           │ │
│  │  │                            │  │ │  [Confiado, cálido,  ]  │ │
│  │  └────────────────────────────┘  │ │  [líder natural       ] │ │
│  │                                  │ │                         │ │
│  │  Ángulos disponibles:            │ │  Color acento           │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐    │ │  [🔵 #3B82F6   ]       │ │
│  │  │ 🖼   │ │ 🖼   │ │ ➕   │    │ │  ← ColorPicker          │ │
│  │  │avatar│ │front │ │ Add  │    │ │                         │ │
│  │  │  ✓  │ │      │ │      │    │ │  ─── Apariencia ───     │ │
│  │  └──────┘ └──────┘ └──────┘    │ │                         │ │
│  │                                  │ │  Desc. visual           │ │
│  │  ← Tipos con ✓ = ya tiene       │ │  [Hombre corpulento y] │ │
│  │    imagen subida. Click en       │ │  [confiado, pelo cast] │ │
│  │    cualquiera para ver en        │ │  [año rojizo...      ] │ │
│  │    grande arriba.                │ │                         │ │
│  │                                  │ │  Pelo                   │ │
│  │  ┌──────────────────────────┐   │ │  [Castaño rojizo pein] │ │
│  │  │ [📷 Subir imagen]       │   │ │  [ado hacia atrás    ] │ │
│  │  │ [🤖 Generar con IA]     │   │ │                         │ │
│  │  │                          │   │ │  Ropa                   │ │
│  │  │ Tipo: [avatar ▾]        │   │ │  [Blazer azul acero  ] │ │
│  │  │ ← dropdown: avatar,     │   │ │  [sobre camisa negra ] │ │
│  │  │   front, side_left,     │   │ │                         │ │
│  │  │   side_right, back,     │   │ │  Accesorios             │ │
│  │  │   three_quarter,        │   │ │  [collar de plata] [×]  │ │
│  │  │   full_body, detail     │   │ │  [pulseras] [×]         │ │
│  │  └──────────────────────────┘   │ │  [+ Añadir]             │ │
│  │                                  │ │                         │ │
│  └──────────────────────────────────┘ │  Herramientas           │ │
│                                       │  [tijeras profesionales]│ │
│                                       │  [+ Añadir]             │ │
│                                       │                         │ │
│  ┌──── IA — ANÁLISIS DE IMAGEN ─────────────────────────────┐  │
│  │                                                            │  │
│  │  Estado: Analizada ✅  Modelo: gpt-4o  Fecha: 20 mar      │  │
│  │                                          [🔄 Re-analizar] │  │
│  │                                                            │  │
│  │  Análisis estructurado:                                    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Edad:       42-50                                    │  │  │
│  │  │ Cuerpo:     corpulento                               │  │  │
│  │  │ Rostro:     pecas, mandíbula ancha, ojos marrones    │  │  │
│  │  │ Pelo:       castaño rojizo, peinado hacia atrás      │  │  │
│  │  │ Ropa:       blazer azul acero, camisa negra          │  │  │
│  │  │ Accesorios: collar de plata, pulseras                │  │  │
│  │  │ Expresión:  confiada, sonrisa cálida                 │  │  │
│  │  │ Pose:       postura de líder                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ← Viene de ai_visual_analysis (jsonb). Read-only.       │  │
│  │                                                            │  │
│  │  Descripción para prompts (EDITABLE):                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Heavyset confident middle-aged man with auburn-     │  │  │
│  │  │ brown swept-back hair and freckles across nose and  │  │  │
│  │  │ cheeks. Wearing a tailored blue steel blazer over   │  │  │
│  │  │ a fitted black shirt with a silver chain necklace.  │  │  │
│  │  │ Broad shoulders, warm genuine smile...              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ← ai_prompt_description. El usuario puede editar.       │  │
│  │    Esto se inyecta en cada prompt donde aparezca José.    │  │
│  │    Si el usuario lo edita, se usa el editado, no el IA.   │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──── REGLAS PARA LA IA ────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ✅ Siempre:                                               │  │
│  │  [Siempre con blazer azul                           ] [×]│  │
│  │  [Siempre en posición central con el equipo         ] [×]│  │
│  │  [+ Añadir regla]                                         │  │
│  │                                                            │  │
│  │  ❌ Nunca:                                                 │  │
│  │  [Nunca con expresión seria o enfadada              ] [×]│  │
│  │  [Nunca sin el collar de plata                      ] [×]│  │
│  │  [+ Añadir regla]                                         │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──── APARECE EN ESCENAS ───────────────────────────────────┐  │
│  │                                                            │  │
│  │  7 escenas en 1 vídeo:                                    │  │
│  │                                                            │  │
│  │  Presentación Domenech — YouTube 90s:                     │  │
│  │  [4·Equipo] [5·Estilismo] [6·Barbería] [8·Montaje]      │  │
│  │  [13·Celebración] [14·Montaje final] [16·CTA]            │  │
│  │  ← Badges clickeables que navegan a la escena.            │  │
│  │    Cada badge muestra: número + título truncado.          │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                                            [💾 Guardar cambios] │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Guardado: Cada campo se guarda con onBlur (optimistic update) O con
el botón [💾 Guardar cambios] que hace batch update. Preferible:
guardar individual por campo con debounce de 1s.
```

---

## 5. `/project/[shortId]/publications` — Publicaciones

### Sub-navegación con tabs

```
[📅 Calendario]  [▦ Grid]  [📋 Lista]     [Gestionar perfiles]  [+ Nueva]
```

### Vista Grid

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Publicaciones (3)    [📅] [▦] [📋]  [📷 Instagram ▾] [+ Nueva]│
│                                                                  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────────┐ │       │
│  │ │ 🖼 Preview │ │ │ │ 🖼 Preview │ │ │ │ 🖼 Preview │ │       │
│  │ │ ANTES|DESP │ │ │ │  ¿Se nota │ │ │ │  VUELVE A  │ │       │
│  │ │            │ │ │ │  una próte?│ │ │ │  BRILLAR   │ │       │
│  │ └────────────┘ │ │ └────────────┘ │ │ └────────────┘ │       │
│  │                │ │                │ │                │       │
│  │ Transformación │ │ Mitos y        │ │ VUELVE A       │       │
│  │ capilar        │ │ verdades       │ │ BRILLAR        │       │
│  │                │ │                │ │                │       │
│  │ 📷 IG · image  │ │ 📷 IG ·carousel│ │ 🎵 TT · video  │       │
│  │ 25 mar · 🟡    │ │ sin fecha · 🔵 │ │ sin fecha · 🔵 │       │
│  │         [⋯]   │ │         [⋯]   │ │         [⋯]   │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
│                                                                  │
│  🟢 = publicada  🟡 = programada  🔵 = borrador  🔴 = fallida    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

[⋯] por publicación:
┌──────────────────────┐
│ 👁 Ver/Editar         │  → /publications/[pubShortId]
│ 📋 Duplicar           │
│ ── separador ──       │
│ 📅 Programar          │  → Abre date picker
│ 🔄 Cambiar estado ▸  │  → draft, ready, scheduled
│ ── separador ──       │
│ 🗑 Eliminar           │  → ConfirmDeleteModal
└──────────────────────┘
```

### Crear publicación — `/project/[shortId]/publications/new`

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Nueva publicación                                               │
│                                                                  │
│  Perfil *                                                        │
│  [📷 @domenech.peluquerias (Instagram) ▾]                       │
│                                                                  │
│  Tipo de publicación *                                           │
│  [🖼 Imagen] [🎠 Carrusel] [🎬 Vídeo] [📱 Reel] [⏳ Story]      │
│  ← Botones toggle con icono. El activo con borde kiyoko-teal.  │
│                                                                  │
│  ═══ Contenido ═══                                               │
│                                                                  │
│  Items (1/10)                              [+ Añadir item]      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Item 1 — Imagen                                [🗑]    │    │
│  │                                                          │    │
│  │  ┌───────────────┐                                       │    │
│  │  │               │  Fuente:                               │    │
│  │  │  (preview o   │  ○ Subir imagen                        │    │
│  │  │   placeholder)│  ○ Generar con prompt                  │    │
│  │  │               │  ○ Usar escena del proyecto             │    │
│  │  └───────────────┘                                       │    │
│  │                                                          │    │
│  │  Si "Generar con prompt":                                │    │
│  │  Prompt:                                                 │    │
│  │  [Split-screen before and after hair prosthetic...]      │    │
│  │  [🤖 Sugerir prompt con IA]                               │    │
│  │                                                          │    │
│  │  Descripción (español):                                  │    │
│  │  [Imagen split-screen antes/después de transforma...]    │    │
│  │                                                          │    │
│  │  Si "Usar escena del proyecto":                          │    │
│  │  Vídeo: [Presentación Domenech ▾]                        │    │
│  │  Escena: [10 — Aplicación adhesivo ▾]                    │    │
│  │  ← Usa la scene_media is_current de esa escena.         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ═══ Texto de la publicación ═══                                │
│                                                                  │
│  Caption *                                                       │
│  [No cambias de pelo, cambias de vida. ✨              ]        │
│  [                                                      ]        │
│  [📞 Pide tu consulta gratuita.                        ]        │
│  [                                                      ]        │
│  [#prótesiscapilar #transformación #domenech           ]        │
│  ← Textarea con counter de caracteres (Instagram max 2200)      │
│  [🤖 Sugerir caption con IA]                                     │
│                                                                  │
│  Hashtags                                                        │
│  [prótesiscapilar] [transformación] [domenech] [+ Añadir]       │
│  ← Input con badges. Enter o coma añade tag. Click × elimina.  │
│  [🤖 Sugerir hashtags]                                           │
│                                                                  │
│  ═══ Programación ═══                                            │
│                                                                  │
│  ○ Guardar como borrador                                        │
│  ● Programar publicación                                        │
│    Fecha: [25/03/2025]  Hora: [10:00]                           │
│                                                                  │
│                    [Cancelar]  [💾 Guardar publicación]          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. `/project/[shortId]/tasks` — Tareas (Kanban detallado)

### 3 vistas con tabs

```
[▦ Kanban]  [📋 Lista]  [📅 Calendario]  ·  [⏱ Tiempo →]  ·  [+ Nueva tarea]
```

### Vista Kanban

```
┌──── PENDIENTE (5) ──┐ ┌── EN PROGRESO (2) ──┐ ┌── EN REVISIÓN (1) ─┐ ┌── COMPLETADA (8) ──┐
│                      │ │                      │ │                     │ │                     │
│ ┌──────────────────┐ │ │ ┌──────────────────┐ │ │ ┌─────────────────┐ │ │ ┌─────────────────┐ │
│ │ Generar prompts  │ │ │ │ Mejorar escena 3 │ │ │ │ Revisar narrac. │ │ │ │ ✓ Crear person. │ │
│ │ escenas 5-8      │ │ │ │                  │ │ │ │                 │ │ │ │                 │ │
│ │                  │ │ │ │ 🟡 medium        │ │ │ │ 🟢 low          │ │ │ │                 │ │
│ │ 🔴 high          │ │ │ │ ✏ prompt         │ │ │ │ 🎙 voiceover    │ │ │ │ Hace 2 días     │ │
│ │ 📸 image_gen     │ │ │ │ 👤 DK            │ │ │ │ 👤 DK           │ │ │ │                 │ │
│ │ 👤 DK            │ │ │ │                  │ │ │ │                 │ │ │ └─────────────────┘ │
│ │ 📅 25 mar        │ │ │ └──────────────────┘ │ │ └─────────────────┘ │ │                     │
│ │ ⏱ ~2h estimado   │ │ │                      │ │                     │ │                     │
│ └──────────────────┘ │ │                      │ │                     │ │                     │
│                      │ │                      │ │                     │ │                     │
│ ┌──────────────────┐ │ │                      │ │                     │ │                     │
│ │ Generar clips    │ │ │                      │ │                     │ │                     │
│ │ vídeo escena 10  │ │ │                      │ │                     │ │                     │
│ │                  │ │ │                      │ │                     │ │                     │
│ │ 🟡 medium        │ │ │                      │ │                     │ │                     │
│ │ 🎬 video_gen     │ │ │                      │ │                     │ │                     │
│ └──────────────────┘ │ │                      │ │                     │ │                     │
│                      │ │                      │ │                     │ │                     │
└──────────────────────┘ └──────────────────────┘ └─────────────────────┘ └─────────────────────┘

Drag & drop:
  - Arrastrar tarjeta entre columnas → cambia status (optimistic update)
  - Arrastrar dentro de columna → cambia sort_order
  - Feedback visual: sombra + borde kiyoko-teal en la zona de drop
  - Columna destino se ilumina al hovear

Click en tarjeta → abre Sheet lateral derecho con detalle completo:
```

### Sheet de detalle de tarea

```
┌─────────────────────────────────────┐
│ Generar prompts escenas 5-8    [✕] │
│                                     │
│ Estado: [Pendiente ▾]              │
│ ← Dropdown: pending, in_progress,  │
│   in_review, completed, blocked    │
│                                     │
│ Prioridad: [🔴 Alta ▾]             │
│                                     │
│ Categoría: [📸 image_gen ▾]        │
│                                     │
│ Asignado a: [👤 DK ▾]              │
│ ← Dropdown con miembros del proyecto│
│                                     │
│ Vídeo: [Presentación Domenech ▾]   │
│ Escena: [ninguna ▾]                │
│                                     │
│ ── Fechas ──                        │
│ Fecha límite: [25/03/2025]         │
│ Programada: [24/03/2025]           │
│                                     │
│ ── Tiempo ──                        │
│ Estimado: [120] minutos            │
│ Real: 45 min (de time_entries)     │
│ [▶ Iniciar timer]                  │
│                                     │
│ ── Descripción ──                   │
│ [Generar prompts de imagen para ]   │
│ [las escenas 5, 6, 7 y 8 del   ]   │
│ [vídeo principal...              ]   │
│                                     │
│ ── Dependencias ──                  │
│ Depende de:                        │
│ [Crear personajes ✓]               │
│ [+ Añadir dependencia]             │
│                                     │
│ ── Actividad ──                     │
│ • Creada por DK — hace 2h         │
│ • Asignada a DK — hace 2h         │
│                                     │
│         [🗑 Eliminar tarea]          │
└─────────────────────────────────────┘
```

---

## 7. `/project/[shortId]/settings/ai` — Config de IA

### Desplegable de tipo de director

```
Al seleccionar un tipo, se genera automáticamente un system prompt:

Pixar 3D → "Eres Kiyoko, una directora de animación 3D estilo Pixar Studios.
            Tu especialidad es crear escenas con iluminación cálida, personajes
            expresivos con proporciones Pixar (cabezas grandes, ojos expresivos)..."

Realista → "Eres Kiyoko, una directora de fotografía cinematográfica.
            Tu especialidad es crear escenas con iluminación natural, composición
            de regla de tercios, profundidad de campo cinematográfica..."

Anime → "Eres Kiyoko, una directora de animación japonesa estilo Studio Ghibli.
         Tu especialidad es crear escenas con colores vibrantes, expresiones
         exageradas, fondos detallados con acuarela digital..."

Comedia → "Eres Kiyoko, una directora de comedia visual.
           Tu especialidad es crear escenas con timing cómico, expresiones
           exageradas, situaciones humorísticas, ángulos dinámicos..."

Publicitario → "Eres Kiyoko, una directora creativa de publicidad audiovisual.
                Tu especialidad es crear anuncios con CTAs claros, ritmo rápido,
                branding consistente, call-to-action en los últimos 5 segundos..."

El prompt se genera y se pone en el textarea editable.
El usuario puede modificarlo libremente.
Se guarda en project_ai_agents.system_prompt.
```

### Slider de creatividad

```
Creatividad: [━━━━━━━━━━━●━━] 0.8

0.0 ────────────── 0.5 ────────────── 1.0
Conservador         Equilibrado         Creativo

← Mapea a temperature en la API.
  0.0-0.3: Sigue instrucciones literalmente, poco variación
  0.4-0.6: Equilibrio entre creatividad y consistencia
  0.7-0.9: Creativo, sugiere ideas inesperadas
  1.0: Máxima creatividad, puede ser impredecible

Tooltip al hover sobre el slider muestra el valor y descripción.
```

---

## 8. `/project/[shortId]/settings/sharing` — Colaboradores

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Colaboradores                                                   │
│                                                                  │
│  Miembros (2)                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 👤 Desarrollador Kiyoko     dev@kiyoko.ai    Owner      │    │
│  │    ← No se puede cambiar el rol del owner               │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 👤 María López              maria@email.com   [Editor ▾]│    │
│  │    Aceptó: 15 mar 2025                    [🗑 Quitar]   │    │
│  │    ← Dropdown rol: admin, editor, viewer                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Invitaciones pendientes (1)                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✉️ juan@email.com            Viewer    Enviada hace 2 días│    │
│  │                              [🔄 Reenviar] [🗑 Cancelar]│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Invitar colaborador                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Email: [                              ]                  │    │
│  │ Rol: [Editor ▾]   admin | editor | viewer               │    │
│  │                                         [📧 Invitar]    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Link de invitación                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ https://kiyoko.ai/invite/xK4mQ9bRzTp2                  │    │
│  │ Rol: [Viewer ▾]  Expira: [7 días ▾]                    │    │
│  │ [📋 Copiar link] [🔄 Regenerar]                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
