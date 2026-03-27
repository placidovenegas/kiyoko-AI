# Kiyoko AI — Motor de Escenas: Especificacion Completa

> Documento maestro que define como se crean, almacenan y generan las escenas
> de un video. Es la referencia para la IA (Kiyoko) y para los desarrolladores.
> Incluye: modelo de datos, flujo de creacion, fuentes de informacion para prompts,
> y reglas de composicion.

**Fecha:** 2026-03-26
**Version:** 1.0

---

## 1. VISION GENERAL

Un **video** en Kiyoko se compone de **escenas**. Cada escena describe un momento
narrativo con personajes, fondos, camara y prompts para generar imagen y video.

```
proyecto
  └─ video
       ├─ escena 1 (hook, 3s)
       │    ├─ personajes asignados
       │    ├─ fondo asignado
       │    ├─ camara (angulo, movimiento, luz, mood)
       │    ├─ prompt imagen (key frame)
       │    ├─ prompt video (clip segundo a segundo)
       │    ├─ timeline entries (desglose temporal)
       │    └─ clips generados (base + extensiones)
       ├─ escena 2 (build, 10s)
       │    └─ ...
       ├─ transicion 2→3 (filler, 1s)
       │    └─ ...
       └─ escena 3 (peak, 10s, extendida)
            ├─ clip 3A (base, 10s)
            └─ clip 3B (extension, 10s, parent=3A)
```

---

## 2. TODAS LAS TABLAS INVOLUCRADAS

### 2.1 Tablas principales de escena

| Tabla | Relacion | Que almacena |
|-------|----------|-------------|
| `scenes` | 1 video → N escenas | La escena: titulo, descripcion, dialogo, notas, duracion, arco |
| `scene_camera` | 1 escena → 1 camara | Plano dominante: angulo, movimiento, luz, mood, reasoning |
| `scene_prompts` | 1 escena → N prompts | Prompts de imagen, video, narracion (versionados) |
| `scene_video_clips` | 1 escena → N clips | Clips generados: base + extensiones encadenadas |
| `scene_characters` | N escenas ↔ N personajes | Que personajes aparecen en cada escena |
| `scene_backgrounds` | N escenas ↔ N fondos | Que fondo se usa en cada escena |
| `scene_media` | 1 escena → N media | Imagenes/videos generados (resultado) |
| `timeline_entries` | 1 video → N entries | Desglose segundo a segundo de todo el video |

### 2.2 Tablas de recursos (alimentan los prompts)

| Tabla | Que aporta al prompt |
|-------|---------------------|
| `characters` | `prompt_snippet`, `ai_prompt_description`, `visual_description`, `hair_description`, `signature_clothing`, `accessories`, `color_accent`, `personality` |
| `backgrounds` | `prompt_snippet`, `ai_prompt_description`, `description`, `location_type`, `time_of_day`, `available_angles` |
| `style_presets` | `prompt_prefix`, `prompt_suffix`, `negative_prompt`, `color_palette`, `generator_config` |
| `prompt_templates` | `template_text` con variables reemplazables |

### 2.3 Tablas de contexto (definen el tono y estilo)

| Tabla | Campos clave | Como influye |
|-------|-------------|-------------|
| `projects` | `style` (enum), `ai_brief`, `global_prompt_rules`, `color_palette`, `custom_style_description` | Estilo visual base, reglas globales de prompt |
| `videos` | `platform`, `video_type`, `target_duration_seconds`, `description`, `aspect_ratio`, `style_preset_id` | Plataforma destino, duracion, tipo de video |
| `profiles` | `creative_video_types`, `creative_platforms`, `creative_use_context`, `creative_purpose`, `creative_typical_duration` | Perfil creativo del usuario (personaliza sugerencias) |
| `project_ai_agents` | `tone`, `creativity_level`, `system_prompt`, `video_style_context` | Tono de la IA, nivel de creatividad, contexto extra |
| `project_ai_settings` | `image_provider`, `video_provider`, `video_base_duration_seconds`, `video_supports_extension` | Que generador usar, limites de duracion |
| `narrative_arcs` | `phase`, `start_second`, `end_second`, `description` | Estructura narrativa del video |

