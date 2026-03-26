# Plan de mejoras UI/UX — Chat Kiyoko (imágenes + prototipo + app)

Documento de revisión conjunta: **referencias visuales** (capturas), **`kiyoko-chat-prototype.jsx`** (interacción y estilos), **`kiyoko-v7-ux-spec.md`** (especificación), y **código actual** (`KiyokoChat`, docks, etc.). Objetivo: alinear **cuándo** aparece cada cosa, **cómo** debe verse y **qué** falta implementar o unificar.

---

## 1. Resumen ejecutivo

| Fuente | Aporta |
|--------|--------|
| **Imagen 1 — Formulario personaje** | Modal centrado, labels EN mayúsculas (NAME/ROLE), chips de personalidad, barra inferior “Creando…”. |
| **Imagen 2 — Progreso pasos** | Lista Validando → Guardando → “Juan” creado con spinner; pie con “Creando…” + envío. |
| **Imagen 3 — Landing chat** | Hero Kiyoko + 3 acciones (video, personaje, fondo) + input tipo pastilla con clip/mic/send + hint Enter. |
| **Imagen 4 — Empty contextual** | Título con nombre proyecto en acento + grid 2×2 tarjetas (Creative / Analysis / Workflow / Assets). |
| **Prototipo JSX** | Máquina de estados, dock fusionado al input, `dockIn` / atenuación mensajes, bloques ricos, pasos `SAVE` con `SV`. |
| **App actual** | Dock encima del input (no modal centrado), `ChatInput` sin mic en todos los contextos, creación sin lista de pasos en la misma card. |

**Decisión de producto recomendada:** mantener el **dock anclado al input** (V7 + app) como patrón principal; usar **modal centrado** solo si en tests usuarios confunden dock + input. Las **imágenes 1–2** se interpretan como variaciones — incorporar **pasos de guardado** (imagen 2) y **opcionalmente** el hero landing (imagen 3) en rutas vacías.

---

## 2. Máquina de estados (unificar lenguaje)

El prototipo define fases claras; la app real mezcla `isStreaming`, `isCreating`, `activeCreation`, `dock`:

| Estado (prototipo `P.*`) | Significado | Equivalente en app |
|--------------------------|-------------|---------------------|
| `IDLE` | Listo para escribir | `!isStreaming && !isCreating && !activeCreation` |
| `THINK` | IA “piensa” (dots) | Tras enviar, antes del primer token (si se muestra) |
| `STREAM` | Texto en streaming | `isStreaming` |
| `DOCK` | Overlay/dock visible | `activeCreation` o `inputQuestion` en `ChatInputV2` |
| `SAVE` | Guardando entidad (pasos) | Solo parcial: `isCreating` + label; **falta** UI de pasos tipo `SV` |
| `DONE` | Cierre y mensaje resultado | Tras `onCreated` + banner/cierre |

**Mejora:** documentar en código un enum o comentario único que mapee estos estados para no divergir entre sandbox, prototipo y producción.

---

## 3. Pantalla por pantalla: qué debe verse y cuándo

### 3.1 Empty global (imagen 3 — Landing)

**Objetivo:** primera impresión “cinematográfica” sin historial.

| Elemento | Debe aparecer cuando | Notas |
|----------|----------------------|--------|
| Logo / título “Kiyoko AI” | `messages.length === 0` y contexto global (dashboard) | Subtítulo corto inspiracional (imagen 3). |
| 3 botones grandes | Mismo estado | `Nuevo video`, `Añadir personaje`, `Generar fondo` — disparan comando o abren dock. |
| Input pastilla ancho completo | Siempre en la zona inferior | Clip + **mic opcional** + placeholder + send **azul**. |
| Texto “PULSE ENTER PARA ENVIAR” | Debajo del input | Muy sutil (`text-[10px] text-muted-foreground`). |

**Gap:** `KiyokoEmptyState` actual puede ser más “hero” (imagen 3) en dashboard; hoy está más cercano a imagen 4 en proyectos con nombre.

**Mejora P1:** variante `variant="landing"` vs `variant="project"` (imagen 4).

---

### 3.2 Empty con proyecto (imagen 4 — Quick actions 2×2)

**Objetivo:** usuario ya en un proyecto; la IA propone tareas.

