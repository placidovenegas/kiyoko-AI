# Kiyoko AI — Guión completo de interacción V2

> Documento DEFINITIVO de cada interacción entre usuario e IA.
> Para cada acción: qué dice el usuario, qué responde la IA, qué tabla consulta,
> qué muestra, qué pregunta si falta contexto, y qué sugiere después.

---

## PARTE 1: CÓMO SABE LA IA DÓNDE ESTOY

### 1.1 El Context Object

Cada mensaje del usuario incluye este objeto. Sin él la IA responde sin sentido.

```typescript
interface ChatContext {
  page: 'dashboard' | 'project' | 'video' | 'scene' | 'character' | 'background' | 'tasks' | 'settings' | 'exports';
  
  projectId?: string;
  projectTitle?: string;
  projectStyle?: string;        // pixar, realistic, anime...
  
  videoId?: string;
  videoTitle?: string;
  videoPlatform?: string;       // youtube, instagram_reels...
  videoStatus?: string;
  
  sceneId?: string;
  sceneNumber?: number;
  sceneTitle?: string;
  sceneStatus?: string;
  
  characterId?: string;
  characterName?: string;
  
  backgroundId?: string;
  backgroundName?: string;
  
  // Datos precargados para que la IA no tenga que hacer queries extra
  stats?: {
    totalCharacters: number;
    totalBackgrounds: number;
    totalVideos: number;
    totalScenes: number;
    pendingTasks: number;
    scenesWithoutPrompt: number;
    scenesWithoutImage: number;
  };
  
  apis?: {
    hasImageProvider: boolean;
    hasVideoProvider: boolean;
    hasTTSProvider: boolean;
    imageProvider?: string;
    videoProvider?: string;
  };
  
  // Lista rápida de recursos del proyecto (para autocompletar/sugerir)
  projectResources?: {
    characters: { id: string; name: string }[];
    backgrounds: { id: string; name: string }[];
    videos: { id: string; title: string }[];
  };
}
```

### 1.2 Regla de oro: NUNCA adivinar, SIEMPRE preguntar

Si la IA no tiene suficiente contexto para ejecutar una acción, **PREGUNTA**. Nunca asume.

| Situación | MAL (adivina) | BIEN (pregunta) |
|-----------|--------------|-----------------|
| "Crea un prompt" sin sceneId | Genera un prompt genérico inútil | "¿Para qué escena? Tienes: #1 Hook, #2 Build, #3 Peak" |
| "Muéstrame los personajes" sin projectId | Error o lista vacía | "¿De qué proyecto? Tienes: Project Alpha, Mi Corto" |
| "Añade una escena" sin videoId | La crea en limbo | "¿En qué video? Tienes: Sunset Adventures, Intro Marca" |
| "Genera imagen" sin contexto | No hace nada | "¿De qué escena quieres generar imagen? Estás en Project Alpha que tiene 2 videos." |

---

## PARTE 2: FLUJOS DE DESAMBIGUACIÓN

### 2.1 Cuando falta el PROYECTO

```
Usuario: "Créame un personaje llamado Luna" (page=dashboard, sin projectId)

IA: "Para crear a Luna necesito saber en qué proyecto. ¿En cuál la creo?"
    
    → consulta: SELECT title, id FROM projects WHERE owner_id = userId ORDER BY updated_at DESC
    
    Muestra:
    → "Project Alpha" (último activo)
    → "Mi Cortometraje"
    → "Crear proyecto nuevo"

Usuario: "En Project Alpha"

IA: (ahora tiene projectId) → abre dock de crear personaje con name="Luna"
```

### 2.2 Cuando falta el VIDEO

```
Usuario: "Crea una escena de apertura" (page=project, sin videoId)

IA: "¿En qué video añado la escena?"

    → consulta: SELECT title, id, status FROM videos WHERE project_id = X ORDER BY sort_order
    
    Muestra:
    → "Sunset Adventures" (draft, 3 escenas)
    → "Intro Corporativa" (prompting, 5 escenas)
    → "Crear video nuevo"

Usuario: "En Sunset Adventures"

IA: (ahora tiene videoId) → continúa creando la escena
```

### 2.3 Cuando falta la ESCENA

```
Usuario: "Genera el prompt de imagen" (page=video, sin sceneId)

IA: "¿Para qué escena genero el prompt?"

    → consulta: SELECT scene_number, title, status FROM scenes WHERE video_id = X ORDER BY sort_order
    
    Muestra:
    → "#1 Hook — La Llegada" (prompt_ready ✓)
    → "#2 Build — El Conflicto" (draft ✗ ← sin prompt)
    → "#3 Peak — La Decisión" (draft ✗ ← sin prompt)
    → "Todas las que no tienen prompt" ← acción batch

Usuario: "#3"

IA: genera prompt para escena #3
```

### 2.4 Cuando falta el PERSONAJE

```
Usuario: "Muéstrame el personaje" (sin characterName, proyecto tiene 3 personajes)

IA: "¿Cuál de tus personajes?"

    → consulta: SELECT name, role, initials FROM characters WHERE project_id = X
    
    Muestra:
    → "Juan — Protagonista"
    → "Luna — Protagonista"
    → "Kai — Secundario"

Usuario: "Juan"

IA: muestra CharacterCard de Juan
```

### 2.5 Cuando dice algo que NO entiende

