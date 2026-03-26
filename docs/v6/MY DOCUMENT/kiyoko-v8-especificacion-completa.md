# Kiyoko AI Chat — Especificación V8 Completa

> Documento definitivo basado en el esquema real de base de datos, decisiones de producto confirmadas, y análisis de componentes necesarios. Para uso con Claude Code o cualquier desarrollador.

---

## 1. Decisiones de producto confirmadas

| Tema | Decisión |
|------|----------|
| Escenas en listas | Compacta: título + status badge + personaje/fondo |
| Escenas en detalle | Completa: todos los campos de BD |
| Status pipeline | Barra de progreso visual en el componente del chat |
| Navegación | Resumen en chat + botón sutil "Abrir página" → router.push |
| Personaje/fondo detalle | Compacto primero → botones "expandir" que añaden secciones debajo |
| Campos personaje | Todo: identidad visual, galería, reglas, escenas, prompt |
| Componentes sin tabla | Leen de tablas reales (narrations, style_presets, scene_camera) |
| Acciones reales | Sí: crear prompts, generar imagen/video/audio, crear tareas |
| Premium sin API | Banner bonito dentro del componente + botón a settings |
| Datos faltantes | IA avisa qué falta → guía paso a paso |
| Review clientes | Completo: crear link, ver anotaciones, resolver |
| Chat vs páginas | Chat siempre abierto, independiente, puede hacer que la app navegue |
| Activity log | Sí, la IA puede mostrar historial: "qué se hizo ayer" |

---

## 2. Mapa de tablas → componentes

### 2.1 Componentes principales (1 tabla = 1 componente)

| Tabla BD | Componente chat | Vista compacta | Vista expandida |
|----------|----------------|----------------|-----------------|
| `characters` | `CharacterCard` | Nombre + avatar + rol + status prompt | + identidad visual + reglas + galería + escenas |
| `backgrounds` | `BackgroundCard` | Nombre + thumbnail + tipo + momento | + ángulos + análisis IA + prompt snippet |
| `scenes` | `SceneCard` | Título + nº + arc_phase + status pipeline | + diálogo + notas + cámara + prompts + media |
| `videos` | `VideoCard` | Título + plataforma + tipo + status | + escenas count + duración + narración + análisis |
| `projects` | `ProjectCard` | Título + style + status + stats | + color_palette + ai_brief + global_prompt_rules |
| `tasks` | `TaskCard` | Título + prioridad + categoría + status | + descripción + asignado + dependencias + fecha |

### 2.2 Componentes derivados (leen de tablas auxiliares)

| Tablas BD | Componente chat | Qué muestra |
|-----------|----------------|-------------|
| `scene_camera` | `CameraBlock` | Ángulo (10 opciones) + movimiento (11 opciones) + lighting + mood + ai_reasoning |
| `scene_prompts` | `PromptBlock` | Prompt actual + versiones anteriores + tipo (image/video/narration) + status |
| `scene_media` | `MediaGallery` | Imágenes/videos generados + versiones + generador + thumbnails |
| `scene_video_clips` | `ClipBlock` | Clips generados + extensiones + duración + last_frame |
| `scene_characters` | `CastingBlock` | Personaje → escena + rol_in_scene + sort_order |
| `scene_backgrounds` | `LocationBlock` | Fondo → escena + ángulo + time_of_day |
| `character_images` | `CharImageGallery` | Imágenes del personaje + ángulo + generador + is_primary |
| `video_narrations` | `NarrationBlock` | Texto narración + voz + provider + audio player + velocidad |
| `video_analysis` | `AnalysisBlock` | Score general + fortalezas + debilidades + sugerencias accionables |
| `narrative_arcs` | `ArcTimeline` | Fases del arco narrativo + tiempos + colores |
| `style_presets` | `StyleBlock` | Prompt prefix/suffix + negative + paleta + generador config |
| `prompt_templates` | `TemplateBlock` | Nombre + template con variables + tipo |
| `scene_shares` | `ShareBlock` | Token + link + opciones (anotaciones, password, expiración) |
| `scene_annotations` | `AnnotationsBlock` | Comentarios del cliente + timestamps + status resolución |
| `comments` | `CommentsBlock` | Comentarios internos en escenas/tareas/videos |
| `activity_log` | `ActivityBlock` | Historial de acciones con entidad + descripción + timestamp |
| `exports` | `ExportBlock` | Formato + versión + progreso + link descarga |
| `project_ai_settings` + `user_api_keys` | `ApiStatusBanner` | Providers configurados + estado + botón settings |
| `publications` + `social_profiles` | `PublishBlock` | Plataforma + programación + stats (views, likes) |
| `time_entries` | `TimeBlock` | Tiempo por tarea/video + running timer |

