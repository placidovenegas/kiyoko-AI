# Chat Kiyoko — Referencia visual, tema e interacción

Documento pensado para **diseño**, **mockups**, **imágenes de referencia** y mejoras de UX: qué hay en pantalla, con qué colores del tema, y **cómo debe verse** en cada acción (crear personaje/fondo/video, cancelar, preguntas encima del input, etc.).

Fuentes en código: `src/components/chat/*`, `src/components/kiyoko/*`, `src/app/globals.css`, `.claude/skills/design-system/SKILL.md`.

---

## 1. Filosofía visual (Notion + Supabase)

- **Minimal**: pocas decoraciones; bordes finos (`border-border`), tarjetas `bg-card` o `bg-background`.
- **Dark-first**: el modo oscuro es la referencia principal; light es variante.
- **Interacción “de abajo”**: decisiones importantes (Elije, crear entidad) se anclan **encima del input** (`bottom-full`), como si **salieran del campo de texto**, no del centro del scroll.
- **Resizers**: línea **1px**; gris por defecto (`bg-border`); en **hover/active** al arrastrar: **`#3E4452`** (no azul grueso).
- **Alturas de barra**: cabecera del chat **~47px** (`h-11.75`).

---

## 2. Tema y colores (tokens)

### 2.1 Variables Shadcn / Kiyoko (`globals.css`)

| Token | Light | Dark | Uso en chat |
|-------|--------|------|-------------|
| `--background` | `#ffffff` | `#191919` | Fondo del panel y área de mensajes |
| `--foreground` | ~`#111827` | `#ebebeb` | Texto principal |
| `--card` | `#f9f8f7` | `#202020` | Tarjetas, cabeceras de bloques |
| `--muted` | `#f0efee` | `#282828` | Cabeceras secundarias, filas suaves |
| `--muted-foreground` | ~`#6B7280` | `#71717a` | Subtítulos, hints |
| `--border` | `#e8e7e5` | `#2e2e2e` | Bordes de inputs, tarjetas, separadores |
| `--primary` | `#006fee` | `#006fee` | Botón principal, acento de selección |
| `--destructive` | `#f31260` | `#f31260` | Eliminar / error crítico |
| `--ring` | `#006fee` | — | Focus de inputs |

### 2.2 Paleta semántica HeroUI (badges, estados)

| Nombre | Hex típico | Uso |
|--------|------------|-----|
| primary-500 | `#006FEE` | Acción principal |
| success-500 | `#17C964` | Creado / OK |
| warning-500 | `#F5A524` | Atención |
| danger-500 | `#F31260` | Error / peligro |
| secondary-500 | `#7828C8` | Tags secundarios |

### 2.3 Colores de marca / narrativa (referencia)

- `--color-brand-teal` `#058B96`, `--color-brand-green` `#58DAAC`, `--color-brand-coral` `#FE6A3C`, etc.
- Fases de guion: `--color-phase-hook` rojo, `build` ámbar, `peak` verde, `close` azul (timeline / escenas).

### 2.4 Tipografía

- **Sans**: Inter (`--font-sans`).
- **Mono**: JetBrains Mono (`--font-mono`) para JSON / bloques técnicos.
- Escala habitual en chat: `text-sm` cuerpo, `text-xs` secundario, títulos de bloque `text-sm font-semibold`.

---

## 3. Estructura del panel de chat (qué contiene qué)

| Pieza | Archivo | Rol |
|-------|---------|-----|
| Contenedor + modos sidebar/floating/fullscreen | `KiyokoPanel.tsx` | Envuelve el chat; resizer izquierdo del panel; fullscreen sin tapar el sidebar de la app. |
| Orquestador | `KiyokoChat.tsx` | Mensajes, historial, estado de creación, banners, input. |
| Cabecera | `KiyokoHeader.tsx` | Título/contexto, nuevo chat, historial, etc. Altura **47px**. |
| Cuerpo | `ChatBody` (dentro de `KiyokoChat.tsx`) | Scroll de mensajes + sugerencias + banner cancelación + **dock de creación** + input. |
| Historial lateral | `ChatHistorySidebar.tsx` | Lista de conversaciones (modo expandido). |
| Input clásico | `ChatInput.tsx` | Textarea, adjuntos, proveedor, enviar/detener. |
| Input + preguntas | `ChatInputV2.tsx` | Envuelve `ChatInput` y muestra **Elije** encima con animación. |
| Pregunta tipo test | `ChatQuestionPrompt.tsx` | Opciones A/B/C, Other, Continuar/Saltar; teclado. |
| Animación dock | `chatDockOverlay.ts` | Preset Framer Motion (fade + slide corto). |

