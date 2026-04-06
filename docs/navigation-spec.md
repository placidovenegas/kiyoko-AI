# Kiyoko AI — UI Navigation & Components Spec

> **Proposito**: Este documento es la referencia completa para que Claude (IA) implemente
> toda la navegacion, modales, popovers, toasts y comportamiento de la app.
> Seguir EXACTAMENTE lo descrito aqui. No inventar campos, iconos o rutas que no esten listados.

---

## 0. Convenciones de implementacion

### Stack
- **Framework**: Next.js 15 App Router (Server Components por defecto)
- **UI**: Tailwind v4 (CSS `@theme`, NO `tailwind.config.ts`) + componentes de `src/components/ui/`
- **Iconos**: Lucide React (`lucide-react`) — SIEMPRE importar desde ahi
- **Modales**: HeroUI Modal/Drawer para shells, componentes custom para contenido
- **Toasts**: Sonner v2 con wrapper custom `src/components/ui/toast.tsx`
- **State**: Zustand para UI, TanStack Query para datos del servidor
- **Formularios**: inputs nativos con clases estandar (ver seccion 0.2)

### 0.1 Clases CSS estandar

**Input/Textarea estandar:**
```
mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm
text-foreground outline-none transition-colors placeholder:text-muted-foreground
focus:border-primary/30 focus:ring-2 focus:ring-primary/10
```

**Boton primario:**
```
rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground
hover:bg-primary/90 disabled:opacity-50 transition-colors
```

**Boton ghost/secundario:**
```
rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground
hover:bg-muted hover:text-foreground transition-colors
```

**Boton danger:**
```
rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-medium text-white
hover:bg-red-500 transition-colors
```

**Label de campo:**
```
text-xs font-medium text-muted-foreground uppercase tracking-wide
```

**Descripcion de campo:**
```
text-xs text-muted-foreground mt-1
```

### 0.2 Colores — SOLO variables CSS

```
PROHIBIDO:  bg-[#0EA5A0], text-[#111113]
CORRECTO:   bg-primary, text-foreground, border-border, bg-card, text-muted-foreground
```

**Colores semanticos disponibles:**
| Variable           | Uso                          |
|--------------------|------------------------------|
| `primary`          | Acciones principales, links  |
| `foreground`       | Texto principal              |
| `muted-foreground` | Texto secundario, placeholders|
| `background`       | Fondo de pagina              |
| `card`             | Fondo de cards/paneles       |
| `border`           | Bordes                       |
| `accent`           | Hover backgrounds            |
| `destructive`      | Acciones peligrosas          |
| `success-*`        | Estados exitosos (200-800)   |
| `warning-*`        | Alertas (200-800)            |
| `danger-*`         | Errores (200-800)            |
| `primary-*`        | Info/azul (200-800)          |

### 0.3 Estado global del UI (Zustand)

**Store**: `useUIStore` — controla que modales estan abiertos.

```ts
// Estados booleanos
projectCreatePanelOpen: boolean
projectSettingsModalOpen: boolean
videoSettingsModalOpen: boolean
settingsModalOpen: boolean
taskCreatePanelOpen: boolean

// Secciones activas dentro de modales
settingsSection: 'perfil' | 'preferencias' | 'notificaciones' | 'seguridad' | 'api-keys' | 'suscripcion'
projectSettingsSection: 'general' | 'ia'
videoSettingsSection: 'general' | 'narracion'
```

---

## 1. LAYOUT GENERAL

```
+------------------+--------------------------------------------+
|                  |  HEADER (Navbar)              h-11.75      |
|    SIDEBAR       +--------------------------------------------+
|    (Menu)        |                                            |
|    ~250px        |  CONTENIDO PRINCIPAL          flex-1       |
|    colapsable    |                                            |
+------------------+--------------------------------------------+
```

- **SidebarProvider** envuelve todo el dashboard layout.
- **Sidebar**: colapsable a modo icono (`collapsible="icon"`), ancho ~250px expandido.
- **Header**: fijo, altura `h-11.75` (47px), borde inferior `border-b border-border`.
- **Contenido**: `flex-1` con `overflow-y-auto`.
- **Chat IA**: panel lateral derecho que se superpone al contenido.

**Montaje de modales globales** (en `src/app/(dashboard)/layout.tsx`):
- `ProjectCreatePanel`
- `TaskCreatePanel`
- `SearchModal`
- `SettingsModal`
- `GlobalFilePreview`

---

## 2. SIDEBAR

### 2.1 Header del Sidebar

| Elemento              | Detalle                                              |
|-----------------------|------------------------------------------------------|
| Logo                  | Logo de Kiyoko AI / iniciales del workspace          |
| Nombre workspace      | "Kiyoko AI"                                          |
| Popover del workspace | Click abre popover (ver 5.1)                         |
| Boton colapsar        | `ChevronsLeft` — solo visible en modo expandido      |

**Hover**: muestra badge personal (iniciales) superpuesto al logo.

### 2.2 Navegacion fija (siempre visible en todos los niveles)

| Item         | Icono         | Accion                        | Extra            |
|--------------|---------------|-------------------------------|------------------|
| Buscar       | `Search`      | Abre SearchModal (ver 5.7)    | Shortcut `Cmd+K` |
| Dashboard    | `Home`        | `/dashboard`                  | Active en `/`    |
| Inbox        | `Inbox`       | `/dashboard/notifications`    | Badge con count  |
| Tareas       | `CheckSquare` | `/dashboard/tasks`            | —                |
| Kiyoko IA    | `Sparkles`    | Toggle panel de chat (ver 5.12)| Active si abierto|

> **Colapsado**: cada item muestra `Tooltip` con `placement="right"`.

### 2.3 Navegacion secundaria (siempre visible)

| Item           | Icono      | Href                       |
|----------------|------------|----------------------------|
| Compartidos    | `Share2`   | `/dashboard/shared`        |
| Publicaciones  | `Calendar` | `/dashboard/publications`  |

### 2.4 Footer del Sidebar

| Elemento          | Icono           | Accion                                 |
|-------------------|-----------------|----------------------------------------|
| Settings          | `Settings`      | `settingsModalOpen = true` seccion "perfil" |
| Colapsar/Expandir | `ChevronsRight` | `toggleSidebar()`                      |

- **Expandido**: boton con texto completo
- **Colapsado**: solo icono con tooltip

---

## 3. SIDEBAR — Contenido dinamico por nivel

El hook `useSidebarContext()` parsea la URL y determina el nivel: `'dashboard' | 'project' | 'video'`.

### 3.1 Nivel: Dashboard (`/dashboard/*`)

Se muestra en `/dashboard`, `/tasks`, `/settings`, etc.

#### Favoritos
- Label: seccion de grupo
- Max 5 visibles + boton "Ver X mas" para expandir/colapsar
- Cada favorito: link al proyecto con dropdown contextual al hover (ver 5.3)
- **Colapsado**: popover con icono `Star` (ver 5.5a)
- **Si no hay favoritos**: seccion no se muestra

#### Proyectos
- Label: "PROYECTOS" (uppercase, `text-xs tracking-wide`)
- Boton `+` a la derecha del label → `projectCreatePanelOpen = true`
- Max 5 visibles + "Ver X mas"
- Cada proyecto: icono `FolderClosed` + nombre truncado
- Hover en proyecto: aparecen botones `+` y `...` (dropdown, ver 5.2)
- Hover en proyecto: popover lateral con lista de videos del proyecto
- **Colapsado**: popover con icono `FolderClosed` (ver 5.5b)

#### Admin (solo admins)
- Visible solo si `useAuth().isAdmin === true`
- Label: "Admin"
- Panel admin (`BarChart3`) → `/admin`
- Usuarios (`Users`) → `/admin/users`

