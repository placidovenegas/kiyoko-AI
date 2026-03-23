# Kiyoko AI — Diseño Completo de la App

> Documento definitivo de UX/UI. Describe CADA pantalla, CADA interacción, CADA botón.
> Para desarrolladores y diseñadores: con esto se puede construir toda la app sin preguntar nada.

---

## Convenciones de diseño global

### Tema

```
Dark mode (por defecto):
  Fondo principal:     #0A0A0B (casi negro)
  Fondo tarjetas:      #111113
  Fondo hover:         #1A1A1D
  Fondo sidebar:       #0E0E10
  Fondo inputs:        #151517
  Bordes:              #1E1E22
  Texto principal:     #FAFAFA
  Texto secundario:    #71717A (zinc-500)
  Texto tenue:         #3F3F46 (zinc-700)

Light mode:
  Fondo principal:     #FFFFFF
  Fondo tarjetas:      #F9FAFB
  Texto principal:     #111827

Marca:
  Teal (primario):     #0EA5A0
  Green (gradiente):   #34D399
  Coral (acento):      #F97316
  Gradiente logo:      linear-gradient(135deg, #0EA5A0, #34D399)
```

### Tipografía

```
Font:          Inter (variable)
Tamaño base:   14px
Headings:      text-lg (16px) semibold
Sub-headings:  text-sm (13px) medium
Body:          text-sm (13px) normal
Caption:       text-xs (11px) text-muted
Mono (prompts): JetBrains Mono, 12px
```

### Componentes recurrentes

```
StatusBadge:     Pill con color según estado. Ej: "draft" = zinc, "generating" = yellow pulsante, "approved" = green.
ScoreGauge:      Círculo con número /100. Color: <50 rojo, 50-75 amarillo, >75 verde.
ArcBar:          Barra horizontal dividida en secciones coloreadas (hook=rojo, build=amarillo, peak=verde, close=azul).
Avatar stack:    Círculos superpuestos con iniciales de personajes. Max 4 visibles + "+N".
PresenceDot:     Punto verde junto al avatar de usuarios online.
EmptyState:      Ilustración + texto + botón CTA centrado. Siempre con acción clara.
Skeleton:        Rectángulos animados pulse en zinc-800/zinc-200 según tema.
Toast:           Abajo-derecha. Éxito=verde, error=rojo, info=teal. Desaparece en 4s.
ConfirmDialog:   Modal centrado con título + descripción + Cancelar (ghost) + Confirmar (destructivo si borrar).
```

---

## Layout principal (DashboardShell)

Se aplica a TODAS las páginas autenticadas.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────────────┐ ┌──────────────┐ │
│ │           │ │  HEADER                                  │ │              │ │
│ │           │ │  [←] [Org ▾] / [Proyecto ▾] / [Video ▾] │ │              │ │
│ │  SIDEBAR  │ │              [Feedback] [🔍] [🏠] [⚙️]   │ │   CHAT IA    │ │
│ │           │ │              [🔔] [💬] [Avatar ▾]        │ │   PANEL      │ │
│ │  240px    │ ├──────────────────────────────────────────┤ │              │ │
│ │  (colaps. │ │                                          │ │  300-600px   │ │
│ │   64px)   │ │            CONTENIDO                     │ │  resizable   │ │
│ │           │ │            {children}                    │ │              │ │
│ │           │ │                                          │ │  Arrastra    │ │
│ │           │ │            Scroll vertical               │ │  el borde    │ │
│ │           │ │                                          │ │  izquierdo   │ │
│ │           │ │                                          │ │              │ │
│ └──────────┘ └──────────────────────────────────────────┘ └──────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Header (fijo arriba, 56px alto)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [←]  [🏢 Org ▾] / [📁 Proyecto ▾] / [🎬 Video ▾]     [Feedback] [🔍 Search... ⌘K] [🏠] [⚙️] [🔔 3] [💬] [DK ▾] │
└──────────────────────────────────────────────────────────────────────────┘

[←] Botón volver: navega al nivel superior.
    En video → va al proyecto. En proyecto → va al dashboard.

[🏢 Org ▾] Dropdown de organizaciones:
    - Lista de organizaciones del usuario
    - "Organizacion personal" siempre primero
    - Al cambiar: recarga proyectos, resetea proyecto/video activos, navega a /dashboard
    - Muestra icono + nombre truncado a 20 chars