### 2.3 Componentes de flujo (no leen de una tabla, orquestan varias)

| Componente | Flujo que orquesta |
|------------|-------------------|
| `SceneReadiness` | Verifica: ¿personaje? ¿fondo? ¿cámara? ¿prompt? → checklist visual |
| `GenerationFlow` | Paso a paso: prompt → imagen → video clip → extensión |
| `BatchGenerator` | "Genera prompts para todas las escenas" — progreso por escena |
| `ProjectOverview` | Stats agregadas: nº videos, escenas, personajes, fondos, tareas pendientes, % completado |

---

## 3. Campos exactos por componente

### 3.1 CharacterCard

**Vista compacta (siempre visible):**
```
┌─────────────────────────────────────────────────┐
│ [Avatar gradient]  Juan                         │
│  con iniciales     Protagonista · color_accent  │
│  o ref_image       [Prompt OK] [3 escenas]      │
│                                     [▸ Abrir]   │
├─────────────────────────────────────────────────┤
│  ▸ Identidad visual                             │
│  ▸ Galería de imágenes (3)                      │
│  ▸ Reglas de consistencia                       │
│  ▸ Escenas donde aparece                        │
│  ▸ Prompt completo                              │
└─────────────────────────────────────────────────┘
```

**Campos de `characters`:**
- `name`, `initials`, `role`, `color_accent` → header
- `description`, `personality` → texto principal
- `hair_description`, `signature_clothing`, `accessories[]`, `signature_tools[]` → sección "Identidad visual"
- `visual_description` → sección visual
- `rules` (JSON) → sección "Reglas de consistencia"
- `prompt_snippet`, `ai_prompt_description` → sección "Prompt"
- `reference_image_url` → avatar si existe
- `ai_visual_analysis` (JSON) → sección expandible "Análisis IA"

**Campos de `character_images` (join):**
- `file_url`, `thumbnail_url`, `angle_description`, `image_type`, `generator`, `prompt_used`, `is_primary` → sección "Galería"

**Campos de `scene_characters` + `scenes` (join):**
- Escenas donde aparece + `role_in_scene` → sección "Escenas"

**Acciones del componente:**
- "Editar" → abre dock de edición
- "Regenerar prompt" → crea nuevo `ai_prompt_description` con IA
- "Generar imagen" → si API configurada, genera en `character_images`; si no, muestra `ApiStatusBanner`
- "Abrir página" → `router.push(/project/{id}/characters/{id})`

### 3.2 BackgroundCard

**Vista compacta:**
```
┌─────────────────────────────────────────────────┐
│ [Gradient preview]  Playa del Horizonte         │
│  48x32px            Exterior · Atardecer        │
│  basado en          [Prompt OK]                 │
│  time_of_day        [code: BG-001]   [▸ Abrir]  │
├─────────────────────────────────────────────────┤
│  ▸ Ángulos disponibles (3)                      │
│  ▸ Análisis visual IA                           │
│  ▸ Prompt completo                              │
│  ▸ Escenas donde se usa                         │
└─────────────────────────────────────────────────┘
```

**Campos de `backgrounds`:**
- `name`, `code`, `location_type`, `time_of_day` → header
- `description` → texto
- `available_angles[]` → sección "Ángulos"
- `prompt_snippet`, `ai_prompt_description` → sección "Prompt"
- `ai_visual_analysis` (JSON) → sección "Análisis IA"
- `reference_image_url` → thumbnail

**Campos de `scene_backgrounds` + `scenes` (join):**
- Escenas donde se usa + ángulo + time_of_day override

### 3.3 SceneCard

**Vista compacta (en listas):**
```
┌────────────────────────────────────────────┐
│ #3  Peak · La Decisión                     │
│ [████████░░] generating     3s             │
│ Juan · Playa        [▸ Abrir]              │
└────────────────────────────────────────────┘
```