---

### 3.2 Nivel: Proyecto (`/project/[shortId]/*`)

Se muestra cuando URL match `/project/[shortId]/*` (excepto rutas de video).

#### General

| Item           | Icono             | Href                                    |
|----------------|-------------------|-----------------------------------------|
| Vista general  | `LayoutDashboard` | `/project/[shortId]`                    |
| Tareas         | `CheckSquare`     | `/project/[shortId]/tasks`              |
| Publicaciones  | `Smartphone`      | `/project/[shortId]/publications`       |

#### Videos (con boton `+`)
- Boton `+` → navega a crear video o abre modal
- Lista de videos del proyecto (fetch via TanStack Query)
- Cada video: `Film` + nombre + dot de estado con color
- Hover: aparece boton `...` (dropdown, ver 5.4)
- **Colapsado**: popover con icono `Film` (ver 5.5c)

**Colores de estado de video** (dot `w-2 h-2 rounded-full`):

| Estado       | Clase Tailwind  |
|--------------|-----------------|
| `draft`      | `bg-zinc-400`   |
| `prompting`  | `bg-blue-400`   |
| `generating` | `bg-amber-400`  |
| `review`     | `bg-purple-400` |
| `approved`   | `bg-emerald-400`|
| `exported`   | `bg-emerald-600`|

#### Recursos

| Item        | Icono        | Href                                            |
|-------------|------------- |-------------------------------------------------|
| Personajes  | `Users`      | `/project/[shortId]/resources/characters`       |
| Fondos      | `Mountain`   | `/project/[shortId]/resources/backgrounds`      |
| Estilos     | `Paintbrush` | `/project/[shortId]/resources/styles`           |
| Templates   | `FileText`   | `/project/[shortId]/resources/templates`        |

- **Colapsado**: popover con icono `Palette` (ver 5.5d)

#### Ajustes

| Item          | Icono      | Accion                                                     |
|---------------|------------|-------------------------------------------------------------|
| General       | `Settings` | `projectSettingsModalOpen = true`, seccion `'general'`     |
| Director IA   | `Bot`      | `projectSettingsModalOpen = true`, seccion `'ia'`          |
| Compartir     | `UserPlus` | `/project/[shortId]/settings/sharing`                      |

---

### 3.3 Nivel: Video (`/project/[shortId]/video/[videoShortId]/*`)

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
- Label: "Escenas (N)" con conteo dinamico
- Cada escena: dot de estado + numero (monospace `tabular-nums`, alineado derecha) + titulo (truncado)
- Ordenadas por `sort_order` de la DB
- **Colapsado**: popover con icono `Clapperboard` (ver 5.5e)

**Colores de estado de escena** (dot `w-2 h-2 rounded-full`):

| Estado          | Clase Tailwind  |
|-----------------|-----------------|
| `draft`         | `bg-zinc-400`   |
| `prompt_ready`  | `bg-blue-400`   |
| `generating`    | `bg-amber-400`  |
| `generated`     | `bg-emerald-400`|
| `approved`      | `bg-emerald-600`|
| `rejected`      | `bg-red-400`    |

#### Acciones

| Item       | Icono      | Href                                                    |
|------------|------------|---------------------------------------------------------|
| Compartir  | `Share2`   | `/project/[shortId]/video/[videoShortId]/share`         |
| Exportar   | `Download` | `/project/[shortId]/video/[videoShortId]/export`        |

---

## 4. HEADER (Navbar)

### 4.1 Estructura

```
[ Back ] [ Breadcrumb Badge ]     [ Buscar... Cmd+K ]     [ Acciones contextuales ]
```

Altura: `h-11.75`. Flex row con `items-center`. Padding: `px-4`.

### 4.2 Seccion izquierda

| Elemento         | Condicion                                          | Detalle                                          |
|------------------|----------------------------------------------------|--------------------------------------------------|
| Boton Back       | Visible excepto en `/`, `/dashboard`, `/project`   | `ChevronLeft`, usa `pageHeaderContext.backHref` o `router.back()` |
| Breadcrumb Badge | Visible en `md+` (hidden en mobile)                | Pill con icono + label, `rounded-full bg-muted px-3 py-1` |

**Breadcrumb Badge por contexto:**

| Contexto       | Icono           | Labels posibles                                              |
|----------------|-----------------|--------------------------------------------------------------|
| Dashboard      | `LayoutGrid`    | "Dashboard", "Tareas", "Ajustes", "Admin", "Compartido"     |
| Proyecto       | `FolderKanban`  | "Proyecto", "Tareas", "Videos", "Recursos", etc.            |
| Video          | `Film`          | "Video", "Escenas", "Timeline", "Narracion", "Analisis"     |

### 4.3 Seccion central

| Elemento | Detalle                                                           |
|----------|-------------------------------------------------------------------|
| Buscar   | Icono `Search` + "Buscar" + badge `Cmd+K`                        |
|          | `rounded-xl border border-border bg-muted/50 cursor-pointer`     |
|          | Ancho: `w-64` en dashboard, `w-52 lg:w-60` en otras rutas       |
|          | Click o `Cmd+K` → abre SearchModal (ver 5.7)                     |

### 4.4 Seccion derecha — cambia por contexto

| Elemento              | Dashboard | Proyecto | Video | Detalle                                         |
|-----------------------|-----------|----------|-------|-------------------------------------------------|
| Feedback              | SI        | —        | —     | Texto "Feedback", abre FeedbackDialog (ver 5.9) |
| Nueva tarea           | SI        | —        | —     | `Plus` + "Nueva tarea" (lg+), solo icono mobile |
| Ajustes proyecto      | —         | SI       | —     | `Settings2` con tooltip "Ajustes del proyecto"  |
| Ajustes video         | —         | —        | SI    | `Settings2` con tooltip "Ajustes del video"     |
| Notificaciones        | SI        | SI       | SI    | `Bell` con badge rojo (ver 5.8)                 |
| Kiyoko IA / Asistente | SI        | SI       | SI    | `Bot` (ver 5.12)                                |

### 4.5 Boton IA por contexto

| Contexto  | Tooltip               | Comportamiento                                    |
|-----------|-----------------------|---------------------------------------------------|
| Dashboard | "Kiyoko IA"           | `toggleChat()` — panel de chat general            |
| Proyecto  | "Asistente contextual"| `openChat('sidebar')` + `setActiveAgent('project')` |
| Video     | "Asistente contextual"| `openChat('sidebar')` + `setActiveAgent('editor')` |

**Visual activo**: `border-primary bg-primary/10` cuando `isOpen === true`.

---

## 5. POPOVERS, DROPDOWNS Y MODALES

### 5.1 Workspace Switcher Popover

**Trigger**: click en logo/nombre del workspace en sidebar header.
**Componente**: `SidebarHeaderSection` → Popover
**Ancho**: `w-80`, `rounded-xl border border-border shadow-xl bg-card`

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

| Elemento      | Icono       | Accion                                            |
|---------------|-------------|---------------------------------------------------|
| Settings      | `Settings`  | `settingsModalOpen = true`, seccion `'perfil'`    |
| Download      | `Monitor`   | `window.open('https://kiyoko.ai/download', '_blank')` |
| Cerrar sesion | `LogOut`    | `supabase.auth.signOut()` → redirect `/login`     |

---

### 5.2 Dropdown de Proyecto (Sidebar)

**Trigger**: boton `...` (`MoreHorizontal`) al hover en proyecto.
**Componente**: `SidebarProjectItem` → DropdownMenu
**Posicion**: `side="right" align="start"`

