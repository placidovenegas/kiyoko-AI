# Kiyoko AI — Auditoría Completa del Sistema de IA

> Estado actual, qué funciona, qué falta, qué hay que mejorar y plan de acción.

---

## 1. Arquitectura General de IA

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│  Chat IA │ Generar escenas │ Narración │ Análisis │ Imágenes    │
└────┬─────┴────────┬────────┴─────┬─────┴────┬─────┴──────┬─────┘
     │              │              │          │            │
     ▼              ▼              ▼          ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTES (Next.js)                           │
│  /api/ai/chat     /api/ai/generate-scenes    /api/ai/voices     │
│  /api/ai/generate-narration  /api/ai/analyze-project            │
│  /api/ai/generate-voice      /api/ai/generate-image             │
│  /api/ai/improve-prompt      /api/ai/generate-characters        │
│  /api/ai/generate-arc        /api/ai/generate-timeline          │
│  /api/ai/generate-project    /api/ai/providers/status           │
└────┬────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SDK ROUTER (src/lib/ai/sdk-router.ts)         │
│                                                                   │
│  Cadena de fallback inteligente:                                 │
│  Groq → Mistral → Gemini → Cerebras → Grok → DeepSeek          │
│       → Claude → OpenAI                                          │
│                                                                   │
│  Features: cooldown tracking, API key del usuario, usage logs    │
└────┬────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROVEEDORES (8 configurados)                   │
│                                                                   │
│  GRATIS:                          PREMIUM:                       │
│  ✅ Groq (LLaMA 3.3 70B)         ✅ Claude (Sonnet 4)           │
│  ✅ Mistral (Large)               ✅ OpenAI (GPT-4o Mini)       │
│  ✅ Gemini (2.0 Flash)                                           │
│  ✅ Cerebras (LLaMA 8B)          IMAGEN:                         │
│  ✅ Grok (xAI 3-Fast)            ✅ OpenAI (DALL-E 3)           │
│  ✅ DeepSeek (V3)                ✅ Gemini (Imagen 3)            │
│                                   ✅ Stability AI                │
│                                                                   │
│  TTS:                                                            │
│  ✅ ElevenLabs (10K chars gratis) │ Fallback: Google Cloud TTS  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estado de Cada Funcionalidad de IA

### 2.1 Chat IA (Kiyoko) — `/api/ai/chat`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Streaming de respuestas | ✅ Funciona | SSE con Vercel AI SDK |
| Contexto del proyecto | ✅ Funciona | Carga scenes, characters, backgrounds, arcs |
| Contexto del vídeo | ⚠️ Parcial | Carga datos pero no filtra por vídeo activo |
| Acciones (crear/editar escenas) | ✅ Funciona | Action executor con tools |
| Rollback de cambios | ✅ Funciona | Via `change_history` + `undoBatch()` |
| Historial de conversaciones | ⚠️ Parcial | Se guarda en `ai_conversations` pero no se carga bien al recargar |
| API keys del usuario | ✅ Funciona | Lee keys encriptadas de `user_api_keys` |
| Plan de acción visual | ✅ Funciona | ActionPlanCard muestra acciones antes de ejecutar |

**Tablas que LEE:** `projects`, `scenes`, `characters`, `backgrounds`, `narrative_arcs`, `timeline_entries`
**Tablas que ESCRIBE:** `scenes`, `characters`, `backgrounds`, `change_history`, `ai_usage_logs`, `ai_conversations`

**Qué falta:**
- Filtrar contexto por `video_id` (ahora carga TODAS las escenas del proyecto)
- Usar `entity_snapshots` en vez de `change_history` para rollback (v4)
- Pasar `project_ai_agents.system_prompt` como system prompt en vez del hardcoded
- Integrar `scene_camera`, `scene_video_clips`, `scene_prompts` en el contexto

---

### 2.2 Generación de Escenas — `/api/ai/generate-scenes`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Generar escenas desde instrucción | ✅ Funciona | Schema Zod validado |
| Contexto de escenas existentes | ✅ Funciona | Carga escenas previas |
| Output estructurado | ✅ Funciona | Zod schema con 15+ campos |
| Guardar en DB | ❌ No hace | Solo devuelve JSON — el cliente debe insertar |

**Tablas que LEE:** `scenes`, `characters`, `backgrounds`
**Tablas que ESCRIBE:** Ninguna (debería escribir en `scenes`, `scene_camera`, `scene_prompts`)

