# Asistente contextual V6 — desde dashboard hasta escenas

Este documento define el comportamiento “perfecto” de la IA cuando el usuario navega por la app (por página/ruta) y pide:
- ver proyectos/tareas,
- crear un video publicitario basado en una historia,
- analizar recursos (personajes/fondos),
- generar y reescribir prompts por escenas,
- y acortar/derivar un video a partir de otro manteniendo coherencia.

La IA debe operar como un orquestador que:
1. detecta el contexto actual (ruta + señal de UI),
2. propone un plan primero (timeline/escenas),
3. y sólo cuando el usuario confirma ejecuta mutaciones en BD mediante `[ACTION_PLAN]`.

> Regla V6: el contrato oficial usa los tags del parser (`parseAiMessage`) y los campos que renderizan en UI (`ScenePlanTimeline`, `SceneDetailCard`, etc.).  
> Los prompts técnicos para el generador van en inglés; la descripción/timeline para el usuario va en español.

---

## 1) Detección de contexto (dónde estamos en la app)

La IA debe inferir su modo con dos señales:
1. **Ruta** actual (ejemplos típicos):
   - `dashboard` → modo “gestión”
   - `project/[shortId]` → modo “proyecto”
   - `project/[shortId]/video/[videoShortId]` → modo “video”
   - `.../scene/[sceneShortId]` → modo “escena”
2. **Señal explícita UI** (metadatos) cuando cambias de sección (para datos extra y para evitar ambigüedad).

### 1.1 Modos y capacidades esperadas

Modo `dashboard` (gestión):
- listar proyectos relevantes del usuario (y/o de la organización activa),
- mostrar un resumen de estado (pendientes/qué se hizo hoy/qué tareas hay),
- ofrecer crear proyecto nuevo o abrir un proyecto existente.

Modo `project` (recursos + reglas):
- mostrar organización/proyecto actual,
- listar recursos del proyecto:
  - `characters`, `backgrounds`, `style_presets`,
- ayudar a generar o mejorar assets:
  - analizar recursos existentes,
  - sugerir prompts consistentes con el estilo del proyecto.

Modo `video` (storyboard + coherencia):
- cargar y mostrar el plan de escenas,
- analizar el video (o su storyboard) para detectar:
  - puntos fuertes,
  - puntos débiles,
  - coherencia de personajes y fondos,
- permitir:
  - cambiar una escena,
  - extender/recortar el plan,
  - generar una versión más corta coherente con una versión larga anterior.

Modo `scene` (edición granular):
- al pedir editar “cámara/ángulo” o “fondo/personaje”, la IA debe regenerar **solo** los prompts de esa escena y actualizar la ficha.

---

## 2) Contrato de salida para UI (qué debe incluir la IA)

### 2.1 Bloques soportados por el parser

La IA debe emitir únicamente tags compatibles con `parseAiMessage`, y en especial:
- `[ACTION_PLAN]...[/ACTION_PLAN]` cuando hay que mutar BD (con confirmación),
- `[SCENE_PLAN]...[/SCENE_PLAN]` para el plan de escenas,
- `[SCENE_DETAIL]...[/SCENE_DETAIL]` para tarjetas ricas de escena (incluye prompts),
- `[OPTIONS]...[/OPTIONS]` para preguntas con opciones,
- `[RESOURCE_LIST]...[/RESOURCE_LIST]` para recursos,
- `[VIDEO_SUMMARY]...[/VIDEO_SUMMARY]` para resumen de video.

### 2.2 Separación lingüística obligatoria

Para cada escena/segmento:
- `prompt_image` y `prompt_video` en **inglés** (listo para el motor de generación),
- `description`, `title` y/o notas visibles en **español** (para que el cliente entienda el timeline).

### 2.3 `[SCENE_PLAN]` — formato mínimo para Timeline

