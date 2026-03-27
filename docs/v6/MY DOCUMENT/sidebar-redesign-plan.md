# Sidebar Redesign Plan — Estilo Notion

## Estado actual

La sidebar tiene **13 componentes** en `src/components/layout/sidebar/` con 3 niveles de navegación (dashboard → project → video). Funciona bien pero necesita mejoras visuales y de UX para alcanzar el nivel de Notion/Linear/GitLab.

### Archivos actuales

| Archivo | Líneas | Qué hace |
|---------|--------|----------|
| `AppSidebar.tsx` | 62 | Orquesta las secciones según pathname level |
| `SidebarContext.tsx` | 30 | Hook que parsea pathname → level/shortIds |
| `SidebarHeader.tsx` | 46 | Botón expand/collapse + WorkspaceSwitcher |
| `WorkspaceSwitcher.tsx` | 323 | Popover de org switching + account |
| `SidebarNavFixed.tsx` | 73 | Search, Home, Tasks, Kiyoko IA |
| `SidebarNavMain.tsx` | 42 | Shared, Publications (dashboard level) |
| `SidebarProjects.tsx` | 55 | Lista de proyectos (limit 8) |
| `SidebarProjectItem.tsx` | 208 | Proyecto expandible con videos + dropdown |
| `SidebarFavorites.tsx` | 42 | Proyectos favoritos |
| `SidebarProjectNav.tsx` | 170 | Nav dentro de un proyecto |
| `SidebarVideoNav.tsx` | 137 | Nav dentro de un video |
| `SidebarAdmin.tsx` | 55 | Admin panel (condicional) |
| `SidebarUserFooter.tsx` | 134 | User dropdown footer |

### Hooks de datos

- `useOrganizations()` — orgs del usuario, switch, create
- `useFavorites()` — favoritos con toggle
- `useProject()` / `useVideos()` — datos de proyecto/videos
- `useUIStore` — sidebar collapsed, theme, chat, modals

---

## Plan de mejora — Estilo Notion

### 1. Estructura del sidebar (nivel dashboard)

```
┌─────────────────────────────────┐
│ [Logo] Org Name ▾         [≡]  │  ← WorkspaceSwitcher + collapse
├─────────────────────────────────┤
│ 🔍 Search              ⌘K     │  ← Buscar
│ 🏠 Home                        │  ← Dashboard
│ 📥 Inbox                 (3)   │  ← Notificaciones no leídas
│ ✨ Kiyoko IA                   │  ← Toggle chat
├─────────────────────────────────┤
│ FAVORITOS                       │  ← Solo si hay favoritos
│  ⭐ Proyecto Alpha              │
│  ⭐ Proyecto Beta               │
├─────────────────────────────────┤
│ PROYECTOS                  [+] │  ← Crear proyecto
│  ▸ 📁 Proyecto Alpha    ··· + │  ← Hover: dots + add video
│     📹 Video 1                 │  ← Expandido: lista videos
│     📹 Video 2                 │
│     + Nuevo video              │
│  ▸ 📁 Proyecto Beta     ··· + │
│  ▸ 📁 Proyecto Gamma    ··· + │
├─────────────────────────────────┤
│ ADMIN (solo admin)             │
│  ⚙ Panel admin                 │
│  👥 Usuarios                   │
├─────────────────────────────────┤
│ [Avatar] Pedro V.         ···  │  ← User footer
│          pedro@mail.com        │
└─────────────────────────────────┘
```

### 2. Interacciones en proyectos (hover)

Cuando el usuario pasa el mouse sobre un proyecto:

```
  📁 Proyecto Alpha         ··· +
                              │   │
                              │   └─ [+] Abre modal crear video
                              │        en este proyecto
                              └─ [···] Dropdown menu:
                                   ├─ Abrir proyecto
                                   ├─ Compartir
                                   ├─ Duplicar
                                   ├─ Renombrar
                                   ├─ ──────────
                                   ├─ ⭐ Añadir/Quitar favorito
                                   ├─ ──────────
                                   └─ 🗑 Eliminar
```

### 3. Interacciones en videos (hover)

Cuando el usuario pasa el mouse sobre un video:

```
     📹 Video 1            ···
                              │
                              └─ [···] Dropdown menu:
                                   ├─ Abrir video
                                   ├─ Duplicar
                                   ├─ Renombrar
                                   ├─ Mover a otro proyecto
                                   ├─ ──────────
                                   └─ 🗑 Eliminar
```

### 4. Mejoras visuales clave (Notion-like)

#### Spacing & Typography
- Items: `py-1 px-2` (compacto como Notion)
- Font: `text-[13px]` para items, `text-[11px]` para groups
- Groups: uppercase tracking-wider `text-muted-foreground/50`
- Active item: `bg-accent` con `font-medium`
- Hover: `bg-accent/50` sutil

