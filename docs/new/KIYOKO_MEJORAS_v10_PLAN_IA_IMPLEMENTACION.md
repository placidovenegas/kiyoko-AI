# Kiyoko AI — Plan completo de mejora/repación/implementación de IA (v10)
Fecha: 2026-03-25

## 0) Qué es este proyecto (en 1 párrafo)
Kiyoko es una app de **gestión de storyboards** para producción audiovisual: proyectos → videos → escenas. Cada escena tiene descripción, cámara, personajes, fondos y prompts (imagen/video/narración). La IA actúa como “directora creativa” en un panel global: propone cambios como **planes de acción** (con confirmación) y el sistema los ejecuta en Supabase, versionando prompts y registrando actividad.

## 1) Schema real de Supabase (confirmado por MCP) — lo que existe y lo que NO
### 1.1 Tablas clave que existen (y debe dominar la IA)
- **Org/usuarios**: `profiles`, `organizations`, `organization_members`
- **Core storyboard**: `projects`, `videos`, `scenes`
- **Recursos**: `characters`, `backgrounds`, `style_presets`, `prompt_templates`
- **Prompts / generación**:
  - `scene_prompts` (prompt versionado por `prompt_type`)
  - `scene_camera` (1:1 con scene)
  - `scene_characters`, `scene_backgrounds` (junctions)
  - `scene_video_clips` (prompts + outputs de clips)
  - `scene_media` (media generado; incluye `media_type` enum: `image|video|audio`)
  - `video_narrations` (texto + audio)
  - `video_analysis` (diagnóstico)
- **IA / auditoría**: `ai_conversations`, `entity_snapshots`, `activity_log`, `ai_usage_logs`

### 1.2 Tablas “en docs v8” que NO existen en tu DB actual
Confirmado por SQL vía MCP: **NO existen** `video_cuts` ni `video_cut_scenes`.
- Implicación: cualquier plan de IA o UI que asuma “video cuts” debe **apagarse** o migrarse a tablas reales (ver sección 6.6).

## 2) Estado actual de la IA en el código (lo que ya funciona)
### 2.1 Chat principal
- Endpoint: `src/app/api/ai/chat/route.ts`
- Cliente principal: `src/components/kiyoko/KiyokoPanel.tsx` → `src/components/chat/KiyokoChat.tsx` + `src/hooks/useKiyokoChat.ts`
- Multimodal (imágenes): **ya existe**
  - El cliente sube imágenes a Storage (`chat-attachments`) y manda URLs incrustadas en el texto.
  - El backend detecta el marcador `[Imagenes adjuntas: ...]` y lo convierte a contenido multimodal para modelos con visión.

### 2.2 Action system (confirmación + ejecución)
- Front: `ActionPlanCard` + ejecución desde `useKiyokoChat.ts`
- Back: `/api/ai/execute-actions` + `src/lib/ai/action-executor.ts`
- Versionado de prompts: `scene_prompts` versionado vía INSERT + `is_current`.

### 2.3 Providers
En código hay dos “routers” conviviendo:
- **Nuevo (AI SDK)**: `src/lib/ai/sdk-router.ts` + `getUserModel()`
- **Viejo (adapters)**: `src/lib/ai/router.ts` (se usa al menos en `generate-image`)

## 3) Problemas/gaps que impiden “que la IA sea capaz de todo lo de docs”
### 3.1 Desalineación docs ↔ DB ↔ código
- Docs v8 hablan de `video_cuts`, pero DB actual no.
- Parte del código asume contextos y acciones que en DB deben mapear a `videos/scenes` directamente.

### 3.2 Duplicación/fragmentación del chat y del contrato de ActionPlan
- Tienes dos UIs de chat (`components/chat/*` en uso vs `components/ai-chat/*` no integrado).
- Parsers legacy duplicados conviven con el parser “v5 blocks”.
- Resultado: el modelo puede generar el plan “nuevo”, pero el frontend lo vuelve a convertir/interpretar a formatos legacy con pérdida de información.

### 3.3 Audio: falta input multimodal real
Tu DB **sí soporta audio** (`scene_media.media_type='audio'`, `video_narrations.audio_url/audio_path`), pero:
- El chat **no acepta** adjuntos de audio con transcripción y análisis.
- No existe pipeline de **speech-to-text** (STT) para convertir audio a texto y meterlo al prompt del chat.

### 3.4 Generación de prompts: falta “pipeline de calidad”
Ahora mismo el prompt “sale” del LLM con reglas, pero falta:
- validación automática (estructura, idioma, restricciones),
- scoring (composición/cámara/consistencia con personaje/fondo),
- variantes (A/B/C) consistentes,
- uso real de `prompt_templates` + `style_presets` en un sistema unificado.

