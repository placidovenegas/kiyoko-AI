# Kiyoko AI — Análisis del Agente y Plan de Mejoras del Chat

> Análisis técnico completo + roadmap de implementación para convertir el chat en un director de producción interactivo.

---

## 1. Estado Actual — Qué Falla y Por Qué

### 1.1 El problema de contexto (raíz de todo)

El chat actualmente **no sabe en qué video ni proyecto está el usuario** aunque la URL lo diga. Esto ocurre porque:

```
URL actual: /project/abc123/video/xyz789
                                    ↑
           El hook useKiyokoChat NO lee esto
```

**En `KiyokoChat.tsx`** el componente hace:
```tsx
// Extrae projectId de la URL pero NO videoId activo
const pathname = usePathname();
const projectId = pathname.match(/project\/([^/]+)/)?.[1];
// videoId se lee del contexto padre pero no se pasa al hook de chat
```

**En `/api/ai/chat/route.ts`** el servidor recibe `videoId` como parámetro pero:
- Solo carga escenas del proyecto completo, no filtra por video
- No incluye en el system prompt CUÁL es el video activo
- No dice cuántas escenas tiene ese video

**Resultado:** La IA responde con contexto del proyecto completo pero sin saber qué video está viendo el usuario.

---

### 1.2 Respuestas solo de texto — Sin componentes interactivos

El sistema actual solo soporta:
- Texto con Markdown
- ActionPlanCard (para ejecutar cambios de DB)
- Opciones tipo checkbox (`☐ opción`)
- Botones de workflow (`[WORKFLOW: id|label]`)

**Lo que FALTA** es que la IA pueda generar:
- Una **tarjeta de vista previa** de un video antes de guardarlo (con botones Guardar/Editar/Cancelar)
- Un **selector visual de estilo** con botones grandes (Cómico / Publicitario / Pixar / Real)
- Una **tarjeta de personaje** con su imagen y datos antes de subir a Supabase
- **Componentes de Dashboard** (lista de videos con miniaturas clicables, lista de tareas)

---

### 1.3 Sin flujos guiados (flujos en múltiples pasos)

El chat hoy es **sin estado de flujo** — cada mensaje es independiente. No hay concepto de:
- "Estamos en el paso 2 de 5 del flujo de creación de video"
- "Esperando que el usuario elija el estilo"
- "Esperando imagen de personaje"

---

### 1.4 Resumen de problemas críticos

| Problema | Impacto | Dificultad fix |
|---------|---------|---------------|
| No sabe en qué video está | Alto | Bajo |
| No hay tarjetas interactivas de datos | Alto | Medio |
| Sin flujos guiados multi-paso | Alto | Alto |
| Sin upload de imágenes para personajes | Medio | Medio |
| Dashboard no muestra componentes ricos | Medio | Medio |

---

## 2. Arquitectura de la Solución

### 2.1 Sistema de Contexto Mejorado

**El chat debe recibir y transmitir:**

```typescript
interface ChatContext {
  // Localización del usuario
  location: ChatLocation;           // 'dashboard' | 'project' | 'video' | 'scene' | ...

  // IDs de contexto
  projectId?: string;
  projectSlug?: string;
  videoId?: string;                 // ← NUEVO: video activo
  sceneId?: string;                 // ← NUEVO: escena activa

  // Datos del video activo (cargados en cliente)
  activeVideo?: {
    id: string;
    title: string;
    slug: string;
    total_scenes: number;
    status: string;
    platform?: string;
    style?: string;
  };
}
```

**Fix en `KiyokoChat.tsx`:** leer videoId de la URL y pasarlo al hook
**Fix en `/api/ai/chat`:** recibir videoId, cargar SOLO las escenas de ese video, incluir en system prompt

---

### 2.2 Sistema de Bloques Especiales en el Chat

El AI generará bloques especiales en su respuesta que el frontend renderizará como componentes interactivos:

```
[SAVE_CARD:video]
{"title":"Mi Nuevo Video","platform":"instagram","style":"comic","duration_seconds":60}
[/SAVE_CARD]

[CHOICE_BUTTONS:style_selector]
comic|🎭 Cómico|Para contenido divertido y viral
advertising|📢 Publicitario|Profesional y persuasivo
pixar|✨ Estilo Pixar|Animación 3D colorida
real|📸 Realista|Fotografía y cinematografía real
[/CHOICE_BUTTONS]

[ENTITY_CARD:character]
{"name":"Elena","role":"protagonist","description":"Joven emprendedora de 28 años"}
[/ENTITY_CARD]

[UPLOAD_REQUEST:character_image]
Sube una imagen del personaje para que pueda analizarla
[/UPLOAD_REQUEST]
```

Estos bloques NO aparecen como texto plano — `ChatMessage.tsx` los intercepta y renderiza el componente correcto.

---

### 2.3 Sistema de Flujos (Flow State Machine)

El chat mantendrá un estado de flujo en `useKiyokoChat`:

```typescript
interface ChatFlow {
  id: string;                       // 'create_video' | 'upload_character' | ...
  step: number;                     // paso actual
  totalSteps: number;
  data: Record<string, unknown>;    // datos acumulados del flujo
  waitingFor: 'user_choice' | 'image_upload' | 'text_input' | null;
}
```

Cuando el usuario interactúa con un botón del chat, el frontend agrega contexto del flujo al siguiente mensaje.

---

## 3. Flujos Detallados

### Flujo A: Crear un Video (desde dashboard o proyecto)

```
PASO 1 — El usuario dice "crea un video"
──────────────────────────────────────────
IA responde con tarjeta de preguntas:

  ¿Sobre qué tratará el video?
  [INPUT: tema del video]

  ¿Cuánto debe durar?
  [CHOICE_BUTTONS:duration]
  30s|⚡ 30 segundos|Reel corto
  60s|📱 1 minuto|Instagram/TikTok
  3min|🎬 3 minutos|YouTube corto
  custom|✏️ Personalizado|Indicar duración

  ¿Para qué plataforma?
  [CHOICE_BUTTONS:platform]
  instagram|📸 Instagram|Formato cuadrado/vertical
  youtube|▶️ YouTube|Horizontal 16:9
  tiktok|🎵 TikTok|Vertical 9:16
  linkedin|💼 LinkedIn|Profesional horizontal

──────────────────────────────────────────
PASO 2 — El usuario ha elegido opciones
──────────────────────────────────────────
IA genera los datos del video y muestra:

  [SAVE_CARD:video]
  {
    "title": "Cómo el café cambia tu productividad",
    "description": "Video educativo sobre los beneficios del café en el trabajo...",
    "platform": "instagram",
    "target_duration_seconds": 60,
    "style": null
  }
  [/SAVE_CARD]

  Acciones: [💾 Guardar] [✏️ Editar nombre] [❌ Cancelar]

──────────────────────────────────────────
PASO 3 — Usuario pulsa [Guardar]
──────────────────────────────────────────
→ Se llama POST /api/ai/execute-actions con acción create_video
→ El video se crea en Supabase
→ El chat navega DENTRO del video (/project/abc/video/newid)
→ IA responde:

  ✅ Video creado: "Cómo el café cambia tu productividad"

  Ahora generemos las escenas. ¿Qué estilo quieres?

  [CHOICE_BUTTONS:video_style]
  comic|🎭 Cómico y viral|Humor, memes, dinamismo
  advertising|📢 Publicitario|Call-to-action, persuasivo
  pixar|✨ Animación Pixar|3D colorido y familiar
  documentary|🎙️ Documental|Informativo y serio
  real|📷 Realismo|Fotografía y cinematografía

──────────────────────────────────────────
PASO 4 — Usuario elige estilo
──────────────────────────────────────────
IA pregunta:

  Antes de generar las escenas, ¿quieres añadir personajes o fondos?

  [CHOICE_BUTTONS:pre_scenes]
  characters|👤 Añadir personajes|Sube imágenes de tus actores
  backgrounds|🏙️ Añadir fondos|Sube imágenes de las localizaciones
  skip|⏭️ Generar sin personajes|La IA creará personajes genéricos

──────────────────────────────────────────
PASO 5a — Si elige personajes
──────────────────────────────────────────
  [UPLOAD_REQUEST:character_image]
  Sube la imagen del personaje principal
  [/UPLOAD_REQUEST]

  → (ver Flujo B: Subir Personaje)
  → Después de cada personaje: "¿Añadir otro? [Sí] [No, continuar]"

──────────────────────────────────────────
PASO 5b — Si elige generar
──────────────────────────────────────────
IA genera plan de escenas y muestra ActionPlanCard:

  Plan de escenas para "Cómo el café cambia tu productividad"
  Estilo: Cómico · Plataforma: Instagram · Duración: 60s

  ESCENA 1 — Apertura impactante (8s)
  Un oficinista bosteza dramáticamente frente al ordenador

  ESCENA 2 — El café al rescate (12s)
  El mismo oficinista sostiene una taza de café, transformación cómica

  [...5 escenas más...]

  [✅ Generar todas las escenas] [📝 Revisar una por una] [❌ Cancelar]
```