```
Usuario: "asdfghjk" o "haz la cosa esa"

IA: "No te he entendido bien. ¿Quieres hacer alguna de estas cosas?"

    (sugerencias basadas en page + contexto)
    
    Si page=scene:
    → "Generar prompt de imagen"
    → "Configurar cámara"
    → "Ver detalle de la escena"
    → "¿Qué le falta a esta escena?"
    
    Si page=project:
    → "Ver resumen del proyecto"
    → "Crear personaje"
    → "Ver escenas"
    → "Tareas pendientes"
    
    Si page=dashboard:
    → "Ver mis proyectos"
    → "Crear nuevo proyecto"
    → "Dame ideas para un video"
```

---

## PARTE 3: FLUJOS DE IDEACIÓN (Dashboard)

### 3.1 "Dame ideas para un video"

```
Usuario: "Dame ideas para un video" (page=dashboard)

IA: "¡Genial! Para darte ideas necesito un poco de contexto."

    → consulta: SELECT id, title, style FROM projects WHERE owner_id = userId
    
    "¿Tienes algún proyecto donde quieras crear el video, o prefieres algo nuevo?"
    
    → "Tengo una idea nueva desde cero"
    → "Para Project Alpha" (si tiene proyectos)
    → "Para Mi Cortometraje" (si tiene proyectos)

--- OPCIÓN A: IDEA NUEVA ---

Usuario: "Tengo una idea nueva"

IA: "Perfecto, cuéntame. ¿Qué tipo de contenido quieres hacer?"

    → "Video de animación / cartoon"
    → "Video realista / cinematográfico"
    → "Anuncio / comercial"
    → "Tengo mi propia idea"

Usuario: "Quiero generar un video de cartoon para YouTube"

IA: "Un cartoon para YouTube, me encanta. Vamos a definirlo:
     • ¿De qué trata? ¿Tienes una historia o quieres que la inventemos juntos?
     • ¿Cuánto debería durar aproximadamente?"

    → "Inventa tú una historia"
    → "Tengo una idea: [input]"
    → "Solo quiero empezar y ver qué sale"

Usuario: "Un gato que viaja por el espacio buscando su hogar"

IA: "Me encanta esa idea. Para un cartoon de YouTube sobre un gato espacial, te propongo:

     📋 Proyecto: 'Space Cat — El Viaje a Casa'
     🎨 Estilo: Pixar (colorido, 3D)
     📺 Plataforma: YouTube
     📐 Formato: 16:9 largo
     ⏱ Duración: ~60 segundos (10-12 escenas)
     
     ¿Quieres que cree el proyecto con estos datos?"
     
    → "Sí, créalo" ← INSERT en projects + videos
    → "Cambia el estilo a anime"
    → "Que sea más corto, 30 segundos"
    → "Déjame ajustar algunos datos"

Usuario: "Sí, créalo"

IA: 1. INSERT projects (title, style=pixar, status=draft)
    2. INSERT videos (title, platform=youtube, video_type=long, target_duration=60, aspect_ratio=16:9)
    3. Opcionalmente genera narrative_arcs (hook/build/peak/close)
    
    "He creado el proyecto 'Space Cat — El Viaje a Casa' con un video para YouTube.
     ¿Qué hacemos primero?"
    
    → "Planificar las escenas"          ← abre GenerationFlow
    → "Crear al protagonista (el gato)" ← abre dock personaje
    → "Crear los fondos (espacio, planetas)" ← abre dock fondo
    → "Ir al proyecto"                  ← router.push

--- OPCIÓN B: EN PROYECTO EXISTENTE ---

Usuario: "Para Project Alpha"

IA: → consulta: SELECT * FROM projects WHERE id = X (con stats)
    
    "Project Alpha tiene estilo {style}, ya tiene {N} videos y {M} personajes.
     ¿Qué tipo de video quieres añadir?"
    
    → "Un reel corto para Instagram"
    → "Un video largo para YouTube"
    → "Dame sugerencias basadas en lo que ya tengo"

Usuario: "Dame sugerencias basadas en lo que ya tengo"

IA: → consulta: characters, backgrounds, videos del proyecto
    
    "Con tus personajes Juan y Luna, y tus fondos de playa y callejón, 
     podríamos hacer:
     
     1. 'Encuentro en el callejón' — Luna encuentra a Juan de noche (reel 30s)
     2. 'Amanecer en la playa' — Escena emotiva de Juan al amanecer (short 15s)
     3. 'El chase' — Persecución del callejón a la playa (video 60s)
     
     ¿Te gusta alguna?"
    
    → "Me gusta la 3, créala"
    → "Modifica la 1 para que sea..."
    → "Dame más opciones"
```

### 3.2 "Revisa los estilos y referencias"

```
Usuario: "Quiero revisar los estilos y referencias del proyecto" (page=project)

IA: → consulta: 
    - SELECT * FROM style_presets WHERE project_id = X
    - SELECT style, custom_style_description, color_palette, global_prompt_rules FROM projects WHERE id = X
    - SELECT reference_image_url FROM characters WHERE project_id = X AND reference_image_url IS NOT NULL
    - SELECT reference_image_url FROM backgrounds WHERE project_id = X AND reference_image_url IS NOT NULL
    
    "El estilo actual de {projectTitle} es **{style}**. 
     Esto es lo que tienes configurado:"
    
    [StyleBlock]
    - Estilo: {style} (pixar/realistic/anime...)
    - Descripción custom: {custom_style_description}
    - Paleta: [colores visuales]
    - Reglas globales: {global_prompt_rules}
    
    "Referencias visuales subidas:"
    - {N} personajes con imagen de referencia
    - {M} fondos con imagen de referencia
    
    → "Cambiar estilo a anime"
    → "Editar reglas globales de prompt"
    → "Ver todas las imágenes de referencia"
    → "Crear un nuevo style preset"
    → "Ver qué personajes no tienen referencia"
```

