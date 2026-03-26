# Catálogo de componentes del chat IA + especificación para el cliente

Documento de referencia para alinear **producto**, **prompts del modelo** y **UI**. Describe qué existe en la app, cómo debería sentirse la experiencia (según referencias visuales) y **preguntas / respuestas** por componente para cerrar el comportamiento definitivo.

**Alcance:** análisis y especificación. Los flujos “objetivo” marcan la dirección deseada; donde el producto aún no coincide, se indica como **brecha** para documentación o roadmap.

---

## 1. Referencias visuales (resumen)

| # | Idea | Qué representa |
|---|------|------------------|
| A | “Preparando asistente de video…” + icono de onda | Estado intermedio: la IA **está trabajando** antes de mostrar algo pesado; el cliente entiende que no ha fallado. |
| B | Frase suelta en el hilo: “Te muestro el editor de fondos…” | **Stream de texto** que **no desaparece**: queda como mensaje del asistente antes/después de abrir UI. |
| C | “Perfecto, preparo el formulario.” + formulario “Nuevo personaje” en dock + input “Creando…” | Orden: **1)** texto corto en chat **2)** componente (formulario) **3)** bloqueo claro del input. |
| D | Tarjeta verde “Juan / CHARACTER / Creado y guardado” + “¿Siguiente paso?” con lista `>` | **Después de crear** cualquier cosa: **misma familia visual** — éxito + pasos siguientes en el hilo. |

---

## 2. Principios globales (experiencia objetivo)

1. **Stream primero**  
   Antes de pintar un componente rico, el modelo debe **escribir en el hilo** (texto en streaming) **qué va a mostrar** y por qué. Ese texto **permanece** en el historial (como en la ref. B y C).

2. **Componente después**  
   Formularios, tarjetas de datos, listas interactivas aparecen **cuando el mensaje está listo** (o con estado “preparando…” como ref. A si hace falta feedback intermedio).

3. **Coherencia visual**  
   El cliente debe percibir que “la IA lo está haciendo”: onda/skeleton contextual durante la carga, luego pieza concreta.

4. **Post-creación unificado (ref. D)**  
   Tras **cualquier** creación exitosa (personaje, actor, fondo, vídeo, etc.), el hilo debería ofrecer: **confirmación visual fuerte** + **lista de siguientes pasos** (no solo una línea de texto plano).

5. **Cancelar / error**  
   Debe quedar **registro en el hilo** (p. ej. tarjeta de cancelación o mensaje claro), sin borrar lo que la IA ya escribió antes.

---

## 3. Inventario: qué componentes existen en el código

Render principal en `ChatMessage` + bloques parseados en `parse-ai-message.ts`.

