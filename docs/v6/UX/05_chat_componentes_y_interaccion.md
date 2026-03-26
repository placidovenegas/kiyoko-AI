# Chat UX (V6) — componentes, interacción y estilo

Este documento es el “catálogo” del chat Kiyoko en V6: qué componentes existen, qué muestran, cómo se conectan entre sí y cómo deben comportarse para que la UI sea consistente (sin ocultar elementos), especialmente en:
- streaming (la IA “va escribiendo”)
- bloques interactivos dentro de mensajes (OPTIONS/SELECT/DIFF/…)
- creación de entidades (CREATE:character/background/video) como overlay encima del input

Fuente principal de componentes:
- `src/components/chat/*`
- `src/components/kiyoko/*`

## 1) Stack de layout (quién contiene a quién)

### `src/components/kiyoko/KiyokoPanel.tsx`
Rol: contenedor global del chat con 3 modos.
Modos:
- `sidebar`: chat lateral con historial visible y resizer horizontal.
- `floating`: ventana movible/redimensionable (sin historial “persistente”).
- `fullscreen` (en mobile): el chat ocupa el contenedor completo sin tapar sliders/sidebars externos.

Interacción clave:
- el resizer del modo `sidebar` usa un “agarre” invisible (`w-2`) y una línea visible fina (`w-px`) que cambia a `#3E4452` solo en hover/active.

### `src/components/chat/KiyokoChat.tsx`
Rol: orquestador del chat (mensajes, historial, overlay de creación, scroll, contexto por ruta).

Contratos relevantes:
- `hideCreateCards` se activa en modo expandido para que los bloques `[CREATE:*]` se rendericen como overlay y no dentro del historial.
- `activeCreation` controla el overlay (character/background/video) y se cierra con cancel o después de crear.
- mientras se crea (`useAIStore().isCreating`):
  - se ocultan suggestions
  - se muestra `StreamingWave` con el label de creación
  - el input del chat recibe `isStreaming={isStreaming || isCreating}` para cambiar el estado visual.

Layout expandido (`mode=expanded`):
- izquierda: chat con header
- derecha: historial (con resizer)
- regla de tamaño: el chat mantiene un mínimo (según constants internas) y el historial se limita para no comprimir el área del mensaje.

### `ChatBody` (interno de `KiyokoChat.tsx`)
Rol: el “cuerpo” dentro del panel, separando en:
- zona de mensajes (scroll)
- suggestions inline (solo si NO hay streaming y NO se está creando)
- overlay de CREATE (arriba del input)
- input (siempre visible)

Detalles de UX:
- las suggestions se renderizan solo si:
  - `suggestions.length > 0`
  - `!isStreaming`
  - `!isCreating`
- el overlay de creación se renderiza arriba del input y NO dentro de la lista de mensajes.

### `src/components/kiyoko/KiyokoHeader.tsx`
Rol: navbar del chat (botones: nuevo chat, cambio de modo y cerrar).

Reglas de estilo:
- altura fija: `h-11.75` (47px aprox), para que todos los navbars del chat tengan consistencia.

### `src/components/chat/ChatHistorySidebar.tsx`
Rol: historial de conversaciones en la columna derecha.

UX:
- cabecera con “Nuevo”
- buscador local (filtro por `title`)
- agrupa por rango temporal (Hoy/Ayer/Esta semana/…)

### Resizers y borders
Reglas generales para “no tapar/duplicar bordes”:
- el borde visible de los resizers debe pertenecer al “handle”, no a ambos contenedores.
- en hover/active debe aparecer `#3E4452` y el resto del tiempo usar `border-border` / `bg-border` (según el componente).

## 2) Pipeline de rendering de mensajes

### `src/components/chat/KiyokoChat.tsx`
Recorre `messages` y renderiza `ChatMessage`:
- `isLastMessage` se marca en el último elemento para permitir skeleton/acciones durante streaming.
- pasa `hideCreateCards` y `onCreateCardRequested` para la mecánica de overlay.

