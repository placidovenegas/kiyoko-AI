# PROMPT DE IMPLEMENTACIÓN — Kiyoko AI Chat V8

> Este documento es el prompt maestro para el editor de código (Claude Code, Cursor, etc.).
> Contiene todas las instrucciones necesarias para implementar el chat de Kiyoko AI
> conectado a la base de datos real de Supabase.

---

## CONTEXTO DEL PROYECTO

Kiyoko AI es una plataforma de producción de video con IA. El usuario crea proyectos, dentro de cada proyecto hay videos, dentro de cada video hay escenas. Cada escena tiene personajes, fondos, cámara, prompts, media generado, y video clips. La IA asiste en todo el proceso: crear entidades, generar prompts, lanzar generaciones, analizar videos, gestionar tareas, y compartir con clientes.

El chat es el **centro de control** de la aplicación. No es solo un visor — puede ejecutar acciones reales en la BD, navegar la app, y orquestar flujos de producción completos.

---

## DOCUMENTOS DE REFERENCIA

Antes de implementar cualquier cosa, **lee estos documentos** en orden:

1. **`docs/v6/MY DOCUMENT/kiyoko-v8-especificacion-completa.md`** — Especificación técnica V8. Contiene:
   - Mapa completo de tablas BD → componentes (sección 2)
   - Campos exactos por componente con ASCII mockups (sección 3)
   - 6 flujos de producción paso a paso (sección 4)
   - Sistema "compacto + expandir" (sección 5)
   - Gestión de APIs premium con ApiStatusBanner (sección 6)
   - Mapeo comando → componente → datos (sección 7)
   - Navegación desde el chat (sección 8)
   - Todos los enums de BD para selectores (sección 9)
   - Contextos actualizados con acciones reales (sección 10)
   - Checklist de implementación con prioridades (sección 11)

2. **`docs/v6/MY DOCUMENT/kiyoko-comportamiento-chat.md`** — Comportamiento de la IA. Contiene:
   - Regla de oro: siempre texto typewriter ANTES del componente (sección 1)
   - Frases intro por tipo de acción con variaciones (sección 2)
   - Detección de contexto: dashboard/proyecto/video/escena (sección 3)
   - Sugerencias post-acción por componente y contexto (sección 4)
   - Flujos paso a paso: mostrar, crear, cancelar, navegar (sección 5)
   - Manejo de errores y casos especiales (sección 6)
   - Tono y personalidad de Kiyoko (sección 7)
   - Popover del botón + con contenido por contexto (sección 8)
   - Máquina de estados IDLE→THINK→STREAM→DOCK→SAVE→DONE (sección 10)

3. **`docs/v6/MY DOCUMENT/kiyoko-v7-ux-spec.md`** — Tokens visuales y animaciones. Contiene:
   - Tokens de color exactos (sección 1.2)
   - Estructura del layout: sidebar, header, mensajes, input (sección 2)
   - Cómo el dock se conecta con el input (sección 3)
   - Flujo de mensajes: usuario, asistente, thinking, streaming (sección 4)
   - Animaciones: up, dockIn, fadeIn, blink, pulse, spin (sección 10)
   - Estados visuales de chips, botones, cards, badges (sección 9)

4. **`docs/v6/MY DOCUMENT/kiyoko-v7-plan-mejoras-ui.md`** — Plan de mejoras UI/UX. Contiene:
   - Resumen de gaps entre prototipo y producción
   - Decisiones sobre dock vs modal
   - Mapa de prioridades P0-P3

5. **`docs/v6/MY DOCUMENT/kiyoko-chat-prototype.jsx`** — Prototipo de referencia visual. Úsalo para:
   - Ver el estilo visual de referencia (colores, espaciados, tipografía)
   - Entender las animaciones (dockIn, stagger, typewriter)
   - NO copiar la lógica — el V8 la reemplaza por completo

---

## REGLAS FUNDAMENTALES

### 1. El chat SIEMPRE sigue esta secuencia

```
Usuario envía mensaje
  → THINK: dots pulsantes (800-1200ms)
  → STREAM: texto typewriter de la IA (12-16ms por carácter)
  → Pausa 300ms
  → COMPONENTE: se renderiza debajo del texto con animación blockIn
  → SUGERENCIAS: aparecen debajo con stagger (50ms entre cada una)
```