| Elemento | Cuándo | Interacción |
|----------|--------|-------------|
| Título “How can I help you build **{Nombre}**?” | Proyecto activo, chat vacío o sin mensajes recientes | Nombre en gradiente/accent `#006fee` o similar. |
| Subtítulo explicativo | Mismo | Texto fijo o dinámico. |
| 4 tarjetas (Creative / Analysis / Workflow / Assets) | Mismo | Hover: elevación sutil o borde; click → `onSend(prompt)` o abre flujo. |

**Gap:** prototipo usa fila de chips pequeños (`qCmds`); imagen 4 es **grid 2×2** más visual.

**Mejora P1:** alinear `KiyokoEmptyState` con grid 2×2 + categorías con color (imagen 4) y mantener chips compactos como alternativa en sandbox.

---

### 3.3 Dock “Nuevo personaje” (imagen 1 + prototipo)

**Objetivo:** crear personaje sin sentir un formulario pesado.

| Elemento | Prototipo | Imagen 1 | App actual | Acción |
|----------|-----------|----------|------------|--------|
| Posición | Dock encima del input, ancho max 640 | Modal centrado | Dock encima input | **Mantener dock**; opcional tema “modal” en tablet. |
| Cabecera | Icono morado + título + X | Igual + X | Similar | OK |
| Personalidad | **Chips** (Simpático, Optimista, Impulsivo) | Igual | **Campo texto** + Sugerir IA | **Decidir:** chips (más visual) vs texto (más flexible) o ambos. |
| Labels | “Nombre”, “Rol”… | NAME / ROLE en EN mayúsculas | ES mezclado | **Unificar** idioma y estilo labels (V7 spec: uppercase 9px). |
| Prompt visual | Placeholder cinemático | “Estilo cinemático…” | “Prompt visual (EN)” | Alinear placeholder y label. |
| Pie dock | Cancelar + Crear (gradiente en prototipo) | Botones claros | Similar | OK |
| Input inferior | “Creando…” atenuado | “Creando…” + send | Placeholder + disabled | OK |

**Mejora P1:** tokens de color del prototipo (`#1c1c1c` surface dock, `#262626` border) vs `globals.css` — **documentar mapping** o ajustar Tailwind para match pixel.

**Mejora P2:** chips de personalidad como **atajo** que rellenan el campo texto o toggles que concatenan.

---

### 3.4 Estado “Guardando” (imagen 2 + componente `SV` del prototipo)

**Objetivo:** feedback explícito de validación → Supabase → éxito.

| Paso | Prototipo `SV` | Imagen 2 | App actual |
|------|----------------|----------|------------|
| Validando | ✓ check verde | ✓ | No visible |
| Guardando | ✓ check | ✓ | Solo `StreamingWave` / toast |
| “{nombre} creado” | Spinner + texto | Spinner + línea | Card verde success en card |

**Gap:** la app no muestra **lista de pasos** dentro del mismo contenedor que el formulario.

**Mejora P1:** tras pulsar “Crear personaje”, transición `DOCK form` → `DOCK progress` (misma shell, contenido `SV`) con 2–3 pasos; luego card verde compacta o mensaje en hilo + cierre dock (como prototipo `P.SAVE` → `DONE`).

**Mejora P2:** el pie inferior de la imagen 2 (lápiz + “Creando…” + flecha) **no duplicar** el input principal si genera confusión; preferir **solo** input global atenuado con “Creando…” (como V7 §3.2).

---

### 3.5 Tras crear — mensaje de resultado (prototipo)

El prototipo inserta mensaje `__result__` con tarjeta resumen + nombre + “siguiente paso” + lista de acciones sugeridas.

| Elemento | Debe aparecer cuando |
|----------|----------------------|
| Tarjeta mini entidad creada | Tras `DONE` |
| Pregunta “¿Siguiente paso?” | Opcional |
| Lista vertical: Subir imagen, Generar prompt… | Opcional; cada ítem = `onSend` o abre dock |

**Gap:** producción inyecta texto de asistente pero no siempre lista de **siguientes pasos** con la misma densidad visual.

**Mejora P2:** componente `PostCreationSummary` reutilizable.

---

### 3.6 Cancelar creación

| Fuente | Comportamiento |
|--------|----------------|
| Prototipo | `__cancel__` → burbuja “Creación cancelada” con dot rojo |
| App | Banner “Cancelado” + texto, timeout 2.5s |

