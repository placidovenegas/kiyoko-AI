# Kiyoko AI — Navigation Spec

## Estructura general

```
+------------------+--------------------------------------------+
|                  |  HEADER (Navbar)              h-11.75      |
|    SIDEBAR       +--------------------------------------------+
|    (Menu)        |                                            |
|    ~250px        |  CONTENIDO PRINCIPAL          flex-1       |
|    colapsable    |                                            |
+------------------+--------------------------------------------+
```

- **Sidebar**: colapsable a modo icono (`collapsible="icon"`).
- **Header**: fijo, altura `h-11.75` (47px).
- **Contenido**: `flex-1` con `overflow-y-auto`.
- **Chat IA**: panel lateral derecho (sidebar/floating/fullscreen/minimized).

---

## 1. SIDEBAR

### 1.1 Header del Sidebar

| Elemento              | Detalle                                              |
|-----------------------|------------------------------------------------------|
| Logo                  | Logo de Kiyoko AI / iniciales del workspace          |
| Nombre workspace      | "Kiyoko AI"                                          |
| Popover del workspace | Ver seccion 3.1                                      |
| Boton colapsar        | `ChevronsLeft` — solo visible en modo expandido      |

### 1.2 Navegacion fija (siempre visible)

| Item         | Icono         | Accion                        | Extra            |
|--------------|---------------|-------------------------------|------------------|
| Buscar       | `Search`      | Abre SearchModal (ver 3.6)    | Shortcut `Cmd+K` |
| Dashboard    | `Home`        | `/dashboard`                  | —                |
| Inbox        | `Inbox`       | `/dashboard/notifications`    | Badge con count  |
| Tareas       | `CheckSquare` | `/dashboard/tasks`            | —                |
| Kiyoko IA    | `Sparkles`    | Toggle panel de chat          | Active si abierto|

> **Colapsado**: cada item muestra `Tooltip` con `placement="right"`.

### 1.3 Navegacion secundaria (siempre visible)

| Item           | Icono      | Href                       |
|----------------|------------|----------------------------|
| Compartidos    | `Share2`   | `/dashboard/shared`        |
| Publicaciones  | `Calendar` | `/dashboard/publications`  |

### 1.4 Footer del Sidebar

| Elemento          | Icono           | Accion                          |
|-------------------|-----------------|---------------------------------|
| Settings          | `Settings`      | Abre modal de ajustes (perfil)  |
| Colapsar/Expandir | `ChevronsRight` | Toggle sidebar                  |

---

## 2. SIDEBAR — Contenido por nivel

El sidebar detecta el nivel via URL (`useSidebarContext`) y cambia su contenido.

### 2.1 Nivel: Dashboard (`/dashboard/*`)

Se muestra en `/dashboard`, `/tasks`, `/settings`, etc.

#### Favoritos
- Max 5 visibles + boton "Ver X mas" para expandir/colapsar
- Cada favorito: link al proyecto con dropdown contextual (ver 3.3)
- **Colapsado**: popover con icono `Star` (ver 3.5a)

#### Proyectos
- Label: "PROYECTOS"
- Boton `+` para crear proyecto nuevo
- Max 5 visibles + "Ver X mas"
- Cada proyecto: `FolderClosed` + nombre
- Hover en proyecto: aparecen botones `+` (nuevo video) y `...` (dropdown, ver 3.2)
- Hover en proyecto: popover lateral con lista de videos
- **Colapsado**: popover con icono `FolderClosed` (ver 3.5b)

#### Admin (solo admins)
- Label: "Admin" — solo visible si `useAuth().isAdmin`
- Panel admin (`BarChart3`) -> `/admin`
- Usuarios (`Users`) -> `/admin/users`

---

### 2.2 Nivel: Proyecto (`/project/[shortId]/*`)

Se muestra cuando la URL es `/project/[shortId]/*` (excepto rutas de video).

#### General

| Item           | Icono             | Href                                    |
|----------------|-------------------|-----------------------------------------|
| Vista general  | `LayoutDashboard` | `/project/[shortId]`                    |
| Tareas         | `CheckSquare`     | `/project/[shortId]/tasks`              |
| Publicaciones  | `Smartphone`      | `/project/[shortId]/publications`       |