**NUNCA** mostrar un componente sin texto previo de la IA.
**NUNCA** mostrar texto genérico — siempre incluir datos reales (nombre, número, estado).
**NUNCA** mostrar sugerencias antes de que el componente termine de animar.

### 2. Los componentes leen de la BD real

Cada componente recibe datos de Supabase. No hay datos hardcodeados. Si una tabla está vacía, el componente muestra un estado vacío con sugerencia de crear.

```typescript
// Patrón para cada componente
interface ComponentProps {
  data: Tables<'tabla_principal'>;         // Datos principales
  relations?: {                             // Datos de joins
    characters?: Tables<'characters'>[];
    scenes?: Tables<'scenes'>[];
    // etc.
  };
  context: {
    projectId: string;
    videoId?: string;
    sceneId?: string;
  };
  onAction: (action: string, payload?: any) => void;  // Callback para acciones
  onNavigate: (route: string) => void;                 // Callback para navegación
}
```

### 3. El sistema "compacto + expandir"

Todos los componentes principales (Character, Background, Scene, Video) siguen este patrón:

```
HEADER (siempre visible)
  → Datos clave: nombre, rol/tipo, status badge
  → Botón "Abrir página" sutil al final

SECCIONES EXPANDIBLES (click para abrir/cerrar)
  → "▸ Identidad visual (5 campos)"
  → "▸ Galería de imágenes (3)"
  → "▸ Escenas donde aparece (2)"
  → Cada una muestra count entre paréntesis
  → Al expandir: datos con stagger animation
  → Si vacía: texto gris + sugerencia de crear

ACCIONES (siempre visibles debajo)
  → Botones de acción principales
  → Nunca se esconden dentro de expandibles
```

### 4. Gestión de APIs premium

Antes de cualquier generación (imagen, video, voiceover), verificar:

```typescript
// 1. ¿Hay provider configurado en project_ai_settings?
const settings = await supabase
  .from('project_ai_settings')
  .select('*')
  .eq('project_id', projectId)
  .single();

// 2. ¿Hay API key activa para ese provider?
const apiKey = await supabase
  .from('user_api_keys')
  .select('*')
  .eq('user_id', userId)
  .eq('provider', settings.image_provider)
  .eq('is_active', true)
  .single();

// 3. Si falta algo → mostrar ApiStatusBanner dentro del componente
// 4. Si hay error → mostrar warning
// 5. Si presupuesto agotado → mostrar aviso de límite
```

El banner se muestra **dentro** del componente, no como modal ni toast. Es un bloque visual con:

- Icono + texto explicativo
- Botón "Ir a configuración" que navega a settings
- Providers compatibles listados

### 5. El chat puede hacer que la app navegue

```typescript
// El chat dispara navegación sin cerrarse
const navigateToResource = (type: string, id: string) => {
  const routes: Record<string, string> = {
    character: `/p/${projectSlug}/characters/${id}`,
    background: `/p/${projectSlug}/backgrounds/${id}`,
    scene: `/p/${projectSlug}/videos/${videoSlug}/scenes/${sceneNumber}`,
    video: `/p/${projectSlug}/videos/${videoSlug}`,
    project: `/p/${projectSlug}`,
    settings: `/p/${projectSlug}/settings`,
    apiKeys: `/settings/api-keys`,
  };
  router.push(routes[type]);
  // El chat NO se cierra — sigue abierto al lado
};
```

### 6. Detección de contexto

El chat detecta automáticamente dónde está el usuario:

```typescript
type ChatContext = 'dashboard' | 'project' | 'video' | 'scene';

function detectContext(): ChatContext {
  // Si hay sceneId seleccionado → 'scene'
  // Si hay videoId seleccionado → 'video'
  // Si hay projectId → 'project'
  // Si no → 'dashboard'
}
```

El contexto cambia: placeholder del input, opciones del popover `+`, sugerencias post-acción, y el tono de la IA. Ver sección 3 de `kiyoko-comportamiento-chat.md` para los detalles de cada contexto.

---

## MÁQUINA DE ESTADOS