`ScenePlanTimeline` renderiza exactamente este tipo:
- `scene_number: number` (único y ordenable),
- `title: string` (puede incluir `6A`, `6B`, `6-T` o un rango),
- `duration: number` (segundos),
- `arc_phase: 'hook' | 'build' | 'peak' | 'close' | string`,
- `description: string` (resumen breve del tramo).

> Importante: aunque tu “lógica” sea `6A/6B/6-T`, `ScenePlanTimeline` no tiene campos extra; el detalle “timeline 0–0.5 / 0.5–1” debe reflejarse en `title`/`description` y en el listado de escenas por duración.

### 2.4 `[SCENE_DETAIL]` — para mostrar al cliente y editar

`SceneDetailCard` soporta:
- `scene_number`, `title`, `description`, `duration_seconds`, `arc_phase`,
- `characters[]`, `background{}`, `camera{...}`,
- `prompt_image`, `prompt_video`,
- `director_notes`.

Regla de persistencia V6:
- `prompt_image` y `prompt_video` deben existir para que el usuario pueda regenerar o corregir,
- y cuando se cambie el ángulo/cámara, se debe reescribir el prompt de esa escena.

---

## 3) Modelo de timeline “6A/6B/6-T” como storyboard editable

Tu requisito: la IA describe un timeline continuo (por rangos de segundos), pero el usuario puede editar segmentos por separado.

### 3.1 Representación recomendada con el esquema actual

La BD canónica actual modela la continuidad del video con una tabla:
- `scenes` con `duration_seconds` y orden,
- y una cámara 1:1 por escena en `scene_camera`.

Por tanto, para que “cambiar el ángulo en un tramo reescriba ese prompt” sea perfecto:
- cada tramo temporal que tenga un cambio de cámara relevante se modela como una **escena** independiente (cada escena tiene su propia `scene_camera` y su propio `scene_prompts`).

Luego, el “grupo” lógico `6A`/`6B`/`6-T` se representa con metadatos, sin depender de nuevas columnas (se usa `scenes.metadata`):
- `metadata.timeline = { group: 6, segment: 'A' | 'B' | 'T', name_group: string, orderGroup: number, range: { startSec, endSec }, segment_base: '6A' ... }`

### 3.2 Cómo se verán al cliente

En el cliente (UI):
- `title` incluirá la etiqueta y el rango (ej. `6A — 0–3s`, `6A — 3–5s`, `6-T — 5–6s`),
- `description` explicará “qué pasa” en ese rango (en español),
- los prompts técnicos irán en `prompt_video`/`prompt_image` (en inglés).

### 3.3 Reglas de coherencia

Personajes/campos:
- si cambian personajes o fondos por completo → la IA debe crear escenas distintas (aunque pertenezcan al mismo grupo lógico),
- si sólo cambia la cámara/encuadre → la IA crea otra escena independiente dentro del mismo grupo para que:
  - al editar la cámara, se reescriba sólo ese prompt.

---

## 4) Generación de storyboard con “pensar primero”

Con tu política V6:
- si faltan datos críticos, la IA pregunta con `[OPTIONS]`,
- si no faltan, usa defaults coherentes con el proyecto.

### 4.1 Defaults sugeridos (cuando no estén)

Si el usuario no especifica:
- duración total del video → usar:
  - `video_base_duration_seconds` del proyecto (si existe) o defaults del UI,
- estilo:
  - `projects.style` y `style_presets` del proyecto,
- cámara:
  - seleccionar un set de cámaras consistente por estilo (`camera_angle`, `camera_movement`),
- duración por escena:
  - sugerir escenas de `3s` o `6s` según el tipo `ad/short`,
  - evitar “escenas infinitas” (gran número de slices).

### 4.2 Contrato de “tiempo aconsejado”

Tu punto clave:
- el generador puede producir clips largos (ej. ~10s),
- pero el storyboard debe tener duración sugerida “visible” para el cliente (ej. 3s por escena).

Por lo tanto, la IA debe:
- persistir `scenes.duration_seconds` como la duración del timeline,
- y en `prompt_video` indicar la duración objetivo del tramo.