---

## 3. MODELO DE DATOS DETALLADO

### 3.1 scenes

```
id                  uuid PK
video_id            uuid FK → videos (obligatorio)
project_id          uuid FK → projects (obligatorio)
scene_number        int (orden numerico: 1, 2, 3...)
title               text (nombre de la escena)
description         text? (que pasa narrativamente)
dialogue            text? (texto hablado/susurrado)
director_notes      text? (notas de direccion para la IA)
duration_seconds    int? (duracion en segundos)
scene_type          enum: original | improved | new | filler | video
arc_phase           enum: hook | build | peak | close
status              enum: draft | prompt_ready | generating | generated | approved | rejected
sort_order          int? (orden visual en timeline)
is_filler           bool? (true = transicion, no escena narrativa principal)
metadata            json? (datos extra: is_extended, segments, transition_type...)
generation_context  text? (contexto que uso la IA para crear esta escena)
short_id            text? (ID corto para URL)
```

**Uso de metadata para escenas extendidas:**
```json
{
  "is_extended": true,
  "segments": [
    {"id": "6A", "label": "Soplan las velas", "range": "0-10s", "clip_order": 1},
    {"id": "6B", "label": "Gran Final", "range": "10-20s", "clip_order": 2}
  ],
  "transition_between_segments": "fade_through_white"
}
```

**Uso de metadata para transiciones:**
```json
{
  "is_transition": true,
  "transition_type": "split_screen_wipe",
  "connects": {"from_scene": 2, "to_scene": 3}
}
```

### 3.2 scene_camera (1:1 con escena)

```
id                uuid PK
scene_id          uuid FK → scenes (UNIQUE, 1:1)
camera_angle      enum: wide | medium | close_up | extreme_close_up | pov | low_angle | high_angle | birds_eye | dutch | over_shoulder
camera_movement   enum: static | dolly_in | dolly_out | pan_left | pan_right | tilt_up | tilt_down | tracking | crane | handheld | orbit
lighting          text? (descripcion de iluminacion)
mood              text? (ambiente emocional)
ai_reasoning      text? (por que la IA eligio esta configuracion)
camera_notes      text? (desglose de planos si hay multi-camara)
```

**IMPORTANTE:** `camera_angle` y `camera_movement` son el plano DOMINANTE.
Si hay multi-camara, el desglose va en `camera_notes` y en `timeline_entries.metadata`.

### 3.3 scene_prompts (1:N con escena, versionados)

```
id                uuid PK
scene_id          uuid FK → scenes
prompt_type       enum: image | video | narration | analysis
prompt_text       text (el prompt EN INGLES)
version           int? (1, 2, 3... para historial)
is_current        bool? (solo 1 activo por tipo)
status            text? (draft, sent, generated, failed)
generator         text? (grok, dalle, midjourney, runway...)
generation_config json? (aspect_ratio, reference_images, fps, duration...)
result_url        text? (URL del resultado generado)
```

**Tipos de prompt por escena:**
| prompt_type | Que contiene | Idioma |
|-------------|-------------|--------|
| `image` | Prompt del KEY FRAME (primera imagen) | Ingles |
| `video` | Prompt del CLIP completo segundo a segundo | Ingles |
| `narration` | Texto de voiceover | Español |
| `analysis` | Analisis IA post-generacion | Español |

**generation_config ejemplo (imagen):**
```json
{
  "aspect_ratio": "16:9",
  "style": "3d_pixar",
  "reference_images": ["marian_ref.png", "placido_ref.png"],
  "negative_prompt": "realistic, photograph, 2D flat"
}
```

