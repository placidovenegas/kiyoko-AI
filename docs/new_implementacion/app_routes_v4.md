# Kiyoko AI — Mapa de Rutas v4

> Rutas con nanoid 12-char (`short_id`). El slug se mantiene para SEO pero las URLs usan short_id.

---

## Rutas Públicas

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Landing page. Redirige a `/dashboard` si autenticado. | Existe |
| `/login` | Login con email/contraseña + Google OAuth. | Existe |
| `/register` | Registro con validación de contraseña. | Existe |
| `/forgot-password` | Solicitar reseteo de contraseña. | Existe |
| `/pending` | Cuenta pendiente de aprobación admin. | Existe |
| `/blocked` | Cuenta bloqueada. | Existe |
| `/terms` | Términos de servicio. | Existe |
| `/privacy` | Política de privacidad. | Existe |
| `/docs` | Documentación pública. | Existe |
| `/share/:token` | **Vista pública de escenas compartidas.** Puede requerir contraseña. Muestra escenas del video con opción de añadir anotaciones si `allow_annotations=true`. | **NUEVO** |

---

## Dashboard

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/dashboard` | Panel principal | Grid de tarjetas de proyectos con thumbnail, título, cliente, estado, progreso. Filtros: todos / en progreso / completados / archivados. Búsqueda por nombre. Ordenar por: recientes / nombre / progreso. Sección de estadísticas: total proyectos, tareas pendientes, tiempo trabajado hoy. Actividad reciente. |
| `/dashboard/shared` | Proyectos compartidos conmigo | Grid de proyectos donde soy colaborador. Muestra quién compartió, mi rol, fecha. |
| `/dashboard/publications` | Publicaciones programadas | Calendario visual de todas las publicaciones de todos los proyectos. Vista mes/semana. Filtro por proyecto y plataforma. Estado: borrador / programada / publicada. |
| `/new` | Crear proyecto | Wizard multi-paso: 1) Nombre + cliente + descripción, 2) Estilo visual (desplegable: Pixar/Realista/Anime/etc.) → genera agente IA automáticamente, 3) Config de generadores IA, 4) Resumen + crear. Alternativa: "Crear con IA" → chat que pregunta qué quieres hacer. |

---

## Ajustes de Usuario

| Ruta | Qué muestra |
|------|-------------|
| `/settings` | Perfil (nombre, avatar, bio, empresa), email, idioma, tema claro/oscuro. |
| `/settings/api-keys` | Gestión de API keys propias por proveedor (OpenAI, ElevenLabs, Grok, Runway...). Cada key muestra: proveedor, hint, estado, gasto mensual, límite. |
| `/settings/subscription` | Plan actual, botón upgrade, historial de pagos, gestión de tarjeta. |
| `/settings/notifications` | Qué notificaciones recibir por email: tareas, comentarios, generaciones, análisis. |

---

## Organizaciones

| Ruta | Qué muestra |
|------|-------------|
| `/organizations` | Mis organizaciones. Crear nueva. |
| `/organizations/new` | Formulario: nombre, logo, tipo (personal/equipo). |
| `/organizations/:id` | Detalle: miembros, roles, invitaciones pendientes. |

---

## Admin

| Ruta | Qué muestra |
|------|-------------|
| `/admin` | Dashboard admin: total usuarios, proyectos, escenas, tokens consumidos, ingresos. |
| `/admin/users` | Lista de usuarios: aprobar/bloquear cuentas, cambiar roles, ver actividad. |

---

## Proyecto `/project/:shortId`

Todas las páginas de proyecto comparten el `ProjectProvider` con contexto del proyecto, recursos y sincronización en tiempo real. El chat IA (Kiyoko) está disponible como panel lateral en TODAS las páginas del proyecto.

### Vista general

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId` | Vista general del proyecto | Portada del proyecto con imagen. Estadísticas: nº vídeos, nº escenas, nº personajes, nº fondos, tiempo total trabajado. Botones de acción rápida: crear vídeo, crear escena, abrir chat IA. Grid de vídeos del proyecto con progreso. Actividad reciente del proyecto. Info del cliente. |