**Vista completa (cuando pides "ver escena 3"):**
```
┌────────────────────────────────────────────────────┐
│ #3  La Decisión                          [▸ Abrir] │
│ Peak · original · 3s                               │
│                                                     │
│ ┌─ STATUS PIPELINE ──────────────────────────────┐ │
│ │ ● draft → ● prompt_ready → ◐ generating → ...  │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ Descripción:                                        │
│ Juan toma la decisión de quedarse...                │
│                                                     │
│ Diálogo:                                            │
│ "No puedo seguir huyendo de esto."                  │
│                                                     │
│ Notas del director:                                 │
│ Plano cerrado, respiración agitada, atardecer...    │
│                                                     │
│ ┌─ CÁMARA ───────────────────────────────────────┐ │
│ │ Ángulo: close_up  Movimiento: dolly_in         │ │
│ │ Lighting: golden hour  Mood: intenso           │ │
│ │ IA reasoning: "Close up para capturar..."      │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ PERSONAJES ───────────────────────────────────┐ │
│ │ [J] Juan · protagonista en esta escena         │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ FONDO ────────────────────────────────────────┐ │
│ │ [🌊] Playa Horizonte · exterior · atardecer    │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ▸ Prompts (2 versiones)                            │
│ ▸ Media generado (1 imagen, 0 video)               │
│ ▸ Video clips (0)                                   │
│ ▸ Anotaciones del cliente (0)                       │
│                                                     │
│ [Generar prompt] [Generar imagen] [Compartir]       │
└────────────────────────────────────────────────────┘
```

**Campos de `scenes`:**
- `scene_number`, `title`, `arc_phase`, `scene_type`, `status`, `duration_seconds` → header + pipeline
- `description`, `dialogue`, `director_notes`, `notes` → contenido
- `is_filler`, `generation_context` → metadata
- `client_annotation`, `annotation_source` → review

**Joins:**
- `scene_camera` → bloque cámara
- `scene_characters` + `characters` → bloque personajes
- `scene_backgrounds` + `backgrounds` → bloque fondo
- `scene_prompts` → sección expandible prompts (con versiones)
- `scene_media` → sección expandible media
- `scene_video_clips` → sección expandible clips
- `scene_annotations` → sección expandible anotaciones

### 3.4 Status Pipeline Visual

Los 6 estados de `scene_status` se muestran como barra:

```
draft → prompt_ready → generating → generated → approved
  ●         ●             ◐            ○           ○

●  = completado (verde)
◐  = en progreso (azul con animación)
○  = pendiente (gris)
```

**Colores:**
- `draft` → `#71717a`
- `prompt_ready` → `#F5A524`
- `generating` → `#006fee` (con pulse animation)
- `generated` → `#4da6ff`
- `approved` → `#17C964`
- `rejected` → `#F31260`

### 3.5 VideoCard

**Campos de `videos`:**
- `title`, `video_type`, `platform`, `status`, `aspect_ratio`, `target_duration_seconds` → header
- `description` → texto
- `narration_voice_name`, `narration_style`, `narration_speed` → sección narración
- `style_preset_id` → referencia a style preset
- `is_primary` → badge si es el video principal

**Stats calculadas (joins):**
- Count de `scenes` por video
- Count de `scene_prompts` con `is_current` = true
- Count de `scene_media` con `is_current` = true
- % de escenas con status `approved`

### 3.6 NarrationBlock

**Lee de `video_narrations`:**
- `narration_text` → textarea editable
- `voice_name`, `voice_id` → selector de voz
- `provider` → badge (ElevenLabs, etc.)
- `speed`, `style` → controles
- `audio_url` → player de audio inline
- `status` → badge
- `version` → historial de versiones
- `is_current` → cuál es la activa

**Acciones:**
- "Editar texto" → edición inline, guarda en BD
- "Generar audio" → si API configurada (tts_provider en `project_ai_settings`); si no → `ApiStatusBanner`
- "Cambiar voz" → selector
- "Reproducir" → audio player

### 3.7 AnalysisBlock (Video Analysis)

**Lee de `video_analysis`:**
- `overall_score` → número grande con indicador visual (0-100)
- `summary` → texto resumen
- `strengths` (JSON array) → lista con checks verdes
- `weaknesses` (JSON array) → lista con warnings amarillos
- `suggestions` (JSON array) → lista con botones accionables
- `analysis_model` → badge del modelo usado
- `version`, `is_current` → historial

**Diferencia con Analysis del prototipo anterior:** El prototipo mostraba un análisis de "pacing" inventado. Este lee datos reales de `video_analysis` y las sugerencias son accionables (cada una puede disparar una acción).

### 3.8 ApiStatusBanner

**Lee de `project_ai_settings` + `user_api_keys`:**

```
┌──────────────────────────────────────────────┐
│ ⚡ Para generar imágenes necesitas conectar  │
│    tu API de {image_provider || "un provider"}│
│                                              │
│    [Ir a configuración]                       │
│                                              │
│    Providers compatibles:                     │
│    Midjourney · DALL-E · Stable Diffusion    │
└──────────────────────────────────────────────┘
```

**Lógica:**
1. Lee `project_ai_settings.image_provider` para imágenes
2. Lee `project_ai_settings.video_provider` para video
3. Lee `project_ai_settings.tts_provider` para voiceover
4. Lee `user_api_keys` donde `provider` = X y `is_active` = true
5. Si no hay key activa para el provider → muestra banner
6. Si hay key pero `last_error` no es null → muestra warning