**Qué falta:**
- Insertar escenas directamente en la DB con `video_id`
- Crear registros en `scene_camera` con los datos de cámara generados
- Crear registros en `scene_prompts` con los prompts generados
- Generar `short_id` (nanoid 12) para cada escena nueva
- Guardar snapshots en `entity_snapshots` para rollback

---

### 2.3 Generación de Narración — `/api/ai/generate-narration`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Generar texto narración | ✅ Funciona | 2 modos: per_scene, continuous |
| 8 estilos de narración | ✅ Funciona | Pixar, Documentary, Epic, ASMR, etc. |
| Limpieza de texto | ✅ Funciona | Strips JSON, markdown, prefixes |
| Guardar en DB | ❌ No hace | Solo devuelve texto |

**Tablas que LEE:** Ninguna (recibe datos como parámetro)
**Tablas que DEBERÍA ESCRIBIR:** `video_narrations`

**Qué falta:**
- Guardar texto generado en `video_narrations` automáticamente
- Recibir `video_id` y cargar escenas del vídeo directamente
- Usar `project_ai_agents.system_prompt` para el tono

---

### 2.4 Text-to-Speech — `/api/ai/generate-voice`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| ElevenLabs TTS | ✅ Funciona | Modelo eleven_multilingual_v2 |
| Google Cloud fallback | ✅ Funciona | Si ElevenLabs falla |
| 8 voces curadas | ✅ Funciona | 4 español, 4 inglés |
| Parámetros de voz | ✅ Funciona | stability, similarity, style, speed |
| Guardar audio en Storage | ❌ No hace | El cliente lo sube manualmente |
| Control de cuota | ❌ No hay | Puede agotar los 10K chars sin aviso |

**Tablas que ESCRIBE:** Ninguna (debería escribir en `video_narrations.audio_url`)

**Qué falta:**
- Verificar cuota ElevenLabs antes de generar (`getElevenLabsUsage()` existe pero no se usa)
- Subir audio a `kiyoko-storage` y guardar URL en `video_narrations`
- Registrar uso de TTS en `ai_usage_logs`
- Mostrar caracteres restantes en la UI

---

### 2.5 Generación de Imágenes — `/api/ai/generate-image`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Generar imagen con prompt | ✅ Funciona | Proveedores: OpenAI DALL-E 3, Gemini Imagen 3 |
| Guardar en Storage | ❌ NO | `// TODO: Upload to Supabase Storage` |
| Guardar referencia en DB | ❌ NO | `// TODO: Save in database` |
| Usar style preset | ❌ No | No lee `style_presets` del proyecto |

**Tablas que ESCRIBE:** Ninguna

**Qué falta (CRÍTICO):**
- Subir imagen generada a `kiyoko-storage/projects/{projectId}/videos/{videoId}/scenes/{sceneId}/images/`
- Insertar registro en `scene_media` (file_url, prompt_used, generator, version)
- Leer `style_presets` del proyecto para añadir prefix/suffix al prompt
- Registrar en `ai_usage_logs`

---

### 2.6 Análisis de Vídeo — `/api/ai/analyze-project`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Análisis completo del proyecto | ✅ Funciona | 7 áreas de análisis |
| Output estructurado | ✅ Funciona | Zod schema con score, strengths, weaknesses |
| Guardar diagnóstico | ⚠️ Parcial | Escribe en `project_issues` (tabla v3) |

**Tablas que LEE:** `projects`, `scenes`, `characters`, `backgrounds`, `narrative_arcs`, `timeline_entries`
**Tablas que ESCRIBE:** `project_issues` (⚠️ tabla v3 — debería ser `video_analysis`)

**Qué falta:**
- Renombrar a `/api/ai/analyze-video` y recibir `video_id`
- Guardar en `video_analysis` en vez de `project_issues` (tabla que ya no existe en v4)
- Filtrar escenas por `video_id`
- Incluir datos de `scene_camera`, `scene_video_clips` en el análisis

---

### 2.7 Generación de Personajes — `/api/ai/generate-characters`

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Generar ficha de personaje | ✅ Funciona | Schema Zod completo |
| Output con visual description | ✅ Funciona | Incluye clothing, hair, accessories, tools |
| Guardar en DB | ❌ No hace | Solo devuelve JSON |

**Qué falta:**
- Insertar en `characters` directamente
- Generar `ai_prompt_description` automáticamente
- Generar imagen de referencia con `generate-image`
- Insertar en `character_images` con tipo `avatar`

---

### 2.8 Arco Narrativo y Timeline

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Generar arco narrativo | ✅ Funciona | 4 fases: hook, build, peak, close |
| Generar timeline | ✅ Funciona | 3 versiones: full, 30s, 15s |
| Guardar en DB | ❌ No hace | Solo devuelve JSON |

