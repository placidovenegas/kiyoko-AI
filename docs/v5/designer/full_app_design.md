# Kiyoko AI — Diseño Visual Completo de Todas las Pantallas

> Documento único con el diseño exacto de CADA pantalla de la app.
> Cada página incluye: layout, componentes, tamaños, colores, interacciones y estados.
> Para implementar con v0.dev, Claude Code, o cualquier herramienta.

---

## TEMA GLOBAL

```
DARK MODE (por defecto):
  --bg:           #0A0A0B      ← Fondo principal
  --bg-card:      #111113      ← Tarjetas, paneles, sidebar
  --bg-hover:     #1A1A1D      ← Hover sobre elementos
  --bg-sidebar:   #0E0E10      ← Fondo del sidebar
  --bg-input:     #151517      ← Inputs, textareas, código
  --border:       #1E1E22      ← Bordes sutiles
  --border-hover: #2A2A30      ← Bordes en hover
  --text:         #FAFAFA      ← Texto principal
  --text-muted:   #71717A      ← Texto secundario
  --text-dim:     #3F3F46      ← Texto muy tenue

MARCA:
  --teal:         #0EA5A0      ← Color primario
  --green:        #34D399      ← Gradiente del logo
  --coral:        #F97316      ← Acento (notificaciones)
  --gradient:     linear-gradient(135deg, #0EA5A0, #34D399)

ESTADOS:
  draft:          #71717A (zinc)
  in_progress:    #3B82F6 (blue)
  generating:     #EAB308 (yellow, pulsante)
  generated:      #8B5CF6 (purple)
  approved:       #22C55E (green)
  rejected:       #EF4444 (red)

ARCOS:
  hook:           #EF4444 (red)
  build:          #EAB308 (yellow)
  peak:           #22C55E (green)
  close:          #3B82F6 (blue)

TIPOGRAFÍA:
  Font:           Inter variable
  Tamaño base:    14px (text-sm)
  Headings:       16px semibold (text-lg)
  Caption:        11px (text-xs)
  Mono:           JetBrains Mono 12px
```

---

## LAYOUT PRINCIPAL — Se aplica a TODA la app autenticada

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐  ┌────────────┐ │
│  │           │  │ HEADER (h-14, border-b)                     │  │            │ │
│  │           │  │ [≡] [Breadcrumbs···]    [🏠][⚙][🔔3][💬][DK]│  │            │ │
│  │  SIDEBAR  │  ├──────────────────────────────────────────────┤  │  CHAT      │ │
│  │           │  │                                              │  │  PANEL     │ │
│  │  240px    │  │              CONTENIDO                       │  │            │ │
│  │  (64px    │  │              (cada página va aquí)           │  │  380px     │ │
│  │  colapsa) │  │              padding: 24px                   │  │  (300-600  │ │
│  │           │  │              overflow-y: auto                │  │  resizable)│ │
│  │  bg:      │  │              bg: --bg                        │  │            │ │
│  │  #0E0E10  │  │                                              │  │  bg:       │ │
│  │           │  │                                              │  │  #111113   │ │
│  │  border-r │  │                                              │  │            │ │
│  │  #1E1E22  │  │                                              │  │  border-l  │ │
│  │           │  │                                              │  │  #1E1E22   │ │
│  │           │  │                                              │  │            │ │
│  └──────────┘  └──────────────────────────────────────────────┘  └────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

El chat panel es OPCIONAL (toggle). Cuando está cerrado, el contenido ocupa todo el ancho.
```

### Header (h-14, 56px, sticky top, bg: --bg-card, border-b: --border)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [≡]  Domenech Peluquerías / Presentación Domenech / Escenas                     │
│  ↑     ↑ breadcrumbs: cada segmento es link, / como separador                   │
│  Sidebar                                                         [🏠][⚙][🔔3][💬][DK]│
│  trigger                                                          ↑ iconos 32x32 │
│  (20px)                                                           hover: bg-hover │
│                                                                   🔔: badge "3"   │
│                                                                   rojo 16px       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/login`

```
LAYOUT: Sin sidebar, sin header. Pantalla centrada.
Fondo: --bg con pattern de puntos sutiles (dot-pattern opacity 5%).

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                      🌿 Kiyoko AI                            │
│                    ← Logo 48px con gradiente                 │
│                    ← Texto "Kiyoko AI" 24px semibold         │
│                                                              │
│              ┌─────────────────────────────────┐             │
│              │                                 │             │
│              │  Iniciar sesión                  │ ← h3 20px  │
│              │                                 │             │
│              │  Email                           │             │
│              │  ┌─────────────────────────────┐│             │
│              │  │ tu@email.com                ││ ← input     │
│              │  └─────────────────────────────┘│   h-10      │
│              │                                 │   rounded-lg│
│              │  Contraseña                      │   bg-input  │
│              │  ┌─────────────────────────────┐│   border    │
│              │  │ ••••••••            [👁]    ││   focus:     │
│              │  └─────────────────────────────┘│   ring-teal │
│              │                                 │             │
│              │  [¿Olvidaste tu contraseña?]    │ ← link teal │
│              │                                 │             │
│              │  ┌─────────────────────────────┐│             │
│              │  │      Iniciar sesión          ││ ← btn w-full│
│              │  └─────────────────────────────┘│   bg-teal   │
│              │                                 │   h-10      │
│              │  ────── o continúa con ──────   │   rounded-lg│
│              │                                 │             │
│              │  ┌─────────────────────────────┐│             │
│              │  │  🔵 Continuar con Google     ││ ← btn ghost│
│              │  └─────────────────────────────┘│   border    │
│              │                                 │             │
│              │  ¿No tienes cuenta?              │             │
│              │  [Crear cuenta] ← link teal     │             │
│              │                                 │             │
│              └─────────────────────────────────┘             │
│              ← Card: bg-card, border, rounded-xl, p-8       │
│                 max-w-md (448px), shadow-2xl                 │
│                                                              │
│              [Términos] · [Privacidad]                       │
│              ← links text-xs text-muted, abajo de todo       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/dashboard`