**Botón "Ir a configuración":**
- `router.push(/settings/api-keys)` o la ruta que corresponda

---

## 4. Flujos de producción

### 4.1 Flujo: Generar escena completa

```
USUARIO: "Genera la escena 3"

1. IA consulta scene #3 con joins:
   - scene_characters → ¿tiene personaje?
   - scene_backgrounds → ¿tiene fondo?
   - scene_camera → ¿tiene cámara?
   - scene_prompts → ¿tiene prompt de imagen?

2. SI FALTA ALGO → muestra SceneReadiness:
   IA: "La escena #3 necesita algunos datos antes de generar:"
   
   ┌──────────────────────────────────────────┐
   │ Escena #3 — La Decisión                  │
   │                                          │
   │ ✓ Personaje asignado: Juan               │
   │ ✓ Fondo asignado: Playa Horizonte        │
   │ ✗ Cámara no configurada                  │
   │ ✗ Prompt de imagen no generado           │
   │                                          │
   │ [Configurar cámara] [Generar prompt]     │
   └──────────────────────────────────────────┘
   
   Sugerencias:
   → "Configurar cámara de la escena 3"
   → "Generar prompt de imagen"
   → "Ver detalle de la escena"

3. SI TODO OK:
   a. IA genera prompt → INSERT en scene_prompts
      IA: "He generado el prompt para la escena #3:"
      [PromptBlock con el prompt generado]
      → "¿Lo apruebas o quieres que lo mejore?"
   
   b. Usuario aprueba → IA verifica API
      - Si image_provider configurado:
        IA: "Generando imagen con {provider}..."
        [Barra de progreso]
        → INSERT en scene_media
        → Muestra imagen generada
      - Si NO configurado:
        [ApiStatusBanner para imagen]

   c. Tras imagen → sugiere video:
      → "Generar video clip"
      → "Generar otra versión de imagen"
      → "Aprobar escena"
```

### 4.2 Flujo: Narración de video

```
USUARIO: "Genera la narración del video"

1. IA consulta video + scenes (ordered by sort_order)
2. SI no hay narration_text en video_narrations:
   IA: "No hay texto de narración aún. ¿Quieres que lo genere basándome en las escenas?"
   → "Sí, genera narración"
   → "Prefiero escribirla yo"

3. SI hay texto:
   IA: "Esta es la narración actual del video:"
   [NarrationBlock con texto editable + audio si existe]
   
4. Para generar audio:
   - Verificar tts_provider en project_ai_settings
   - Verificar user_api_keys con provider matching
   - Si OK → generar → INSERT en video_narrations (nueva versión)
   - Si NO → ApiStatusBanner para TTS
```

### 4.3 Flujo: Compartir para review

```
USUARIO: "Comparte las escenas del video para review"

1. IA: "Creo un link de revisión para el cliente:"
   
   ┌──────────────────────────────────────────┐
   │ 🔗 Compartir para revisión               │
   │                                          │
   │ Escenas: ○ Todas  ● Selección            │
   │ [✓] #1 Hook  [✓] #2 Build  [ ] #3 Peak  │
   │                                          │
   │ Opciones:                                │
   │ [✓] Permitir anotaciones                 │
   │ [ ] Requiere contraseña                  │
   │ Expira: [7 días ▾]                       │
   │                                          │
   │ [Crear link]                              │
   └──────────────────────────────────────────┘

2. Al crear → INSERT en scene_shares
3. Muestra link copiable

4. DESPUÉS, si el cliente dejó anotaciones:
   USUARIO: "¿Hay comentarios del cliente?"
   IA: "El cliente dejó 3 anotaciones en la escena #2:"
   [AnnotationsBlock con los comentarios]
   → "Resolver anotación 1"
   → "Responder al cliente"
   → "Aplicar cambios sugeridos"
```

### 4.4 Flujo: Análisis de video

```
USUARIO: "Analiza el video"

1. IA verifica si hay video_analysis reciente
   - Si hay con is_current = true → muestra existente
   - Si no hay → genera nuevo análisis

2. IA: "Análisis completo de Sunset Adventures:"
   
   ┌──────────────────────────────────────────┐
   │ 📊 Video Analysis     Score: 78/100      │
   │                                          │
   │ Resumen: El video tiene buena estructura │
   │ narrativa pero el pacing necesita...     │
   │                                          │
   │ ✓ FORTALEZAS                             │
   │   • Arco narrativo bien definido         │
   │   • Consistencia visual entre escenas    │
   │                                          │
   │ ⚠ DEBILIDADES                            │
   │   • Escena #2 demasiado larga            │
   │   • Falta transición entre #1 y #2       │
   │                                          │
   │ 💡 SUGERENCIAS                           │
   │   [Aplicar] Acortar escena #2 a 5s       │
   │   [Aplicar] Añadir escena filler         │
   │   [Aplicar] Cambiar cámara en #3         │
   └──────────────────────────────────────────┘
   
   Cada [Aplicar] ejecuta la acción correspondiente.
```