---

## 4. Qué suele “aparecer” en el chat (por tipo de contenido)

### 4.1 Mensaje de usuario

- Burbuja alineada a un lado (patrón chat).
- Si hay **imágenes adjuntas**: miniaturas encima o junto al texto.

### 4.2 Mensaje del asistente (texto + markdown)

- Texto renderizado como markdown donde aplique.
- Puede incluir **bloques especiales** entre corchetes (ver §5).

### 4.3 Streaming

- Mientras la IA escribe: último mensaje puede mostrar **onda** (`StreamingWave`) o **esqueleto** de bloque (`BlockSkeleton`) si un tag de bloque está “a medias”.
- El input suele mostrar estado “ocupado” (`isStreaming`): detener en lugar de enviar, y campos sensibles deshabilitados.

### 4.4 Sugerencias (chips)

- Aparecen **debajo del último mensaje** como píldoras (`bg-card`, borde, hover con gradiente sutil en algunos estilos).
- **No** se muestran si hay streaming o creación en curso (`isCreating`).

### 4.5 Creación de personaje / fondo / video (modo producción con `hideCreateCards`)

1. El modelo (o el sistema) emite un bloque `[CREATE:character|background|video]…[/CREATE]` en un mensaje.
2. Ese bloque **no** pinta la tarjeta dentro del historial: dispara `onCreateCardRequested`.
3. En **`ChatBody`**: el área de mensajes se **atenúa** (`opacity` ~0.45) y aparece **encima del input** un panel “dock”:
   - Ancho: **`calc(100% - 30px)`** respecto al ancho del input, **centrado**.
   - Borde: `rounded-t-xl`, **sin** redondeo inferior, `border-b-0`, `bg-background`, sombra suave.
   - Contenido: `CharacterCreationCard` | `BackgroundCreationCard` | `VideoCreationCard` con prop **`dock`** (sin doble borde exterior).
   - **Animación** de entrada/salida (Framer Motion): ligero `y` + `opacity`.

### 4.6 Tras crear (éxito)

- La tarjeta puede mostrar un **estado “Creado”** (fondo verde suave `emerald`, icono check).
- El padre inyecta un **mensaje de asistente** de confirmación (`injectAssistantNotice`).
- Tras unos **~2,5 s** se cierra el overlay de creación si sigue siendo la misma sesión.

### 4.7 Al cancelar creación

- Se cierra el overlay y se marca el `messageId` como “descartado” para no reabrir.
- Aparece un **banner de cancelación** en la zona de mensajes (no como mensaje largo del asistente):
  - Título: **“Cancelado”**.
  - Texto ejemplo: `Haz cancelado la creacion del personaje "Nombre".` (o fondo/video según tipo; si no hay nombre, sin comillas).
- El banner **desaparece solo** a los **~2,5 s**.

### 4.8 Preguntas “Elije” (overlay en `ChatInputV2`)

- Panel encima del input, **pegado** al textarea (sin hueco inferior), **sin** redondeo inferior.
- Título por defecto: **“Elije”**; debajo el enunciado (`prompt`).
- Opciones con letras **A, B, C…**, selección con teclado (flechas, letras, Enter, Esc).
- “Other…” abre input de texto; Enter confirma.
- Botones **Saltar** (opcional) y **Continuar**.

---

## 5. Catálogo de bloques de IA (qué es y qué componente pinta)

Los bloques se parsean desde el contenido del mensaje (`parseAiMessage` / lógica en `ChatMessage.tsx`). Referencia técnica ampliada: `docs/v6/IA/02_chat_contract.md`.