[📁 Proyecto ▾] Dropdown de proyectos (solo visible si estás en /project/*):
    - Lista de proyectos de la org seleccionada
    - Muestra: thumbnail miniatura (20x20) + título truncado
    - Al cambiar: navega a /project/[nuevoShortId], recarga todo

[🎬 Video ▾] Dropdown de vídeos (solo visible si estás en /project/*/video/*):
    - Lista de vídeos del proyecto actual
    - Muestra: icono plataforma + título truncado + StatusBadge
    - Al cambiar: navega a /project/.../video/[nuevoVideoShortId]

[Feedback] Botón texto "Feedback" → abre FeedbackDialog modal:
    - Paso 1: "¿Es un problema o una idea?" → 2 botones
    - Paso 2: Textarea de mensaje + botón Enviar
    - Guarda en tabla feedback con user_id, tipo, mensaje, URL actual

[🔍 Search... ⌘K] CommandMenu:
    - Al pulsar se abre un input de búsqueda centrado (tipo Spotlight)
    - Busca en: proyectos, vídeos, escenas, personajes, fondos
    - Resultados agrupados por tipo con iconos
    - Enter → navega al resultado
    - Esc → cierra

[🏠] Navega a /dashboard

[⚙️] Navega a /settings

[🔔 3] NotificationBell:
    - Número = notificaciones no leídas
    - Click abre dropdown con últimas 10 notificaciones
    - Cada notificación: icono + texto + tiempo relativo ("hace 5 min")
    - Click en notificación → navega al link
    - "Marcar todas como leídas" al final

[💬] Toggle chat panel:
    - Si cerrado → abre panel derecho (300px default)
    - Si abierto → cierra panel
    - Mantiene el ancho que el usuario eligió (persiste en localStorage)

[DK ▾] UserMenu dropdown:
    - Avatar con iniciales + nombre
    - Items: "Mi perfil" → /settings, "API Keys" → /settings/api-keys,
      "Suscripción" → /settings/subscription, separador, "Cerrar sesión"
    - ThemeToggle integrado: icono sol/luna que alterna
```

### Sidebar

El sidebar cambia según dónde estés:

#### DashboardSidebar (cuando estás en /dashboard, /new, /settings, /admin)

```
┌─────────────────────┐
│ 🌿 Kiyoko AI         │ ← Logo + nombre (click → /dashboard)
│    Proyecto           │ ← Subtítulo según contexto
│                       │
│ ◻ Dashboard           │ /dashboard
│ 📂 Compartidos        │ /dashboard/shared
│ 📅 Publicaciones      │ /dashboard/publications
│                       │
│ ── Proyectos ──       │
│ 🔍 Buscar...          │ ← Input de filtro rápido
│ ■ Domenech Pelq...    │ ← Proyectos recientes (max 8)
│ ■ Otro proyecto       │    Click → /project/[shortId]
│ ■ ...                 │    Hover: muestra título completo
│ + Nuevo proyecto      │ /new
│                       │
│ ── Admin ──           │ ← Solo si role=admin
│ 📊 Dashboard admin    │ /admin
│ 👥 Usuarios           │ /admin/users
│                       │
│ ── ── ── ──           │
│ ⚙️ Ajustes            │ /settings
│ 🏢 Organizaciones     │ /organizations
│                       │
│ ┌───────────────┐     │
│ │ 🔴 DK          │     │ ← Avatar + nombre + email
│ │ dev@kiyoko.ai │     │    Click → UserMenu
│ └───────────────┘     │
└─────────────────────┘
```

#### ProjectSidebar (cuando estás en /project/[shortId]/*)

```
┌─────────────────────┐
│ 🌿 Kiyoko AI         │
│    Proyecto           │
│                       │
│ ◻ Vista general       │ /project/[shortId]
│ 🎬 Vídeos             │ /project/[shortId]/videos
│ 🎨 Recursos           │ /project/[shortId]/resources
│    ├ Personajes       │ /project/[shortId]/resources/characters
│    ├ Fondos           │ /project/[shortId]/resources/backgrounds
│    ├ Estilos          │ /project/[shortId]/resources/styles
│    └ Templates        │ /project/[shortId]/resources/templates
│ 📱 Publicaciones      │ /project/[shortId]/publications
│ ✅ Tareas             │ /project/[shortId]/tasks
│ 📋 Actividad          │ /project/[shortId]/activity
│                       │
│ ── ── ── ──           │
│ ⚙️ Ajustes            │ /project/[shortId]/settings
│    ├ General          │ /project/[shortId]/settings
│    ├ IA y Agente      │ /project/[shortId]/settings/ai
│    └ Colaboradores    │ /project/[shortId]/settings/sharing
│                       │
│ 💬 Chat IA            │ Abre chat panel o /chat
│                       │
│ ┌───────────────┐     │
│ │ 🔴 DK          │     │
│ └───────────────┘     │
└─────────────────────┘
```

#### VideoSidebar (cuando estás en /project/[shortId]/video/[videoShortId]/*)

```
┌─────────────────────┐
│ 🌿 Kiyoko AI         │
│    Proyecto           │
│                       │
│ Vídeo                 │
│ [🎬 Presentación ▾]  │ ← Dropdown para cambiar de vídeo
│                       │
│ ◻ Overview            │ /project/.../video/[vid]
│ ▦ Escenas             │ /project/.../video/[vid]/scenes
│ ⏱ Timeline            │ /project/.../video/[vid]/timeline
│ 🎙 Narración          │ /project/.../video/[vid]/narration
│ 📊 Análisis           │ /project/.../video/[vid]/analysis
│ 🔗 Compartir          │ /project/.../video/[vid]/share
│ 📤 Exportar           │ /project/.../video/[vid]/export
│                       │
│ ── ── ── ──           │
│ 💬 Chat IA            │
│                       │
│ ┌───────────────┐     │
│ │ 🔴 DK          │     │
│ └───────────────┘     │
└─────────────────────┘
```

### Chat Panel (lado derecho)

```
┌──────────────────────┐
│ Kiyoko AI    [↗] [✕] │ ← [↗] expand fullscreen, [✕] cerrar
│──────────────────────│
│                       │
│ 🤖 ¿En qué te puedo  │
│    ayudar con el      │
│    vídeo Presentac..? │
│                       │
│         Tú: Quiero    │
│         cambiar la    │
│         escena 3      │
│                       │
│ 🤖 Entendido. Voy a   │
│    modificar la       │
│    escena 3...        │
│    [↩ Deshacer]       │
│                       │
│──────────────────────│
│ Sugerencias rápidas:  │
│ [Analizar vídeo]      │
│ [Generar prompts]     │
│ [Revisar escenas]     │
│──────────────────────│
│ [📎] Escribe un msg.. │ ← Input con botón adjuntar
│                [➤]   │ ← Enviar
└──────────────────────┘

Ancho: 300px min, 600px max.
Resize: arrastrando el borde izquierdo del panel.
El ancho se guarda en localStorage (useUIStore.chatPanelWidth).

[↗] Expand: el chat reemplaza el contenido principal.
    Muestra sidebar de historial de conversaciones a la izquierda.
    El sidebar del proyecto desaparece.
    [↙] para volver al panel lateral.

[↩ Deshacer]: aparece bajo cada acción que la IA ejecuta.
    Al pulsar, restaura el entity_snapshot de esa acción.
    Confirmación: "¿Deshacer los cambios de esta acción?"
```

---

## Páginas

---

### `/dashboard`

**Acceso:** Tras login. Click en 🏠. Cambiar de organización.

**Layout:** DashboardSidebar a la izquierda.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Buenos días, Desarrollador 👋                              │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 📁 12    │ │ ✅ 5     │ │ ⏱ 2.5h   │ │ 🤖 847   │      │
│  │ Proyectos│ │ Tareas   │ │ Hoy      │ │ Tokens   │      │
│  │          │ │ pendientes│ │ trabajado│ │ este mes │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  Proyectos          [Todos ▾] [Buscar...] [Recientes ▾]   │
│                                              [+ Nuevo ▸]   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 🖼          │ │ 🖼          │ │ 🖼          │          │
│  │ Domenech    │ │ Proyecto B  │ │ Proyecto C  │          │
│  │ Peluquerías │ │ Cliente X   │ │ Cliente Y   │          │
│  │             │ │             │ │             │          │
│  │ ▓▓▓▓░░ 65% │ │ ▓▓░░░░ 30% │ │ ░░░░░░  0% │          │
│  │ 📺YouTube   │ │ 📱TikTok    │ │ 📷Instagram │          │
│  │ in_progress │ │ draft       │ │ draft       │          │
│  │ ⭐          │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  Actividad reciente                                        │
│  • María editó Escena 3 en Domenech — hace 5 min          │
│  • IA generó análisis del vídeo Presentación — hace 1h    │
│  • Tú creaste 3 escenas nuevas — hace 2h                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**ProjectCard detalle:**
- Imagen de portada o gradiente según color_palette del proyecto
- Título (bold, truncado a 2 líneas)
- Nombre del cliente (text-muted, debajo del título)
- Barra de progreso (completion_percentage calculado)
- Badge de plataforma principal (icono + nombre)
- StatusBadge (draft/in_progress/review/completed)
- Estrella de favorito (esquina superior derecha, toggle con optimistic update)
- Hover: border cambia a kiyoko-teal, sombra sutil
- Click: navega a `/project/[shortId]`

**Filtros:**
- Dropdown "Todos": todos / en progreso / completados / archivados / favoritos
- Input búsqueda: filtra por título y client_name en tiempo real (debounce 300ms)
- Dropdown "Recientes": recientes / nombre A-Z / nombre Z-A / progreso ↑ / progreso ↓

**Si no hay proyectos:** EmptyState con ilustración y botón "Crear tu primer proyecto"

---

### `/project/[shortId]` — Vista general del proyecto

**Acceso:** Click en ProjectCard del dashboard.

**Layout:** ProjectSidebar.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🖼 PORTADA DEL PROYECTO (imagen o gradiente)       │   │
│  │  h-48, object-cover, rounded-lg                     │   │
│  │                                        [📷 Cambiar] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Domenech Peluquerías                    [⚙️ Ajustes]      │
│  Cliente: Domenech Peluquerías                              │
│  Estilo: Pixar 3D | YouTube | 90s objetivo                 │
│  Tags: [peluquería] [pixar] [prótesis capilar]             │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ 🎬 2   │ │ 🎞 16  │ │ 👤 4   │ │ 🏔 3   │              │
│  │ Vídeos │ │Escenas │ │Person. │ │ Fondos │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                             │
│  Vídeos del proyecto            [+ Nuevo vídeo]            │
│  ┌───────────────────────────────────────────────┐         │
│  │ 🎬 Presentación Domenech — YouTube 90s        │         │
│  │    ▓▓▓▓▓▓▓░░░ 65%  |  16 escenas  |  prompting│        │
│  │    📺 YouTube 16:9  |  90s objetivo             │        │
│  └───────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────┐         │
│  │ 🎬 Reel TikTok — 30s (derivado)               │         │
│  │    ░░░░░░░░░░  0%  |  0 escenas  |  draft     │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Recursos rápidos                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ 🔵JO │ │ 🟣CO │ │ 🟡NE │ │ 🟢RA │                      │
│  │ José │ │Conchi│ │Nerea │ │ Raúl │                      │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
│  [Ver todos los recursos →]                                │
│                                                             │
│  Actividad reciente                                        │
│  • IA analizó el vídeo: puntuación 82/100 — hace 1h       │
│  • Creadas 3 escenas de prótesis — hace 2h                 │
│  • Personaje Raúl actualizado — hace 3h                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Botón "+ Nuevo vídeo"** → Abre VideoCreateModal:

```
┌──────────────────────────────────────┐
│  Crear nuevo vídeo          [✕]      │
│                                      │
│  [Manual] [🤖 Con IA]                │ ← Toggle
│                                      │
│  Título *                            │
│  [Presentación equipo         ]      │
│                                      │
│  Plataforma                          │
│  [📺 YouTube] [📱 TikTok] [📷 IG]   │ ← Selección visual
│  [📺 TV] [🌐 Web]                    │
│                                      │
│  Duración objetivo (segundos)        │
│  [90           ]                     │
│                                      │
│  Aspect ratio                        │
│  [16:9 ■━━] [9:16 ━■] [1:1 ■] [4:5]│ ← Previews visuales
│                                      │
│  Tipo de vídeo                       │
│  [Corto ▾]  short | long | reel |   │
│              commercial | trailer    │
│                                      │
│          [Cancelar] [Crear vídeo]    │
└──────────────────────────────────────┘
```

**Si elige "Con IA":** El formulario se reemplaza por un chat:
```
│  🤖 ¿Qué tipo de vídeo quieres       │
│     crear? Cuéntame sobre el          │
│     contenido, tono y audiencia.      │
│                                       │
│  [Escribe aquí...]            [➤]    │
```

---

### `/project/[shortId]/video/[videoShortId]` — Vista del vídeo (Overview/Storyboard)

**Acceso:** Click en vídeo desde proyecto. Selector de vídeo en header.

**Layout:** VideoSidebar.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Presentación Domenech — YouTube 90s     [StatusBadge]     │
│  📺 YouTube | 16:9 | 90s objetivo | 72s actual             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ████ HOOK ████ ████████ BUILD ████████ ███ PEAK ████│   │
│  │ 10s            24s                     26s          │   │
│  │ ████████████████████████████████████████████████ CTA │   │
│  └─────────────────────────────────────────────────────┘   │
│  ← ArcBar: barra coloreada proporcional a duración.        │
│     Hover sobre sección: tooltip con nombre + duración.     │
│     Click: filtra escenas de esa fase.                      │
│                                                             │
│  Escenas (16)    [Grid ▾] [+ Nueva escena] [🤖 IA]        │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │🖼      │ │🖼      │ │🖼      │ │🖼      │              │
│  │ 1      │ │ 2      │ │ 3      │ │ 4      │              │
│  │Cold    │ │Logo    │ │Exterior│ │Equipo  │              │
│  │open    │ │reveal  │ │dolly-in│ │completo│              │
│  │        │ │        │ │        │ │        │              │
│  │5s 🟢   │ │5s 🟢   │ │6s 🟢   │ │8s 🟡   │              │
│  │        │ │        │ │🏔      │ │👤JO CO │              │
│  │        │ │        │ │        │ │  NE RA │              │
│  │[■]     │ │[■]     │ │[■]     │ │[■][+]  │ ← clips     │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                             │
│  ... (más filas de 4 escenas)                              │
│                                                             │
│  Acciones rápidas                                          │
│  [📊 Analizar vídeo] [🎙 Narración] [🔄 Derivar]          │
│  [🔗 Compartir] [📤 Exportar]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**SceneCard detalle:**

```
┌────────────────┐
│ 🖼 thumbnail    │ ← scene_media is_current, o gradiente gris si no hay
│                 │
│ 3               │ ← scene_number (esquina superior izquierda, badge negro)
│                 │
│ Exterior        │ ← title (bold, max 2 líneas, truncado)
│ dolly-in        │
│                 │
│ 6s    🟢        │ ← duration_seconds + StatusBadge mini
│ 🏔              │ ← icono de background asignado (hover: nombre)
│ 👤JO 👤CO       │ ← avatares de personajes (iniciales con color_accent)
│                 │
│ [■]             │ ← indicador de clips: ■=base, +N extensiones
│                 │    Ej: [■][+1] = base + 1 extensión
│                 │    Si clip_type=base y hay extension: [■][■] encadenados
└────────────────┘

Hover: borde kiyoko-teal, sombra.
Click: navega a /project/.../video/.../scene/[sceneShortId]
Drag & drop: reordenar escenas (actualiza sort_order).
```

**Dropdown [Grid ▾]:**
- Grid (default): 4 columnas de SceneCards
- Lista: filas expandidas con más detalle (descripción visible)
- Timeline: vista horizontal con bloques proporcionales a duración

**[+ Nueva escena]:** Abre modal de creación manual (título, descripción, posición).

**[🤖 IA]:** Abre el chat panel con contexto del vídeo. La IA pregunta: "¿Qué escena quieres crear? Descríbeme lo que quieres ver."

---

### `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]` — Detalle de escena

**Acceso:** Click en SceneCard.

**Layout:** VideoSidebar. Contenido en 2 columnas (desktop) o tabs (móvil).

```
┌─────────────────────────────────────────────────────────────┐
│ [← Escenas]  Escena 10: Aplicación de adhesivo    [🟢]    │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │  PANEL IZQUIERDO        │ │  PANEL DERECHO              ││
│ │  (Info + media)         │ │  (Técnico + prompts)        ││
│ │                         │ │                             ││
│ │  Descripción            │ │  Cámara                     ││
│ │  ┌─────────────────┐   │ │  Ángulo: [extreme_close ▾]  ││
│ │  │ Plano extremo   │   │ │  Movimiento: [dolly_in ▾]   ││
│ │  │ de las manos de │   │ │  Notas: [Dolly-in ultra...]││
│ │  │ Nerea con guan- │   │ │  Luz: [Soft warm overhe...] ││
│ │  │ tes de nitrilo  │   │ │  Mood: [Intimate, preci...] ││
│ │  │ aplicando adhe- │   │ │  IA reasoning: "Extreme...  ││
│ │  │ sivo...         │   │ │                             ││
│ │  └─────────────────┘   │ │  ────────────────────────── ││
│ │                         │ │                             ││
│ │  Anotación del cliente  │ │  Prompt de imagen           ││
│ │  [🏷 client]            │ │  ┌───────────────────────┐  ││
│ │  "Quiero que esta      │ │  │ Pixar Studios 3D      │  ││
│ │   escena transmita la  │ │  │ animated render,      │  ││
│ │   precisión quirúrgica │ │  │ extreme close-up of   │  ││
│ │   de Nerea."           │ │  │ young woman hands...  │  ││
│ │                         │ │  └───────────────────────┘  ││
│ │  Diálogo               │ │  [✏ Editar] [🤖 Mejorar IA]││
│ │  ┌─────────────────┐   │ │                             ││
│ │  │ (sin diálogo    │   │ │  Prompt de vídeo (base)    ││
│ │  │  en esta escena)│   │ │  ┌───────────────────────┐  ││
│ │  └─────────────────┘   │ │  │ Pixar Studios 3D      │  ││
│ │                         │ │  │ animated video,       │  ││
│ │  ────────────────────── │ │  │ extreme close-up...   │  ││
│ │                         │ │  └───────────────────────┘  ││
│ │  Imagen generada        │ │                             ││
│ │  ┌─────────────────┐   │ │  Extensiones                ││
│ │  │                 │   │ │  [ext 1] ┌───────────────┐  ││
│ │  │  🖼 Preview     │   │ │          │ Continuing     │  ││
│ │  │  (click=zoom)   │   │ │          │ from last...   │  ││
│ │  │                 │   │ │          └───────────────┘  ││
│ │  │     v1 de 2     │   │ │                             ││
│ │  └─────────────────┘   │ │  ────────────────────────── ││
│ │  [◀ v1] [v2 ▶]         │ │                             ││
│ │  [🔄 Regenerar]         │ │  Historial de prompts      ││
│ │                         │ │  ▸ v2 — hace 1h (IA)       ││
│ │  ────────────────────── │ │  ▸ v1 — hace 3h (manual)   ││
│ │                         │ │                             ││
│ │  Clips de vídeo         │ │                             ││
│ │  ┌─────────────────┐   │ │  Personajes                 ││
│ │  │ ▶ [■ base 6s]   │   │ │  [👤 Nerea — protagonista] ││
│ │  │   [■ ext1 6s]   │   │ │  [+ Añadir personaje]      ││
│ │  │                 │   │ │                             ││
│ │  │   Total: 12s    │   │ │  Fondos                     ││
│ │  └─────────────────┘   │ │  [🏔 Sala prótesis — ✓]    ││
│ │  [▶ Reproducir todo]    │ │  [+ Añadir fondo]          ││
│ │  [🔄 Regenerar clips]  │ │                             ││
│ │                         │ │  Notas del director         ││
│ │                         │ │  ┌───────────────────────┐  ││
│ │                         │ │  │ El momento MÁS técn...│  ││
│ │                         │ │  └───────────────────────┘  ││
│ └─────────────────────────┘ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Player de clips:**
- Barra visual: `[■ base 6s][■ ext1 6s]` — cada bloque coloreado
- Click en bloque individual: reproduce solo ese clip
- [▶ Reproducir todo]: reproduce base → ext1 → ext2 encadenados
- Debajo de cada clip: StatusBadge (pending/generating/ready)
- Si generating: animación pulsante amarilla

**Versionado de imagen:**
- Flechas ◀▶ para navegar entre versiones
- Indicador "v1 de 2"
- La versión con is_current=true se muestra por defecto
- Click en imagen: zoom a pantalla completa (modal)

**Todos los campos son editables inline** (click → input/textarea → blur para guardar con optimistic update).

---

### `/project/[shortId]/video/[videoShortId]/analysis` — Análisis IA

**Acceso:** Sidebar > Análisis. Botón "Analizar" en overview del vídeo.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Análisis del vídeo           [🔄 Re-analizar]             │
│  Última versión: hace 2h | Modelo: gpt-4o                 │
│                                                             │
│  ┌────────────────┐                                        │
│  │                │                                        │
│  │    82/100      │  Resumen: El vídeo tiene una           │
│  │    ████████    │  estructura narrativa sólida con       │
│  │    ScoreGauge  │  un arco emocional bien construido.    │
│  │                │  El gancho ASMR es efectivo...         │
│  └────────────────┘                                        │
│                                                             │
│  ✅ Fortalezas (4)                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ Arco emocional potente                           │   │
│  │    La progresión de servicios a prótesis crea un    │   │
│  │    crescendo emocional que culmina en el reveal.    │   │
│  │    Escenas afectadas: [10] [11] [12]  ← clickeables│   │
│  └─────────────────────────────────────────────────────┘   │
│  ... (más fortalezas colapsables)                          │
│                                                             │
│  ⚠️ Debilidades (3)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ Transición brusca servicios → prótesis   [🔴HIGH]│   │
│  │    El salto de consulta a rótulo es abrupto.        │   │
│  │    Escenas: [8] [9]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ... (más debilidades)                                     │
│                                                             │
│  💡 Sugerencias (3)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💡 Añadir transición visual antes de prótesis       │   │
│  │    Insertar plano de Nerea caminando hacia su sala. │   │
│  │    Prioridad: ALTA | Tipo: add_scene                │   │
│  │    [✅ Aplicar automáticamente]   ← si auto_applicable│   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💡 Versión corta 30s para TikTok                    │   │
│  │    Con escenas N1, E3, E4A, N7, E9.                 │   │
│  │    Prioridad: ALTA | Tipo: derive_video             │   │
│  │    [🔄 Crear vídeo derivado]     ← navega a /derive │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Versiones anteriores                                      │
│  ▸ v1 — 20/03/2025 — 78/100                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**[✅ Aplicar automáticamente]:**
1. Confirma: "¿Aplicar esta sugerencia? Se creará una nueva escena entre 8 y 9."
2. La IA crea la escena con datos pre-calculados de la sugerencia.
3. Toast: "Escena de transición creada entre escena 8 y 9."
4. El store se actualiza con invalidateQueries.

**Click en número de escena [10]:** Navega a `/project/.../video/.../scene/[scene10ShortId]`

---

### `/project/[shortId]/video/[videoShortId]/narration` — Narración

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Narración del vídeo          [v1 ▾] de 2 versiones       │
│                                                             │
│  Voz                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔊 Antonio (ElevenLabs Español)              [▸ ▶] │   │
│  │    Velocidad: [━━━━●━━━] 1.0x                       │   │
│  │    Estilo: [warm_professional ▾]                     │   │
│  │    [🔄 Cambiar voz]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Texto de la narración        [🤖 Generar con IA]         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ En Domenech Peluquerías, cada tijera cuenta una     │   │
│  │ historia.                                            │   │
│  │                                                      │   │
│  │ Bienvenidos a nuestro salón, donde cuatro            │   │
│  │ profesionales apasionados transforman vidas cada     │   │
│  │ día.                                                 │   │
│  │                                                      │   │
│  │ José, nuestro director, lidera con la confianza      │   │
│  │ de quien lleva la peluquería en las venas...         │   │
│  │                                                      │   │ ← textarea editable
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Audio                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [▶]  ━━━━━━━━━━●━━━━━━━━━  1:12 / 1:28             │   │
│  │ Estado: ready ✅                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  [🎙 Generar audio TTS]  [📥 Descargar MP3]               │
│                                                             │
│  Versiones anteriores                                      │
│  ▸ v1 — "En Domenech Peluquerías..." — draft              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**[🤖 Generar con IA]:** La IA lee todas las escenas del vídeo (descripciones, diálogos, arcos) y genera el texto de narración. Aparece en el textarea con estado "generando..." (streaming).

**[🎙 Generar audio TTS]:** Llama a ElevenLabs con el texto, voz seleccionada, velocidad y estilo. Muestra barra de progreso. Al completar, el player se actualiza.

**[🔄 Cambiar voz]:** Abre modal con lista de voces de ElevenLabs. Cada voz tiene [▶] para preview de 3 segundos.

---

### `/project/[shortId]/video/[videoShortId]/derive` — Derivar vídeo

**Acceso:** Botón "Derivar" en overview o sugerencia del análisis.

**Toda la página es un chat con la IA:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Crear vídeo derivado                                      │
│  A partir de: Presentación Domenech — YouTube 90s          │
│                                                             │
│  🤖 ¡Hola! Voy a ayudarte a crear un nuevo vídeo           │
│     basado en "Presentación Domenech".                      │
│                                                             │
│     Necesito saber:                                         │
│     1. ¿Para qué plataforma? (TikTok, Instagram, YouTube)  │
│     2. ¿Qué duración objetivo?                             │
│     3. ¿Qué tono quieres? (mismo, más cómico, más serio)   │
│     4. ¿Qué quieres conseguir con este vídeo?              │
│                                                             │
│                         Tú: Quiero un reel de 30 segundos   │
│                         para TikTok que muestre lo más      │
│                         impactante: el before/after de      │
│                         prótesis y el equipo.               │
│                                                             │
│  🤖 Perfecto. He analizado el vídeo original y propongo:    │
│                                                             │
│     📋 Plan del vídeo derivado:                             │
│     ┌─────────────────────────────────────────────────┐    │
│     │ Título: "Reel Prótesis — TikTok 30s"           │    │
│     │ Plataforma: TikTok | 9:16 | 30s                │    │
│     │                                                  │    │
│     │ Escenas a mantener:                              │    │
│     │  ✅ Escena 1 (Cold open) → acortada a 3s        │    │
│     │  ✅ Escena 4 (Equipo) → acortada a 4s           │    │
│     │  ✅ Escena 10 (Adhesivo) → 6s                    │    │
│     │  ✅ Escena 12 (Reveal) → 6s                      │    │
│     │  ✅ Escena 16 (CTA) → 5s                         │    │
│     │                                                  │    │
│     │ Nueva escena:                                    │    │
│     │  ➕ Before/after split-screen (6s)                │    │
│     │                                                  │    │
│     │ Total estimado: 30s                              │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│     ¿Genero este vídeo?                                     │
│     [✅ Sí, crear] [✏️ Modificar plan] [❌ Cancelar]         │
│                                                             │
│  [Escribe un mensaje...]                           [➤]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**[✅ Sí, crear]:** La IA crea el nuevo vídeo con sus escenas, navega automáticamente al nuevo vídeo.

---

### `/project/[shortId]/video/[videoShortId]/share` — Compartir escenas

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Compartir escenas                                         │
│                                                             │
│  Links activos (2)                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📎 Revisión escenas peluquería                      │   │
│  │    Escenas: todas | Público ✅ | Anotaciones ✅      │   │
│  │    Visitas: 12 | Expira: 25/04/2025                 │   │
│  │    Link: https://kiyoko.ai/share/xK4mQ9bR           │   │
│  │    [📋 Copiar] [🗑 Eliminar]                         │   │
│  │                                                      │   │
│  │    Anotaciones recibidas (3):                        │   │
│  │    • Juan: "La escena 3 me gusta pero..." [✅ ☐]    │   │
│  │    • Ana: "Conchi debería estar más..." [✅ ☐]       │   │
│  │    • Pedro: "Perfecto 👍" [✅ ☑]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Crear nuevo link]                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Configurar nuevo link                                │   │
│  │                                                      │   │
│  │ Título: [Revisión para cliente       ]               │   │
│  │ Descripción: [Revisar escenas 1-8... ]               │   │
│  │                                                      │   │
│  │ Escenas:                                             │   │
│  │ ○ Todas las escenas                                  │   │
│  │ ● Seleccionar escenas                                │   │
│  │   [☑1] [☑2] [☑3] [☐4] [☐5] [☑6] [☐7] [☑8]         │   │
│  │                                                      │   │
│  │ Acceso:                                              │   │
│  │ ● Público (cualquiera con el link)                   │   │
│  │ ○ Con contraseña: [________]                         │   │
│  │                                                      │   │
│  │ ☑ Permitir anotaciones                               │   │
│  │ ☐ Permitir descarga                                  │   │
│  │                                                      │   │
│  │ Expira en: [7 días ▾]                                │   │
│  │                                                      │   │
│  │           [Cancelar] [Crear link]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### `/share/[token]` — Vista pública de escenas (sin auth)

**Acceso:** Cualquier persona con el link. Puede requerir contraseña.

```
┌─────────────────────────────────────────────────────────────┐
│  🌿 Kiyoko AI              Revisión de escenas              │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  Presentación Domenech — YouTube 90s                       │
│  Compartido por: Desarrollador Kiyoko                      │
│  8 escenas para revisar                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Escena 1: Cold open tijeras                         │   │
│  │ ┌────────────────────┐                              │   │
│  │ │ 🖼 Imagen escena   │  Descripción: Pantalla en    │   │
│  │ │                    │  negro. Se escucha un sonido  │   │
│  │ │                    │  amplificado de tijeras...    │   │
│  │ └────────────────────┘                              │   │
│  │ Duración: 5s | Fase: hook | Estado: prompt_ready    │   │
│  │                                                      │   │
│  │ 💬 Añadir anotación:                                 │   │
│  │ Tu nombre: [__________]                              │   │
│  │ Comentario: [_________________________________]      │   │
│  │ Tipo: [💬 Comentario] [✅ Aprobar] [❌ Rechazar]      │   │
│  │                                    [Enviar]          │   │
│  │                                                      │   │
│  │ Anotaciones:                                         │   │
│  │ • Juan (hace 2h): "Me gusta mucho el concepto ASMR" │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... (más escenas)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Si `is_public=false`: primero muestra formulario de contraseña.
Si `allow_annotations=false`: no muestra el formulario de anotación.

---

### `/project/[shortId]/resources/characters` — Personajes

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Personajes (4)                     [+ Nuevo personaje]    │
│                                                             │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ │
│  │ ┌────┐                   │ │ ┌────┐                   │ │
│  │ │ 🔵 │ José              │ │ │ 🟣 │ Conchi            │ │
│  │ │ JO │ Director · El jefe│ │ │ CO │ Estilista senior  │ │
│  │ └────┘                   │ │ └────┘                   │ │
│  │                           │ │                          │ │
│  │ Hombre corpulento,       │ │ Mujer cálida, pelo rubio│ │
│  │ pelo castaño rojizo...   │ │ rizado, jersey rosa...  │ │
│  │                           │ │                          │ │
│  │ Aparece en: 7 escenas    │ │ Aparece en: 6 escenas   │ │
│  │ 🖼 3 imágenes             │ │ 🖼 2 imágenes            │ │
│  └──────────────────────────┘ └──────────────────────────┘ │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ │
│  │ ┌────┐                   │ │ ┌────┐                   │ │
│  │ │ 🟡 │ Nerea             │ │ │ 🟢 │ Raúl              │ │
│  │ │ NE │ Esp. prótesis     │ │ │ RA │ Barbero           │ │
│  │ └────┘                   │ │ └────┘                   │ │
│  │ ...                       │ │ ...                      │ │
│  └──────────────────────────┘ └──────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### `/project/[shortId]/resources/characters/[charId]` — Detalle de personaje

```
┌─────────────────────────────────────────────────────────────┐
│ [← Personajes]  José — Director · El jefe                  │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │  Galería de imágenes    │ │  Información                ││
│ │                         │ │                             ││
│ │  ┌─────┐ ┌─────┐       │ │  Nombre: [José          ]   ││
│ │  │ 🖼  │ │ 🖼  │       │ │  Rol: [Director · El jefe]  ││
│ │  │front│ │side │       │ │  Personalidad: [Confiado,]  ││
│ │  │ ✓  │ │     │       │ │  [cálido, líder natural]    ││
│ │  └─────┘ └─────┘       │ │                             ││
│ │  ┌─────┐ ┌─────┐       │ │  Descripción visual:        ││
│ │  │ 🖼  │ │ ➕  │       │ │  [Hombre corpulento y      ]││
│ │  │avat │ │ Add │       │ │  [confiado, pelo castaño   ]││
│ │  └─────┘ └─────┘       │ │  [rojizo peinado hacia...  ]││
│ │                         │ │                             ││
│ │  Tipos disponibles:     │ │  ────────────────────────── ││
│ │  avatar ✅ front ✅      │ │                             ││
│ │  side ☐ back ☐          │ │  IA — Análisis de imagen    ││
│ │  three_quarter ☐        │ │  ┌───────────────────────┐  ││
│ │  full_body ☐            │ │  │ Edad: 42-50           │  ││
│ │                         │ │  │ Cuerpo: corpulento    │  ││
│ │  [📷 Subir imagen]      │ │  │ Pelo: castaño rojizo  │  ││
│ │  [🤖 Generar con IA]    │ │  │ Ropa: blazer azul     │  ││
│ │                         │ │  │ Accesorios: collar     │  ││
│ │                         │ │  └───────────────────────┘  ││
│ │                         │ │  [🔄 Re-analizar imagen]    ││
│ │                         │ │                             ││
│ │                         │ │  IA — Descripción para      ││
│ │                         │ │  prompts (editable):        ││
│ │                         │ │  ┌───────────────────────┐  ││
│ │                         │ │  │ Heavyset confident    │  ││
│ │                         │ │  │ middle-aged man with  │  ││
│ │                         │ │  │ auburn-brown swept... │  ││
│ │                         │ │  └───────────────────────┘  ││
│ │                         │ │                             ││
│ │                         │ │  Reglas para la IA:         ││
│ │                         │ │  ✅ Siempre: blazer azul     ││
│ │                         │ │  ❌ Nunca: sin collar plata  ││
│ │                         │ │                             ││
│ │                         │ │  Aparece en escenas:        ││
│ │                         │ │  [E3] [E5] [E6] [E8] [E9]  ││
│ │                         │ │  ← click navega a escena   ││
│ └─────────────────────────┘ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**[📷 Subir imagen]:** Abre file picker. Tras seleccionar, muestra preview con selector de tipo (avatar, front, side, etc.). Sube a Storage.

**[🤖 Generar con IA]:** La IA genera la imagen del ángulo seleccionado usando `ai_prompt_description` + el ángulo como parámetro. Muestra progreso.

**[🔄 Re-analizar imagen]:** Envía la imagen de referencia a la API de visión (GPT-4o) que actualiza `ai_visual_analysis` y `ai_prompt_description`.

---

### `/project/[shortId]/publications` — Publicaciones

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Publicaciones          [Calendario] [Grid]  [+ Nueva]     │
│                                                             │
│  Perfiles conectados:                                      │
│  [📷 @domenech.peluquerias] [🎵 @domenech.peluquerias]     │
│  [Gestionar perfiles →]                                    │
│                                                             │
│  [Todos ▾] [Instagram ▾] [draft ▾]                         │
│                                                             │
│  Vista Calendario (marzo 2025):                            │
│  ┌───┬───┬───┬───┬───┬───┬───┐                            │
│  │ L │ M │ X │ J │ V │ S │ D │                            │
│  ├───┼───┼───┼───┼───┼───┼───┤                            │
│  │   │   │   │   │   │ 1 │ 2 │                            │
│  │   │   │   │   │   │   │   │                            │
│  ├───┼───┼───┼───┼───┼───┼───┤                            │
│  │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │                            │
│  │   │   │   │   │   │   │   │                            │
│  ├───┼───┼───┼───┼───┼───┼───┤                            │
│  │10 │11 │12 │13 │14 │15 │16 │                            │
│  │   │ 🟢│   │   │   │   │   │ ← dot = publicación        │
│  ├───┼───┼───┼───┼───┼───┼───┤                            │
│  │17 │18 │19 │20 │21 │22 │23 │                            │
│  │   │   │   │ 📍│   │   │   │ ← 📍 = hoy                 │
│  ├───┼───┼───┼───┼───┼───┼───┤                            │
│  │24 │25 │26 │27 │28 │29 │30 │                            │
│  │   │ 🟡│   │   │ 🔵│   │   │                            │
│  └───┴───┴───┴───┴───┴───┴───┘                            │
│  🟢 = publicado  🟡 = programado  🔵 = borrador             │
│                                                             │
│  Click en día con publicación: muestra preview debajo.      │
│                                                             │
│  Vista Grid:                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ 🖼 preview │ │ 🖼 preview │ │ 🖼 preview │             │
│  │            │ │            │ │            │             │
│  │ Transform..│ │ Mitos y    │ │ VUELVE A   │             │
│  │ 📷 IG      │ │ verdades   │ │ BRILLAR    │             │
│  │ 25 mar 🟡  │ │ 📷 IG 🔵   │ │ 🎵 TT 🔵   │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### `/project/[shortId]/tasks` — Tareas

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Tareas         [Kanban] [Lista] [Calendario]  [+ Nueva]   │
│                                                             │
│  Filtros: [Todas ▾] [Todos ▾] [Todos vídeos ▾]            │
│                                                             │
│  Vista Kanban:                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐│
│  │ PENDIENTE  │ │ EN PROGRESO│ │ EN REVISIÓN│ │COMPLETAD││
│  │ (5)        │ │ (2)        │ │ (1)        │ │ (8)     ││
│  │            │ │            │ │            │ │         ││
│  │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │         ││
│  │ │Generar │ │ │ │Mejorar │ │ │ │Revisar │ │ │         ││
│  │ │prompts │ │ │ │escena 3│ │ │ │narraci.│ │ │         ││
│  │ │🔴 high  │ │ │ │🟡 medium│ │ │ │🟢 low   │ │ │         ││
│  │ │📸 img   │ │ │ │✏ prompt │ │ │ │🎙 voice │ │ │         ││
│  │ │👤 DK    │ │ │ │👤 DK    │ │ │ │👤 DK    │ │ │         ││
│  │ │📅 25mar │ │ │ │         │ │ │ │         │ │ │         ││
│  │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │         ││
│  │ ┌────────┐ │ │            │ │            │ │         ││
│  │ │Generar │ │ │            │ │            │ │         ││
│  │ │clips   │ │ │            │ │            │ │         ││
│  │ │...     │ │ │            │ │            │ │         ││
│  │ └────────┘ │ │            │ │            │ │         ││
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘│
│                                                             │
│  Drag & drop entre columnas para cambiar estado.           │
│  Click en tarjeta: abre detalle lateral (sheet).           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Task card:**
```
┌────────────────────┐
│ Generar prompts    │ ← título
│ escenas 5-8        │
│                    │
│ 🔴 high            │ ← prioridad (color)
│ 📸 image_gen        │ ← categoría (badge)
│ 👤 DK              │ ← asignado (avatar)
│ 📅 25 mar           │ ← due date (rojo si vencida)
│ ⏱ ~2h              │ ← estimated_minutes
└────────────────────┘
```

---

### `/project/[shortId]/tasks/time` — Time tracking

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Registro de tiempo                                        │
│                                                             │
│  Timer activo                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⏱  02:34:17                          [⏸ Pausar]    │   │
│  │  Tarea: Generar prompts escenas 5-8                 │   │
│  │  Vídeo: Presentación Domenech                       │   │
│  │  Categoría: image_gen                               │   │
│  │                                        [⏹ Parar]    │   │
│  └─────────────────────────────────────────────────────┘   │
│  [▶ Iniciar nuevo timer] [✏ Entrada manual]                │
│                                                             │
│  Hoy: 4h 23min                                             │
│  Esta semana: 18h 45min                                    │
│                                                             │
│  Historial                     [Esta semana ▾]             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Hoy                                                  │   │
│  │ • 2h 34min — Generar prompts — 📸 image_gen — ⏱     │   │
│  │ • 1h 15min — Revisar narración — 🎙 voiceover       │   │
│  │ • 0h 34min — Ajustar escenas — ✏ prompt              │   │
│  │                                                      │   │
│  │ Ayer                                                 │   │
│  │ • 3h 10min — Crear personajes — 📝 script            │   │
│  │ • 1h 45min — Generar clips — 🎬 video_gen            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Resumen por categoría                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📸 image_gen      ████████████████░░░░ 12h (40%)   │   │
│  │  ✏ prompt          ███████████░░░░░░░░  8h (27%)    │   │
│  │  🎬 video_gen      ██████░░░░░░░░░░░░░  5h (17%)    │   │
│  │  🎙 voiceover      ████░░░░░░░░░░░░░░░  3h (10%)    │   │
│  │  📝 script         ██░░░░░░░░░░░░░░░░░  2h  (6%)    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### `/project/[shortId]/settings/ai` — Config de IA

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Configuración de IA                                       │
│                                                             │
│  Director IA                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tipo de director:                                    │   │
│  │ [🎬 Director Pixar 3D          ▾]                    │   │
│  │                                                      │   │
│  │ Opciones:                                            │   │
│  │  🎬 Director Pixar 3D — Animación cálida, Toy Story │   │
│  │  📷 Director Realista — Fotografía cinematográfica    │   │
│  │  🎌 Director Anime — Studio Ghibli, dinámico         │   │
│  │  😂 Director Comedia — Timing cómico, expresivo      │   │
│  │  📺 Director Publicitario — Anuncios, CTA claros     │   │
│  │  🎨 Director Artístico — Watercolor, experimental    │   │
│  │                                                      │   │
│  │ Al cambiar: se genera nuevo system prompt automático.│   │
│  │                                                      │   │
│  │ System prompt (editable):                            │   │
│  │ ┌─────────────────────────────────────────────────┐  │   │
│  │ │ Eres Kiyoko, una directora de vídeo de          │  │   │
│  │ │ animación 3D estilo Pixar Studios. Trabajas     │  │   │
│  │ │ para Domenech Peluquerías, una peluquería       │  │   │
│  │ │ familiar de alta gama especializada en          │  │   │
│  │ │ prótesis capilares.                             │  │   │
│  │ │                                                  │  │   │
│  │ │ Tu rol es dirigir la creación de vídeos         │  │   │
│  │ │ promocionales con estas directrices:            │  │   │
│  │ │ - ESTILO VISUAL: Pixar Studios 3D animation...  │  │   │
│  │ └─────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ Tono: [warm_professional ▾]                          │   │
│  │ Creatividad: [━━━━━━━━●━━] 0.8                       │   │
│  │ Idioma: [Español ▾]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Generadores externos                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Imagen                                               │   │
│  │ Proveedor: [Grok Aurora ▾]                           │   │
│  │ Config: {"model":"grok-2-aurora","quality":"high"}   │   │
│  │                                                      │   │
│  │ Vídeo                                                │   │
│  │ Proveedor: [Grok ▾]                                  │   │
│  │ Duración base: [6 ▾] segundos                        │   │
│  │ Duración alternativa: [10] segundos                  │   │
│  │ ☑ Soporta extensiones desde último frame             │   │
│  │ Duración extensión: [6] segundos                     │   │
│  │                                                      │   │
│  │ TTS (narración)                                      │   │
│  │ Proveedor: [ElevenLabs ▾]                            │   │
│  │ Modelo: [eleven_multilingual_v2 ▾]                   │   │
│  │                                                      │   │
│  │ Visión (análisis de imágenes)                        │   │
│  │ Proveedor: [OpenAI ▾]  Modelo: [gpt-4o ▾]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                          [💾 Guardar]      │
└─────────────────────────────────────────────────────────────┘
```

---

### `/settings/api-keys` — API Keys del usuario

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Mis API Keys                           [+ Añadir key]     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 OpenAI                          ...xK4m          │   │
│  │    Gasto: $12.34 / $50.00 este mes                  │   │
│  │    Requests: 847 | Última vez: hace 2h              │   │
│  │    [🔍 Probar] [✏ Editar] [🗑 Eliminar]              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 ElevenLabs                      ...pQ9r          │   │
│  │    Gasto: $3.21 / $20.00 este mes                   │   │
│  │    [🔍 Probar] [✏ Editar] [🗑 Eliminar]              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Grok                            ...m2Wx          │   │
│  │    Error: Invalid API key (hace 1h)                 │   │
│  │    [🔍 Probar] [✏ Editar] [🗑 Eliminar]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Añadir key] abre modal:                                │
│  ┌─────────────────────────────────┐                       │
│  │ Proveedor: [OpenAI ▾]           │                       │
│  │ API Key: [sk-...            ]   │                       │
│  │ Límite mensual: [$50       ]    │                       │
│  │          [Cancelar] [Guardar]   │                       │
│  └─────────────────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Interacciones móvil (responsive)

```
< 768px (móvil):
  - Sidebar se oculta, hamburguesa ☰ en header la despliega como sheet
  - Chat panel se abre como sheet desde abajo (100% ancho)
  - Grids de escenas: 2 columnas
  - Detalle de escena: tabs en vez de 2 columnas
  - Kanban: scroll horizontal entre columnas
  - Dropdowns de header: en el sheet del menú

768px - 1024px (tablet):
  - Sidebar colapsada (64px, solo iconos)
  - Chat panel: 300px fijo
  - Grids: 3 columnas

> 1024px (desktop):
  - Layout completo como se describe arriba
  - Chat panel resizable 300-600px
```

---

### Navegación con teclado

```
⌘K / Ctrl+K    → Abrir Command Menu (búsqueda global)
Esc            → Cerrar modal/sheet/chat panel abierto
⌘/             → Toggle chat panel
⌘B             → Toggle sidebar colapsado
⌘S             → Guardar (en campos editables)
←/→            → Navegar entre versiones de imagen en escena
```