```
SIDEBAR: Nivel Dashboard (ver sidebar_implementation.md)
HEADER: [≡] Dashboard                              [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO (padding 24px) ─────────────────────────────────────────────────┐
│                                                                               │
│  Buenos días, Desarrollador 👋                                                │
│  ← text-2xl font-semibold. Dinámico: mañana/tarde/noche + full_name         │
│                                                                               │
│  ┌───── STATS (grid 4 cols, gap-4) ─────────────────────────────────────┐    │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │    │
│  │ │     12       │ │      5       │ │    2.5h      │ │    847       │ │    │
│  │ │  Proyectos   │ │   Tareas     │ │  Trabajado   │ │   Tokens     │ │    │
│  │ │  📁          │ │  pendientes  │ │    hoy       │ │  este mes    │ │    │
│  │ │              │ │  ✅          │ │  ⏱           │ │  🤖          │ │    │
│  │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │    │
│  │ Cada card: bg-card, border, rounded-xl, p-4, hover: border-teal    │    │
│  │ Número: text-3xl font-bold. Label: text-xs text-muted. Icono: 16px │    │
│  │ Click: navega (tareas → /project/último/tasks, tokens → /settings) │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── FILTROS ────────────────────────────────────────────────────────┐    │
│  │ Proyectos                                                            │    │
│  │                                                                      │    │
│  │ [Todos ▾]   [🔍 Buscar proyecto...]   [Recientes ▾]   [+ Nuevo ▸]  │    │
│  │                                                                      │    │
│  │ [Todos ▾]: dropdown — Todos, En progreso, Completados, Archivados,  │    │
│  │            separador, ⭐ Favoritos                                    │    │
│  │ [🔍]: input con debounce 300ms, filtra por title + client_name       │    │
│  │ [Recientes ▾]: dropdown — Recientes, Más antiguos, Nombre A-Z/Z-A, │    │
│  │                Progreso ↑/↓                                          │    │
│  │ [+ Nuevo]: bg-teal, text-white, rounded-lg, h-9, px-4              │    │
│  │            hover: bg-teal/90. Click → /new                          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── GRID PROYECTOS (grid 3 cols desktop, 2 tablet, 1 móvil, gap-4) ┐   │
│  │                                                                       │   │
│  │  ┌─── ProjectCard ──────────┐  ┌─── ProjectCard ──────────┐          │   │
│  │  │ ┌──────────────────────┐ │  │ ┌──────────────────────┐ │          │   │
│  │  │ │                      │ │  │ │                      │ │          │   │
│  │  │ │   PORTADA            │ │  │ │   PORTADA            │ │          │   │
│  │  │ │   aspect-video (16:9)│ │  │ │   (gradiente si no   │ │          │   │
│  │  │ │   object-cover       │ │  │ │    hay imagen)       │ │          │   │
│  │  │ │   rounded-t-xl       │ │  │ │                      │ │          │   │
│  │  │ │                ⭐    │ │  │ │                ☆    │ │          │   │
│  │  │ └──────────────────────┘ │  │ └──────────────────────┘ │          │   │
│  │  │                          │  │                          │          │   │
│  │  │  Domenech Peluquerías    │  │  Restaurante La Luna     │          │   │
│  │  │  ← text-sm font-medium  │  │  ← truncate max 2 lines  │          │   │
│  │  │  Domenech Peluquerías    │  │  La Luna S.L.            │          │   │
│  │  │  ← text-xs text-muted   │  │  ← client_name           │          │   │
│  │  │                          │  │                          │          │   │
│  │  │  ▓▓▓▓▓▓▓▓▓░░░░░ 65%    │  │  ▓▓▓░░░░░░░░░░░░ 30%    │          │   │
│  │  │  ← h-1.5 rounded-full   │  │  ← bg-zinc-800 track     │          │   │
│  │  │    fill: bg-teal         │  │    fill: bg-teal          │          │   │
│  │  │                          │  │                          │          │   │
│  │  │  [📺 YT] [in_progress]  │  │  [📱 TT] [draft]        │          │   │
│  │  │  ← badges: rounded-full │  │                          │          │   │
│  │  │    px-2 py-0.5 text-xs   │  │                    [⋯]  │          │   │
│  │  │                    [⋯]  │  │                          │          │   │
│  │  └──────────────────────────┘  └──────────────────────────┘          │   │
│  │                                                                       │   │
│  │  Card: bg-card, border, rounded-xl                                   │   │
│  │  Hover: border-teal, shadow-lg shadow-teal/5                         │   │
│  │  Click (fuera de ⭐ y ⋯): navega a /project/[shortId]               │   │
│  │                                                                       │   │
│  │  [⋯] DROPDOWN (click):                                               │   │
│  │  ┌──────────────────────────┐                                        │   │
│  │  │ 📂 Abrir proyecto       │                                        │   │
│  │  │ ── separador ──         │                                        │   │
│  │  │ ✏️ Editar               │                                        │   │
│  │  │ 📋 Duplicar             │                                        │   │
│  │  │ 📤 Exportar             │                                        │   │
│  │  │ ── separador ──         │                                        │   │
│  │  │ 📦 Archivar             │                                        │   │
│  │  │ ── separador ──         │                                        │   │
│  │  │ 🗑 Eliminar   ← red-400│                                        │   │
│  │  └──────────────────────────┘                                        │   │
│  │  Dropdown: bg-card, border, rounded-lg, shadow-xl, min-w-48         │   │
│  │  Items: h-9, px-3, text-sm, hover: bg-hover                        │   │
│  │                                                                       │   │
│  │  ⭐ (FavoriteButton): absoluta top-3 right-3 de la imagen            │   │
│  │  Favorito: fill-yellow-500 text-yellow-500                           │   │
│  │  No favorito: text-zinc-400, hover text-yellow-500                   │   │
│  │  Click: toggle optimistic                                            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌───── ACTIVIDAD ─────────────────────────────────────────────────────┐     │
│  │ Actividad reciente                                [Ver toda →]      │     │
│  │                                                                      │     │
│  │ 👤 María editó la Escena 3 en Domenech            hace 5 min        │     │
│  │ 🤖 IA generó análisis del vídeo Presentación      hace 1h           │     │
│  │ 👤 Tú creaste 3 escenas nuevas                    hace 2h           │     │
│  │                                                                      │     │
│  │ Cada entrada: flex, gap-3, py-2, border-b last:border-0             │     │
│  │ Icono: 20px. Texto: text-sm. Tiempo: text-xs text-muted ml-auto    │     │
│  │ Click en entrada: navega a la entidad                               │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌───── EMPTY STATE (si 0 proyectos) ──────────────────────────────────┐     │
│  │                                                                      │     │
│  │                        🎬 (icono 64px, text-zinc-600)               │     │
│  │                                                                      │     │
│  │              No tienes proyectos todavía                             │     │
│  │              ← text-lg font-medium                                   │     │
│  │                                                                      │     │
│  │         Crea tu primer proyecto y empieza a                         │     │
│  │         producir vídeos con IA.                                     │     │
│  │              ← text-sm text-muted                                    │     │
│  │                                                                      │     │
│  │              [+ Crear proyecto] ← bg-teal                           │     │
│  │                                                                      │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌───── CONFIRM DELETE MODAL ──────────────────────────────────────────┐     │
│  │ (se abre al pulsar 🗑 Eliminar en el dropdown)                      │     │
│  │                                                                      │     │
│  │  Backdrop: bg-black/60, backdrop-blur-sm                            │     │
│  │  Modal: bg-card, border, rounded-2xl, shadow-2xl, max-w-md, p-6    │     │
│  │                                                                      │     │
│  │  🗑 Eliminar proyecto                                                │     │
│  │  ← h3 font-semibold                                                 │     │
│  │                                                                      │     │
│  │  Esta acción no se puede deshacer. Se eliminarán                    │     │
│  │  todos los vídeos, escenas, personajes y fondos.                    │     │
│  │  ← text-sm text-muted                                               │     │
│  │                                                                      │     │
│  │  Escribe el nombre del proyecto para confirmar:                     │     │
│  │  ← text-sm font-medium                                              │     │
│  │                                                                      │     │
│  │  ┌──────────────────────────────────────────┐                       │     │
│  │  │                                          │ ← input               │     │
│  │  └──────────────────────────────────────────┘   placeholder:        │     │
│  │  Si texto ≠ nombre: border-border (normal)      "Domenech Pelq..."  │     │
│  │  Si texto = nombre: border-green-500            focus: ring-teal    │     │
│  │                                                                      │     │
│  │  [Cancelar]                            [Eliminar]                   │     │
│  │  ← btn ghost                           ← btn bg-red-600            │     │
│  │                                          DISABLED si texto ≠ nombre│     │
│  │                                          (opacity-50, cursor-not)   │     │
│  │                                          ENABLED si texto = nombre  │     │
│  │                                          hover: bg-red-700          │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/new` — Crear proyecto (Wizard 4 pasos)