### 4.5 Flujo: Extensión de video clips

```
USUARIO: "Extiende el clip de la escena 2"

1. IA consulta scene_video_clips where scene_id = X
2. Verifica:
   - ¿Hay clip base? → necesita last_frame_url para extender
   - ¿video_provider configurado?
   - ¿video_supports_extension = true?

3. SI todo OK:
   IA: "Extendiendo el clip de la escena #2..."
   [Progreso: Analizando último frame → Generando extensión → Concatenando]
   → INSERT en scene_video_clips con parent_clip_id + extension_number

4. SI falta provider:
   [ApiStatusBanner para video]
   
5. SI no soporta extensión:
   IA: "El provider {name} no soporta extensión de clips. 
        Puedes generar un clip nuevo o cambiar a un provider compatible."
```

### 4.6 Flujo: Activity log

```
USUARIO: "¿Qué se hizo ayer en el proyecto?"

IA: "Actividad de ayer en Project Alpha:"

┌──────────────────────────────────────────────┐
│ 📋 Actividad — 25 Mar 2026                   │
│                                              │
│ 14:32  ✏️ Editado personaje Juan             │
│            Cambió descripción y personalidad │
│                                              │
│ 13:15  ✨ Generada imagen escena #2          │
│            Con Midjourney v6                  │
│                                              │
│ 11:20  ➕ Creado fondo "Callejón Noir"       │
│            Por @usuario                       │
│                                              │
│ 10:05  📝 Creada tarea "Revisar casting"     │
│            Prioridad: alta · Fecha: 27 Mar   │
└──────────────────────────────────────────────┘

Sugerencias:
→ "Ver detalle de los cambios en Juan"
→ "Ver imagen generada de escena #2"
→ "Actividad de esta semana"
```

---

## 5. Sistema "Compacto + Expandir"

### 5.1 Patrón visual

Todos los componentes principales siguen este patrón:

```
┌─ HEADER (siempre visible) ────────────────┐
│ [Icon] Nombre · Rol/tipo · [Status badge] │
│ Subtítulo con dato clave                  │
│                                   [▸ Abrir]│
├───────────────────────────────────────────┤
│ ▸ Sección expandible 1  (N items)         │  ← click expande
│ ▸ Sección expandible 2  (N items)         │
│ ▸ Sección expandible 3  (N items)         │
├───────────────────────────────────────────┤
│ [Acción 1] [Acción 2] [Acción 3]         │  ← botones siempre visibles
└───────────────────────────────────────────┘
```

### 5.2 Reglas

- El header **siempre** muestra los datos más importantes
- Las secciones expandibles muestran el **count** entre paréntesis
- Al expandir, los datos se cargan con **stagger animation**
- Si una sección no tiene datos, muestra "(vacío)" en gris y sugiere crearlos
- Los **botones de acción** siempre están visibles, no se esconden en expandibles
- El botón "Abrir página" es sutil, al final del header o en la esquina

### 5.3 Qué secciones tiene cada componente

**CharacterCard expandible:**
1. Identidad visual → `hair_description` + `signature_clothing` + `accessories` + `signature_tools`
2. Galería de imágenes → join `character_images` (count)
3. Reglas de consistencia → `rules` JSON formateado
4. Escenas donde aparece → join `scene_characters` + `scenes` (count)
5. Prompt completo → `ai_prompt_description` + `prompt_snippet`

**BackgroundCard expandible:**
1. Ángulos disponibles → `available_angles[]`
2. Análisis visual IA → `ai_visual_analysis` JSON
3. Prompt → `ai_prompt_description` + `prompt_snippet`
4. Escenas donde se usa → join `scene_backgrounds` + `scenes`

**SceneCard expandible (vista completa):**
1. Cámara → join `scene_camera` (ángulo + movimiento + luz + mood)
2. Prompts → join `scene_prompts` con versiones
3. Media generado → join `scene_media` (imágenes + videos)
4. Video clips → join `scene_video_clips` con extensiones
5. Anotaciones → join `scene_annotations`

**VideoCard expandible:**
1. Escenas → join `scenes` (lista compacta)
2. Narración → join `video_narrations` (texto + audio)
3. Análisis → join `video_analysis`
4. Arco narrativo → join `narrative_arcs`
5. Exportaciones → join `exports`