---

## PARTE 4: INTERACCIÓN CON TAREAS (completo)

### 4.1 CREAR tarea

```
Usuario: "Crea una tarea" / "Necesito hacer algo" / "Añade tarea"

--- Si no da detalles ---

IA: "¿Qué tarea necesitas crear?"

    → "Generar prompts pendientes"     ← auto-rellena category=prompt
    → "Revisar escenas"                ← category=review
    → "Exportar video"                 ← category=export
    → "Otra cosa: [input]"

--- Si da detalles ---

Usuario: "Tarea urgente: hacer voiceover del video para el viernes"

IA: → extrae:
    - title: "Hacer voiceover del video"
    - category: voiceover (inferido de "voiceover")
    - priority: urgent (inferido de "urgente")
    - due_date: próximo viernes (inferido de "para el viernes")
    - video_id: ¿cuál? → si page=video usa ese, si no → pregunta
    
    → consulta: INSERT INTO tasks
    
    "Tarea creada:
     📋 Hacer voiceover del video
     🔴 Urgente · 🎙 Voiceover · 📅 Viernes 28 Mar
     
     ¿Quieres que también genere el texto de narración?"
    
    → "Sí, genera narración"           ← flujo NarrationBlock
    → "Asigna a un miembro del equipo" ← UPDATE tasks.assigned_to
    → "Ver todas las tareas"
```

### 4.2 VER tareas (con filtros inteligentes)

```
Usuario: "Muéstrame las tareas" (page=project)

IA: → consulta: SELECT *, profiles!assigned_to(full_name) FROM tasks 
                WHERE project_id = X ORDER BY priority DESC, due_date ASC
    
    "Tienes {N} tareas pendientes en {projectTitle}:"
    
    [TaskList con filtros visuales]
    - Urgentes primero (rojo)
    - Con fecha pasada marcadas como atrasadas
    - Agrupadas por status: pendientes, en progreso, completadas

--- Variantes del usuario ---

"Tareas urgentes" → filtro priority = 'urgent'
"Tareas de esta semana" → filtro due_date entre hoy y +7 días
"Tareas de generación" → filtro category IN ('image_gen', 'video_gen', 'prompt')
"Tareas del video Sunset" → filtro video_id = X
"Tareas de la escena 3" → filtro scene_id = X
"Tareas de Juan" → filtro assigned_to = userId de Juan (de profiles)
"¿Qué tengo atrasado?" → filtro due_date < hoy AND status != 'completed'
```

### 4.3 EDITAR tarea desde el chat

```
Usuario: "Pon la tarea de voiceover como completada"

IA: → consulta: SELECT * FROM tasks WHERE project_id = X AND title ILIKE '%voiceover%'
    → si hay varias: "Tengo 2 tareas de voiceover, ¿cuál?"
    → si hay una: UPDATE tasks SET status='completed', completed_at=now()
    
    "Tarea completada: 'Hacer voiceover del video' ✓"
    
    → "Ver tareas pendientes"
    → "¿Qué más puedo completar?"

--- Otros edits ---

"Cambia la prioridad del review a alta" → UPDATE priority='high'
"Aplaza la exportación al lunes" → UPDATE due_date='2026-03-30'
"Asigna el editing a @Maria" → UPDATE assigned_to (buscar en profiles)
"Bloquea la tarea de video_gen" → UPDATE status='blocked'
```

### 4.4 ELIMINAR tarea

```
Usuario: "Elimina la tarea de meeting"

IA: → busca por título
    "¿Eliminar 'Reunión de revisión semanal'? No se puede deshacer."
    
    → "Sí, eliminar"  ← DELETE + activity_log
    → "No, cancelar"
```

### 4.5 "¿QUÉ HAGO AHORA?" — El comando más inteligente

```
Usuario: "¿Qué hago ahora?" / "¿Qué sigue?" / "Siguiente paso"

IA: → analiza TODO el estado del proyecto:
    
    1. SELECT * FROM tasks WHERE status IN ('pending','in_progress') AND project_id = X 
       ORDER BY priority DESC, due_date ASC LIMIT 3
       → tareas urgentes
    
    2. SELECT count(*) FROM scenes WHERE video_id IN (videos del proyecto) 
       AND status = 'draft' AND id NOT IN (SELECT scene_id FROM scene_prompts WHERE is_current)
       → escenas sin prompt
    
    3. SELECT count(*) FROM scenes WHERE status = 'prompt_ready' 
       AND id NOT IN (SELECT scene_id FROM scene_media WHERE is_current AND media_type='image')
       → escenas con prompt pero sin imagen
    
    4. SELECT * FROM scene_annotations WHERE status != 'resolved'
       → anotaciones del cliente sin resolver
    
    5. SELECT * FROM videos WHERE status = 'draft'
       → videos sin empezar
    
    Prioriza y responde:
    
    "Esto es lo que deberías hacer ahora en {projectTitle}:

     1️⃣ URGENTE: Tienes la tarea 'Revisar casting' para mañana
     2️⃣ QUICK WIN: 2 escenas tienen prompt pero no imagen — genera las imágenes
     3️⃣ PENDIENTE: El cliente dejó 1 anotación sin resolver en la escena #2
     4️⃣ SIGUIENTE: Las escenas #4 y #5 no tienen prompt aún"
    
    → "Ir a la tarea urgente"
    → "Generar las 2 imágenes pendientes"
    → "Ver anotación del cliente"
    → "Generar prompts faltantes"
```