| Item                        | Icono          | Accion                                           |
|-----------------------------|----------------|--------------------------------------------------|
| Abrir proyecto              | `ExternalLink` | `router.push('/project/[shortId]')`              |
| Copiar link                 | `Link2`        | `navigator.clipboard` + toast.success "Link copiado" |
| Compartir                   | `Share2`       | `router.push('/project/[shortId]/settings/sharing')` |
| ─ separador ─               |                |                                                  |
| Duplicar                    | `Copy`         | Duplica proyecto                                 |
| Renombrar                   | `Pencil`       | Inline rename                                    |
| ─ separador ─               |                |                                                  |
| Agregar/Quitar de favoritos | `Star`         | Toggle favorito, label cambia dinamicamente      |
| ─ separador ─               |                |                                                  |
| Eliminar                    | `Trash2`       | **Texto rojo** `text-red-500`. Elimina proyecto  |

---

### 5.3 Dropdown de Favorito (Sidebar)

Identico al 5.2 con diferencia:
- Item de favorito dice **"Quitar de favoritos"** con `Star` fill amarillo (`fill-yellow-400 text-yellow-400`).

---

### 5.4 Dropdown de Video (Sidebar)

**Trigger**: boton `...` al hover en video.
**Ancho**: `w-44`

| Item             | Icono          | Accion         |
|------------------|----------------|----------------|
| Abrir video      | `ExternalLink` | Navega al video|
| Duplicar         | `Copy`         | Duplica video  |
| Renombrar        | `Pencil`       | Inline rename  |
| ─ separador ─    |                |                |
| Eliminar         | `Trash2`       | **Texto rojo** |

---

### 5.5 Popovers del Sidebar Colapsado

Todos usan `w-56`, `rounded-xl border border-border bg-card shadow-lg`.

#### 5.5a Favoritos
**Trigger**: icono `Star`. Lista de favoritos como links.

#### 5.5b Proyectos
**Trigger**: icono `FolderClosed`.
- Header: "Proyectos" + boton `+`
- Lista con dot de estado
- Hover en proyecto: **sub-popover anidado** (`w-48`) con videos del proyecto (icono `Film` + dot + nombre)
- Vacio: "Sin proyectos"

#### 5.5c Videos (nivel proyecto)
**Trigger**: icono `Film`.
- Header: "Videos" + boton `+` (enlaza a crear video)
- Lista con dot de estado (colores seccion 3.2)
- Vacio: "Sin videos"

#### 5.5d Recursos (nivel proyecto)
**Trigger**: icono `Palette`.
- "Recursos" label
- 4 links: Personajes (`Users`), Fondos (`Mountain`), Estilos (`Paintbrush`), Templates (`FileText`)

#### 5.5e Escenas (nivel video)
**Trigger**: icono `Clapperboard`.
- "Escenas" label
- Lista: dot estado + numero `tabular-nums` + titulo truncado

---

### 5.6 Project Card Dropdown (Dashboard Grid)

**Trigger**: boton `...` en `ProjectCard`.
**Ancho**: `min-w-48`

| Item             | Icono        | Accion                                            |
|------------------|--------------|---------------------------------------------------|
| Abrir proyecto   | `FolderOpen` | Navega al proyecto                                |
| ─ separador ─    |              |                                                   |
| Editar           | `Pencil`     | `/project/[shortId]/settings`                     |
| Duplicar         | `Copy`       | Duplica                                           |
| ─ separador ─    |              |                                                   |
| Archivar         | `Archive`    | Cambia estado a `archived`                        |
| ─ separador ─    |              |                                                   |
| Eliminar         | `Trash2`     | **Texto rojo**. Abre ConfirmDeleteModal (ver 5.13)|

---

### 5.7 SearchModal (Cmd+K)