#### Videos
- Boton `+` para crear video nuevo
- Lista de videos del proyecto
- Cada video: `Film` + nombre + dot de estado con color
- Hover: aparece boton `...` (dropdown, ver 3.4)
- **Colapsado**: popover con icono `Film` (ver 3.5c)

**Colores de estado de video:**
| Estado       | Color         |
|--------------|---------------|
| `draft`      | `zinc-400`    |
| `prompting`  | `blue-400`    |
| `generating` | `amber-400`   |
| `review`     | `purple-400`  |
| `approved`   | `emerald-400` |
| `exported`   | `emerald-600` |

#### Recursos
| Item        | Icono       | Href                                            |
|-------------|-------------|-------------------------------------------------|
| Personajes  | `Users`     | `/project/[shortId]/resources/characters`       |
| Fondos      | `Mountain`  | `/project/[shortId]/resources/backgrounds`      |
| Estilos     | `Paintbrush`| `/project/[shortId]/resources/styles`           |
| Templates   | `FileText`  | `/project/[shortId]/resources/templates`        |

- **Colapsado**: popover con icono `Palette` (ver 3.5d)

#### Ajustes

| Item          | Icono      | Accion                                          |
|---------------|------------|-------------------------------------------------|
| General       | `Settings` | Abre modal de ajustes del proyecto              |
| Director IA   | `Bot`      | Abre modal de ajustes seccion "ia"              |
| Compartir     | `UserPlus` | `/project/[shortId]/settings/sharing`           |

---

### 2.3 Nivel: Video (`/project/[shortId]/video/[videoShortId]/*`)

Se muestra cuando la URL incluye un video especifico.

#### Navegacion principal

| Item         | Icono             | Href                                                  |
|--------------|-------------------|-------------------------------------------------------|
| Vista general| `LayoutDashboard` | `/project/[shortId]/video/[videoShortId]`             |
| Escenas      | `Clapperboard`    | `/project/[shortId]/video/[videoShortId]/scenes`      |
| Timeline     | `GanttChart`      | `/project/[shortId]/video/[videoShortId]/timeline`    |
| Narracion    | `Mic`             | `/project/[shortId]/video/[videoShortId]/narration`   |
| Analisis     | `BarChart3`       | `/project/[shortId]/video/[videoShortId]/analysis`    |

#### Lista de escenas
- Label: "Escenas (N)" con conteo
- Cada escena: dot de estado + numero (monospace, `tabular-nums`) + titulo (truncado)
- Ordenadas por `sort_order`
- **Colapsado**: popover con icono `Clapperboard` (ver 3.5e)

**Colores de estado de escena:**
| Estado          | Color         |
|-----------------|---------------|
| `draft`         | `zinc-400`    |
| `prompt_ready`  | `blue-400`    |
| `generating`    | `amber-400`   |
| `generated`     | `emerald-400` |
| `approved`      | `emerald-600` |
| `rejected`      | `red-400`     |

#### Acciones

| Item       | Icono      | Href                                                    |
|------------|------------|---------------------------------------------------------|
| Compartir  | `Share2`   | `/project/[shortId]/video/[videoShortId]/share`         |
| Exportar   | `Download` | `/project/[shortId]/video/[videoShortId]/export`        |

---

## 3. POPOVERS, DROPDOWNS Y MODALES

### 3.1 Workspace Switcher Popover

**Trigger**: click en el logo/nombre del workspace en el header del sidebar.
**Componente**: `SidebarHeaderSection` → Popover
**Ancho**: `w-80`

```
+-----------------------------------------------+
|  user@email.com                          [...]|
+-----------------------------------------------+
|  [Iniciales]  Workspace personal              |
|               Todo el contenido se asocia     |
|               a tu cuenta                     |
|                          [Settings] [Download]|
+-----------------------------------------------+
|  [Monitor] Descargar                          |
|  [LogOut]  Cerrar sesion                      |
+-----------------------------------------------+
```

| Elemento      | Icono       | Accion                                    |
|---------------|-------------|-------------------------------------------|
| Settings      | `Settings`  | Abre modal ajustes seccion "perfil"       |
| Download      | `Monitor`   | Abre `kiyoko.ai/download` (nueva tab)     |
| Descargar     | `Monitor`   | Mismo link externo                        |
| Cerrar sesion | `LogOut`    | Logout del usuario                        |

**Estilo**: `rounded-xl border shadow-xl`, fondo oscuro.

