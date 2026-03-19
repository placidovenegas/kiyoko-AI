# PLAN DE IMPLEMENTACION DEFINITIVO — Kiyoko AI

**Fecha:** 19 Marzo 2026
**Regla:** No pasamos a la siguiente pagina hasta que la actual este perfecta.
**Flujo:** Home > Dashboard > Proyecto > Video (selector en header) > Storyboard > etc.

---

## ORDEN DE IMPLEMENTACION (pagina a pagina)

### PASO 1 — HOME / LOGIN / REGISTRO
- [ ] Revisar y pulir paginas de login y registro
- [ ] Asegurar que el flujo auth funciona (Supabase Auth)
- [ ] Redireccion correcta: login > dashboard

### PASO 2 — DASHBOARD (lista de proyectos)
- [ ] Grid/lista de proyectos con cards
- [ ] Cada card: titulo, cliente, estilo, plataforma, num videos, progreso
- [ ] Boton "+ Nuevo Proyecto" funcional
- [ ] Boton "Generar con IA" (crear proyecto desde brief)
- [ ] Buscar/filtrar proyectos
- [ ] Favoritos
- [ ] Organizaciones (si aplica)

### PASO 3 — CREAR PROYECTO (wizard)
- [ ] Revisar wizard de 5 pasos existente
- [ ] Al crear proyecto, crear automaticamente "Video Principal"
- [ ] Que todo se guarde correctamente en DB

### PASO 4 — OVERVIEW DEL PROYECTO
- [ ] Stats cards: videos, escenas, personajes, fondos, duracion
- [ ] Seccion Videos con progreso de cada uno
- [ ] Seccion Tareas de hoy (si hay)
- [ ] Diagnostico IA (fusionado aqui)
- [ ] Info del proyecto editable

### PASO 5 — VIDEOS HUB (Proyecto > Videos)
- [ ] Grid de VideoCards
- [ ] Crear video: modal con titulo, plataforma, aspect ratio, duracion
- [ ] Duplicar video (copia todas las escenas)
- [ ] Eliminar video
- [ ] Estados: borrador, en progreso, revision, aprobado, publicado
- [ ] Al hacer click en un video, se selecciona como "video activo"

### PASO 6 — SELECTOR DE VIDEO EN HEADER
```
Header:
[Organizacion v] / [Proyecto v] / [Video v]  ......  [Notificaciones] [Chat IA] [Usuario]
```
- [ ] Dropdown en el header para cambiar de video activo (como el de proyectos)
- [ ] Al cambiar video, el storyboard se filtra por ese video
- [ ] El chat de IA sabe en que proyecto Y video estamos
- [ ] Si no hay video seleccionado, el storyboard muestra TODAS las escenas

### PASO 7 — MIGRACION DB: video_cuts > videos
- [ ] Renombrar video_cuts > videos con campos nuevos
- [ ] Renombrar video_cut_scenes > video_scenes
- [ ] Migrar datos existentes
- [ ] Añadir campos: description_es, dialogue_text en scenes
- [ ] Actualizar todas las queries del frontend

### PASO 8 — STORYBOARD (la pagina principal)
Solo muestra escenas del VIDEO ACTIVO seleccionado en el header.

#### 8.1 Tres vistas:
- [ ] **Compacto**: lista vertical con thumbnails, drag&drop reordenar
- [ ] **Grid**: cuadricula de thumbnails grandes
- [ ] **Timeline**: barra proporcional al tiempo con arco narrativo encima
  ```
  ARCO: |-- Gancho --|--- Presentacion ---|-- Especialidad --|-- CTA --|
  TIME: [E1][E2][ E3  ][  E4  ][ E5 ][E6][E7][E8]...
  0s        15s       30s        45s      60s     75s
  ```

#### 8.2 SceneCard mejorada:
- [ ] Titulo, descripcion, duracion, fase, estado
- [ ] Prompt imagen (ingles) con boton copiar
- [ ] Prompt video (ingles) con boton copiar
- [ ] Descripcion en espanol (description_es) — lo que se ve
- [ ] Dialogos (dialogue_text) — lo que dicen los personajes
  - Si hay dialogo, se incluye automaticamente en prompt_video