**generation_config ejemplo (video):**
```json
{
  "duration_seconds": 10,
  "aspect_ratio": "16:9",
  "fps": 24,
  "reference_images": ["placido_ref.png", "scene3_frame1.png"],
  "first_frame_url": "scene3_keyframe.png"
}
```

### 3.4 scene_video_clips (1:N con escena, encadenados)

```
id                       uuid PK
scene_id                 uuid FK → scenes
clip_type                text (base | extension | transition)
extension_number         int? (1 = primero, 2 = segundo...)
parent_clip_id           uuid? FK → scene_video_clips (self-ref, para encadenar)
duration_seconds         int?
prompt_image_first_frame text? (prompt del key frame de ESTE clip)
prompt_video             text? (prompt de video de ESTE clip)
visual_description_es    text? (descripcion en español de lo que se ve)
file_url                 text? (URL del clip generado)
file_path                text? (path en storage)
thumbnail_url            text?
last_frame_url           text? (CRITICO: input visual para el siguiente clip)
last_frame_path          text?
status                   text? (draft, generating, generated, failed)
version                  int?
is_current               bool?
generator                text?
generation_config        json?
ai_extension_reasoning   text? (por que la IA decidio extender asi)
metadata                 json? (cameras por segmento, segment_id, etc.)
```

**Encadenamiento de clips (escena extendida):**
```
clip 6A (base)     → last_frame_url = "sparkles.png"
clip 6B (extension) → parent_clip_id = clip_6A.id
                    → first_frame = last_frame de 6A (continuidad)
```

### 3.5 scene_characters (N:M)

```
id            uuid PK
scene_id      uuid FK → scenes
character_id  uuid FK → characters
role_in_scene text? (protagonista, secundario, fondo, mencion)
sort_order    int?
```

### 3.6 scene_backgrounds (N:M)

```
id              uuid PK
scene_id        uuid FK → scenes
background_id   uuid FK → backgrounds
angle           text? (angulo especifico del fondo en esta escena)
time_of_day     text? (override del time_of_day del fondo)
is_primary      bool? (fondo principal si hay varios)
```

### 3.7 timeline_entries (1 video → N entries)

```
id               uuid PK
video_id         uuid FK → videos
project_id       uuid FK → projects
scene_id         uuid? FK → scenes (puede ser null para transiciones)
title            text (titulo del segmento)
description      text? (que pasa en este rango de tiempo)
start_time       text (ej: "00:00:03")
end_time         text (ej: "00:00:05")
duration_seconds int?
arc_phase        enum: hook | build | peak | close
sort_order       int?
phase_color      text? (color visual)
timeline_version text?
metadata         json? (camera por segmento, audio, props, vfx...)
```

**metadata por timeline entry:**
```json
{
  "camera_angle": "close_up",
  "camera_movement": "static",
  "shot_type": "detail_insert",
  "audio": "Electric spark BZZZT. Tense silence.",
  "characters": ["placido"],
  "props": ["toaster", "egg"],
  "vfx": "smoke_puff",
  "comedy_beat": "tension_release"
}
```

---

## 4. FUENTES DE INFORMACION PARA GENERAR PROMPTS

Cuando Kiyoko genera un prompt de imagen o video, debe consultar TODAS estas fuentes:

### 4.1 Cadena de datos para construir un prompt