---

### 3.2 Dropdown de Proyecto (Sidebar)

**Trigger**: boton `...` (`MoreHorizontal`) al hacer hover en un proyecto.
**Componente**: `SidebarProjectItem` → DropdownMenu
**Posicion**: `side="right" align="start"`

```
+-----------------------------------+
|  [ExternalLink] Abrir proyecto    |
|  [Link2]        Copiar link       |
|  [Share2]       Compartir         |
|  ─────────────────────────────    |
|  [Copy]         Duplicar          |
|  [Pencil]       Renombrar         |
|  ─────────────────────────────    |
|  [Star]         Agregar/Quitar    |
|                 de favoritos      |
|  ─────────────────────────────    |
|  [Trash2]       Eliminar  (rojo)  |
+-----------------------------------+
```

| Item                   | Icono          | Accion                                   |
|------------------------|----------------|------------------------------------------|
| Abrir proyecto         | `ExternalLink` | Navega a `/project/[shortId]`            |
| Copiar link            | `Link2`        | Copia URL al clipboard                   |
| Compartir              | `Share2`       | Navega a sharing settings                |
| Duplicar               | `Copy`         | Duplica proyecto                         |
| Renombrar              | `Pencil`       | Renombra proyecto                        |
| Agregar a favoritos    | `Star`         | Toggle favorito (label cambia)           |
| Eliminar               | `Trash2`       | Elimina proyecto (texto rojo)            |

---

### 3.3 Dropdown de Favorito (Sidebar)

**Trigger**: boton `...` al hacer hover en un favorito.
**Componente**: `SidebarFavorites` → DropdownMenu

Identico al dropdown de proyecto (3.2) con una diferencia:
- En lugar de "Agregar a favoritos" muestra **"Quitar de favoritos"** con `Star` lleno amarillo.

---

### 3.4 Dropdown de Video (Sidebar)

**Trigger**: boton `...` al hacer hover en un video.
**Componente**: `SidebarVideoItem` → DropdownMenu
**Ancho**: `w-44`

```
+-----------------------------------+
|  [ExternalLink] Abrir video       |
|  [Copy]         Duplicar          |
|  [Pencil]       Renombrar         |
|  ─────────────────────────────    |
|  [Trash2]       Eliminar  (rojo)  |
+-----------------------------------+
```

---

### 3.5 Popovers del Sidebar Colapsado

Cuando el sidebar esta en modo icono, las secciones con listas se convierten en popovers.
Todos usan `w-56`.

#### 3.5a Popover Favoritos (colapsado)

**Trigger**: icono `Star`

```
+-----------------------------+
|  Favoritos                  |
+-----------------------------+
|  Proyecto Alpha             |
|  Proyecto Beta              |
|  Proyecto Gamma             |
+-----------------------------+
```

Cada item es un link clickeable con hover background.

#### 3.5b Popover Proyectos (colapsado)

**Trigger**: icono `FolderClosed`

```
+-----------------------------+
|  Proyectos              [+] |
+-----------------------------+
|  * Proyecto Alpha           |  <- hover muestra sub-popover
|  * Proyecto Beta            |
|  * Proyecto Gamma           |
+-----------------------------+
|  Sin proyectos (si vacio)   |
+-----------------------------+
```

- El `*` representa un dot de estado con color
- Hover en un proyecto: **sub-popover anidado** (`w-48`) con lista de videos del proyecto:

```
+-------------------------+
|  Video Intro            |
|  Video Tutorial         |
|  Video Demo             |
+-------------------------+
```

Cada video muestra icono `Film` + dot de estado + nombre.

#### 3.5c Popover Videos (colapsado, nivel proyecto)

**Trigger**: icono `Film`

```
+-----------------------------+
|  Videos                 [+] |
+-----------------------------+
|  * Video Intro              |
|  * Video Tutorial           |
|  * Video Demo               |
+-----------------------------+
|  Sin videos (si vacio)      |
+-----------------------------+
```

- `[+]` enlaza a `${base}/videos`
- `*` es dot de estado con color (mismos colores que seccion 2.2)

#### 3.5d Popover Recursos (colapsado, nivel proyecto)

**Trigger**: icono `Palette`

