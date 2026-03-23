# Kiyoko AI — Diseño Detallado: Parte 1 — Dashboard y Entrada a la App

---

## 1. Tres niveles de menú

La app tiene 3 niveles de sidebar que cambian automáticamente según la ruta:

```
NIVEL 1: Dashboard           NIVEL 2: Proyecto             NIVEL 3: Vídeo
(cuando estás en /dashboard,  (cuando estás en              (cuando estás en
 /new, /settings, /admin)     /project/[shortId]/*)         /project/.../video/[vid]/*)

┌─────────────────┐          ┌─────────────────┐           ┌─────────────────┐
│ 🌿 Kiyoko AI    │          │ 🌿 Kiyoko AI    │           │ 🌿 Kiyoko AI    │
│                  │          │    ← Dashboard   │           │    ← Proyecto    │
│ NAVEGACIÓN       │          │                  │           │                  │
│ ◻ Dashboard      │          │ PROYECTO         │           │ VÍDEO            │
│ 📂 Compartidos   │          │ ◻ Vista general  │           │ [🎬 Nombre ▾]    │
│ 📅 Publicaciones │          │ 🎬 Vídeos        │           │                  │
│                  │          │ 🎨 Recursos   ▸  │           │ ◻ Overview       │
│ PROYECTOS        │          │ 📱 Publicaciones │           │ ▦ Escenas        │
│ ■ Domenech       │          │ ✅ Tareas        │           │ ⏱ Timeline       │
│ ■ Otro proy.     │          │ 📋 Actividad     │           │ 🎙 Narración     │
│ + Nuevo          │          │                  │           │ 📊 Análisis      │
│                  │          │ AJUSTES          │           │ 🔗 Compartir     │
│ ADMIN            │          │ ⚙️ General       │           │ 📤 Exportar      │
│ 📊 Panel admin   │          │ 🤖 IA y Agente   │           │                  │
│ 👥 Usuarios      │          │ 👥 Colaboradores │           │                  │
│                  │          │                  │           │                  │
│ CUENTA           │          │ 💬 Chat IA       │           │ 💬 Chat IA       │
│ ⚙️ Ajustes       │          │                  │           │                  │
│ 🏢 Organizaciones│          │                  │           │                  │
│                  │          │                  │           │                  │
│ ┌──────────┐    │          │ ┌──────────┐    │           │ ┌──────────┐    │
│ │👤 DK     │    │          │ │👤 DK     │    │           │ │👤 DK     │    │
│ │dev@kiy.. │    │          │ │dev@kiy.. │    │           │ │dev@kiy.. │    │
│ └──────────┘    │          │ └──────────┘    │           │ └──────────┘    │
└─────────────────┘          └─────────────────┘           └─────────────────┘
```

### Nivel 2 — Sub-menú "Recursos" expandible

Cuando el usuario pulsa "🎨 Recursos" en el sidebar del proyecto, se expande inline (NO navega):

```
│ 🎨 Recursos   ▾  │  ← Click expande/colapsa
│    ├ 📦 Todos     │  /project/[id]/resources
│    ├ 👤 Personajes│  /project/[id]/resources/characters
│    ├ 🏔 Fondos    │  /project/[id]/resources/backgrounds
│    ├ 🎨 Estilos   │  /project/[id]/resources/styles
│    └ 📝 Templates │  /project/[id]/resources/templates
```

El item activo se resalta con fondo `surface-hover` + borde izquierdo `kiyoko-teal` de 2px.

### Transiciones entre niveles

```
Dashboard → Proyecto:
  Al hacer click en un proyecto, la URL cambia a /project/[shortId].
  El sidebar NIVEL 1 se desliza hacia la izquierda y NIVEL 2 entra desde la derecha.
  Animación: 200ms ease-out.
  Arriba del sidebar aparece "← Dashboard" como link para volver.

Proyecto → Vídeo:
  Al hacer click en un vídeo, la URL cambia a /project/[shortId]/video/[videoShortId].
  El sidebar NIVEL 2 se desliza hacia la izquierda y NIVEL 3 entra desde la derecha.
  Arriba aparece "← Proyecto" para volver.

Volver:
  "← Dashboard" navega a /dashboard, restaura NIVEL 1.
  "← Proyecto" navega a /project/[shortId], restaura NIVEL 2.
```

