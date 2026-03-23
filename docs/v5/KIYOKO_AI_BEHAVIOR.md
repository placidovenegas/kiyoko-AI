# Kiyoko AI — Comportamiento, Contexto y Capacidades

> Documento de referencia para definir cómo actúa Kiyoko según donde esté el usuario,
> qué puede hacer, qué tablas toca y cómo quiere el equipo que funcione.

---

## 0. DECISIONES DE PRODUCTO — Q&A PARA DEFINIR LA MEJOR VERSIÓN

> Preguntas que Kiyoko haría al usuario para definir el comportamiento óptimo.
> Cada bloque incluye la pregunta, las opciones y la decisión recomendada.

---

### 0.1 Comportamiento contextual

---

**Q: ¿Cuando el usuario está en el dashboard y abre Kiyoko, debería hablar de forma proactiva o esperar a que pregunte?**

Opciones:
- A) Espera pasiva — solo responde cuando el usuario escribe
- B) Saludo contextual — muestra un resumen breve ("Tienes 3 proyectos, 2 sin terminar") y ofrece acciones
- C) Onboarding activo — si es la primera vez, explica qué puede hacer

**Decisión recomendada: B + C**
Cuando el chat se abre en el dashboard, mostrar un saludo contextual con estado actual y quick actions adaptadas al contexto. Si no hay proyectos, hacer onboarding. Si hay proyectos, mostrar resumen rápido.

---

**Q: ¿Qué acciones rápidas debería mostrar Kiyoko en el estado vacío del chat según el contexto?**

**Dashboard (sin proyecto):**
- "Crear nuevo proyecto" → Kiyoko pregunta brief, crea el proyecto
- "Ver mis proyectos" → Lista resumida de proyectos con estado
- "¿Qué puedo hacer con Kiyoko?" → Explicación de capacidades
- "Buscar en mis proyectos" → Búsqueda por texto

**Organización:**
- "Crear proyecto en esta org" → Crea proyecto asignado a la org
- "Estado de la organización" → Resumen de todos los proyectos
- "Ver miembros del equipo" → Lista de miembros y proyectos asignados

**Proyecto:**
- "Revisar personajes", "Reducir escenas", "Ordenar timeline"
- "Explicar proyecto", "Generar prompts", "Estado general"
- "Crear un vídeo" → Crea vídeo dentro del proyecto

**Vídeo:**
- "Mejorar narración del vídeo"
- "Generar prompts para este vídeo"
- "Analizar duración total"
- "Revisar escenas vinculadas"

---

**Q: ¿Si el usuario está en el dashboard, debería la IA mencionar vídeos o escenas aunque pueda hacerlo?**

**Decisión: NO.**
En el dashboard, Kiyoko habla de proyectos, organización y productividad general. No menciona vídeos, escenas ni personajes porque no hay contexto. Si el usuario pregunta por algo de un proyecto específico, la IA ofrece navegar a ese proyecto.

Regla: **El system prompt inyecta SOLO las acciones disponibles en el contexto actual.** Sin proyecto → sin acciones de escena/personaje/vídeo.

---

**Q: ¿Debería la IA navegar al usuario a otra página automáticamente, o solo sugerir que vaya?**

Opciones:
- A) Navega automáticamente sin preguntar ("Te llevo al proyecto X...")
- B) Propone navegación como action plan que el usuario aprueba
- C) Solo sugiere con un link clickable

**Decisión recomendada: B**
La navegación es parte del action plan. Se muestra como una acción más ("Navegar a /project/[shortId]") que el usuario aprueba. Así el usuario siempre tiene control.

---

### 0.2 Historial de conversaciones

---

**Q: ¿El historial debería ser un panel lateral o un popover flotante?**

Opciones:
- A) Panel lateral que empuja el chat (implementación actual en modo panel)
- B) Popover flotante que aparece encima del chat (sin empujar contenido)
- C) Drawer que sale desde el lado (full-height overlay)

**Decisión recomendada: B (popover)**
El popover es más moderno y menos invasivo. No roba espacio del chat. Permite acciones contextuales (renombrar, eliminar) con un menú de 3 puntos. Patrón usado por ChatGPT y Claude.