**Qué falta:**
- Recibir `video_id` y guardar en `narrative_arcs` y `timeline_entries`
- Campos v3 incorrectos: usa `project.platform` en vez de consultar `videos.platform`

---

### 2.9 Action Executor (Acciones del Chat)

| Acción | Estado | Tabla |
|--------|--------|-------|
| `update_scene` | ✅ | `scenes` |
| `create_scene` | ✅ | `scenes` |
| `delete_scene` | ✅ | `scenes` |
| `reorder_scenes` | ✅ | `scenes` |
| `update_character` | ✅ | `characters` |
| `create_character` | ✅ | `characters` |
| `delete_character` | ✅ | `characters` |
| `add_character_to_scene` | ⚠️ | Usa `character_ids` array (v3), debería usar `scene_characters` |
| `remove_character_from_scene` | ⚠️ | Mismo problema |
| `create_background` | ✅ | `backgrounds` |
| `update_background` | ✅ | `backgrounds` |
| `update_prompt` | ⚠️ | Actualiza `prompt_image` en `scenes` (v3), debería usar `scene_prompts` |

**Qué falta:**
- Migrar `add/remove_character` para usar tabla `scene_characters` (N:N)
- Migrar `update_prompt` para usar tabla `scene_prompts`
- Añadir acciones para: `update_camera`, `generate_image`, `generate_clips`, `create_video`, `update_narration`
- Usar `entity_snapshots` en vez de `change_history`

---

## 3. Tablas de DB Usadas por la IA

### Tablas que la IA LEE correctamente
| Tabla | Usado por |
|-------|-----------|
| `projects` | Chat, análisis, generación de todo |
| `scenes` | Chat, análisis, narración, escenas |
| `characters` | Chat, análisis, escenas |
| `backgrounds` | Chat, análisis, escenas |
| `narrative_arcs` | Chat, análisis |
| `timeline_entries` | Chat, análisis |
| `user_api_keys` | Chat (API keys del usuario) |
| `profiles` | Chat (autenticación) |

### Tablas que la IA DEBERÍA leer pero NO lee
| Tabla | Para qué |
|-------|----------|
| `project_ai_agents` | System prompt personalizado del proyecto |
| `project_ai_settings` | Config de generadores (qué provider usar para imagen/vídeo) |
| `style_presets` | Prefix/suffix de prompts para imágenes |
| `scene_camera` | Contexto de cámara al generar/analizar |
| `scene_video_clips` | Estado de clips generados |
| `scene_prompts` | Historial de prompts |
| `scene_media` | Imágenes ya generadas |
| `video_narrations` | Narración existente |
| `video_analysis` | Análisis previos |
| `videos` | Filtrar por vídeo activo |

### Tablas que la IA ESCRIBE correctamente
| Tabla | Usado por |
|-------|-----------|
| `scenes` | Chat (action executor) |
| `characters` | Chat (action executor) |
| `backgrounds` | Chat (action executor) |
| `ai_usage_logs` | SDK router (cada request) |
| `ai_conversations` | Chat (guardar historial) |

### Tablas que la IA DEBERÍA escribir pero NO escribe
| Tabla | Para qué | Prioridad |
|-------|----------|-----------|
| `scene_camera` | Al crear escena, guardar config de cámara | Alta |
| `scene_prompts` | Al generar prompt, guardar en historial | Alta |
| `scene_media` | Al generar imagen, guardar referencia | **Crítica** |
| `scene_video_clips` | Al generar clips de vídeo | Alta |
| `video_narrations` | Al generar narración | Alta |
| `video_analysis` | Al analizar vídeo (en vez de `project_issues`) | **Crítica** |
| `entity_snapshots` | Al modificar cualquier entidad (rollback) | Alta |
| `narrative_arcs` | Al generar arco narrativo | Media |
| `timeline_entries` | Al generar timeline | Media |
| `scene_characters` | Al asignar personaje a escena (N:N) | Alta |
| `scene_backgrounds` | Al asignar fondo a escena (N:N) | Alta |
| `activity_log` | Al ejecutar cualquier acción IA | Media |

---

## 4. Problemas Críticos

### P1: Las imágenes generadas se pierden
La ruta `/api/ai/generate-image` genera la imagen pero NO la guarda en Storage ni en la DB. Al recargar la página, la imagen desaparece.

**Fix:** Subir a `kiyoko-storage`, insertar en `scene_media`.