En producción, el recorte se hará en el ensamblado externo.

---

## 5) Prompts: estructura técnica (para motor) vs storyboard (para cliente)

### 5.1 Plantilla de prompt técnico (imagen/video) en inglés

La IA debe construir un prompt con:
- descripción cinematográfica precisa del encuadre,
- consistencia visual:
  - misma paleta/ropa/cabello por personaje (usando canon de `characters`),
  - misma iluminación/mood por fondo (`backgrounds`),
- reglas de continuidad:
  - mismos personajes en posiciones consistentes,
  - sin cambios de ropa/rasgos salvo que el usuario lo pida.

Además debe incluir:
- `Camera`: tipo de plano (`camera_angle`) + movimiento (`camera_movement`) + notas (lighting/mood),
- `TimeSlice`: rango temporal (segundos) dentro del storyboard,
- `DurationTargetSeconds`: segundos objetivo del tramo.

### 5.2 Plantilla de “timeline visible” en español

Para que el usuario entienda rápido, la IA debe describir:
- “Segundo X–Y: …”
- “Audio: …” (sólo SFX / ambiente o texto de diálogo según tu preferencia)
- y decisiones de cámara:
  - plano medio → acercamiento a manos → plano detalle, etc.

Ejemplo de contenido esperado (conceptual):
- “Segundo 0–0.5 | Plano medio…”
- “Segundo 0.5–1 | Smash cut a salón…”
- “Audio: silencio / pájaros / piano suave…”

---

## 6) Edición granular perfecta (reescritura de prompts)

### 6.1 Qué debe pasar si el usuario cambia cámara

Cuando el usuario edita la cámara/ángulo de una escena:
1. guardar snapshot (undo) antes de mutar (regla V6),
2. regenerar:
   - `scene_camera` (si cambió ángulo/movement/lights),
   - `scene_prompts` para ese `scene_id` (prompt imagen/video),
3. actualizar `scene_prompts.is_current=true` y versionado.

La IA debe hacer esto como operación confirmada con `[ACTION_PLAN]`.

### 6.2 Qué debe pasar si cambia fondo/personaje

Cuando cambia relación de `scene_characters` o `scene_backgrounds`:
- se reescribe `prompt_image` y `prompt_video` de esa escena,
- si el cambio implica aparición de dos personajes en fondos diferentes → deben nacer escenas nuevas (no “aplastar” dos fondos en una misma escena).

---

## 7) Análisis y “derivar más corto” desde otro video

Tu requisito:
- “tomar el último/otro video y pedir una versión más corta”,
- la IA debe analizar escenas y decidir qué conservar.

Pipeline V6 recomendado:
1. `POST /api/ai/analyze-video` del video fuente:
   - persistir `video_analysis` (strengths/weaknesses/suggestions),
2. crear un “nuevo plan” con `[SCENE_PLAN]` usando:
   - coherencia de personajes y fondos del proyecto,
   - sugerencias de strengths,
3. derivar persistiendo (opcional):
   - `POST /api/ai/derive-video` con `x-execute-plan: true` si quieres que cree:
     - `videos` + `scenes` copiadas/ajustadas.

---

## 8) Multimodal: imagen real del usuario y fallback cuando no hay visión integrada

Tu requisito:
- si no hay API de visión integrada o no puede analizar aquí,
- decirle al usuario que analice fuera en una página y usar prompts listos.

### 8.1 Cuando sí hay visión integrada (pipeline real)

Hoy el backend soporta imágenes como entrada:
- `src/app/api/ai/chat/route.ts` detecta el marcador `"[Imagenes adjuntas: ...]"`,
- convierte URLs a contenido multimodal para el SDK,
- y la IA puede devolver prompts basados en análisis visual.

El flujo debe ser:
1. usuario sube imagen,
2. IA responde con `[OPTIONS]` para elegir “qué hacer con esa imagen”:
   - analizar personaje,
   - analizar fondo/iluminación,
   - extraer estilo/paleta,
   - o generar prompt de referencia.