### Vídeos

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId/videos` | Lista de vídeos | Grid de tarjetas de vídeo: thumbnail, título, plataforma (icono), duración, estado, progreso (barra). Botón "Nuevo vídeo" → modal con toggle manual/IA. Filtro por plataforma y estado. |

### Recursos

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId/resources` | Vista combinada de todos los recursos | Tabs: Personajes / Fondos / Estilos / Templates. Cada recurso muestra imagen de referencia, nombre, descripción corta. Botón "Nuevo recurso" por sección. |
| `/project/:shortId/resources/characters` | Lista de personajes | Grid de personajes con avatar, nombre, rol, color. Click → detalle. |
| `/project/:shortId/resources/characters/:id` | Detalle de personaje | Imagen principal + galería de ángulos (character_images). Datos: nombre, rol, personalidad, descripción visual. Análisis IA de imagen: ai_visual_analysis + ai_prompt_description (editable). Reglas para la IA. En qué escenas aparece (calculado). Botón "Generar ángulos con IA". Botón "Subir imagen". |
| `/project/:shortId/resources/backgrounds` | Lista de fondos | Grid similar a personajes. |
| `/project/:shortId/resources/backgrounds/:id` | Detalle de fondo | Similar a personaje: imagen + IA analysis + ángulos. |
| `/project/:shortId/resources/styles` | Presets de estilo | Lista de presets con preview. Editar prompt_prefix/suffix/negative. Elegir generador. Marcar default. |
| `/project/:shortId/resources/templates` | Templates de prompts | Lista de plantillas con variables. Preview de resultado. |

### Publicaciones

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId/publications` | Gestión de publicaciones | Vista calendario de publicaciones programadas. Vista grid con preview de cada publicación. Filtro por perfil/plataforma y estado. Botón "Nueva publicación". |
| `/project/:shortId/publications/profiles` | Perfiles de redes sociales | Tarjetas por red social: avatar, nombre, handle, bio, seguidores. Crear/editar perfiles. Preview de cómo se ve el perfil. |
| `/project/:shortId/publications/new` | Crear publicación | Wizard: 1) Elegir perfil/plataforma, 2) Tipo (imagen/vídeo/carrusel/reel/story), 3) Añadir ítems: subir imagen, generar con prompt, o vincular escena/vídeo del proyecto, 4) Caption + hashtags (IA sugiere), 5) Programar fecha o guardar borrador. |
| `/project/:shortId/publications/:pubShortId` | Detalle de publicación | Preview de la publicación como se verá en la red social. Editar caption, hashtags, ítems. Ver/regenerar prompts de cada ítem. Cambiar fecha. Estado. |

### Tareas

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId/tasks` | Gestión de tareas | Tabs: Kanban / Lista / Calendario. Kanban: columnas pendiente → en progreso → revisión → completado. Cada tarjeta: título, categoría (badge color), prioridad (icono), asignado a (avatar), due date. Filtros: categoría, prioridad, asignado, vídeo. "Nueva tarea" → modal. |
| `/project/:shortId/tasks/time` | Registro de tiempo | Timer activo (start/stop). Historial de entradas de tiempo. Reportes: tiempo por vídeo, por categoría, por persona. Gráfico de horas trabajadas por día/semana. Entrada manual de tiempo. |