### P2: El análisis escribe en tabla v3 inexistente
`/api/ai/analyze-project` intenta escribir en `project_issues` que ya no existe en v4. Debería escribir en `video_analysis`.

**Fix:** Renombrar ruta, recibir `video_id`, escribir en `video_analysis`.

### P3: El chat no usa el agente IA del proyecto
El system prompt del chat está hardcoded. Debería leer `project_ai_agents.system_prompt` del proyecto activo.

**Fix:** Cargar agente desde DB y usarlo como system prompt.

### P4: Las acciones del chat usan schema v3
El action executor usa `character_ids` array en scenes (v3) en vez de la tabla `scene_characters` (v4). Lo mismo para prompts.

**Fix:** Migrar action executor a v4.

### P5: No hay control de cuota TTS
ElevenLabs tiene 10K caracteres gratis/mes. No se verifica antes de generar.

**Fix:** Llamar `getElevenLabsUsage()` y mostrar aviso.

---

## 5. Plan de Mejora — Priorizado

### Sprint 1: Fixes Críticos (bloquean funcionalidad)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 1 | Guardar imágenes generadas en Storage + `scene_media` | `/api/ai/generate-image` | Medio |
| 2 | Migrar análisis a `video_analysis` (renombrar ruta) | `/api/ai/analyze-project` → `analyze-video` | Medio |
| 3 | Cargar `project_ai_agents.system_prompt` en el chat | `/api/ai/chat` | Bajo |
| 4 | Cargar `project_ai_settings` para saber qué provider usar | `/api/ai/chat`, `generate-image` | Bajo |
| 5 | Crear endpoint `/api/ai/providers/status` | Nuevo archivo | Bajo |

### Sprint 2: Action Executor v4

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 6 | Migrar `add/remove_character` a tabla `scene_characters` | `action-executor.ts` | Medio |
| 7 | Migrar `update_prompt` a tabla `scene_prompts` | `action-executor.ts` | Medio |
| 8 | Al crear escena, crear `scene_camera` también | `action-executor.ts` | Bajo |
| 9 | Guardar `entity_snapshots` en cada acción | `action-executor.ts` | Medio |
| 10 | Añadir acciones: `update_camera`, `generate_image` | `tools.ts`, `action-executor.ts` | Medio |

### Sprint 3: Generación Completa

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 11 | `/api/ai/generate-scenes` → insertar en DB con `video_id` | Ruta + action executor | Alto |
| 12 | `/api/ai/generate-narration` → guardar en `video_narrations` | Ruta | Medio |
| 13 | `/api/ai/generate-arc` → guardar en `narrative_arcs` con `video_id` | Ruta | Bajo |
| 14 | `/api/ai/generate-timeline` → guardar en `timeline_entries` | Ruta | Bajo |
| 15 | `/api/ai/generate-characters` → insertar en DB + generar avatar | Ruta | Medio |

### Sprint 4: UX de IA

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 16 | Chat: filtrar contexto por `video_id` activo | `/api/ai/chat` | Medio |
| 17 | Chat: pasar `scene_camera`, `scene_clips` como contexto | `/api/ai/chat` | Medio |
| 18 | TTS: verificar cuota antes de generar | `/api/ai/generate-voice` | Bajo |
| 19 | TTS: subir audio desde el server, no el cliente | `/api/ai/generate-voice` | Medio |
| 20 | Prompts: leer `style_presets` y aplicar prefix/suffix | `/api/ai/generate-image`, `improve-prompt` | Bajo |

### Sprint 5: Mejoras Avanzadas

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 21 | Generación de clips de vídeo (extensiones) | Nueva ruta `/api/ai/generate-extensions` | Alto |
| 22 | Derivar vídeo completo (crear vídeo + copiar/adaptar escenas) | Nueva ruta `/api/ai/derive-video` | Alto |
| 23 | Análisis de imagen con visión (GPT-4o/Gemini) | Nueva ruta `/api/ai/analyze-image` | Medio |
| 24 | Rotación inteligente de proveedores (success rate tracking) | `sdk-router.ts` | Medio |
| 25 | Dashboard de costes IA por proyecto | Nueva página | Medio |

---

## 6. System Prompts — Estado

