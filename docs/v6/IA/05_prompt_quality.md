# Calidad de prompts (V6) — cómo mejorar coherencia y rendimiento

Este documento define cómo V6 debería mejorar la calidad de salida de la IA usando tus tablas canónicas y un pipeline más “controlado”.

## 1) Lo que ya existe
1. El backend arma un `systemPrompt` por contexto (`src/lib/ai/system-prompt.ts`).
2. La BD ya tiene “material canon”:
   - `style_presets`
   - `characters.prompt_snippet` + `ai_prompt_description`
   - `backgrounds.prompt_snippet` + `ai_prompt_description`
   - composición de escena (`scene_camera`, `scene_characters`, `scene_backgrounds`)
3. Los prompts generados deben persistirse en `scene_prompts` con:
   - `prompt_type`
   - `is_current`
   - `version`

## 2) Qué suele estar mal cuando la calidad cae
1. El modelo inventa texto sin anclarse a:
   - snippet canon,
   - camera/mood del contexto,
   - o estilo del proyecto.
2. Se mezclan formatos legacy y nuevos (duplicación de parsing/render).
3. No hay “evaluación” post-generación, entonces iterar es adivinanza.

## 3) Pipeline recomendado V6 (simple pero efectivo)
1. Draft:
   - generar prompt(s) usando los campos canon de BD (snippets, estilo, cámara, asignaciones).
2. Evaluator:
   - un segundo paso (o el mismo modelo con rol de “auditor”) valida:
     - consistencia de personajes/fondo,
     - coherencia de iluminación/cámara,
     - ausencia de contradicciones con `arc_phase` y `duration_seconds`.
3. Corrector:
   - si falla, produce una versión corregida.
4. Persist:
   - escribir solo la versión aprobada como `is_current=true` y versionar.

## 4) Cómo medir (BD-driven)
1. Guardar métricas en `ai_usage_logs` (ya se hace best-effort desde chat y generate-image).
2. Tras cambios relevantes de escena/video, generar `video_analysis` con:
   - `overall_score`, `summary`, `strengths`, `weaknesses`, `suggestions`
3. Usar esas tablas para “próximo paso recomendado” y para:
   - comparativa entre versiones,
   - elección de prompts/generadores.