```
SIDEBAR: Dashboard
HEADER: [≡] Nuevo proyecto                        [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO ────────────────────────────────────────────────────────────────┐
│                                                                               │
│  Crear nuevo proyecto                                                        │
│  ← text-xl font-semibold                                                     │
│                                                                               │
│  ┌───── TOGGLE ─────────────────────────────────────────────────────────┐    │
│  │  [✏️ Manual]  [🤖 Crear con IA]                                      │    │
│  │  ← 2 botones toggle: activo bg-card border-teal, inactivo bg-hover  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── STEPPER ────────────────────────────────────────────────────────┐    │
│  │  ● Información    ○ Estilo    ○ IA    ○ Resumen                     │    │
│  │  ━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │    │
│  │  ← 25% fill teal, resto zinc-800                                    │    │
│  │  ● = paso activo (bg-teal, 10px)                                    │    │
│  │  ○ = paso futuro (bg-zinc-700, 10px)                                │    │
│  │  ✓ = paso completado (bg-teal, check icon)                          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── PASO 1: Información (dentro de card bg-card rounded-xl p-6) ───┐    │
│  │                                                                      │    │
│  │  Título del proyecto *                                               │    │
│  │  ┌──────────────────────────────────────────────────────┐           │    │
│  │  │ Domenech Peluquerías                                 │           │    │
│  │  └──────────────────────────────────────────────────────┘           │    │
│  │  ← input: h-10, bg-input, border, rounded-lg, focus: ring-teal     │    │
│  │                                                                      │    │
│  │  Descripción                                                         │    │
│  │  ┌──────────────────────────────────────────────────────┐           │    │
│  │  │ Vídeo promocional para peluquería familiar...        │           │    │
│  │  │                                                      │           │    │
│  │  │                                                      │           │    │
│  │  └──────────────────────────────────────────────────────┘           │    │
│  │  ← textarea: min-h-20, bg-input, border, rounded-lg                 │    │
│  │                                                                      │    │
│  │  Cliente                                                             │    │
│  │  ┌──────────────────────────────────────────────────────┐           │    │
│  │  │ Domenech Peluquerías                                 │           │    │
│  │  └──────────────────────────────────────────────────────┘           │    │
│  │                                                                      │    │
│  │  Tags                                                                │    │
│  │  [peluquería ×] [pixar ×] [YouTube ×]  [+ Añadir]                  │    │
│  │  ← badges inline: bg-teal/10, border-teal/20, text-teal             │    │
│  │    × quita el tag. Escribir + Enter o coma añade tag.               │    │
│  │                                                                      │    │
│  │                                                [Siguiente →]         │    │
│  │                                                ← btn bg-teal h-9    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── PASO 2: Estilo visual ─────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  Estilo de animación                                                 │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │  🎬      │ │  📷      │ │  🎌      │ │  🎨      │               │    │
│  │  │ Pixar 3D │ │ Realista │ │  Anime   │ │Watercolor│               │    │
│  │  │    ✓     │ │          │ │          │ │          │               │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │    │
│  │  │  🏙      │ │  ⬛      │ │  ✏️      │                            │    │
│  │  │Cyberpunk │ │ Flat 2D  │ │ Custom   │                            │    │
│  │  └──────────┘ └──────────┘ └──────────┘                            │    │
│  │                                                                      │    │
│  │  Cada card: w-28 h-24, bg-card, border, rounded-lg, cursor-pointer │    │
│  │  Seleccionada: border-teal, bg-teal/5, ✓ en esquina               │    │
│  │  Hover: border-hover, bg-hover                                      │    │
│  │  Icono: 24px centrado. Texto: text-xs debajo                       │    │
│  │                                                                      │    │
│  │  Paleta de colores (opcional)                                       │    │
│  │  ○ ○ ○ [+]                                                         │    │
│  │  ← círculos 32px con el color, click abre ColorPicker              │    │
│  │  [+] = añadir otro color (max 6)                                    │    │
│  │                                                                      │    │
│  │                            [← Anterior]  [Siguiente →]              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── PASO 3: IA ────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  Tipo de director: [🎬 Director Pixar 3D ▾]                         │    │
│  │  ← select h-10 bg-input border rounded-lg                           │    │
│  │                                                                      │    │
│  │  Generador de imágenes: [Grok Aurora ▾]                             │    │
│  │  Generador de vídeos:   [Grok ▾]                                    │    │
│  │  Duración de clip:      [6 ▾] segundos                              │    │
│  │  Narrador TTS:          [ElevenLabs ▾]                              │    │
│  │  ← cada select: h-10, bg-input, border, rounded-lg                  │    │
│  │                                                                      │    │
│  │  ℹ️ Puedes cambiar esto después en Ajustes > IA y Agente.           │    │
│  │  ← text-xs text-muted, icono info 14px                              │    │
│  │                                                                      │    │
│  │                            [← Anterior]  [Siguiente →]              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── PASO 4: Resumen ───────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────┐             │    │
│  │  │ Título:     Domenech Peluquerías                   │             │    │
│  │  │ Cliente:    Domenech Peluquerías                   │             │    │
│  │  │ Estilo:     Pixar 3D                               │             │    │
│  │  │ Director:   Director Pixar 3D                      │             │    │
│  │  │ Imagen:     Grok Aurora                            │             │    │
│  │  │ Vídeo:      Grok (6s clips)                        │             │    │
│  │  │ TTS:        ElevenLabs                             │             │    │
│  │  │ Tags:       peluquería, pixar, YouTube             │             │    │
│  │  └────────────────────────────────────────────────────┘             │    │
│  │  ← bg-input, border, rounded-lg, p-4                               │    │
│  │  Cada fila: flex justify-between, py-1.5                            │    │
│  │  Label: text-sm text-muted. Value: text-sm font-medium             │    │
│  │                                                                      │    │
│  │                            [← Anterior]  [🚀 Crear proyecto]       │    │
│  │                                           ← bg-teal, h-10          │    │
│  │                                           Click: spinner + crear    │    │
│  │                                           → navega a /project/[id]  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/project/[shortId]` — Vista general del proyecto