- [ ] Imagen generada (thumbnail + upload + generar)
- [ ] Video generado (preview + upload + generar)
- [ ] Personajes y fondo asignados
- [ ] Camara, iluminacion, mood (dropdowns con opciones)
- [ ] Audio config (multi-toggle: silencio, ambiente, musica, dialogo, voiceover)
- [ ] Edicion inline de cada campo por separado
- [ ] Boton IA en cada campo para generar/mejorar

#### 8.3 Funcionalidad:
- [ ] Drag & drop para reordenar escenas
- [ ] Seleccion multiple + acciones bulk (copiar a video, eliminar, generar prompts)
- [ ] Insertar escena entre dos existentes
- [ ] Copiar escenas a otro video
- [ ] Auto-guardado
- [ ] Ctrl+Z / undo

### PASO 9 — GENERACION DE PROMPTS (el MVP)
- [ ] Boton "Generar Prompt" por escena (imagen y video)
- [ ] La IA genera:
  - prompt_image (ingles)
  - prompt_video (ingles, con dialogos si los hay)
  - description_es (descripcion en espanol)
- [ ] Si dialogue_text tiene texto, se traduce e incluye en prompt_video
- [ ] Boton "Generar todos los prompts" para todas las escenas del video
- [ ] Boton "Copiar" en cada prompt para llevarselo fuera

### PASO 10 — RECURSOS (Personajes + Fondos)
- [ ] Tabs: Personajes | Fondos | Referencias
- [ ] Cards con imagen, nombre, rol, prompt snippet
- [ ] Click abre sheet lateral para editar
- [ ] Upload de imagenes de referencia
- [ ] Crear nuevo personaje/fondo (manual + IA)

### PASO 11 — NARRACION (guion completo del video)
- [ ] Sidebar: voz, estilo, velocidad
- [ ] Textarea grande con guion completo
- [ ] Generar guion con IA (analiza todas las escenas)
- [ ] Generar audio con ElevenLabs
- [ ] Player para escuchar
- [ ] Descargar MP3
- [ ] Timeline visual encima

### PASO 12 — TAREAS
- [ ] Kanban: Pendiente | En proceso | Revision | Completado
- [ ] Crear tarea manual
- [ ] IA genera plan de tareas
- [ ] Tarea "subir video" con fecha y aviso

### PASO 13 — EXPORTAR
- [ ] PDF storyboard
- [ ] HTML interactivo
- [ ] JSON datos
- [ ] Markdown guion
- [ ] MP3 narracion
- [ ] ZIP con todo

### PASO 14 — AJUSTES
- [ ] Tabs: General | IA | Narracion | Notificaciones | Peligro
- [ ] Editar proyecto: titulo, estilo, plataforma, duracion
- [ ] Config IA: provider preferido, nivel de aprobacion
- [ ] Config narracion: voz por defecto, estilo
- [ ] Eliminar proyecto

### PASO 15 — HISTORIAL
- [ ] Timeline de actividad (activity_log)
- [ ] Versiones de escenas (change_history)
- [ ] Historial de IA (ai_conversations)
- [ ] Undo completo: restaurar cualquier cambio

### PASO 16 — CHAT IA (panel lateral)
- [ ] System prompt incluye: proyecto activo + video activo + escenas del video
- [ ] La IA sabe en que video estamos trabajando
- [ ] Puede crear/editar/eliminar escenas
- [ ] Puede generar prompts, narracion, tareas
- [ ] Sugerencias proactivas
- [ ] Configurable: pedir aprobacion o actuar directo

---

## FASES FUTURAS (despues del MVP)

### FASE F1 — Generacion de imagenes integrada
### FASE F2 — Generacion de video integrada
### FASE F3 — Editor de video tipo CapCut
### FASE F4 — Colaboracion tiempo real
### FASE F5 — Billing (Stripe, planes, creditos)

---

## CONTEXTO PARA LA IA (system prompt)

La IA siempre debe saber:
```
PROYECTO ACTIVO: {project.title} ({project.style}, {project.target_platform})
VIDEO ACTIVO: {video.title} ({video.target_duration}s, {video.aspect_ratio})
ESCENAS DEL VIDEO: {N} escenas
PERSONAJES: {lista}
FONDOS: {lista}
```

Cuando el usuario cambia de video en el header, el contexto de la IA se actualiza.

---

*Plan definitivo — 19 Marzo 2026 — Kiyoko AI*