### Sidebar colapsado (64px)

Cuando el usuario pulsa el botón de colapsar (en el borde inferior del sidebar) o usa ⌘B:

```
┌──────┐
│  🌿  │  ← Logo solo icono
│      │
│  ◻  │  ← Solo iconos, tooltip en hover con el nombre
│  🎬  │
│  🎨  │
│  📱  │
│  ✅  │
│  📋  │
│      │
│  ⚙️  │
│  🤖  │
│  👥  │
│      │
│  💬  │
│      │
│ ┌──┐ │
│ │DK│ │  ← Solo iniciales
│ └──┘ │
└──────┘
```

Cada icono tiene tooltip al hacer hover: `<Tooltip side="right">Vídeos</Tooltip>`.
Al hacer click en un icono, navega directamente.

---

## 2. Pantalla `/dashboard` — Listado de proyectos

### Carga de datos

```
¿Cuándo se carga?
  - Al hacer login (redirect a /dashboard)
  - Al pulsar 🏠 en el header
  - Al cambiar de organización en el dropdown del header
  - Al volver desde un proyecto (← Dashboard)

¿De dónde?
  - page.tsx (Server Component) hace prefetch:
    queryKey: ['projects', orgId]
    queryFn: SELECT * FROM projects WHERE owner_id = auth.uid() OR id IN (SELECT project_id FROM project_shares WHERE shared_with_user = auth.uid()) ORDER BY updated_at DESC

¿Cuándo se refresca?
  - TanStack Query: staleTime 30s, refetchOnWindowFocus
  - Al crear/eliminar un proyecto: invalidateQueries(['projects'])
  - Supabase Realtime: NO (los proyectos no cambian en tiempo real, no es crítico)
```

### Encabezado de la página

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Buenos días, Desarrollador 👋                                   │
│  ← Saludo dinámico: "Buenos días/tardes/noches" + full_name     │
│     Si no hay full_name, usa "Hola"                             │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │     12       │ │      5       │ │    2.5h      │ │   847    ││
│  │  Proyectos   │ │   Tareas     │ │   Trabajado  │ │  Tokens  ││
│  │              │ │  pendientes  │ │     hoy      │ │ este mes ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│                                                                  │
│  ← 4 tarjetas de stats en una fila.                             │
│     Fondo: surface-card. Borde: border.                         │
│     Número: text-2xl font-bold.                                 │
│     Label: text-xs text-muted.                                  │
│     Click en "Tareas pendientes" → navega a último proyecto /tasks│
│     Click en "Tokens este mes" → navega a /settings/api-keys    │
└──────────────────────────────────────────────────────────────────┘
```

### Barra de filtros y acciones

```
┌──────────────────────────────────────────────────────────────────┐
│  Proyectos                                                       │
│                                                                  │
│  [Todos ▾]  [🔍 Buscar proyecto...]  [Recientes ▾]  [+ Nuevo ▸]│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

[Todos ▾] Dropdown filtro de estado:
  ├── Todos (default)
  ├── En progreso
  ├── Completados
  ├── Archivados
  ├── ── separador ──
  └── ⭐ Favoritos
  Selección: actualiza useFilterStore.statusFilter.
  Persistido en Zustand (localStorage).

[🔍 Buscar proyecto...] Input de búsqueda:
  - Placeholder: "Buscar proyecto..."
  - Filtra en CLIENTE: por title y client_name simultáneamente.
  - Debounce: 300ms.
  - Icono 🔍 a la izquierda, X para limpiar a la derecha (aparece solo si hay texto).
  - Actualiza useFilterStore.searchQuery.

[Recientes ▾] Dropdown de ordenación:
  ├── Recientes (updated_at DESC) — default
  ├── Más antiguos (updated_at ASC)
  ├── Nombre A-Z (title ASC)
  ├── Nombre Z-A (title DESC)
  ├── Progreso ↑ (completion_percentage ASC)
  └── Progreso ↓ (completion_percentage DESC)
  Actualiza useFilterStore.sortBy.

[+ Nuevo ▸] Botón primario (fondo kiyoko-teal):
  Navega a /new (página de crear proyecto).
  Icono + a la izquierda del texto.
```

### Grid de proyectos

```
Layout: CSS Grid, responsive.
  - Desktop (>1024px): 3 columnas
  - Tablet (768-1024px): 2 columnas
  - Móvil (<768px): 1 columna