```typescript
enum ChatPhase {
  IDLE = 'idle',       // Listo para escribir
  THINK = 'think',     // Dots pulsantes
  STREAM = 'stream',   // Texto typewriter
  DOCK = 'dock',       // Dock/overlay visible (creación)
  SAVE = 'save',       // Guardando (progress steps)
  DONE = 'done',       // Cierre tras guardar
}
```

### Transiciones permitidas

```
IDLE → THINK         (usuario envía mensaje)
THINK → STREAM       (después de 800-1200ms)
STREAM → IDLE        (texto terminó, no hay dock)
STREAM → DOCK        (texto terminó, hay dock: crear/elegir)
DOCK → SAVE          (usuario pulsa "Crear")
DOCK → IDLE          (usuario pulsa "Cancelar")
SAVE → DONE          (guardado completó)
DONE → IDLE          (automático tras mostrar resultado)
```

### Durante cada fase

| Fase | Input | Mensajes | Dock |
|------|-------|----------|------|
| IDLE | Activo, placeholder contextual | Opacity 1 | Ninguno |
| THINK | Disabled, "Pensando..." | Opacity 1 | Ninguno |
| STREAM | Disabled | Opacity 1 | Ninguno |
| DOCK | Disabled, "Creando..." | Opacity 0.2 | Visible, animado dockIn |
| SAVE | Disabled | Opacity 0.2 | Progress steps |
| DONE | Activo | Opacity 1 | Se cierra |

---

## ESTRUCTURA DE MENSAJES

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;                    // Texto del mensaje
  block?: string;                     // Tipo de componente a renderizar
  blockData?: any;                    // Datos del componente (de BD)
  entity?: {                          // Para resultados de creación
    name: string;
    type: string;
    id: string;
  };
  suggestions?: string[];             // Sugerencias post-acción
  timestamp: string;
}
```

### Tipos de contenido especial

| content | Significado |
|---------|-------------|
| `"__stream__"` | Mensaje en streaming (mostrar typewriter + cursor) |
| `"__result__"` | Resultado de creación (mostrar ResultCard con celebración) |
| `"__cancel__"` | Cancelación (mostrar CancelCard empática) |
| Cualquier otro | Texto normal del asistente |

---

## IMPLEMENTACIÓN DE COMPONENTES

### Patrón base para todos los componentes del chat

```typescript
// Cada componente del chat sigue este patrón:

interface ChatBlockProps {
  data: any;                          // Datos de la BD
  onAction: (cmd: string) => void;    // Ejecuta comando como si el usuario lo escribiera
  onNavigate: (route: string) => void; // Navega a una página
  context: ChatContext;               // dashboard | project | video | scene
}

// El componente se renderiza con animación blockIn
// Las filas internas usan stagger (30ms + index * 50ms)
// Las secciones expandibles usan slideDown al abrir
```

### Cómo se conecta un comando a un componente

```typescript
// 1. Usuario escribe o pulsa sugerencia
// 2. Se busca en el mapa de comandos (ver sección 7 del V8)
// 3. Se obtienen los datos de Supabase
// 4. Se monta el mensaje con block + blockData

