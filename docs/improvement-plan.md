# Kiyoko AI — Plan de Mejoras

> Estado actual: 60 páginas, 28 API routes, 32 hooks, 10 agentes IA
> Build limpio, 0 errores TypeScript
> Última actualización: Abril 2026

---

## 1. Integración IA — Cómo mejorarla

### 1.1 Chat contextual (prioridad ALTA)

**Estado actual:** El chat funciona con 10 agentes especializados y detecta intents. Cuando el usuario pulsa "Chat IA" en una escena, se abre el sidebar con el agente `scenes`.

**Mejoras necesarias:**

| Mejora | Descripción | Impacto |
|--------|-------------|---------|
| **Contexto de escena completo** | Cuando se abre chat desde una escena, enviar TODA la info: prompts actuales, personajes, fondo, cámara, audio config, timeline entries | ALTO |
| **Acciones directas desde chat** | "Cambia el ángulo a cenital" → el chat ejecuta la acción y actualiza la DB | ALTO |
| **Sugerencias contextuales** | Al abrir chat en una escena, mostrar 3-4 sugerencias: "Mejorar prompt", "Cambiar cámara", "Añadir personaje" | MEDIO |
| **Historial por escena** | Guardar conversaciones vinculadas a cada escena (scene_id en ai_conversations) | MEDIO |
| **Resultado visual** | Cuando IA genera un prompt, mostrar preview del prompt en el chat con botón "Copiar" | ALTO |

### 1.2 Generación de prompts (prioridad ALTA)

**Estado actual:** API `/api/ai/generate-scene-prompts` funciona. Genera imagen+video juntos. Usa Qwen Flash como default, fallback a mock en dev.

**Mejoras necesarias:**

| Mejora | Descripción |
|--------|-------------|
| **Incluir imágenes de referencia** | Pasar `character.reference_image_url` y `background.reference_image_url` al contexto del prompt |
| **Múltiples opciones** | Generar 2-3 variantes de prompt y dejar que el usuario elija |
| **Regeneración parcial** | "Regenerar solo el prompt de video" sin tocar el de imagen |
| **Prompt desde imagen subida** | Subir imagen → Gemini analiza → IA mejora prompt de video basándose en la imagen real |
| **Prompt templates** | Guardar prompts exitosos como templates reutilizables |
| **Negative prompts** | Generar automáticamente lo que NO debe aparecer |

### 1.3 Análisis IA (prioridad MEDIA)

**Estado actual:** Página de análisis muestra score 82/100, fortalezas, debilidades, sugerencias. API `/api/ai/analyze-video` funciona.

**Mejoras necesarias:**

| Mejora | Descripción |
|--------|-------------|
| **Auto-análisis al completar escenas** | Cuando todas las escenas tienen prompts, analizar automáticamente |
| **Análisis por escena** | No solo video completo — también calidad individual de cada escena |
| **Sugerencias accionables** | "Aplicar" botón que ejecuta la sugerencia (cambiar cámara, añadir transición) |
| **Comparación antes/después** | Mostrar prompts originales vs mejorados lado a lado |

### 1.4 Narración IA (prioridad MEDIA)

**Estado actual:** Genera texto narración para todas las escenas. TTS con ElevenLabs. Voxtral TTS preparado como alternativa barata.

**Mejoras necesarias:**

| Mejora | Descripción |
|--------|-------------|
| **Voxtral TTS** | Integrar como provider principal ($0.016/1K chars vs ElevenLabs más caro) |
| **Clonación de voz** | Subir 3 segundos de audio → generar con esa voz |
| **Preview por escena** | Generar audio escena por escena, no todo el video de golpe |
| **Sync con timeline** | Verificar que duración de narración encaja con duración de escena |

---

## 2. Páginas — Qué falta

### 2.1 Páginas sin loading/error states (20+)

Estas páginas necesitan `loading.tsx` y `error.tsx`:

```
/project/[shortId]/resources/characters/
/project/[shortId]/resources/characters/[charId]/
/project/[shortId]/resources/backgrounds/
/project/[shortId]/resources/backgrounds/[bgId]/
/project/[shortId]/video/[videoShortId]/analysis/
/project/[shortId]/video/[videoShortId]/export/
/project/[shortId]/video/[videoShortId]/narration/
/project/[shortId]/video/[videoShortId]/timeline/
/project/[shortId]/video/[videoShortId]/share/
/project/[shortId]/publications/
/project/[shortId]/publications/new/
/project/[shortId]/publications/[pubShortId]/
/project/[shortId]/publications/profiles/
```

### 2.2 Funcionalidades pendientes por página

| Página | Feature pendiente | Prioridad |
|--------|-------------------|-----------|
| **Vista General** | Drag-and-drop para reordenar escenas | MEDIA |
| **Vista General** | "Auto-planificar" con IA (generar escenas automáticas) | ALTA |
| **Scene Detail** | Subir imagen de referencia por escena | ALTA |
| **Scene Detail** | Editor de timeline entry inline (editar desglose temporal) | MEDIA |
| **Scene Detail** | Añadir/quitar personajes y fondos (selector dropdown) | ALTA |
| **Timeline** | Editar arcos narrativos (crear, reordenar) | MEDIA |
| **Narración** | Selector de voz (cambiar voz, preview) | MEDIA |
| **Narración** | Modo continuo: generar narración completa | ALTA |
| **Export** | PDF funcional con imágenes | ALTA |
| **Export** | MP3 (concatenar narración de todas las escenas) | MEDIA |
| **Publicaciones** | Preview mockup (Instagram, TikTok, YouTube) | ALTA |
| **Publicaciones** | IA para captions y hashtags | MEDIA |
| **Personajes** | Generar personaje con IA desde descripción | MEDIA |
| **Fondos** | Generar fondo con IA desde descripción | MEDIA |

---

## 3. API Routes — Qué falta

### 3.1 APIs que no se llaman desde el frontend

Estas APIs existen y funcionan pero NO tienen botón/UI que las llame:

| API | Función | Cómo integrar |
|-----|---------|--------------|
| `/api/ai/generate-arc` | Genera arco narrativo | Botón en Timeline: "Generar arco con IA" |
| `/api/ai/generate-characters` | Genera personajes batch | Botón en Personajes: "Generar con IA" |
| `/api/ai/generate-extensions` | Genera extensiones de escena | Botón en Scene Detail: "Extender escena" |
| `/api/ai/generate-timeline` | Genera timeline entries | Botón en Timeline/Scene: "Generar desglose temporal" |
| `/api/ai/improve-prompt` | Mejora un prompt existente | Botón en Scene Detail: "Mejorar prompt" |
| `/api/ai/analyze-image` | Analiza imagen subida | Al subir imagen en Scene Detail |
| `/api/ai/derive-video` | Crea variación del video para otra plataforma | Botón en Video: "Adaptar para TikTok" |

### 3.2 APIs que faltan

| API | Función |
|-----|---------|
| `/api/ai/generate-scene-timeline` | Generar desglose segundo a segundo para una escena |
| `/api/ai/generate-publication-content` | Generar caption + hashtags para publicación |
| `/api/ai/analyze-publication` | Analizar calidad de publicación y sugerir mejoras |
| `/api/export/pdf` | Generar PDF del storyboard (actualmente 501) |

---

## 4. Base de datos — Qué mejorar

### 4.1 Tablas que necesitan datos de ejemplo

| Tabla | Rows | Acción |
|-------|------|--------|
| `prompt_templates` | 0 | Crear templates de prompts (anime, realista, etc.) |
| `style_presets` | 1 | Crear más presets de estilo visual |
| `scene_media` | 0 | Se llenarán cuando usuarios suban imágenes generadas |
| `scene_annotations` | 0 | Se llenarán cuando se compartan escenas |
| `notifications` | 0 | Generar notificaciones automáticas (escena generada, etc.) |

### 4.2 Campos que faltan

| Tabla | Campo | Tipo | Uso |
|-------|-------|------|-----|
| `scenes` | `negative_prompt` | text | Lo que NO debe aparecer en la generación |
| `videos` | `narration_mode` | enum | 'per_scene' / 'continuous' / 'none' |
| `characters` | `voice_preset` | text | Preset de voz para narración dialogada |
| `publications` | `preview_mockup_url` | text | URL del mockup generado |