---

## PARTE 5: FLUJOS CROSS-CONTEXT (estoy en un lugar, pido algo de otro)

### 5.1 Regla: la IA NAVEGA al contexto correcto

Cuando el usuario pide algo que pertenece a otro nivel, la IA no falla — navega.

### 5.2 Desde DASHBOARD pido algo de un proyecto

```
Usuario: "Créame un prompt de una escena" (page=dashboard)

IA: "Para generar un prompt necesito saber el proyecto, el video y la escena."
    
    → consulta: SELECT id, title FROM projects WHERE owner_id = userId ORDER BY updated_at DESC LIMIT 5
    
    "¿En qué proyecto?"
    → "Project Alpha"
    → "Mi Cortometraje"

Usuario: "Project Alpha"

IA: → consulta: SELECT id, title FROM videos WHERE project_id = X
    
    "¿De qué video?"
    → "Sunset Adventures (3 escenas)"
    → "Intro Marca (5 escenas)"

Usuario: "Sunset Adventures"

IA: → consulta: SELECT scene_number, title, status FROM scenes WHERE video_id = X ORDER BY sort_order
    
    "¿De qué escena? Las que no tienen prompt son:"
    → "#2 Build — El Conflicto (sin prompt ✗)"
    → "#3 Peak — La Decisión (sin prompt ✗)"
    → "Todas las que faltan"

Usuario: "#3"

IA: → NAVEGA al contexto: router.push(ruta_video) + genera prompt
    "He generado el prompt para la escena #3 'La Decisión':"
    [PromptBlock]
```

### 5.3 Desde ESCENA pido algo de otro VIDEO

```
Usuario: "¿Cuántas escenas tiene el otro video?" (page=scene de video A)

IA: → consulta: SELECT title, id FROM videos WHERE project_id = X AND id != currentVideoId
    
    "¿Te refieres a 'Intro Marca'? Tiene 5 escenas."
    
    → "Ver escenas de Intro Marca"  ← navega
    → "Volver a mi escena actual"
```

### 5.4 Desde PERSONAJE pido crear una escena

```
Usuario: "Crea una escena con este personaje" (page=character, characterId=abc)

IA: → sabe qué personaje es (del contexto)
    → consulta: SELECT id, title FROM videos WHERE project_id = X
    
    "Creo una escena con {characterName}. ¿En qué video la añado?"
    
    → "Sunset Adventures"
    → "Crear video nuevo"

Usuario: "Sunset Adventures"

IA: → consulta: SELECT max(scene_number) FROM scenes WHERE video_id = X
    → consulta: SELECT max(sort_order) FROM scenes WHERE video_id = X
    
    "¿Dónde la pongo en el video?"
    
    → "Al principio (antes de escena #1)"
    → "Al final (después de escena #3)"
    → "Entre escena #1 y #2"
    → "Déjame elegir el tipo y fase"

Usuario: "Al final"

IA: → abre dock de crear escena con:
    - video_id = Sunset Adventures
    - scene_number = 4 (auto)
    - sort_order = max+1
    - scene_characters pre-asignado con characterId actual
    
    "Nueva escena #4 con {characterName}. ¿De qué trata?"
```

---

## PARTE 6: GUIÓN POR ENTIDAD (con tablas)

### ═══════════════════════════════════
### 6.1 PERSONAJES
### ═══════════════════════════════════

#### CREAR

| Lo que dice el usuario | Lo que extrae la IA | Campo en tabla `characters` |
|----------------------|--------------------|-----------------------------|
| "Se llama Luna" | nombre | `name` |
| "Es la protagonista" | rol | `role` |
| "25 años, valiente" | edad+personalidad | `description`, `personality` |
| "Pelo rojo largo" | pelo | `hair_description` |
| "Siempre lleva chaqueta de cuero" | ropa | `signature_clothing` |
| "Tiene un collar y gafas de sol" | accesorios | `accessories[]` |
| "Usa katana y arco" | herramientas | `signature_tools[]` |
| "Color morado" | color | `color_accent` |

**Tablas involucradas en INSERT:** `characters` + `activity_log`
**Auto-generado:** `initials` (primeras 2 letras), `code` si aplica, `sort_order`

#### VER (detalle)

**Tablas que consulta:**
```sql
-- Principal
SELECT * FROM characters WHERE id = X;

-- Galería
SELECT * FROM character_images WHERE character_id = X ORDER BY sort_order;

-- Escenas donde aparece
SELECT s.scene_number, s.title, s.status, sc.role_in_scene 
FROM scene_characters sc 
JOIN scenes s ON s.id = sc.scene_id 
WHERE sc.character_id = X;

-- Reglas (dentro del JSON rules)
-- Ya viene en el SELECT principal
```

#### EDITAR

| Frase del usuario | Campo que actualiza | Tabla |
|-------------------|--------------------| ------|
| "Cambia el nombre a María" | `name`, `initials` | `characters` |
| "Ahora es secundario" | `role` | `characters` |
| "Añade sombrero a accesorios" | `accessories[]` (append) | `characters` |
| "Quita la katana" | `signature_tools[]` (remove) | `characters` |
| "Regenera el prompt" | `ai_prompt_description` | `characters` |
| "Sube esta imagen" | `reference_image_url`, `reference_image_path` | `characters` |