| Bloque / patrón | Componente UI | Qué muestra / interacción |
|-----------------|----------------|---------------------------|
| Texto markdown | Render markdown | Párrafos, listas, énfasis. |
| `[CHOICES]` / segmentos de elección | UI de opciones según parser | Listas tipo checklist cuando aplica. |
| `[OPTIONS]` | `OptionsBlock` | Botones horizontales/stack para elegir una opción; dispara envío/acción. |
| `[SELECT:tipo]` | `EntitySelector` | Selección de entidad del contexto (personaje, etc.). |
| `[PREVIEW:tipo]` | Tarjetas de preview | Resumen antes de guardar (personaje, etc.). |
| `[SCENE_PLAN]` | `ScenePlanTimeline` | Línea de tiempo de escenas. |
| `[SCENE_DETAIL]` | `SceneDetailCard` | Detalle rico de una escena. |
| `[DIFF]` | `DiffView` | Antes / después por campo. |
| `[PROMPT_PREVIEW]` | `PromptPreviewCard` | Prompt generado (imagen/video) con metadatos. |
| `[PROJECT_SUMMARY]` | `ProjectSummaryCard` | Estado del proyecto (envuelto en error boundary). |
| `[VIDEO_SUMMARY]` | `VideoSummaryCard` | Estado del video. |
| `[RESOURCE_LIST]` | `ResourceListCard` | Lista/grid de personajes o fondos. |
| `[CREATE:character]` etc. | `CharacterCreationCard` / … | Formulario; con `hideCreateCards` se **omite** en el hilo y se usa el **dock**. |
| `ACTION_PLAN` (json en mensaje) | Plan de acciones | Confirmar / modificar / cancelar según `AiActionPlan`. |
| `[WORKFLOW:…]` | Botones de flujo | Acciones rápidas parseadas del mensaje. |

**Sandbox de prueba** (`/playground/chat-sandbox`): permite insertar muestras de casi todos los bloques sin llamar a la IA.

---

## 6. Inventario por componente (para mockups y mejoras)

### 6.1 `ChatInput.tsx`

- **Incluye**: textarea, botón `+` (adjuntos / limpiar / modelo), chips de archivos, etiqueta de contexto, chip de proveedor, enviar / **detener**.
- **Estados**: normal; `isStreaming` (y en padre a veces `isCreating`) → deshabilita interacciones que no deben competir con la operación en curso.
- **Colores**: fondo acorde a tema; bordes `border-border`; focus `ring`.

### 6.2 `ChatInputV2.tsx`

- **Incluye**: todo lo de `ChatInput` + contenedor `relative z-20` para el overlay de preguntas.
- **Overlay**: `AnimatePresence` + `motion.div`; ancho `calc(100% - 30px)`.

### 6.3 `ChatQuestionPrompt.tsx`

- **Header**: título “Elije”, texto del `prompt` en `text-muted-foreground`.
- **Opciones**: filas tipo botón con badge de letra; selección `border-primary/40`, `bg-primary/10`.
- **Footer**: Saltar + Continuar (`bg-primary` si válido).
- **Modo `placement="overlay"`**: `rounded-t-xl rounded-b-none`, `border-b-0`, `bg-background`, sin gap con el input.

### 6.4 `CharacterCreationCard.tsx`

- **Cabecera**: icono Users (tono púrpura), título “Nuevo personaje”, `bg-muted/50`, borde inferior.
- **Acciones pie**: **Cancelar** | **Crear personaje** (deshabilitado si no hay nombre o mientras `saving`).
- **Éxito**: bloque verde `emerald` con check, texto `Personaje "{nombre}" creado` y sublínea con el **rol**.
- **`dock`**: quita `mt-2` y borde exterior duplicado; encaja dentro del shell del dock.

**Claves `prefill` (JSON del bloque `[CREATE:character]` o estado interno)** — todas opcionales salvo uso en UI:

| Clave en código / prefill | En pantalla (etiqueta) | Tipo | Obligatorio al guardar | Notas |
|---------------------------|------------------------|------|-------------------------|--------|
| `name` | “Nombre del personaje” | Texto | Sí | Sin nombre no se puede crear. |
| `role` | Rol (dropdown) | `protagonista` · `secundario` · `extra` · `narrador` | No (default `protagonista`) | Selector desplegable. |
| `description` | “Que hace en la historia” | Textarea | No | Guion / función en la historia. |
| `personality` | “Personalidad” | Texto | No | Botón **Sugerir** (IA) si hay nombre. |
| `visual_description` | “Prompt visual (EN)” | Textarea (mono) | No | Botón **Generar** (IA) si hay nombre. Se persiste como `visual_description` / `prompt_snippet`. |
| *(archivo)* | Zona “Imagen” | Imagen opcional, max ~10MB | No | Sube a storage si hay proyecto; preview local. |
| `imagePreview` | — | Solo prefill/sandbox | No | Preview inicial si se pasara URL. |

**Extras UX (no son “campos” de formulario pero aparecen en la tarjeta):**

- Si hay **imagen** y aún no hay **prompt visual**, bloque informativo + **Copiar prompt de análisis** (prompt fijo en inglés para usar en otra IA con la imagen).

---

### 6.5 `BackgroundCreationCard.tsx`

- **Cabecera**: icono MapPin (verde), “Nuevo fondo / locación”, `bg-muted/50`.
- **Acciones pie**: **Cancelar** | **Crear fondo** (requiere nombre).
- **Éxito**: `Fondo "{nombre}" creado` + sublínea `tipo ubicación · hora del día`.

**Claves `prefill`:**

| Clave en código / prefill | En pantalla | Tipo | Obligatorio al guardar | Notas |
|---------------------------|-------------|------|-------------------------|--------|
| `name` | “Nombre del fondo” | Texto | Sí | |
| `location_type` | Tipo de lugar (chips) | `interior` · `exterior` · `mixto` | No (default `exterior`) | Tres botones. |
| `time_of_day` | “Hora del dia” | `amanecer` · `dia` · `atardecer` · `noche` | No (default `dia`) | Cuatro botones. |
| `description` | “Prompt visual (EN)” | Textarea (mono) | No | En BD se usa también como `prompt_snippet`. Botón **Generar** (IA) si hay nombre. |
| *(archivo)* | “Imagen ref.” | Imagen opcional | No | Misma lógica de subida que personaje. |

**Extras:** si hay imagen de referencia y el prompt visual está vacío, caja de ayuda + **Copiar prompt** (análisis de imagen).

---

### 6.6 `VideoCreationCard.tsx`

- **Cabecera**: icono Film (azul), “Nuevo video”.
- **Acciones pie**: **Cancelar** | **Crear video** (requiere título).
- **Éxito**: `Video "{título}" creado` + sublínea `plataforma · duración · aspect ratio`.
- **Badge resumen** (solo lectura): muestra plataforma elegida, aspecto y segundos.

**Claves `prefill`:**

| Clave en código / prefill | En pantalla | Tipo | Obligatorio al guardar | Notas |
|---------------------------|-------------|------|-------------------------|--------|
| `title` | “Titulo” | Texto | Sí | Botón **Sugerir** (IA) junto al label. |
| `platform` | “Plataforma” | Un valor de la lista | No (default `instagram_reels`) | Cada opción muestra etiqueta + aspecto (p. ej. `9:16`, `16:9`). Valores: `instagram_reels`, `youtube`, `tiktok`, `tv_commercial`, `web`. |
| `target_duration_seconds` | “Duracion” | 15 · 30 · 60 · 180 · 300 s | No (default 30) | Botones con etiquetas 15s, 30s, 1 min, 3 min, 5 min. |
| `description` | “Descripcion” | Textarea | No | Botón **Generar** (IA) si ya hay título. |

---

### 6.6.1 Resumen: qué se guarda (alto nivel)

| Tarjeta | Tabla / recurso principal | Campos destacados en BD |
|---------|---------------------------|-------------------------|
| Personaje | `characters` + opcional Storage | `name`, `role`, `description`, `personality`, `visual_description`, `prompt_snippet`, `reference_image_*`, `initials` (derivado). |
| Fondo | `backgrounds` + opcional Storage | `name`, `code` (derivado del nombre), `location_type`, `time_of_day`, `description` / `prompt_snippet`, `reference_image_*`. |
| Video | `videos` | `title`, `slug`/`short_id` (derivados), `platform`, `target_duration_seconds`, `description`, `video_type`/`aspect_ratio` mapeados desde plataforma. |