---

## 6. Gestión de APIs Premium

### 6.1 Qué acciones requieren API

| Acción | Provider en `project_ai_settings` | Tabla destino |
|--------|-----------------------------------|---------------|
| Generar imagen de escena | `image_provider` | `scene_media` |
| Generar video clip | `video_provider` | `scene_video_clips` |
| Extender video clip | `video_provider` + `video_supports_extension` | `scene_video_clips` |
| Generar voiceover | `tts_provider` | `video_narrations` |
| Analizar imagen de referencia | `vision_provider` + `vision_model` | `ai_visual_analysis` en characters/backgrounds |
| Generar imagen de personaje | `image_provider` | `character_images` |

### 6.2 Lógica de verificación

```typescript
// Pseudocódigo para verificar antes de cualquier generación
async function canGenerate(projectId: string, type: 'image' | 'video' | 'tts' | 'vision') {
  const settings = await getProjectAiSettings(projectId);
  const providerField = {
    image: 'image_provider',
    video: 'video_provider', 
    tts: 'tts_provider',
    vision: 'vision_provider'
  }[type];
  
  const provider = settings[providerField];
  if (!provider) return { ok: false, reason: 'no_provider_configured' };
  
  const apiKey = await getUserApiKey(userId, provider);
  if (!apiKey || !apiKey.is_active) return { ok: false, reason: 'no_api_key' };
  if (apiKey.last_error) return { ok: false, reason: 'api_error', error: apiKey.last_error };
  
  // Check budget
  if (apiKey.monthly_budget_usd && apiKey.monthly_spent_usd >= apiKey.monthly_budget_usd) {
    return { ok: false, reason: 'budget_exceeded' };
  }
  
  return { ok: true, provider, apiKey };
}
```

### 6.3 Variantes del ApiStatusBanner

**Sin provider configurado:**
```
⚡ Para generar imágenes, configura un provider de imagen en tu proyecto.
   Compatibles: Midjourney, DALL-E 3, Stable Diffusion XL
   [Ir a configuración del proyecto]
```

**Sin API key:**
```
🔑 El proyecto usa {provider} pero no tienes API key configurada.
   [Añadir API key de {provider}]
```

**API key con error:**
```
⚠️ Tu API key de {provider} tiene un error: "{last_error}"
   Último intento: {last_error_at}
   [Verificar API key] [Cambiar provider]
```

**Presupuesto agotado:**
```
💰 Has alcanzado tu límite mensual de {monthly_budget_usd}$ en {provider}.
   Gastado: {monthly_spent_usd}$ · Se resetea: {budget_reset_at}
   [Aumentar límite] [Cambiar provider]
```

---

## 7. Mapeo comando → componente (actualizado con BD real)

| Texto del usuario | Componente | Datos que consulta |
|-------------------|-----------|-------------------|
| "crear personaje {nombre}" | Dock: Character | INSERT `characters` |
| "crear fondo {nombre}" | Dock: Background | INSERT `backgrounds` |
| "crear video {título}" | Dock: Video | INSERT `videos` |
| "ver personaje {nombre}" | CharacterCard (completo) | `characters` + `character_images` + `scene_characters` |
| "personajes" | Lista CharacterCard (compacto) | `characters` WHERE project_id |
| "ver fondo {nombre}" | BackgroundCard (completo) | `backgrounds` + `scene_backgrounds` |
| "fondos" / "locaciones" | Lista BackgroundCard (compacto) | `backgrounds` WHERE project_id |
| "ver escena {n}" | SceneCard (completo) | `scenes` + todos los joins |
| "escenas" / "plan" | Lista SceneCard (compacto) | `scenes` WHERE video_id ORDER BY sort_order |
| "detalle video" / "resumen video" | VideoCard (completo) | `videos` + joins |
| "resumen proyecto" | ProjectOverview | `projects` + stats de todas las tablas |
| "generar prompt escena {n}" | PromptBlock + INSERT | `scene_prompts` INSERT |
| "generar imagen escena {n}" | MediaGallery + generación | Verifica API → `scene_media` INSERT |
| "generar narración" | NarrationBlock | `video_narrations` |
| "generar voiceover" | NarrationBlock + audio | Verifica API TTS → `video_narrations` UPDATE |
| "analizar video" | AnalysisBlock | `video_analysis` |
| "compartir escenas" | ShareBlock (dock) | `scene_shares` INSERT |
| "anotaciones" / "comentarios cliente" | AnnotationsBlock | `scene_annotations` WHERE scene_share_id |
| "configurar cámara escena {n}" | CameraBlock (dock) | `scene_camera` INSERT/UPDATE |
| "casting" | CastingBlock | `scene_characters` + `scene_backgrounds` por escena |
| "estilos" / "style preset" | StyleBlock | `style_presets` WHERE project_id |
| "templates" / "plantillas" | TemplateBlock | `prompt_templates` WHERE project_id |
| "tareas" | Lista TaskCard | `tasks` WHERE project_id |
| "crear tarea {título}" | TaskCard + INSERT | `tasks` INSERT |
| "qué se hizo hoy/ayer" | ActivityBlock | `activity_log` WHERE project_id + date filter |
| "exportar video" | ExportBlock + INSERT | `exports` INSERT |
| "publicar en {plataforma}" | PublishBlock | `publications` + `social_profiles` |
| "estado de APIs" | ApiStatusBanner | `project_ai_settings` + `user_api_keys` |
| "genera la escena {n}" | SceneReadiness → GenerationFlow | Verifica todo → flujo completo |
| "genera todos los prompts" | BatchGenerator | Loop `scenes` → `scene_prompts` INSERT |
| "extiende clip escena {n}" | ClipBlock | `scene_video_clips` con extension |
| "tiempo trabajado" | TimeBlock | `time_entries` WHERE project_id |