### `src/components/chat/ChatMessage.tsx`
Rol: renderizador inteligente de cada mensaje.

Inputs clave:
- `message` (rol user/assistant + contenido + metadatos como audio/imágenes)
- `hideCreateCards?: boolean`
- `onCreateCardRequested?: (payload) => void`
- callbacks para acciones:
  - `onExecute`, `onCancel`, `onModify`, `onSend`, `onUndo`, `onWorkflowAction`

#### 2.1) Parsing y “qué se dibuja”
1. Si el mensaje es del usuario (`role === 'user'`):
   - se renderiza como burbuja de texto + thumbnails si existen `message.images`.
2. Si es del asistente:
   - se parsea `message.content` usando `parseAiMessage(message.content)` para obtener:
     - `text` (texto markdown normal)
     - `blocks` (bloques especiales tipados)
   - además:
     - `actionPlan` se intenta leer desde `message.actionPlan` o `parseActionPlan(...)`
     - `audioUrl` se lee con `parseAudioUrl(...)`
     - `choices` se detectan vía `parseContentSegments(...)`

#### 2.2) Bloques especiales (mapa a componentes)
`ChatMessage` filtra por `b.type` y renderiza:
- `SCENE_PLAN` → `ScenePlanTimeline`
- `OPTIONS` → `OptionsBlock`
- `SELECT` → `EntitySelector`
- `DIFF` → `DiffView`
- `PROMPT_PREVIEW` → `PromptPreviewCard`
- `PROJECT_SUMMARY` → `ProjectSummaryCard` (dentro de `BlockErrorBoundary`)
- `CREATE:*` → `CharacterCreationCard` / `BackgroundCreationCard` / `VideoCreationCard` (condicional con `hideCreateCards`)
- `SCENE_DETAIL` → `SceneDetailCard`
- `RESOURCE_LIST` → `ResourceListCard`
- `VIDEO_SUMMARY` → `VideoSummaryCard`

#### 2.3) Skeleton y “todo parece escribiéndose”
Para streaming dentro del mensaje:
- si el último mensaje del padre está streaming y detecta una “etiqueta de bloque” abierta sin cerrar, se muestra `BlockSkeleton`.
- si el mensaje no trae texto/bloques, se muestra `StreamingWave`.

### `BlockErrorBoundary` (en `ChatMessage.tsx`)
Rol: evita que un bloque rico rompa toda la burbuja.
Comportamiento:
- si falla el render de un bloque, muestra una línea de error genérica con un icono.

## 3) Catálogo de componentes del chat (qué muestran y cómo se interactúa)

En cada componente incluyo:
- Qué muestra
- Qué interacción acepta
- Qué callbacks/estados son relevantes para que no “se oculte nada”

### `src/components/chat/ChatInput.tsx`
Qué muestra:
- textarea para mensaje
- chips de adjuntos (solo imágenes por UX)
- botón `+` con menú (adjuntar / limpiar / cambiar modelo)
- provider chip (popovers con proveedores)
- botón Enviar / Detener (según `isStreaming`)

Interacción:
- `Enter` envía, `Shift+Enter` no.
- si `isStreaming` es true, el botón llama a `onStop`.

Estados relevantes:
- en V6 el padre usa `isStreaming={isStreaming || isCreating}` para “congelar” visualmente.

Mejora recomendada para el objetivo “no dejar cambiar cosas durante CREATE”:
- hoy el input cambia el placeholder y el modo del botón, pero no necesariamente deshabilita:
  - escritura en textarea
  - el menú `+`
  - la remoción de adjuntos
Esto puede chocar con “no me deja poder cambiar cosas” durante creación.

### `src/components/chat/StreamingWave.tsx`
Qué muestra:
- animación tipo “wave/Logo” para indicar IA “pensando/streaming”.
- `BlockSkeleton` para bloques parciales.

Interacción:
- no requiere callbacks; es un indicador visual.

### `src/components/chat/ChatHistorySidebar.tsx`
Qué muestra:
- historial agrupado (Hoy/Ayer/…)
- búsqueda por título