| Bloque / UI | Componente o patrón | Entrada típica del modelo |
|-------------|---------------------|---------------------------|
| Texto markdown | `ReactMarkdown` | Respuesta libre |
| Líneas `☐` / `□` / `- [ ]` | `ChoiceSelector` (+ panel de intro) | Texto + líneas de opción |
| `[OPTIONS]…[/OPTIONS]` | `OptionsBlock` (acciones rápidas) | JSON array de strings |
| `[WORKFLOW: id\|label, …]` | Botones inline | Tag `WORKFLOW` |
| ` ```json ` action_plan legacy | `ActionPlanCard` | JSON plan de acciones |
| `[PREVIEW:…]` | `PreviewCard` | JSON datos + confirmación |
| `[SCENE_PLAN]…[/SCENE_PLAN]` | `ScenePlanTimeline` | Array de escenas |
| `[SELECT:tipo]` | `EntitySelector` | Tipo + entidades del contexto |
| `[DIFF]…[/DIFF]` | `DiffView` | Antes / después |
| `[PROMPT_PREVIEW]…[/PROMPT_PREVIEW]` | `PromptPreviewCard` | Prompt |
| `[PROJECT_SUMMARY]…[/PROJECT_SUMMARY]` | `ProjectSummaryCard` | JSON resumen |
| `[VIDEO_SUMMARY]…[/VIDEO_SUMMARY]` | `VideoSummaryCard` | JSON |
| `[SCENE_DETAIL]…[/SCENE_DETAIL]` | `SceneDetailCard` | JSON escena |
| `[RESOURCE_LIST]…[/RESOURCE_LIST]` | `ResourceListCard` | Personajes / fondos |
| `[CREATE:character|background|video]` | `CharacterCreationCard` / `BackgroundCreationCard` / `VideoCreationCard` (o dock si `hideCreateCards`) | JSON prefill + cierre `[/CREATE]` |
| `[AUDIO: url]` | Reproductor audio | URL |
| `creationCancelled` en mensaje | `CreationCancelledCard` | Estado de mensaje (cancelación) |
| Streaming sin contenido | `StreamingWave` | — |
| Bloques diferidos | `ComponentLoadingSkeleton` + etiqueta | Mientras `deferStructuredUi` |

**Sugerencias:** `[SUGGESTIONS]` se parsean en `parseAiMessage`; la superficie en UI del hilo principal puede variar — revisar si se muestran como chips en layout padre (`KiyokoChat` / sidebar).

---

## 4. Preguntas y respuestas por familia de componente

### 4.1 Texto plano + markdown

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Qué actualiza el cliente? | Solo el contenido del mensaje; no hay estado de formulario. |
| ¿Cómo interactúa? | Lectura; puede copiar o citar en un mensaje siguiente. |
| Si la IA se corta a mitad | Depende del cliente de streaming: suele mostrarse texto parcial hasta reconexión o fin de stream. |
| ¿Desaparece del chat? | No; permanece en el historial. |

---

### 4.2 Opciones con casillas (`ChoiceSelector`)

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Cómo debe escribir la IA antes? | Una o varias frases en streaming; luego líneas `☐ Opción`. El intro debe **quedar visible** (panel de intro + lista). |
| ¿Qué pasa al marcar y enviar? | Se envía un mensaje de usuario con las opciones elegidas (texto); el modelo continúa con ese contexto. |
| Si cancelo con teclado / cierro | No suele haber “cancelar” global; el usuario puede ignorar o enviar otro mensaje. |
| ¿Qué cambia en pantalla? | Las casillas reflejan selección; botón “Enviar selección” cuando hay al menos una. |

---

### 4.3 `[OPTIONS]` (botones rápidos)

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Texto previo obligatorio? | Recomendado: una frase en streaming (“Elige plataforma”) antes del bloque. |
| ¿Qué pasa al pulsar? | Envío de la etiqueta de la opción como mensaje (o callback equivalente). |
| Cancelar | No hay cancelación explícita; otro mensaje del usuario. |

---

### 4.4 `[CREATE:character|background|video]` (formularios de creación)

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Qué debe decir la IA antes? | **Una frase corta** (ref. C: “Perfecto, preparo el formulario.” / “Te muestro el editor de fondos…”). Debe **permanecer** en el hilo. |
| ¿Dónde se ve el formulario? | Con `hideCreateCards` (producción): **dock** sobre el input; el mensaje con `[CREATE]` puede ocultarse del hilo y delegarse al overlay. |
| ¿Qué pasa al pulsar Crear? | Llamada API / sandbox; en éxito suele llamarse `onCreated` con **mensaje de texto** (p. ej. “Personaje X creado correctamente.”). |
| ¿Cumple la ref. D (tarjeta + siguiente paso)? | **Brecha típica:** hoy suele ser **texto plano** de confirmación, no la tarjeta verde + lista “¿Siguiente paso?” de la referencia. Definir si el post-éxito será **componente dedicado** o **bloque `[OPTIONS]`** con el mismo copy. |
| Cancelar | Debe inyectarse estado de cancelación en el hilo (`CreationCancelledCard` o similar) según implementación. |
| Input bloqueado | Patrón “Creando…” / “Creando…” en compositor mientras dura la operación (ref. C). |

---

### 4.5 `[PROJECT_SUMMARY]` / `[VIDEO_SUMMARY]`

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Texto antes del bloque? | Recomendado: frase de stream (“Aquí tienes el resumen…”). |
| ¿Qué actualiza? | Tarjeta con métricas; no edita DB directamente desde la tarjeta salvo acciones definidas en la card. |
| Cancelar | No aplica; es lectura. |

---

### 4.6 `[RESOURCE_LIST]` / `[SCENE_DETAIL]`

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Interacción? | Acciones por botón en tarjeta (`onAction` → envía texto al chat). |
| Texto previo | Recomendado describir qué lista se muestra. |

---

### 4.7 `[SCENE_PLAN]` (timeline)

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Uso? | Visualización de plan de escenas; siguientes pasos suelen ser otro mensaje o `[OPTIONS]`. |

---

### 4.8 `[PREVIEW]` + `ActionPlanCard`

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Flujo? | Vista previa de datos → confirmación ejecuta plan; errores pueden reabrir `ActionPlanCard`. |
| Cancelar | Cancela ejecución del plan según handlers del mensaje. |

---

### 4.9 Plan de acciones JSON (legacy ```json)

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| ¿Cuándo usar? | Cuando hay que confirmar mutaciones en base de datos; requiere copy claro antes del bloque. |

