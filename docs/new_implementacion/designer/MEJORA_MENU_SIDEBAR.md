# Kiyoko AI — Rediseño del Sidebar inspirado en Notion

> Análisis de Notion + propuesta para Kiyoko AI.
> Mantener: logo arriba centrado, usuario abajo, estilo dark.

---

## Cómo funciona el sidebar de Notion

### Estructura vertical (de arriba a abajo)

```
┌─────────────────────────────┐
│ 🟣 Pvenegas        [✏️] [▾] │  ← Workspace/Org header con acciones
│                              │
│ 🔍 Search                    │  ← Búsqueda rápida
│ 🏠 Home                      │  ← Página principal
│ 📅 Meetings                  │
│ ✨ Notion AI                 │  ← IA como acceso directo
│ 📬 Inbox                     │
│ 📚 Library                   │
│                              │
│ Recents                      │  ← SECCIÓN RECIENTES
│ ▸ 📁 Proyecto Marca de R...  │  ← Click expande sub-páginas
│   · Tabla General            │     ← Sub-items indentados
│   · Tablero Kanban           │
│   · Identidad de Marca  ●   │     ← Dot = página activa
│   · Calendario               │
│   · Por Colección            │
│   · Línea de Tiempo          │
│ 💿 Desarrollos               │  ← Otro reciente (sin sub-items)
│ 🎯 Monthly Goals             │
│                              │
│ Favorites                    │  ← SECCIÓN FAVORITOS
│ 📁 Proyecto Marca de Ropa   │
│                              │
│ Agents            Beta       │  ← Agentes IA
│ + New agent                  │
│                              │
│ Teamspaces                   │  ← ESPACIOS (= nuestras Orgs)
│ 🏠 Pvenegas's Notion HQ     │
│   📁 Proyecto Marca de Ro...│
│   📝 Notas de Marca          │
│   + Add new                  │
│                              │
│ Private                      │
│ 📄 New page                  │
│ 💿 Desarrollos               │
│ + Add new                    │
│                              │
│ Notion apps                  │
│ ✉️ Notion Mail               │
│ 📅 Notion Calendar           │
│ 🖥️ Notion Desktop            │
│                              │
│ ⚙️ Settings                  │
│ 🏪 Marketplace               │
│ 🗑️ Trash                     │
│                              │
│ ❓                           │  ← Ayuda
└─────────────────────────────┘
```

### Comportamientos clave de Notion

1. **Recientes desplegables**: Click en el proyecto → expande sus sub-páginas inline. Click en `▸` → despliega. Click en `···` → context menu (Copiar link, Duplicar, Renombrar, Mover, Eliminar).

2. **Hover actions**: Al hacer hover sobre un reciente aparecen `···` (menú) y `+` (crear sub-página).

3. **Context menu**: Click derecho o `···` → menú con: Remove from Favorites, Copy link, Duplicate, Rename, Move to, Move to Trash, Open in new tab, Open in side peek.

4. **Sección colapsable**: Cada sección se puede colapsar (Recents, Favorites, Teamspaces, Private).

5. **Estado activo**: La página activa tiene fondo más claro y un dot/indicador.

6. **Ancho fijo**: ~240px expandido, ~48px colapsado (solo iconos).

---

## Propuesta para Kiyoko AI

### Estructura del sidebar