Comportamiento del popover:
- Aparece anclado al botón de historial en el header del chat
- Se cierra al seleccionar una conversación
- Se cierra al pulsar fuera (click outside)
- Muestra conversaciones agrupadas por fecha (Hoy, Ayer, Esta semana, Antes)
- Cada ítem tiene hover → aparece menú de 3 puntos (renombrar, eliminar)
- No tiene botón "Nuevo chat" propio (ya está en el header del chat)

---

**Q: ¿Las conversaciones del historial deben filtrarse por organización?**

**Decisión: SÍ, SIEMPRE.**
El historial muestra solo las conversaciones de la organización activa. Si el usuario tiene varias orgs, cada una tiene su propio historial. Esto requiere guardar `org_id` en `ai_conversations`.

---

**Q: ¿Cuándo el usuario está en un proyecto, el historial muestra solo conversaciones de ese proyecto o todas las de la org?**

Opciones:
- A) Solo del proyecto activo
- B) Todas de la org, con un indicador de en qué contexto se crearon
- C) Todas de la org, agrupadas por contexto (Proyecto X, Dashboard, Proyecto Y...)

**Decisión recomendada: C**
Muestra todas las conversaciones de la org, pero con una etiqueta de contexto (🏠 Dashboard, 📁 Proyecto X, 🎬 Vídeo Y). Así el usuario puede buscar conversaciones de otros proyectos sin tener que ir a ellos.

---

**Q: ¿Debería el usuario poder renombrar las conversaciones?**

**Decisión: SÍ.**
El título automático (basado en el primer mensaje) es solo un punto de partida. El usuario puede renombrarlo desde el menú de 3 puntos del popover. Esto requiere un campo `title` editable en `ai_conversations`.

---

**Q: ¿Debería el usuario poder eliminar conversaciones?**

**Decisión: SÍ, con confirmación.**
Al pulsar "Eliminar" en el menú contextual, se muestra un pequeño confirm ("¿Eliminar esta conversación? No se puede deshacer"). Si hay mensajes con action plans ejecutados, se avisa que el historial de undo se perderá.

---

### 0.3 Contexto de creación y navegación

---

**Q: ¿Al crear una conversación, debemos guardar en qué página estaba el usuario?**

**Decisión: SÍ, SIEMPRE.**
Cada conversación guarda:
- `context_type`: `'dashboard' | 'organization' | 'project' | 'video' | 'scene'`
- `context_project_id`: UUID del proyecto (si aplica)
- `context_video_id`: UUID del vídeo (si aplica)
- `context_url`: URL completa donde se creó (ej: `/project/abc123/video/def456`)

---

**Q: ¿Al seleccionar una conversación del historial, debería la app navegar automáticamente a donde se creó?**

Opciones:
- A) Navega automáticamente siempre
- B) Navega automáticamente + muestra toast "Has vuelto a [Proyecto X]"
- C) Pregunta al usuario si quiere navegar
- D) Solo carga la conversación, no navega

**Decisión recomendada: B**
Al seleccionar una conversación, navegar automáticamente a la URL donde se creó Y cargar la conversación. Mostrar un toast breve "Contexto restaurado: Proyecto X". Esto hace que la IA tenga el mismo contexto que tenía cuando se creó la conversación.

---

**Q: ¿Qué pasa si el contexto original ya no existe (proyecto eliminado, vídeo borrado)?**

**Decisión:**
- Si la URL ya no existe (el proyecto fue eliminado), cargar la conversación en el contexto actual (dashboard)
- Mostrar un aviso en el chat: "El [proyecto/vídeo] original de esta conversación ya no está disponible. Continuando desde el dashboard."
- La IA ajusta su contexto al actual, no al original

---

**Q: ¿Debería la IA recordar el contexto de la conversación aunque el usuario haya navegado a otro sitio?**

**Decisión:**
La IA siempre usa el **contexto de la URL actual**, no el de cuando se creó la conversación. Si el usuario restaura una conversación de "Proyecto A" pero ahora está en "Proyecto B", la IA trabaja con Proyecto B. El historial de mensajes persiste, pero el contexto activo es el actual.