---

### Flujo B: Subir un Personaje con Imagen

```
PASO 1 — Usuario sube imagen en el chat
──────────────────────────────────────────
[Imagen adjuntada en ChatInput]
IA recibe la imagen, la analiza con vision y responde:

  [ENTITY_CARD:character_preview]
  {
    "imageUrl": "https://...",
    "detectedName": null,
    "detectedRole": "protagonist",
    "analysis": "Mujer joven, 25-30 años, cabello oscuro...",
    "suggestedVisualPrompt": "Young woman, dark hair, professional attire..."
  }
  [/ENTITY_CARD]

  He analizado la imagen. Para subir este personaje necesito:

  ¿Cómo se llama este personaje?
  [INPUT_INLINE: nombre del personaje]

  ¿Cuál es su rol en el video?
  [CHOICE_BUTTONS:character_role]
  protagonist|⭐ Protagonista|Personaje principal
  secondary|👥 Secundario|Personaje de apoyo
  narrator|🎙️ Narrador|Voz en off o presentador
  extra|🎭 Extra|Aparición puntual

──────────────────────────────────────────
PASO 2 — Usuario completa datos
──────────────────────────────────────────
IA muestra la tarjeta final:

  [SAVE_CARD:character]
  {
    "name": "Elena García",
    "role": "protagonist",
    "description": "Joven empresaria de 28 años, dinámica y carismática",
    "visual_description": "Mujer de 25-30 años, cabello oscuro largo, traje azul marino",
    "imageUrl": "https://...(imagen subida)"
  }
  [/SAVE_CARD]

  [💾 Guardar personaje] [✏️ Editar descripción] [❌ Cancelar]

──────────────────────────────────────────
PASO 3 — Usuario guarda
──────────────────────────────────────────
→ Se sube la imagen a Supabase Storage (characters/{projectId}/{uuid})
→ Se inserta en tabla characters con imageUrl
→ IA confirma:

  ✅ Elena García añadida como protagonista

  ¿Quieres añadir otro personaje? [Sí] [No, continuar con las escenas]
```

---

### Flujo C: Generar Escenas Conscientes de Personajes y Fondos

```
Cuando la IA tiene personajes y fondos:

──────────────────────────────────────────
IA responde:

  Perfecto, voy a generar las 7 escenas para tu video.
  Tengo en cuenta los personajes y fondos que has subido:

  👤 Personajes: Elena García (protagonista), Carlos (secundario)
  🏙️ Fondos: Oficina moderna, Cafetería urbana

  [ACTION_PLAN]
  {
    "summary_es": "Generar 7 escenas para 'Cómo el café cambia...'",
    "actions": [
      {
        "type": "create_scene",
        "description_es": "Escena 1: Elena bostezando en la oficina (8s)",
        "changes": [
          {"field": "title", "newValue": "El agotamiento matutino"},
          {"field": "description", "newValue": "Elena en su escritorio..."},
          {"field": "prompt", "newValue": "Office worker woman, dark hair..."},
          {"field": "assigned_character", "newValue": "Elena García"},
          {"field": "assigned_background", "newValue": "Oficina moderna"}
        ]
      },
      ...
    ]
  }
  [/ACTION_PLAN]
```