### Ajustes del Proyecto

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId/settings` | Ajustes generales | Portada, título, descripción, cliente, estilo visual, paleta de colores, tags. Reglas globales de prompt. |
| `/project/:shortId/settings/ai` | Config de IA | **Agente IA:** Desplegable de tipo de director (Pixar/Realista/Anime/Comedia/Anuncio) → genera system prompt automáticamente. El usuario puede editarlo. Slider de creatividad (0-1). Selector de tono. **Generadores:** Proveedor de imagen, proveedor de vídeo, duraciones de clip, extensiones, proveedor TTS, proveedor de visión. |
| `/project/:shortId/settings/sharing` | Colaboradores | Lista de colaboradores con roles. Invitar por email. Links de invitación. Gestionar permisos. |

### Actividad y Análisis

| Ruta | Qué muestra |
|------|-------------|
| `/project/:shortId/activity` | Log de actividad: quién hizo qué y cuándo. Filtro por tipo y usuario. |
| `/project/:shortId/chat` | Chat IA pantalla completa con historial de conversaciones en sidebar. |

---

## Vídeo `/project/:shortId/video/:videoShortId`

Todas las páginas de vídeo heredan el contexto del proyecto. El chat IA contextual sabe en qué vídeo estamos.

| Ruta | Qué muestra | Qué hay en la página |
|------|-------------|---------------------|
| `/project/:shortId/video/:videoShortId` | Vista general del vídeo | Header: título, plataforma (badge), duración objetivo vs actual, estado. Storyboard visual: grid de escenas con thumbnails, título, duración, estado (color). Arco narrativo visual (barra coloreada por fases). Estadísticas: escenas totales, aprobadas, con imagen, con vídeo. Botones: "Nueva escena", "Analizar vídeo", "Generar narración", "Crear vídeo derivado". |
| `/project/:shortId/video/:videoShortId/scenes` | Board de escenas | Multi-vista: Grid / Lista expandida / Timeline visual. Cada escena muestra: nº, thumbnail, título, anotación del cliente (badge), personajes (avatares), duración, estado (color), clips generados (barra de extensiones). Drag & drop para reordenar. |
| `/project/:shortId/video/:videoShortId/scene/:sceneShortId` | Detalle de escena | **Panel izquierdo:** Descripción, anotación del cliente, diálogo. Personajes asignados (con avatares). Fondo asignado. Notas del director. **Panel central:** Preview de media actual (imagen + clips de vídeo con extensiones encadenadas). Player de vídeo con todos los clips concatenados. **Panel derecho:** Config de cámara (ángulo, movimiento, luz, mood). Historial de prompts (prompt imagen + prompt vídeo). Botones: "Regenerar imagen", "Regenerar clips", "Editar prompt". Estado de cada clip (base + extensiones). |
| `/project/:shortId/video/:videoShortId/timeline` | Línea de tiempo | Timeline visual horizontal con bloques coloreados por fase del arco narrativo. Cada bloque = escena con duración proporcional. Click en bloque → preview de escena. Drag para reordenar. Marcadores de tiempo. |
| `/project/:shortId/video/:videoShortId/narration` | Narración del vídeo | Texto de narración completa (editable). Player de audio si hay generación. Selector de voz (dropdown con preview). Config: velocidad, estilo. Versionado: ver narraciones anteriores. Botones: "Generar texto con IA", "Generar audio TTS". |
| `/project/:shortId/video/:videoShortId/analysis` | Análisis IA del vídeo | Puntuación global (82/100). Fortalezas: lista con iconos verdes, escenas afectadas clickeables. Debilidades: lista con iconos rojos/naranjas, severidad, escenas afectadas. Sugerencias: lista con acciones. Las sugerencias `auto_applicable` tienen botón "Aplicar" que ejecuta el cambio. Botón "Re-analizar". |
| `/project/:shortId/video/:videoShortId/derive` | Crear vídeo derivado | Chat IA que pregunta: ¿qué quieres? ¿plataforma? ¿duración? ¿tono? La IA analiza el vídeo actual y propone: escenas a mantener, modificar, eliminar, crear. El usuario revisa y aprueba. Al aprobar, se crea un nuevo vídeo con sus escenas. |
| `/project/:shortId/video/:videoShortId/share` | Compartir escenas | Crear link de escenas compartidas. Elegir escenas específicas o todas. Config: público / con contraseña. Permitir anotaciones sí/no. Fecha de expiración. Ver anotaciones recibidas con estado (resuelta/pendiente). |
| `/project/:shortId/video/:videoShortId/export` | Exportar vídeo | Formato: mp4, mov, json, markdown, pdf (storyboard). Calidad. Incluir narración sí/no. Preview antes de exportar. Historial de exportaciones. |

---

## Modales (no cambian de ruta)

| Modal | Dónde aparece | Qué contiene |
|-------|--------------|-------------|
| **Kiyoko AI Chat** | Todas las páginas del proyecto (panel lateral redimensionable) | Chat contextual. Detecta proyecto + vídeo desde URL. Historial de conversaciones. Acciones rápidas: revisar personajes, generar prompts, analizar vídeo, actualizar escenas batch. Los cambios de la IA muestran qué escenas se van a actualizar antes de ejecutar. Botón de rollback por acción. |
| **Crear Vídeo** | `/project/:shortId/videos` | Toggle manual/IA. Manual: título + plataforma + duración + aspect ratio. IA: describe qué quieres → la IA genera el vídeo con escenas. Tipo de director se hereda del agente del proyecto. |
| **Crear Escena** | `/project/:shortId/video/:videoShortId/scenes` | La IA pregunta anotación del cliente. Si tiene: pregunta plano y estilo. Si no tiene: sugiere basándose en escenas adyacentes. Genera escena + prompts + camera. |
| **Crear Tarea** | `/project/:shortId/tasks` | Título, descripción, categoría, prioridad, asignado a, fecha límite, vídeo asociado, escena asociada. |
| **Feedback** | Todas las páginas (header) | Tipo: problema / idea. Mensaje. Screenshot opcional. |
| **Crear Publicación** | `/project/:shortId/publications` | Perfil, tipo, ítems, caption, hashtags, fecha, IA sugiere. |

---

## Resumen de navegación visual

```
/ (Landing)
├── /login
├── /register
├── /share/:token                     ← NUEVO: escenas compartidas
│
├── /dashboard
│   ├── /dashboard/shared
│   └── /dashboard/publications       ← NUEVO: calendario publicaciones
│
├── /new                              (crear proyecto)
├── /settings
│   ├── /settings/api-keys
│   ├── /settings/subscription
│   └── /settings/notifications
├── /organizations
│   └── /organizations/:id
├── /admin
│   └── /admin/users
│
└── /project/:shortId                 ← CAMBIO: short_id en vez de slug
    ├── /videos
    │
    ├── /video/:videoShortId          ← CAMBIO: short_id
    │   ├── /scenes
    │   │   └── /scene/:sceneShortId  ← CAMBIO: short_id
    │   ├── /timeline
    │   ├── /narration
    │   ├── /analysis                 ← NUEVO
    │   ├── /derive                   ← NUEVO
    │   ├── /share                    ← NUEVO
    │   └── /export
    │
    ├── /resources
    │   ├── /characters
    │   │   └── /:id
    │   ├── /backgrounds
    │   │   └── /:id
    │   ├── /styles                   ← NUEVO
    │   └── /templates                ← NUEVO
    │
    ├── /publications                 ← NUEVO
    │   ├── /profiles
    │   ├── /new
    │   └── /:pubShortId
    │
    ├── /tasks
    │   └── /time                     ← NUEVO
    │
    ├── /settings
    │   ├── /ai                       ← NUEVO: agente IA + generadores
    │   └── /sharing
    │
    ├── /activity
    └── /chat