```
┌─────────────────────────────┐
│                              │
│      🌿 Kiyoko AI            │  ← Logo centrado + nombre
│                              │
│──────────────────────────────│
│                              │
│ 🔍 Buscar...           ⌘K   │  ← Input de búsqueda (CommandMenu)
│ 🏠 Dashboard                 │  ← Navegación principal
│ 💬 Kiyoko IA                 │  ← Acceso directo al chat IA
│                              │
│ Recientes                    │  ← PROYECTOS RECIENTES
│ ▸ 📁 Domenech Pelq...  ···  │  ← Click despliega vídeos
│   🎬 Presentación Yo...     │     ← Vídeos del proyecto
│   🎬 Reel TikTok 30s        │
│   + Nuevo vídeo              │     ← Crear vídeo directo
│ ▸ 📁 Otro proyecto     ···  │
│ + Nuevo proyecto             │
│                              │
│ Favoritos                    │  ← PROYECTOS FAVORITOS
│ ⭐ Domenech Peluquerías     │
│                              │
│ Admin                        │  ← Solo si role=admin
│ 📊 Panel admin               │
│ 👥 Usuarios                  │
│                              │
│──────────────────────────────│
│                              │
│ ⚙️ Ajustes                   │
│ 🏢 Organizaciones            │
│                              │
│──────────────────────────────│
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔴 DK                    │ │  ← Avatar + nombre + email
│ │ dev@kiyoko.ai            │ │     Click → dropdown con opciones
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

### Cuando estás dentro de un PROYECTO

```
┌─────────────────────────────┐
│                              │
│      🌿 Kiyoko AI            │
│      ← Dashboard             │  ← Link para volver
│                              │
│──────────────────────────────│
│                              │
│ PROYECTO                     │
│ ◻ Vista general              │
│ 🎬 Vídeos                    │
│ 🎨 Recursos           ▸     │  ← Click expande/colapsa
│   👤 Personajes              │
│   🏔 Fondos                  │
│   🎨 Estilos                 │
│   📝 Templates               │
│ 📱 Publicaciones             │
│ ✅ Tareas                    │
│ 📋 Actividad                 │
│                              │
│──────────────────────────────│
│                              │
│ AJUSTES                      │
│ ⚙️ General                   │
│ 🤖 IA y Agente               │
│ 🤝 Colaboradores             │
│                              │
│ 💬 Chat IA                   │
│                              │
│──────────────────────────────│
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔴 DK  ·  dev@kiy...    │ │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

### Cuando estás dentro de un VÍDEO

```
┌─────────────────────────────┐
│                              │
│      🌿 Kiyoko AI            │
│      ← Proyecto              │  ← Link para volver al proyecto
│                              │
│──────────────────────────────│
│                              │
│ VÍDEO                        │
│ [🎬 Presentación D... ▾]    │  ← Dropdown para cambiar vídeo
│                              │
│ ◻ Overview                   │
│ 🎞 Escenas                   │
│ ⏱ Timeline                   │
│ 🎙 Narración                 │
│ 📊 Análisis                  │
│ 🔗 Compartir                 │
│ 📤 Exportar                  │
│                              │
│──────────────────────────────│
│                              │
│ 💬 Chat IA                   │
│                              │
│──────────────────────────────│
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔴 DK  ·  dev@kiy...    │ │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

---

## Diferencias clave con lo que tenemos ahora

### Lo que hay que AÑADIR (inspirado en Notion)

| Feature | Notion | Kiyoko actual | Propuesta |
|---------|--------|---------------|-----------|
| **Búsqueda en sidebar** | 🔍 Search arriba | Solo en header (⌘K) | Añadir input de búsqueda en sidebar que abre CommandMenu |
| **Recientes desplegables** | Click proyecto → muestra sub-páginas | Lista plana de proyectos | Click en proyecto → muestra vídeos dentro |
| **Hover actions** | `···` y `+` aparecen en hover | Nada | `···` (context menu) y `+` (nuevo vídeo) en hover |
| **Crear desde sidebar** | `+ New page` dentro del proyecto | Solo botón "+ Nuevo" genérico | `+ Nuevo vídeo` dentro del proyecto desplegado |
| **Context menu** | Right-click → Copiar link, Duplicar, Renombrar, Eliminar | No existe | Añadir context menu en proyectos y vídeos |
| **Chat IA como item** | Notion AI es un item del sidebar | Chat IA está abajo separado | Mover "Kiyoko IA" arriba como acceso principal |
| **Secciones colapsables** | Cada sección se puede colapsar | Solo Recursos y Ajustes | Todas las secciones colapsables |

### Lo que hay que MANTENER (ya está bien)

| Feature | Estado |
|---------|--------|
| Logo centrado arriba | ✅ Mantener |
| Usuario abajo con avatar + dropdown | ✅ Mantener |
| 3 sidebars contextuales (Dashboard / Proyecto / Vídeo) | ✅ Mantener |
| Sidebar colapsable a 64px | ✅ Mantener |
| Ancho 240px | ✅ Mantener |

---

## Implementación técnica

### 1. Búsqueda en sidebar

Añadir un input de búsqueda justo debajo del logo que al hacer click abre el CommandMenu existente.

```tsx
// En cada sidebar, justo después del header:
<SidebarGroup className="px-2 pt-0">
  <button
    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
    className="flex w-full items-center gap-2 rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary transition"
  >
    <Search className="h-3.5 w-3.5" />
    <span className="flex-1 text-left">Buscar...</span>
    <kbd className="text-[10px] text-muted-foreground/50">⌘K</kbd>
  </button>