| Prompt | Archivo | Usado en | Estado |
|--------|---------|----------|--------|
| Chat Assistant | `system-chat-assistant.ts` | `/api/ai/chat` | ✅ OK pero debería ser reemplazado por `project_ai_agents.system_prompt` |
| Project Generator | `system-project-generator.ts` | `/api/ai/generate-project` | ✅ OK |
| Scene Generator | `system-scene-generator.ts` | `/api/ai/generate-scenes` | ✅ OK |
| Scene Improver | `system-scene-improver.ts` | `/api/ai/improve-prompt` | ✅ OK |
| Character Generator | `system-character-generator.ts` | `/api/ai/generate-characters` | ✅ OK |
| Analyzer | `system-analyzer.ts` | `/api/ai/analyze-project` | ✅ OK |
| Narration Generator | `system-narration-generator.ts` | ❌ No usado | Reemplazado por inline prompt en generate-narration |
| Chat Director | `system-chat-director.ts` | ❌ No usado | Duplicado de chat-assistant |
| Storyboard Director | `system-storyboard-director.ts` | ❌ No usado | Obsoleto |
| Timeline Generator | `system-timeline-generator.ts` | `/api/ai/generate-timeline` | ✅ OK |

**Archivos a eliminar:** `system-narration-generator.ts`, `system-chat-director.ts`, `system-storyboard-director.ts`

---

## 7. Flujo Ideal (Objetivo)

### Crear un vídeo completo con IA:

```
1. Usuario describe el vídeo en el chat
   └→ IA lee project_ai_agents.system_prompt (tono, estilo)
   └→ IA lee project_ai_settings (proveedores configurados)

2. IA genera escenas
   └→ Inserta en scenes con video_id + short_id
   └→ Inserta en scene_camera para cada escena
   └→ Inserta en scene_prompts (prompt imagen + prompt vídeo)
   └→ Inserta en scene_characters y scene_backgrounds
   └→ Crea entity_snapshots para rollback

3. IA genera imágenes para cada escena
   └→ Lee style_presets.prompt_prefix/suffix
   └→ Genera imagen con el proveedor de project_ai_settings.image_provider
   └→ Sube a kiyoko-storage
   └→ Inserta en scene_media

4. IA genera clips de vídeo para cada escena
   └→ Usa prompt_video del scene_prompts
   └→ Genera clip base (6s) + extensiones si necesario
   └→ Sube a kiyoko-storage
   └→ Inserta en scene_video_clips

5. IA genera narración
   └→ Lee todas las escenas del vídeo
   └→ Aplica estilo de narración (Pixar, Documentary, etc.)
   └→ Genera texto → guarda en video_narrations
   └→ Genera audio TTS → sube a storage → guarda URL

6. IA analiza el vídeo
   └→ Lee todo: escenas, cámara, clips, narración, arcos
   └→ Genera análisis con score, fortalezas, debilidades
   └→ Guarda en video_analysis
   └→ Las sugerencias auto_applicable se pueden ejecutar desde la UI

7. Todo se registra en activity_log y ai_usage_logs
```

---

## 8. Configuración de IA por Proyecto

### `project_ai_agents` (Agente/Director)
```
- name: "Director Pixar — Domenech"
- system_prompt: "Eres Kiyoko, una directora de vídeo..."
- tone: "warm_professional"
- creativity_level: 0.8 (mapea a temperature)
- language: "es"
- video_style_context: "pixar_3d_animation"
```

### `project_ai_settings` (Generadores)
```
- image_provider: "grok_aurora"
- video_provider: "grok"
- video_base_duration_seconds: 6
- video_supports_extension: true
- video_extension_duration_seconds: 6
- tts_provider: "elevenlabs"
- vision_provider: "openai"
- vision_model: "gpt-4o"
```

### `style_presets` (Estilo visual)
```
- prompt_prefix: "Pixar Studios 3D animated render,"
- prompt_suffix: "warm amber lighting, cinematic, NO DIALOGUE, 4K"
- negative_prompt: "text, watermark, blurry, deformed, low quality"
```

**Ninguno de estos se usa actualmente en las rutas de IA.** Es la mejora más importante.

---

## 9. Proveedores — Detalle

| Proveedor | Tipo | Modelo | Gratis | RPM | Contexto | Calidad |
|-----------|------|--------|--------|-----|----------|---------|
| Groq | Texto | LLaMA 3.3 70B | ✅ | 30 | 128K | Alta |
| Mistral | Texto | Large | ✅ | 60 | 128K | Alta |
| Gemini | Texto+Imagen | 2.0 Flash | ✅ | 15 | 1M | Alta |
| Cerebras | Texto | LLaMA 8B | ✅ | 30 | 8K | Media |
| Grok | Texto | 3-Fast | ✅ | 60 | 131K | Alta |
| DeepSeek | Texto | V3 | ✅ | 60 | 64K | Alta |
| Claude | Texto | Sonnet 4 | ❌ | 50 | 200K | Muy alta |
| OpenAI | Texto+Imagen | GPT-4o Mini / DALL-E 3 | ❌ | 500 | 128K | Muy alta |
| Stability | Imagen | Stable Diffusion | ❌ | 10 | N/A | Alta |
| ElevenLabs | TTS | Multilingual v2 | ✅ (10K/mes) | N/A | N/A | Muy alta |