---

### 0.4 Navbar cuando el chat está abierto

---

**Q: ¿Qué elementos del navbar principal deberían ocultarse cuando el chat está visible?**

Contexto: El header muestra [Feedback | Search ⌘K | 💼 | ☀️ | 🔔 | 💬 | DK]

**Modo expandido (chat ocupa toda la pantalla):**
- Se oculta el header completo (ya implementado)
- El chat tiene su propio mini-header con los controles necesarios

**Modo panel (chat aparece como panel lateral derecho):**
- Se ocultan: Search ⌘K, notificaciones (🔔), cambio de tema (☀️)
- Se mantienen: menú de usuario (DK), breadcrumbs/navegación
- El botón del chat (💬) en el navbar se oculta (ya está abierto, no tiene sentido mostrarlo)
- El espacio liberado permite que los breadcrumbs tengan más espacio

Razón: cuando el chat está abierto, el espacio es escaso y la IA puede cubrir las funciones de búsqueda y notificaciones.

---

**Q: ¿El botón para abrir el chat (💬) debería estar siempre visible en el navbar, o solo cuando el chat está cerrado?**

**Decisión: Solo cuando el chat está cerrado.**
Cuando `chatPanelOpen = true`, el ícono del chat desaparece del navbar. El botón de cerrar dentro del propio chat panel es suficiente. Evita confusión visual.

---

## 1. PREGUNTAS Y RESPUESTAS — DEFINICIÓN DE COMPORTAMIENTO

### 1.1 Contextos de uso

---

**Q: ¿Dónde puede estar abierta la IA?**

A: En cualquier parte de la app, ya que el panel de Kiyoko es global (en el layout raíz). El contexto se detecta leyendo la URL activa:

| URL | Contexto |
|-----|----------|
| `/dashboard` | Dashboard general |
| `/organizations/[orgId]` | Organización |
| `/project/[shortId]` | Proyecto (resumen general) |
| `/project/[shortId]/video/[videoShortId]` | Dentro de un vídeo concreto |
| `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]` | Dentro de una escena concreta |

---

**Q: ¿Cómo cambia el comportamiento de la IA según el contexto?**

A: La IA adapta tanto el **system prompt** como las **acciones disponibles** según el contexto detectado:

**Dashboard (sin proyecto)**
- La IA actúa como asistente general de productividad creativa
- Puede crear nuevos proyectos (genera nombre, descripción, paleta)
- Puede listar y resumir proyectos existentes del usuario
- **NO habla de vídeos, escenas ni personajes** (no hay contexto)
- Responde preguntas sobre la plataforma y cómo usarla
- Quick actions: "Crear proyecto", "Ver proyectos", "¿Cómo funciona Kiyoko?"

**Organización**
- La IA conoce los miembros y proyectos de la org
- Puede crear proyectos dentro de la organización
- Puede dar resúmenes del estado de todos los proyectos de la org
- No puede modificar escenas ni personajes directamente

**Proyecto**
- La IA tiene acceso completo al contexto del proyecto:
  - Todas las escenas (con IDs reales)
  - Personajes, fondos, arcos narrativos
  - Timeline, historial de cambios
  - Configuración de IA del proyecto (`project_ai_agents`)
- Puede modificar/crear/eliminar: escenas, personajes, fondos, cámara, prompts, arcos, timeline
- Puede crear vídeos dentro del proyecto
- Puede analizar inconsistencias narrativas y proponer mejoras

**Vídeo**
- La IA enfoca su contexto en el vídeo activo y sus escenas
- Puede modificar escenas vinculadas a ese vídeo
- Puede generar/mejorar prompts de imagen y narración para ese vídeo
- Puede añadir/quitar escenas del vídeo (`video_cut_scenes`)
- Puede ajustar duración total del vídeo
- Puede generar narración (`video_narrations`)

**Escena**
- Contexto ultra-específico: una escena concreta
- La IA enfoca respuestas y acciones en esa escena
- Puede mejorar prompt, ajustar cámara, añadir/quitar personajes, cambiar fondo
- Sugiere mejoras concretas de imagen y narrativa para esa escena

---