```
SIDEBAR: Nivel Proyecto (con "← Dashboard" arriba)
HEADER: [≡] Domenech Peluquerías                   [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO ────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌───── PORTADA ────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │        IMAGEN DE PORTADA (o gradiente de color_palette)             │    │
│  │        h-48, w-full, rounded-xl, object-cover                       │    │
│  │                                                                      │    │
│  │                                                    [📷 Cambiar]     │    │
│  │                                                    ← aparece hover  │    │
│  │                                                    btn ghost sm     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── INFO ──────────────────────────────────────────────────────────┐    │
│  │  Domenech Peluquerías                           [⚙️ Ajustes]       │    │
│  │  ← text-xl font-semibold                        ← btn ghost sm     │    │
│  │                                                                      │    │
│  │  Cliente: Domenech Peluquerías  ·  [in_progress 🟢]                │    │
│  │  ← text-sm text-muted             ← StatusBadge pill               │    │
│  │                                                                      │    │
│  │  Estilo: [Pixar 3D]  ·  [peluquería] [pixar] [prótesis capilar]   │    │
│  │  ← badge filled        ← badges outline, text-xs                   │    │
│  │                                                                      │    │
│  │  Vídeo promocional estilo Pixar 3D para Domenech Peluquerías,      │    │
│  │  mostrando los servicios y el equipo de la peluquería.             │    │
│  │  ← text-sm text-muted, max 2 lines, [ver más] si trunca           │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── STATS (grid 5 cols, gap-3) ────────────────────────────────────┐    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │    │
│  │  │ 🎬 2   │ │ 🎞 16  │ │ 👤 4   │ │ 🏔 3   │ │ ⏱ 8h  │           │    │
│  │  │ Vídeos │ │Escenas │ │Personj.│ │ Fondos │ │Trabajad│           │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘           │    │
│  │  Cada stat: bg-card, border, rounded-lg, p-3, hover: bg-hover     │    │
│  │  Número: text-xl font-bold. Label: text-xs text-muted.            │    │
│  │  Click: navega a la sección correspondiente                        │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── VÍDEOS ────────────────────────────────────────────────────────┐    │
│  │  Vídeos (2)                                     [+ Nuevo vídeo]    │    │
│  │  ← text-base font-semibold                      ← btn bg-teal sm  │    │
│  │                                                                      │    │
│  │  ┌── VideoRow ──────────────────────────────────────────────────┐   │    │
│  │  │  📺  Presentación Domenech — YouTube 90s              [⋯]   │   │    │
│  │  │      ▓▓▓▓▓▓▓░░░ 65%  ·  16 escenas  ·  4 personajes       │   │    │
│  │  │      📺 YouTube 16:9  ·  90s objetivo  ·  72s actual        │   │    │
│  │  │      [prompting 🔵]  ·  Actualizado hace 2h                │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │  ← bg-card, border, rounded-lg, p-4, hover: bg-hover               │    │
│  │    Click: navega a /project/[id]/video/[videoId]                    │    │
│  │                                                                      │    │
│  │  [⋯] DROPDOWN:                                                      │    │
│  │  ┌──────────────────────────────────┐                               │    │
│  │  │ ▶ Abrir vídeo                    │                               │    │
│  │  │ ── separador ──                  │                               │    │
│  │  │ ✏️ Renombrar                     │ ← click: input inline         │    │
│  │  │ 📋 Duplicar                      │                               │    │
│  │  │ ── separador ──                  │                               │    │
│  │  │ 📝 Cambiar estado ▸             │ ← sub-dropdown:               │    │
│  │  │    ┌─────────────────────┐      │   draft                       │    │
│  │  │    │ draft               │      │   scripting                   │    │
│  │  │    │ scripting           │      │   prompting ✓ (actual)        │    │
│  │  │    │ prompting ✓         │      │   generating                  │    │
│  │  │    │ generating          │      │   review                      │    │
│  │  │    │ review              │      │   completed                   │    │
│  │  │    │ completed           │      │   published                   │    │
│  │  │    │ published           │      │                               │    │
│  │  │    └─────────────────────┘      │                               │    │
│  │  │ ── separador ──                  │                               │    │
│  │  │ 🗑 Eliminar   ← text-red-400    │ → ConfirmDeleteModal          │    │
│  │  └──────────────────────────────────┘                               │    │
│  │                                                                      │    │
│  │  ┌── VideoRow 2 ────────────────────────────────────────────────┐   │    │
│  │  │  📱  Reel TikTok 30s (derivado)                        [⋯]   │   │    │
│  │  │      ░░░░░░░░░░ 0%  ·  0 escenas  ·  [draft ⬜]             │   │    │
│  │  │      📱 TikTok 9:16  ·  30s objetivo                        │   │    │
│  │  │      Derivado de: Presentación                               │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── RECURSOS RÁPIDOS ──────────────────────────────────────────────┐    │
│  │  Personajes                                     [Ver todos →]      │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │    │
│  │  │  JO  │ │  CO  │ │  NE  │ │  RA  │                              │    │
│  │  │ blue │ │purple│ │yellow│ │green │                              │    │
│  │  │ José │ │Conchi│ │Nerea │ │ Raúl │                              │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                              │    │
│  │  Avatar: h-12 w-12 rounded-full, bg-{color}, text-white, text-xs │    │
│  │  Nombre debajo: text-xs text-center truncate                       │    │
│  │  Click: navega a /resources/characters/[id]                        │    │
│  │                                                                      │    │
│  │  Fondos                                         [Ver todos →]      │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                     │    │
│  │  │ 🖼 Fachada │ │ 🖼 Sala    │ │ 🖼 Sala    │                     │    │
│  │  │   exterior │ │  prótesis  │ │  principal │                     │    │
│  │  └────────────┘ └────────────┘ └────────────┘                     │    │
│  │  Thumbnail: h-16 w-24 rounded-lg object-cover                     │    │
│  │  Nombre: text-xs truncate debajo                                   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── ACTIVIDAD ─────────────────────────────────────────────────────┐    │
│  │  (mismo formato que en dashboard, 3-5 entradas recientes)          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/project/[shortId]/video/[videoShortId]` — Overview del vídeo

```
SIDEBAR: Nivel Vídeo (con dropdown de vídeos y "← Proyecto")
HEADER: [≡] Domenech / Presentación Domenech       [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO ────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌───── VIDEO HEADER ──────────────────────────────────────────────────┐    │
│  │  Presentación Domenech — YouTube 90s    [prompting 🔵]  [⋯]       │    │
│  │  ← text-xl font-semibold editable       ← StatusBadge   ← dropdown│    │
│  │    (click → input, blur → save)                                     │    │
│  │                                                                      │    │
│  │  📺 YouTube  ·  16:9  ·  90s objetivo  ·  72s actual               │    │
│  │  ← badges pill text-xs                    ← si >objetivo: text-red │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── ARC BAR (w-full, h-10, rounded-lg, overflow-hidden) ──────────┐    │
│  │                                                                      │    │
│  │  ████ HOOK ████ ████████████ BUILD ████████████ ███ PEAK ████████   │    │
│  │  10s (11%)       36s (40%)                      31s (34%)           │    │
│  │  #EF4444         #EAB308                        #22C55E             │    │
│  │                                                                      │    │
│  │  ████████████████████████████████████████████████ CLOSE ████████   │    │
│  │                                                   13s (15%)         │    │
│  │                                                   #3B82F6           │    │
│  │                                                                      │    │
│  │  Cada sección: inline-block, width proporcional a duración          │    │
│  │  Texto: text-xs font-medium text-white, centrado verticalmente      │    │
│  │  Hover sección: brightness-110 + tooltip con nombre+duración+nº     │    │
│  │  Click sección: filtra escenas a esa fase (añade filtro activo)     │    │
│  │                                                                      │    │
│  │  Debajo: leyenda con 4 dots + labels                               │    │
│  │  ● Hook  ● Build  ● Peak  ● Close                                  │    │
│  │  ← text-xs text-muted, gap-4                                        │    │
│  │                                                                      │    │
│  │  Si no hay arcos: barra gris con "Sin arco narrativo [Generar IA]" │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── TOOLBAR ESCENAS ───────────────────────────────────────────────┐    │
│  │  Escenas (16)                                                       │    │
│  │                                                                      │    │
│  │  [▦ Storyboard] [📋 Lista] [📊 Tabla] [⏱ Timeline]                │    │
│  │  ← tabs: activo bg-card border-teal, inactivo bg-transparent       │    │
│  │                                                                      │    │
│  │  [Todas las fases ▾] [Todos los estados ▾] [Todos los personajes ▾]│    │
│  │  ← selects sm, bg-input, border                                     │    │
│  │                                                                      │    │
│  │  [+ Nueva escena] [🤖 Crear con IA]                                │    │
│  │  ← btn ghost sm    ← btn bg-teal sm                                │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── VISTA STORYBOARD (grid 3 cols, gap-4) ────────────────────────┐    │
│  │                                                                      │    │
│  │  ┌── SceneCard ────────────────┐  ┌── SceneCard ────────────────┐  │    │
│  │  │ ┌────────────────────────┐  │  │ ┌────────────────────────┐  │  │    │
│  │  │ │                        │  │  │ │                        │  │  │    │
│  │  │ │ #1      🖼 THUMBNAIL   │  │  │ │ #4      🖼 THUMBNAIL   │  │  │    │
│  │  │ │ ← badge ↑ 16:9        │  │  │ │                        │  │  │    │
│  │  │ │   black  aspect-video  │  │  │ │                        │  │  │    │
│  │  │ │   absolute             │  │  │ │                        │  │  │    │
│  │  │ │   top-2 left-2         │  │  │ │                        │  │  │    │
│  │  │ │                        │  │  │ │                        │  │  │    │
│  │  │ │ [hook]                 │  │  │ │ [build]                │  │  │    │
│  │  │ │ ← badge absolute      │  │  │ │ ← yellow phase badge   │  │  │    │
│  │  │ │   bottom-2 left-2     │  │  │ │                        │  │  │    │
│  │  │ │   bg-red-500/80 text-xs│  │  │ │                        │  │  │    │
│  │  │ └────────────────────────┘  │  │ └────────────────────────┘  │  │    │
│  │  │                              │  │                              │  │    │
│  │  │  Cold open tijeras           │  │  Equipo completo             │  │    │
│  │  │  ← text-sm font-medium      │  │                              │  │    │
│  │  │                              │  │  📝 "Que se vea al equipo    │  │    │
│  │  │  📝 "Quiero algo ASMR       │  │  profesional junto"          │  │    │
│  │  │  con tijeras"                │  │  ← text-xs italic text-muted │  │    │
│  │  │  ← anotación: text-xs       │  │    max 2 lines truncate      │  │    │
│  │  │    italic text-muted         │  │                              │  │    │
│  │  │    max 2 lines               │  │  8s · [■][+1]               │  │    │
│  │  │                              │  │  ← duration + clip indicator │  │    │
│  │  │  5s · [■]                    │  │    [■] = base clip (purple)  │  │    │
│  │  │  ← text-xs text-muted       │  │    [+1] = 1 extension (blue) │  │    │
│  │  │    [■] = un clip base       │  │                              │  │    │
│  │  │                              │  │  👤JO 👤CO 👤NE 👤RA         │  │    │
│  │  │  [prompt_ready 🟢]          │  │  ← avatar circles 20px       │  │    │
│  │  │  ← StatusBadge mini         │  │    with initials + color     │  │    │
│  │  │                        [⋯]  │  │    max 4, if >4: "+N"       │  │    │
│  │  │                              │  │                              │  │    │
│  │  └──────────────────────────────┘  │  🏔 BG-MAIN                 │  │    │
│  │                                    │  ← text-xs text-muted        │  │    │
│  │  Card: bg-card, border,            │                              │  │    │
│  │  rounded-xl                        │  [prompt_ready 🟢]    [⋯]  │  │    │
│  │  Hover: border-teal,              └──────────────────────────────┘  │    │
│  │  shadow-lg shadow-teal/5                                            │    │
│  │  Click (imagen): → /scene/[id]                                      │    │
│  │  Drag: reorder (sort_order)                                         │    │
│  │                                                                      │    │
│  │  [⋯] SCENE DROPDOWN:                                               │    │
│  │  ┌──────────────────────────────┐                                   │    │
│  │  │ 👁 Ver detalle              │                                   │    │
│  │  │ ✏️ Editar inline            │                                   │    │
│  │  │ ── separador ──             │                                   │    │
│  │  │ 📷 Regenerar imagen         │                                   │    │
│  │  │ 🎬 Regenerar clips          │                                   │    │
│  │  │ 🤖 Mejorar con IA          │                                   │    │
│  │  │ ── separador ──             │                                   │    │
│  │  │ 📋 Duplicar escena          │                                   │    │
│  │  │ ➕ Insertar escena antes     │                                   │    │
│  │  │ ➕ Insertar escena después   │                                   │    │
│  │  │ ── separador ──             │                                   │    │
│  │  │ 📝 Cambiar estado ▸        │                                   │    │
│  │  │ 🔀 Cambiar fase ▸          │                                   │    │
│  │  │ ── separador ──             │                                   │    │
│  │  │ 🗑 Eliminar  ← text-red-400│                                   │    │
│  │  └──────────────────────────────┘                                   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───── ACCIONES RÁPIDAS ──────────────────────────────────────────────┐    │
│  │  [📊 Analizar] [🎙 Narración] [🔄 Derivar] [🔗 Compartir] [📤 Exp]│    │
│  │  ← btns ghost sm, gap-2                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/project/.../video/.../scene/[sceneShortId]` — Detalle escena