**Siempre hacer:** INSERT en `activity_log` con action='updated', entity_type='character'

#### ELIMINAR

**Tablas afectadas:**
1. CHECK `scene_characters` WHERE character_id = X → avisar cuántas escenas afecta
2. DELETE `character_images` WHERE character_id = X
3. DELETE `scene_characters` WHERE character_id = X
4. DELETE `characters` WHERE id = X
5. INSERT `activity_log`

#### GENERAR IMAGEN

**Tablas involucradas:**
```sql
-- 1. Leer prompt del personaje
SELECT ai_prompt_description, prompt_snippet, visual_description FROM characters WHERE id = X;

-- 2. Leer estilo del proyecto
SELECT style, global_prompt_rules FROM projects WHERE id = projectId;

-- 3. Leer style preset si existe
SELECT prompt_prefix, prompt_suffix, negative_prompt FROM style_presets 
WHERE project_id = projectId AND is_default = true;

-- 4. Verificar API
SELECT image_provider, image_provider_config FROM project_ai_settings WHERE project_id = projectId;
SELECT * FROM user_api_keys WHERE user_id = userId AND provider = image_provider AND is_active = true;

-- 5. Si OK → generar → INSERT resultado
INSERT INTO character_images (character_id, image_type, file_url, generator, prompt_used, is_primary, source)
VALUES (X, 'portrait', url_generada, provider, prompt_usado, true, 'ai_generated');

-- 6. Log
INSERT INTO activity_log ...
INSERT INTO ai_usage_logs (task='character_image_gen', model, provider, tokens...)
```

### ═══════════════════════════════════
### 6.2 FONDOS
### ═══════════════════════════════════

#### CREAR

| Lo que dice el usuario | Campo en `backgrounds` |
|----------------------|------------------------|
| "Playa al atardecer" | `name`, `time_of_day`='atardecer' |
| "Es exterior" | `location_type`='exterior' |
| "Con palmeras y arena dorada" | `description` |
| "Se puede ver de frente y cenital" | `available_angles[]` |

**Auto-generado:** `code` (BG-001, BG-002...)

#### VER

```sql
SELECT * FROM backgrounds WHERE id = X;
-- Escenas donde se usa:
SELECT s.scene_number, s.title, sb.angle, sb.time_of_day 
FROM scene_backgrounds sb JOIN scenes s ON s.id = sb.scene_id 
WHERE sb.background_id = X;
```

#### EDITAR, ELIMINAR

Misma lógica que personajes. Tablas afectadas: `backgrounds`, `scene_backgrounds`, `activity_log`.

### ═══════════════════════════════════
### 6.3 VIDEOS
### ═══════════════════════════════════

#### CREAR

| Lo que dice | Campo en `videos` |
|------------|-------------------|
| "Para Instagram" | `platform`='instagram_reels', `aspect_ratio`='9:16' |
| "Un reel de 30 segundos" | `video_type`='reel', `target_duration_seconds`=30 |
| "Para YouTube largo" | `platform`='youtube', `video_type`='long', `aspect_ratio`='16:9' |
| "Anuncio de TV" | `platform`='tv_commercial', `video_type`='ad' |

**Auto-generado:** `short_id`, `slug` (de title), `sort_order`

**Post-crear la IA sugiere planificar:**
```
IA: "Video '{title}' creado para {platform}. ¿Qué hacemos primero?"

    → "Planifica las escenas automáticamente"
       ← IA genera N escenas basándose en duración y arco narrativo
       ← INSERT scenes + narrative_arcs
    
    → "Crear escenas manualmente"
    → "Asignar style preset"
```

#### VER (resumen)

```sql
SELECT v.*, 
  (SELECT count(*) FROM scenes WHERE video_id = v.id) as scene_count,
  (SELECT count(*) FROM scenes s 
   JOIN scene_prompts sp ON sp.scene_id = s.id 
   WHERE s.video_id = v.id AND sp.is_current = true) as prompts_done,
  (SELECT count(*) FROM scenes s 
   JOIN scene_media sm ON sm.scene_id = s.id 
   WHERE s.video_id = v.id AND sm.is_current = true AND sm.media_type = 'image') as images_done
FROM videos v WHERE v.id = X;

-- Narración
SELECT * FROM video_narrations WHERE video_id = X AND is_current = true;

-- Análisis
SELECT * FROM video_analysis WHERE video_id = X AND is_current = true;

-- Arco narrativo
SELECT * FROM narrative_arcs WHERE video_id = X ORDER BY phase_number;
```

### ═══════════════════════════════════
### 6.4 ESCENAS
### ═══════════════════════════════════

#### CREAR (flujo inteligente)

```
Usuario: "Crea una escena" (desde cualquier página)

--- PASO 1: ¿En qué video? ---

Si page=scene o page=video → usa videoId del contexto
Si no → pregunta (ver desambiguación 5.2)

--- PASO 2: ¿Dónde la pongo? ---

IA: → consulta: SELECT scene_number, title, arc_phase FROM scenes WHERE video_id = X ORDER BY sort_order
    
    "El video tiene {N} escenas. ¿Dónde añado la nueva?"
    
    → "Al principio"        ← sort_order = 0, renumerar
    → "Al final"            ← sort_order = max+1
    → "Entre #2 y #3"       ← sort_order entre ambos
    → "Reemplazar #2"       ← scene_type='improved'

--- PASO 3: ¿De qué tipo? ---

IA: "¿Qué tipo de escena es?"

    → "Original — escena principal de la historia"     ← scene_type='original'
    → "Filler — transición entre escenas"              ← scene_type='filler', is_filler=true
    → "Mejorada — nueva versión de una existente"      ← scene_type='improved'

--- PASO 4: ¿Qué fase del arco? ---

IA: (sugiere basándose en la posición)
    Si al principio → sugiere 'hook'
    Si al final → sugiere 'close'
    Si en medio → sugiere 'build' o 'peak'

--- PASO 5: Detalles ---

Abre dock con campos pre-rellenados según todo lo anterior.

**INSERT:**
```sql
INSERT INTO scenes (
  title, video_id, project_id, scene_number, sort_order,
  scene_type, arc_phase, description, dialogue, director_notes,
  duration_seconds, status
) VALUES (...);

