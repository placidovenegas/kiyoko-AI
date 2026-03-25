# Tablas canónicas V6 — BD como fuente de verdad

Este documento convierte el “resumen” en una guía operativa:
- qué tabla es canon para cada tipo de dato,
- qué columnas clave existen (según `src/types/database.types.ts`),
- y para qué se usan dentro del pipeline IA ↔ UI.

## 0) Enums canónicas (imprescindible)
- `prompt_type`: `image | video | narration | analysis`
- `media_type`: `image | video | audio`
- `scene_status`: `draft | prompt_ready | generating | generated | approved | rejected`
- `video_status`: `draft | prompting | ...` (ver enum completo en `database.types.ts`)
- `arc_phase`: `hook | build | peak | close`
- `camera_angle`, `camera_movement`, etc. (ver `database.types.ts`)

## 1) Identidad / acceso
### `ai_conversations` (historial de chat)
Columna clave (Row):
- `id` (string/UUID)
- `user_id`
- `project_id`
- `video_id` (nullable)
- `title`
- `messages` (Json; el transcript completo)
- `message_count`
- `context_entity_id`, `context_entity_type` (nullable)
- `affected_scene_ids` (string[] | null)
- `conversation_type`
- `completed` (boolean | null)

Uso V6:
- el chat NO debe auto-restaurar mensajes al entrar a una página,
- pero sí guardar conversaciones al ejecutar planes (`saveConversation`).

### `entity_snapshots` (undo/seguridad operativa)
Columnas clave:
- `entity_type`, `entity_id`
- `project_id`, `user_id`
- `conversation_id` (nullable)
- `action_type`
- `snapshot_data` (Json)
- `restored`, `restored_at`, `restored_by`

Uso V6:
- antes de mutar (legacy executor), se guarda snapshot,
- el undo se hace “seguro” restaurando snapshots (en general).

## 2) Contexto creativo
### `projects` (canon del estilo y reglas globales)
Columnas clave (Row):
- `id`
- `title`, `description`, `ai_brief`
- `style`, `status`
- `color_palette` (Json | null)
- `global_prompt_rules` (string | null)
- `tags` (string[] | null)
- `owner_id`, `organization_id` (acceso)

Uso V6:
- system prompt del backend integra:
  - `ai_brief` como narrativa base,
  - `global_prompt_rules` como reglas permanentes,
  - `style`/paleta como anclaje visual.

### `project_ai_agents` (personalidad del asistente por proyecto)
Columnas clave:
- `project_id`
- `is_default`
- `system_prompt`
- `tone`, `creativity_level`
- `language`
- `video_style_context`

Uso V6:
- el backend agrega instrucciones del agente como capa adicional (no reemplaza el prompt base).

### `project_ai_settings` (config técnica por proyecto)
Columnas clave:
- `image_provider`, `image_provider_config`
- `video_provider`, `video_provider_config`
- `tts_provider`, `tts_provider_config`
- `vision_provider`, `vision_model`
- `video_base_duration_seconds`, `video_alt_duration_seconds`, `video_extension_duration_seconds`
- `video_supports_extension`

Uso V6:
- punto único recomendado de configuración por modalidad (la “orquestación técnica”).

## 3) Recursos creativos (personajes, fondos, presets)
### `characters`
Columnas clave:
- `name`, `role`
- `description`, `visual_description`
- `prompt_snippet`, `ai_prompt_description`
- `hair_description`, `signature_clothing`, `signature_tools`
- `personality`
- `rules` (Json)
- `reference_image_url`

Uso V6:
- al construir prompts, se incorpora `prompt_snippet` / `ai_prompt_description` como canon.

### `backgrounds`
Columnas clave:
- `name`, `code`
- `description`
- `location_type`, `time_of_day`
- `prompt_snippet`, `ai_prompt_description`
- `available_angles` (string[] | null)
- `reference_image_url`

Uso V6:
- condiciona iluminación/mood/cámara y reduce inventos del modelo.

### `style_presets`
Columnas clave:
- `name`, `style_type`
- `prompt_prefix`, `prompt_suffix`
- `negative_prompt`
- `generator`, `generator_config`
- `reference_image_url`

Uso V6:
- canaliza consistencia visual en imagen/video prompts.

### `prompt_templates`
Columnas clave:
- `template_type` (prompt_type enum)
- `template_text`
- `variables` (string[] | null)
- `is_default`, `sort_order`

Uso V6:
- base para construir prompts con variables controladas.

## 4) Escena (canon visual + prompts versionados)
### `scenes`
Columnas clave:
- `id`
- `project_id`, `video_id`
- `scene_number`, `scene_type`, `title`, `description`
- `arc_phase`
- `duration_seconds`
- `sort_order`, `status`
- `director_notes`, `dialogue`

Uso V6:
- delimita duración, arco y estado; alimenta evaluator/calidad.

### Canon visual de escena (composición)
1) `scene_camera` (1:1 con `scenes`)
   - `scene_id`
   - `camera_angle`, `camera_movement`
   - `lighting`, `mood`
   - `camera_notes`, `ai_reasoning`

2) `scene_characters` (junction)
   - `scene_id`, `character_id`
   - `role_in_scene`
   - `sort_order`

3) `scene_backgrounds` (junction)
   - `scene_id`, `background_id`
   - `is_primary`
   - `angle`
   - `time_of_day`

Uso V6:
- el prompt generator debe tomar estos datos como “verdad de composición”.

### Canon de prompts
`scene_prompts` (versionado por prompt_type)
Columnas clave:
- `scene_id`
- `prompt_type`
- `prompt_text`
- `generation_config` (Json | null)
- `generator`
- `result_url` (nullable)
- `is_current`
- `version`
- `status`

Uso V6:
- persistencia obligatoria de prompts generados.

### Canon de media generado
`scene_media`
Columnas clave:
- `scene_id`
- `media_type`
- `file_url`, `file_path`
- `thumbnail_url`
- `prompt_used`
- `generation_config`, `generator`
- `status`, `is_current`, `version`
- `metadata` (Json | null)

Uso V6:
- reproduce resultados y permite auditoría/versionado.

## 5) Video (narración + análisis)
### `video_narrations`
Columnas clave:
- `video_id`
- `narration_text`
- `provider`, `source`
- `voice_id`, `voice_name`
- `speed`, `style`
- `audio_url`, `audio_path`
- `audio_duration_ms`
- `status`, `is_current`, `version`

Uso V6:
- salida final de narración + audio (y su versionado disciplinado).

### `video_analysis`
Columnas clave:
- `video_id`
- `overall_score`
- `summary`
- `strengths`, `weaknesses`, `suggestions` (Json | null)
- `analysis_model`
- `status`, `is_current`, `version`

Uso V6:
- bucle de calidad: auditoría y comparativa entre versiones.

## 6) Telemetría (para elegir modelos con evidencia)
### `ai_usage_logs`
Columnas clave:
- `user_id`, `project_id` (nullable)
- `provider`, `model`
- `task` (string; p.ej. `chat`, `generate-image`, etc.)
- `input_tokens`, `output_tokens`, `total_tokens`
- `estimated_cost_usd`
- `response_time_ms`
- `success`, `was_fallback`
- `fallback_reason`, `original_provider`, `error_message`

Uso V6:
- ranking real de proveedores/modelos por task y contexto.