### 6.7 `ChatHistorySidebar.tsx`

- Buscar, agrupar por fecha, items de conversación; fondo acorde al panel.

### 6.8 `StreamingWave.tsx`

- Indicador de “trabajando” con label (p.ej. creación).

---

## 7. Guía rápida “cómo debería verse” (para generar imágenes)

| Escena | Qué debe salir en la imagen |
|--------|---------------------------|
| Chat vacío | Fondo `bg-background`, estado vacío contextual (`KiyokoEmptyState`), input abajo. |
| Conversación normal | Mensajes usuario vs asistente, scroll, sin overlay. |
| Streaming | Última burbuja “en construcción” o onda; input con “detener”. |
| Elije (pregunta) | Panel **estrecho** que **nace del input**, título “Elije”, opciones A/B/C, colores neutros + acento primary en selección. |
| Crear personaje (dock) | Lista de mensajes **ligeramente atenuada**; panel creación **pegado al input**, borde superior redondeado, inferior recto, ancho menor que el input. |
| Cancelar creación | Overlay desaparece; **banner** “Cancelado” con texto de cancelación; luego desvanecimiento. |
| Crear OK | Tarjeta verde “creado” breve + mensaje del asistente confirmando; luego cierre del dock. |

---

## 8. Archivos relacionados

| Documento | Contenido |
|-----------|-----------|
| `docs/v6/UX/05_chat_componentes_y_interaccion.md` | Catálogo técnico y contratos UX. |
| `docs/v6/UX/04_chat_layout_y_dimensiones.md` | Anchos mínimos, historial, fullscreen. |
| `docs/v6/IA/02_chat_contract.md` | Contrato de bloques para el modelo. |

---

## 9. Qué es la app y qué buscamos

**Kiyoko AI** es una aplicación web para **producir vídeo con apoyo de IA**: organizas **proyectos**, defines **personajes** y **fondos/locaciones**, planificas **vídeos** y **escenas**, y usas un **asistente conversacional (Kiyoko)** para redactar, proponer planes de acción, generar bloques interactivos (opciones, timelines, resúmenes) y **persistir cambios** en **Supabase** cuando confirmás una acción o completás un flujo de creación.

Lo que perseguimos en producto:

1. **Un solo lugar** para el guion creativo y la operación (estado del proyecto/vídeo visible en el chat con bloques ricos).
2. **Contrato claro entre modelo y UI**: el modelo emite texto + etiquetas (`[OPTIONS]`, `[ACTION_PLAN]`, `[CREATE:…]`, etc.); el cliente renderiza componentes y ejecuta contra la BD solo con confirmación o con formularios explícitos.
3. **Trazabilidad**: conversaciones guardadas, uso de IA logueado, y donde aplica **snapshots** para deshacer cambios estructurados.
4. **UX tipo Notion/Supabase**: oscuro legible, pocas distracciones, decisiones importantes **ancladas al input** (preguntas “Elije”, creación de entidades).

El chat **no “rellena sola” toda la base de datos**: escribe sobre todo en **`ai_conversations`** (historial), y en tablas de dominio (**`characters`**, **`backgrounds`**, **`videos`**, y vía planes **`scenes`**, **`scene_prompts`**, etc.) cuando el usuario confirma o el flujo de creación guarda. La lista de columnas canónicas está tipada en `src/types/database.types.ts`.

---

## 10. Tablas Supabase que el chat / la IA tocan (y campos)

Referencias: **`public`** en Supabase, tipos generados en `src/types/database.types.ts`. Los campos listados son los de **Insert** (o Row cuando aplica); `?` = opcional en inserción.

### 10.1 `ai_conversations` — historial del chat

Persiste hilos por usuario y proyecto (y opcionalmente vídeo). El cliente guarda el array de mensajes en JSON.

| Campo | Tipo |
|-------|------|
| `id` | UUID (opcional al insert, genera default) |
| `user_id` | UUID (FK → `profiles`) |
| `project_id` | UUID (FK → `projects`) |
| `video_id` | UUID (nullable, FK → `videos`) |
| `title` | string (nullable) |
| `messages` | `Json` — historial serializado |
| `message_count` | number (nullable) |
| `conversation_type` | string (nullable) |
| `context_entity_type` | string (nullable) |
| `context_entity_id` | UUID (nullable) |
| `affected_scene_ids` | UUID[] (nullable) |
| `completed` | boolean (nullable) |
| `created_at` / `updated_at` | timestamptz (nullable) |