INSERT INTO activity_log (...);
```

#### "¿QUÉ LE FALTA A ESTA ESCENA?"

**Consultas de verificación:**
```sql
-- ¿Tiene personaje?
SELECT count(*) FROM scene_characters WHERE scene_id = X;

-- ¿Tiene fondo?
SELECT count(*) FROM scene_backgrounds WHERE scene_id = X;

-- ¿Tiene cámara?
SELECT count(*) FROM scene_camera WHERE scene_id = X;

-- ¿Tiene prompt imagen?
SELECT count(*) FROM scene_prompts WHERE scene_id = X AND prompt_type = 'image' AND is_current = true;

-- ¿Tiene prompt video?
SELECT count(*) FROM scene_prompts WHERE scene_id = X AND prompt_type = 'video' AND is_current = true;

-- ¿Tiene imagen generada?
SELECT count(*) FROM scene_media WHERE scene_id = X AND media_type = 'image' AND is_current = true;

-- ¿Tiene video clip?
SELECT count(*) FROM scene_video_clips WHERE scene_id = X AND is_current = true;

-- ¿Tiene narración?
SELECT count(*) FROM scene_prompts WHERE scene_id = X AND prompt_type = 'narration' AND is_current = true;
```

### ═══════════════════════════════════
### 6.5 PROMPTS
### ═══════════════════════════════════

#### GENERAR prompt de imagen

**Tablas que lee para construir el prompt:**
```sql
-- 1. La escena
SELECT * FROM scenes WHERE id = sceneId;

-- 2. Personajes de la escena
SELECT c.* FROM scene_characters sc 
JOIN characters c ON c.id = sc.character_id 
WHERE sc.scene_id = sceneId;

-- 3. Fondos de la escena
SELECT b.* FROM scene_backgrounds sb 
JOIN backgrounds b ON b.id = sb.background_id 
WHERE sb.scene_id = sceneId;

-- 4. Cámara
SELECT * FROM scene_camera WHERE scene_id = sceneId;

-- 5. Estilo del proyecto
SELECT style, global_prompt_rules, custom_style_description FROM projects WHERE id = projectId;

-- 6. Style preset del video
SELECT sp.* FROM style_presets sp 
JOIN videos v ON v.style_preset_id = sp.id 
WHERE v.id = videoId;

-- 7. Reglas del personaje (rules JSON)
-- Ya viene del paso 2

-- 8. Prompt template si hay uno por defecto
SELECT * FROM prompt_templates 
WHERE project_id = projectId AND is_default = true AND template_type = 'image';
```

**Combina todo → genera prompt en inglés → INSERT:**
```sql
-- Marcar anteriores como no current
UPDATE scene_prompts SET is_current = false 
WHERE scene_id = sceneId AND prompt_type = 'image';

-- Insertar nuevo
INSERT INTO scene_prompts (
  scene_id, prompt_text, prompt_type, version, is_current, generator
) VALUES (sceneId, prompt_generado, 'image', nueva_version, true, 'kiyoko_ai');

-- Actualizar status escena
UPDATE scenes SET status = 'prompt_ready' WHERE id = sceneId;

-- Logs
INSERT INTO activity_log ...;
INSERT INTO ai_usage_logs ...;
```

### ═══════════════════════════════════
### 6.6 GENERACIÓN (imagen, video, audio)
### ═══════════════════════════════════

#### Verificación de API (SIEMPRE antes de generar)

```sql
-- 1. ¿Provider configurado?
SELECT image_provider, video_provider, tts_provider 
FROM project_ai_settings WHERE project_id = X;

-- 2. ¿Key activa?
SELECT * FROM user_api_keys 
WHERE user_id = userId AND provider = 'midjourney' AND is_active = true;

-- 3. ¿Presupuesto?
-- Si monthly_spent_usd >= monthly_budget_usd → banner de límite
```

**Si falta → ApiStatusBanner con botón a `/settings/api-keys`**
**Si hay error → warning con `last_error` y `last_error_at`**

#### POST-generación

```sql
-- Imagen generada
INSERT INTO scene_media (
  scene_id, media_type, file_url, file_path, generator, prompt_used, 
  version, is_current, status, thumbnail_url
) VALUES (...);

UPDATE scenes SET status = 'generated' WHERE id = sceneId;

-- Video clip generado
INSERT INTO scene_video_clips (
  scene_id, clip_type, file_url, duration_seconds, generator,
  prompt_video, prompt_image_first_frame, version, is_current,
  last_frame_url, status
) VALUES (...);

-- Usage tracking
INSERT INTO ai_usage_logs (...);
UPDATE user_api_keys SET 
  last_used_at = now(), 
  total_requests = total_requests + 1,
  total_cost_usd = total_cost_usd + estimated_cost