---

### Flujo D: Dashboard Inteligente

```
Usuario está en /dashboard y escribe o abre el chat:

IA detecta que está en el dashboard y responde:

  ¡Hola! Tienes estos proyectos activos:

  [DASHBOARD_WIDGET:projects]
  [
    {"id":"abc","title":"Campaña Verano","thumb":"...","videos":3,"status":"active"},
    {"id":"def","title":"Tutorial Café","thumb":"...","videos":1,"status":"draft"}
  ]
  [/DASHBOARD_WIDGET]

  ¿Qué quieres hacer hoy?

  [CHOICE_BUTTONS:dashboard_actions]
  new_project|🎬 Nuevo proyecto|Crear desde cero
  tasks|✅ Mis tareas|Ver tareas pendientes
  recent|🕐 Continuar|Retomar trabajo reciente
  stats|📊 Estadísticas|Ver rendimiento

──────────────────────────────────────────
Si elige "Mis tareas":

  [DASHBOARD_WIDGET:tasks]
  [
    {"id":"t1","title":"Revisar escenas Campaña Verano","project":"abc","due":"hoy","priority":"high"},
    {"id":"t2","title":"Subir personaje Elena","project":"def","due":"mañana","priority":"medium"}
  ]
  [/DASHBOARD_WIDGET]
```

---

## 4. Componentes de Chat a Crear

### 4.1 `SaveCard.tsx`

Muestra una vista previa de datos antes de guardarlos.

```tsx
interface SaveCardProps {
  type: 'video' | 'character' | 'background' | 'scene' | 'project';
  data: Record<string, unknown>;
  onSave: () => void;
  onEdit: (field: string, value: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}
```

**UI:**
- Tarjeta con borde izquierdo de color según tipo
- Campos editables inline (click para editar)
- Botones: `💾 Guardar` / `✏️ Editar` / `❌ Cancelar`
- Estado de carga durante guardado

---

### 4.2 `ChoiceButtons.tsx`

Botones de selección visual para flujos guiados.

```tsx
interface ChoiceButtonsProps {
  id: string;                       // identificador del paso del flujo
  options: {
    value: string;
    label: string;
    description?: string;
    emoji?: string;
    imageUrl?: string;              // para selector visual con imagen
  }[];
  multiSelect?: boolean;            // ¿puede elegir varios?
  onSelect: (values: string[]) => void;
  selected?: string[];
}
```

**UI:**
- Grid de 2-4 columnas de botones grandes
- Icono + Título + Descripción opcional
- Estado seleccionado con borde primario
- Al seleccionar → envía mensaje automáticamente con la elección

---

### 4.3 `EntityCard.tsx`

Muestra una tarjeta de entidad (personaje, fondo, escena) antes de guardar.

```tsx
interface EntityCardProps {
  type: 'character' | 'background' | 'scene';
  data: Record<string, unknown>;
  imageUrl?: string;
  status: 'preview' | 'saved' | 'error';
  onConfirm?: () => void;
  onDiscard?: () => void;
}
```

---

### 4.4 `UploadRequest.tsx`

Solicita al usuario que suba una imagen dentro del chat.

```tsx
interface UploadRequestProps {
  purpose: 'character_image' | 'background_image' | 'reference_image';
  description: string;
  onUpload: (file: File) => void;
}
```

**UI:**
- Zona de drag & drop dentro del chat
- Botón de selección de archivo
- Preview de la imagen tras subida
- Botón "Usar esta imagen" / "Cambiar imagen"

---

### 4.5 `DashboardWidget.tsx`

Muestra miniaturas clicables de proyectos/videos/tareas en el chat.

```tsx
interface DashboardWidgetProps {
  type: 'projects' | 'videos' | 'tasks' | 'stats';
  items: unknown[];
  onItemClick: (id: string, type: string) => void;  // navega o abre
}
```