async function executeCommand(text: string, context: ChatContext) {
  const command = matchCommand(text); // Ver tabla de mapeo en V8 sección 7

  if (command.dock) {
    // Es una creación → abrir dock después del streaming
    return { aiText: command.aiText, dock: command.dock };
  }

  if (command.block) {
    // Es un componente inline → obtener datos y renderizar
    const data = await fetchBlockData(command.block, context);
    return {
      aiText: command.aiText,
      block: command.block,
      blockData: data,
      suggestions: getSuggestions(command.block, context)
    };
  }

  // Es una conversación normal
  return { aiText: await generateAIResponse(text, context) };
}
```

### Cómo obtener datos para cada bloque

```typescript
async function fetchBlockData(block: string, context: ChatContext) {
  const { projectId, videoId, sceneId } = context;

  switch (block) {
    case 'chardetail':
      return await supabase
        .from('characters')
        .select(`
          *,
          character_images(*),
          scene_characters(*, scenes(title, scene_number, status))
        `)
        .eq('id', characterId)
        .single();

    case 'charlist':
      return await supabase
        .from('characters')
        .select('*, character_images(file_url, is_primary)')
        .eq('project_id', projectId)
        .order('sort_order');

    case 'scene':
      return await supabase
        .from('scenes')
        .select(`
          *,
          scene_camera(*),
          scene_characters(*, characters(name, initials, color_accent)),
          scene_backgrounds(*, backgrounds(name, location_type, time_of_day)),
          scene_prompts(*, is_current),
          scene_media(*, is_current),
          scene_video_clips(*),
          scene_annotations(*)
        `)
        .eq('id', sceneId)
        .single();

    case 'videosum':
      return await supabase
        .from('videos')
        .select(`
          *,
          scenes(id, title, scene_number, status, arc_phase, duration_seconds),
          video_narrations(*, is_current),
          video_analysis(*, is_current),
          narrative_arcs(*)
        `)
        .eq('id', videoId)
        .single();

    case 'project':
      // Stats agregadas
      const [chars, bgs, vids, scenes, tasks] = await Promise.all([
        supabase.from('characters').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('backgrounds').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('videos').select('id, status', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('scenes').select('id, status', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('tasks').select('id, status', { count: 'exact' }).eq('project_id', projectId),
      ]);
      return { project, counts: { chars, bgs, vids, scenes, tasks } };

    case 'tasks':
      return await supabase
        .from('tasks')
        .select('*, profiles!assigned_to(full_name, avatar_url)')
        .eq('project_id', projectId)
        .order('sort_order');

    case 'activity':
      return await supabase
        .from('activity_log')
        .select('*, profiles!user_id(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

    case 'narration':
      return await supabase
        .from('video_narrations')
        .select('*')
        .eq('video_id', videoId)
        .order('version', { ascending: false });

    case 'analysis':
      return await supabase
        .from('video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .eq('is_current', true)
        .single();

    case 'share':
      return await supabase
        .from('scene_shares')
        .select('*, scene_annotations(*)')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

    case 'readiness':
      // Verificar qué tiene y qué falta la escena
      const scene = await fetchBlockData('scene', context);
      return {
        hasCharacter: scene.scene_characters?.length > 0,
        hasBackground: scene.scene_backgrounds?.length > 0,
        hasCamera: !!scene.scene_camera,
        hasPrompt: scene.scene_prompts?.some(p => p.is_current),
        hasImage: scene.scene_media?.some(m => m.media_type === 'image' && m.is_current),
        hasVideo: scene.scene_video_clips?.length > 0,
        scene,
      };

    // ... más bloques según sección 7 del V8
  }
}
```

---

## ACCIONES QUE MODIFICAN LA BD

### Crear entidad (desde dock)

```typescript
// Al pulsar "Crear personaje" en el dock:
async function createCharacter(formData: CharacterForm, projectId: string) {
  // 1. Validar campos obligatorios
  if (!formData.name) throw new Error('Nombre requerido');

  // 2. INSERT en BD
  const { data, error } = await supabase
    .from('characters')
    .insert({
      name: formData.name,
      initials: formData.name.substring(0, 2).toUpperCase(),
      role: formData.role || 'Protagonista',
      description: formData.description,
      personality: formData.personality,
      hair_description: formData.hair,
      signature_clothing: formData.clothing,
      accessories: formData.accessories,
      signature_tools: formData.tools,
      prompt_snippet: formData.promptSnippet,
      project_id: projectId,
    })
    .select()
    .single();

  // 3. Log de actividad
  await supabase.from('activity_log').insert({
    action: 'created',
    entity_type: 'character',
    entity_id: data.id,
    description: `Creado personaje "${data.name}"`,
    project_id: projectId,
  });

  // 4. Retornar para el ResultCard
  return { name: data.name, type: 'character', id: data.id };
}
```

### Generar prompt (acción de IA)

```typescript
async function generateScenePrompt(sceneId: string, promptType: 'image' | 'video') {
  // 1. Obtener escena con todos los datos
  const scene = await fetchBlockData('scene', { sceneId });

  // 2. Construir contexto para la IA
  const context = buildPromptContext(scene); // personaje, fondo, cámara, estilo...

  // 3. Generar con IA (esto es un call al backend, no directamente a OpenAI)
  const prompt = await generateWithAI('prompt_generation', context);

  // 4. Obtener versión actual más alta
  const { data: existing } = await supabase
    .from('scene_prompts')
    .select('version')
    .eq('scene_id', sceneId)
    .eq('prompt_type', promptType)
    .order('version', { ascending: false })
    .limit(1);

  const newVersion = (existing?.[0]?.version || 0) + 1;

  // 5. Marcar anteriores como no current
  await supabase
    .from('scene_prompts')
    .update({ is_current: false })
    .eq('scene_id', sceneId)
    .eq('prompt_type', promptType);

  // 6. INSERT nuevo prompt
  const { data } = await supabase
    .from('scene_prompts')
    .insert({
      scene_id: sceneId,
      prompt_text: prompt,
      prompt_type: promptType,
      version: newVersion,
      is_current: true,
    })
    .select()
    .single();

  // 7. Actualizar status de la escena
  await supabase
    .from('scenes')
    .update({ status: 'prompt_ready' })
    .eq('id', sceneId);

  return data;
}
```

### Verificar API antes de generar

```typescript
async function checkApiAvailability(
  projectId: string,
  userId: string,
  type: 'image' | 'video' | 'tts' | 'vision'
): Promise<{ available: boolean; banner?: ApiStatusBannerData }> {

  const { data: settings } = await supabase
    .from('project_ai_settings')
    .select('*')
    .eq('project_id', projectId)
    .single();

  const providerMap = {
    image: settings?.image_provider,
    video: settings?.video_provider,
    tts: settings?.tts_provider,
    vision: settings?.vision_provider,
  };

  const provider = providerMap[type];

  if (!provider) {
    return {
      available: false,
      banner: {
        type: 'no_provider',
        message: `Para generar ${type === 'image' ? 'imágenes' : type === 'video' ? 'video' : type === 'tts' ? 'voiceover' : 'análisis visual'}, configura un provider en tu proyecto.`,
        action: { label: 'Ir a configuración', route: `/p/${projectSlug}/settings` },
      }
    };
  }

  const { data: apiKey } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single();

  if (!apiKey) {
    return {
      available: false,
      banner: {
        type: 'no_api_key',
        message: `El proyecto usa ${provider} pero no tienes API key configurada.`,
        action: { label: `Añadir API key de ${provider}`, route: '/settings/api-keys' },
      }
    };
  }

  if (apiKey.last_error) {
    return {
      available: false,
      banner: {
        type: 'api_error',
        message: `Tu API key de ${provider} tiene un error: "${apiKey.last_error}"`,
        action: { label: 'Verificar API key', route: '/settings/api-keys' },
      }
    };
  }

  if (apiKey.monthly_budget_usd && apiKey.monthly_spent_usd >= apiKey.monthly_budget_usd) {
    return {
      available: false,
      banner: {
        type: 'budget_exceeded',
        message: `Límite mensual alcanzado: ${apiKey.monthly_spent_usd}$ / ${apiKey.monthly_budget_usd}$`,
        action: { label: 'Aumentar límite', route: '/settings/api-keys' },
      }
    };
  }

  return { available: true };
}
```

---

## POPOVER DEL BOTÓN +

El contenido del popover cambia completamente según el contexto. Ver sección 10 del V8 para el contenido exacto de cada contexto. Cada ítem del popover al hacer click:

```typescript
function handlePopoverAction(cmd: string) {
  // Se envía como si el usuario lo hubiera escrito
  addMessage({ role: 'user', content: cmd });
  executeCommand(cmd, currentContext);
  closePopover();
}
```

Los ítems que dicen "Ver {nombre}" van **directos** al componente detalle, no a la lista.

---

## SUGERENCIAS POST-ACCIÓN

Después de cada componente, mostrar 3-6 sugerencias clickables. Las sugerencias cambian según:

1. Qué componente se acaba de mostrar
2. En qué contexto estamos (dashboard/proyecto/video/escena)
3. El estado de los datos (ej: si un personaje no tiene prompt, sugerir generarlo)

Ver sección 4 de `kiyoko-comportamiento-chat.md` para el mapeo completo de sugerencias por componente.

Las sugerencias son botones que al hacer click envían el texto como mensaje del usuario y repiten todo el flujo (THINK → STREAM → COMPONENTE → SUGERENCIAS).

---

## PRIORIDADES DE IMPLEMENTACIÓN

### P0 — Sin esto el chat no funciona

- [ ] Máquina de estados (IDLE → THINK → STREAM → DOCK → SAVE → DONE)
- [ ] Secuencia obligatoria: texto typewriter → componente → sugerencias
- [ ] CharacterCard con sistema compacto + expandir
- [ ] BackgroundCard con sistema compacto + expandir
- [ ] SceneCard con status pipeline visual
- [ ] VideoCard con expandir
- [ ] SceneReadiness (checklist de completitud)
- [ ] ApiStatusBanner (verificación de providers)
- [ ] Popover del + con contenido contextual
- [ ] Navegación desde el chat (router.push sin cerrar chat)
- [ ] Docks de creación: personaje, fondo, video, escena, tarea

### P1 — Experiencia completa de producción

- [ ] PromptBlock con versiones
- [ ] CameraBlock con los 10 ángulos y 11 movimientos del enum
- [ ] NarrationBlock con texto editable + player audio
- [ ] AnalysisBlock (video_analysis) con sugerencias accionables
- [ ] CastingBlock (personaje + fondo por escena)
- [ ] MediaGallery (imágenes y videos generados)
- [ ] ProjectOverview con stats agregadas
- [ ] TaskCard con categorías y prioridades del enum
- [ ] Dock de configurar cámara

### P2 — Review y colaboración

- [ ] ShareBlock (crear links de revisión)
- [ ] AnnotationsBlock (feedback del cliente)
- [ ] ActivityBlock (historial de cambios)
- [ ] StyleBlock (style presets)
- [ ] TemplateBlock (prompt templates)
- [ ] ClipBlock (video clips con extensiones)
- [ ] ExportBlock con progreso
- [ ] Dock de compartir review

### P3 — Nice to have

- [ ] ArcTimeline (arco narrativo visual)
- [ ] PublishBlock (publicaciones en redes)
- [ ] TimeBlock (tracking de tiempo)
- [ ] CommentsBlock (comentarios internos)
- [ ] BatchGenerator (generar todos los prompts)
- [ ] Flujo de extensión de clips

---

## TOKENS VISUALES DE REFERENCIA

```css
/* Colores principales */
--bg: #18181c;
--surface: #1e1e22;
--surface-raised: #222226;
--border: #2a2a2e;
--border-subtle: #252529;
--border-input: #333;

--text-primary: #ebebeb;
--text-secondary: #d4d4d8;
--text-muted: #a1a1aa;
--text-ghost: #71717a;
--text-hidden: #555;

--primary: #006fee;
--primary-light: #4da6ff;
--primary-gradient: linear-gradient(135deg, #006fee, #338af7);
--success: #17C964;
--warning: #F5A524;
--danger: #F31260;
--purple: #a78bfa;
--green: #4ade80;

/* Input (más claro que el fondo) */
--input-bg: #28282c;
--input-border: #3e3e42;

/* Dock */
--dock-bg: #222226;
--dock-border: #333;

/* Animaciones */
--ease-out: cubic-bezier(.22, 1, .36, 1);
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
```

---

## RECUERDA

1. **Lee los documentos de referencia ANTES de escribir código.** Las respuestas a casi todas las preguntas están ahí.
2. **Todo componente lee datos reales de Supabase.** No hardcodear datos de ejemplo en producción.
3. **El texto de la IA va ANTES del componente.** Siempre. Sin excepciones.
4. **Verifica APIs antes de generar.** Nunca asumir que el provider está configurado.
5. **El chat no se cierra al navegar.** Es un panel independiente que convive con la app.
6. **Usa los enums reales de la BD** para selectores (camera_angle, camera_movement, arc_phase, etc.).
7. **Las sugerencias son contextuales.** Cambian según componente + contexto + estado de los datos.
8. **El patrón compacto + expandir** es el estándar para todos los componentes principales.
9. **El status pipeline** (draft → approved) se muestra como barra visual con colores.
10. **Cuando falta algo para generar**, mostrar SceneReadiness con checklist, no bloquear silenciosamente.