Interacción:
- `onSelect(convId)` carga conversación.
- `onNewChat()` inicia conversación nueva.

### `src/components/chat/OptionsBlock.tsx`
Qué muestra:
- grupo de botones tipo “chip” para elegir opciones.

Interacción:
- si `selected` existe y hay selección, deshabilita opciones no seleccionadas (patrón “elige exactamente una”).
- `onSelect(option)` llama al callback del padre (`onSend` o `onModify` en `ChatMessage`).

### `src/components/chat/EntitySelector.tsx`
Qué muestra:
- lista vertical de entidades (escenas/videos/personajes/fondos).
- header con icono y contador.

Interacción:
- `onSelect(entity)` dispara selección.
- en `ChatMessage` se traduce a mensajes tipo:
  - `He seleccionado: ${entity.label} (${entity.id})` (si hay `onSend`)
  - o `He seleccionado: ${entity.label}` (si se está en modo modificar).

### `src/components/chat/DiffView.tsx`
Qué muestra:
- vista “Antes vs Ahora” de un campo.

Interacción:
- solo presentación.

### `src/components/chat/PromptPreviewCard.tsx`
Qué muestra:
- preview de prompt (imagen o video) con:
  - Prompt EN
  - (opcional) descripción local + tags

Interacción:
- botón copiar prompt al clipboard.

### `src/components/chat/ScenePlanTimeline.tsx`
Qué muestra:
- timeline del plan por escenas (fase por color) + barra proporcional por duración.

Interacción:
- solo presentación.

### `src/components/chat/SceneDetailCard.tsx`
Qué muestra:
- card rica con:
  - número/título/fase/duración
  - descripción
  - personajes y fondo
  - cámara (si existe)
  - prompts de imagen y video
  - notas del director

Interacción:
- botones opcionales si `onAction` está presente:
  - editar escena
  - regenerar prompts de imagen/video
  - asignar personajes/fondo/cámara

### `src/components/chat/ActionPlanCard.tsx`
Qué muestra:
- resumen del plan de acciones (estado de ejecución y warnings).
- lista de acciones con iconografía y resultados por acción.

Interacción:
- `onExecute` (Guardar cambios) con `isExecuting` y spinner.
- `onModify('Modifica el plan: ')` para editar manualmente.
- `onCancel` para cancelar.
- `onUndo(batchId)` para deshacer una ejecución previa.

### `src/components/chat/ResourceListCard.tsx`
Qué muestra:
- grid/lista de recursos:
  - `type=characters` → CharacterList
  - `type=backgrounds` → BackgroundList
- dentro del componente existe “modo detalle” que consulta Supabase con `select('*')`.

Interacción:
- acciones opcionales `onAction` para “Crear el primero” o “Crear personaje”.
- dentro de detalle, `input[type=file]` permite subir imagen de referencia y actualizar fields.

Nota UX:
- en esta card hay mucho “estado propio” (loading, uploading, expandedIdx).
- si el objetivo es “todo se bloquee durante CREATE”, aquí habría que decidir si también se debe deshabilitar (no está implementado en el extracto que se leyó; el bloqueo fuerte está especialmente en los overlays de creación).

### `src/components/chat/PreviewCard.tsx`
Qué muestra:
- vista genérica de cualquier entidad/prompt con:
  - header por tipo
  - campos ordenados por prioridad
  - footer con botones: Guardar / Cambiar / Cancelar según estado.

Interacción:
- `onConfirm`, `onEdit`, `onCancel` y estados `isExecuting`, `isConfirmed`.

### `src/components/chat/VideoSummaryCard.tsx`
Qué muestra:
- resumen de video:
  - stats + progreso de prompts
  - lista de escenas con flags (tiene character/background/prompts)
  - acciones opcionales si `onAction` está definido

Interacción:
- botones de acción (según progreso y `onAction`).

### Cards de creación (overlay de CREATE)
Estas cards están diseñadas para vivir como overlay arriba del input en vez de dentro del historial:
- `src/components/chat/CharacterCreationCard.tsx`
- `src/components/chat/BackgroundCreationCard.tsx`
- `src/components/chat/VideoCreationCard.tsx`