**Trigger**: `Cmd+K` o click en busqueda del header/sidebar.
**Componente**: `SearchModal`
**Dimensiones**: `max-w-180 h-[600px]`
**Posicion**: `fixed left-1/2 top-[8vh] -translate-x-1/2 z-50`
**Animacion**: `fade-in zoom-in-95`

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
+------------------------------------------+               |
|  [↑↓] Navegar  [↵] Abrir  [Ctrl+↵] Tab |               |
+------------------------------------------+---------------+
```

**Panel izquierdo:**

| Zona         | Implementacion                                                       |
|--------------|----------------------------------------------------------------------|
| Input        | `Search` icon + `<input>` placeholder "Buscar o hacer una pregunta..." + `Loader2 animate-spin` si fetching |
| Filtros      | Chips: `Todo`, `Proyectos`, `Videos`, `Escenas` + boton `SlidersHorizontal` |
| Chip activo  | `bg-primary/15 text-primary`                                        |
| Resultados   | Si `query.length >= 2`: resultados de busqueda agrupados            |
|              | Si `query.length < 2`: seccion "Navegacion rapida" + recientes     |
| Recientes    | Agrupados: "Hoy", "Ayer", "Ultimos 7 dias", "Anterior"            |
| Nav rapida   | Dashboard, Publicaciones, Compartidos, Tareas, Ajustes, API Keys   |
| Footer       | Shortcuts de teclado (`↑↓` `↵` `Ctrl+↵`) + boton `Settings`       |

**Panel derecho (preview, hidden en mobile):**
- `w-60`, fondo `bg-muted/30`
- Cover image o icono grande
- Subtitulo, titulo, badge de tipo, metadata

---

### 5.8 Notificaciones Popover

**Trigger**: icono `Bell` en header.
**Componente**: `NotificationBell`
**Ancho**: `w-80`
**Posicion**: `absolute right-0 top-full mt-2`

```
+-------------------------------------------+
|  Notificaciones             [Marcar todas]|
+-------------------------------------------+
|  [badge] Titulo notificacion     hace 2h  |
|          Body text truncado...            |
|                           [Ver] [Leida]   |
+-------------------------------------------+
```

- Header: "Notificaciones" + boton "Marcar todas" (solo si `unreadCount > 0`)
- Lista: `max-h-80 overflow-y-auto`
- Vacio: icono `Bell` centrado + "Sin notificaciones"

**Badge de tipo** (circulo con icono, color de fondo):

| Tipo               | Color bg     |
|--------------------|--------------|
| `task_due`         | `amber`      |
| `video_scheduled`  | `blue`       |
| `ai_completed`     | `purple`     |
| `scene_updated`    | `green`      |
| `export_ready`     | `cyan`       |
| `comment_mention`  | `pink`       |
| `share_invite`     | `indigo`     |

**Cada notificacion:**
- Badge icono coloreado
- Titulo (`font-medium` si no leida, `font-normal` si leida)
- Body (`line-clamp-2 text-xs text-muted-foreground`)
- Tiempo relativo (`text-xs text-muted-foreground`, alineado derecha)
- Boton "Ver" (si `notification.link` existe)
- Boton "Leida" (si `!notification.read`)

---

### 5.9 Feedback Dialog

**Trigger**: boton "Feedback" en header (solo en dashboard).
**Componente**: `FeedbackDialog`
**Ancho**: `w-80`
**Posicion**: `fixed top-0 right-0 pt-14 p-4 z-[100]`
**Animacion**: `animate-in fade-in slide-in-from-top-2`

**Paso 1 — Elegir tipo:**

| Opcion   | Icono            | Color    | Subtitulo              |
|----------|------------------|----------|------------------------|
| Problema | `AlertTriangle`  | `red`    | "con mi proyecto"      |
| Idea     | `Lightbulb`      | `amber`  | "para mejorar Kiyoko"  |

**Paso 2 — Escribir mensaje:**
- Titulo cambia: "Reportar problema" o "Compartir idea"
- Textarea (4 rows), `border-foreground/10 focus:border-primary`
- Boton switch: "Mejor enviar idea" / "Mejor reportar problema" (texto, toggle entre tipos)
- Boton "Enviar": `bg-primary text-white`, disabled si vacio, muestra "Enviando..." durante fetch

---

### 5.10 TaskCreatePanel

**Trigger**: `taskCreatePanelOpen = true` (boton header o UI store).
**Componente**: `TaskCreatePanel`
**Overlay**: `fixed inset-0 z-50 bg-black/55 backdrop-blur-sm`
**Panel**: `max-w-4xl h-[min(860px,92vh)] rounded-[28px] border border-border bg-card`

**Header**: badge `[X]` cerrar + label "NUEVA TAREA" (`text-xs uppercase tracking-widest`)

**Campos del formulario:**

| Campo        | Tipo                  | Placeholder / Opciones                                  | Requerido |
|--------------|-----------------------|---------------------------------------------------------|-----------|
| Proyecto     | Select                | Lista de proyectos del usuario                          | SI        |
| Video        | Select                | Videos del proyecto seleccionado                        | NO        |
| Titulo       | Input text            | —                                                       | SI        |
| Descripcion  | Textarea              | —                                                       | NO        |
| Categoria    | Select                | `guion, prompt, image_gen, video_gen, review, export, meeting, voiceover, editing, issue, annotation, otro` | NO |
| Prioridad    | Select                | `baja, media, alta, urgente`                            | NO        |
| Fecha limite | Input date            | —                                                       | NO        |

**Seccion sugerencias** (debajo del formulario):
- Grid 2 columnas (md+)
- Cada card: badge prioridad (`WandSparkles`), titulo, descripcion, justificacion, badge categoria, boton "Usar"

**Footer**: "Abrir en grande" (ghost) + "Cancelar" (ghost) + "Crear tarea" (primary, disabled si !titulo)

---

### 5.11 ConfirmDialog (generico)

**Componente**: `ConfirmDialog`
**Overlay**: `fixed inset-0 z-[70] bg-black/50`
**Panel**: `rounded-xl border border-border bg-card shadow-2xl max-w-65`
**Animacion**: Framer Motion `fade-in + spring`

```
+-----------------------------------+
|  Titulo                           |
|  Descripcion (opcional)           |
|                                   |
|  [Accion principal]               |
|  [Cancelar]                       |
+-----------------------------------+
```

**Variantes de boton:**
- `default`: `bg-foreground text-background`
- `danger`: `bg-red-500/90 text-white`
- `ghost`: `text-muted-foreground hover:bg-muted`

---

### 5.12 ConfirmDeleteModal (eliminar proyecto)

```
+-------------------------------------------+
|          [Trash2] (icono grande)          |
|                                           |
|  Esta accion es permanente.               |
|  Escribe el nombre del proyecto           |
|  para confirmar:                          |
|                                           |
|  [______________________________]         |
|                                           |
|  [Cancelar]  [Eliminar]                   |
+-------------------------------------------+
```

- Input: debe coincidir exactamente con el nombre del proyecto
- Boton "Eliminar": `bg-red-500 text-white`, `disabled` hasta que texto coincida
- Boton "Cancelar": ghost

---

### 5.13 Panel de Chat IA (Kiyoko)

**Trigger**: `Bot` en header o `Sparkles` en sidebar.
**Componente**: `KiyokoChat`
**Store**: `useAIStore`

**Modos de display:**

| Modo         | Layout                                           |
|--------------|--------------------------------------------------|
| `sidebar`    | Panel lateral derecho, anclado al viewport       |
| `floating`   | Ventana flotante draggable                       |
| `fullscreen` | Ocupa toda la pantalla                           |
| `minimized`  | Colapsado a barra minima                         |

**Agentes contextuales** (`setActiveAgent()`):

| Agente        | Se activa cuando...                              |
|---------------|--------------------------------------------------|
| `router`      | Por defecto, sin contexto especifico             |
| `project`     | Desde contexto de proyecto (header bot)          |
| `editor`      | Desde contexto de video (header bot)             |
| `scenes`      | Trabajando con escenas                           |
| `prompts`     | Trabajando con prompts de imagen                 |
| `characters`  | Trabajando con personajes                        |
| `backgrounds` | Trabajando con fondos                            |
| `tasks`       | Trabajando con tareas                            |
| `ideation`    | Modo brainstorming/ideacion                      |

**Layout del panel:**
```
+-------------------------------------------+
|  [Historial]  Kiyoko IA   [mode] [X]     |
+-------------------------------------------+
|  Context strip:                           |
|  [Proyecto: X] [Video: Y] [Escena: Z]    |
+-------------------------------------------+
|                                           |
|  Mensajes del chat (streaming real-time)  |
|  Indicador "pensando" (dots animation)    |
|  Action plans ejecutables                 |
|                                           |
+-------------------------------------------+
|  Sugerencias / follow-ups (chips)         |
+-------------------------------------------+
|  [Textarea input]              [Enviar]   |
+-------------------------------------------+
```

- **Historial lateral**: colapsable, ancho redimensionable `240-600px`
- **Creation cards**: overlay que aparece al completar generacion (personaje, fondo, video, proyecto)
- **Context strip**: muestra proyecto/video/escena activos como pills

---

## 6. MODALES DE CONFIGURACION

### 6.1 Shell base: WorkspaceSettingsModal

**Componente**: `WorkspaceSettingsModal`
**Usa**: HeroUI `Modal` con `backdrop="blur"`
**Dimensiones**: `h-[85vh] w-[80vw] max-w-5xl`
**Layout**: flex row

```
+------------------+--------------------------------------------+
|                  |                                            |
|  NAV LATERAL     |  CONTENIDO                                |
|  w-56 (224px)    |  flex-1, overflow-y-auto                  |
|  bg-card         |  max-w-2xl mx-auto                        |
|  border-r        |  px-8 py-6                                |
|                  |                                            |
+------------------+--------------------------------------------+
```

**Nav lateral:**
- Grupos con label (`text-xs font-medium text-muted-foreground uppercase`)
- Items con icono + label
- Activo: `bg-accent font-medium text-foreground`
- Inactivo: `text-muted-foreground hover:bg-accent/60`

---

### 6.2 Ajustes Globales (SettingsModal)

**Trigger**: `settingsModalOpen = true`
**Montaje**: en `src/app/(dashboard)/layout.tsx`
**Shell**: WorkspaceSettingsModal

**Navegacion lateral:**

```
Cuenta
  ├── Perfil          (User icon)
  ├── Preferencias    (Settings icon)
  ├── Notificaciones  (Bell icon)
  └── Seguridad       (Shield icon)

Integraciones
  └── Proveedores IA  (Key icon)

Facturacion
  └── Suscripcion     (CreditCard icon)