**Q: ¿Cuándo la IA propone acciones y cuándo responde solo con texto?**

A: La IA propone un **plan de acción (JSON)** cuando el usuario pide modificar algo en la base de datos. En todos los demás casos responde con texto (markdown).

**Propone action plan cuando:**
- "Cambia la duración de la escena 3 a 8 segundos"
- "Crea un personaje llamado María que sea la protagonista"
- "Elimina las escenas 5 y 6 que no aportan nada"
- "Reordena las escenas poniendo la del hospital al principio"
- "Mejora el prompt de imagen de la escena 2"
- "Crea un nuevo proyecto de vídeo corporativo"

**Solo responde con texto cuando:**
- "¿Cuántas escenas tiene este proyecto?"
- "Explícame el arco narrativo del vídeo"
- "¿Qué personajes aparecen en la escena 4?"
- "Dame ideas para mejorar la transición entre escenas"
- Preguntas creativas, análisis, explicaciones

---

**Q: ¿El usuario tiene que aprobar los cambios antes de ejecutarlos?**

A: **Sí, siempre.** La IA nunca modifica la base de datos directamente. El flujo es:

```
Usuario pide cambio
  → IA genera Action Plan (JSON con lista de acciones)
  → Se muestra al usuario en un card con resumen y detalles
  → Usuario hace click en "Ejecutar"
  → action-executor.ts aplica los cambios en Supabase
  → Se guardan snapshots para poder hacer Undo
```

Excepción: acciones de solo lectura/análisis (`explain`) no necesitan aprobación.

---

**Q: ¿Puede la IA deshacer sus cambios?**

A: **Sí.** Cada batch de acciones ejecutadas genera un `batchId`. El usuario puede hacer undo de un batch completo, que restaura los datos desde `entity_snapshots` al estado previo.

---

### 1.2 Capacidades actuales

---

**Q: ¿Qué puede crear la IA desde cero?**

| Elemento | Contexto requerido | Tabla |
|----------|-------------------|-------|
| Proyecto | Dashboard / Org | `projects` |
| Vídeo dentro de proyecto | Proyecto | `videos` |
| Escena | Proyecto / Vídeo | `scenes` |
| Personaje | Proyecto | `characters` |
| Fondo / Localización | Proyecto | `backgrounds` |
| Arco narrativo | Proyecto | `narrative_arcs` |
| Prompt de escena | Escena | `scene_prompts` |
| Configuración de cámara | Escena | `scene_camera` |
| Narración de vídeo | Vídeo | `video_narrations` |
| Tarea | Proyecto | `tasks` |

---

**Q: ¿Qué puede modificar la IA?**

| Elemento | Qué puede cambiar | Tabla |
|----------|------------------|-------|
| Escena | Título, descripción, duración, tipo, orden, sort_order | `scenes` |
| Escena — cámara | Ángulo, movimiento, iluminación, mood, lens | `scene_camera` |
| Escena — prompt imagen | Texto del prompt, versión nueva | `scene_prompts` |
| Escena — prompt vídeo | Texto del prompt de vídeo | `scene_prompts` |
| Escena — narración | Texto narrado de la escena | `scene_prompts` (type: narration) |
| Personaje | Nombre, descripción visual, personalidad, rol | `characters` |
| Fondo | Nombre, descripción, ambiente, colores | `backgrounds` |
| Vínculo escena↔personaje | Añadir / quitar personaje de escena | `scene_characters` |
| Vínculo escena↔fondo | Asignar fondo a escena | `scene_backgrounds` |
| Orden de escenas | Reordenar todas con nuevos sort_order | `scenes` |
| Arco narrativo | Fases, tema general, journey emocional | `narrative_arcs` |
| Timeline | Posición, duración en timeline | `timeline_entries` |
| Vídeo | Título, descripción, duración objetivo | `videos` |
| Tarea | Estado, descripción, asignada a | `tasks` |
| Agente de IA del proyecto | system_prompt, creatividad, tono | `project_ai_agents` |

---

**Q: ¿Qué puede eliminar la IA?**