---

## 10. SDKs y Librerías de IA que Usamos

### Vercel AI SDK (core)
```
@ai-sdk/google        → Gemini 2.0 Flash (texto) + Imagen 3 (imágenes)
@ai-sdk/anthropic     → Claude Sonnet 4
@ai-sdk/openai        → GPT-4o Mini (texto) + DALL-E 3 (imágenes)
@ai-sdk/groq          → LLaMA 3.3 70B
@ai-sdk/xai           → Grok 3-Fast
@ai-sdk/mistral       → Mistral Large
ai                    → Core SDK (streamText, generateText, generateObject)
```

### Otros SDKs
```
elevenlabs            → Text-to-Speech (multilingual v2, 10K chars/mes gratis)
zod                   → Validación de output estructurado de la IA
nanoid                → Generación de short_id para entidades
```

### Proveedores OpenAI-compatible (sin SDK propio)
```
DeepSeek V3           → Via @ai-sdk/openai con baseURL: api.deepseek.com
Cerebras LLaMA 8B     → Via @ai-sdk/openai con baseURL: api.cerebras.ai
```

---

## 11. API Keys de Usuarios — Cómo Funciona

### Flujo de API Keys propias

```
1. Usuario va a /settings/api-keys
2. Añade una key: proveedor + key + límite mensual
3. La key se ENCRIPTA con AES-256-GCM antes de guardar en user_api_keys
4. Cuando el usuario usa la IA, el sistema:
   a. Busca si tiene key propia para ese proveedor
   b. Si la tiene: la desencripta y crea un modelo con createModelWithKey()
   c. Si no la tiene: usa la key del sistema (env vars)
   d. Si ninguna funciona: fallback al siguiente proveedor
```

### Tabla `user_api_keys`
```sql
user_id           UUID     -- Quién es el dueño
provider          TEXT     -- 'openai', 'anthropic', 'elevenlabs', etc.
api_key_encrypted TEXT     -- Key encriptada AES-256-GCM
api_key_hint      TEXT     -- Últimos 4 chars visibles: "...xK4m"
is_active         BOOLEAN  -- Si está habilitada
total_requests    INTEGER  -- Requests totales con esta key
total_tokens_used BIGINT   -- Tokens consumidos
total_cost_usd    NUMERIC  -- Gasto acumulado
monthly_budget_usd NUMERIC -- Límite mensual configurado por el usuario
monthly_spent_usd NUMERIC  -- Gasto este mes
```

### Encriptación (`src/lib/utils/crypto.ts`)
```
Algoritmo: AES-256-GCM
Secret: ENCRYPTION_SECRET (env var, 32 bytes hex)
Formato almacenado: iv:authTag:encrypted (hex separado por :)
```

### Lo que funciona:
- ✅ Guardar keys encriptadas
- ✅ Listar keys con hint (últimos 4 chars)
- ✅ Probar keys (/api/user/api-keys/test)
- ✅ Usar key del usuario en el chat (/api/ai/chat busca key por proveedor)
- ✅ Tracking de uso por key

### Lo que falta:
- ❌ Las keys del usuario NO se usan en generación de imágenes, narración, ni análisis
- ❌ No se verifica el presupuesto mensual antes de usar la key
- ❌ No se muestra el gasto real vs estimado en la UI
- ❌ No se notifica cuando se acerca al límite

---

## 12. Visión IA — Reconocimiento de Imágenes para Crear Prompts

### El problema que resuelve

Cuando un usuario sube una imagen de referencia de un personaje o fondo, necesitamos que la IA:
1. **Analice** la imagen y extraiga una descripción visual detallada
2. **Genere** un `ai_prompt_description` optimizado para generar imágenes consistentes
3. **Identifique** elementos clave: ropa, pelo, accesorios, pose, iluminación, etc.
4. **Almacene** el análisis en `ai_visual_analysis` (JSON estructurado)

### Estado actual
```
project_ai_settings.vision_provider = 'openai'    -- Configurado
project_ai_settings.vision_model = 'gpt-4o'       -- Configurado
Ruta API /api/ai/analyze-image                     -- NO EXISTE (prevista en el spec)
```

### Plan de implementación

#### Fase 1: Análisis básico de imagen (prioridad ALTA)