## 4) Objetivos de IA (lo que implementaremos)
### 4.1 Capacidad total por contexto (según docs v5, adaptado al schema real)
- **Dashboard**: crear proyecto, navegar, explicar.
- **Project**: crear/editar video, crear/editar personajes/fondos, gestionar prompts templates y presets.
- **Video**: crear/editar/reordenar escenas, generar arcos (`narrative_arcs`), narración (`video_narrations`), análisis (`video_analysis`), prompts batch (`scene_prompts` / `scene_video_clips`).
- **Scene**: mejorar prompt imagen/video, cámara, asignar personajes/fondos, generar clip prompts, analizar media.

### 4.2 Multimodal completo
- **Imagen**: análisis + extracción de rasgos y coherencia con personaje/fondo.
- **Audio**: transcripción + “director notes” + extracción de timing + sugerencias de narración.

## 5) Plan de implementación (por EPICs)

## EPIC A — Unificar el contrato del chat (bloques v5) y eliminar legacy frágil
**Meta**: 1 solo contrato de salida del modelo y 1 sola forma de renderizarlo.

### A1) Definir “contrato oficial” de bloques (source of truth)
- Mantener el formato ya existente: `[ACTION_PLAN]...[/ACTION_PLAN]`, `[OPTIONS]`, `[SELECT:*]`, `[PROMPT_PREVIEW:*]`, `[DIFF:*]`, `[SCENE_PLAN]`, `[SUGGESTIONS]`.
- Fuente de verdad:
  - `src/lib/ai/system-prompt.ts` (instrucciones al modelo)
  - `src/lib/ai/parse-ai-message.ts` (parser)

### A2) Eliminar parsers duplicados y adapters implícitos
- En `src/hooks/useKiyokoChat.ts` y `src/components/chat/ChatMessage.tsx`:
  - reemplazar `parseActionPlan` / `parseSuggestions` legacy por `parseAiMessage` exclusivamente.
  - crear un adapter explícito si se necesita compat temporal:
    - `src/lib/ai/adapters/action-plan.ts` (nuevo)

### A3) Ejecutar planes “nuevo formato” de forma nativa
Actualmente el executor ya soporta un formato nuevo (`executeNewActionPlan`), pero el frontend lo alimenta mezclado.
- Objetivo: que el “ACTION_PLAN block” del chat sea **ActionPlan (nuevo)** de `src/types/ai-actions.ts` y se ejecute sin cast.

**Resultado**: menos bugs de parsing, mejores previews, ejecución consistente.

## EPIC B — Mejorar “prompt generation” (calidad + consistencia + plantillas)
**Meta**: que la IA genere prompts notablemente mejores y más consistentes con el proyecto.

### B1) Activar `prompt_templates` como sistema real (no tabla muerta)
DB existe (`prompt_templates`) pero está vacía.
- Crear UI mínima en proyecto (settings IA) para:
  - CRUD templates por `template_type` (`image|video|narration|analysis`)
  - variables soportadas (ej. `{character_snippet}`, `{background_snippet}`, `{camera}`, `{style_preset_prefix}`…)
- Backend: al generar prompts, cargar templates del proyecto y usarlos como “marco”.

### B2) Prompt pipeline en 2 pasos (generar → evaluar → corregir)
Para cada prompt importante (imagen y video):
1) **Draft**: generar prompt con estructura.
2) **Evaluator** (LLM barato/rápido): validar y devolver JSON con:
   - `issues[]` (idioma incorrecto, falta cámara, falta sujeto, inconsistencias, demasiado largo, etc.)
   - `score` (0-100)
   - `fixed_prompt` si score < umbral

Esto se puede implementar con `Output.object({ schema: zod })` para que sea robusto.

### B3) Variantes controladas (A/B/C) y selección por UI
En escena:
- generar 3 variantes con objetivos distintos:
  - “cinemático”, “comercial”, “natural”
- mostrar con `[OPTIONS]` y `[PROMPT_PREVIEW:image]`.

### B4) Coherencia con recursos (characters/backgrounds)
Reglas obligatorias al generar prompt:
- incluir `characters.prompt_snippet` / `ai_prompt_description` del personaje asignado.
- incluir `backgrounds.prompt_snippet` / `available_angles` + `time_of_day`.
- incluir cámara desde `scene_camera`.