| Elemento | Requiere confirmación | Tabla |
|----------|-----------------------|-------|
| Escena | Sí (dentro del action plan) | `scenes` |
| Personaje | Sí | `characters` |
| Personaje de escena (vínculo) | Sí | `scene_characters` |
| Fondo | Sí | `backgrounds` |
| Tarea | Sí | `tasks` |
| Conversación del historial | Sí (confirm dialog) | `ai_conversations` |

**Nota:** La IA nunca elimina proyectos, vídeos ni usuarios. Son operaciones demasiado destructivas.

---

**Q: ¿Qué NO puede hacer la IA?**

- Eliminar proyectos completos
- Eliminar vídeos
- Gestionar usuarios o permisos
- Subir o generar imágenes directamente (solo genera prompts)
- Ejecutar voiceover/narración TTS directamente (solo genera el texto)
- Modificar datos de facturación o planes
- Acceder a proyectos de otros usuarios

---

### 1.3 Sugerencias contextuales

---

**Q: ¿Cuándo muestra la IA sugerencias de seguimiento?**

A: Después de ejecutar un action plan, la IA puede incluir en su respuesta el bloque `[SUGERENCIAS]...[/SUGERENCIAS]` con acciones de follow-up sugeridas. Se muestran como chips pulsables encima del input.

Ejemplos:
- Después de crear personaje → "¿Quieres asignarlo a alguna escena?"
- Después de reordenar escenas → "¿Quieres actualizar el arco narrativo?"
- Después de crear proyecto → "¿Empezamos generando las escenas?"
- Después de crear proyecto en dashboard → "¿Te llevo al proyecto para empezar?"

---

### 1.4 Persistencia y memoria del historial

---

**Q: ¿Cómo persiste la IA entre sesiones?**

A:
- `ai_conversations` guarda todas las conversaciones con sus mensajes (JSON)
- Al abrir el chat, se restaura el `conversationId` del último chat via `localStorage`
- El historial de conversaciones se agrupa por fecha (Hoy, Ayer, Esta semana...)
- El historial siempre está **filtrado por la organización activa**

---

**Q: ¿Cómo se muestra el historial?**

A: Como **popover flotante** anclado al botón de historial del header del chat:
- Se abre encima del contenido del chat (no empuja el chat)
- Ancho fijo ~280px, máximo 60% del viewport
- Agrupado por fecha
- Cada ítem muestra: icono de contexto + título + fecha + badge de contexto (Dashboard / Proyecto X / Vídeo Y)
- Al hover: aparece menú de 3 puntos → Renombrar / Eliminar
- Al click en conversación: cierra el popover + navega a la URL original + carga la conversación

---

**Q: ¿Las conversaciones guardan el contexto donde se crearon?**

A: **Sí.** Cada `ai_conversation` guarda:

```
context_type     → 'dashboard' | 'organization' | 'project' | 'video' | 'scene'
context_org_id   → UUID de la organización (siempre)
context_project_id → UUID del proyecto (si aplica)
context_video_id   → UUID del vídeo (si aplica)
context_url        → URL completa donde se creó (para restaurar navegación)
```

---

**Q: ¿Al seleccionar una conversación del historial, la app navega automáticamente?**

A: **Sí.** Navega automáticamente a `context_url` + carga la conversación + muestra toast "Contexto restaurado: [nombre]". Si la URL ya no existe (proyecto eliminado), carga la conversación en el contexto actual y avisa.

---

**Q: ¿Pueden renombrarse y eliminarse conversaciones?**

A: **Sí**, desde el menú contextual del popover (3 puntos):
- **Renombrar**: input inline en el popover con enter para confirmar
- **Eliminar**: confirm dialog ("¿Eliminar esta conversación? No se puede deshacer")

---

### 1.5 Providers de IA

---

**Q: ¿Qué modelos usa Kiyoko?**

A: Hay un sistema de fallback chain:
1. Si el usuario tiene `preferredProvider` y claves propias → usa el suyo primero
2. Si no → usa los providers del servidor en orden de disponibilidad
3. Si uno falla → pasa al siguiente automáticamente

Providers soportados:
- OpenAI (GPT-4o, GPT-4)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)
- Google (Gemini 1.5 Pro, Gemini Flash)
- Groq (Llama 3, Mixtral — ultra rápido)
- Mistral
- Cerebras
- DeepSeek
- Grok (xAI)