Gap: 16px (gap-4).
```

### ProjectCard — Componente detallado

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │        PORTADA / IMAGEN             ││  ← aspect-video (16:9)
│  │        (cover_image_url)            ││     Si no hay imagen: gradiente generado
│  │                                     ││     a partir de color_palette del proyecto.
│  │                              ⭐     ││  ← FavoriteButton (esquina sup. derecha)
│  │                                     ││     Click: toggle con optimistic update.
│  └─────────────────────────────────────┘│     Rellena ⭐ si es favorito, outline si no.
│                                         │
│  Domenech Peluquerías                   │  ← title: font-medium, text-sm, max 2 líneas
│  Domenech Peluquerías                   │  ← client_name: text-xs, text-muted
│                                         │
│  ┌─ Progreso ─────────────────────────┐│
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  65%     ││  ← Barra de progreso
│  └────────────────────────────────────┘│     Color: kiyoko-teal
│                                         │     Texto %: text-xs text-muted a la derecha
│                                         │
│  ┌──────┐  ┌──────────┐  ┌───────┐    │
│  │📺 YT │  │in_progress│  │🎞 16  │    │
│  └──────┘  └──────────┘  └───────┘    │
│  ← Plataforma  ← Estado      ← Total escenas
│  Badge con       StatusBadge    text-xs text-muted
│  icono+texto     coloreado
│                                         │
│                                 [⋯]    │  ← Botón 3 puntos (esquina inf. derecha)
└─────────────────────────────────────────┘

Hover sobre la tarjeta:
  - border cambia a kiyoko-teal (border-kiyoko-teal)
  - Sombra: shadow-lg shadow-kiyoko-teal/5
  - Cursor: pointer
  - Transición: 150ms

Click en la tarjeta (fuera del ⭐ y ⋯):
  Navega a /project/[shortId]
```

### Menú de 3 puntos [⋯] del ProjectCard

```
Click en [⋯] → Dropdown posición bottom-end:

┌────────────────────────┐
│ 📂 Abrir proyecto      │  → Navega a /project/[shortId]
│ ── separador ──        │
│ ✏️ Editar              │  → Navega a /project/[shortId]/settings
│ 📋 Duplicar            │  → Crea copia del proyecto (confirma primero)
│ 📤 Exportar            │  → Navega a /project/[shortId]/videos (primer vídeo /export)
│ ── separador ──        │
│ 📦 Archivar            │  → Cambia status a 'archived' (optimistic)
│ ── separador ──        │
│ 🗑 Eliminar            │  → Abre ConfirmDeleteModal
└────────────────────────┘

Si el proyecto está archivado, "Archivar" se reemplaza por "Desarchivar".
```

### ConfirmDeleteModal (patrón reutilizable)

```
┌─────────────────────────────────────────────┐
│                                             │
│  🗑 Eliminar proyecto                       │
│                                             │
│  Esta acción no se puede deshacer.          │
│  Se eliminarán todos los vídeos, escenas,   │
│  personajes, fondos y publicaciones del     │
│  proyecto.                                  │
│                                             │
│  Escribe el nombre del proyecto para        │
│  confirmar:                                 │
│                                             │
│  [                                    ]     │
│  ← Placeholder: "Domenech Peluquerías"      │
│                                             │
│  [Cancelar]              [Eliminar]         │
│                           ↑                 │
│                    Botón deshabilitado       │
│                    (opacity-50, cursor-not)  │
│                    hasta que el texto        │
│                    coincida EXACTAMENTE      │
│                    con el nombre.            │
│                                             │
│                    Cuando coincide:          │
│                    bg-red-600 hover:bg-red-700│
│                    text-white                │
│                                             │
└─────────────────────────────────────────────┘

Al pulsar Eliminar (cuando está activo):
  1. Botón muestra spinner + "Eliminando..."
  2. useMutation DELETE con optimistic (quita de la lista)
  3. Toast: "Proyecto eliminado"
  4. Modal se cierra
  5. Si falla: rollback + toast error
```

### Estado vacío del dashboard