```
SIDEBAR: Nivel Vídeo
HEADER: [≡] Domenech / Presentación / Escena 10     [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO (2 columnas: 60% izquierda, 40% derecha, gap-6) ───────────┐
│                                                                           │
│  [← Escenas]  Escena 10: Aplicación de adhesivo  [prompt_ready 🟢]      │
│  ← btn ghost sm link                              ← StatusBadge          │
│                                                                           │
│  ┌──── LEFT PANEL (60%) ──────────────┐ ┌──── RIGHT PANEL (40%) ──────┐ │
│  │                                     │ │                              │ │
│  │ ┌─ INFO ─────────────────────────┐  │ │ ┌─ CÁMARA ───────────────┐  │ │
│  │ │ Título                         │  │ │ │ Ángulo                  │  │ │
│  │ │ [Aplicación de adhesivo    ]   │  │ │ │ [extreme_close_up ▾]   │  │ │
│  │ │ ← input editable, blur→save   │  │ │ │ ← select h-9 bg-input  │  │ │
│  │ │                                │  │ │ │                        │  │ │
│  │ │ Descripción                    │  │ │ │ Movimiento             │  │ │
│  │ │ ┌───────────────────────────┐  │  │ │ │ [static ▾]            │  │ │
│  │ │ │ Plano extremo de las     │  │  │ │ │                        │  │ │
│  │ │ │ manos de Nerea con       │  │  │ │ │ Notas cámara           │  │ │
│  │ │ │ guantes de nitrilo azul  │  │  │ │ │ [Cámara fija extr...]  │  │ │
│  │ │ │ aplicando adhesivo...    │  │  │ │ │ ← input                │  │ │
│  │ │ └───────────────────────────┘  │  │ │ │                        │  │ │
│  │ │ ← textarea, debounce 1500ms   │  │ │ │ Iluminación            │  │ │
│  │ │                                │  │ │ │ [Soft warm overhead..]│  │ │
│  │ │ Anotación del cliente          │  │ │ │                        │  │ │
│  │ │ [🏷 client] "Quiero que esta  │  │ │ │ Mood                   │  │ │
│  │ │ escena transmita la precisión │  │ │ │ [Intimate, precise..]  │  │ │
│  │ │ quirúrgica de Nerea."         │  │ │ │                        │  │ │
│  │ │ ← badge source + text italic  │  │ │ │ IA reasoning           │  │ │
│  │ │   text-muted text-xs          │  │ │ │ "Extreme close-up..."  │  │ │
│  │ │                                │  │ │ │ ← text-xs italic muted│  │ │
│  │ │ Diálogo                        │  │ │ └────────────────────────┘  │ │
│  │ │ ┌───────────────────────────┐  │  │ │                              │ │
│  │ │ │ (sin diálogo)             │  │  │ │ ┌─ PROMPTS ─────────────┐  │ │
│  │ │ └───────────────────────────┘  │  │ │ │ [Imagen] [Vídeo]      │  │ │
│  │ │ ← textarea, placeholder       │  │ │ │ ← tabs, activo: border│  │ │
│  │ │                                │  │ │ │   bottom teal          │  │ │
│  │ │ Notas del director             │  │ │ │                        │  │ │
│  │ │ [ASMR visual puro. El sonido] │  │ │ │ ┌────────────────────┐│  │ │
│  │ │ [debe ser satisfactorio...   ]│  │ │ │ │ Pixar Studios 3D   ││  │ │
│  │ └────────────────────────────────┘  │ │ │ │ animated render,   ││  │ │
│  │                                     │ │ │ │ extreme close-up   ││  │ │
│  │ ┌─ IMAGEN GENERADA ─────────────┐  │ │ │ │ of young woman...  ││  │ │
│  │ │                                │  │ │ │ └────────────────────┘│  │ │
│  │ │ ┌────────────────────────────┐│  │ │ │ ← font-mono text-xs   │  │ │
│  │ │ │                            ││  │ │ │   bg-input border     │  │ │
│  │ │ │   🖼 IMAGEN PREVIEW        ││  │ │ │   rounded-lg p-3     │  │ │
│  │ │ │   aspect-video              ││  │ │ │   max-h-40 overflow-y│  │ │
│  │ │ │   object-contain            ││  │ │ │                        │  │ │
│  │ │ │   rounded-lg                ││  │ │ │ [✏ Editar] [🤖 IA]   │  │ │
│  │ │ │   border                    ││  │ │ │ [📋 Copiar]           │  │ │
│  │ │ │                            ││  │ │ │ ← btns ghost xs       │  │ │
│  │ │ │   Hover: overlay dark/60   ││  │ │ │                        │  │ │
│  │ │ │   con [🔍][💾][🔄]        ││  │ │ │ Extensiones (si hay)  │  │ │
│  │ │ └────────────────────────────┘│  │ │ │ [ext 1]               │  │ │
│  │ │                                │  │ │ │ ┌────────────────────┐│  │ │
│  │ │ [◀ v1] v1 de 2 [v2 ▶]       │  │ │ │ │ Continuing from... ││  │ │
│  │ │ ← text-xs, btns ghost xs      │  │ │ │ └────────────────────┘│  │ │
│  │ │                                │  │ │ └────────────────────────┘  │ │
│  │ │ [🔄 Regenerar imagen]         │  │ │                              │ │
│  │ │ ← btn ghost sm                │  │ │ ┌─ PERSONAJES ───────────┐  │ │
│  │ └────────────────────────────────┘  │ │ │ 👤 Nerea — protagonista│  │ │
│  │                                     │ │ │ ← avatar 24px + nombre │  │ │
│  │ ┌─ CLIPS DE VÍDEO ──────────────┐  │ │ │   + rol en escena      │  │ │
│  │ │                                │  │ │ │ [✏ Cambiar rol] [🗑]  │  │ │
│  │ │ ┌────────────────────────────┐│  │ │ │                        │  │ │
│  │ │ │  ▶ PLAYER                  ││  │ │ │ [+ Añadir personaje]   │  │ │
│  │ │ │  aspect-video bg-black     ││  │ │ │ ← btn ghost sm         │  │ │
│  │ │ │  rounded-lg                ││  │ │ └────────────────────────┘  │ │
│  │ │ │                            ││  │ │                              │ │
│  │ │ │  ━━━━━●━━━━━━ 4/12s       ││  │ │ ┌─ FONDOS ────────────────┐  │ │
│  │ │ └────────────────────────────┘│  │ │ │ 🏔 Sala prótesis — ✓   │  │ │
│  │ │                                │  │ │ │ [✏ Cambiar] [🗑]      │  │ │
│  │ │ Clips:                         │  │ │ │ [+ Añadir fondo]       │  │ │
│  │ │ [■ Base 6s ●] [■ Ext1 6s]    │  │ │ └────────────────────────┘  │ │
│  │ │ ← blocks inline-flex          │  │ │                              │ │
│  │ │   Base: bg-purple-500/20      │  │ │ ┌─ HISTORIAL PROMPTS ────┐  │ │
│  │ │         border-purple-500/30  │  │ │ │ ▸ v2 img — hace 1h (IA)│  │ │
│  │ │   Ext:  bg-blue-500/20       │  │ │ │ ▸ v1 img — hace 3h (man│  │ │
│  │ │         border-blue-500/30    │  │ │ │ ▸ v1 vid — hace 3h (IA)│  │ │
│  │ │   ● = currently playing       │  │ │ │ ← Collapsible list     │  │ │
│  │ │   Click block = play that clip│  │ │ │   click expande prompt │  │ │
│  │ │                                │  │ │ │   completo de esa ver. │  │ │
│  │ │ Total: 12s                     │  │ │ │   [Restaurar] para     │  │ │
│  │ │ [▶ Reproducir todo]           │  │ │ │   usar ese prompt      │  │ │
│  │ │ [🔄 Regenerar clips]          │  │ │ └────────────────────────┘  │ │
│  │ └────────────────────────────────┘  │ │                              │ │
│  │                                     │ │                              │ │
│  └─────────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

Responsive (<1024px): las 2 columnas se convierten en tabs [Info+Media] [Técnico]
```