**UI:**
- Grid de tarjetas pequeñas con miniatura
- Click → navega a la URL del proyecto/video
- Badge de estado (activo/borrador)
- Para tareas: checkbox de completado

---

### 4.6 `InlineInput.tsx`

Campo de input inline dentro del chat.

```tsx
interface InlineInputProps {
  placeholder: string;
  fieldKey: string;
  onSubmit: (value: string) => void;
  type?: 'text' | 'number' | 'textarea';
}
```

---

## 5. Cambios en el Sistema de Parseo (`ChatMessage.tsx`)

Ampliar el parseo de bloques especiales:

```typescript
// BLOQUES ACTUALES (ya existen)
[WORKFLOW: id|label, id2|label2]      → WorkflowButtons
```json {...} ```                       → ActionPlanCard
☐ opción                               → ChoiceCheckboxes

// BLOQUES NUEVOS A AÑADIR
[SAVE_CARD:type] {...} [/SAVE_CARD]   → SaveCard
[CHOICE_BUTTONS:id] opts [/CHOICE_BUTTONS] → ChoiceButtons
[ENTITY_CARD:type] {...} [/ENTITY_CARD]  → EntityCard
[UPLOAD_REQUEST:purpose] [/UPLOAD_REQUEST] → UploadRequest
[DASHBOARD_WIDGET:type] [...] [/DASHBOARD_WIDGET] → DashboardWidget
[INPUT_INLINE:key] → InlineInput
```

El parser en `ChatMessage.tsx` tiene que:
1. Escanear el contenido del mensaje
2. Reemplazar los bloques especiales por los componentes React correspondientes
3. Preservar el resto del Markdown

---

## 6. Cambios en el Sistema de Acciones

### Nuevos tipos de acción en `src/types/ai-actions.ts`

```typescript
type AiActionType =
  // ... existentes ...
  | 'create_video'              // Crear un nuevo video/cut
  | 'create_character_from_image'  // Subir imagen + crear personaje
  | 'create_background_from_image' // Subir imagen + crear fondo
  | 'generate_all_scenes'       // Generar todas las escenas de un video
  | 'assign_characters_to_scene' // Asignar múltiples personajes a escena
  | 'generate_scene_prompts'    // Generar prompts para todas las escenas
  | 'update_video'              // Actualizar datos del video
```

### Nueva interfaz `FlowAction`

```typescript
interface FlowAction {
  // Para acciones que requieren datos externos (como imagen)
  type: 'save_card' | 'upload_image' | 'confirm_data';
  pendingData: Record<string, unknown>;
  imageFile?: File;             // imagen pendiente de subir
  targetTable: string;
}
```

---

## 7. Cambios en el Hook `useKiyokoChat.ts`

### Añadir estado de flujo

```typescript
interface ChatFlow {
  id: string;                   // 'create_video' | 'upload_character' | ...
  step: number;
  totalSteps: number;
  data: Record<string, unknown>;
  waitingFor: 'user_choice' | 'image_upload' | 'text_input' | null;
}

// En el estado del store:
activeFlow: ChatFlow | null;
setActiveFlow: (flow: ChatFlow | null) => void;
pendingSaveCards: Record<string, unknown>[];  // datos a confirmar
```

### Nuevo método: `handleSaveCard(type, data)`

```typescript
async handleSaveCard(type: string, data: Record<string, unknown>) {
  // 1. Llamar al action executor con create_{type}
  // 2. Navegar al nuevo recurso si aplica (video → /project/x/video/y)
  // 3. Continuar el flujo si había uno activo
}
```

### Nuevo método: `handleChoiceSelection(flowId, values)`

```typescript
async handleChoiceSelection(flowId: string, values: string[]) {
  // Genera un mensaje de "selección del usuario" y lo envía al chat
  // Incluye el contexto del flujo en los metadatos del mensaje
  sendMessage(`He elegido: ${values.join(', ')}`, [], { flowId, values });
}
```

### Nuevo método: `handleImageUploadInFlow(file, purpose)`