### 8.2 Cuando NO hay visión integrada (fallback obligado)

Cuando la app detecte que no puede analizar la imagen (sin visión provider / keys / o error):
1. IA debe decir explícitamente:
   - “No puedo analizar la imagen aquí porque no hay visión integrada/configurada en este modo.”
2. IA debe recomendar análisis externo con prompts listos para copiar/pegar en:
   - [Gemini](https://gemini.google.com/app)
3. IA debe pedir al usuario que pegue aquí el resultado:
   - “pega el análisis que obtengas fuera (personaje/fondo/estilo).”

Luego la IA genera internamente:
- `characters`/`backgrounds` (si aplica, mediante confirmación),
- y `prompt_image`/`prompt_video` listos para escenas.

### 8.3 Prompts listos para copiar/pegar en Gemini (plantillas)

La IA debe proporcionar 3 plantillas (según tipo de imagen).

Plantilla A: personaje (reference sheet)
- Instrucción:
  - “Analiza la persona de la foto y devuelve una ficha con cabello/ojos/ropa/sombras/estilo con precisión.”
- Output requerido (estructura):
  - `persona`: edad aparente, rasgos clave, expresión
  - `cabello`: color, largo, peinado
  - `rostro`: ojos, barba/rasgos, piel
  - `ropa`: prenda exacta + color + detalles visibles
  - `estilo`: 3D Pixar / anime / realista (elige el que mejor encaje al usuario si no indica)
  - `paleta`: 5 colores aproximados (hex opcional)
  - `iluminacion`: suave/dura, dirección, temperatura de color

Plantilla B: fondo (ambiente)
- Instrucción:
  - “Analiza el fondo: habitación, objetos principales, hora del día, iluminación y estilo visual.”
- Output requerido:
  - `lugar`: descripción resumida
  - `objetos`: 5–10 elementos visibles clave
  - `hora_del_dia`: mañana/tarde/noche
  - `iluminacion`: warm/cool, intensidad, sombras
  - `composicion`: ángulos sugeridos para cámara

Plantilla C: estilo cinematográfico
- Instrucción:
  - “A partir del personaje + fondo, crea un prompt técnico en inglés para video animado 3D con consistencia de cámara.”
- Output requerido:
  - `prompt_video_en`: prompt técnico en inglés listo para el generador
  - `camera_notes_en`: tipo de plano + movimiento + iluminación
  - `negative_prompt_en`: opcional

---

## 9) Qué debe preguntar la IA cuando el usuario busca “video con coherencia”

Para minimizar peticiones y evitar repetir prompts, la IA debe usar la lógica “pregunta sólo cuando sea crítico”.

Antes de generar el plan (timeline):
1. si no hay proyecto activo: preguntar cuál proyecto usar,
2. pedir el objetivo del video (ad, story, reels, etc.),
3. pedir duración objetivo:
   - si el usuario no la da, sugerir 10s/20s y preguntar confirmación si necesita recorte,
4. pedir recursos:
   - “¿Usamos personajes/fondos existentes del proyecto o creamos nuevos?”

Cuando falte un recurso clave:
- preguntar con `[OPTIONS]` y no ejecutar nada hasta confirmación.

---

## 10) Resumen operativo (reglas de oro para que “todo sea perfecto”)

1. Prompt técnico en inglés, timeline/explicación visible en español.
2. Cada cambio temporal relevante (especialmente cámara) se modela como una escena independiente para reescribir prompts sin afectar otras.
3. `6A/6B/6-T` es un concepto de “grupo lógico” que vive en `scenes.metadata.timeline` y se refleja en `title`/`description`.
4. Editar cámara → regenerar prompts sólo de esa escena, usando `[ACTION_PLAN]` + undo.
5. Si no hay visión integrada: “no puedo aquí” + [Gemini](https://gemini.google.com/app) + prompts listos para copiar/pegar + pegar análisis y continuar.