---

## 5. UX — Mejoras generales

### 5.1 Flujo del usuario optimizado

```
ACTUAL:
Dashboard → Proyecto → Videos → Video → (muchos clicks para llegar a escena)

IDEAL:
Dashboard → Proyecto → Video (ya tiene todo: storyboard + escenas + acciones)
                         ↓
                    Click escena → Scene Detail (editar todo)
                         ↓
                    Copiar prompt → Generar en Grok/Flow
                         ↓
                    Subir resultado → IA analiza → Mejora prompt video
```

### 5.2 Quick actions que faltan

| Dónde | Acción rápida |
|-------|---------------|
| Vista General | "Generar todos los prompts de imagen" (batch) |
| Vista General | "Copiar todos → Grok" (formato optimizado) |
| Scene Detail | "Siguiente escena →" (navegación rápida) ✅ YA IMPLEMENTADO |
| Scene Detail | "Duplicar escena" |
| Scene Detail | "Mover escena arriba/abajo" |
| Personajes | "Generar prompt snippet con IA" |
| Fondos | "Generar prompt snippet con IA" |

### 5.3 Responsive / Mobile

- Las páginas principales funcionan en desktop y tablet
- El sidebar colapsa en modo icono
- Las modales se adaptan
- **Falta**: Optimización para mobile en Scene Detail (dos columnas se comprimen mal)

---

## 6. Rendimiento

| Área | Estado | Mejora |
|------|--------|--------|
| Queries N+1 | ✅ Resuelto en storyboard (batched) | — |
| Stale time | ✅ 60s en dashboard | — |
| Debounce | ✅ 250ms en búsqueda | — |
| Skeleton loaders | ⚠️ Solo en páginas principales | Añadir a todas las páginas |
| Image optimization | ⚠️ Usar `next/image` con sizes | Implementar en thumbnails |
| Bundle size | ⚠️ Muchos imports de lucide | Verificar tree-shaking |

---

## 7. Prioridades de implementación

### Sprint 1 — Core (1-2 semanas)
1. ✅ ~~Diseño minimalista consistente~~ HECHO
2. ✅ ~~Generación de prompts con IA~~ HECHO
3. ✅ ~~Storyboard con datos completos~~ HECHO
4. Conectar APIs no usadas (generate-arc, generate-timeline, improve-prompt)
5. Subir imágenes en Scene Detail
6. Selector de personajes/fondos en Scene Detail

### Sprint 2 — IA (1-2 semanas)
1. Chat contextual mejorado (contexto completo por escena)
2. Múltiples opciones de prompts (2-3 variantes)
3. Análisis de imagen subida → mejora prompt video
4. Voxtral TTS integrado
5. Auto-planificar escenas con IA

### Sprint 3 — Publicaciones (1 semana)
1. Preview mockup (Instagram, TikTok, YouTube)
2. IA para captions y hashtags
3. Calendario de publicaciones mejorado

### Sprint 4 — Export + Polish (1 semana)
1. PDF export funcional
2. Loading/error states en todas las páginas
3. Mobile optimization
4. Performance audit

---

## 8. Stack técnico actual

| Componente | Tecnología | Estado |
|-----------|-----------|--------|
| Framework | Next.js 16 + React 19 | ✅ |
| DB | Supabase (42 tablas) | ✅ |
| IA Chat | Multi-agente (10 agentes) | ✅ |
| IA Prompts | Qwen Flash via OpenRouter | ✅ |
| IA Visión | Gemini 2.5 Flash | ✅ Preparado |
| IA TTS | ElevenLabs + Voxtral | ✅ |
| State | Zustand (UI) + TanStack Query (server) | ✅ |
| Styling | Tailwind v4 + HeroUI v3 | ✅ |
| Auth | Supabase Auth | ✅ |
| Storage | Supabase Storage | ✅ |
| Realtime | Supabase Realtime | ✅ |

---

*Generado por Claude Code — Abril 2026*