```
+-----------------------------+
|  Recursos                   |
+-----------------------------+
|  [Users]      Personajes    |
|  [Mountain]   Fondos        |
|  [Paintbrush] Estilos       |
|  [FileText]   Templates     |
+-----------------------------+
```

Cada item es un link a la ruta correspondiente de recursos.

#### 3.5e Popover Escenas (colapsado, nivel video)

**Trigger**: icono `Clapperboard`

```
+-----------------------------+
|  Escenas                    |
+-----------------------------+
|  *  01  Amanecer en Tokyo   |
|  *  02  Dialogo central     |
|  *  03  Climax              |
+-----------------------------+
```

- `*` es dot de estado (colores de seccion 2.3)
- Numero en `tabular-nums`, alineado a la derecha
- Titulo truncado

---

### 3.6 SearchModal (Cmd+K)

**Trigger**: `Cmd+K` o boton de busqueda en header/sidebar.
**Componente**: `SearchModal`
**Dimensiones**: `max-w-180`, `h-600`, portal fijo

```
+------------------------------------------+---------------+
|  [Search] Buscar o hacer una pregunta... |               |
|  [Todo] [Proyectos] [Videos] [Escenas]   |   PREVIEW     |
+------------------------------------------+   PANEL       |
|                                          |   (w-60)      |
|  Navegacion rapida (si query < 2 chars)  |               |
|  ───────────────────────────────         |  Cover/icono  |
|  Hoy                                     |  Subtitulo    |
|    Resultado 1                           |  Titulo       |
|    Resultado 2                           |  Badge tipo   |
|  Ayer                                    |  Metadata     |
|    Resultado 3                           |               |
|  Ultimos 7 dias                          |               |
|    Resultado 4                           |               |
|                                          |               |
+------------------------------------------+               |
|  [up/down] Navegar  [enter] Abrir  [gear]|               |
+------------------------------------------+---------------+
```

**Panel izquierdo:**

| Zona            | Detalle                                                     |
|-----------------|-------------------------------------------------------------|
| Input           | `Search` icon + placeholder + spinner si cargando           |
| Filtros tipo    | Chips: Todo, Proyectos, Videos, Escenas + boton Filtros     |
| Chip activo     | `bg-primary/15`                                             |
| Resultados      | Si `query >= 2`: resultados de busqueda                     |
|                 | Si `query < 2`: nav rapida + recientes agrupados por fecha  |
| Agrupacion      | "Hoy", "Ayer", "Ultimos 7 dias", "Anterior"                |
| Footer          | Shortcuts de teclado + boton settings                       |

**Panel derecho (preview):**
- Hidden en pantallas pequenas
- Muestra preview del item hover: cover image o icono, subtitulo, titulo, badge de tipo, metadata.

---

### 3.7 Notificaciones Popover

**Trigger**: icono `Bell` en el header.
**Componente**: `NotificationBell`
**Ancho**: `w-80`
**Posicion**: `right-0 top-full mt-2`

```
+-------------------------------------------+
|  Notificaciones             [Marcar todas]|
+-------------------------------------------+
|  [badge] Tarea vencida           hace 2h  |
|          Revisar escena 3 del...          |
|                           [Ver] [Leida]   |
|  ─────────────────────────────────        |
|  [badge] Video programado        hace 1d  |
|          El video "Intro" esta...         |
|                                  [Ver]    |
+-------------------------------------------+
```

- "Marcar todas" solo aparece si `unreadCount > 0`
- Lista con `max-h-80 overflow-y-auto`

**Colores de badge por tipo de notificacion:**

| Tipo               | Color de fondo |
|--------------------|----------------|
| `task_due`         | `amber`        |
| `video_scheduled`  | `blue`         |
| `ai_completed`     | `purple`       |
| `scene_updated`    | `green`        |
| `export_ready`     | `cyan`         |
| `comment_mention`  | `pink`         |
| `share_invite`     | `indigo`       |

**Cada notificacion muestra:**
- Badge con icono coloreado segun tipo
- Titulo (bold si no leida)
- Body (max 2 lineas, `line-clamp-2`)
- Tiempo relativo (alineado a derecha)
- Boton "Ver" (si tiene link)
- Boton "Leida" (si no leida)

**Estado vacio**: icono `Bell` + "Sin notificaciones"

---

### 3.8 Feedback Dialog