---

## PANTALLA: `/project/.../video/.../scenes` — Board de escenas (4 vistas)

```
NOTA: Esta página usa el mismo toolbar que el Overview del vídeo pero
SIN el header del vídeo ni el ArcBar. Solo el toolbar + la vista seleccionada.

VISTA TABLA (📊):
┌──────────────────────────────────────────────────────────────────────────┐
│ [☐] │  #  │ Título              │ Dur. │ Fase  │ Personajes │ Estado  │
│─────┼─────┼─────────────────────┼──────┼───────┼────────────┼─────────│
│ [☐] │  1  │ Cold open tijeras   │  5s  │ ●hook │            │  ●ready │
│ [☐] │  2  │ Logo reveal         │  5s  │ ●hook │            │  ●ready │
│ [☐] │  3  │ Fachada exterior    │  6s  │ ●build│            │  ●ready │
│ [☑] │  4  │ Equipo completo     │  8s  │ ●build│ JO CO NE RA│  ●ready │
│ [☑] │  5  │ Estilismo acción    │  6s  │ ●build│ JO CO RA   │  ●ready │
│ ...                                                                     │
│ [☐] │ 16  │ CTA exterior        │  5s  │ ●close│            │  ●ready │
│─────┼─────┼─────────────────────┼──────┼───────┼────────────┼─────────│
│     │TOTAL│                     │ 90s  │       │            │ 20 clips│
├──────────────────────────────────────────────────────────────────────────┤
│ 2 seleccionadas — [✅ Aprobar] [📝 Cambiar estado ▾] [🗑 Eliminar]    │
│ ← Barra de acciones bulk, aparece solo con checkboxes seleccionados    │
│   bg-card, border-t, h-12, sticky bottom                               │
└──────────────────────────────────────────────────────────────────────────┘

Table: bg-card, border, rounded-xl, overflow-hidden
Header: bg-input, text-xs font-medium text-muted, uppercase
Rows: h-10, border-b, hover: bg-hover, click: navega a escena
Fase: ● dot coloreado (8px) + texto
Personajes: avatar circles 20px max 4
Estado: ● dot coloreado (8px)
Sortable headers: click → sort ASC/DESC (icono flecha)

VISTA TIMELINE (⏱):
┌──────────────────────────────────────────────────────────────────────────┐
│  0s      15s       30s       45s       60s       75s     90s            │
│  │        │         │         │         │         │       │             │
│  ├────────┼─────────┼─────────┼─────────┼─────────┼───────┤             │
│                                                                         │
│  ─── HOOK (#EF4444/20) ───                                             │
│  ┌─────┐┌─────┐                                                        │
│  │  1  ││  2  │                                                        │
│  │ 5s  ││ 5s  │                                                        │
│  └─────┘└─────┘                                                        │
│                                                                         │
│  ─── BUILD (#EAB308/20) ──────────────────────────                     │
│  ┌──────┐┌────────┐┌──────┐┌──────┐┌─────┐┌─────┐                     │
│  │  3   ││   4    ││  5   ││  6   ││  7  ││  8  │                     │
│  │ 6s   ││ 8s [+1]││ 6s   ││ 6s   ││ 5s  ││ 5s  │                     │
│  └──────┘└────────┘└──────┘└──────┘└─────┘└─────┘                     │
│                                                                         │
│  ─── PEAK (#22C55E/20) ──────────────────────                          │
│  ┌──┐┌────────┐┌────────┐┌─────┐┌───────┐                             │
│  │9 ││  10    ││  11    ││ 12  ││  13   │                             │
│  │3s││ 8s [+1]││ 8s [+1]││ 5s  ││ 7s [+1]│                            │
│  └──┘└────────┘└────────┘└─────┘└───────┘                             │
│                                                                         │
│  ─── CLOSE (#3B82F6/20) ────────                                       │
│  ┌─────┐┌──┐┌─────┐                                                   │
│  │ 14  ││15││ 16  │                                                   │
│  │ 5s  ││3s││ 5s  │                                                   │
│  └─────┘└──┘└─────┘                                                   │
│                                                                         │
│  Bloques: ancho proporcional a duración. rounded-md.                   │
│  Color: fase color con /20 opacity + border con /40                    │
│  [+1] = tiene extensión (block es más alto, 48px vs 40px)             │
│  Hover: tooltip con título + duración + personajes                     │
│  Click: navega a escena                                                │
│  Drag: reordenar (horizontal)                                          │
│  Scroll: horizontal si vídeo largo                                     │
│  Ctrl+scroll: zoom in/out                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/project/[shortId]/resources/characters` — Personajes