```

---

#### 6.2.1 Perfil

**Componente**: `PerfilSection`

**Card avatar** (top):
- Avatar `56px rounded-lg` con iniciales como fallback
- Nombre + email + fecha de registro

**Informacion basica:**

| Campo            | Tipo                | Placeholder                              |
|------------------|---------------------|------------------------------------------|
| Nombre completo  | TextField secondary | —                                        |
| Email            | TextField **readonly** | (no editable)                         |
| Bio              | TextArea 2 rows     | "Una breve descripcion..."               |
| Empresa / marca  | Input               | —                                        |

**Perfil creativo:**

| Campo                    | Tipo            | Placeholder / Descripcion                                       |
|--------------------------|-----------------|-----------------------------------------------------------------|
| Tipo de videos           | TextArea 2 rows | "Formato o estilo; separa con comas"                            |
| Plataformas y formatos   | TextArea 2 rows | "Donde publicas o en que formato entregas"                      |
| Contexto de uso          | TextArea 2 rows | "Asi la IA ajusta el tono (corporativo, cercano, etc.)"         |
| Objetivo y audiencia     | TextArea 2 rows | "Para quien creas y que buscas conseguir"                       |
| Duracion habitual        | Input           | "Rango tipico para calibrar ritmo y estructura"                 |

**Boton guardar**: sticky bottom, solo aparece si hay cambios (`isDirty`).

---

#### 6.2.2 Preferencias

**Componente**: `PreferenciasSection`

**Apariencia:**

| Campo                  | Tipo           | Opciones                                        |
|------------------------|----------------|-------------------------------------------------|
| Tema                   | SettingsSelect | `light`, `dark`, `system`                       |
| Estilo visual default  | SettingsSelect | `pixar`, `anime`, `realistic`, `watercolor`, `comic`, `minimal` |

**Idioma y region:**

| Campo  | Tipo           | Opciones           |
|--------|----------------|--------------------|
| Idioma | SettingsSelect | `es`, `en`, `fr`, `pt` |

**Notificaciones:**

| Campo                    | Tipo   |
|--------------------------|--------|
| Notificaciones en la app | Switch |

**Privacidad:**

| Campo              | Tipo   |
|--------------------|--------|
| Cookies            | Toggle |
| Cookies analiticas | Switch |

---

#### 6.2.3 Notificaciones

**Componente**: `NotificacionesSection`

**Email:**

| Campo                   | Tipo   | Descripcion                                    |
|-------------------------|--------|------------------------------------------------|
| Actividad del proyecto  | Switch | "Comentarios, menciones y cambios importantes" |
| Resumen semanal         | Switch | "Resumen de actividad de tu organizacion"      |

**En la app:**

| Campo                      | Tipo   | Descripcion                                              |
|----------------------------|--------|----------------------------------------------------------|
| Comentarios y menciones    | Switch | "Cuando alguien te menciona o comenta en tu trabajo"     |
| Actualizaciones del sistema| Switch | "Nuevas funciones y mejoras de Kiyoko AI"                |

---

#### 6.2.4 Seguridad

**Componente**: `SeguridadSection`

**Contrasena:**
- Boton "Cambiar contrasena" → envia email reset → toast.success "Se ha enviado un email..."

**Autenticacion en dos pasos (2FA):**
- Indicador de estado: badge "Activo" (verde) o "Inactivo" (gris)
- Flujo de setup:
  1. Genera QR code
  2. Muestra codigo manual como alternativa
  3. Input de verificacion (6 digitos)
  4. Confirma activacion

**Zona de peligro:**
- Texto: "Eliminar tu cuenta es irreversible. Se eliminaran todos tus proyectos, videos y datos."
- Boton: "Eliminar mi cuenta" — variante `danger-soft`

---

#### 6.2.5 Proveedores de IA (API Keys)

**Componente**: `ApiKeysSection`

Lista expandible de proveedores. Cada fila muestra:
- Dot de estado (verde = tiene key)
- Nombre del proveedor + badge "Free" o "Premium"
- Descripcion
- Key hint parcial (si guardada): `sk-...xxxx`
- Contador de requests (si disponible)
- Botones: Eliminar key / Agregar key

**Proveedores gratuitos**: Groq, Cerebras, Mistral, Gemini
**Proveedores premium**: Grok (xAI), DeepSeek, Claude, OpenAI

**Formulario agregar key:**
- Input type password con toggle show/hide (`Eye` / `EyeOff`)
- Boton "Guardar"

**Nota de seguridad** (callout):
> "Las API keys se cifran con AES-256 antes de guardarse. Nunca se muestran completas."

---

#### 6.2.6 Suscripcion

**Componente**: `SuscripcionSection`

**Card plan actual:**
- Nombre del plan: "Gratuito" o "Pro"
- Fecha de renovacion (si Pro)
- Lista de features con checkmarks (`Check` icon)

**Uso este mes** (barras de progreso):

| Metrica             | Detalle                   |
|---------------------|---------------------------|
| Mensajes IA texto   | Count / limite            |
| Imagenes generadas  | Count / limite            |
| Videos generados    | Count / limite            |
| Caracteres TTS      | Count / limite            |
| Almacenamiento      | MB usados / limite        |

**CTA upgrade** (solo para plan gratuito):
- Icono `Zap`
- "Plan Pro — Proximamente"
- Lista de features Pro
- Boton: "Notificarme cuando este disponible"

---

### 6.3 Crear Proyecto (ProjectCreatePanel)

**Trigger**: `projectCreatePanelOpen = true` (boton `+` en sidebar o nav).
**Componente**: `ProjectCreatePanel`
**Overlay**: `fixed inset-0 z-50 bg-black/55 backdrop-blur-sm`
**Panel**: `rounded-[28px] border border-border bg-card h-[min(860px,92vh)] max-w-4xl`

**Header**: icono `Folder` en badge + "Nuevo proyecto" + boton cerrar `[X]`

**Campos:**

| Campo          | Tipo                | Placeholder                            | Requerido |
|----------------|---------------------|----------------------------------------|-----------|
| Titulo         | TextField secondary | "Nombre del proyecto"                  | SI        |
| Cliente        | TextField           | "Marca o cliente"                      | NO        |
| Descripcion    | TextArea 4 rows     | "Objetivo creativo, formato, entregables" | NO     |
| Estilo visual  | Select + pills      | Default: `pixar`                       | SI        |

**Opciones de estilo visual:**
`pixar`, `realistic`, `anime`, `watercolor`, `flat_2d`, `cyberpunk`, `custom`

**Selector visual de estilo:**
- Pills/botones en fila, cada uno seleccionable
- Al seleccionar: muestra caja con icono `Palette` + descripcion del estilo
- Estilo activo: `bg-primary/10 border-primary`

**Grid resumen** (3 columnas con iconos):
- "Brief claro" — indica titulo llenado
- "Estilo definido" — indica estilo seleccionado
- "Borrador listo" — indica todo completo

**Footer**: "Cancelar" (ghost) + "Crear proyecto" (primary, `disabled` si `!title.trim()`)

**On submit:**
1. Genera `shortId` con nanoid
2. Genera `slug` desde titulo
3. Insert en Supabase `projects`
4. `queryClient.invalidateQueries(['projects'])`
5. `router.push('/project/${shortId}')`
6. toast.success "Proyecto creado"

---

### 6.4 Ajustes de Proyecto (ProjectSettingsModal)

**Trigger**: `projectSettingsModalOpen = true`
**Montaje**: en `src/app/(dashboard)/project/[shortId]/layout.tsx`
**Shell**: WorkspaceSettingsModal

**Navegacion lateral:**

```
├── General      (Settings2 icon)
└── Contexto IA  (Bot icon)
```

---

#### 6.4.1 General

**Campos:**

| Campo        | Tipo            | Placeholder                      | Requerido |
|--------------|-----------------|----------------------------------|-----------|
| Cover image  | Upload area     | Aspect video, gradient placeholder | NO      |
| Titulo       | Input text      | "Nombre del proyecto"            | SI        |
| Cliente      | Input text      | "Cliente o marca"                | NO        |
| Estado       | Select          | —                                | SI        |
| Estilo base  | Select          | —                                | NO        |
| Descripcion  | TextArea 4 rows | "Objetivo, tono y resultado esperado" | NO   |
| Tags         | Input text      | "campana, lanzamiento, vertical" | NO        |

**Opciones de estado:**
`draft`, `in_progress`, `review`, `completed`, `archived`

**Opciones de estilo base:**
`none`, `realistic`, `anime`, `cartoon`, `cinematic`, `minimal`, `mixed`

**Tags**: separados por comas. Helper: "Separa etiquetas por comas."

**Cover image:**
- Area aspect-video con fondo gradient
- Boton upload + boton delete (si tiene imagen)

---

#### 6.4.2 Contexto IA

**Campos:**

| Campo                                | Tipo               | Placeholder                                                      |
|--------------------------------------|--------------------|------------------------------------------------------------------|
| Briefing del proyecto                | TextArea 5 rows    | "Que busca el proyecto, a quien va dirigido y que debe optimizar la IA" |
| Reglas globales de prompts           | TextArea 5 rows `font-mono` | "Consistencia visual, restricciones, camara, vestuario, composicion" |
| Descripcion de estilo personalizada  | TextArea 4 rows    | "Matices extra sobre el estilo base del proyecto"                |

**Callout info** (icono info, `bg-primary/5 border-primary/20`):
> "Cuanto mejor definas briefing, reglas y estilo, mas consistente sera la ayuda de Kiyoko al crear tareas, prompts, personajes o fondos."

**Boton guardar**: top-right del modal, `disabled` si no hay cambios o titulo vacio.

---

### 6.5 Ajustes de Video (VideoSettingsModal)

**Trigger**: `videoSettingsModalOpen = true`
**Montaje**: en `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/layout.tsx`
**Shell**: WorkspaceSettingsModal

**Navegacion lateral:**

```
├── General    (Settings2 icon)
└── Narracion  (AudioLines icon)
```

---

#### 6.5.1 General

**Campos:**

| Campo             | Tipo            | Placeholder / Opciones                                | Requerido |
|-------------------|-----------------|-------------------------------------------------------|-----------|
| Titulo            | Input text      | "Nombre del video"                                    | SI        |
| Plataforma        | Select          | `youtube`, `youtube_shorts`, `tiktok`, `instagram_reels`, `tv` | SI |
| Estado            | Select          | `draft`, `prompting`, `generating`, `review`, `approved`, `exported` | SI |
| Tipo de video     | Select          | `storyboard`, `animatic`, `ad`, `social`, `other`     | SI        |
| Aspect ratio      | Select          | `16:9`, `9:16`, `1:1`, `4:5`                          | NO        |
| Duracion objetivo | Input number    | "Ej. 30"                                              | NO        |
| Descripcion       | TextArea 4 rows | "Resumen creativo o notas operativas del video"       | NO        |
| Video principal   | Checkbox        | "Marcar como video principal del proyecto"            | NO        |

---

#### 6.5.2 Narracion

**Campos:**

| Campo               | Tipo          | Placeholder                           |
|---------------------|---------------|---------------------------------------|
| Proveedor           | Input text    | "Ej. elevenlabs"                      |
| Nombre de voz       | Input text    | "Nombre descriptivo de la voz"        |
| Estilo de narracion | Input text    | "Calma, energetica, institucional..." |
| Velocidad           | Input decimal | "1, 1.1, 0.9..."                     |

**Callout info:**
> "Usa este modal para fijar el formato del video y el comportamiento de narracion sin salir de la pagina actual. Los cambios se reflejan en el overview y en los flujos de exportacion."

---

### 6.6 Crear Video (VideoCreateModal)

**Trigger**: prop `open` desde componente padre.
**Overlay**: `fixed inset-0 z-50 bg-black/60`
**Panel**: `rounded-2xl border border-border bg-card shadow-2xl max-w-lg`

**Header**: badge `Video` icon + "Nuevo Video" + subtitulo "Anade un video al proyecto" + `[X]`

**Toggle de modo** (2 botones tab):
- "Manual" — modo manual
- "Generar con IA" — modo asistido
- Activo: `bg-primary/10 border-primary text-primary shadow-sm`

**Modo Manual:**

| Campo    | Tipo       | Placeholder                            | Requerido |
|----------|------------|----------------------------------------|-----------|
| Titulo   | Input text | "Ej. Spot YouTube semana 12..."        | SI        |

**Modo IA:**

| Campo            | Tipo            | Placeholder                                              | Requerido |
|------------------|-----------------|----------------------------------------------------------|-----------|
| Describe el video| TextArea 3 rows | "Ej: Un reel de 30s mostrando la nueva coleccion..." | SI        |

**Campos comunes (ambos modos):**

| Campo        | Tipo              | Opciones / Detalle                                          |
|--------------|-------------------|-------------------------------------------------------------|
| Plataforma   | Grid 5 botones    | YouTube (16:9), Instagram Reels (9:16), TikTok (9:16), TV (16:9), Web (16:9) |
| Duracion     | Input number      | Min 5, max 600, sufijo "seg"                                |
| Aspect ratio | Select dropdown   | 16:9 (Horizontal), 9:16 (Vertical), 1:1 (Cuadrado), 4:5 (Feed) |

**Plataforma seleccionada**: `border-primary bg-primary/10`

**Preview box**: representacion visual del aspect ratio + texto plataforma + duracion + ratio.

**Footer**: "Cancelar" (ghost) + "Crear video" / "Generar video" (primary/secondary segun modo)

---

### 6.7 Crear Escena (SceneCreateModal)

**Shell**: `ModalShell` (HeroUI Drawer, `placement="right"`, `sm:max-w-180`)
**Titulo**: "Nueva escena #N"
**Descripcion**: "Anade una escena al video"

**Campos:**

| Campo              | Tipo            | Placeholder / Opciones                             | Requerido |
|--------------------|-----------------|----------------------------------------------------|-----------|
| Titulo             | TextField       | "Ej. Ana entra en la oficina"                      | SI        |
| Fase narrativa     | Select (2-col)  | `setup`, `rising_action`, `climax`, `falling_action`, `resolution` | NO |
| Tipo               | Select (2-col)  | `storyboard`, `animatic`, `ad`, `social`, `other`  | NO        |
| Duracion           | Slider 1-30     | Muestra "Duracion: {value}s"                       | NO        |
| Descripcion visual | TextArea 3 rows | "Que se ve: acciones, ambiente, detalles..."       | NO        |
| Dialogo/Narracion  | TextArea 2 rows | "Que se dice o narra en esta escena..."            | NO        |

**Descripcion visual helper**: "La IA usara esto para generar el prompt de imagen."

**Footer**: "Cancelar" (ghost) + "Crear" (primary, disabled si !titulo)

---

### 6.8 Crear Personaje (CharacterCreateModal)

**Shell**: `ModalShell` (Drawer right)
**Titulo**: "Nuevo personaje"
**Descripcion**: "Anade un personaje al proyecto"

**Seccion IA** (box con borde `border-primary/20 bg-primary/5`):
- Icono `Sparkles` + "Genera con IA"
- TextArea 3 rows: "Describe tu personaje" → placeholder "Ej. Una hacker de 27 anos..."
- Boton "Generar con IA" (`Sparkles` icon)
- **Output condicional**: si IA genera, muestra box "DIRECCION DE VOZ SUGERIDA" con `Volume2` icon

**Campos del personaje:**

| Campo               | Tipo            | Placeholder                                    | Requerido |
|---------------------|-----------------|-------------------------------------------------|-----------|
| Nombre              | TextField (2-col)| "Ej. Ana Garcia"                               | SI        |
| Rol                 | Select (2-col)  | `protagonist`, `antagonist`, `supporting`, `comic_relief`, etc. | NO |
| Descripcion general | TextArea 2 rows | "Quien es este personaje, su historia..."       | NO        |
| Descripcion visual  | TextArea 3 rows | "Aspecto fisico: edad, complexion, rasgos..."   | NO        |
| Personalidad        | TextArea 2 rows | "Rasgos de personalidad, forma de hablar..."    | NO        |
| Pelo                | Input (2-col)   | "Ej. Castano largo ondulado"                    | NO        |
| Ropa caracteristica | Input (2-col)   | "Ej. Chaqueta de cuero"                         | NO        |
| Accesorios          | Input           | "Gafas, reloj, mochila (separados por coma)"    | NO        |
| Prompt snippet      | TextArea 3 rows | "English reusable prompt for image/video gen"    | NO        |

**Descripcion visual helper**: "Usado por la IA para generar imagenes consistentes."
**Prompt snippet helper**: "Fragmento reutilizable que la app insertara en prompts de escenas."

---

### 6.9 ImagePreviewModal

**Componente**: `ImagePreviewModal`
**Overlay**: `fixed inset-0 z-220 bg-black/90 backdrop-blur-md`

**Header bar:**
- `File` icon + nombre archivo + indice (current/total) + tamano
- Tipo de archivo

**Controles (solo imagenes):**
- Zoom out (`ZoomOut`) + porcentaje + Zoom in (`ZoomIn`)
- Reset (`RotateCcw`)
- Abrir externo (`ExternalLink`)
- Descargar (`Download`)
- Cerrar (`X`)

**Preview por tipo:**
- **Imagen**: `<Image>` con transform zoom
- **PDF**: `<iframe>`
- **Video**: `<video controls>`
- **Audio**: icono `Music` + `<audio>`
- **Texto**: `<pre>` fondo oscuro
- **Otro**: icono generico + mensaje

**Navegacion** (si multiples archivos):
- Botones prev/next (`ChevronLeft` / `ChevronRight`)
- Strip de thumbnails en la parte inferior

---

## 7. SISTEMA DE TOASTS

### 7.1 Configuracion actual

**Libreria**: Sonner v2
**Componente**: `KiyokoToaster` en `src/components/ui/toast.tsx`
**Montaje**: `src/app/layout.tsx` (raiz, fuera de providers)
**Posicion actual**: `bottom-right`

### 7.2 NUEVA especificacion de toasts (IMPLEMENTAR)

> Cambiar la posicion a **`bottom-center`** y mejorar el diseno visual.

**Posicion**: `bottom-center`
**Gap**: `8px`
**Expand**: `false`

### 7.3 Variantes de toast

#### Toast de exito
```
+-----------------------------------------------+
|  [CheckCircle2]  Proyecto creado               |
|                  Se ha anadido a tu workspace  |
+-----------------------------------------------+
```
- Icono: `CheckCircle2` — `text-success-500`
- Borde: `border-success-200 dark:border-success-800`
- Fondo del icono: `bg-success-500/10 rounded-full p-1`

#### Toast de error
```
+-----------------------------------------------+
|  [XCircle]  Error al guardar                   |
|             Revisa tu conexion e intenta de... |
+-----------------------------------------------+
```
- Icono: `XCircle` — `text-danger-500`
- Borde: `border-danger-200 dark:border-danger-800`

#### Toast de warning
```
+-----------------------------------------------+
|  [AlertTriangle]  Sesion por expirar           |
|                   Guarda tus cambios           |
+-----------------------------------------------+
```
- Icono: `AlertTriangle` — `text-warning-500`
- Borde: `border-warning-200 dark:border-warning-800`

#### Toast de info
```
+-----------------------------------------------+
|  [Info]  Nueva version disponible              |
|          Actualiza para las ultimas mejoras   |
+-----------------------------------------------+
```
- Icono: `Info` — `text-primary-500`
- Borde: `border-primary-200 dark:border-primary-800`

#### Toast de carga (loading) — NUEVO DISENO
```
+-----------------------------------------------+
|  [Loader2 spin]  Generando imagenes...         |
|                  Escena 3 de 8                 |
|  [━━━━━━━━━━░░░░░░░░░░]  37%                  |
+-----------------------------------------------+
```
- Icono: `Loader2` con `animate-spin` — `text-muted-foreground`
- **Barra de progreso** (opcional): `h-1 rounded-full bg-primary/20` con fill `bg-primary`
- Subtitulo con detalle del progreso
- **NO se cierra automaticamente** — se actualiza con `toast.loading(msg, { id })` y se completa con `toast.success` o `toast.error` usando el mismo `id`

#### Toast de IA procesando — NUEVO
```
+-----------------------------------------------+
|  [Sparkles pulse]  Kiyoko esta pensando...     |
|                    Analizando tu proyecto      |
+-----------------------------------------------+
```
- Icono: `Sparkles` con `animate-pulse` — `text-primary`
- Borde: `border-primary/30`
- Fondo sutil: `bg-primary/5`

#### Toast de subida de archivo — NUEVO
```
+-----------------------------------------------+
|  [Upload spin]  Subiendo cover.jpg             |
|                 2.4 MB / 5.1 MB               |
|  [━━━━━━━━━━━━░░░░░░░░]  47%                  |
+-----------------------------------------------+
```
- Icono: `Upload` con `animate-spin` — `text-primary`
- Subtitulo con progreso de bytes
- Barra de progreso
- Se actualiza en tiempo real con el mismo `id`
- Al completar: transiciona a toast.success "Archivo subido"

### 7.4 Estilos base del toast (ACTUALIZAR)

```tsx
// src/components/ui/toast.tsx — KiyokoToaster
<Toaster
  position="bottom-center"          // CAMBIO: era bottom-right
  expand={false}
  richColors={false}
  gap={8}
  toastOptions={{
    unstyled: false,
    classNames: {
      toast: [
        'group flex items-start gap-3 rounded-2xl border border-border',    // rounded-2xl
        'bg-card/95 backdrop-blur-xl',                                      // glassmorphism
        'px-4 py-3.5 text-sm text-foreground',                             // mas padding
        'shadow-xl shadow-black/15 dark:shadow-black/40',                  // sombra mas marcada
        'min-w-80 max-w-md',                                               // ancho minimo
      ].join(' '),
      title:       'font-medium text-foreground leading-snug',
      description: 'text-xs text-muted-foreground mt-0.5 leading-relaxed',
      actionButton:'rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors',
      cancelButton:'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors',
      closeButton: 'opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 text-muted-foreground hover:text-foreground',
      error:       'border-danger-200/60 dark:border-danger-800/60',
      success:     'border-success-200/60 dark:border-success-800/60',
      warning:     'border-warning-200/60 dark:border-warning-800/60',
      info:        'border-primary-200/60 dark:border-primary-800/60',
    },
  }}