**Trigger**: boton "Feedback" en header (solo dashboard).
**Componente**: `FeedbackDialog`
**Ancho**: `w-80`
**Posicion**: fijo top-right, `pt-14`, slide-in desde arriba

**Paso 1 — Elegir tipo:**
```
+-----------------------------------+
|  Que quieres compartir?           |
|                                   |
|  [AlertTriangle] Problema         |
|                  con mi proyecto  |
|                                   |
|  [Lightbulb]     Idea             |
|                  para mejorar     |
|                  Kiyoko           |
+-----------------------------------+
```

**Paso 2 — Escribir mensaje:**
```
+-----------------------------------+
|  Reportar problema                |
|  (o "Compartir idea")            |
|                                   |
|  +-------------------------------+|
|  | Textarea (4 rows)            ||
|  +-------------------------------+|
|                                   |
|  Mejor enviar idea    [Enviar]   |
|  (o "Mejor reportar             |
|   problema")                     |
+-----------------------------------+
```

- Boton "Enviar" deshabilitado si textarea vacio
- Muestra "Enviando..." durante carga

---

### 3.9 TaskCreatePanel

**Trigger**: boton "Nueva tarea" en header (solo dashboard) o `openTaskCreatePanel` del UI store.
**Componente**: `TaskCreatePanel`
**Dimensiones**: `max-w-4xl`, `h-[min(860px,92vh)]`
**Overlay**: backdrop oscuro con blur, `rounded-[28px]`

```
+--------------------------------------------------+
|  [X]                              NUEVA TAREA     |
+--------------------------------------------------+
|                                                   |
|  Proyecto:    [Select proyecto      v]            |
|  Video:       [Select video         v]  (opt)     |
|                                                   |
|  Titulo:      [________________________]          |
|  Descripcion: [________________________]          |
|               [________________________]          |
|                                                   |
|  Categoria:   [Select categoria     v]            |
|  Prioridad:   [Select prioridad     v]            |
|  Fecha limite: [____/____/________]               |
|                                                   |
+--------------------------------------------------+
|  SUGERENCIAS DE TAREAS                            |
|  +---------------------+ +---------------------+ |
|  | [WandSparkles] Alta | | [WandSparkles] Med  | |
|  | Revisar escena 3    | | Ajustar narracion   | |
|  | Descripcion...      | | Descripcion...      | |
|  | [guion]    [Usar]   | | [review]    [Usar]  | |
|  +---------------------+ +---------------------+ |
+--------------------------------------------------+
|  Info de vinculacion                              |
|  [Abrir en grande] [Cancelar] [Crear tarea]      |
+--------------------------------------------------+
```

**Categorias disponibles (12):**
`guion`, `prompt`, `image_gen`, `video_gen`, `review`, `export`, `meeting`, `voiceover`, `editing`, `issue`, `annotation`, `otro`

**Prioridades:**
`baja`, `media`, `alta`, `urgente`

**Sugerencias**: grid de 2 columnas (md+), cada card con badge de prioridad, titulo, descripcion, justificacion, badge de categoria, boton "Usar".

---

### 3.10 Project Card Dropdown (Dashboard Grid)

**Trigger**: boton `...` en cada `ProjectCard` del dashboard.
**Componente**: `ProjectCard` → DropdownMenu
**Ancho**: `min-w-48`

```
+-----------------------------------+
|  [FolderOpen] Abrir proyecto      |
|  ─────────────────────────────    |
|  [Pencil]     Editar              |
|  [Copy]       Duplicar            |
|  ─────────────────────────────    |
|  [Archive]    Archivar            |
|  ─────────────────────────────    |
|  [Trash2]     Eliminar    (rojo)  |
+-----------------------------------+
```

- "Editar" navega a `/project/[shortId]/settings`
- "Eliminar" abre `ConfirmDeleteModal`

**ConfirmDeleteModal:**
```
+-------------------------------------------+
|          [Trash2]                          |
|                                           |
|  Esta accion es permanente.               |
|  Escribe el nombre del proyecto           |
|  para confirmar:                          |
|                                           |
|  [______________________________]         |
|                                           |
|  [Cancelar]  [Eliminar] (rojo, disabled   |
|               hasta que texto coincida)   |
+-------------------------------------------+
```

---

### 3.11 Panel de Chat IA (Kiyoko)

