# Supabase Schema (V6) — Resumen alineado al sistema

Este documento resume el **schema real** de tu base de datos para que la IA tenga una fuente de verdad.

Para columnas clave y “qué canon usar”, consulta:
- `DB/04_tablas_canónicas_y_usos.md`

## Categorías
1. Identidad / acceso
   - `profiles`
   - `organizations`
   - `organization_members`
2. Storyboard (core)
   - `projects`
   - `videos`
   - `scenes`
3. Recursos creativos
   - `characters`
   - `backgrounds`
   - `style_presets`
   - `prompt_templates`
4. Pipeline de prompts y outputs
   - `scene_prompts` (prompt versionado por `prompt_type`)
   - `scene_camera` (composición/cámara 1:1 con `scenes`)
   - `scene_characters` (junction)
   - `scene_backgrounds` (junction)
   - `scene_video_clips` (outputs/prompts para clips)
   - `scene_media` (media generado; incluye `media_type` como `image|video|audio`)
   - `video_narrations` (texto + audio)
   - `video_analysis` (diagnóstico)
5. IA / auditoría / seguridad operativa
   - `ai_conversations` (historial de conversaciones)
   - `entity_snapshots` (undo/versionado “seguro” a nivel entidad)
   - `activity_log` (eventos de sistema y acciones)
   - `ai_usage_logs` (telemetría de uso/errores/fallback)
   - `user_api_keys` (llaves por usuario)

## Reglas que deben respetar las capas de IA
1. **Todo “contexto creativo” debe resolverse desde BD** (proyectos, recursos, composición y estado actual).
2. **Todo output versionado debe persistirse en las tablas correctas**:
   - prompts en `scene_prompts`
   - cámara y composición en `scene_camera`, `scene_characters`, `scene_backgrounds`
   - media en `scene_media`
   - narración en `video_narrations`
   - analítica en `video_analysis`
3. **No asumir tablas “de docs antiguas”**: en tu DB actual **no existen** `video_cuts` ni `video_cut_scenes`.

## Checklist de “canónicas” (para evitar duplicación)
- Canon visual de una escena:
  - `scene_camera` + `scene_characters` + `scene_backgrounds`
- Canon de prompts de una escena:
  - `scene_prompts` con `prompt_type` + `is_current` + `status`
- Canon de media generado:
  - `scene_media` con `media_type` + `is_current` + `status`
- Canon de narración:
  - `video_narrations` con `is_current` + `status`
- Canon de evaluación:
  - `video_analysis` con `is_current` + `version`