```
Si no hay proyectos (después de filtrar o realmente vacío):

┌─────────────────────────────────────────────┐
│                                             │
│              🎬                              │
│                                             │
│      No tienes proyectos todavía            │  ← Si realmente vacío
│                                             │
│   Crea tu primer proyecto y empieza a       │
│   producir vídeos con IA.                   │
│                                             │
│         [+ Crear proyecto]                  │  ← Botón primario kiyoko-teal
│                                             │
└─────────────────────────────────────────────┘

Si hay proyectos pero el filtro no devuelve nada:

┌─────────────────────────────────────────────┐
│              🔍                              │
│                                             │
│   No se encontraron proyectos               │
│   con estos filtros.                        │
│                                             │
│         [Limpiar filtros]                   │  ← Resetea filtros
└─────────────────────────────────────────────┘
```

### Actividad reciente (debajo del grid)

```
Actividad reciente                    [Ver toda →]
─────────────────────────────────────────────────
👤 María editó la Escena 3 en Domenech     5 min
🤖 IA generó análisis del vídeo Present.   1h
👤 Tú creaste 3 escenas nuevas             2h
👤 Tú creaste el proyecto "Otro proy..."   1 día

← Máximo 5 entradas.
← Cada entrada: icono (👤 usuario o 🤖 IA) + texto + tiempo relativo.
← Click en la entrada: navega a la entidad (proyecto/vídeo/escena).
← [Ver toda →] navega a /project/[shortId]/activity del último proyecto activo.
← Fuente: activity_log, últimas 5 del usuario, ORDER BY created_at DESC.
```

---

## 3. Pantalla `/dashboard/shared` — Proyectos compartidos

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Proyectos compartidos conmigo                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🖼                                                          ││
│  │ Proyecto de María             Compartido por: María López   ││
│  │ Cliente: Restaurante La Luna  Mi rol: editor                ││
│  │ Compartido: 15 mar 2025       Estado: in_progress           ││
│  │                                                             ││
│  │ [Abrir proyecto]                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Si no hay compartidos:                                          │
│  "No tienes proyectos compartidos. Cuando alguien comparta      │
│   un proyecto contigo, aparecerá aquí."                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Carga: SELECT ps.*, p.* FROM project_shares ps
       JOIN projects p ON p.id = ps.project_id
       WHERE ps.shared_with_user = auth.uid()
       ORDER BY ps.created_at DESC
```

---

## 4. Pantalla `/dashboard/publications` — Calendario global

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Publicaciones programadas          [◀ Marzo 2025 ▶]            │
│                                                                  │
│  Filtrar: [Todos los proyectos ▾] [Todas las redes ▾]           │
│                                                                  │
│  ┌────┬────┬────┬────┬────┬────┬────┐                           │
│  │ Lun│ Mar│ Mié│ Jue│ Vie│ Sáb│ Dom│                           │
│  ├────┼────┼────┼────┼────┼────┼────┤                           │
│  │    │    │    │    │    │  1 │  2 │                           │
│  ├────┼────┼────┼────┼────┼────┼────┤                           │
│  │  3 │  4 │  5 │  6 │  7 │  8 │  9 │                           │
│  ├────┼────┼────┼────┼────┼────┼────┤                           │
│  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │ 16 │                           │
│  │    │ 📷 │    │    │    │    │    │  ← Dot con color del      │
│  │    │ 🟢 │    │    │    │    │    │     proyecto               │
│  ├────┼────┼────┼────┼────┼────┼────┤                           │
│  │ 17 │ 18 │ 19 │ 20 │ 21 │ 22 │ 23 │                           │
│  │    │    │    │ 📍 │    │    │    │  ← 📍 = hoy               │
│  ├────┼────┼────┼────┼────┼────┼────┤                           │
│  │ 24 │ 25 │ 26 │ 27 │ 28 │ 29 │ 30 │                           │
│  │    │📷🎵│    │    │ 📷 │    │    │  ← Múltiples dots = varias│
│  └────┴────┴────┴────┴────┴────┴────┘     publicaciones ese día │
│                                                                  │
│  Click en día con publicación → muestra detalle debajo:          │
│                                                                  │
│  25 de marzo:                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📷 Transformación capilar — @domenech.peluquerias       │    │
│  │    Proyecto: Domenech | 📷 Instagram | 10:00 | 🟡 progr.│    │
│  │    [Abrir publicación]                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎵 VUELVE A BRILLAR — @domenech.peluquerias            │    │
│  │    Proyecto: Domenech | 🎵 TikTok | 12:00 | 🔵 borrador│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Carga: SELECT pub.*, sp.platform, sp.account_name, p.title as project_title
       FROM publications pub
       JOIN social_profiles sp ON sp.id = pub.social_profile_id
       JOIN projects p ON p.id = pub.project_id
       WHERE p.owner_id = auth.uid()
       AND pub.scheduled_at BETWEEN month_start AND month_end
       ORDER BY pub.scheduled_at
```

