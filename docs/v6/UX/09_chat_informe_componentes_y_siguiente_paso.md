# Informe: componentes en el chat, CHOICES y “siguiente paso”

Este documento describe **qué ocurre en la UI** cuando el asistente muestra bloques interactivos o resultados de creación, y contrasta el **comportamiento actual en código** con la **referencia visual** (tarjeta de éxito + lista “¿Siguiente paso?”).

---

## 1. Resumen ejecutivo

| Elemento | Cómo lo genera la IA | Cómo se ve en pantalla | Cuándo aparece (streaming) |
|----------|----------------------|-------------------------|----------------------------|
| Texto + markdown | Respuesta normal | Párrafos, listas, negritas | Se va mostrando en streaming |
| Líneas `☐` / `□` / `- [ ]` | Bloque de opciones con título opcional (`## Título` o `Título:`) | **ChoiceSelector**: casillas, botón “Enviar selección” | Tras el stream (bloques estructurados diferidos) |
| `[OPTIONS:...]` | Bloque compacto de acciones | **QuickActionGrid** (botones) | Tras el stream |
| `[CREATE:CHARACTER]` etc. | Inicio de formulario en dock | **PreviewCard** + apertura del formulario | Tras el stream + handoff |
| Creación completada | `injectAssistantNotice` / mensaje de sistema | Texto en burbuja del asistente | Inmediato |

---

## 2. Sandbox: botones de prueba

En **Playground → Chat sandbox**, los botones insertan **texto de asistente simulado** en el hilo para probar el renderizado.

| Botón | Qué inserta (idea) | Componente / bloque |
|-------|---------------------|---------------------|
| **CHOICES** | `### Elige una o varias:` + líneas `☐ Opción A`… | **ChoiceSelector** (casillas + Enviar) |
| **OPTIONS** | `[OPTIONS: Instagram \| TikTok \| YouTube]` | **QuickActionGrid** |
| **CREATE CHARACTER** | `[CREATE:CHARACTER]` + línea intro | **PreviewCard** + formulario en dock (tras stream) |
| (Otros CREATE / PREVIEW) | Análogo | Misma familia de comportamiento |

---

## 3. Preguntas y respuestas (por flujo)

### 3.1 CHOICES (elige una o varias y enviar)

**P: ¿Qué debe escribir la IA para que salgan casillas y el botón Enviar?**  
**R:** Líneas que empiecen por `☐`, `□` o `- [ ]` seguidas del texto de la opción. Opcionalmente, una línea de encabezado terminada en `:` o un `## Título` justo antes del bloque actúa como **título del grupo** (se muestra en mayúsculas pequeñas sobre las opciones).

**P: ¿La frase “Elige una o varias” es obligatoria?**  
**R:** No es un requisito técnico del parser; es **copy recomendado**. Puede ir como markdown antes del bloque (por ejemplo `### Elige una o varias:`). El sandbox usa exactamente ese texto de ejemplo.

**P: ¿Qué pasa al pulsar Enviar?**  
**R:** Se envía al chat un mensaje de usuario con las opciones elegidas (texto legible), para que el modelo continúe con ese contexto.

**P: ¿Por qué a veces no veo las casillas mientras “escribe”?**  
**R:** Los bloques estructurados (choices, options, tarjetas de creación) pueden **diferirse hasta que termine el streaming** (`deferStructuredUi`), para no mostrar UI a medias. Mientras tanto puede mostrarse una **etiqueta de “onda”** indicando que el componente está en camino.

---

### 3.2 OPTIONS (botones rápidos)

**P: ¿En qué se diferencia de CHOICES?**  
**R:** `[OPTIONS: a | b | c]` renderiza **botones en fila/cuadricula** (QuickActionGrid). CHOICES usa **casillas** y selección múltiple con confirmación explícita.

**P: ¿Cuándo usar uno u otro?**  
**R:** OPTIONS para 2–5 acciones inmediatas (“ir a…”, “abrir…”). CHOICES cuando hace falta **elegir uno o varios** entre alternativas y enviar de una vez.

---

### 3.3 CREATE (personaje, fondo, vídeo…)

**P: ¿Qué ve el usuario al detectarse `[CREATE:…]`?**  
**R:** Tras terminar la respuesta en streaming (y un breve handoff), aparece la **tarjeta de vista previa** y el **formulario en el dock** (input fusionado con el compositor).

**P: ¿Qué pasa si cancela la creación?**  
**R:** Se puede mostrar una tarjeta de cancelación **en el hilo** (no solo un banner), coherente con producción y sandbox.

---

### 3.4 Después de crear (referencia: tarjeta + “¿Siguiente paso?”)

**P: ¿La app muestra hoy exactamente la pantalla de la referencia (tarjeta verde con nombre + “Creado y guardado” y debajo “¿Siguiente paso?” con filas `>`)?**  
**R:** La **referencia** es el objetivo de producto. En la implementación actual, lo habitual es un **mensaje de texto** del asistente confirmando la creación (`injectAssistantNotice` o equivalente). Una **lista visual dedicada** “¿Siguiente paso?” con el mismo estilo que la captura puede ser **fase siguiente** (bloque nuevo, o markdown + patrón `[OPTIONS]` / componente específico).

**P: ¿Cómo acercarse a esa UX sin nuevo componente?**  
**R:** Tras crear, el asistente puede enviar en la misma respuesta: (1) confirmación en texto, (2) un bloque `[OPTIONS: Ver personaje | Subir imagen referencia | …]` para reproducir acciones rápidas debajo del mensaje.

---

## 4. Checklist para redactores de prompts (IA)

1. Antes de `[CREATE:*]`, **una frase corta** de handoff (regla del asistente de proyecto).
2. Para selección múltiple: título + líneas `☐ …` y copy tipo “Elige una o varias”.
3. Para acciones siguientes: `[OPTIONS: …]` o texto + enlaces según política del producto.
4. Tras éxito de creación: mensaje claro + opciones de siguiente paso (texto y/o OPTIONS).

---

## 5. Referencias de código (lectura)

- Parser de choices y `ChoiceSelector`: `src/components/chat/ChatMessage.tsx` (`parseContentSegments`, `CHOICE_RE`).
- Inserción sandbox CHOICES / OPTIONS: `src/components/chat/ChatSandboxView.tsx`.
- UI diferida durante streaming: `deferStructuredUi` y etiquetas de componente en `ChatMessage.tsx`.
- Handoff de formularios: `creationFormIntroLabel`, `CREATION_FORM_HANDOFF_MS`, `pendingCreation` en `KiyokoChat.tsx` / `ChatSandboxView.tsx`.

---

*Documento alineado con el comportamiento descrito en el código a fecha de redacción; si se añade un bloque visual “¿Siguiente paso?” dedicado, actualizar la sección 3.4.*