WHERE id = keyId;
```

### ═══════════════════════════════════
### 6.7 CÁMARA
### ═══════════════════════════════════

#### CONFIGURAR

```
Usuario: "Configura la cámara de la escena 3"

Si page=scene → usa sceneId del contexto
Si no → pregunta (desambiguación)

IA: → consulta: SELECT * FROM scene_camera WHERE scene_id = X
    → consulta: SELECT arc_phase, description FROM scenes WHERE id = X
    
    Si NO tiene cámara:
    "La escena #3 no tiene cámara configurada. Basándome en que es una escena 
     Peak con descripción '{desc}', te recomiendo:"
    
    Ángulo: close_up (captura emoción)
    Movimiento: dolly_in (crea tensión)
    Iluminación: golden hour
    Mood: intenso
    
    → "Aplicar recomendación"  ← INSERT scene_camera
    → "Cambiar ángulo a wide"
    → "Elegir yo manualmente"  ← dock con selectores

    Si YA tiene cámara:
    "La cámara actual de la escena #3 es: {angle} + {movement}"
    → "Cambiar ángulo"
    → "Cambiar movimiento"
    → "Ver recomendación de IA"
```

**INSERT/UPDATE `scene_camera`:**
```sql
INSERT INTO scene_camera (
  scene_id, camera_angle, camera_movement, lighting, mood, camera_notes, ai_reasoning
) VALUES (...)
ON CONFLICT (scene_id) DO UPDATE SET ...;
```

### ═══════════════════════════════════
### 6.8 TAREAS (ya cubierto en PARTE 4)
### ═══════════════════════════════════

### ═══════════════════════════════════
### 6.9 ANÁLISIS
### ═══════════════════════════════════

```
Usuario: "Analiza el video" (page=video)

IA: → consulta: SELECT * FROM video_analysis WHERE video_id = X AND is_current = true
    
    Si existe y es reciente (< 24h):
    "El último análisis es de hace {tiempo}. ¿Lo muestro o genero uno nuevo?"
    
    Si no existe o es viejo:
    → Genera análisis nuevo basándose en:
    
    SELECT s.*, 
      (SELECT count(*) FROM scene_prompts WHERE scene_id = s.id AND is_current = true) as has_prompt,
      (SELECT count(*) FROM scene_media WHERE scene_id = s.id AND is_current = true) as has_media,
      sc.camera_angle, sc.camera_movement
    FROM scenes s
    LEFT JOIN scene_camera sc ON sc.scene_id = s.id
    WHERE s.video_id = videoId
    ORDER BY s.sort_order;
    
    -- + narrative_arcs para verificar estructura
    SELECT * FROM narrative_arcs WHERE video_id = videoId;
    
    INSERT INTO video_analysis (
      video_id, overall_score, summary, strengths, weaknesses, 
      suggestions, analysis_model, version, is_current
    ) VALUES (...);
```

### ═══════════════════════════════════
### 6.10 COMPARTIR Y REVIEW
### ═══════════════════════════════════

```sql
-- Crear share
INSERT INTO scene_shares (
  video_id, project_id, shared_by, token, 
  scene_ids, is_all_scenes, allow_annotations, 
  password_hash, expires_at
) VALUES (...);

-- Ver anotaciones
SELECT sa.*, ss.token 
FROM scene_annotations sa
JOIN scene_shares ss ON ss.id = sa.scene_share_id
WHERE ss.video_id = videoId
ORDER BY sa.created_at DESC;

-- Resolver anotación
UPDATE scene_annotations SET 
  status = 'resolved', 
  resolved_at = now(), 
  resolved_by = userId
WHERE id = annotationId;
```

### ═══════════════════════════════════
### 6.11 NARRACIÓN
### ═══════════════════════════════════

```
Usuario: "Genera la narración del video"

IA: → consulta: SELECT * FROM video_narrations WHERE video_id = X AND is_current = true
    
    Si no hay texto:
    → Lee todas las escenas para generar texto narrativo
    SELECT description, dialogue, director_notes FROM scenes WHERE video_id = X ORDER BY sort_order;
    
    → Genera texto → INSERT video_narrations (narration_text, version=1, is_current=true)
    
    "He generado la narración basándome en las {N} escenas:"
    [NarrationBlock con texto editable]
    
    → "Editar texto"
    → "Generar audio" ← verifica tts_provider primero
    → "Cambiar tono a más dramático"

--- Generar audio ---
    
    → consulta: SELECT tts_provider, tts_provider_config FROM project_ai_settings
    → consulta: SELECT * FROM user_api_keys WHERE provider = tts_provider
    
    Si OK:
    "¿Qué voz quieres usar?"
    → Muestra voces disponibles del provider
    
    UPDATE video_narrations SET 
      audio_url = url, audio_path = path, audio_duration_ms = dur,
      voice_id = X, voice_name = 'nombre', provider = 'elevenlabs',
      speed = 1.0, style = 'narrative', status = 'completed'
    WHERE id = narrationId;
```

### ═══════════════════════════════════
### 6.12 PROYECTO
### ═══════════════════════════════════

```
Usuario: "Ver resumen del proyecto"

IA: → consultas:
    SELECT * FROM projects WHERE id = X;
    SELECT count(*) as total, status FROM videos WHERE project_id = X GROUP BY status;
    SELECT count(*) as total FROM characters WHERE project_id = X;
    SELECT count(*) as total FROM backgrounds WHERE project_id = X;
    SELECT count(*) as total, status FROM scenes WHERE project_id = X GROUP BY status;
    SELECT count(*) as total, status FROM tasks WHERE project_id = X GROUP BY status;
    SELECT * FROM project_ai_settings WHERE project_id = X;
    
    "Resumen de {projectTitle}:"
    [ProjectOverview con stats]