```
PROMPT = f(
  proyecto.style,                    ← estilo visual base (pixar, realistic, anime...)
  proyecto.global_prompt_rules,      ← reglas que aplican a TODOS los prompts
  proyecto.ai_brief,                 ← brief creativo del proyecto
  proyecto.custom_style_description, ← descripcion de estilo custom
  proyecto.color_palette,            ← paleta de colores

  video.platform,                    ← plataforma destino (youtube, tiktok...)
  video.video_type,                  ← tipo (long, short, reel, ad...)
  video.description,                 ← descripcion del video
  video.aspect_ratio,                ← ratio (16:9, 9:16, 1:1)
  video.target_duration_seconds,     ← duracion total objetivo

  style_preset.prompt_prefix,        ← prefijo de estilo (si existe)
  style_preset.prompt_suffix,        ← sufijo de estilo
  style_preset.negative_prompt,      ← lo que NO debe aparecer
  style_preset.generator_config,     ← config especifica del generador

  escena.description,                ← que pasa en la escena
  escena.dialogue,                   ← texto hablado
  escena.director_notes,             ← notas de direccion
  escena.duration_seconds,           ← duracion
  escena.arc_phase,                  ← fase del arco (hook/build/peak/close)

  camara.camera_angle,               ← angulo de plano
  camara.camera_movement,            ← movimiento
  camara.lighting,                   ← iluminacion
  camara.mood,                       ← ambiente

  personaje.prompt_snippet,          ← SNIPPET LISTO para copiar al prompt
  personaje.ai_prompt_description,   ← descripcion IA del personaje
  personaje.visual_description,      ← descripcion visual detallada
  personaje.hair_description,        ← pelo
  personaje.signature_clothing,      ← ropa
  personaje.accessories,             ← accesorios
  personaje.color_accent,            ← color asociado

  fondo.prompt_snippet,              ← SNIPPET LISTO para copiar al prompt
  fondo.ai_prompt_description,       ← descripcion IA del fondo
  fondo.location_type,               ← interior/exterior/mixto
  fondo.time_of_day,                 ← hora del dia
  fondo.available_angles,            ← angulos disponibles

  perfil.creative_video_types,       ← preferencias del usuario
  perfil.creative_platforms,
  perfil.creative_purpose,

  prompt_template.template_text,     ← plantilla con variables

  ai_agent.tone,                     ← tono de la IA
  ai_agent.creativity_level,         ← nivel de creatividad (0-1)
)
```

### 4.2 Prioridad de datos en el prompt

1. **prompt_snippet del personaje** → SI EXISTE, usarlo TAL CUAL como base
2. **prompt_snippet del fondo** → SI EXISTE, usarlo TAL CUAL como base
3. **style_preset.prompt_prefix** → va AL INICIO del prompt
4. **style_preset.prompt_suffix** → va AL FINAL del prompt
5. **proyecto.global_prompt_rules** → reglas que SIEMPRE aplican
6. **proyecto.style** → define el estilo base ("3D animated Pixar-style" etc.)
7. Lo demas se combina para dar contexto

### 4.3 Que referencia de imagen se sube al generador

| Que se genera | Imagenes de referencia a subir |
|---------------|-------------------------------|
| Key frame de escena | Imagen ref de CADA personaje que aparece + imagen ref del fondo |
| Video clip base | Refs de personajes + ref fondo + KEY FRAME generado |
| Video clip extension | Refs de personajes + ref fondo + LAST FRAME del clip anterior |
| Transicion | Refs de personajes visibles + ultimo frame de escena anterior + primer frame de escena siguiente |

---

## 5. FLUJO DE CREACION DE ESCENAS

### 5.1 Flujo automatico (Kiyoko crea escenas)

```
1. Usuario dice: "Crea las escenas para este video"
2. Kiyoko lee:
   ├─ video.description (de que va el video)
   ├─ video.platform + video_type + target_duration
   ├─ characters[] (personajes disponibles)
   ├─ backgrounds[] (fondos disponibles)
   ├─ proyecto.style + global_prompt_rules
   └─ perfil.creative_* (preferencias del usuario)

3. Kiyoko genera plan de escenas con arco narrativo:
   ├─ Hook (2-5s): captar atencion
   ├─ Build (40% tiempo): desarrollar historia
   ├─ Peak (20% tiempo): climax
   └─ Close (2-5s): cierre

4. Para CADA escena genera:
   ├─ title, description, dialogue, director_notes
   ├─ duration_seconds (suma = target_duration)
   ├─ arc_phase
   ├─ Asigna personajes de los disponibles
   ├─ Asigna fondo de los disponibles
   └─ Sugiere camara (angle, movement, lighting, mood)

5. Muestra al usuario como [SCENE_PLAN] + [ACTION_PLAN]
6. Usuario confirma → se ejecuta (INSERT en scenes + scene_characters + scene_backgrounds + scene_camera)
```