### 10.2 `characters` — personajes del proyecto

Rellenada por **CharacterCreationCard** (insert directo) o por **planes de acción** / flujos futuros. FK obligatoria: `project_id`.

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID (opcional al insert) | |
| `project_id` | UUID | Obligatorio |
| `name` | string | Obligatorio |
| `initials` | string | Obligatorio (en UI se derivan del nombre) |
| `role` | string (nullable) | p. ej. protagonista |
| `description` | string (nullable) | |
| `personality` | string (nullable) | |
| `visual_description` | string (nullable) | |
| `prompt_snippet` | string (nullable) | alineado con prompt visual |
| `reference_image_url` / `reference_image_path` | string (nullable) | Storage `project-assets` |
| `ai_prompt_description` | string (nullable) | |
| `ai_visual_analysis` | Json (nullable) | |
| `accessories` | string[] (nullable) | |
| `hair_description` | string (nullable) | |
| `color_accent` | string (nullable) | |
| `signature_clothing` | string (nullable) | |
| `signature_tools` | string[] (nullable) | |
| `metadata` | Json (nullable) | |
| `rules` | Json (nullable) | |
| `sort_order` | number (nullable) | |
| `created_at` / `updated_at` | timestamptz (nullable) | |

### 10.3 `backgrounds` — fondos / locaciones

Rellenada por **BackgroundCreationCard** o acciones confirmadas.

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID (opcional) | |
| `project_id` | UUID | Obligatorio |
| `name` | string | Obligatorio |
| `code` | string | Obligatorio (en UI se normaliza desde el nombre) |
| `location_type` | string (nullable) | interior / exterior / mixto |
| `time_of_day` | string (nullable) | amanecer, dia, … |
| `description` | string (nullable) | |
| `prompt_snippet` | string (nullable) | |
| `reference_image_url` / `reference_image_path` | string (nullable) | Storage |
| `ai_prompt_description` | string (nullable) | |
| `ai_visual_analysis` | Json (nullable) | |
| `available_angles` | string[] (nullable) | |
| `metadata` | Json (nullable) | |
| `sort_order` | number (nullable) | |
| `created_at` / `updated_at` | timestamptz (nullable) | |

### 10.4 `videos` — vídeos dentro del proyecto

Rellenada por **VideoCreationCard** (insert) con `short_id`, `slug` y mapeos de plataforma desde la UI.

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID (opcional) | |
| `project_id` | UUID | Obligatorio |
| `title` | string | Obligatorio |
| `short_id` | string | Obligatorio (id corto único) |
| `slug` | string | Obligatorio (URL-friendly) |
| `platform` | enum `target_platform` | `youtube`, `instagram_reels`, `tiktok`, `tv_commercial`, `web`, `custom` |
| `video_type` | enum `video_type` | `long`, `short`, `reel`, `story`, `ad`, `custom` |
| `status` | enum `video_status` | `draft`, `prompting`, `generating`, `review`, `approved`, `exported` |
| `aspect_ratio` | string (nullable) | p. ej. `9:16` / `16:9` según plataforma |
| `target_duration_seconds` | number (nullable) | |
| `description` | string (nullable) | |
| `is_primary` | boolean (nullable) | |
| `style_preset_id` | UUID (nullable, FK → `style_presets`) | |
| `narration_provider` / `narration_voice_id` / `narration_voice_name` | string (nullable) | |
| `narration_style` | string (nullable) | |
| `narration_speed` | number (nullable) | |
| `metadata` | Json (nullable) | |
| `sort_order` | number (nullable) | |
| `created_at` / `updated_at` | timestamptz (nullable) | |

### 10.5 Escenas, prompts, cámara y uniones (editables vía plan de acciones / IA)

Estas tablas son el **núcleo narrativo** por vídeo. El chat **no las rellena solas**: se actualizan cuando el usuario **confirma** un `[ACTION_PLAN]` (o formato nuevo `Action[]` con `table`), o por **rutas API** de generación (imagen/vídeo) fuera del alcance de este listado.