---

## 2. TABLAS IMPLICADAS — MAPA COMPLETO

### Tablas que la IA LEE para construir contexto

```
projects              → Metadata del proyecto (título, descripción, estilo)
scenes                → Todas las escenas con su info completa
scene_characters      → Qué personajes aparecen en cada escena
scene_camera          → Configuración de cámara de cada escena
scene_prompts         → Prompts actuales (image/video/narration) de cada escena
scene_backgrounds     → Qué fondos usa cada escena
characters            → Lista de personajes del proyecto
backgrounds           → Lista de fondos del proyecto
narrative_arcs        → Arcos narrativos definidos
timeline_entries      → Posiciones en el timeline
change_history        → Últimos 30 cambios (para contexto histórico)
project_ai_agents     → System prompt y configuración de IA del proyecto
videos                → Lista de vídeos del proyecto
video_cuts            → Cortes de vídeo disponibles
user_api_keys         → Claves propias del usuario (para usar su provider)
organizations         → Para filtrar historial por org activa
```

### Tablas que la IA ESCRIBE (via action-executor)

```
scenes                → create, update, delete, reorder
scene_camera          → create, update
scene_prompts         → create new version (versioned, marca old as not_current)
scene_characters      → add, remove (junction)
scene_backgrounds     → assign, update (junction)
characters            → create, update, delete
backgrounds           → create, update
narrative_arcs        → create, update
timeline_entries      → update positions
video_cut_scenes      → add/remove escenas de un vídeo
videos                → create, update title/description
tasks                 → create, update status
projects              → create (desde dashboard)
entity_snapshots      → SIEMPRE al hacer cambios (para undo)
ai_conversations      → Guarda mensajes + contexto de creación
ai_usage_logs         → Registra tokens y coste
```

### Columnas NUEVAS necesarias en ai_conversations

```sql
ALTER TABLE ai_conversations ADD COLUMN context_type TEXT
  CHECK (context_type IN ('dashboard', 'organization', 'project', 'video', 'scene'));
ALTER TABLE ai_conversations ADD COLUMN context_org_id UUID REFERENCES organizations(id);
ALTER TABLE ai_conversations ADD COLUMN context_project_id UUID REFERENCES projects(id);
ALTER TABLE ai_conversations ADD COLUMN context_video_id UUID REFERENCES videos(id);
ALTER TABLE ai_conversations ADD COLUMN context_url TEXT;
ALTER TABLE ai_conversations ADD COLUMN title TEXT; -- editable por el usuario
```

### Tablas que FALTAN implementar en action-executor

```
narrative_arcs        → Falta create/update en el executor actual
timeline_entries      → Falta update en el executor actual
video_cut_scenes      → Falta add/remove escenas de un vídeo
videos                → Falta create desde la IA
tasks                 → Falta create/update desde la IA
projects              → Falta create desde la IA (está en ruta separada)
```

---

## 3. NUEVAS ACCIONES A IMPLEMENTAR

Para completar la visión del producto, faltan estos `AiActionType`:

### Nivel Proyecto

| Action Type | Tabla | Descripción |
|-------------|-------|-------------|
| `create_project` | `projects` | Crear proyecto nuevo desde brief del usuario |
| `update_project` | `projects` | Cambiar título, descripción, estilo, paleta |
| `create_video` | `videos` | Crear nuevo vídeo dentro del proyecto |
| `update_video` | `videos` | Cambiar título, duración objetivo, plataforma |
| `update_narrative_arc` | `narrative_arcs` | Actualizar arco narrativo |
| `create_task` | `tasks` | Crear tarea asignada a alguien o sin asignar |
| `update_task` | `tasks` | Cambiar estado, descripción, asignado |
| `navigate` | — | Navegar a una URL dentro de la app |

### Nivel Vídeo