/>
```

**Cambios clave respecto al actual:**
1. `position="bottom-center"` — centrado abajo en vez de derecha
2. `rounded-2xl` — esquinas mas redondeadas
3. `bg-card/95 backdrop-blur-xl` — efecto glassmorphism
4. `shadow-xl` — sombra mas prominente
5. `min-w-80 max-w-md` — ancho minimo para que no queden estrechos
6. Close button con `opacity-0 group-hover:opacity-100` — aparece solo al hover
7. Bordes con `/60` opacity — mas sutiles

### 7.5 API de uso

```ts
import { toast } from '@/components/ui/toast';

// Basico
toast.success('Proyecto creado');
toast.error('Error al guardar');
toast.warning('Sesion por expirar');
toast.info('Nueva version disponible');

// Con descripcion
toast.success('Video exportado', {
  description: 'Disponible en la seccion de descargas'
});

// Loading con progreso (patron para IA y uploads)
const id = toast.loading('Generando imagenes...', {
  description: 'Escena 1 de 8'
});
// Actualizar progreso
toast.loading('Generando imagenes...', {
  id,
  description: 'Escena 4 de 8'
});
// Completar
toast.success('Imagenes generadas', { id });

// Promise (auto loading → success/error)
toast.promise(uploadFile(file), {
  loading: 'Subiendo archivo...',
  success: 'Archivo subido',
  error: 'Error al subir archivo'
});

