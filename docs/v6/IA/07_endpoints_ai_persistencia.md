# Endpoints AI (V6) — qué hace cada uno y dónde persiste

Este documento lista los endpoints reales en `src/app/api/ai/**/route.ts` y especifica:
- si el endpoint solo devuelve datos o también persiste en BD,
- qué tabla canónica toca cuando persiste,
- y notas de contrato (streaming / multimodal / versiones).

> Regla V6: si el endpoint persiste en BD, debe escribir usando la tabla canónica correspondiente (ver `DB/04_tablas_canónicas_y_usos.md`).

## 1) Chat (contrato de bloques + streaming)
### `POST /api/ai/chat` (archivo: `src/app/api/ai/chat/route.ts`)
Persistencia:
- **BD**: guarda métricas en `ai_usage_logs` (best-effort en `onFinish`).
- **No** muta storyboard directamente desde el endpoint; cuando hay cambios, el mutador real es el executor tras confirmación.
- **Frontend**: la conversación se persiste en `ai_conversations` vía `saveConversation(...)` dentro de `src/hooks/useKiyokoChat.ts`.

Contrato:
- salida en streaming `text/plain` con header `X-Vercel-AI-Data-Stream: v1`
- tags/tags-blocs tipo `[ACTION_PLAN]...[/ACTION_PLAN]`, `[OPTIONS]`, `[SCENE_PLAN]`, etc.

Multimodal:
- imágenes (entrada): detecta `"[Imagenes adjuntas: ...]"` y convierte a contenido multimodal para el SDK.
- audio (entrada): **no** está soportado en el pipeline de chat hoy.

## 2) Ejecución de planes (mutaciones en BD)
### `POST /api/ai/execute-actions` (archivo: `src/app/api/ai/execute-actions/route.ts`)
Persistencia:
- ejecuta el plan con `executeActionPlan(...)` (legacy) en `src/lib/ai/action-executor.ts`.
- escribe/actualiza:
  - `scenes`, `scene_camera`, `scene_prompts`,
  - `characters`, `scene_characters`,
  - `backgrounds`, `scene_backgrounds`,
  - `videos`, `projects`,
  - y snapshots en `entity_snapshots` (antes de mutar).
- además:
  - inserta en `realtime_updates` (para que UI se refresque),
  - inserta en `activity_log`.

Nota V6:
- conviven planes legacy (`AiActionPlan`) y un executor “nuevo” (`executeNewActionPlan`).
- el endpoint de execute-actions actual usa legacy (`AiActionPlan`).

## 3) Visión / análisis de assets
### `POST /api/ai/analyze-image` (archivo: `src/app/api/ai/analyze-image/route.ts`)
Persistencia:
- `characters`:
  - `ai_visual_analysis` (Json)
  - `ai_prompt_description`
- `backgrounds`:
  - `ai_visual_analysis` (Json)
  - `ai_prompt_description`
- telemetría:
  - `ai_usage_logs` vía `logUsage(...)`.

### `POST /api/ai/analyze-video` (archivo: `src/app/api/ai/analyze-video/route.ts`)
Persistencia:
- `video_analysis`:
  - marca anterior `is_current=false`
  - inserta nueva con:
    - `version`, `is_current=true`, `status='ready'`
    - `strengths`, `weaknesses`, `suggestions`, `overall_score`, `summary`
- telemetría (en el código revisado): se usa el modelo configurado por usuario (vía `getUserModel`) y se guarda `analysis_model`.

### `POST /api/ai/analyze-project` (archivo: `src/app/api/ai/analyze-project/route.ts`)
Estado:
- **deprecated**.
- redirige / reenvía a `analyze-video`.

## 4) Generación de prompts creativos (devuelve datos)
### `POST /api/ai/improve-prompt` (archivo: `src/app/api/ai/improve-prompt/route.ts`)
Persistencia:
- **No** persiste en BD.
- devuelve:
  - `improved_prompt`
  - `improvements[]`

### `POST /api/ai/generate-project` (archivo: `src/app/api/ai/generate-project/route.ts`)
Persistencia:
- **No** persiste en BD.
- devuelve data del proyecto con schema (vía `projectOutputSchema`).
- telemetría:
  - `logUsage(...)`.