---

## 8. Navegación desde el chat

### 8.1 El chat puede hacer que la app navegue

El chat vive en un panel lateral o flotante. Cuando la IA muestra un componente con botón "Abrir página", la acción es:

```typescript
// El chat dispara eventos de navegación
function navigateToResource(type: string, id: string, projectId: string) {
  const routes = {
    character: `/p/${projectSlug}/characters/${id}`,
    background: `/p/${projectSlug}/backgrounds/${id}`,
    scene: `/p/${projectSlug}/videos/${videoSlug}/scenes/${sceneNumber}`,
    video: `/p/${projectSlug}/videos/${videoSlug}`,
    project: `/p/${projectSlug}`,
    task: `/p/${projectSlug}/tasks/${id}`,
    settings: `/p/${projectSlug}/settings`,
    apiKeys: `/settings/api-keys`,
  };
  router.push(routes[type]);
}
```

### 8.2 El botón "Abrir página"

Visual: botón sutil al final del componente, no prominente pero siempre accesible.

```
[↗ Abrir en página]  — texto gris, sin borde, hover muestra subrayado
```

### 8.3 La IA puede sugerir navegar

Cuando el contexto lo requiere, la IA puede sugerir navegar:

```
IA: "Para editar los campos avanzados de Juan (reglas, imágenes), 
     te recomiendo abrir su página completa."
     
Sugerencias:
→ "Abrir página de Juan"          ← navega
→ "Editar aquí en el chat"        ← abre dock
→ "Regenerar prompt visual"       ← acción en chat
```

---

## 9. Enums completos para selectores

### 9.1 Todos los enums de la BD que necesitan UI

**arc_phase** → selector en SceneCard:
`hook` | `build` | `peak` | `close`

**camera_angle** → selector en CameraBlock:
`wide` | `medium` | `close_up` | `extreme_close_up` | `pov` | `low_angle` | `high_angle` | `birds_eye` | `dutch` | `over_shoulder`

**camera_movement** → selector en CameraBlock:
`static` | `dolly_in` | `dolly_out` | `pan_left` | `pan_right` | `tilt_up` | `tilt_down` | `tracking` | `crane` | `handheld` | `orbit`

**scene_status** → pipeline visual:
`draft` → `prompt_ready` → `generating` → `generated` → `approved` | `rejected`

**scene_type** → badge en SceneCard:
`original` | `improved` | `new` | `filler` | `video`

**video_status** → pipeline en VideoCard:
`draft` → `prompting` → `generating` → `review` → `approved` → `exported`

**video_type** → badge en VideoCard:
`long` | `short` | `reel` | `story` | `ad` | `custom`

**target_platform** → selector en dock Video:
`youtube` | `instagram_reels` | `tiktok` | `tv_commercial` | `web` | `custom`

**project_style** → selector en ProjectCard:
`pixar` | `realistic` | `anime` | `watercolor` | `flat_2d` | `cyberpunk` | `custom`

**task_category** → selector en dock Task:
`script` | `prompt` | `image_gen` | `video_gen` | `review` | `export` | `meeting` | `voiceover` | `editing` | `issue` | `annotation` | `other`

**task_priority** → badge en TaskCard:
`low` | `medium` | `high` | `urgent`

**task_status** → pipeline en TaskCard:
`pending` → `in_progress` → `in_review` → `completed` | `blocked`

**prompt_type** → tab en PromptBlock:
`image` | `video` | `narration` | `analysis`

