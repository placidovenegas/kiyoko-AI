# ARQUITECTURA DE DATOS — Kiyoko AI

**Fecha:** 19 Marzo 2026
**Objetivo:** Documentar qué pasa cuando seleccionas una organización, proyecto o video y cómo fluyen los datos a cada página.

---

## JERARQUÍA DE SELECCIÓN

```
ORGANIZACIÓN  →  PROYECTO  →  VIDEO  →  ESCENAS
     ↓               ↓           ↓          ↓
  Dashboard      Overview    Storyboard   Contenido
  (lista de     (resumen)    (escenas     filtrado
  proyectos)                 del video)
```

### Qué pasa cuando seleccionas cada nivel:

| Acción | Qué cambia | Dónde se guarda | Qué se recarga |
|--------|-----------|-----------------|----------------|
| Cambiar Organización | Se filtran los proyectos | `useOrgStore.currentOrgId` | Dashboard: lista de proyectos |
| Cambiar Proyecto | Se navega a `/project/{slug}` | URL + `ProjectContext` | Todo: overview, storyboard, recursos, etc. |
| Cambiar Video | Se filtran escenas en storyboard/narración | `useActiveVideoStore.activeVideo` | Storyboard, Guion, Narración (escenas filtradas) |
| "Todos los videos" | Se quita el filtro de video | `activeVideo = null` | Se ven TODAS las escenas del proyecto |

---

## ESTADO ACTUAL: QUÉ MUESTRA CADA PÁGINA

### Páginas de PROYECTO (no dependen del video seleccionado)

| Página | Tablas | Qué muestra | Filtro |
|--------|--------|-------------|--------|
| **Overview** | projects, scenes (count), characters (count), backgrounds (count), video_cuts | Resumen del proyecto: stats, videos, escenas recientes | `project_id` |
| **Videos** | video_cuts | Grid de todos los videos del proyecto con crear/duplicar/eliminar | `project_id` |
| **Recursos** | characters, backgrounds | Personajes y fondos del proyecto (compartidos entre videos) | `project_id` |
| **Tareas** | tasks | Kanban de tareas del proyecto | `project_id` |

### Páginas de VIDEO (dependen del video seleccionado)

| Página | Tablas | Qué muestra | Filtro |
|--------|--------|-------------|--------|
| **Storyboard** | scenes, video_cut_scenes, characters, backgrounds, narrative_arcs | Escenas del video activo (o todas si "Todos") | `project_id` + `video_cut_id` via junction |
| **Guion/Arco** | scenes, video_cut_scenes, narrative_arcs | Narración y arco del video activo | `project_id` + `video_cut_id` via junction |
| **Narración y Voz** | scenes, video_cut_scenes | Audio TTS de las escenas del video activo | `project_id` + `video_cut_id` via junction |

### Cómo funciona el filtro de video:

```
1. Cargo TODAS las escenas del proyecto: scenes.eq('project_id', proj.id)
2. Si hay video activo, cargo los IDs de sus escenas: video_cut_scenes.eq('video_cut_id', activeVideo.id)
3. Filtro: solo muestro escenas cuyo ID está en video_cut_scenes
4. Si "Todos los videos" → muestro todas las escenas sin filtrar
```

---

## EL PROBLEMA: ¿DÓNDE VA CADA PÁGINA?

Actualmente el sidebar tiene una lista plana:

```
📊 Overview
📹 Videos
🎬 Storyboard        ← depende del video
📝 Guion / Narración  ← depende del video
🎙️ Narración y Voz    ← depende del video
💼 Recursos           ← NO depende del video
✅ Tareas             ← NO depende del video
📦 Exportar           ← depende del video
```

**El problema:** No queda claro qué es del proyecto y qué es del video.
Si estoy en "Recursos" no me importa qué video tengo seleccionado, pero si estoy en "Storyboard" sí.

---

## PROPUESTA: SEPARAR PROYECTO Y VIDEO EN EL SIDEBAR

### Opción A — Agrupar por nivel (RECOMENDADA)

```
SIDEBAR:
─────────────────────────
🎬 Video: [Spot YouTube ▼]   ← selector prominente con dropdown
─────────────────────────
PROYECTO
  📊 Overview
  📹 Videos
  💼 Recursos
  ✅ Tareas
  ⚙️ Ajustes
─────────────────────────
VIDEO ACTIVO
  🎬 Storyboard
  📝 Guion
  🎙️ Narración
  📦 Exportar
─────────────────────────
  💬 Chat IA
─────────────────────────
```

**Ventajas:**
- Queda claro qué depende del video y qué no
- El selector de video está arriba, muy visible
- Si no hay video seleccionado, las páginas de "VIDEO ACTIVO" muestran un estado especial (elige un video)

### Opción B — Tabs dentro del proyecto