// Custom con accion
toast.info('Cambios sin guardar', {
  action: { label: 'Guardar', onClick: () => save() },
  cancel: { label: 'Descartar', onClick: () => discard() }
});
```

### 7.6 Cuando mostrar toasts

| Evento                     | Tipo      | Mensaje ejemplo                          |
|----------------------------|-----------|------------------------------------------|
| Crear proyecto             | success   | "Proyecto creado"                        |
| Crear video                | success   | "Video \"{titulo}\" creado"              |
| Crear escena               | success   | "Escena creada"                          |
| Crear personaje            | success   | "Personaje creado"                       |
| Guardar ajustes            | success   | "Cambios guardados"                      |
| Copiar link                | success   | "Link copiado"                           |
| Eliminar recurso           | success   | "Proyecto eliminado"                     |
| Error de red               | error     | "Error de conexion"                      |
| Error de validacion        | error     | "El titulo es obligatorio"               |
| Error de permisos          | error     | "No tienes permiso"                      |
| Generando con IA           | loading   | "Generando..." + descripcion progreso    |
| IA pensando                | loading   | "Kiyoko esta pensando..." (con Sparkles) |
| Subiendo archivo           | loading   | "Subiendo {nombre}..." + barra progreso  |
| Exportando video           | loading   | "Exportando..." + barra progreso         |
| Sesion expirando           | warning   | "Sesion por expirar"                     |
| Cambiar contrasena         | success   | "Email de reset enviado"                 |
| Guardar API key            | success   | "API key guardada"                       |

---

## 8. Comportamiento responsive

### Sidebar

| Estado      | Comportamiento                                                      |
|-------------|---------------------------------------------------------------------|
| Expandido   | Iconos + texto + secciones completas con listas scrolleables        |
| Colapsado   | Solo iconos con tooltips `placement="right"`                        |
|             | Listas → popovers (seccion 5.5)                                    |
|             | Separadores `<hr>` entre secciones                                 |

### Header

| Breakpoint | Comportamiento                                                 |
|------------|----------------------------------------------------------------|
| Mobile     | Back button visible, breadcrumb oculto, boton tarea solo icono |
| `md+`      | Breadcrumb badge visible                                       |
| `lg+`      | Busqueda mas ancha (`w-64`), boton tarea con texto             |

### Modales

| Breakpoint | Comportamiento                                                 |
|------------|----------------------------------------------------------------|
| Mobile     | Modales ocupan casi toda la pantalla, nav lateral se colapsa   |
| `md+`      | `w-[80vw] max-w-5xl h-[85vh]` para settings                   |
| `lg+`      | Layout completo con nav lateral + contenido                    |

---

## 9. Resumen visual por pantalla

```
DASHBOARD
  Sidebar: [Nav fija] + Favoritos + Proyectos + Admin(si admin)
  Header:  Breadcrumb "Dashboard" | Buscar | Feedback + Nueva tarea + Bell + Bot
  Modales: SettingsModal, ProjectCreatePanel, TaskCreatePanel, SearchModal