```typescript
async handleImageUploadInFlow(file: File, purpose: string) {
  // 1. Sube la imagen a Supabase Storage
  // 2. Envía mensaje al chat con la imagen adjunta + contexto del flujo
  // 3. La IA analiza la imagen y responde con EntityCard
}
```

---

## 8. Cambios en el API Route `/api/ai/chat`

### Mejoras del context building

```typescript
// NUEVO: Cargar contexto del video activo
if (videoId) {
  const { data: video } = await supabase
    .from('videos')
    .select('id, title, slug, platform, style, target_duration_seconds, status, total_scenes')
    .eq('id', videoId)
    .single();

  // SOLO cargar escenas del video activo, no todas del proyecto
  const { data: videoScenes } = await supabase
    .from('scenes')
    .select(`
      id, scene_number, title, description, duration_seconds,
      sort_order, status, arc_phase, director_notes,
      scene_characters(character_id, characters(id, name))
    `)
    .eq('video_id', videoId)           // ← FILTRO POR VIDEO
    .order('sort_order');
}
```

### Nuevo bloque en el system prompt para video activo

```
═══════════════════════════════════════════════════════
VIDEO ACTIVO: [título del video]
═══════════════════════════════════════════════════════
- Plataforma: instagram
- Duración objetivo: 60 segundos
- Estilo: cómico
- Escenas: 7 (4 completas, 3 en borrador)
- Estado: production

USUARIO ESTÁ VIENDO ESTE VIDEO AHORA MISMO.
Todas tus respuestas deben referirse a este video específicamente.
```

---

## 9. Cambios en `buildSystemPrompt()` — System Prompt Mejorado

El system prompt debe incluir instrucciones explícitas para generar los bloques especiales:

```
## FORMATO DE RESPUESTAS INTERACTIVAS

Cuando el usuario pida crear un video, usa este bloque para mostrar los datos generados:
[SAVE_CARD:video]
{ "title": "...", "description": "...", "platform": "...", "target_duration_seconds": 60 }
[/SAVE_CARD]
NO digas "aquí tienes los datos" ni lo muestres como JSON crudo.

Cuando necesites que el usuario elija entre opciones visuales, usa:
[CHOICE_BUTTONS:identificador_unico]
valor1|Etiqueta 1|Descripción corta
valor2|Etiqueta 2|Descripción corta
[/CHOICE_BUTTONS]

Cuando hayas generado un plan de escenas, usa el formato ActionPlan JSON.

Cuando quieras mostrar proyectos o videos del usuario en el dashboard, usa:
[DASHBOARD_WIDGET:videos]
[{"id":"...","title":"...","thumb":"..."}]
[/DASHBOARD_WIDGET]

## REGLAS DE CONTEXTO

- Si estás en un VIDEO específico: SOLO habla de ese video y sus escenas
- Si estás en un PROYECTO sin video activo: habla del proyecto completo
- Si estás en el DASHBOARD: ofrece navegación y resumen
- Siempre muestra los datos que vas a guardar ANTES de guardarlos
- Siempre pide confirmación antes de crear o eliminar datos
```

---

## 10. Cambios en `chat-context.ts`

### Añadir acciones contextuales enriquecidas

```typescript
// Para cada location, definir el flujo de onboarding
const FLOW_TRIGGERS: Record<ChatLocation, string[]> = {
  video: [
    'crear_escenas',         // → Flujo de generación de escenas
    'subir_personaje',       // → Flujo de upload de imagen
    'subir_fondo',           // → Flujo de upload de fondo
    'analizar_video',        // → Análisis del video completo
  ],
  project: [
    'nuevo_video',           // → Flujo de creación de video
    'ver_personajes',        // → Componente DashboardWidget:characters
    'ver_estadisticas',      // → Componente DashboardWidget:stats
  ],
  dashboard: [
    'nuevo_proyecto',        // → Flujo de creación de proyecto
    'ver_tareas',            // → Componente DashboardWidget:tasks
    'continuar_trabajo',     // → DashboardWidget:recent_videos
  ],
};
```

---