#### Colores
- Fondo sidebar: `bg-card` (más oscuro que content)
- Bordes: solo `border-r` en sidebar, sin bordes entre secciones
- Separadores: `h-px bg-border` con `my-2 mx-3`
- Status dots: usar colores semánticos (draft=gray, progress=blue, review=amber, done=green)

#### Animaciones
- Expand/collapse proyectos: `transition-all duration-200`
- Hover buttons (dots, +): `opacity-0 group-hover:opacity-100`
- Collapse sidebar: smooth width transition

#### Iconos
- Folders: `FolderClosed` → `FolderOpen` al expandir
- Videos: `Film` o `Video`
- Chevron: rota 90° al expandir
- Status dot al lado del nombre del proyecto

### 5. Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `SidebarNavFixed.tsx` | Añadir Inbox con badge de notificaciones |
| `SidebarProjects.tsx` | Quitar limit de 8, añadir scroll virtual si >20 |
| `SidebarProjectItem.tsx` | **Refactor principal**: hover actions, video dropdown menus, animaciones |
| `SidebarFavorites.tsx` | Mejorar visual, hover actions iguales que proyectos |
| `WorkspaceSwitcher.tsx` | Limpiar, mejorar visualmente |
| `SidebarUserFooter.tsx` | Simplificar dropdown |
| `AppSidebar.tsx` | Ajustar orden de secciones |

### 6. Nuevo archivo: `SidebarVideoItem.tsx`

Extraer la renderización de cada video del `SidebarProjectItem` a su propio componente con:
- Hover → dropdown menu (abrir, duplicar, renombrar, mover, eliminar)
- Status indicator
- Platform badge (opcional)

### 7. Datos de DB disponibles

**projects**: `id, short_id, title, client_name, status, style, description, cover_image_url, is_archived, sort_order`
- Status enum: `draft, in_progress, review, completed, archived`

**videos**: `id, short_id, title, platform, status, sort_order, duration_seconds`
- Platform: `youtube, tiktok, instagram, other`
- Status: `draft, scripted, producing, rendered, published`

**project_favorites**: `user_id, project_id`

**notifications**: `type, title, body, read` — para el badge del Inbox

### 8. Prioridad de implementación

1. **SidebarProjectItem.tsx** — Refactor visual + hover actions
2. **SidebarVideoItem.tsx** — Nuevo componente
3. **SidebarNavFixed.tsx** — Inbox con notificaciones
4. **SidebarProjects.tsx** — Sin limit, mejor empty state
5. **SidebarFavorites.tsx** — Hover actions
6. **WorkspaceSwitcher.tsx** — Visual cleanup
7. **SidebarUserFooter.tsx** — Simplificar

### 9. Persistencia: Organización + Usuario siempre visibles

#### Problema actual
- `useOrgStore` guarda `currentOrgId` en localStorage (`kiyoko-org`)
- `useOrganizations()` auto-selecciona org en un `useEffect` → primer render muestra datos parciales
- `SidebarUserFooter.tsx` usa `useEffect` + `setState` directo (no React Query) → primer render muestra null
- El header muestra "Desarrollador Kiyoko / Dashboard" temporalmente antes de cargar la org real

#### Solución
1. **`useOrganizations()`**: Mover auto-select fuera del `useEffect`. Hacer que `currentOrg` se calcule sincrónicamente:
   - Si `currentOrgId` apunta a una org válida → usarla
   - Si no → buscar personal org inmediatamente
   - Solo el `useEffect` es para persistir el ID (escribir), no para leer

2. **`SidebarUserFooter.tsx`**: Migrar de `useEffect+setState` a usar el mismo hook `useAuth()` que ya usa `WorkspaceSwitcher`

3. **Header del sidebar**: Siempre mostrar `currentOrg.name` + nombre de usuario debajo. Si loading → skeleton. Nunca mostrar "Dashboard" como nombre de org.

4. **Fallback visual**: Si no hay orgs (edge case), mostrar CTA para crear la primera

### 10. Principios de diseño

- **Densidad alta**: Notion usa items compactos (~32px height)
- **Hover reveal**: Acciones solo aparecen al hover
- **Jerarquía visual**: Los proyectos son más prominentes que los videos
- **Feedback inmediato**: Optimistic updates en favoritos, rename inline
- **Keyboard friendly**: ↑↓ para navegar, Enter para abrir, Esc para cerrar menus
- **Consistencia**: Mismos patterns en todos los niveles (proyecto, video, favorito)
- **Persistencia**: Org + usuario SIEMPRE visibles en el header, datos cargados antes del render