**Nueva ruta: `/api/ai/analyze-image`**
```typescript
// POST /api/ai/analyze-image
// Body: { imageUrl: string, entityType: 'character' | 'background', entityId: string }

// 1. Cargar la imagen desde la URL (Supabase Storage)
// 2. Enviar a GPT-4o Vision / Gemini Vision con prompt específico
// 3. Recibir análisis estructurado
// 4. Guardar en la entidad (character.ai_visual_analysis / background.ai_visual_analysis)
// 5. Generar ai_prompt_description optimizado para generación de imagen
```

**System prompt para análisis de personajes:**
```
Eres un experto en descripción visual para generación de imágenes con IA.
Analiza esta imagen de un personaje y devuelve un JSON con:

{
  "age_range": "40-50",
  "body_type": "athletic",
  "facial_features": "broad jaw, green eyes, short beard",
  "hair": "dark brown, short styled",
  "clothing": "blue steel blazer, black shirt",
  "accessories": ["silver necklace", "bracelets"],
  "expression": "confident, warm smile",
  "pose": "standing, arms crossed",
  "skin_tone": "fair with freckles",
  "distinctive_features": ["forearm tattoos", "dimples"],
  "lighting_in_photo": "warm amber, side lighting",
  "background_in_photo": "blurred salon interior"
}

También genera un prompt_description EN INGLÉS optimizado para generar
esta persona en diferentes ángulos con coherencia visual. Formato:
"A [body_type] [age] [gender] with [hair], wearing [clothing], [accessories]..."
```

**System prompt para análisis de fondos:**
```
Analiza esta imagen de un espacio/localización y devuelve:

{
  "location_type": "interior",
  "time_of_day": "afternoon",
  "lighting": "warm amber overhead + LED strips",
  "materials": "concrete, glass, leather, metal",
  "colors": ["#C8A96E", "#333333", "#E8E0D0"],
  "atmosphere": "professional, modern, energetic",
  "depth": "deep room with multiple stations",
  "objects": ["styling chairs", "mirrors", "tools", "blow dryers"],
  "architectural_style": "minimalist modern"
}
```

#### Fase 2: Generación de prompts desde imagen (prioridad ALTA)

**Flujo completo para personajes:**
```
1. Usuario sube imagen de referencia de un personaje
   └→ Se guarda en kiyoko-storage/projects/{id}/characters/{charId}/reference/

2. Sistema llama a /api/ai/analyze-image
   └→ GPT-4o Vision analiza la imagen
   └→ Devuelve JSON estructurado → guardado en character.ai_visual_analysis
   └→ Genera prompt_description → guardado en character.ai_prompt_description

3. Cuando la IA genera una escena con este personaje:
   └→ Lee character.ai_prompt_description
   └→ Lo inserta en el prompt de la escena automáticamente
   └→ El personaje se genera con consistencia visual
```

**Flujo para fondos:**
```
1. Usuario sube foto real del fondo (ej: foto de la peluquería)
   └→ Se guarda en kiyoko-storage/projects/{id}/backgrounds/{bgId}/reference/

2. Sistema analiza la foto
   └→ Extrae: iluminación, materiales, colores, atmósfera, objetos
   └→ Genera prompt_snippet optimizado para recrear ese espacio

3. En cada escena con ese fondo:
   └→ El prompt incluye background.prompt_snippet
   └→ Se mantiene consistencia visual del espacio
```

#### Fase 3: Re-análisis y mejora continua

**Botón "🔄 Re-analizar imagen"** en detalle de personaje/fondo:
- Re-envía la imagen a la API de visión
- Compara con el análisis anterior
- Actualiza campos si hay diferencias significativas
- Log en activity_log

**Generación de ángulos con IA:**
```
1. Usuario tiene imagen frontal del personaje
2. Click "Generar ángulos con IA"
3. La IA genera prompts para: side_left, side_right, back, three_quarter, full_body
4. Cada prompt usa ai_prompt_description + ángulo específico
5. Se genera la imagen con el proveedor configurado
6. Se guardan en character_images con el tipo correspondiente
```

#### Fase 4: Visión avanzada (futuro)

- **Análisis de escenas generadas:** Comparar la imagen generada con el prompt para detectar errores
- **Detección de inconsistencias:** Comparar personaje en escena A vs escena B
- **Sugerencias de mejora:** "La iluminación de esta escena no coincide con el mood 'warm'"
- **Extracción de paleta de colores** desde imágenes de referencia del cliente

### Proveedores de visión soportados