```
SIDEBAR: Nivel Proyecto (Recursos > Personajes activo)
HEADER: [≡] Domenech / Personajes                   [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO ────────────────────────────────────────────────────────────┐
│                                                                          │
│  Personajes (4)                                  [+ Nuevo personaje]    │
│                                                                          │
│  ┌───── GRID (2 cols desktop, 1 col móvil, gap-4) ────────────────┐    │
│  │                                                                  │    │
│  │  ┌── CharacterCard ─────────┐  ┌── CharacterCard ─────────┐    │    │
│  │  │                           │  │                           │    │    │
│  │  │  ┌──────┐                 │  │  ┌──────┐                 │    │    │
│  │  │  │  🔵  │  José           │  │  │  🟣  │  Conchi         │    │    │
│  │  │  │  JO  │  Director       │  │  │  CO  │  Estilista sr.  │    │    │
│  │  │  │64x64 │  · El jefe      │  │  │64x64 │                 │    │    │
│  │  │  └──────┘                 │  │  └──────┘                 │    │    │
│  │  │  ← avatar: rounded-full  │  │                           │    │    │
│  │  │    bg-blue-500 text-white │  │  Mujer cálida, pelo      │    │    │
│  │  │    text-lg font-bold      │  │  rubio rizado, jersey    │    │    │
│  │  │                           │  │  rosa...                  │    │    │
│  │  │  Hombre corpulento, pelo  │  │  ← text-xs text-muted    │    │    │
│  │  │  castaño rojizo peinado   │  │    max 2 lines            │    │    │
│  │  │  hacia atrás...           │  │                           │    │    │
│  │  │  ← text-xs text-muted    │  │  Aparece en: 6 escenas   │    │    │
│  │  │    max 2 lines truncate   │  │  🖼 2 imágenes            │    │    │
│  │  │                           │  │  ← text-xs text-muted    │    │    │
│  │  │  Aparece en: 7 escenas   │  │                     [⋯]  │    │    │
│  │  │  🖼 3 imágenes            │  └───────────────────────────┘    │    │
│  │  │  ← text-xs text-muted    │                                   │    │
│  │  │                     [⋯]  │  Card: bg-card, border, rounded-xl│    │
│  │  └───────────────────────────┘  p-4, hover: border-teal          │    │
│  │                                   Click: → /characters/[id]      │    │
│  │  [⋯] dropdown:                                                   │    │
│  │  👁 Ver detalle | ✏️ Editar | 📋 Duplicar | sep | 🗑 Eliminar   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/project/[shortId]/tasks` — Kanban

```
SIDEBAR: Nivel Proyecto (Tareas activo)
HEADER: [≡] Domenech / Tareas                       [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO ────────────────────────────────────────────────────────────┐
│                                                                          │
│  Tareas    [▦ Kanban] [📋 Lista] [📅 Calendario]   [⏱ Tiempo →] [+ Nueva]│
│                                                                          │
│  ┌─── KANBAN (4 cols, gap-4, overflow-x-auto) ──────────────────────┐  │
│  │                                                                    │  │
│  │ ┌─ PENDIENTE (5) ─┐ ┌─ EN PROGRESO (2)┐ ┌─ REVISIÓN (1)─┐ ┌─ HECHO ┐│
│  │ │ ← text-xs upper  │ │                  │ │                │ │        ││
│  │ │   text-muted      │ │                  │ │                │ │        ││
│  │ │   count en badge │ │                  │ │                │ │        ││
│  │ │                   │ │                  │ │                │ │        ││
│  │ │ ┌── TaskCard ──┐ │ │ ┌── TaskCard ──┐ │ │ ┌─ TaskCard ─┐ │ │        ││
│  │ │ │ Generar      │ │ │ │ Mejorar      │ │ │ │ Revisar    │ │ │        ││
│  │ │ │ prompts      │ │ │ │ escena 3     │ │ │ │ narración  │ │ │        ││
│  │ │ │ escenas 5-8  │ │ │ │              │ │ │ │            │ │ │        ││
│  │ │ │              │ │ │ │ 🟡 medium    │ │ │ │ 🟢 low     │ │ │        ││
│  │ │ │ 🔴 high      │ │ │ │ ✏ prompt     │ │ │ │ 🎙 voice   │ │ │        ││
│  │ │ │ 📸 image_gen │ │ │ │ 👤 DK        │ │ │ │ 👤 DK      │ │ │        ││
│  │ │ │ 👤 DK        │ │ │ └──────────────┘ │ │ └────────────┘ │ │        ││
│  │ │ │ 📅 25 mar    │ │ │                  │ │                │ │        ││
│  │ │ │ ⏱ ~2h        │ │ │                  │ │                │ │        ││
│  │ │ └──────────────┘ │ │                  │ │                │ │        ││
│  │ │                   │ │                  │ │                │ │        ││
│  │ │ ┌── TaskCard ──┐ │ │                  │ │                │ │        ││
│  │ │ │ Generar      │ │ │                  │ │                │ │        ││
│  │ │ │ clips E10    │ │ │                  │ │                │ │        ││
│  │ │ │ 🟡 medium    │ │ │                  │ │                │ │        ││
│  │ │ │ 🎬 video_gen │ │ │                  │ │                │ │        ││
│  │ │ └──────────────┘ │ │                  │ │                │ │        ││
│  │ └───────────────────┘ └──────────────────┘ └────────────────┘ └────────┘│
│  │                                                                    │  │
│  │ Columna: min-w-64, bg-input/30, rounded-xl, p-2                   │  │
│  │ Header: h-8, flex justify-between, text-xs text-muted uppercase   │  │
│  │ TaskCard: bg-card, border, rounded-lg, p-3, hover: border-teal    │  │
│  │ Drag: entre columnas (cambia status) y dentro (cambia order)      │  │
│  │ Click en card: abre Sheet lateral derecho con detalle completo     │  │
│  │                                                                    │  │
│  │ TaskCard contenido:                                                │  │
│  │   Título: text-sm font-medium, max 2 lines                       │  │
│  │   Prioridad: ● dot 6px (🔴red 🟡amber 🟢green) + text-xs        │  │
│  │   Categoría: badge pill bg-{color}/10 text-{color} text-xs       │  │
│  │   Asignado: avatar 20px                                           │  │
│  │   Fecha: text-xs text-muted. Si vencida: text-red-400            │  │
│  │   Estimado: text-xs text-muted                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/project/[shortId]/settings/ai` — Config IA

```
SIDEBAR: Nivel Proyecto (Ajustes > IA y Agente activo)

┌─── CONTENIDO ────────────────────────────────────────────────────────────┐
│                                                                          │
│  Configuración de IA                                                     │
│                                                                          │
│  ┌───── DIRECTOR IA (bg-card, border, rounded-xl, p-6) ───────────┐    │
│  │                                                                  │    │
│  │  Tipo de director                                                │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ 🎬 Director Pixar 3D                              [▾]   │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ← select h-10 bg-input border rounded-lg                      │    │
│  │  Opciones: Pixar 3D, Realista, Anime, Comedia, Publicitario,  │    │
│  │  Artístico. Cada opción tiene icono + descripción breve        │    │
│  │  Al cambiar: genera nuevo system prompt automáticamente         │    │
│  │                                                                  │    │
│  │  System prompt                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ Eres Kiyoko, una directora de vídeo de animación 3D     │   │    │
│  │  │ estilo Pixar Studios. Trabajas para Domenech             │   │    │
│  │  │ Peluquerías, una peluquería familiar de alta gama        │   │    │
│  │  │ especializada en prótesis capilares.                     │   │    │
│  │  │                                                          │   │    │
│  │  │ Tu rol es dirigir la creación de vídeos promocionales    │   │    │
│  │  │ con estas directrices:                                   │   │    │
│  │  │ - ESTILO VISUAL: Pixar Studios 3D animation...           │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ← textarea min-h-40 font-mono text-xs bg-input border         │    │
│  │    rounded-lg. Editable libremente.                             │    │
│  │                                                                  │    │
│  │  Tono                              Idioma                       │    │
│  │  [warm_professional ▾]             [Español ▾]                  │    │
│  │  ← select h-9 w-48                ← select h-9 w-36            │    │
│  │                                                                  │    │
│  │  Creatividad                                                     │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━●━━━━━━  0.8                              │    │
│  │  Conservador     Equilibrado     Creativo                       │    │
│  │  ← slider: track bg-zinc-700, fill bg-teal, thumb bg-teal      │    │
│  │    h-2 rounded-full. Value: text-sm font-mono ml-2             │    │
│  │    Labels: text-xs text-muted, flex justify-between             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌───── GENERADORES (bg-card, border, rounded-xl, p-6) ───────────┐    │
│  │                                                                  │    │
│  │  Imagen                                                          │    │
│  │  Proveedor: [Grok Aurora ▾]                                     │    │
│  │                                                                  │    │
│  │  Vídeo                                                           │    │
│  │  Proveedor: [Grok ▾]                                            │    │
│  │  Duración base: [6 ▾] seg   ☑ Extensiones   Ext. duración: [6] │    │
│  │                                                                  │    │
│  │  TTS (narración)                                                 │    │
│  │  Proveedor: [ElevenLabs ▾]  Modelo: [eleven_multilingual_v2 ▾]  │    │
│  │                                                                  │    │
│  │  Visión (análisis de imágenes)                                   │    │
│  │  Proveedor: [OpenAI ▾]  Modelo: [gpt-4o ▾]                      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│                                                      [💾 Guardar]       │
│                                                      ← btn bg-teal h-10│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PANTALLA: `/settings/api-keys` — API Keys

```
SIDEBAR: Nivel Dashboard
HEADER: [≡] Ajustes / API Keys                      [🏠][⚙][🔔][💬][DK]