**Mejora P3:** unificar copy: “Creación cancelada” vs “Has cancelado la creación del personaje X” — **mantener mensaje descriptivo** (app) con estilo visual del prototipo (dot + card sutil).

---

### 3.7 Bloques ricos en el hilo (solo prototipo)

ScenePlan, Analysis, VideoSum, Tasks, SceneDetail, Diff, etc. — **transiciones** `animation: up .2s`, hover en filas.

**Mejora P1:** aplicar `animate-in` / fade-in consistente en `ChatMessage` al montar bloques (reducir “salto” visual).

**Mejora P2:** timeline de `ScenePlan` con barra de colores abajo (prototipo) ya cercana a `ScenePlanTimeline` — verificar paridad.

---

## 4. Transiciones y motion (del prototipo)

| Animación | Uso | Implementación sugerida |
|-----------|-----|-------------------------|
| `dockIn` | Apertura dock | Ya en `chatDockOverlay.ts` + Framer; verificar `translateY(16px)` y easing `cubic-bezier(.22,1,.36,1)` |
| `up` | Mensajes nuevos | `animation: up .2s` en bloques |
| `blink` | Cursor streaming | Caret en último mensaje |
| `pulse` | Dots “thinking” | THINK state |
| **Messages opacity** | `0.2` cuando dock (prototipo) | App usa `~0.45` — **decidir valor único** (V7 dice 0.2–0.28) |

**Mejora P1:** alinear opacidad con V7 spec (`0.2–0.28`) o documentar por qué 0.45.

---

## 5. Mapa de prioridades

### P0 — Coherencia inmediata
- [ ] Unificar **labels** (mayúsculas / tamaño / idioma) entre formularios CREATE y `kiyoko-v7-ux-spec.md`.
- [ ] Revisar **un solo valor** de atenuación del hilo con dock abierto.
- [ ] Copy **cancelación**: combinar claridad (app) + estilo compacto (prototipo).

### P1 — Experiencia de creación
- [ ] UI de **pasos** Validando / Guardando / Creado (componente tipo `SV`) antes del cierre del dock.
- [ ] Empty state **dos variantes**: landing hero (imagen 3) vs proyecto 2×2 (imagen 4).
- [ ] Entrada **Enter to send** hint visible en empty landing.

### P2 — Después de crear
- [ ] Bloque **resultado + siguientes pasos** (como `__result__` del prototipo).
- [ ] Chips de **personalidad** opcionales o híbridos con campo texto.

### P3 — Opcional
- [ ] Variante **modal centrado** para crear personaje en viewport estrecho.
- [ ] Micrófono en input donde el producto lo permita (imagen 3).

---

## 6. Checklist de revisión visual (Stitch / QA)

- [ ] Dock e input **una sola pieza**: radios solo arriba (dock) y solo abajo (input), sin doble borde grueso.
- [ ] Botón enviar: azul activo, gris cuando `busy`.
- [ ] Iconos: personaje morado `#a78bfa`, fondo verde `#4ade80`, vídeo azul `#4da6ff` / `#006fee`.
- [ ] Estados de error/toast no tapar el dock.
- [ ] Historial lateral: resizer 1px, hover `#3E4452`.

---

## 7. Archivos de referencia

| Archivo | Rol |
|---------|-----|
| `docs/v6/MY DOCUMENT/kiyoko-chat-prototype.jsx` | Comportamiento de referencia + CSS inline |
| `docs/v6/MY DOCUMENT/kiyoko-v7-ux-spec.md` | Tokens y reglas detalladas |
| `docs/v6/UX/06_chat_referencia_visual_flujos_y_tema.md` | App real + tablas Supabase |
| `docs/v6/UX/08_prompt_stitch_chat_pagina_a_pagina.md` | Prompts artboard por artboard |

---

## 8. Notas sobre las imágenes adjuntas

1. **Formulario personaje (modal):** si se mantiene como referencia de **densidad** de campos, no como posición absoluta en pantalla.
2. **Progreso con checks:** referencia fuerte para la **fase SAVE**; alinear con timeouts reales de Supabase (`withTimeout` 30s).
3. **Landing hero:** guía para **marketing / primera visita**; puede vivir fuera del panel de proyecto.
4. **Grid 2×2 Project Alpha:** guía para **empty contextual** con proyecto cargado.

---

*Documento vivo: marcar checkboxes conforme se implemente. Última revisión al incorporar capturas + prototipo JSX + spec V7.*