```

### ═══════════════════════════════════
### 6.13 ACTIVIDAD
### ═══════════════════════════════════

```
"¿Qué se hizo hoy?"

SELECT al.*, p.full_name 
FROM activity_log al 
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.project_id = X 
AND al.created_at >= today()
ORDER BY al.created_at DESC;
```

### ═══════════════════════════════════
### 6.14 EXPORTAR
### ═══════════════════════════════════

```
"Exporta el video en MP4"

→ Verificar que todas las escenas estén approved o generated
→ Si no: "El video tiene {N} escenas sin aprobar. ¿Exporto de todas formas?"

INSERT INTO exports (
  project_id, video_id, format, config, version, notes
) VALUES (...);

→ Mostrar progreso → actualizar file_url cuando termine
```

### ═══════════════════════════════════
### 6.15 NAVEGACIÓN
### ═══════════════════════════════════

| Frase | Acción | Ruta |
|-------|--------|------|
| "Llévame a la escena 3" | router.push | `/p/{slug}/videos/{vslug}/scenes/3` |
| "Abre el personaje Juan" | router.push | `/p/{slug}/characters/{charId}` |
| "Ir a configuración" | router.push | `/p/{slug}/settings` |
| "Abre las API keys" | router.push | `/settings/api-keys` |
| "Ir al dashboard" | router.push | `/dashboard` |
| "Abre el video" | router.push | `/p/{slug}/videos/{vslug}` |
| "Ver tareas" | router.push | `/p/{slug}/tasks` |
| "Abre el proyecto" | router.push | `/p/{slug}` |

---

## PARTE 7: CONSEJOS PROACTIVOS

### 7.1 Tabla: situación → consejo → tabla que verifica

| Situación | Cómo la detecta | Consejo |
|-----------|----------------|---------|
| Proyecto nuevo, sin videos | `stats.totalVideos === 0` | "Crea tu primer video" |
| Video sin escenas | `SELECT count(*) FROM scenes WHERE video_id = X` = 0 | "Planifica las escenas" |
| Escena sin personaje | `scene_characters` vacío para sceneId | "Asigna un personaje" |
| Escena sin fondo | `scene_backgrounds` vacío para sceneId | "Asigna un fondo" |
| Escena sin cámara | `scene_camera` no existe para sceneId | "Configura la cámara" |
| Prompt listo, sin imagen | `scene_prompts` existe, `scene_media` no | "Genera la imagen" |
| Imagen lista, sin video | `scene_media` imagen existe, `scene_video_clips` no | "Genera el video clip" |
| Video completo sin narración | Todas las escenas OK, `video_narrations` vacío | "Genera la narración" |
| Video completo sin exportar | `video.status = 'approved'`, `exports` vacío | "Exporta el video" |
| Muchas escenas sin prompt | `stats.scenesWithoutPrompt > 2` | "Genera los prompts en batch" |
| Personaje sin imagen | `character_images` vacío | "Genera imagen de referencia" |
| Personaje sin prompt | `ai_prompt_description` es null | "Genera prompt visual" |
| Tareas atrasadas | `tasks.due_date < today AND status != completed` | "Tienes tareas atrasadas" |
| Sin API keys | `apis.hasImageProvider === false` | "Configura APIs" |
| Sin style preset | `style_presets` vacío para projectId | "Configura estilo visual" |
| Anotaciones sin resolver | `scene_annotations.status != 'resolved'` | "Feedback del cliente pendiente" |
| Video sin análisis | `video_analysis` vacío para videoId | "Analiza el video" |

### 7.2 Prioridad

1. **BLOQUEANTE** — sin esto no avanza: sin proyecto, sin video, sin escenas
2. **QUICK WIN** — se resuelve en 1 click: generar prompt, generar imagen
3. **MEJORA** — no urgente pero valioso: análisis, narración, review

---

## PARTE 8: TONO Y FORMATO

### 8.1 Reglas

- Máximo 2 líneas de intro antes del componente
- SIEMPRE incluir datos reales: nombres, números, estados
- En español excepto prompts visuales (inglés)
- Nunca decir "No puedo" — siempre ofrecer alternativa
- Variar frases (no repetir siempre lo mismo)

### 8.2 Cuando NO entiende

```
IA: "No te he entendido bien. ¿Quieres hacer alguna de estas cosas?"

    (4 sugerencias basadas en el contexto actual)
    → Sugerencia 1 (la más probable)
    → Sugerencia 2
    → Sugerencia 3
    → "Escribir de otra forma"
```

### 8.3 Cuando hay ERROR

```
IA: "Ha habido un problema al {acción}: {error_message}.
     Esto puede pasar por: {causa probable}."
     
    → "Reintentar"
    → "Ir a configuración"  (si es de API)
    → "Reportar problema"   (INSERT feedback)
```

### 8.4 Secuencia visual SIEMPRE

```
THINK (800ms) → STREAM (typewriter) → PAUSA (300ms) → COMPONENTE → SUGERENCIAS
```

Sin excepciones. Sin saltar pasos.

---

*Documento V2 completo — 7 partes + guión de 15 entidades + flujos de ideación + desambiguación + tablas SQL para cada acción. Referencia para system prompt de la IA.*