PROYECTO
  Sidebar: [Nav fija] + General/Tareas/Pub + Videos + Recursos + Ajustes
  Header:  Back + "Proyecto" | Buscar | Settings proyecto + Bell + Bot(contextual)
  Modales: ProjectSettingsModal, VideoCreateModal, SearchModal

VIDEO
  Sidebar: [Nav fija] + General/Escenas/Timeline/Narracion/Analisis + Escenas + Acciones
  Header:  Back + "Video" | Buscar | Settings video + Bell + Bot(contextual)
  Modales: VideoSettingsModal, SceneCreateModal, CharacterCreateModal, SearchModal
```

---

## 10. Archivos de referencia

| Componente              | Archivo                                                     |
|-------------------------|-------------------------------------------------------------|
| **Layout**              |                                                             |
| Layout dashboard        | `src/app/(dashboard)/layout.tsx`                            |
| Layout proyecto         | `src/app/(dashboard)/project/[shortId]/layout.tsx`          |
| Layout video            | `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/layout.tsx` |
| **Sidebar**             |                                                             |
| AppSidebar              | `src/components/layout/AppSidebar.tsx`                      |
| SidebarHeader           | `src/components/layout/sidebar/SidebarHeader.tsx`           |
| SidebarNavFixed         | `src/components/layout/sidebar/SidebarNavFixed.tsx`         |
| SidebarNavMain          | `src/components/layout/sidebar/SidebarNavMain.tsx`          |
| SidebarFavorites        | `src/components/layout/sidebar/SidebarFavorites.tsx`        |
| SidebarProjects         | `src/components/layout/sidebar/SidebarProjects.tsx`         |
| SidebarProjectItem      | `src/components/layout/sidebar/SidebarProjectItem.tsx`      |
| SidebarProjectNav       | `src/components/layout/sidebar/SidebarProjectNav.tsx`       |
| SidebarVideoNav         | `src/components/layout/sidebar/SidebarVideoNav.tsx`         |
| SidebarVideoItem        | `src/components/layout/sidebar/SidebarVideoItem.tsx`        |
| SidebarFooter           | `src/components/layout/sidebar/SidebarFooterContent.tsx`    |
| SidebarAdmin            | `src/components/layout/sidebar/SidebarAdmin.tsx`            |
| **Header**              |                                                             |
| Header                  | `src/components/layout/Header.tsx`                          |
| NotificationBell        | `src/components/layout/NotificationBell.tsx`                |
| SearchModal             | `src/components/layout/SearchModal.tsx`                     |
| **Modales**             |                                                             |
| SettingsModal           | `src/components/settings/SettingsModal.tsx`                 |
| WorkspaceSettingsModal  | `src/components/settings/WorkspaceSettingsModal.tsx`        |
| PerfilSection           | `src/components/settings/modal-settings/PerfilSection.tsx`  |
| PreferenciasSection     | `src/components/settings/modal-settings/PreferenciasSection.tsx` |
| NotificacionesSection   | `src/components/settings/modal-settings/NotificacionesSection.tsx` |
| SeguridadSection        | `src/components/settings/modal-settings/SeguridadSection.tsx` |
| ApiKeysSection          | `src/components/settings/modal-settings/ApiKeysSection.tsx` |
| SuscripcionSection      | `src/components/settings/modal-settings/SuscripcionSection.tsx` |
| ProjectCreatePanel      | `src/components/project/ProjectCreatePanel.tsx`             |
| ProjectSettingsModal    | `src/components/project/ProjectSettingsModal.tsx`           |
| VideoSettingsModal      | `src/components/video/VideoSettingsModal.tsx`               |
| VideoCreateModal        | `src/components/videos/VideoCreateModal.tsx`                |
| SceneCreateModal        | `src/components/modals/scene/SceneCreateModal.tsx`          |
| CharacterCreateModal    | `src/components/modals/character/CharacterCreateModal.tsx`  |
| **Shared**              |                                                             |
| ConfirmDialog           | `src/components/shared/ConfirmDialog.tsx`                   |
| FeedbackDialog          | `src/components/shared/FeedbackDialog.tsx`                  |
| ImagePreviewModal       | `src/components/shared/ImagePreviewModal.tsx`               |
| ModalShell              | `src/components/modals/shared/ModalShell.tsx`               |
| **Tasks**               |                                                             |
| TaskCreatePanel         | `src/components/tasks/TaskCreatePanel.tsx`                  |
| **Chat**                |                                                             |
| KiyokoChat              | `src/components/chat/KiyokoChat.tsx`                        |
| **Toast**               |                                                             |
| KiyokoToaster           | `src/components/ui/toast.tsx`                               |
| **Cards**               |                                                             |
| ProjectCard             | `src/components/project/ProjectCard.tsx`                    |
| **UI primitivos**       |                                                             |
| Sidebar                 | `src/components/ui/sidebar.tsx`                             |
| **Stores**              |                                                             |
| UI Store                | `src/stores/ui-store.ts`                                    |
| AI Store                | `src/stores/ai-store.ts`                                    |