---

## 5. Pantalla `/new` — Crear proyecto

### Wizard de 4 pasos

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Crear nuevo proyecto                                            │
│                                                                  │
│  ● Información  ○ Estilo  ○ IA  ○ Resumen                      │
│  ━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░                       │
│  ← Stepper: 4 pasos, el activo relleno, los demás outline.     │
│     Barra de progreso debajo (25%, 50%, 75%, 100%).             │
│                                                                  │
│  ┌─── Toggle ───────────────────────────────────────────────┐   │
│  │  [✏️ Manual]  [🤖 Crear con IA]                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  PASO 1: Información                                             │
│                                                                  │
│  Título del proyecto *                                           │
│  [Domenech Peluquerías                        ]                 │
│                                                                  │
│  Descripción                                                     │
│  [Vídeo promocional para peluquería familiar...  ]              │
│  ← textarea, 3 líneas min                                       │
│                                                                  │
│  Cliente                                                         │
│  [Domenech Peluquerías            ]                             │
│                                                                  │
│  Tags (separados por coma)                                       │
│  [peluquería, pixar, YouTube       ]                            │
│                                                                  │
│                               [Siguiente →]                     │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  PASO 2: Estilo visual                                           │
│                                                                  │
│  Estilo de animación                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ 🟡       │ │ 📷       │ │ 🎌       │                        │
│  │  Pixar   │ │ Realista │ │  Anime   │                        │
│  │  ✓       │ │          │ │          │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 🎨       │ │ 🏙       │ │ ⬛       │ │ ✏️       │          │
│  │Watercolor│ │Cyberpunk │ │ Flat 2D  │ │ Custom   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ← Tarjetas seleccionables. La activa tiene borde kiyoko-teal  │
│     + check ✓ en esquina. Si elige Custom, aparece textarea.   │
│                                                                  │
│  Paleta de colores (opcional)                                    │
│  [#C8A96E] [#E8943A] [#F5EDD8] [+]                             │
│  ← ColorPicker por cada color. [+] añade otro (max 6).         │
│                                                                  │
│                    [← Anterior]  [Siguiente →]                  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  PASO 3: Configuración de IA                                     │
│                                                                  │
│  Se genera automáticamente un Director de IA según el estilo     │
│  elegido. El usuario puede modificarlo aquí o después en         │
│  ajustes.                                                        │
│                                                                  │
│  Tipo de director: [🎬 Director Pixar 3D ▾]                     │
│                                                                  │
│  Generador de imágenes: [Grok Aurora ▾]                          │
│  Generador de vídeos: [Grok ▾]                                   │
│  Duración de clip: [6 ▾] segundos                                │
│  Narrador TTS: [ElevenLabs ▾]                                    │
│                                                                  │
│  ℹ️ Puedes cambiar estos ajustes en cualquier momento desde      │
│     Ajustes > IA y Agente.                                       │
│                                                                  │
│                    [← Anterior]  [Siguiente →]                  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  PASO 4: Resumen                                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Título: Domenech Peluquerías                            │    │
│  │ Cliente: Domenech Peluquerías                           │    │
│  │ Estilo: Pixar 3D                                        │    │
│  │ Director IA: Director Pixar 3D                          │    │
│  │ Generador imagen: Grok Aurora                           │    │
│  │ Generador vídeo: Grok (6s clips)                        │    │
│  │ TTS: ElevenLabs                                         │    │
│  │ Tags: peluquería, pixar, YouTube                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                    [← Anterior]  [🚀 Crear proyecto]            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Al pulsar "Crear proyecto":
  1. Botón muestra spinner + "Creando..."
  2. useMutation INSERT en projects + project_ai_settings + project_ai_agents
  3. Genera short_id con nanoid(12)
  4. Toast: "Proyecto creado"
  5. Navega automáticamente a /project/[shortId]
  6. invalidateQueries(['projects'])
```

### Si elige "🤖 Crear con IA"

El wizard se reemplaza por un chat:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Crear proyecto con IA                                           │
│                                                                  │
│  🤖 ¡Hola! Cuéntame sobre el proyecto que quieres crear.        │
│     ¿Para quién es? ¿Qué tipo de vídeo necesitas? ¿Qué         │
│     estilo visual imaginas?                                      │
│                                                                  │
│                                                                  │
│                                                                  │
│  [Escribe aquí...]                                      [➤]    │
│                                                                  │
│  Sugerencias:                                                    │
│  [Vídeo para peluquería] [Anuncio de restaurante]               │
│  [Reel de producto] [Tutorial animado]                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

La IA hace preguntas y al tener suficiente info, genera el proyecto
completo (incluyendo personajes, fondos, vídeo con escenas).
Muestra un resumen y pide confirmación antes de crear.
```

---

## 6. Pantalla `/settings` — Ajustes del usuario

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Ajustes de cuenta                                               │
│                                                                  │
│  Tabs: [Perfil] [API Keys] [Suscripción] [Notificaciones]      │
│                                                                  │
│  ═══ Tab: Perfil ═══════════════════════════════════════════     │
│                                                                  │
│  Avatar                                                          │
│  ┌──────┐                                                        │
│  │  DK  │  [Cambiar foto]                                        │
│  │      │  ← Click: file picker → crop → upload a Storage       │
│  └──────┘     Formatos: jpg, png, webp. Max 2MB.                │
│                                                                  │
│  Nombre completo                                                 │
│  [Desarrollador Kiyoko            ]                             │
│                                                                  │
│  Email                                                           │
│  [dev@kiyoko.ai                   ]  (no editable, gris)       │
│                                                                  │
│  Bio                                                             │
│  [Cuenta principal de desarrollo...  ]                          │
│                                                                  │
│  Empresa                                                         │
│  [Kiyoko AI                       ]                             │
│                                                                  │
│  Tema                                                            │
│  [🌙 Oscuro] [☀️ Claro] [💻 Sistema]                             │
│  ← 3 botones toggle, el activo con borde kiyoko-teal.           │
│     Cambia instantáneamente (Zustand + class en html).           │
│                                                                  │
│  Idioma                                                          │
│  [Español ▾]                                                     │
│                                                                  │
│                                          [💾 Guardar cambios]   │
│                                                                  │
│  ── Zona peligrosa ──                                            │
│  [Eliminar cuenta]  ← Abre ConfirmDeleteModal con email         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Header — Comportamiento detallado de switchers

### Al cambiar organización

```
1. Usuario pulsa [🏢 Org ▾] → selecciona "Estudio Creativo"
2. useOrgStore.setState({ currentOrg: newOrg })
3. queryClient.invalidateQueries({ queryKey: ['projects'] })
4. router.push('/dashboard')
5. El sidebar vuelve a NIVEL 1
6. Se resetea: useProjectStore → null, useActiveVideoStore → null
7. page.tsx de /dashboard hace nuevo prefetch con el orgId nuevo
8. Los proyectos del nuevo org aparecen en el grid
```

### Al cambiar proyecto (desde dentro de un proyecto)

```
1. Usuario pulsa [📁 Proyecto ▾] → selecciona "Otro proyecto"
2. router.push('/project/[otroShortId]')
3. El layout.tsx del proyecto (ProjectLayout) se RE-EJECUTA:
   - Carga nuevo proyecto con getProject(otroShortId)
   - ProjectProvider recibe nuevo proyecto
   - useRealtimeSync se re-suscribe al nuevo projectId
4. queryClient.invalidateQueries({ queryKey: ['videos', otroProjectId] })
5. El sidebar NIVEL 2 se actualiza con los datos del nuevo proyecto
```

### Al cambiar vídeo (desde dentro de un vídeo)

```
1. Usuario pulsa [🎬 Video ▾] → selecciona otro vídeo
2. router.push('/project/[shortId]/video/[otroVideoShortId]')
3. El layout.tsx del vídeo (VideoLayout) se RE-EJECUTA:
   - Carga nuevo vídeo
   - VideoProvider recibe nuevo vídeo
4. Las escenas del nuevo vídeo se cargan
5. El sidebar NIVEL 3 permanece igual (mismos items)
6. El dropdown del vídeo muestra el nuevo nombre seleccionado
```