**media_type** → filtro en MediaGallery:
`image` | `video` | `audio`

**export_format** → selector en ExportBlock:
`html` | `json` | `markdown` | `pdf` | `mp4` | `mov`

---

## 10. Contextos actualizados (con acciones reales)

### 10.1 Dashboard

**Popover `+`:**
- CREAR: Nuevo proyecto
- VER: Mis proyectos, Todos los personajes, Todos los fondos
- HERRAMIENTAS: Tareas globales, Estado de APIs, Actividad reciente

### 10.2 Proyecto

**Popover `+`:**
- CREAR: Nuevo video, Personaje, Fondo, Tarea, Style preset
- VER: Resumen proyecto, Personajes (lista), Fondos (lista), Videos (lista), Tareas, Actividad
- VER DETALLE: Ver {nombre personaje}, Ver {nombre fondo} (accesos directos)
- CONFIGURAR: Paleta de colores, Reglas globales de prompt, AI settings, Templates

### 10.3 Video

**Popover `+`:**
- ESCENAS: Plan de escenas, Storyboard, Añadir escena, Arco narrativo
- GENERAR: Prompt imagen, Prompt video, Narración, Generar todos los prompts (batch)
- RECURSOS: Personajes, Fondos, Casting por escena, Compartir para review
- ANÁLISIS: Analizar video, Exportar, Actividad del video
- VER DETALLE: Ver escena #{n} (por cada escena)

### 10.4 Escena

**Popover `+`:**
- EDITAR: Detalle escena, Configurar cámara, Cambiar personaje, Cambiar fondo, Diálogo, Notas director
- GENERAR: Prompt de imagen, Prompt de video, Generar imagen, Generar clip, Extender clip
- REVISAR: Ver media generado, Compartir escena, Anotaciones del cliente, Aprobar/Rechazar
- ANÁLISIS: Analizar escena, Comparar versiones, Historial de cambios

---

## 11. Checklist de implementación

### 11.1 Componentes nuevos a crear

| Componente | Prioridad | Tablas involucradas |
|-----------|-----------|-------------------|
| `CharacterCard` (con expandir) | P0 | characters, character_images, scene_characters |
| `BackgroundCard` (con expandir) | P0 | backgrounds, scene_backgrounds |
| `SceneCard` (con pipeline) | P0 | scenes + todos los joins |
| `VideoCard` (con expandir) | P0 | videos + joins |
| `SceneReadiness` | P0 | scenes + verificación de joins |
| `ApiStatusBanner` | P0 | project_ai_settings, user_api_keys |
| `PromptBlock` (versionado) | P1 | scene_prompts |
| `CameraBlock` (con enums reales) | P1 | scene_camera |
| `NarrationBlock` | P1 | video_narrations |
| `AnalysisBlock` | P1 | video_analysis |
| `CastingBlock` | P1 | scene_characters + scene_backgrounds |
| `MediaGallery` | P1 | scene_media |
| `ShareBlock` | P2 | scene_shares |
| `AnnotationsBlock` | P2 | scene_annotations |
| `ActivityBlock` | P2 | activity_log |
| `StyleBlock` | P2 | style_presets |
| `TemplateBlock` | P2 | prompt_templates |
| `ClipBlock` | P2 | scene_video_clips |
| `ExportBlock` | P2 | exports |
| `ArcTimeline` | P3 | narrative_arcs |
| `PublishBlock` | P3 | publications, social_profiles |
| `TimeBlock` | P3 | time_entries |
| `CommentsBlock` | P3 | comments |
| `BatchGenerator` | P3 | loop scenes → prompts |
| `ProjectOverview` (stats) | P1 | aggregation queries |

### 11.2 Docks a crear/modificar

| Dock | Campos del form | Tabla INSERT |
|------|----------------|-------------|
| Crear personaje | name, role, description, personality, hair, clothing, accessories, tools, prompt | characters |
| Crear fondo | name, location_type, time_of_day, description, available_angles, prompt | backgrounds |
| Crear video | title, video_type, platform, aspect_ratio, target_duration, description | videos |
| Crear escena | title, scene_type, arc_phase, duration, description, dialogue, director_notes | scenes |
| Crear tarea | title, category, priority, due_date, description, assigned_to, scene_id, video_id | tasks |
| Configurar cámara | camera_angle, camera_movement, lighting, mood, camera_notes | scene_camera |
| Compartir review | scene_ids, allow_annotations, password, expires_at | scene_shares |
| Elije (opciones IA) | opciones dinámicas | n/a (decisión de flujo) |

---

*Documento V8 — basado en schema real de Supabase con 30+ tablas analizadas. Actualizar al añadir tablas nuevas.*