┌─── CONTENIDO ────────────────────────────────────────────────────────────┐
│                                                                          │
│  Tabs: [Perfil] [API Keys ←activo] [Suscripción] [Notificaciones]      │
│  ← tabs: activo border-b-2 border-teal text-foreground                  │
│          inactivo text-muted hover:text-foreground                       │
│                                                                          │
│  Mis API Keys                                      [+ Añadir key]       │
│                                                     ← btn bg-teal sm    │
│                                                                          │
│  ┌── KeyCard ──────────────────────────────────────────────────────┐    │
│  │  🟢 OpenAI                                         ...xK4m     │    │
│  │  ← dot 8px bg-green-500    ← text-base font-medium  ← hint    │    │
│  │                                                                  │    │
│  │  Gasto: $12.34 / $50.00 este mes                               │    │
│  │  ▓▓▓▓▓▓░░░░░░░░░░░░░░░ 25%                                    │    │
│  │  ← progress bar h-1.5 bg-zinc-800 fill bg-teal                 │    │
│  │                                                                  │    │
│  │  Requests: 847  ·  Última vez: hace 2h                         │    │
│  │  ← text-xs text-muted                                           │    │
│  │                                                                  │    │
│  │  [🔍 Probar]  [✏ Editar]  [🗑 Eliminar]                        │    │
│  │  ← btns ghost xs                                                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│  ← bg-card, border, rounded-xl, p-4                                     │
│                                                                          │
│  ┌── KeyCard (error) ──────────────────────────────────────────────┐    │
│  │  🔴 Grok                                           ...m2Wx     │    │
│  │  ← dot bg-red-500                                               │    │
│  │                                                                  │    │
│  │  Error: Invalid API key (hace 1h)                               │    │
│  │  ← text-sm text-red-400                                         │    │
│  │                                                                  │    │
│  │  [🔍 Probar]  [✏ Editar]  [🗑 Eliminar]                        │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌── ADD KEY MODAL ────────────────────────────────────────────────┐    │
│  │  (se abre al pulsar "+ Añadir key")                             │    │
│  │                                                                  │    │
│  │  Añadir API Key                                                 │    │
│  │                                                                  │    │
│  │  Proveedor                                                       │    │
│  │  [OpenAI ▾]                                                     │    │
│  │  ← select con opciones: OpenAI, Anthropic, Grok, ElevenLabs,   │    │
│  │    Stability, DeepSeek, Groq, Mistral, Gemini                   │    │
│  │                                                                  │    │
│  │  API Key                                                         │    │
│  │  [sk-proj-xxxxxxxxxxxx...              ] [👁]                   │    │
│  │  ← input type=password, toggle visibility con 👁                │    │
│  │                                                                  │    │
│  │  Límite mensual ($)                                              │    │
│  │  [$] [50                              ]                         │    │
│  │  ← input con prefix "$"                                         │    │
│  │                                                                  │    │
│  │  [Cancelar]                              [Guardar]              │    │
│  │                                           ← bg-teal             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## SEARCH MODAL (⌘K) — Se abre desde cualquier pantalla

```
Backdrop: bg-black/60, backdrop-blur-sm
Modal: max-w-2xl, mx-auto, mt-[20vh]

┌──────────────────────────────────────────────────────────────────────┐
│  🔍  Buscar proyectos, vídeos, escenas, personajes...               │
│  ← input h-12 text-base bg-transparent border-0 focus:ring-0        │
│     placeholder: text-muted                                          │
│  ← Filtros debajo del input:                                         │
│  [Aa Solo título] [👤 Creado por ▾] [📁 En ▾] [+ Filtro]           │
│  ← btns ghost xs                                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ─── Sin query: Navegación rápida ───                               │
│                                                                      │
│  🏠 Dashboard                                                        │
│  📅 Publicaciones                                                    │
│  ⚙️ Ajustes                                                         │
│  🔑 API Keys                                                        │
│  ← cada item: h-10, px-3, hover: bg-hover, click: navega           │
│                                                                      │
│  ─── Con query: Resultados agrupados ───                            │
│                                                                      │
│  PROYECTOS                                                           │
│  📁 Domenech Peluquerías                                             │
│     Domenech Peluquerías ← text-xs text-muted                       │
│                                                                      │
│  VÍDEOS                                                              │
│  🎬 Presentación Domenech — YouTube 90s                              │
│     Domenech Peluquerías ← proyecto padre                            │
│                                                                      │
│  ESCENAS                                                             │
│  🎞 #10 Aplicación de adhesivo                                       │
│     Presentación Domenech                                            │
│                                                                      │
│  PERSONAJES                                                          │
│  👤 Nerea                                                            │
│     Esp. prótesis · Domenech Peluquerías                            │
│                                                                      │
│  ← Cada grupo tiene header text-xs text-muted uppercase             │
│  ← Cada resultado: h-12, hover: bg-hover, click: navega + cierra   │
│  ← Preview card a la derecha del resultado seleccionado:             │
│     bg-card, border, rounded-xl, p-4, muestra título + icono grande │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Ctrl+↵ Abrir en nueva pestaña                               [⚙]  │
│  ← text-xs text-muted, footer del modal                             │
└──────────────────────────────────────────────────────────────────────┘

Keyboard: ↑↓ navegar, Enter seleccionar, Esc cerrar
```

---

## RESPONSIVE — Breakpoints

```
MÓVIL (<768px):
  Sidebar: hidden, hamburger ☰ abre como Sheet desde izquierda (w-[280px])
  Header: ☰ + "Kiyoko AI" centrado + 🔔 + 💬
  Grid proyectos: 1 columna
  Grid escenas: 1 columna (storyboard), scroll horizontal (timeline)
  Scene detail: 1 columna con tabs [Info+Media] [Técnico]
  Chat: bottom sheet 85vh con drag handle
  Kanban: scroll horizontal entre columnas
  Stats: 2x2 grid

TABLET (768-1024px):
  Sidebar: colapsada 64px (solo iconos + tooltips)
  Grid proyectos: 2 columnas
  Grid escenas: 2 columnas
  Scene detail: 2 columnas (50/50)
  Chat: panel fijo 300px (no resizable)

DESKTOP (>1024px):
  Sidebar: expandida 240px
  Grid proyectos: 3 columnas
  Grid escenas: 3 columnas (storyboard)
  Scene detail: 2 columnas (60/40)
  Chat: panel resizable 300-600px
```