```

---

## Rutas Eliminadas vs Anterior

| Ruta anterior | Motivo | Reemplazada por |
|---------------|--------|----------------|
| `/project/[slug]` | Slug → short_id | `/project/:shortId` |
| `/project/[slug]/storyboard` | Ahora el storyboard es por vídeo | `/project/:shortId/video/:videoShortId` (vista general del vídeo ES el storyboard) |
| `/project/[slug]/scenes` | Las escenas pertenecen a un vídeo | `/project/:shortId/video/:videoShortId/scenes` |
| `/project/[slug]/scenes/[id]` | Escena dentro de vídeo | `/project/:shortId/video/:videoShortId/scene/:sceneShortId` |
| `/project/[slug]/narration` | Narración es por vídeo | `/project/:shortId/video/:videoShortId/narration` |
| `/project/[slug]/analysis` | Análisis es por vídeo | `/project/:shortId/video/:videoShortId/analysis` |
| `/project/[slug]/timeline` | Timeline es por vídeo | `/project/:shortId/video/:videoShortId/timeline` |
| `/project/[slug]/arc` | Arco narrativo se integra en timeline y vista del vídeo | `/project/:shortId/video/:videoShortId/timeline` |
| `/project/[slug]/references` | Redundante con resources | `/project/:shortId/resources` |
| `/project/[slug]/characters` | Ahora bajo resources | `/project/:shortId/resources/characters` |
| `/project/[slug]/backgrounds` | Ahora bajo resources | `/project/:shortId/resources/backgrounds` |
| `/project/[slug]/exports` | Exports es por vídeo | `/project/:shortId/video/:videoShortId/export` |