## 11. Orden de Implementación Recomendado

### Fase 1 — Fix de contexto (1-2 días) 🔴 CRÍTICO

1. **`KiyokoChat.tsx`**: Leer `videoId` de la URL y pasarlo al hook
2. **`useKiyokoChat.ts`**: Incluir `videoId` en los requests al API
3. **`/api/ai/chat/route.ts`**: Filtrar escenas por `videoId` y añadir bloque "VIDEO ACTIVO" al system prompt
4. **`buildSystemPrompt()`**: Añadir sección de video activo

**Test:** El chat en `/project/abc/video/xyz` debe responder sobre las escenas de ese video específico.

---

### Fase 2 — Bloques interactivos básicos (2-3 días) 🟡 IMPORTANTE

5. Crear `SaveCard.tsx`
6. Crear `ChoiceButtons.tsx`
7. Ampliar parser en `ChatMessage.tsx` para los nuevos bloques
8. Actualizar system prompt con instrucciones de formato

**Test:** Decir "crea un video" → la IA responde con `[SAVE_CARD:video]` → aparece tarjeta con botones.

---

### Fase 3 — Flujo de creación de video (2-3 días) 🟡 IMPORTANTE

9. Añadir acción `create_video` en `action-executor.ts`
10. Añadir acción `update_video` en `action-executor.ts`
11. Implementar flujo completo en system prompt (preguntas de plataforma/duración/tema)
12. Crear componente `InlineInput.tsx`
13. Después de guardar: navegar automáticamente al video creado

**Test:** "Crea un video de café" → preguntas → tarjeta → guardar → navegar → generar escenas.

---

### Fase 4 — Flujo de personajes y fondos (3-4 días) 🟢 MEJORA

14. Crear `EntityCard.tsx`
15. Crear `UploadRequest.tsx`
16. Implementar endpoint de análisis de imagen del personaje (ya existe `/api/ai/analyze-image`)
17. Añadir acción `create_character_from_image` en `action-executor.ts`
18. Implementar flujo completo de upload → análisis → confirmar → guardar

**Test:** Subir imagen en chat → IA analiza → tarjeta con datos → guardar personaje.

---

### Fase 5 — Dashboard inteligente (2-3 días) 🟢 MEJORA

19. Crear `DashboardWidget.tsx`
20. Añadir parser en `ChatMessage.tsx`
21. Implementar queries de datos para dashboard (proyectos recientes, tareas pendientes)
22. Inyectar datos del dashboard en el system prompt cuando location = 'dashboard'

**Test:** Abrir chat en dashboard → aparece lista de proyectos con miniaturas clicables.

---

### Fase 6 — Generación de escenas guiada (3-4 días) 🟢 MEJORA

23. Añadir acción `generate_all_scenes` que crea N escenas de una vez
24. Incluir personajes y fondos del proyecto en los prompts generados
25. Flujo: elegir estilo → ActionPlanCard con todas las escenas → confirmar → ejecutar
26. Cada escena creada asigna automáticamente los personajes y fondos disponibles

---

## 12. Estructura de Archivos a Crear/Modificar

```
src/
├── components/
│   └── chat/
│       ├── SaveCard.tsx                  ← NUEVO
│       ├── ChoiceButtons.tsx             ← NUEVO
│       ├── EntityCard.tsx                ← NUEVO
│       ├── UploadRequest.tsx             ← NUEVO
│       ├── InlineInput.tsx               ← NUEVO
│       ├── DashboardWidget.tsx           ← NUEVO
│       ├── ChatMessage.tsx               ← MODIFICAR (añadir parsers)
│       └── KiyokoChat.tsx                ← MODIFICAR (videoId, context)
│
├── hooks/
│   └── useKiyokoChat.ts                  ← MODIFICAR (videoId, flows, save)
│
├── lib/
│   └── ai/
│       ├── system-prompt.ts              ← MODIFICAR (video context + bloques)
│       ├── chat-context.ts               ← MODIFICAR (flow triggers)
│       └── action-executor.ts            ← MODIFICAR (create_video, etc.)
│
├── app/
│   └── api/
│       └── ai/
│           └── chat/
│               └── route.ts              ← MODIFICAR (filtrar por videoId)
│
└── types/
    └── ai-actions.ts                     ← MODIFICAR (nuevos tipos de acción)
```