**Trigger**: icono `Bot` en header o `Sparkles` en sidebar.
**Componente**: `KiyokoChat`
**Modos de display** (controlados por `useAIStore`):

| Modo         | Descripcion                                      |
|--------------|--------------------------------------------------|
| `sidebar`    | Panel lateral derecho, anclado                   |
| `floating`   | Ventana flotante                                 |
| `fullscreen` | Pantalla completa                                |
| `minimized`  | Estado colapsado                                 |

**Agentes contextuales** (se activan segun la ruta):

| Agente        | Cuando se activa                                 |
|---------------|--------------------------------------------------|
| `router`      | Por defecto                                      |
| `project`     | Al abrir desde contexto de proyecto              |
| `editor`      | Al abrir desde contexto de video                 |
| `scenes`      | Trabajando con escenas                           |
| `prompts`     | Trabajando con prompts                           |
| `characters`  | Trabajando con personajes                        |
| `backgrounds` | Trabajando con fondos                            |
| `tasks`       | Trabajando con tareas                            |
| `ideation`    | Modo ideacion                                    |

**Contenido del panel:**
```
+-------------------------------------------+
|  [Historial] Kiyoko IA     [mode] [X]    |
+-------------------------------------------+
|  Context strip:                           |
|  [Proyecto: X] [Video: Y] [Escena: Z]    |
+-------------------------------------------+
|                                           |
|  Mensajes del chat                        |
|  (con streaming en tiempo real)           |
|  (indicador de "pensando")               |
|  (action plans ejecutables)              |
|                                           |
+-------------------------------------------+
|  Sugerencias / follow-ups                 |
+-------------------------------------------+
|  [Textarea input]              [Enviar]   |
+-------------------------------------------+
```

**Historial lateral**: colapsable, ancho redimensionable `240-600px`.

**Creation cards**: overlay que aparece al completar generacion (personaje, fondo, video, proyecto).

---

## 4. HEADER (Navbar)

### 4.1 Estructura

```
[ Back ] [ Breadcrumb Badge ]     [ Buscar... Cmd+K ]     [ Acciones contextuales ]
```

### 4.2 Seccion izquierda

| Elemento         | Condicion                                          | Detalle                           |
|------------------|----------------------------------------------------|-----------------------------------|
| Boton Back       | Visible excepto en `/`, `/dashboard`, `/project`   | `ChevronLeft`, navega atras       |
|                  |                                                    | Respeta `pageHeaderContext.backHref` del UI store |
| Breadcrumb Badge | Visible en `md+` (hidden en mobile)                | Icono + label segun contexto      |

#### Breadcrumb Badge por contexto

| Contexto       | Icono           | Labels posibles                                              |
|----------------|-----------------|--------------------------------------------------------------|
| Dashboard      | `LayoutGrid`    | "Dashboard", "Tareas", "Ajustes", "Admin", "Compartido"     |
| Proyecto       | `FolderKanban`  | "Proyecto", "Tareas", "Videos", "Recursos", etc.            |
| Video          | `Film`          | "Video", "Escenas", "Timeline", "Narracion", "Analisis"     |

### 4.3 Seccion central

| Elemento | Detalle                                                           |
|----------|-------------------------------------------------------------------|
| Buscar   | Icono `Search` + "Buscar" + `Cmd+K` — abre SearchModal (ver 3.6) |
|          | Ancho: `w-64` en dashboard, `w-52 lg:w-60` en otras rutas        |

### 4.4 Seccion derecha — cambia por contexto

| Elemento             | Dashboard | Proyecto | Video | Detalle                                      |
|----------------------|-----------|----------|-------|----------------------------------------------|
| Feedback             | SI        | —        | —     | Abre FeedbackDialog (ver 3.8)                |
| Nueva tarea          | SI        | —        | —     | Abre TaskCreatePanel (ver 3.9)               |
| Ajustes proyecto     | —         | SI       | —     | `Settings2`, abre modal ajustes proyecto     |
| Ajustes video        | —         | —        | SI    | `Settings2`, abre modal ajustes video        |
| Notificaciones       | SI        | SI       | SI    | `Bell` con badge (ver 3.7)                   |
| Kiyoko IA / Asistente| SI        | SI       | SI    | `Bot`, toggle chat (ver 3.11)                |

### 4.5 Tooltip del boton IA por contexto