### B5) Estilo y negativos (style_presets)
Ya tienes `style_presets` con `prompt_prefix/suffix/negative_prompt`.
- Unificar su uso para:
  - `scene_prompts` (image/video)
  - `scene_video_clips.prompt_image_first_frame` y `prompt_video`
  - generación de imágenes (`generate-image`)

## EPIC C — Multimodal: imágenes “de verdad” (mejor UX + mejor contexto)
**Meta**: que el chat “entienda” imágenes y produzca acciones útiles.

### C1) UX de adjuntos de imagen (chat)
Ya se pueden subir imágenes, pero falta:
- “modo análisis” en UI: cuando adjuntas imagen, el chat sugiera:
  - “Analizar esta imagen”
  - “Crear personaje desde esta imagen”
  - “Crear fondo desde esta imagen”
- persistencia en DB:
  - para personajes: guardar en `character_images`
  - para fondos: (si no existe tabla equivalente) guardar en `backgrounds.reference_image_url/path`

### C2) Endpoint dedicado de visión para chat
Aunque el chat ya soporta multimodal, conviene un endpoint para “visión estructurada”:
- `POST /api/ai/vision/analyze`
  - input: `{ imageUrls[], intent?: 'character'|'background'|'scene_reference' }`
  - output: JSON validado (Zod) con:
    - rasgos visuales,
    - estilo percibido,
    - prompt_snippet sugerido,
    - warnings (ej. “imagen con texto/artefactos”).

Usos:
- “crear personaje desde imagen” → prefill de `CharacterCreationCard`
- “crear fondo desde imagen” → prefill de background + `available_angles`
- “analizar frame de escena” → sugerir mejoras de prompt/cámara.

## EPIC D — Multimodal: audio (STT + análisis + acciones)
**Meta**: que el chat acepte audio, lo transcriba y lo use para dirigir escenas/narración.

### D1) Adjuntar audio en el chat (frontend)
- Extender `ChatInput` para aceptar `audio/*` (mp3, wav, m4a).
- Subir a Storage (nuevo bucket recomendado: `chat-audio` o reutilizar `chat-attachments` con prefijo).
- Mostrar un chip con:
  - duración (si se puede calcular en cliente),
  - botón “Transcribir” / “Analizar”.

### D2) Endpoint de transcripción (STT)
- `POST /api/ai/transcribe`
  - input: `{ audioUrl, language?: 'es'|'en', mode?: 'fast'|'accurate' }`
  - output: `{ text, segments?: [{start,end,text}], provider }`

Providers posibles (según keys):
- OpenAI (Whisper) si hay key del usuario/servidor.
- Gemini si ofrece STT en tu stack (si no, fallback a OpenAI).

### D3) Persistencia del audio (schema ya lo permite)
Guardar en:
- `scene_media` con `media_type='audio'` para audios por escena (ej. reference VO).
- o `video_narrations.audio_url/audio_path` si es narración final del video.

### D4) “Audio → acciones”
Flujos:
- Audio de cliente con feedback:
  - transcribir → extraer “issues” → proponer `[ACTION_PLAN]` (update_scene, update_prompt, update_camera…)
- Voiceover reference:
  - transcribir → generar `video_narrations.narration_text` coherente → sugerir voice/style.

## EPIC E — Providers/router unificado (evitar duplicación y mejorar eficacia)
**Meta**: una única fuente para selección de modelo, fallback, cooldown y logging.

### E1) Elegir router único
Recomendación: estandarizar en `src/lib/ai/sdk-router.ts` (AI SDK) y migrar endpoints que aún usan `src/lib/ai/router.ts`.

Acción concreta:
- `src/app/api/ai/generate-image/route.ts` hoy usa `getAvailableProvider` del router viejo.
  - Migrarlo a una estrategia consistente:
    - o mantener image-gen fuera del AI SDK pero con el mismo registry/cooldown,
    - o crear un “image-router” equivalente que respete `project_ai_settings.image_provider`.

### E2) Usar `project_ai_settings` (ya existe en DB) como configuración real
En DB existe:
- `project_ai_settings.image_provider`, `video_provider`, `tts_provider`, `vision_provider`, etc.

Plan:
- en `/api/ai/chat`: al resolver providers, priorizar según `project_ai_settings` del proyecto activo.
- en generación de imagen/clip/tts: usar siempre `project_ai_settings` para elegir proveedor/modelo.

### E3) Logging completo y consistente
Ya existe `ai_usage_logs`.
Mejoras:
- rellenar `was_fallback`, `original_provider`, `fallback_reason`
- medir `response_time_ms` real
- almacenar `task` estandarizado: `chat|vision|stt|prompt_gen|image_gen|video_gen|narration|analysis`