```
SIDEBAR (siempre igual):
  📊 Overview
  📹 Videos
  💼 Recursos
  ✅ Tareas
  ⚙️ Ajustes
  💬 Chat IA

CUANDO ENTRAS EN UN VIDEO (click en la card):
→ Navegas a /project/{slug}/video/{videoSlug}
→ Sub-sidebar o tabs internos:
  🎬 Storyboard
  📝 Guion
  🎙️ Narración
  📦 Exportar
```

**Ventajas:**
- Separación total: proyecto y video son "niveles" diferentes en la URL
- Cada video tiene su propia página

**Desventajas:**
- Más navegación (entrar/salir de un video)
- Pierdes contexto rápido entre videos

### Opción C — Todo junto pero con indicador visual

```
SIDEBAR:
  📊 Overview
  📹 Videos
  ── Video: Spot YouTube ──  ← separador visual
  🎬 Storyboard
  📝 Guion
  🎙️ Narración
  📦 Exportar
  ──────────────────────────
  💼 Recursos
  ✅ Tareas
  ⚙️ Ajustes
  💬 Chat IA
```

---

## FLUJO DE DATOS: DE DÓNDE VIENE CADA COSA

### 1. Organización → Dashboard

```
Store: useOrgStore { currentOrgId }
Query: projects.eq('organization_id', currentOrgId)
Resultado: Lista de proyectos filtrada por org

Si currentOrgId es null → muestra TODOS los proyectos del usuario
Si la org no tiene proyectos → empty state "Crea tu primer proyecto"
```

### 2. Proyecto → Páginas del proyecto

```
Context: ProjectContext { project, loading }
Se resuelve con: projects.eq('slug', params.slug).single()
El project.id (UUID) se usa para todas las queries

Si el slug no existe → "Proyecto no encontrado"
Si el proyecto existe → carga datos de sus tablas hijas
```

### 3. Video → Filtrado de escenas

```
Store: useActiveVideoStore { activeVideo, videos }

Carga inicial (Header):
  video_cuts.eq('project_id', currentProject.id).order('sort_order')
  → setVideos(data)
  → Auto-selecciona el primer video si no hay ninguno

Filtrado (Storyboard, Arc, Narration):
  Si activeVideo existe:
    video_cut_scenes.eq('video_cut_id', activeVideo.id)
    → Set de scene_ids
    → filteredScenes = allScenes.filter(s => sceneIds.has(s.id))
  Si activeVideo es null:
    → filteredScenes = allScenes (sin filtro)
```

### 4. Escenas → Contenido

```
Query: scenes.eq('project_id', project.id).order('sort_order')
Filtro video: video_cut_scenes junction table
Cada escena tiene: title, description, prompts, imagen, video, narración, etc.
```

---

## TABLAS Y RELACIONES

```
organizations
  └── projects (organization_id)
        ├── video_cuts (project_id)
        │     └── video_cut_scenes (video_cut_id → scene_id)  ← JUNCTION
        ├── scenes (project_id)
        ├── characters (project_id)  ← compartidos entre videos
        ├── backgrounds (project_id)  ← compartidos entre videos
        ├── narrative_arcs (project_id)
        ├── tasks (project_id)
        └── ai_conversations (project_id)
```

### Tabla `video_cut_scenes` (junction):
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| video_cut_id | uuid | FK → video_cuts |
| scene_id | uuid | FK → scenes |
| sort_order | integer | Orden de la escena DENTRO del video |
| duration_override | numeric | Duración diferente para este video |
| transition_in/out | text | Transiciones específicas del video |
| narration_override | text | Narración diferente para este video |

**Concepto clave:** Una escena puede estar en VARIOS videos con diferente orden, duración y narración. La tabla junction permite reutilizar escenas.

---

## QUÉ FALTA POR IMPLEMENTAR

### ❌ Asignar escenas a videos
Actualmente NO hay UI para:
- Asignar escenas existentes a un video (insertar en `video_cut_scenes`)
- Crear una escena directamente dentro de un video
- Ver qué escenas NO están asignadas a ningún video

### ❌ Crear escenas desde el storyboard filtrado por video
Si estoy en el storyboard con un video seleccionado y creo una escena nueva, debería:
1. Crear la escena en `scenes`
2. Crear la relación en `video_cut_scenes`

### ❌ Exportar por video
El exportar debería saber qué video estoy viendo y exportar solo sus escenas

### ❌ El overview no diferencia entre proyecto y video
Actualmente muestra stats globales del proyecto, pero podría mostrar un resumen del video activo

---

## DECISIÓN PENDIENTE PARA EL USUARIO

**¿Cómo quieres navegar entre proyecto y video?**

**A)** Sidebar agrupado (proyecto arriba, video abajo, selector prominente)
**B)** Click en video → entra en sub-página con sus propias tabs
**C)** Todo junto con separador visual

**Mi recomendación:** Opción A — Es la más natural para el flujo de trabajo. El selector de video en el sidebar es grande y visible, y las páginas que dependen del video se agrupan debajo. Si no hay video seleccionado, esas páginas muestran "Selecciona un video" o muestran todas las escenas.

---

*Documento generado el 19 Marzo 2026 — Kiyoko AI*