---

### 4.10 Audio / WORKFLOW

| Pregunta | Respuesta orientativa |
|----------|------------------------|
| Audio | Reproductor embebido; la IA puede anunciar en texto que habrá audio. |
| WORKFLOW | Botones que disparan `onWorkflowAction` (ids definidos en el cliente). |

---

## 5. Flujo objetivo unificado (crear personaje / actor / fondo / vídeo)

Secuencia deseada alineada con las capturas:

1. **Usuario:** “Crear personaje” / “Crear actor” / “Crear fondo” / …  
2. **IA (stream):** frase corta tipo *“Perfecto, preparo el formulario.”* o *“Te muestro el editor…”* → **permanece** en el hilo (ref. B–C).  
3. **UI:** formulario en dock (o tarjeta si no hay dock) con estado claro (*“Creando…”*).  
4. **Éxito:** misma **familia** que ref. D — tarjeta de éxito con entidad + *“¿Siguiente paso?”* con opciones navegables.  
5. **Cancelación:** mensaje/tarjeta que no borre el punto 2.

**Brecha:** el paso 4 como **bloque visual fijo** puede no estar implementado para todas las entidades; puede estar cubierto solo por mensaje de texto. El documento de producto debe decidir el formato único (`[OPTIONS]`, componente nuevo, o markdown estructurado).

---

## 6. Por qué “a veces no contesta como quiero” (causas frecuentes, sin culpar una sola capa)

| Causa | Comentario |
|-------|------------|
| Formato de bloque incorrecto | Los tags `[TIPO]…[/TIPO]` deben cerrarse; JSON inválido rompe la tarjeta. |
| Prompt del agente vs. router | Distintos niveles (proyecto / vídeo / escena) tienen reglas distintas en `project-assistant`, `router`, etc. |
| `hideCreateCards` | El `[CREATE]` no se dibuja en el mensaje sino en dock: el usuario debe ver igualmente la **frase previa** en el stream. |
| Streaming + `deferStructuredUi` | Los componentes ricos se posponen hasta fin de stream; si el modelo no envía intro en texto, la sensación es “salta el componente sin explicación”. |
| Post-éxito solo texto | El usuario espera ref. D; si solo hay una línea, la sensación es “pobre” frente al mock. |

---

## 7. Checklist para el “documento definitivo” de prompts (equipo)

- [ ] Una frase de **stream** antes de cada bloque estructurado (`CREATE`, `PROJECT_SUMMARY`, `OPTIONS`, `☐`, etc.).  
- [ ] Misma **plantilla** para creación: personaje = actor = fondo = vídeo (ajustando sustantivos).  
- [ ] Definir **plantilla post-éxito** (ref. D) aplicable a todas las creaciones.  
- [ ] Lista de **IDs** válidos para `[WORKFLOW]` y acciones de tarjetas.  
- [ ] Comportamiento explícito en **cancelar** y **error de red**.  

---

## 8. Relación con otros docs

- `UX/09_chat_informe_componentes_y_siguiente_paso.md` — informe técnico previo sobre CHOICES, OPTIONS, CREATE.  
- `UX/05_chat_componentes_y_interaccion.md` — detalle de interacción en chat.  

Este documento **10_** centra la **especificación de cliente** y el **catálogo** para diseño de prompts y roadmap visual.

---

*Última actualización: documento de análisis; revisar cuando se implemente el bloque unificado post-creación (ref. D).*