| Action Type | Tabla | Descripción |
|-------------|-------|-------------|
| `add_scene_to_video` | `video_cut_scenes` | Añadir escena existente al vídeo |
| `remove_scene_from_video` | `video_cut_scenes` | Quitar escena del vídeo |
| `reorder_scenes_in_video` | `video_cut_scenes` | Reordenar escenas en el vídeo |
| `update_narration` | `video_narrations` | Actualizar texto de narración del vídeo |
| `create_narration` | `video_narrations` | Crear narración nueva para el vídeo |

### Nivel Análisis / Batch

| Action Type | Descripción |
|-------------|-------------|
| `batch_create_scenes` | Crear múltiples escenas de golpe |
| `batch_update_prompts` | Actualizar prompts de todas las escenas en un paso |
| `analyze_consistency` | Análisis de inconsistencias narrativas (solo texto, no modifica) |
| `generate_full_arc` | Genera y guarda arco narrativo completo |

---

## 4. FLUJOS COMPLETOS POR CONTEXTO

### Flujo A: Usuario en Dashboard — "Crea un proyecto sobre una boda"

```
1. KiyokoChat detecta contexto: Dashboard (sin projectId)
2. System prompt: modo asistente general — SIN acciones de escena/vídeo/personaje
3. IA responde con preguntas: ¿duración? ¿plataforma? ¿estilo?
4. Usuario responde
5. IA genera Action Plan:
   - create_project: {title, description, style, palette}
   - navigate: {url: "/project/[shortId]"}  ← para ir al proyecto creado
6. Usuario aprueba → se inserta en `projects`, se navega al proyecto
7. IA sugiere: "¿Empezamos generando las escenas?" (ahora con contexto de proyecto)
```

### Flujo B: Usuario en Proyecto — "Crea 5 escenas para este storyboard"

```
1. KiyokoChat detecta contexto: Proyecto (con projectId)
2. System prompt incluye: metadata del proyecto + personajes + fondos existentes
3. IA genera Action Plan:
   - create_scene x5 con títulos, descripciones, duraciones
4. Usuario aprueba → 5 inserts en `scenes` + snapshots
5. IA sugiere: "¿Quieres que genere los prompts de imagen para cada escena?"
```

### Flujo C: Usuario en Vídeo — "Mejora la narración de este vídeo"

```
1. KiyokoChat detecta contexto: Vídeo (con videoShortId + projectId)
2. System prompt incluye: escenas del vídeo + narración actual si existe
3. IA genera texto de narración mejorado
4. Action Plan:
   - create_narration / update_narration: {text, tone, duration}
5. Usuario aprueba → insert/update en `video_narrations`
```

### Flujo D: Usuario selecciona conversación del historial

```
1. Usuario abre popover de historial
2. Ve conversación con badge "📁 Proyecto X" creada hace 3 días
3. Hace click → popover se cierra
4. App navega a /project/[shortId] (context_url guardada)
5. Chat carga los mensajes de esa conversación
6. Toast: "Contexto restaurado: Proyecto X"
7. IA tiene ahora contexto de Proyecto X para responder
```

### Flujo E: Usuario en Dashboard — Kiyoko proactiva

```
1. Usuario abre el chat por primera vez en el dashboard
2. Kiyoko muestra saludo contextual (estado vacío especial):
   "Hola! Tienes 3 proyectos. El último activo fue 'Boda García' (modificado hace 2 días).
   ¿Qué quieres hacer?"
3. Quick actions mostradas:
   - "Entrar en Boda García"  → navigate action
   - "Crear nuevo proyecto"    → flujo de creación
   - "Ver todos los proyectos" → lista resumida en texto
   - "¿Qué puedo hacer?"      → onboarding
```

---

## 5. MEJORAS PENDIENTES Y DESEADAS

### Cambios de UX pendientes

- [ ] **Historial como popover** — Cambiar de panel lateral a popover flotante con acciones contextuales (renombrar, eliminar)
- [ ] **Contexto de creación** — Guardar `context_type`, `context_url`, `org_id`, `project_id`, `video_id` en cada conversación
- [ ] **Navegación al restaurar** — Al seleccionar conversación, navegar a context_url + toast
- [ ] **Historial por org** — Filtrar siempre por org activa (requiere migración de columna)
- [ ] **Renombrar conversaciones** — Edición inline del título en el popover
- [ ] **Quick actions dinámicas** — Cambiar los action buttons del estado vacío según el contexto
- [ ] **Navbar adaptativo** — Ocultar search, bell, theme toggle cuando chatPanelOpen=true
- [ ] **Ocultar botón chat en navbar** — Cuando chatPanelOpen=true, ocultar el ícono del chat del header