| Contexto  | Tooltip               | Comportamiento                                    |
|-----------|-----------------------|---------------------------------------------------|
| Dashboard | "Kiyoko IA"           | Toggle panel de chat general                      |
| Proyecto  | "Asistente contextual"| Abre AI sidebar + activa agente `project`         |
| Video     | "Asistente contextual"| Abre AI sidebar + activa agente `editor`          |

**Visual**: borde `primary` + fondo `primary/10` cuando el chat esta abierto.

---

## 5. Comportamiento responsive

### Sidebar
| Estado      | Comportamiento                                                      |
|-------------|---------------------------------------------------------------------|
| Expandido   | Iconos + texto + secciones completas con listas                     |
| Colapsado   | Solo iconos con tooltips (`placement="right"`)                      |
|             | Listas (proyectos, videos, recursos, escenas) -> popovers (sec 3.5)|
|             | Separadores visuales entre secciones                                |

### Header
| Breakpoint | Comportamiento                                                |
|------------|---------------------------------------------------------------|
| Mobile     | Back button visible, breadcrumb oculto, tarea solo icono      |
| `md+`      | Breadcrumb badge visible                                      |
| `lg+`      | Busqueda mas ancha, boton tarea con texto "Nueva tarea"       |

---

## 6. Resumen visual por pantalla

```
DASHBOARD
  Sidebar: [Nav fija] + Favoritos + Proyectos + Admin(si admin)
  Header:  Breadcrumb "Dashboard" | Buscar | Feedback + Nueva tarea + Bell + Bot
  Popovers: Workspace, Project dropdown, Favorite dropdown, Notificaciones,
            Search, Feedback, TaskCreate, Chat IA

PROYECTO
  Sidebar: [Nav fija] + General/Tareas/Pub + Videos + Recursos + Ajustes
  Header:  Back + "Proyecto" | Buscar | Settings proyecto + Bell + Bot(contextual)
  Popovers: Workspace, Video dropdown, Notificaciones, Search, Chat IA(project)

VIDEO
  Sidebar: [Nav fija] + General/Escenas/Timeline/Narracion/Analisis + Escenas + Acciones
  Header:  Back + "Video" | Buscar | Settings video + Bell + Bot(contextual)
  Popovers: Workspace, Notificaciones, Search, Chat IA(editor)
```

---

## 7. Archivos de referencia

| Componente            | Archivo                                                  |
|-----------------------|----------------------------------------------------------|
| Layout dashboard      | `src/app/(dashboard)/layout.tsx`                         |
| AppSidebar            | `src/components/layout/AppSidebar.tsx`                   |
| SidebarHeader         | `src/components/layout/sidebar/SidebarHeader.tsx`        |
| SidebarNavFixed       | `src/components/layout/sidebar/SidebarNavFixed.tsx`      |
| SidebarNavMain        | `src/components/layout/sidebar/SidebarNavMain.tsx`       |
| SidebarFavorites      | `src/components/layout/sidebar/SidebarFavorites.tsx`     |
| SidebarProjects       | `src/components/layout/sidebar/SidebarProjects.tsx`      |
| SidebarProjectItem    | `src/components/layout/sidebar/SidebarProjectItem.tsx`   |
| SidebarProjectNav     | `src/components/layout/sidebar/SidebarProjectNav.tsx`    |
| SidebarVideoNav       | `src/components/layout/sidebar/SidebarVideoNav.tsx`      |
| SidebarVideoItem      | `src/components/layout/sidebar/SidebarVideoItem.tsx`     |
| SidebarFooter         | `src/components/layout/sidebar/SidebarFooterContent.tsx` |
| SidebarAdmin          | `src/components/layout/sidebar/SidebarAdmin.tsx`         |
| Header                | `src/components/layout/Header.tsx`                       |
| NotificationBell      | `src/components/layout/NotificationBell.tsx`             |
| SearchModal           | `src/components/layout/SearchModal.tsx`                  |
| FeedbackDialog        | `src/components/shared/FeedbackDialog.tsx`               |
| TaskCreatePanel       | `src/components/tasks/TaskCreatePanel.tsx`               |
| ProjectCard           | `src/components/project/ProjectCard.tsx`                 |
| KiyokoChat            | `src/components/chat/KiyokoChat.tsx`                     |
| Sidebar UI primitivo  | `src/components/ui/sidebar.tsx`                          |
