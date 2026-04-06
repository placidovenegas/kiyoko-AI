# Kiyoko AI — Integración de IA Contextual por Página

> Documento de análisis profesional: cómo la IA puede asistir en cada página de la aplicación,
> eliminando la dependencia del chat global y ofreciendo asistencia inteligente integrada en contexto.
>
> **Stack IA:** Gemini 2.5 Flash (ojos) + Qwen 3.5 vía OpenRouter (cerebro) + Voxtral TTS (voz)
>
> Fecha: 2026-03-30 | Versión: 1.1

---

## Índice

1. [Filosofía: De Chat Global a IA Contextual](#1-filosofía-de-chat-global-a-ia-contextual)
2. [Dashboard Principal](#2-dashboard-principal)
3. [Creación de Proyecto (/new)](#3-creación-de-proyecto-new)
4. [Overview del Proyecto](#4-overview-del-proyecto)
5. [Lista de Vídeos](#5-lista-de-vídeos)
6. [Overview del Vídeo](#6-overview-del-vídeo)
7. [Escenas (Board)](#7-escenas-board)
8. [Detalle de Escena](#8-detalle-de-escena)
9. [Storyboard](#9-storyboard)
10. [Timeline](#10-timeline)
11. [Guión / Script](#11-guión--script)
12. [Narración / TTS](#12-narración--tts)
13. [Análisis de Vídeo](#13-análisis-de-vídeo)
14. [Exportación](#14-exportación)
15. [Derivar Vídeo](#15-derivar-vídeo)
16. [Compartir Vídeo](#16-compartir-vídeo)
17. [Personajes](#17-personajes)
18. [Detalle de Personaje](#18-detalle-de-personaje)
19. [Fondos / Localizaciones](#19-fondos--localizaciones)
20. [Detalle de Fondo](#20-detalle-de-fondo)
21. [Recursos Hub](#21-recursos-hub)
22. [Estilos y Templates](#22-estilos-y-templates)
23. [Tareas](#23-tareas)
24. [Actividad](#24-actividad)
25. [Publicaciones (Proyecto)](#25-publicaciones-proyecto)
26. [Nueva Publicación](#26-nueva-publicación)
27. [Perfiles Sociales](#27-perfiles-sociales)
28. [Publicaciones (Dashboard)](#28-publicaciones-dashboard)
29. [Configuración del Proyecto](#29-configuración-del-proyecto)
30. [Configuración IA del Proyecto](#30-configuración-ia-del-proyecto)
31. [Organizaciones / Workspaces](#31-organizaciones--workspaces)
32. [Admin](#32-admin)
33. [Componente Clave: AiAssistBar](#33-componente-clave-aiassistbar)
34. [Componente Clave: AiResultDrawer](#34-componente-clave-airesultdrawer)
35. [Mapa de Tablas Involucradas por Página](#35-mapa-de-tablas-involucradas-por-página)
36. [Plan de Migración: Chat → IA Contextual](#36-plan-de-migración-chat--ia-contextual)

---

## 1. Filosofía: De Chat Global a IA Contextual

### Problema actual
El chat con Kiyoko es un **panel lateral global** que:
- Es el mismo en todas las páginas
- Requiere que el usuario explique el contexto manualmente
- Los modales de creación son formularios manuales sin asistencia
- Existe `/project/[shortId]/chat` como página dedicada (redundante)
- 79 conversaciones almacenadas en `ai_conversations` — la mayoría sin resultado concreto

### Visión
Cada página tiene su propia **barra de asistencia IA** con acciones contextuales. La IA sabe dónde estás, qué datos hay, y ofrece acciones relevantes. No hay chat: hay **acciones inteligentes** que producen resultados concretos (crear, mejorar, generar, analizar).

### Principio
> **"La IA no es un chat. La IA es un copiloto que actúa donde estás."**

---

## 1b. Stack IA — Modelos y Proveedores

Referencia completa: `docs/v6/MY DOCUMENT/guia-director-creativo-stackB.md`

### Tres roles, tres proveedores

```
═══════════════════════════════════════════════════════════
  STACK B — $0.022 por proyecto con audio
  100% proveedores occidentales
═══════════════════════════════════════════════════════════

  👁 OJOS    → Gemini 2.5 Flash       ($0.15/M tokens)
               Google AI Studio (USA)
               Analiza imágenes: composición, mood, estilo, colores
               Uso: subir referencia de personaje/fondo/escena

  🧠 CEREBRO → Qwen 3.5 Flash          ($0.065/M tokens)
               Qwen 3.5 Plus           ($0.26/M tokens)
               Servido por OpenRouter (USA)
               Uso: generar storyboards, prompts, escenas, guiones

  🎙 VOZ     → Voxtral TTS (Mistral)   ($0.016/1K chars)
               Mistral (Francia)
               Clona voz con 3 seg de audio
               Uso: narración, TTS, voces de personajes

═══════════════════════════════════════════════════════════
```

### Cuándo usar cada modelo Qwen

| Modelo | Coste | Uso | Temperatura |
|---|---|---|---|
| **Qwen 3.5 Flash** | $0.065/M | Tareas rápidas: generar storyboard, regenerar 1 escena, escribir guión, rellenar campos de formulario, generar prompts | 0.7-0.8 |
| **Qwen 3.5 Plus** | $0.26/M | Tareas complejas: analizar storyboard completo, dar consejos creativos, insertar escenas entre existentes, detectar inconsistencias | 0.6-0.7 |

### Cuándo usar Gemini Vision

| Acción | Input | Output |
|---|---|---|
| Subir imagen de referencia de personaje | Foto/ilustración | `SceneAnalysis`: composición, sujetos, mood, colores, estilo, ángulo, iluminación |
| Subir imagen de referencia de fondo | Foto/ilustración | `SceneAnalysis`: composición, mood, colores, estilo, acción, iluminación |
| Analizar escena existente | Screenshot/frame | Análisis visual completo para mejorar prompts |
| Extraer estilo de referencia | Imagen de referencia | Estilo visual detectado + paleta de colores |

### Cuándo usar Voxtral TTS

| Acción | Input | Output |
|---|---|---|
| Generar narración | Texto + voz preset | Audio MP3 |
| Clonar voz | Texto + 3s audio referencia | Audio MP3 con voz clonada |
| Preview rápido | Primeras 50 palabras | Audio corto de preview |
| Narración multi-personaje | Segmentos con voces diferentes | Múltiples audios + merge |

### Mapeo completo: Acción → Modelo → Endpoint

| Página | Acción | Modelo | Endpoint API |
|---|---|---|---|
| Dashboard | Crear proyecto con IA | Qwen Flash | `/api/ai/generate-storyboard` |
| Dashboard | Proyecto desde imagen | Gemini Flash + Qwen Flash | `/api/ai/analyze-scenes` → `/api/ai/generate-storyboard` |
| Videos | Crear vídeo con IA | Qwen Flash | `/api/ai/generate-storyboard` |
| Escenas | Auto-planificar escenas | Qwen Flash | `/api/ai/generate-storyboard` |
| Escenas | Generar prompts en lote | Qwen Flash | `/api/ai/generate-storyboard` (por escena) |
| Escenas | Insertar escenas entre existentes | Qwen Plus | `/api/ai/insert-scenes` |
| Escena detalle | Generar prompt imagen | Qwen Flash | `/api/ai/edit-scene` |
| Escena detalle | Generar prompt vídeo | Qwen Flash | `/api/ai/edit-scene` |
| Escena detalle | Mejorar descripción | Qwen Flash | `/api/ai/edit-scene` |
| Escena detalle | Sugerir cámara | Qwen Flash | `/api/ai/edit-scene` |
| Escena detalle | Generar preview imagen | Qwen Flash (prompt) + generador externo (imagen) | `/api/ai/edit-scene` → generador |
| Storyboard | Revisar coherencia | Qwen Plus | `/api/ai/get-advice` |
| Storyboard | Completar escenas sin prompt | Qwen Flash | `/api/ai/generate-storyboard` (batch) |
| Timeline | Optimizar ritmo | Qwen Plus | `/api/ai/get-advice` |
| Guión | Generar guión completo | Qwen Flash | `/api/ai/generate-script` |
| Guión | Traducir | Qwen Flash | `/api/ai/generate-script` (idioma target) |
| Guión | Reescribir tono | Qwen Flash | `/api/ai/edit-scene` |
| Guión | Dividir en escenas | Qwen Flash | `/api/ai/generate-storyboard` |
| Narración | Generar texto narración | Qwen Flash | `/api/ai/generate-script` |
| Narración | Generar audio TTS | Voxtral TTS | `/api/ai/generate-voice` |
| Narración | Preview audio | Voxtral TTS | `/api/ai/generate-voice` (corto) |
| Narración | Clonar voz | Voxtral TTS | `/api/ai/generate-voice` (con referencia) |
| Análisis | Analizar vídeo completo | Qwen Plus | `/api/ai/get-advice` |
| Análisis | Aplicar sugerencia | Qwen Flash | `/api/ai/edit-scene` |
| Personajes | Crear con IA | Qwen Flash | `/api/ai/generate-storyboard` (personaje) |
| Personajes | Generar desde imagen | Gemini Flash + Qwen Flash | `/api/ai/analyze-scenes` → formatea |
| Personajes | Generar prompt_snippet | Qwen Flash | `/api/ai/edit-scene` |
| Personajes | Generar imagen referencia | Qwen Flash (prompt) + generador externo | prompt → generador |
| Fondos | Crear con IA | Qwen Flash | `/api/ai/generate-storyboard` (fondo) |
| Fondos | Generar desde imagen | Gemini Flash + Qwen Flash | `/api/ai/analyze-scenes` → formatea |
| Fondos | Generar prompt_snippet | Qwen Flash | `/api/ai/edit-scene` |
| Tareas | Generar plan de trabajo | Qwen Flash | `/api/ai/generate-storyboard` (tareas) |
| Publicaciones | Generar caption | Qwen Flash | `/api/ai/generate-script` |
| Publicaciones | Generar hashtags | Qwen Flash | `/api/ai/generate-script` |
| Export | Generar títulos/descripciones | Qwen Flash | `/api/ai/generate-script` |
| Derivar | Adaptar a plataforma | Qwen Plus | `/api/ai/insert-scenes` |
| Derivar | Traducir vídeo | Qwen Flash | `/api/ai/generate-script` |
| Config IA | Generar system prompt | Qwen Flash | `/api/ai/generate-script` |
| Config IA | Probar configuración | Qwen Flash | `/api/ai/edit-scene` (test) |

### Coste estimado por flujo de usuario

| Flujo | Modelos usados | Coste |
|---|---|---|
| Crear proyecto completo (6 escenas + personajes + fondos) | Qwen Flash ×3 | ~$0.003 |
| Subir 4 imágenes de referencia | Gemini Flash ×4 | ~$0.002 |
| Insertar 2 escenas de transición | Qwen Plus ×1 | ~$0.003 |
| Generar prompts para 8 escenas | Qwen Flash ×8 | ~$0.005 |
| Análisis completo del vídeo | Qwen Plus ×1 | ~$0.003 |
| Generar guión + TTS 60s | Qwen Flash + Voxtral | ~$0.014 |
| **Proyecto completo con audio** | **Todo** | **~$0.022** |

---

## 2. Dashboard Principal

**Ruta:** `/dashboard`
**Tablas:** `projects`, `tasks`, `ai_usage_logs`, `activity_log`, `project_favorites`

### Estado actual
- Grid de proyectos con búsqueda y filtros
- Stats: proyectos, tareas pendientes, en progreso, tokens usados
- Botón "Crear proyecto" → navega a `/new`
- Actividad reciente (últimas 5 entradas)

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Crear proyecto con IA** | 🧠 Qwen Flash | `profiles.creative_*`, input del usuario | Inserta en `projects` con todos los campos |
| **Sugerencias proactivas** | 🧠 Qwen Flash | `projects`, `tasks`, `activity_log` | "Tienes 3 proyectos sin vídeos", "Proyecto X lleva 5 días sin actividad" |
| **Resumen semanal** | 🧠 Qwen Flash | `activity_log`, `ai_usage_logs` | Resumen: escenas creadas, prompts generados, tokens consumidos |
| **Proyecto desde referencia** | 👁 Gemini Flash + 🧠 Qwen Flash | Imagen subida + input | Gemini extrae estilo/colores → Qwen genera proyecto |

### Implementación sugerida
```
┌─────────────────────────────────────────────────────┐
│ ✨ ¿Qué quieres crear hoy?                    [IA] │
│─────────────────────────────────────────────────────│
│ [Nuevo proyecto con IA] [Resumen semanal] [Ideas]   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Creación de Proyecto (/new)

**Ruta:** `/new`
**Tablas:** `projects`, `videos`, `characters`, `backgrounds`, `narrative_arcs`

### Estado actual
- Wizard conversacional con IA (5 pasos: Brief → Style → Characters → Locations → Create)
- Ya usa `/api/ai/chat` con SSE streaming
- Fallback mode cuando IA no disponible
- Quick actions con emojis para estilos/plataformas

### Cómo puede ayudar la IA (mejorar lo existente)

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Brief inteligente** | 🧠 Qwen Flash | Input + `profiles.creative_*` | Brief estructurado con público objetivo, tono, duración |
| **Estilo desde referencia** | 👁 Gemini Flash → 🧠 Qwen Flash | Imagen subida | Gemini detecta estilo → Qwen genera `color_palette` y `style` |
| **Personajes sugeridos** | 🧠 Qwen Flash | Brief del proyecto | Pre-llena `characters` con campos completos |
| **Localizaciones sugeridas** | 🧠 Qwen Flash | Brief + personajes | Pre-llena `backgrounds` con tipo, hora, ángulos |
| **Generar todo de golpe** | 🧠 Qwen Flash (×3 calls) | Input único | `projects` + `videos` + `characters` + `backgrounds` + `scenes` + `narrative_arcs`. Coste: ~$0.003 |

### Mejora clave
Convertir el wizard en un **modal reutilizable** desde el dashboard, no una página separada. Que se pueda invocar desde cualquier contexto.

---

## 4. Overview del Proyecto

**Ruta:** `/project/[shortId]`
**Tablas:** `projects`, `videos`, `scenes`, `characters`, `backgrounds`, `time_entries`, `activity_log`

### Estado actual
- Hero cover, stats (vídeos, escenas, personajes, fondos, tiempo trabajado)
- Preview de vídeos con progress bars
- Preview de personajes (máx 4) y fondos (máx 3)
- Actividad reciente

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Análisis del proyecto** | 🧠 Qwen Plus | Todas las tablas del proyecto | Card con: progreso %, escenas sin prompts, personajes sin imagen, tareas pendientes |
| **Sugerir siguiente paso** | 🧠 Qwen Flash | `scenes.status`, `characters`, `backgrounds` | "Genera prompts para las 5 escenas que faltan" con botón de acción |
| **Crear vídeo contextual** | 🧠 Qwen Flash | `projects.style`, `projects.platform` | Abre `VideoCreateModal` con campos sugeridos |
| **Enriquecer proyecto** | 🧠 Qwen Flash | `projects.*` | Actualiza campos con contenido mejorado |
| **Detectar inconsistencias** | 🧠 Qwen Plus | `characters`, `backgrounds`, `scenes`, `scene_characters`, `scene_backgrounds` | Lista de problemas: "La escena 3 usa un personaje que no existe en el proyecto" |

### Implementación sugerida
```
┌─────────────────────────────────────────────────────┐
│ ✨ ¿Qué quieres hacer en este proyecto?        [IA] │
│─────────────────────────────────────────────────────│
│ [Crear vídeo] [Añadir personaje] [Analizar] [Ideas] │
└─────────────────────────────────────────────────────┘
```

---

## 5. Lista de Vídeos

**Ruta:** `/project/[shortId]/videos`
**Tablas:** `videos`, `scenes`, `narrative_arcs`

### Estado actual
- Grid/lista de vídeos con plataforma, status, progreso de escenas
- `VideoCreateModal` con campos manuales (título, plataforma, duración, ratio, descripción)

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Crear vídeo con IA** | Describir idea en texto libre → IA sugiere título, plataforma, duración, aspect ratio | Input + `projects.style` + `projects.platform` | Abre modal pre-llenado con sugerencias |
| **Generar vídeo desde guión** | Pegar texto/guión → la IA crea vídeo con escenas automáticas | Input de texto + `characters`, `backgrounds` | Inserta `videos` + `scenes` + `narrative_arcs` + asignaciones |
| **Adaptar a otra plataforma** | Seleccionar vídeo existente → "Adaptar para TikTok" | `videos.*`, `scenes.*` | Nuevo vídeo derivado con duración y ratio ajustados |
| **Bulk: generar serie** | "Genera 5 shorts de este proyecto" | `projects.*`, `characters`, `backgrounds` | Múltiples vídeos con escenas variadas |
| **Sugerir próximo vídeo** | Basado en lo que ya existe, la IA sugiere el siguiente | `videos`, `scenes`, `projects.ai_brief` | Propuesta de vídeo con justificación |

### Modal mejorado: VideoCreateModal + IA
```
┌─────────────────────────────────────────────┐
│ Crear Vídeo                            [×]  │
│─────────────────────────────────────────────│
│ ✨ Describe tu idea (opcional):              │
│ ┌─────────────────────────────────────────┐ │
│ │ Un anuncio dinámico de zapatillas...    │ │
│ └─────────────────────────────────────────┘ │
│ [Generar con IA]                            │
│─────────────────────────────────────────────│
│ Título:    [Zapatillas Runner Pro ✨]       │
│ Plataforma: [Instagram Reels ✨]            │
│ Duración:  [30s ✨]                         │
│ Ratio:     [9:16 ✨] (auto)                 │
│ Descripción: [Spot dinámico con... ✨]      │
│                                             │
│ ✨ = sugerido por IA (editable)             │
│─────────────────────────────────────────────│
│              [Cancelar] [Crear Vídeo]       │
└─────────────────────────────────────────────┘
```

---

## 6. Overview del Vídeo

**Ruta:** `/project/[shortId]/video/[videoShortId]`
**Tablas:** `videos`, `scenes`, `narrative_arcs`, `scene_camera`, `scene_characters`, `scene_backgrounds`

### Estado actual
- Header con título, plataforma, duración, aspect ratio, status
- Stats: escenas, aprobadas, duración objetivo vs actual
- Barra de arco narrativo
- Grid/lista/tabla/timeline de escenas con filtros por fase y status

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar todas las escenas** | "Genera las escenas para este vídeo" → planificación completa | `videos.*`, `characters`, `backgrounds`, `projects.style` | Inserta `scenes` + `narrative_arcs` + asignaciones de personajes/fondos |
| **Completar escenas faltantes** | Si hay huecos en el arco, la IA los detecta y propone | `scenes`, `narrative_arcs` | Escenas nuevas que completan Hook/Build/Peak/Close |
| **Equilibrar duraciones** | La IA ajusta duraciones para alcanzar el target | `scenes.duration_seconds`, `videos.target_duration_seconds` | Actualiza duraciones proporcionalmente |
| **Revisar coherencia narrativa** | Analiza si el arco tiene sentido, transiciones fluidas | `scenes.*`, `narrative_arcs` | Lista de sugerencias: "El peak es muy corto", "Falta transición entre escena 3 y 4" |
| **Asignar recursos automáticamente** | Asigna personajes y fondos a escenas sin asignar | `scenes`, `characters`, `backgrounds`, `scene_characters`, `scene_backgrounds` | Inserta en `scene_characters` y `scene_backgrounds` |

### Implementación sugerida
```
┌─────────────────────────────────────────────────────┐
│ ✨ Asistente de vídeo                          [IA] │
│─────────────────────────────────────────────────────│
│ [Generar escenas] [Completar arco] [Revisar]        │
│ [Equilibrar tiempos] [Asignar personajes/fondos]    │
└─────────────────────────────────────────────────────┘
```

---

## 7. Escenas (Board)

**Ruta:** `/project/[shortId]/video/[videoShortId]/scenes`
**Tablas:** `scenes`, `scene_camera`, `scene_characters`, `scene_backgrounds`, `scene_prompts`, `scene_video_clips`

### Estado actual
- Vista Grid/Lista/Timeline de escenas
- `SceneCreateModal` con campos manuales (título, fase, tipo, duración, descripción, diálogo)
- Empty state con botones "Crear escena" y "Auto-plan" (no implementado)

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Auto-planificar escenas** | 🧠 Qwen Flash | `videos.*`, `projects.ai_brief`, `characters`, `backgrounds` | Múltiples `scenes` + `narrative_arcs` + asignaciones. Coste: ~$0.001 |
| **Crear escena con IA** | 🧠 Qwen Flash | Input + contexto del vídeo | Modal pre-llenado: título, fase, duración, descripción, diálogo |
| **Generar prompts en lote** | 🧠 Qwen Flash (×N) | `scenes`, `characters.prompt_snippet`, `backgrounds.prompt_snippet`, `style_presets` | `scene_prompts` (image + video). Regla: estilo primero, calidad al final |
| **Insertar escenas entre existentes** | 🧠 **Qwen Plus** | `scenes` completas + `style` | Detecta saltos bruscos → inserta escenas puente con `is_new: true` |
| **Mejorar escena** | 🧠 Qwen Flash | `scenes.*`, `scene_camera`, personajes/fondos asignados | Actualiza descripción, diálogo, notas del director |
| **Reordenar inteligentemente** | 🧠 Qwen Flash | `scenes.*`, `narrative_arcs` | Actualiza `scene_number` y `sort_order` |
| **Detectar duplicados** | 🧠 Qwen Flash | `scenes.description`, `scenes.dialogue` | Lista de posibles duplicados con opción de merge |

### Modal mejorado: SceneCreateModal + IA
```
┌─────────────────────────────────────────────┐
│ Crear Escena                           [×]  │
│─────────────────────────────────────────────│
│ ✨ Describe la escena:                       │
│ ┌─────────────────────────────────────────┐ │
│ │ El protagonista corre bajo la lluvia... │ │
│ └─────────────────────────────────────────┘ │
│ [Generar con IA]                            │
│─────────────────────────────────────────────│
│ Título:      [Carrera bajo la lluvia ✨]    │
│ Fase:        [Build ✨]                     │
│ Duración:    [━━━━━━━━━━ 5s ✨]            │
│ Descripción: [Plano medio del... ✨]        │
│ Diálogo:     ["No puedo parar..." ✨]       │
│ Personaje:   [Marco (protagonista) ✨]      │
│ Fondo:       [Calle nocturna ✨]            │
│                                             │
│ ✨ = sugerido por IA (editable)             │
│─────────────────────────────────────────────│
│           [Cancelar] [Crear Escena]         │
└─────────────────────────────────────────────┘
```

---

## 8. Detalle de Escena

**Ruta:** `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]`
**Tablas:** `scenes`, `scene_camera`, `scene_prompts`, `scene_media`, `scene_video_clips`, `scene_characters`, `scene_backgrounds`, `characters`, `backgrounds`, `style_presets`

### Estado actual
- Editor completo: descripción, diálogo, cámara (ángulo, movimiento, iluminación, mood)
- Asignación de personajes y fondos
- Generación de prompts de imagen/vídeo
- Notas del director, anotaciones de cliente
- Status tracking

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Generar prompt de imagen** | 🧠 Qwen Flash | `scenes.*`, `scene_camera`, `characters.prompt_snippet`, `backgrounds.prompt_snippet`, `style_presets` | Prompt EN: estilo primero → sujeto → acción → composición → calidad. Inserta en `scene_prompts` |
| **Generar prompt de vídeo** | 🧠 Qwen Flash | Prompt imagen + `scene_camera.camera_movement` | Prompt EN: movimiento cámara primero → acción 10s → transición. Inserta en `scene_prompts` |
| **Mejorar descripción** | 🧠 Qwen Flash | `scenes.description` + contexto | Descripción más detallada y visual |
| **Reescribir diálogo** | 🧠 Qwen Flash | `scenes.dialogue` + instrucción | Diálogo reescrito |
| **Sugerir cámara** | 🧠 Qwen Flash | `scenes.description`, `scenes.dialogue` | Actualiza `scene_camera` (ángulo + movimiento + iluminación + mood) |
| **Analizar imagen subida** | 👁 Gemini Flash | Imagen subida (base64) | `SceneAnalysis`: composición, sujetos, mood, colores, estilo, ángulo, iluminación |
| **Generar variantes** | 🧠 Qwen Flash (×3) | `scene_prompts.prompt_text` | 3 versiones del prompt con enfoques diferentes |
| **Traducir prompt** | 🧠 Qwen Flash | Descripción ES | Prompt EN optimizado para Midjourney/Runway/Kling |
| **Sugerir transición** | 🧠 Qwen Flash | `scenes` adyacentes + `scene_camera` | Notas de transición en `scenes.director_notes` |

### Implementación sugerida
Panel lateral de acciones IA (no chat):
```
┌───────────────────────┐
│ ✨ Acciones IA        │
│───────────────────────│
│ [Generar prompt img]  │
│ [Generar prompt vid]  │
│ [Mejorar descripción] │
│ [Sugerir cámara]      │
│ [Generar preview]     │
│ [Variantes]           │
│ [Traducir]            │
│ [Sugerir transición]  │
└───────────────────────┘
```

---

## 9. Storyboard

**Ruta:** `/project/[shortId]/video/[videoShortId]/storyboard`
**Tablas:** `scenes`, `scene_prompts`, `scene_characters`, `scene_backgrounds`, `characters`, `backgrounds`

### Estado actual
- Grid visual de escenas con thumbnails, prompts, diálogos, personajes, fondos
- Toggles: mostrar diálogo, mostrar notas
- Copiar todos los prompts, exportar PDF (placeholder)

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Completar storyboard** | 🧠 Qwen Flash (batch) | `scenes`, `scene_prompts`, `scene_media` | Genera prompts para escenas incompletas |
| **Revisar coherencia visual** | 🧠 **Qwen Plus** | `scene_prompts.prompt_text` (todas) | "La escena 3 cambia de estilo", "El personaje tiene ropa diferente en escena 5" |
| **Sugerir mejoras globales** | 🧠 **Qwen Plus** | Todo el vídeo | Análisis tipo `getCreativeAdvice()`: score + fortalezas + debilidades + sugerencias |
| **Exportar con IA** | 🧠 Qwen Flash | `scenes`, `scene_prompts`, `scene_media`, `characters`, `backgrounds` | PDF descargable en `exports` |

---

## 10. Timeline

**Ruta:** `/project/[shortId]/video/[videoShortId]/timeline`
**Tablas:** `scenes`, `narrative_arcs`, `timeline_entries`

### Estado actual
- Barra horizontal con escenas por duración
- Lista de escenas con rango temporal y arco
- Leyenda de colores por fase

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Optimizar timeline** | Ajustar duraciones para ritmo ideal según plataforma | `scenes`, `videos.platform`, `videos.target_duration_seconds` | Duraciones rebalanceadas |
| **Detectar problemas de ritmo** | "El hook dura 12s, debería ser 3-5s para TikTok" | `scenes`, `narrative_arcs`, `videos.platform` | Sugerencias de timing |
| **Generar arcos narrativos** | Si no hay arcos, la IA los crea basándose en las escenas | `scenes.arc_phase`, `scenes.duration_seconds` | Inserta en `narrative_arcs` |
| **Rellenar huecos** | Si hay tiempo sin cubrir entre arcos → sugiere escenas de transición | `narrative_arcs`, `scenes` | Nuevas escenas tipo "filler/transición" |

---

## 11. Guión / Script

**Ruta:** `/project/[shortId]/video/[videoShortId]/script`
**Tablas:** `scenes`, `narrative_arcs`, `video_narrations`

### Estado actual
- Vista de arcos narrativos con barra visual
- Tabs: narración por escena vs continua
- Selector de voz, estilo, velocidad
- Generación de narración con `/api/ai/generate-narration`
- Textarea para script continuo

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Generar guión completo** | 🧠 Qwen Flash | `projects.ai_brief`, `scenes.*`, `videos.*` | `NarrationScript` con segmentos por escena, voces, duración total |
| **Generar narración por escena** | 🧠 Qwen Flash | `scenes.description`, `scenes.dialogue`, arco | Texto individual por escena (~13 chars/segundo) |
| **Reescribir en otro tono** | 🧠 Qwen Flash | `video_narrations.narration_text` + instrucción | Texto reescrito manteniendo duración |
| **Traducir guión** | 🧠 Qwen Flash | `video_narrations.narration_text` | Texto traducido (ES ↔ EN ↔ FR ↔ PT) |
| **Adaptar para TTS** | 🧠 Qwen Flash | `video_narrations.narration_text` | Texto optimizado: pausas, entonación, pronunciaciones para Voxtral |
| **Estimar duración** | Local (sin IA) | Texto + `narration_speed` | ~13 chars/s × speed. Sin coste de API |
| **Dividir en escenas** | 🧠 Qwen Flash | Script continuo + `scenes.*` | Actualiza `scenes.dialogue` por escena |

### Implementación sugerida
```
┌─────────────────────────────────────────────────────┐
│ Guión del vídeo                                     │
│─────────────────────────────────────────────────────│
│ ✨ [Generar guión] [Traducir] [Cambiar tono]        │
│    [Optimizar para TTS] [Dividir en escenas]        │
│─────────────────────────────────────────────────────│
│ ┌─────────────────────────────────────────────────┐ │
│ │ El sol se asoma tras las montañas mientras...   │ │
│ │ [seleccionar texto → Reescribir | Expandir |    │ │
│ │  Simplificar | Cambiar tono]                    │ │
│ └─────────────────────────────────────────────────┘ │
│ Palabras: 234 | Duración estimada: ~28s | Target: 30s│
└─────────────────────────────────────────────────────┘
```

---

## 12. Narración / TTS

**Ruta:** `/project/[shortId]/video/[videoShortId]/narration`
**Tablas:** `video_narrations`, `scenes`

### Estado actual
- Selector de voz con preview
- Control de velocidad (0.7x - 1.3x)
- Textarea de narración con contador de palabras
- Botones: Generar con IA, Generar TTS, Descargar MP3
- Player de audio

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Generar texto narración** | 🧠 Qwen Flash | `scenes`, `narrative_arcs`, `projects.ai_brief` | `NarrationScript` con segmentos, emociones, timing |
| **Generar audio TTS** | 🎙 **Voxtral TTS** | Texto + voz preset o referencia | Audio MP3. Coste: $0.016/1K chars (~$0.013 para 60s) |
| **Clonar voz** | 🎙 **Voxtral TTS** | Texto + 3 segundos de audio referencia (base64) | Audio MP3 con voz clonada |
| **Preview rápido** | 🎙 **Voxtral TTS** | Primeras 50 palabras + voz seleccionada | Audio corto de preview (~$0.001) |
| **Seleccionar voz ideal** | 🧠 Qwen Flash | `project_ai_agents.tone`, `video_narrations.style` | Recomendación de preset Voxtral (mistral_adam, mistral_jessica, etc.) |
| **Narración multi-personaje** | 🧠 Qwen Flash + 🎙 Voxtral (×N) | `NarrationScript.segments` con voces diferentes | Múltiples audios → merge con ffmpeg |
| **Narración multi-idioma** | 🧠 Qwen Flash + 🎙 Voxtral | Texto + idioma target | Qwen traduce → Voxtral genera audio. Voxtral soporta 9 idiomas |
| **Adaptar a personaje** | 🧠 Qwen Flash | `characters.personality`, `characters.description` | Texto personalizado al personaje + sugerencia de voz |

---

## 13. Análisis de Vídeo

**Ruta:** `/project/[shortId]/video/[videoShortId]/analysis`
**Tablas:** `video_analysis`, `scenes`, `scene_prompts`, `narrative_arcs`

### Estado actual
- ScoreGauge (puntuación visual 0-100)
- AnalysisCards: fortalezas, debilidades, sugerencias
- Botón re-análisis (placeholder)
- Botón aplicar sugerencia (placeholder)

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Ejecutar análisis** | Análisis completo del vídeo: narrativa, ritmo, coherencia visual, prompts | `scenes`, `scene_prompts`, `scene_camera`, `narrative_arcs`, `characters`, `backgrounds` | Inserta en `video_analysis` (score, strengths, weaknesses, suggestions) |
| **Aplicar sugerencia** | Click en sugerencia → la IA ejecuta el cambio | `video_analysis.suggestions`, escenas afectadas | Actualiza escenas/prompts directamente |
| **Comparar versiones** | Antes vs después de aplicar sugerencias | `video_analysis` (versiones anteriores) | Diff visual de cambios |
| **Análisis por dimensión** | Desglose: narrativa, visual, audio, ritmo, engagement | Todo el vídeo | Radar chart con puntuaciones por área |
| **Benchmark** | Comparar con mejores prácticas de la plataforma | `videos.platform`, análisis actual | "Para TikTok, tu hook debería ser <3s, actualmente es 5s" |

---

## 14. Exportación

**Ruta:** `/project/[shortId]/video/[videoShortId]/export`
**Tablas:** `exports`, `scenes`, `scene_prompts`, `scene_media`, `scene_video_clips`, `video_narrations`

### Estado actual
- Grid de formatos: PDF, HTML, JSON, MD, MP3, ZIP
- Solo JSON y MD disponibles actualmente
- Status indicators por formato

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar PDF storyboard** | Layout profesional con thumbnails, prompts, diálogos | `scenes`, `scene_prompts`, `scene_media`, `characters` | PDF en `exports` |
| **Generar presentación** | Slide deck para cliente con resumen visual | Todo el vídeo | PDF/HTML presentación |
| **Títulos y descripciones** | Generar título, descripción, tags para YouTube/TikTok/IG | `videos.*`, `scenes.*`, `projects.*` | Texto optimizado por plataforma |
| **Generar thumbnail** | Crear imagen de portada optimizada para la plataforma | `scenes` (escena más impactante) + `style_presets` | Imagen en `exports` |
| **Checklist pre-exportación** | Revisar que todo esté listo: prompts, audio, escenas aprobadas | Todo el vídeo | Lista de pendientes antes de exportar |

---

## 15. Derivar Vídeo

**Ruta:** `/project/[shortId]/video/[videoShortId]/derive`
**Tablas:** `videos`, `video_derivations`, `scenes`

### Estado actual
- Info del vídeo fuente
- Chat placeholder (no implementado)
- Suggestion pills: "Versión corta para TikTok", etc.

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Adaptar a plataforma** | "Quiero versión TikTok" → recorta, reordena, ajusta ratio | `videos.*`, `scenes.*`, `narrative_arcs` | Nuevo `videos` + `scenes` derivados |
| **Versión corta** | Seleccionar las mejores escenas para versión resumida | `scenes`, `video_analysis.suggestions` | Nuevo vídeo con subset de escenas |
| **Cambiar tono** | "Hazlo más divertido" → reescribe diálogos y narración | `scenes.dialogue`, `video_narrations` | Nuevo vídeo con textos adaptados |
| **Traducir vídeo** | Nuevo vídeo con diálogos y narración en otro idioma | `scenes.dialogue`, `video_narrations.narration_text` | Nuevo vídeo con todo traducido |
| **Versión accesible** | Agregar audiodescripción, subtítulos detallados | `scenes.description`, `scenes.dialogue` | Textos de accesibilidad |

### Implementación sugerida (reemplazar chat)
```
┌─────────────────────────────────────────────────────┐
│ Derivar: "Zapatillas Runner Pro"                    │
│─────────────────────────────────────────────────────│
│ ¿Qué versión quieres crear?                        │
│                                                     │
│ [📱 TikTok (9:16, 15-30s)]                         │
│ [📺 YouTube Short (9:16, 60s)]                      │
│ [🌍 Traducir a inglés]                              │
│ [✂️ Versión corta (highlight)]                      │
│ [🎭 Cambiar tono]                                   │
│ [♿ Versión accesible]                              │
│                                                     │
│ O describe lo que necesitas:                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Quiero una versión más rápida para...           │ │
│ └─────────────────────────────────────────────────┘ │
│ [Crear derivación]                                  │
└─────────────────────────────────────────────────────┘
```

---

## 16. Compartir Vídeo

**Ruta:** `/project/[shortId]/video/[videoShortId]/share`
**Tablas:** `scene_shares`, `scene_annotations`

### Estado actual
- Crear link compartido con opciones (todas las escenas, anotaciones, contraseña)
- Lista de links activos con stats (visualizaciones)

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Resumir anotaciones** | Cuando un cliente anota → resumen de feedback | `scene_annotations` | Resumen agrupado por escena con prioridades |
| **Generar link con contexto** | "Comparte para revisión de cliente" → config óptima | Contexto | Link con anotaciones habilitadas, sin contraseña |
| **Responder a feedback** | Desde anotaciones → sugerir cambios en escenas | `scene_annotations`, `scenes` | Lista de cambios sugeridos |

---

## 17. Personajes

**Ruta:** `/project/[shortId]/resources/characters`
**Tablas:** `characters`, `character_images`, `scene_characters`

### Estado actual
- Grid de CharacterCards con avatar, nombre, rol, descripción visual
- `CharacterCreateModal` con campos manuales
- Contadores: escenas donde aparece, imágenes generadas

### Cómo puede ayudar la IA

| Acción IA | Modelo | Datos que usa | Resultado |
|---|---|---|---|
| **Crear personaje con IA** | 🧠 Qwen Flash | Input + `projects.style` | `characters` completo: nombre, rol, descripción, visual_description, personality, ropa, pelo, accesorios, color, prompt_snippet (EN) |
| **Generar desde imagen** | 👁 Gemini Flash → 🧠 Qwen Flash | Imagen subida (base64) | Gemini → `SceneAnalysis` (sujetos, mood, colores, estilo) → Qwen formatea en campos de `characters` |
| **Enriquecer personaje** | 🧠 Qwen Flash | `characters.*` existente | Campos vacíos rellenados con coherencia |
| **Generar prompt_snippet** | 🧠 Qwen Flash | `characters.visual_description`, `hair_description`, `signature_clothing`, `accessories` | `characters.prompt_snippet` en inglés. Regla: descripción completa cada vez (consistencia entre escenas) |
| **Sugerir personajes** | 🧠 Qwen Flash | `projects.ai_brief`, `projects.style` | Lista de personajes sugeridos con todos los campos |
| **Verificar consistencia** | 🧠 **Qwen Plus** | `characters.prompt_snippet`, `scene_prompts` donde aparece | Inconsistencias detectadas entre escenas |
| **Generar imagen de referencia** | 🧠 Qwen Flash (prompt) + generador externo | `characters.prompt_snippet`, `style_presets` | Prompt optimizado → enviar a generador de imagen configurado |

### Modal mejorado: CharacterCreateModal + IA
```
┌─────────────────────────────────────────────┐
│ Crear Personaje                        [×]  │
│─────────────────────────────────────────────│
│ ✨ Describe tu personaje:                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Un detective cansado de 45 años con     │ │
│ │ gabardina y sombrero...                 │ │
│ └─────────────────────────────────────────┘ │
│ [Generar con IA] [Subir referencia 📷]     │
│─────────────────────────────────────────────│
│ Nombre:      [Detective Ramírez ✨]         │
│ Rol:         [Protagonista ✨]              │
│ Descripción: [Hombre de 45 años... ✨]      │
│ Apariencia:  [Rostro angular, ojeras... ✨] │
│ Personalidad:[Cínico pero justo... ✨]      │
│ Pelo:        [Canoso, corto, despeinado ✨] │
│ Ropa:        [Gabardina beige raída... ✨]  │
│ Accesorios:  [Sombrero fedora, reloj ✨]    │
│ Color:       [🟤 Beige ✨]                  │
│                                             │
│ ✨ = sugerido por IA (editable)             │
│─────────────────────────────────────────────│
│         [Cancelar] [Crear Personaje]        │
└─────────────────────────────────────────────┘
```

---

## 18. Detalle de Personaje

**Ruta:** `/project/[shortId]/resources/characters/[charId]`
**Tablas:** `characters`, `character_images`, `scene_characters`, `scenes`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Mejorar campo individual** | Click en cualquier campo → "Mejorar con IA" | Campo actual + contexto del personaje | Campo mejorado |
| **Regenerar prompt_snippet** | Después de editar → actualizar snippet | Todos los campos visuales | `prompt_snippet` actualizado |
| **Generar galería** | Crear múltiples imágenes del personaje en diferentes poses/ángulos | `characters.prompt_snippet`, `character_images.angle_description` | Múltiples `character_images` |
| **Analizar uso en escenas** | "¿En qué escenas aparece y cómo?" | `scene_characters`, `scenes` | Resumen de apariciones con contexto |
| **Sugerir evolución** | Si el personaje cambia durante el vídeo → sugerir variantes visuales | `scenes` donde aparece (orden) | Variantes de `prompt_snippet` por momento del arco |

---

## 19. Fondos / Localizaciones

**Ruta:** `/project/[shortId]/resources/backgrounds`
**Tablas:** `backgrounds`, `scene_backgrounds`

### Estado actual
- Grid de BackgroundCards con thumbnail, nombre, tipo, hora, ángulos, escenas
- `BackgroundCreateModal` con campos manuales

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Crear fondo con IA** | "Una cafetería bohemia al atardecer" → todos los campos | Input + `projects.style` | `backgrounds` completo: nombre, código, tipo, hora, descripción, ángulos, `prompt_snippet` |
| **Generar desde imagen** | Subir foto de referencia → IA extrae descripción | Vision API + imagen | `backgrounds` con `ai_visual_analysis`, `reference_image_url` |
| **Generar prompt_snippet** | Desde la descripción → snippet optimizado | `backgrounds.description`, `time_of_day`, `location_type` | `backgrounds.prompt_snippet` en inglés |
| **Sugerir fondos** | Basándose en las escenas → qué localizaciones faltan | `scenes.description`, `backgrounds` existentes | Lista de fondos sugeridos |
| **Generar variantes horarias** | Un fondo en día/noche/atardecer/amanecer | `backgrounds.*` | Variantes con `time_of_day` diferente |
| **Generar imagen preview** | Imagen de referencia del fondo | `backgrounds.prompt_snippet`, `style_presets` | Imagen en `backgrounds.reference_image_url` |

### Modal mejorado: BackgroundCreateModal + IA
```
┌─────────────────────────────────────────────┐
│ Crear Fondo                            [×]  │
│─────────────────────────────────────────────│
│ ✨ Describe el lugar:                        │
│ ┌─────────────────────────────────────────┐ │
│ │ Una cafetería bohemia con libros...     │ │
│ └─────────────────────────────────────────┘ │
│ [Generar con IA] [Subir referencia 📷]     │
│─────────────────────────────────────────────│
│ Nombre:    [Café Bohemia ✨]                │
│ Tipo:      [Interior ✨]                    │
│ Hora:      [Atardecer ✨]                   │
│ Descrip.:  [Espacio acogedor con... ✨]     │
│ Ángulos:   [☑ wide ☑ medium ☑ close-up ✨] │
│                                             │
│ ✨ = sugerido por IA (editable)             │
│─────────────────────────────────────────────│
│             [Cancelar] [Crear Fondo]        │
└─────────────────────────────────────────────┘
```

---

## 20. Detalle de Fondo

**Ruta:** `/project/[shortId]/resources/backgrounds/[bgId]`
**Tablas:** `backgrounds`, `scene_backgrounds`, `scenes`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Mejorar descripción** | Enriquecer con detalles sensoriales: texturas, olores, sonidos | `backgrounds.description` + contexto | Descripción más inmersiva |
| **Regenerar prompt_snippet** | Después de editar → actualizar snippet | Todos los campos | `prompt_snippet` actualizado |
| **Generar imagen por ángulo** | Para cada ángulo disponible → imagen diferente | `backgrounds.prompt_snippet` + ángulo | Imágenes por ángulo en `backgrounds.reference_image_url` |
| **Analizar uso en escenas** | Dónde se usa este fondo y con qué personajes | `scene_backgrounds`, `scene_characters`, `scenes` | Mapa de uso |

---

## 21. Recursos Hub

**Ruta:** `/project/[shortId]/resources`
**Tablas:** `characters`, `backgrounds`, `style_presets`, `prompt_templates`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar recursos completos** | "Genera personajes y fondos para mi proyecto" | `projects.ai_brief`, `projects.style`, `scenes` | Múltiples `characters` + `backgrounds` |
| **Auditoría de recursos** | ¿Qué falta? ¿Qué sobra? ¿Qué no se usa? | Todas las tablas de recursos + `scene_*` | Lista de recursos huérfanos, faltantes, incompletos |
| **Generar style preset** | Desde el estilo del proyecto → preset de prompts | `projects.style`, `projects.color_palette` | `style_presets` con prefix, suffix, negative prompt |

---

## 22. Estilos y Templates

**Ruta:** `/project/[shortId]/resources/styles` y `/resources/templates`
**Tablas:** `style_presets`, `prompt_templates`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar style preset** | "Estilo cyberpunk neon" → prefix, suffix, negative prompt | Input + `projects.style` | `style_presets` completo |
| **Generar template** | Templates de prompt reutilizables con variables | `scenes` (ejemplos) + estilo | `prompt_templates` con `template_text` y `variables` |
| **Sugerir negative prompts** | Basándose en el estilo → qué evitar en generación | `style_presets.description` | `style_presets.negative_prompt` |
| **Importar estilo desde imagen** | Subir referencia → extraer estilo visual | Vision API | `style_presets` con colores, técnica, mood |

---

## 23. Tareas

**Ruta:** `/project/[shortId]/tasks`
**Tablas:** `tasks`, `time_entries`

### Estado actual
- Kanban board (pending, in_progress, in_review, completed)
- Vista lista toggle
- `TaskCreateModal` manual
- Botón "Generar plan con IA" (placeholder)

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar plan de trabajo** | Analiza el proyecto → crea tareas automáticas | `videos`, `scenes`, `characters`, `backgrounds`, `scene_prompts` | Múltiples `tasks` con categoría, prioridad, dependencias |
| **Priorizar tareas** | Reorganizar por impacto y urgencia | `tasks.*`, `scenes.status` | Actualiza `tasks.priority` y `tasks.sort_order` |
| **Detectar tareas faltantes** | "5 escenas sin prompts → crear tarea" | `scenes` sin `scene_prompts` | Nuevas `tasks` automáticas |
| **Estimar tiempo** | Basándose en tareas similares completadas | `tasks`, `time_entries` | `tasks.metadata` con estimación |
| **Sugerir asignación** | Si hay miembros del equipo → sugerir quién hace qué | `project_members`, `tasks` | `tasks.assigned_to` |
| **Resumen de progreso** | "¿Cómo va el proyecto?" → % completado, bloqueantes, próximos pasos | `tasks.*` | Resumen visual |

---

## 24. Actividad

**Ruta:** `/project/[shortId]/activity`
**Tablas:** `activity_log`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Resumen de actividad** | "¿Qué pasó esta semana?" → resumen inteligente | `activity_log` (filtrado por fecha) | Resumen agrupado por área |
| **Detectar anomalías** | Muchas eliminaciones, cambios masivos, inactividad | `activity_log` | Alertas: "Se eliminaron 8 escenas ayer" |

---

## 25. Publicaciones (Proyecto)

**Ruta:** `/project/[shortId]/publications`
**Tablas:** `publications`, `publication_items`, `social_profiles`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar plan de publicación** | Calendario de posts basado en el contenido | `videos`, `scenes`, `social_profiles` | Múltiples `publications` programadas |
| **Analizar rendimiento** | "¿Qué posts funcionan mejor?" | `publications.views_count`, `likes_count`, `comments_count` | Insights: mejores horarios, formatos, temas |
| **Sugerir siguiente publicación** | Basándose en lo publicado → qué publicar ahora | `publications`, `videos` no publicados | Propuesta con caption y hashtags |

---

## 26. Nueva Publicación

**Ruta:** `/project/[shortId]/publications/new`
**Tablas:** `publications`, `publication_items`, `social_profiles`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar caption** | Desde el vídeo/escena → texto para la red social | `videos`, `scenes`, `social_profiles.platform` | `publications.caption` optimizado por plataforma |
| **Generar hashtags** | Relevantes al contenido y trending | `publications.caption`, plataforma | `publications.hashtags` |
| **Sugerir hora de publicación** | Mejor momento según la plataforma | `social_profiles.platform`, `publications` históricas | `publications.scheduled_at` óptimo |
| **Generar variantes** | 3 versiones del caption para A/B testing | Caption base | 3 opciones para elegir |
| **Adaptar a plataforma** | Mismo contenido → caption diferente por red | Contenido + plataformas | Caption por plataforma (IG vs TikTok vs YouTube) |

### Implementación sugerida
```
┌─────────────────────────────────────────────┐
│ Nueva Publicación                      [×]  │
│─────────────────────────────────────────────│
│ Perfil:  [Instagram - @brand]               │
│ Tipo:    [Video] [Carousel] [Story] [Image] │
│                                             │
│ Vídeo fuente: [Zapatillas Runner Pro ▼]     │
│                                             │
│ ✨ [Generar caption] [Generar hashtags]      │
│                                             │
│ Caption:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Corre más lejos, más rápido... ✨       │ │
│ └─────────────────────────────────────────┘ │
│ Hashtags: #running #shoes #fitness ✨        │
│ Programar: [2026-04-02 18:00 ✨]            │
│                                             │
│          [Cancelar] [Crear Publicación]     │
└─────────────────────────────────────────────┘
```

---

## 27. Perfiles Sociales

**Ruta:** `/project/[shortId]/publications/profiles`
**Tablas:** `social_profiles`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Sugerir bio** | Generar bio optimizada para la plataforma | `projects.*`, plataforma | `social_profiles.bio` |
| **Analizar presencia** | "¿Cómo está tu presencia en redes?" | `social_profiles`, `publications` | Análisis de completitud y consistencia |

---

## 28. Publicaciones (Dashboard)

**Ruta:** `/dashboard/publications`
**Tablas:** `publications`, `social_profiles`, `projects`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Calendario inteligente** | Vista calendario con sugerencias de qué publicar y cuándo | `publications`, `videos`, `social_profiles` | Huecos detectados: "No publicas en Instagram hace 5 días" |
| **Análisis cross-project** | "¿Qué proyecto genera más engagement?" | `publications.*` de todos los proyectos | Ranking de proyectos por rendimiento |

---

## 29. Configuración del Proyecto

**Ruta:** `/project/[shortId]/settings`
**Tablas:** `projects`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Mejorar descripción** | Enriquecer la descripción del proyecto | `projects.description` + contexto | Descripción mejorada |
| **Sugerir tags** | Tags relevantes basados en el contenido | `projects.*`, `videos`, `scenes` | `projects.tags` |
| **Generar cover image** | Crear imagen de portada del proyecto | `projects.style`, `projects.color_palette` | `projects.cover_image_url` |
| **Sugerir paleta de colores** | Desde el estilo y brief → colores coherentes | `projects.style`, `projects.ai_brief` | `projects.color_palette` |

---

## 30. Configuración IA del Proyecto

**Ruta:** `/project/[shortId]/settings/ai`
**Tablas:** `project_ai_settings`, `project_ai_agents`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Generar system prompt** | Basándose en el estilo → prompt personalizado para el director IA | `projects.style`, `project_ai_agents.tone` | `project_ai_agents.system_prompt` |
| **Recomendar providers** | Según presupuesto y calidad deseada → mejores proveedores | `user_api_keys`, `ai_usage_logs` | Recomendación de providers con justificación |
| **Test de configuración** | "Probar" la configuración actual con un prompt de ejemplo | `project_ai_settings.*`, `project_ai_agents.*` | Preview de cómo responde la IA con esta config |

---

## 31. Organizaciones / Workspaces

**Ruta:** `/organizations`
**Tablas:** `organizations`, `organization_members`, `projects`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Sugerir tipo de workspace** | Basándose en el perfil del usuario → recomendación | `profiles.creative_*` | Tipo recomendado (personal, freelance, team) |

Impacto IA mínimo en esta página — es administrativa.

---

## 32. Admin

**Ruta:** `/admin` y `/admin/users`
**Tablas:** `profiles`, `ai_usage_logs`, `projects`

### Cómo puede ayudar la IA

| Acción IA | Descripción | Datos que usa | Resultado |
|---|---|---|---|
| **Resumen de uso** | "¿Cuánto se usa la plataforma?" | `ai_usage_logs`, `profiles`, `projects` | Dashboard con tendencias |
| **Detectar abuso** | Usuarios con consumo anormal de tokens | `ai_usage_logs` por usuario | Alertas de uso excesivo |

Impacto IA mínimo — es panel de administración.

---

## 33. Componente Clave: AiAssistBar

Componente reutilizable que reemplaza el chat global. Se coloca en cada página.

```tsx
interface AiAssistBarProps {
  context: 'dashboard' | 'project' | 'video' | 'scenes' | 'scene' |
           'characters' | 'backgrounds' | 'tasks' | 'publications' |
           'narration' | 'export' | 'storyboard';
  projectId?: string;
  videoId?: string;
  sceneId?: string;
  // Acciones rápidas contextuales
  quickActions: AiQuickAction[];
  // Placeholder del input
  placeholder?: string;
  // Callback cuando la IA produce un resultado
  onResult: (result: AiResult) => void;
}

interface AiQuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  prompt: string; // prompt pre-definido que se envía a la IA
}
```

### Comportamiento
1. Se muestra como barra fija arriba o abajo de la página
2. El input acepta texto libre O click en acción rápida
3. La respuesta se muestra en un `AiResultDrawer` (no en un chat)
4. El resultado es accionable: botones para aplicar, descartar, editar
5. Sin historial de conversación — cada interacción es independiente

### Ejemplo por contexto

**En la página de Escenas:**
```
✨ ¿Qué necesitas? | [Generar escenas] [Generar prompts] [Mejorar] [Reordenar]
```

**En la página de Personajes:**
```
✨ Describe un personaje... | [Crear con IA] [Sugerir elenco] [Auditar]
```

**En la página de Narración:**
```
✨ ¿Qué quieres generar? | [Guión completo] [Traducir] [Optimizar TTS]
```

---

## 34. Componente Clave: AiResultDrawer

Drawer lateral que muestra el resultado de una acción IA.

```tsx
interface AiResultDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  // El resultado puede ser: formulario pre-llenado, texto generado,
  // lista de sugerencias, preview visual, diff de cambios
  result: AiResult;
  // Acciones disponibles
  actions: {
    apply?: () => void;    // Aplicar el resultado
    edit?: () => void;     // Editar antes de aplicar
    regenerate?: () => void; // Regenerar con otro enfoque
    discard?: () => void;  // Descartar
  };
}
```

### Tipos de resultado

| Tipo | Uso | Ejemplo |
|---|---|---|
| `form` | Formulario pre-llenado editable | Crear personaje con campos sugeridos |
| `text` | Texto generado (narración, guión, caption) | Guión de narración |
| `suggestions` | Lista de sugerencias aplicables | Mejoras del análisis |
| `preview` | Imagen/audio preview | Preview de prompt generado |
| `diff` | Comparación antes/después | Mejora de descripción |
| `plan` | Plan de acciones a ejecutar | "Crear 8 escenas con estos datos" |
| `options` | Múltiples opciones para elegir | 3 variantes de caption |

---

## 35. Mapa de Tablas Involucradas por Página

| Página | Tablas principales | Tablas que la IA lee | Tablas que la IA escribe |
|---|---|---|---|
| Dashboard | `projects`, `tasks`, `activity_log` | `projects`, `tasks`, `ai_usage_logs` | `projects` |
| Nuevo proyecto | `projects`, `videos`, `characters`, `backgrounds` | `profiles` | `projects`, `videos`, `characters`, `backgrounds`, `narrative_arcs` |
| Overview proyecto | `projects`, `videos`, `scenes`, `characters`, `backgrounds` | Todas del proyecto | Ninguna (solo análisis) |
| Lista vídeos | `videos`, `scenes` | `projects`, `characters`, `backgrounds` | `videos`, `scenes`, `narrative_arcs` |
| Overview vídeo | `videos`, `scenes`, `narrative_arcs` | `characters`, `backgrounds`, `scene_*` | `scenes`, `narrative_arcs`, `scene_characters`, `scene_backgrounds` |
| Escenas board | `scenes`, `scene_camera` | `characters`, `backgrounds`, `style_presets` | `scenes`, `scene_prompts`, `scene_camera` |
| Detalle escena | `scenes`, `scene_camera`, `scene_prompts`, `scene_media` | `characters`, `backgrounds`, `style_presets` | `scene_prompts`, `scene_media`, `scene_video_clips` |
| Storyboard | `scenes`, `scene_prompts`, `scene_media` | `characters`, `backgrounds` | `scene_prompts`, `scene_media` |
| Timeline | `scenes`, `narrative_arcs` | `videos` | `scenes`, `narrative_arcs` |
| Guión | `scenes`, `video_narrations`, `narrative_arcs` | `projects`, `videos` | `video_narrations`, `scenes` |
| Narración | `video_narrations` | `scenes`, `characters` | `video_narrations` |
| Análisis | `video_analysis` | `scenes`, `scene_prompts`, `narrative_arcs` | `video_analysis`, `scenes` |
| Exportación | `exports`, `scenes`, `scene_media` | Todo el vídeo | `exports` |
| Derivar | `videos`, `video_derivations` | `scenes`, `video_narrations` | `videos`, `scenes`, `video_derivations` |
| Personajes | `characters`, `character_images` | `projects`, `scene_characters` | `characters`, `character_images` |
| Fondos | `backgrounds` | `projects`, `scene_backgrounds` | `backgrounds` |
| Tareas | `tasks` | `scenes`, `videos`, `characters`, `backgrounds` | `tasks` |
| Publicaciones | `publications`, `publication_items` | `videos`, `scenes`, `social_profiles` | `publications`, `publication_items` |

---

## 36. Plan de Migración: Chat → IA Contextual

### Fase 1: Componentes base (1 semana)
- [ ] Crear `AiAssistBar` (barra de asistencia contextual)
- [ ] Crear `AiResultDrawer` (drawer de resultados)
- [ ] Crear hook `useAiAction` (enviar acción → recibir resultado)
- [ ] Definir tipos: `AiQuickAction`, `AiResult`, `AiResultType`

### Fase 2: Modales inteligentes (1 semana)
- [ ] `CharacterCreateModal` + IA: input libre → campos auto-generados
- [ ] `BackgroundCreateModal` + IA: input libre → campos auto-generados
- [ ] `VideoCreateModal` + IA: input libre → campos sugeridos
- [ ] `SceneCreateModal` + IA: input libre → campos sugeridos
- [ ] `TaskCreateModal` + IA: generar plan automático

### Fase 3: Páginas de creación (2 semanas)
- [ ] Escenas: generar escenas, prompts en lote, mejorar
- [ ] Personajes: crear con IA, generar desde imagen, enriquecer
- [ ] Fondos: crear con IA, generar desde imagen
- [ ] Guión: generar, traducir, dividir en escenas
- [ ] Narración: generar TTS, seleccionar voz

### Fase 4: Páginas de análisis y mejora (1 semana)
- [ ] Análisis de vídeo: ejecutar, aplicar sugerencias
- [ ] Storyboard: completar, revisar coherencia
- [ ] Timeline: optimizar, detectar problemas de ritmo
- [ ] Exportación: generar títulos, thumbnails, PDF

### Fase 5: Publicaciones y derivados (1 semana)
- [ ] Publicaciones: generar captions, hashtags, horarios
- [ ] Derivar: adaptar a plataforma, traducir, recortar
- [ ] Dashboard: sugerencias proactivas, resumen semanal

### Fase 6: Limpieza (3 días)
- [ ] Eliminar `KiyokoPanel` (chat flotante global)
- [ ] Eliminar `/project/[shortId]/chat` (página de chat)
- [ ] Eliminar `ChatHistorySidebar`
- [ ] Simplificar `useAiChatStore` → `useAiActionStore`
- [ ] Eliminar chat toggle del Header
- [ ] Limpiar agentes: adaptar de "chat conversacional" a "acciones directas"
- [ ] Migrar `ai_conversations` → `ai_action_logs` (histórico de acciones IA)

---

## Resumen: Impacto por Página

| Página | Impacto IA | Prioridad |
|---|---|---|
| Escenas (board + detalle) | **Altísimo** — generar, mejorar, prompts | P0 |
| Personajes | **Alto** — crear con IA, enriquecer, prompt_snippet | P0 |
| Fondos | **Alto** — crear con IA, enriquecer, prompt_snippet | P0 |
| Guión / Script | **Alto** — generar, traducir, dividir | P1 |
| Narración / TTS | **Alto** — generar texto, seleccionar voz | P1 |
| Vídeos (lista + overview) | **Alto** — crear con IA, generar escenas | P1 |
| Storyboard | **Medio** — completar, revisar coherencia | P2 |
| Análisis | **Medio** — ejecutar análisis, aplicar sugerencias | P2 |
| Exportación | **Medio** — títulos, thumbnails, PDF | P2 |
| Publicaciones | **Medio** — captions, hashtags, calendario | P2 |
| Derivar | **Medio** — adaptar plataforma, traducir | P2 |
| Tareas | **Medio** — generar plan, priorizar | P3 |
| Dashboard | **Bajo** — sugerencias, resumen | P3 |
| Timeline | **Bajo** — optimizar tiempos | P3 |
| Configuración | **Bajo** — system prompt, providers | P3 |
| Admin | **Mínimo** — stats de uso | P4 |
| Organizaciones | **Mínimo** — administrativa | P4 |
| Compartir | **Mínimo** — resumir anotaciones | P4 |

---

> **Principio final:** Cada página es un contexto. La IA no pregunta "¿en qué te ayudo?". La IA ofrece exactamente lo que necesitas donde estás.