#### `scenes` — escena dentro de un `video_id`

| Campo (Insert) | Uso |
|----------------|-----|
| `id` | UUID (opcional) |
| `project_id` | UUID (FK proyecto) |
| `video_id` | UUID (FK vídeo) |
| `scene_number`, `sort_order` | Orden |
| `title`, `description`, `dialogue`, `director_notes`, `notes` | Texto |
| `scene_type` | enum: `original` \| `improved` \| `new` \| `filler` \| `video` |
| `status` | enum escena (`draft`, `prompt_ready`, …) |
| `arc_phase` | `hook` \| `build` \| `peak` \| `close` |
| `duration_seconds`, `is_filler`, `generation_context`, `metadata`, … | |

#### `scene_prompts` — prompts versionados por escena

| Campo (Insert) | Uso |
|----------------|-----|
| `scene_id` | FK escena |
| `prompt_type` | `image` \| `video` \| `narration` \| `analysis` |
| `prompt_text` | Contenido |
| `version`, `is_current` | Versionado (al actualizar se marca el anterior `is_current=false`) |
| `status`, `result_url`, `generator`, `generation_config` | |

#### `scene_camera` — plano por escena (1:1 con `scene_id`)

| Campo (Insert) | Uso |
|----------------|-----|
| `scene_id` | Obligatorio |
| `camera_angle`, `camera_movement`, `lighting`, `mood`, `camera_notes`, `ai_reasoning` | |

#### `scene_characters` — N:M escena ↔ personaje

| Campo (Insert) | Uso |
|----------------|-----|
| `scene_id`, `character_id` | Obligatorios |
| `role_in_scene`, `sort_order` | Opcionales |

#### `scene_backgrounds` — N:M escena ↔ fondo (a veces una fila activa por escena en `assign_background`)

| Campo (Insert) | Uso |
|----------------|-----|
| `scene_id`, `background_id` | Obligatorios |
| `angle`, `time_of_day`, `is_primary` | |

#### `scene_media` — assets generados / subidos ligados a escena

| Campo (Insert) | Uso |
|----------------|-----|
| `scene_id` | Obligatorio |
| `media_type` | `image` \| `video` \| `audio` |
| `file_path`, `file_url`, `prompt_used`, `version`, `is_current`, `status` | |

#### `scene_video_clips` — clips de vídeo por escena (extensiones, prompts de vídeo)

Campos principales: `scene_id`, `clip_type`, `prompt_video`, `file_url`, `version`, `is_current`, etc.

#### `projects` — proyecto (creación desde IA solo si el plan incluye `create_project`)

Campos típicos en insert: `owner_id`, `title`, `slug`, `short_id`, `style`, `status`, `target_platform`, `target_duration_seconds`, …

---

### 10.6 Logging, tiempo real y actividad (efectos al ejecutar planes vía API)

Al ejecutar acciones por `POST` `/api/ai/execute-actions` (u flujo equivalente):

| Tabla | Operación |
|-------|-----------|
| `realtime_updates` | **INSERT** — notifica a clientes (`update_type: ai_actions_executed`). |
| `activity_log` | **INSERT** — registro de actividad del proyecto. |

Cada petición de chat a la IA suele escribir también en **`ai_usage_logs`** (`src/lib/ai/router.ts`, `sdk-router.ts`).

---

## 11. Qué puede tocar la IA desde el chat (executor)

Implementación: `src/lib/ai/action-executor.ts` — funciones **`executeAction`** (plan legacy `AiAction`) y **`executeNewAction`** (plan nuevo con `table` + `type`).

Antes de muchas mutaciones se inserta fila en **`entity_snapshots`** (para restaurar / trazabilidad).

### 11.1 Tipos de acción legacy (`executeAction` → `switch (action.type)`)