### 5.2 Flujo de generacion de prompts

```
1. Usuario dice: "Genera los prompts de imagen"
2. Para CADA escena:
   ├─ Lee personajes asignados → obtiene prompt_snippet / visual_description
   ├─ Lee fondo asignado → obtiene prompt_snippet / description
   ├─ Lee camara → angle, movement, lighting, mood
   ├─ Lee estilo proyecto → style, global_prompt_rules
   ├─ Lee style_preset si existe → prefix, suffix, negative

3. Compone el prompt EN INGLES:
   {style_preset.prompt_prefix}
   {proyecto.style} scene, {escena.description}.
   Character: {personaje.prompt_snippet || personaje.visual_description}.
   {personaje.hair_description}. {personaje.signature_clothing}.
   Setting: {fondo.prompt_snippet || fondo.description}.
   {fondo.location_type}, {fondo.time_of_day}.
   Camera: {camara.camera_angle} shot, {camara.camera_movement}.
   Lighting: {camara.lighting}. Mood: {camara.mood}.
   {video.aspect_ratio} aspect ratio.
   {style_preset.prompt_suffix}

4. Guarda en scene_prompts (prompt_type: 'image', is_current: true)
5. Muestra al usuario con [PROMPT_PREVIEW]
```

### 5.3 Flujo de generacion de video prompt

```
1. Lee TODOS los timeline_entries de la escena
2. Para CADA segmento temporal:
   ├─ Lee que personajes aparecen
   ├─ Lee que pasa (description del timeline_entry)
   ├─ Lee camara del segmento (timeline_entry.metadata.camera_*)
   ├─ Lee audio (timeline_entry.metadata.audio)

3. Compone el prompt de video:
   "Character: {personaje.prompt_snippet}

   Second 0-3 | {timeline_entry.title}:
   {timeline_entry.description}
   Audio: {timeline_entry.metadata.audio}

   Second 3-6 | {siguiente_entry.title}:
   ..."

4. Guarda en scene_prompts (prompt_type: 'video', is_current: true)
```

---

## 6. REGLAS DE COMPOSICION

### 6.1 El estilo visual viene del proyecto

| project.style | Prefijo del prompt |
|--------------|-------------------|
| `pixar` | "3D animated Pixar-style" |
| `realistic` | "Photorealistic cinematic" |
| `anime` | "Anime-style cel-shaded" |
| `watercolor` | "Watercolor illustration style" |
| `flat_2d` | "Flat 2D motion graphics" |
| `cyberpunk` | "Cyberpunk neon-lit" |
| `custom` | proyecto.custom_style_description |

### 6.2 La plataforma define el formato

| video.platform | Aspect Ratio | Duracion tipica | Estilo visual |
|---------------|-------------|----------------|---------------|
| `youtube` | 16:9 | 60s-600s | Cinematografico |
| `instagram_reels` | 9:16 | 15-90s | Vertical, dinamico |
| `tiktok` | 9:16 | 15-60s | Rapido, enganchante |
| `tv_commercial` | 16:9 | 15-30s | Premium, pulido |
| `web` | 16:9 o 1:1 | Variable | Depende del brief |

### 6.3 El tipo de video define el tono

| video.video_type | Tono | Creatividad |
|-----------------|------|-------------|
| `long` | Narrativo, desarrollado | Media |
| `short` | Conciso, impactante | Alta |
| `reel` | Dinamico, rapido | Alta |
| `story` | Intimo, efimero | Media |
| `ad` | Persuasivo, preciso | Baja (sigue brief) |
| `custom` | Segun descripcion | Segun ai_agent.creativity_level |