</SidebarGroup>
```

### 2. Proyectos desplegables con vídeos

En el DashboardSidebar, cada proyecto reciente se puede expandir para mostrar sus vídeos:

```tsx
// Pseudo-código del componente
function ProjectItem({ project }) {
  const [expanded, setExpanded] = useState(false);
  const [videos, setVideos] = useState([]);
  const [hovered, setHovered] = useState(false);

  // Cargar vídeos al expandir
  useEffect(() => {
    if (expanded && videos.length === 0) {
      supabase.from('videos').select('id, short_id, title')
        .eq('project_id', project.id).order('sort_order')
        .then(({ data }) => setVideos(data ?? []));
    }
  }, [expanded]);

  return (
    <>
      <SidebarMenuItem
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <SidebarMenuButton onClick={() => setExpanded(!expanded)}>
          <ChevronRight className={cn('h-3 w-3 transition', expanded && 'rotate-90')} />
          <FolderOpen className="h-4 w-4" />
          <span className="truncate">{project.title}</span>
        </SidebarMenuButton>

        {/* Hover actions */}
        {hovered && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button className="h-5 w-5 rounded hover:bg-secondary flex items-center justify-center">
              <MoreHorizontal className="h-3 w-3" />
            </button>
            <button className="h-5 w-5 rounded hover:bg-secondary flex items-center justify-center">
              <Plus className="h-3 w-3" />  {/* Crear vídeo directo */}
            </button>
          </div>
        )}
      </SidebarMenuItem>

      {/* Vídeos dentro del proyecto */}
      {expanded && (
        <SidebarMenuSub>
          {videos.map(video => (
            <SidebarMenuSubItem key={video.id}>
              <SidebarMenuSubButton render={<Link href={`/project/${project.short_id}/video/${video.short_id}`} />}>
                <Film className="h-3 w-3" />
                <span>{video.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
          <SidebarMenuSubItem>
            <SidebarMenuSubButton onClick={() => /* abrir modal crear vídeo */}>
              <Plus className="h-3 w-3" />
              <span className="text-muted-foreground">Nuevo vídeo</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      )}
    </>
  );
}
```

### 3. Context menu en proyectos

Al hacer click derecho o en `···`:

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    {/* El SidebarMenuItem del proyecto */}
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => navigator.clipboard.writeText(url)}>
      <Link2 className="mr-2 h-4 w-4" /> Copiar link
    </ContextMenuItem>
    <ContextMenuItem onClick={handleDuplicate}>
      <Copy className="mr-2 h-4 w-4" /> Duplicar
    </ContextMenuItem>
    <ContextMenuItem onClick={handleRename}>
      <Pencil className="mr-2 h-4 w-4" /> Renombrar
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onClick={toggleFavorite}>
      <Star className="mr-2 h-4 w-4" /> {isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onClick={handleDelete} className="text-red-400">
      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### 4. Kiyoko IA como acceso directo principal

Mover "Kiyoko IA" a la sección de navegación principal (después de Dashboard), no relegado al final del sidebar.

```
🔍 Buscar...
🏠 Dashboard
💬 Kiyoko IA         ← Aquí, como Notion AI
```

### 5. Botón `+` en el header del sidebar

Al lado del logo/nombre, un botón `+` que abre un menú rápido para crear:
- Nuevo proyecto
- Nuevo vídeo (si estás en un proyecto)
- Nueva escena (si estás en un vídeo)

Similar al botón `[✏️]` de Notion.

---

## Prioridad de implementación

| # | Feature | Esfuerzo | Impacto visual |
|---|---------|----------|----------------|
| 1 | Proyectos desplegables con vídeos | Alto | **Muy alto** — esto es lo que más cambia |
| 2 | Búsqueda en sidebar | Bajo | Alto — acceso inmediato a CommandMenu |
| 3 | Kiyoko IA como item principal | Bajo | Medio — mejor accesibilidad |
| 4 | Hover actions (··· y +) | Medio | Alto — feeling profesional |
| 5 | Context menu en proyectos | Medio | Medio — power users |
| 6 | Secciones colapsables | Bajo | Bajo — organización |
| 7 | Botón + en header | Bajo | Medio — acceso rápido |