### Nuevas acciones en action-executor

- [ ] `create_video` — Crear vídeo en el proyecto
- [ ] `create_project` — Crear proyecto (actualmente ruta separada no conectada)
- [ ] `create_task` — Crear tarea desde el chat
- [ ] `navigate` — Navegar a una URL de la app como parte de un action plan
- [ ] `update_narrative_arc` — Modificar arco narrativo
- [ ] `add_scene_to_video` / `remove_scene_from_video`
- [ ] `update_narration` — Actualizar narración de vídeo
- [ ] `batch_create_scenes` — Crear múltiples escenas en un solo action plan

### Calidad de respuestas

- [ ] **Contexto de vídeo completo** — Pasar `videoShortId` al API cuando estamos en un vídeo
- [ ] **Contexto de escena** — Pasar `sceneShortId` al API cuando estamos en una escena concreta
- [ ] **System prompt por contexto** — Inyectar SOLO las acciones disponibles según contexto
- [ ] **Temperatura adaptativa** — Bajar temperatura para acciones técnicas, subirla para generación creativa
- [ ] **Validación de IDs** — Verificar que sceneId/characterId del plan existen antes de mostrar al usuario
- [ ] **Respuestas en streaming visuales** — Mostrar progreso del action plan mientras se va generando

---

## 6. ESTRUCTURA DEL SYSTEM PROMPT (objetivo)

```
[IDENTIDAD]
Eres Kiyoko, directora creativa y asistente de producción.
Respondes siempre en español. Tu tono es {tone} y creatividad {level}.

[CONTEXTO ACTUAL]
- Estás en: {dashboard | organización | proyecto | vídeo | escena}
- Organización: {nombre} ({id})
- Proyecto: {título} ({id})       ← OMITIR si no hay proyecto
- Vídeo activo: {título} ({id})   ← OMITIR si no hay vídeo
- Escena activa: {título} ({id})  ← OMITIR si no hay escena

[INSTRUCCIÓN DE CONTEXTO]
Adapta tu comportamiento al contexto actual:
- Si estás en Dashboard: NO menciones vídeos ni escenas. Habla de proyectos y productividad.
- Si estás en Proyecto: Trabaja con las escenas, personajes y vídeos de este proyecto.
- Si estás en Vídeo: Enfócate en este vídeo y sus escenas vinculadas.

[PROYECTO]          ← Solo si hay proyecto
Descripción: {descripción}
Plataforma: {platform}
Duración total: {duration}
Estilo: {style}

[ESCENAS — {N} escenas]   ← Solo si hay proyecto
{lista de escenas con IDs reales, títulos, duraciones, tipos}

[PERSONAJES — {N} personajes]  ← Solo si hay proyecto
{lista con IDs, nombres, roles, descripciones visuales}

[FONDOS — {N} fondos]     ← Solo si hay proyecto
{lista con IDs, nombres, descripciones}

[VÍDEO ACTIVO]   ← Solo si hay vídeo activo
Escenas del vídeo: {lista de escenas vinculadas}
Narración actual: {texto si existe}

[HISTORIAL DE CAMBIOS RECIENTES]   ← Solo si hay proyecto
{últimos 10 cambios con descripción y fecha}

[ACCIONES DISPONIBLES EN ESTE CONTEXTO]
{lista de AiActionType disponibles según el contexto — NO incluir acciones de escena en dashboard}

[INSTRUCCIONES PARA ACCIONES]
Cuando el usuario pida modificar algo, responde con un JSON de action_plan...
{formato exacto del JSON con ejemplos}

[INSTRUCCIONES PARA SUGERENCIAS]
Después de proponer o ejecutar acciones, incluye [SUGERENCIAS]...[/SUGERENCIAS]
```

---

*Última actualización: Marzo 2026*
*Documento de trabajo — actualizar al implementar nuevas capacidades*