## EPIC F — UX/estética del chat (dimensiones, componentes, consistencia visual)
**Meta**: mejor estética + mejor usabilidad, sin duplicar implementaciones.

### F1) Consolidar a una sola UI de chat
Hoy el panel real usa `components/chat/*`.
`components/ai-chat/*` está sin integrar.

Dos caminos (elige uno para ejecutar el plan):
- **Camino 1 (menos riesgo)**: mantener `components/chat/*` y modernizarlo.
- **Camino 2 (más limpio)**: migrar panel a `components/ai-chat/*` y borrar legacy.

### F2) Dimensionado/Resize
Ya existe:
- sidebar resizable (`useAIStore.sidebarWidth`)
- floating con drag
- fullscreen automático en móvil

Mejoras:
- Snap points (320 / 420 / 520 / 600)
- Persistir tamaño/posición del modo floating por usuario
- Unificar estilos y espacings entre:
  - `ChatMessage` blocks (cards)
  - `ActionPlanCard` / `PreviewCard` / `PromptPreviewCard`
- Estado “streaming” consistente (evitar skeletons duplicados).

### F3) Aparición/render de componentes del chat (bloques)
Objetivo: que el mensaje se vea “editorial”, no como debug:
- separar claramente “texto” vs “bloques” con dividers suaves
- badges para provider/agent
- compactar `ActionPlanCard` cuando hay muchas acciones:
  - agrupar por escena/entidad
  - toggle “ver detalles”

## EPIC G — “Capaz de todo lo de docs” (alineación final)
**Meta**: que el comportamiento del agente coincida con `docs/v5/KIYOKO_SYSTEM.md`.

### G1) Mapear acciones a tablas reales (ya confirmadas)
Usar siempre:
- `scenes.video_id` (REQUIRED)
- `scene_prompts` versionado
- `scene_video_clips` para prompts de video
- `scene_media` para outputs (incluye audio)
- `video_narrations` versionado

### G2) Desactivar o reescribir docs/flows que asumen video_cuts
Como `video_cuts` no existe en DB:
- o implementas esas tablas (migración) y actualizas backend+UI
- o actualizas docs y mantienes modelo actual (videos múltiples por proyecto ya cubren parte del caso).

## 6) Checklist por fases (pragmático)
### Fase 1 — Reparación del contrato (P0)
- [ ] Unificar parse/render de bloques (sin legacy)
- [ ] Ejecutar ActionPlan nuevo sin casts
- [ ] Tests de `parseAiMessage`

### Fase 2 — Prompt pipeline (P1)
- [ ] UI + CRUD de `prompt_templates`
- [ ] Draft+Evaluator pipeline con Zod output
- [ ] Variantes A/B/C y selección

### Fase 3 — Audio (P1)
- [ ] Adjuntar audio en chat + upload
- [ ] `/api/ai/transcribe`
- [ ] Guardar en `scene_media` / `video_narrations`

### Fase 4 — Providers (P2)
- [ ] Migrar generate-image al router unificado
- [ ] Respetar `project_ai_settings` en chat y generación
- [ ] logging completo fallback/cost

### Fase 5 — UX/estética (P2)
- [ ] Consolidar a 1 UI de chat
- [ ] Mejoras de layout, snap points, badges, agrupación de planes

## 7) Archivos concretos a tocar (high-signal)
- Chat: `src/hooks/useKiyokoChat.ts`, `src/components/chat/ChatMessage.tsx`, `src/components/chat/ChatInput.tsx`, `src/components/kiyoko/KiyokoPanel.tsx`
- Parser/contrato: `src/lib/ai/parse-ai-message.ts`, `src/lib/ai/system-prompt.ts`, `src/types/ai-actions.ts`
- Providers: `src/lib/ai/sdk-router.ts`, `src/lib/ai/get-user-model.ts`, `src/app/api/ai/providers/status/route.ts`
- Multimodal: `src/app/api/ai/chat/route.ts` + nuevos endpoints `/api/ai/transcribe`, `/api/ai/vision/analyze`
- Prompts: `src/lib/ai/agents/prompt-generator.ts` + uso de `prompt_templates`/`style_presets`

## 8) Resultado esperado (DoD)
- IA ejecuta todos los flujos del doc v5 con tablas reales.
- Chat entiende imágenes (mejor UX) y **audio** (STT + acciones).
- Prompts: más consistentes, con plantillas + evaluación + variantes.
- Un solo router de providers y un solo contrato de UI blocks.