### `POST /api/ai/generate-scenes` (archivo: `src/app/api/ai/generate-scenes/route.ts`)
Persistencia:
- **No** persiste en BD.
- devuelve un objeto “scene” siguiendo `sceneOutputSchema`.

### `POST /api/ai/generate-characters` (archivo: `src/app/api/ai/generate-characters/route.ts`)
Persistencia:
- **No** persiste en BD.
- devuelve:
  - `characters[]` (según schema)
- telemetría:
  - `logUsage(...)`.

### `POST /api/ai/generate-arc` (archivo: `src/app/api/ai/generate-arc/route.ts`)
Persistencia:
- **No** persiste en BD.
- devuelve:
  - `phases[]`, `overall_theme`, `emotional_journey`.
- telemetría:
  - `logUsage(...)`.

### `POST /api/ai/generate-timeline` (archivo: `src/app/api/ai/generate-timeline/route.ts`)
Persistencia:
- **No** persiste en BD.
- devuelve:
  - timeline completo según `timelineOutputSchema`.
- telemetría:
  - `logUsage(...)`.

## 5) Generación de media (persisten si se pasan IDs)
### `POST /api/ai/generate-image` (archivo: `src/app/api/ai/generate-image/route.ts`)
Persistencia (condicional):
1. Si `sceneId` **y** `projectId` vienen:
   - Storage upload en `kiyoko-storage`
   - `scene_media`:
     - set anterior `is_current=false` para `media_type='image'`
     - inserta nuevo:
       - `file_url`, `file_path`, `prompt_used`, `generator`, `version`, `is_current=true`, `status='ready'`
2. Si no se pasan IDs:
   - devuelve URL pero no registra en BD.

Telemetría:
 - `logUsage(...)`.

### `POST /api/ai/generate-voice` (archivo: `src/app/api/ai/generate-voice/route.ts`)
Persistencia (condicional):
- siempre genera audio (o con fallback).
- si `videoId` **y** `projectId` vienen:
  - Storage upload (mp3)
  - `video_narrations`:
    - actualiza el registro actual (`.eq('is_current', true)`)
    - guarda `audio_url`, `audio_path`, `audio_duration_ms`
    - guarda `voice_id`, `voice_name`, `provider`

Telemetría:
- en el código revisado, la persistencia se hace directamente; el endpoint no usa `ai_usage_logs` (no aparece en el extract).

## 6) Narración (texto + versionado)
### `POST /api/ai/generate-narration` (archivo: `src/app/api/ai/generate-narration/route.ts`)
Persistencia:
- si `videoId` se proporciona:
  - `video_narrations`:
    - marca anterior `is_current=false` (para este `video_id`)
    - inserta nueva versión con:
      - `narration_text`, `source='ai'`, `version`, `is_current=true`, `status='draft'`

Nota:
- el endpoint soporta `mode: continuous | per_scene`.

## 7) Derivación de video (plan + ejecución opcional)
### `POST /api/ai/derive-video` (archivo: `src/app/api/ai/derive-video/route.ts`)
Persistencia:
- por defecto: **no ejecuta**, solo devuelve `plan`.
- si el header `x-execute-plan: true`:
  - inserta:
    - `videos` (nuevo video derivado)
    - `video_derivations` (relación fuente→derivación)
    - `scenes` (copiando/ajustando escenas seleccionadas)

## 8) Extensiones / clips
### `POST /api/ai/generate-extensions` (archivo: `src/app/api/ai/generate-extensions/route.ts`)
Persistencia:
- `scene_video_clips`:
  - inserta un nuevo clip:
    - `clip_type='extension'`
    - `status='pending'`
    - `version`, `is_current=true`
    - `prompt_video` + `prompt_image_first_frame` (si existe last frame)
- telemetría:
  - `logUsage(...)`.

## 9) Providers / utilities
### `GET /api/ai/providers/status` (archivo: `src/app/api/ai/providers/status/route.ts`)
Persistencia:
- **No** persiste.
- calcula disponibilidad con:
  - env keys (model registry)
  - y `user_api_keys` del usuario (para marcar `hasUserKey`).

### `GET /api/ai/voices` (archivo: `src/app/api/ai/voices/route.ts`)
Persistencia:
- **No** persiste.
- cache in-memory (TTL 1h).