---

## 13. Ejemplo de Conversación Final Esperada

### En `/project/abc/video/xyz` (video con 0 escenas):

```
[Chat se abre automáticamente]

🤖 Kiyoko AI:
  Estás editando "Campaña Verano 2026" — aún no tiene escenas.
  ¿Quieres que generemos las escenas ahora?

  [🎬 Generar escenas] [👤 Añadir personajes primero] [🏙️ Añadir fondos primero]

👤 Usuario: Añadir personajes primero

🤖 Kiyoko AI:
  ¡Perfecto! Sube una foto del personaje principal y lo analizo para ti.

  [UPLOAD_REQUEST:character_image]
  Arrastra la imagen aquí o haz clic para seleccionar
  [/UPLOAD_REQUEST]

[Usuario sube imagen de una chica joven]

🤖 Kiyoko AI:
  He analizado la imagen. Esta es la persona que veo:

  [ENTITY_CARD:character]
  {
    "imageUrl": "...",
    "analysis": "Mujer joven, 25-30 años, cabello oscuro, expresión dinámica"
  }
  [/ENTITY_CARD]

  ¿Cómo se llama y qué rol tiene en el video?

  Nombre: [___________________]

  Rol:
  [⭐ Protagonista] [👥 Secundario] [🎙️ Narrador] [🎭 Extra]

👤 Usuario: Elena, protagonista

🤖 Kiyoko AI:
  Listo para subir a tu proyecto:

  [SAVE_CARD:character]
  {
    "name": "Elena",
    "role": "protagonist",
    "visual_description": "Mujer joven 25-30 años, cabello oscuro...",
    "imageUrl": "..."
  }
  [/SAVE_CARD]

  [💾 Guardar Elena] [✏️ Editar] [❌ Cancelar]

[Usuario pulsa Guardar]

🤖 Kiyoko AI:
  ✅ Elena añadida como protagonista.

  ¿Añadir otro personaje o continuar con las escenas?
  [👤 Otro personaje] [🏙️ Añadir fondos] [🎬 Generar escenas ya]
```

---

## 14. Consideraciones de Implementación

### Parser de bloques en ChatMessage.tsx

El parser debe funcionar con una expresión regular o un escáner de texto simple:

```typescript
function parseSpecialBlocks(content: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  const BLOCK_REGEX = /\[([A-Z_]+):([^\]]*)\]([\s\S]*?)\[\/\1\]/g;

  let lastIndex = 0;
  let match;

  while ((match = BLOCK_REGEX.exec(content)) !== null) {
    // Texto antes del bloque → Markdown normal
    if (match.index > lastIndex) {
      blocks.push(<MarkdownContent key={lastIndex} content={content.slice(lastIndex, match.index)} />);
    }

    const [, blockType, blockId, blockContent] = match;
    blocks.push(renderSpecialBlock(blockType, blockId, blockContent.trim()));
    lastIndex = match.index + match[0].length;
  }

  // Texto restante
  if (lastIndex < content.length) {
    blocks.push(<MarkdownContent key={lastIndex} content={content.slice(lastIndex)} />);
  }

  return blocks;
}
```

### Prevenir que la IA "escape" los bloques en Markdown

En el system prompt añadir explícitamente:

```
IMPORTANTE: Nunca muestres los bloques [SAVE_CARD], [CHOICE_BUTTONS], etc.
como texto o dentro de bloques de código. Siempre escríbelos directamente
en la respuesta para que el frontend los procese.
```

### Historial de conversación + bloques especiales

Los bloques especiales deben guardarse en `ai_conversations.messages` como texto plano (el JSON de los datos). Al cargar una conversación antigua, los bloques se vuelven a parsear y renderizar correctamente.

---

*Documento creado el 2026-03-23. Revisar con el equipo antes de comenzar Fase 1.*