### 6.4 El arco narrativo define el ritmo

| arc_phase | Porcentaje | Proposito | Camara tipica |
|-----------|-----------|-----------|---------------|
| `hook` | 5-10% (2-5s) | Captar atencion INMEDIATA | CU, movimiento rapido |
| `build` | 40-50% | Desarrollar historia | Medium, variado |
| `peak` | 20-30% | Climax, momento clave | Wide → CU dramatico |
| `close` | 5-10% (2-5s) | Cierre, call to action | Zoom out, fade |

### 6.5 Reglas de personajes en prompts

- Si `personaje.prompt_snippet` existe → usarlo COMO BASE, no inventar
- Si no existe pero `visual_description` si → construir desde ahi
- SIEMPRE incluir `hair_description` (pelo es lo mas importante para consistencia)
- SIEMPRE incluir `signature_clothing` (ropa identifica al personaje)
- `accessories` solo si son relevantes en la escena
- Si la escena tiene multiples personajes → describir CADA UNO por separado
- El `role_in_scene` (de scene_characters) define la prominencia en el prompt

### 6.6 Reglas de fondos en prompts

- Si `fondo.prompt_snippet` existe → usarlo COMO BASE
- `location_type` (interior/exterior/mixto) define la iluminacion base
- `time_of_day` define la temperatura de color
- `available_angles` limita los angulos de camara validos
- Si `scene_backgrounds.angle` tiene override → usar ese angulo
- Si `scene_backgrounds.time_of_day` tiene override → usar esa hora

### 6.7 Reglas de escenas extendidas

- Una escena es "extendida" si dura mas de lo que el generador soporta (ej: 10s max)
- Se divide en N clips encadenados via `parent_clip_id`
- Cada clip tiene SU PROPIO prompt de imagen y video
- El `last_frame_url` del clip N es el INPUT visual del clip N+1
- Los `timeline_entries` cubren la duracion TOTAL (ej: 0-20s para 2 clips de 10s)
- `metadata.segments[]` en la escena describe la estructura

### 6.8 Reglas de transiciones

- Las transiciones son escenas con `scene_type: 'filler'` y `is_filler: true`
- Tienen `metadata.is_transition: true` y `metadata.transition_type`
- Duran 1-2 segundos
- Tienen su propio prompt de imagen y video
- Se posicionan entre las escenas que conectan (sort_order intermedio)

---

## 7. LIMITES DEL GENERADOR (project_ai_settings)

| Campo | Que define |
|-------|-----------|
| `video_base_duration_seconds` | Duracion maxima de un clip base (ej: 10s) |
| `video_extension_duration_seconds` | Duracion de cada extension (ej: 5s) |
| `video_supports_extension` | Si el generador soporta extensiones |
| `image_provider` | Que generador de imagenes usar |
| `video_provider` | Que generador de video usar |

Si una escena dura 25s y el generador soporta 10s base + 5s extension:
→ Clip base (10s) + Extension 1 (5s) + Extension 2 (5s) + Extension 3 (5s) = 25s
→ 4 clips encadenados, cada uno con su prompt

---

## 8. EJEMPLO COMPLETO: Escena 3 del Storyboard

### Datos que alimentan el prompt:

```
PROYECTO:
  style: 'pixar' → "3D animated Pixar-style"
  global_prompt_rules: null
  ai_brief: "Comedia romantica slapstick, regalo cumpleanos"

VIDEO:
  platform: 'youtube' → 16:9
  video_type: 'short'
  target_duration: 70s
  description: "Placido prepara una sorpresa de cumple para Marian"

PERSONAJE (Placido):
  prompt_snippet: "young man with short light brown hair swept to the side,
    slight stubble beard, blue eyes, wearing a navy blue hoodie with WOLFTOWN text,
    no sunglasses, no accessories"
  hair_description: "short light brown hair swept to the side"
  signature_clothing: "navy blue hoodie with WOLFTOWN text"
  accessories: []

FONDO (Cocina):
  prompt_snippet: "bright modern kitchen with white cabinets, warm wood countertops,
    white tiled backsplash, overhead fluorescent lighting"
  location_type: 'interior'
  time_of_day: 'morning'

CAMARA:
  camera_angle: 'wide' (dominante)
  camera_movement: 'static'
  lighting: 'Bright overhead fluorescent'
  mood: 'Slapstick chaos contained in silence'
```

### Prompt de imagen generado:

```
3D animated Pixar-style character, a young man with short light brown hair
swept to the side, slight stubble beard, blue eyes, wearing a navy blue hoodie
with "WOLFTOWN" text and a white kitchen apron worn backwards over the hoodie,
no sunglasses, no accessories. He stands in a bright modern kitchen holding a
mixing bowl with pink batter dripping over the edge. The kitchen counter is
covered in baking chaos: cracked eggs with yolks dripping off the edge, a
torn-open bag of flour with white powder spilled everywhere...
[continua con descripcion de la escena, iluminacion, composicion]
...Ultra detailed, Pixar 3D render, 16:9 cinematic aspect ratio.
```

**Nota como:**
- `prompt_snippet` del personaje se usa TAL CUAL
- `prompt_snippet` del fondo define el setting
- `proyecto.style` define el prefijo "3D animated Pixar-style"
- `video.platform` define "16:9 cinematic aspect ratio"
- `escena.description` define la accion
- `camara` define "Wide establishing shot"

---

## 9. RELACION ENTRE TABLAS (DIAGRAMA)

```
profiles (creative_*)
    │
    ▼
projects ──────────────────────────────────────┐
    │ style, ai_brief, global_prompt_rules     │
    │ color_palette, custom_style_description   │
    │                                           │
    ├─► project_ai_agents (tone, creativity)    │
    ├─► project_ai_settings (providers, limits) │
    ├─► style_presets (prefix, suffix, negative)│
    ├─► prompt_templates (plantillas)           │
    ├─► characters (prompt_snippet, visual...)  │
    └─► backgrounds (prompt_snippet, location...)│
         │                                      │
         ▼                                      │
    videos ◄────────────────────────────────────┘
    │ platform, video_type, description
    │ target_duration, aspect_ratio, style_preset_id
    │
    ├─► narrative_arcs (fases del arco)
    │
    ├─► scenes
    │    │ title, description, dialogue, director_notes
    │    │ duration_seconds, arc_phase, scene_type, status
    │    │
    │    ├─► scene_camera (1:1)
    │    │    angle, movement, lighting, mood, reasoning
    │    │
    │    ├─► scene_characters (N:M → characters)
    │    │    role_in_scene, sort_order
    │    │
    │    ├─► scene_backgrounds (N:M → backgrounds)
    │    │    angle override, time_of_day override
    │    │
    │    ├─► scene_prompts (1:N, versionados)
    │    │    ├─ type: image (key frame)
    │    │    ├─ type: video (clip segundo a segundo)
    │    │    ├─ type: narration (voiceover)
    │    │    └─ type: analysis (post-gen)
    │    │
    │    ├─► scene_video_clips (1:N, encadenados)
    │    │    ├─ clip base (prompt_image + prompt_video)
    │    │    └─ clip extension (parent_clip_id → base)
    │    │         last_frame_url → input del siguiente
    │    │
    │    └─► scene_media (1:N, resultados)
    │         imagenes/videos generados
    │
    └─► timeline_entries (segundo a segundo)
         scene_id?, start_time, end_time, description
         metadata: { camera_angle, audio, props, vfx }
```

---

*Documento de referencia para el Motor de Escenas de Kiyoko AI v1.0*