| `action.type` | Tablas (operación) |
|---------------|-------------------|
| `update_scene` | `scenes` **UPDATE** (+ snapshot previo) |
| `update_prompt` | `scene_prompts` **UPDATE** `is_current` + **INSERT** nueva versión |
| `delete_scene` | `scenes` **DELETE** (+ snapshot) |
| `create_scene` | `scenes` **INSERT**; opcional `scene_camera` **INSERT** |
| `reorder_scenes` | `scenes` **UPDATE** `sort_order` |
| `update_character` | `characters` **UPDATE** |
| `create_character` | `characters` **INSERT** |
| `delete_character` | `characters` **DELETE** |
| `remove_character_from_scene` | `scene_characters` **DELETE** (+ snapshot fila) |
| `add_character_to_scene` | `scene_characters` **INSERT** |
| `update_camera` | `scene_camera` **UPDATE** o **INSERT** |
| `assign_background` | `scene_backgrounds` **UPDATE** o **INSERT** |
| `create_background` | `backgrounds` **INSERT** |
| `update_background` | `backgrounds` **UPDATE** |
| `create_video` | `videos` **INSERT** |
| `update_video` | `videos` **UPDATE** |
| `create_project` | `projects` **INSERT** |
| `create_prompt` | `scene_prompts` versionado (update previo + insert) |
| `explain`, `analyze_video`, `navigate` | Sin escritura en tablas de dominio |

### 11.2 Plan nuevo (`executeNewAction` con `action.table`)

Para tipos `create_*`, `update_*`, `delete_*`, `assign_*`, `create_prompt`, etc., el campo **`table`** indica la tabla objetivo (p. ej. `scenes`, `characters`, `scene_prompts`). Los casos especiales:

| Tipo | Tablas |
|------|--------|
| `assign_character` | `scene_characters` **INSERT** |
| `assign_background` | `scene_backgrounds` **DELETE** por `scene_id` + **INSERT** |
| `remove_character` | `scene_characters` **DELETE** |
| `update_prompt` / `create_prompt` | `scene_prompts` **UPDATE** + **INSERT** |
| `update_camera` | Tabla en `action.table` (típ. `scene_camera`) **UPDATE** / **upsert** |
| `delete_*` | Tabla en `action.table` **DELETE** (+ snapshot) |

Tras un lote de acciones legacy, se intenta **`recalc_project_stats`** (RPC) sobre el proyecto.

---

## 12. Mapa componente de chat → tabla Supabase (insert / update / delete)

| Componente / pieza UI | ¿Escribe en BD? | Tablas y operación |
|------------------------|-----------------|---------------------|
| **`CharacterCreationCard`** | Sí | **`characters`** **INSERT**; Storage `project-assets` (imagen ref.) |
| **`BackgroundCreationCard`** | Sí | **`backgrounds`** **INSERT**; Storage |
| **`VideoCreationCard`** | Sí | **`videos`** **INSERT** |
| **`ActionPlanCard`** (confirmar plan) | Sí (indirecto) | Según §11 — vía `executeActionPlan` / API execute-actions |
| **`ChatMessage`** + bloques solo lectura (`OPTIONS`, `SCENE_PLAN`, `PROJECT_SUMMARY`, `RESOURCE_LIST`, `VIDEO_SUMMARY`, `DIFF`, `PROMPT_PREVIEW`, `PREVIEW`, …) | No* | *Muestran datos; la acción llega si el usuario pulsa algo que dispara `onSend` / `onExecute` / quick actions |
| **`OptionsBlock`** | No por sí mismo | Suele enviar texto o disparar handler que puede llamar a la IA de nuevo |
| **`EntitySelector`** | No | Selección → callback (`onSend` / lógica) |
| **`ScenePlanTimeline`** | No | Visualización; edición real vía plan o páginas de escena |
| **`DiffView`** | No en el componente | “Aplicar” puede ir a modificar mensaje o pedir nuevo plan |
| **`WorkflowBlock` / acciones WORKFLOW** | Depende | Navegación o callbacks; sin tabla fija |
| **`ChatInput` / `ChatInputV2`** | Sí (historial) | Persistencia de mensajes en **`ai_conversations`** (hook `useKiyokoChat`) |
| **Ejecución remota** (`/api/ai/execute-actions`) | Sí | Mutaciones del plan + **`realtime_updates`**, **`activity_log`** |

---

*Última actualización: §10.5–12 — tablas de escena, executor `action-executor.ts`, mapa componente↔BD; tipos `src/types/database.types.ts`; producto §9; dock/Elije/tema como antes.*