| Proveedor | Modelo | Calidad | Coste | Uso recomendado |
|-----------|--------|---------|-------|-----------------|
| OpenAI | GPT-4o | Muy alta | $2.50/1M tokens input | Análisis detallado |
| OpenAI | GPT-4o Mini | Alta | $0.15/1M tokens | Análisis rápido |
| Gemini | 2.0 Flash | Alta | Gratis | Análisis básico |
| Anthropic | Claude Sonnet 4 | Muy alta | $3/1M tokens | Análisis de personajes |

**Configuración en `project_ai_settings`:**
```
vision_provider: 'openai' | 'gemini' | 'claude'
vision_model: 'gpt-4o' | 'gpt-4o-mini' | 'gemini-2.0-flash' | 'claude-sonnet-4'
```

---

## 13. Plan de Mejora Global de IA

### Nivel 1: Fixes inmediatos (1-2 días)

| # | Mejora | Impacto |
|---|--------|---------|
| 1 | Usar `project_ai_agents.system_prompt` en el chat | El chat habla con el tono del proyecto |
| 2 | Leer `project_ai_settings` para elegir proveedor de imagen/vídeo | Cada proyecto usa sus proveedores |
| 3 | Aplicar `style_presets.prompt_prefix/suffix` a prompts de imagen | Imágenes con estilo consistente |
| 4 | Crear `/api/ai/providers/status` endpoint | UI muestra estado de proveedores |
| 5 | Verificar cuota ElevenLabs antes de generar TTS | Evitar errores por cuota agotada |

### Nivel 2: Persistencia (3-5 días)

| # | Mejora | Impacto |
|---|--------|---------|
| 6 | Guardar imágenes en Storage + `scene_media` | Las imágenes no se pierden |
| 7 | Guardar análisis en `video_analysis` (no `project_issues`) | Análisis por vídeo |
| 8 | Al crear escena, crear `scene_camera` + `scene_prompts` | Datos completos |
| 9 | Guardar narración en `video_narrations` desde la API | No depender del cliente |
| 10 | Guardar entity_snapshots para rollback | Deshacer acciones de la IA |
| 11 | Usar API keys del usuario en TODAS las rutas (no solo chat) | Respeto al presupuesto |

### Nivel 3: Visión e Imagen (1 semana)

| # | Mejora | Impacto |
|---|--------|---------|
| 12 | Crear `/api/ai/analyze-image` | Análisis visual de referencias |
| 13 | Auto-generar `ai_prompt_description` al subir imagen | Prompts automáticos |
| 14 | Generar ángulos de personaje con IA | Galería completa automática |
| 15 | Incluir `scene_camera` + `scene_clips` en contexto del chat | Mejor análisis |

### Nivel 4: Generación avanzada (2 semanas)

| # | Mejora | Impacto |
|---|--------|---------|
| 16 | Crear `/api/ai/generate-extensions` para clips de vídeo | Extensiones automáticas |
| 17 | Crear `/api/ai/derive-video` completo | Derivar vídeos entre plataformas |
| 18 | Rotación inteligente de proveedores (success rate) | Mejor fiabilidad |
| 19 | Dashboard de costes IA por proyecto | Control de gasto |
| 20 | Batch generation: generar todas las imágenes/clips de un vídeo | Productividad |

### Nivel 5: IA perfecta (futuro)

| # | Mejora | Impacto |
|---|--------|---------|
| 21 | Detectar inconsistencias visuales entre escenas | Coherencia visual |
| 22 | Auto-sugerir mejoras de prompt basándose en resultado | Calidad iterativa |
| 23 | Comparar vídeo generado vs briefing del cliente | Quality assurance |
| 24 | Multi-idioma en narración (mismo vídeo, múltiples idiomas) | Localización |
| 25 | Estimación de coste ANTES de generar | Transparencia |

---

## 14. Resumen Ejecutivo

### Lo que funciona bien:
- Router con 8 proveedores y fallback inteligente
- Chat streaming con acciones
- 13 rutas API de IA implementadas
- 8 estilos de narración
- 8 voces TTS curadas
- Schemas Zod para output estructurado
- System prompts bien diseñados

### Lo que está roto:
- Imágenes generadas NO se guardan (se pierden)
- Análisis escribe en tabla v3 inexistente
- Chat no usa system prompt del proyecto
- Action executor usa schema v3 para personajes/prompts

### Lo que falta por implementar:
- 11 tablas v4 que la IA no escribe
- Generación de clips de vídeo
- Derivación de vídeos
- Análisis de imagen con visión
- Control de cuota TTS
- Dashboard de costes