Contrato de UX común:
- usan estado `saving` + `saved`
- muestran label “Creando...” mientras se guarda
- deshabilitan inputs/botones internos cuando `saving` está activo
- llaman `useAIStore.getState().setCreating(true, label)` al iniciar y lo apagan en `finally`
- usan un helper `withTimeout(...)` para evitar quedar colgadas si Supabase se estanca

Callbacks:
- `onCreated(msg)` se llama tras éxito (para que el padre inyecte un aviso al chat).
- `onCancel()` cierra el overlay si no se está guardando.

### Mecánica anti-“crear dentro del chat history”
En `ChatMessage.tsx`:
- `hideCreateCards` evita renderizar las cards dentro del historial (la lista de mensajes “no se llena” con formularios).
- además:
  - si el mensaje termina y contiene `CREATE`, dispara `onCreateCardRequested(...)` para que el padre abra el overlay.
- si el mensaje contiene *solo* `CREATE` y `hideCreateCards` está activo, `ChatMessage` retorna `null` (para que no quede “rellena los datos” en el historial).

## 4) Interacción “durante CREATE” (overlay, confirmación, cancelación)

Cadena de eventos:
1. La IA emite un mensaje assistant con bloque `[CREATE:*]`.
2. `ChatMessage` (si `hideCreateCards` está activo) detecta ese bloque:
   - no renderiza la card dentro del mensaje
   - llama `onCreateCardRequested` al padre
3. `KiyokoChat` recibe `activeCreation` y renderiza la card overlay encima del input.
4. Mientras la card guarda:
   - la card misma deshabilita inputs/botones
   - `ChatBody` oculta suggestions y muestra `StreamingWave`
5. Al crear:
   - la card llama `onActiveCreationCreated`
   - `KiyokoChat` inyecta un mensaje assistant con “created correctamente”
   - el overlay se cierra automáticamente tras ~2.5s

Evitar “reabrir”:
- `KiyokoChat` mantiene `dismissedCreationMessageIdsRef` para no volver a abrir el overlay para el mismo mensaje.

## 5) Reglas de estilo para que “no se oculten cosas” y todo se vea uniforme

### 5.1 Bordes y resizers
- por defecto, usar el estilo gris base `border-border` / `bg-border`.
- en hover/active del handle: usar `#3E4452`.
- evitar doble border: quitar borde duplicado en contenedores hermanos (el handle debe ser la fuente del borde).

### 5.2 Altura consistente del navbar
- todas las navbars del chat (header) usan altura fija equivalente a 47px (`h-11.75`).

### 5.3 Overlay siempre encima del input
- la creación se renderiza como overlay en `ChatBody` (arriba del input).
- la lista de mensajes usa `overflow-y-auto` y no “tapa” el overlay.

### 5.4 Skeleton/streaming
- si hay streaming incompleto (bloque abierto sin cerrar), se usa `BlockSkeleton`.
- si no hay contenido renderizable, se usa `StreamingWave`.

## 6) Checklist para mejoras futuras (cuando aparezcan “cosas que no se ocultan”)

1. Verificar que `ChatInput` quede completamente deshabilitado durante CREATE.
   - objetivo: que no se pueda escribir, ni adjuntar, ni abrir menús, ni borrar adjuntos mientras `isCreating=true`.
   - hoy depende de `isStreaming || isCreating` pero no hay un `disabled` explícito en el input.
2. Revisar cualquier card que tenga formularios internos fuera de overlay (por ejemplo, detalle interno de `ResourceListCard`) y decidir si también debe obedecer `isCreating`.
3. Asegurar que todos los bloques interactivos mantienen `overflow` correcto:
   - no usar `overflow-hidden` en contenedores que puedan recortar overlays o tooltips.
4. Mantener el contrato de reactividad del overlay:
   - siempre llamar a `setCreating(false)` en `finally`.
   - envolver Supabase calls críticas con `withTimeout`.

