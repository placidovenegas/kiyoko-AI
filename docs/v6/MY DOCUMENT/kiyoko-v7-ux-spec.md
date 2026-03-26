# Kiyoko AI Chat — Especificación completa de UX e interacción (V7)

> Documento definitivo que describe **cada componente**, **cada transición**, **cada interacción** y **cada estado visual** del chat de Kiyoko AI. Diseñado para que cualquier desarrollador pueda implementar la experiencia exacta sin ambigüedad.

---

## 1. Filosofía de diseño

### 1.1 Principios fundamentales

**La IA es la protagonista.** El usuario nunca debería sentir que está rellenando formularios. Kiyoko trabaja por él: recoge información de la conversación, pre-rellena campos, y muestra progreso claro. El usuario solo revisa y confirma.

**Interacción desde el input.** Todas las decisiones importantes (crear entidad, elegir dirección, confirmar acción) aparecen como extensiones del input — crecen hacia arriba desde el campo de texto, no flotan desde el centro de la pantalla.

**Minimal y funcional.** Estética Notion + Supabase: fondos oscuros, bordes finos, tipografía limpia, sin decoraciones innecesarias. Los colores semánticos se usan con moderación y siempre con propósito.

**Todo es editable.** Cualquier dato que Kiyoko muestra (escenas, prompts, personajes) puede editarse inline sin salir del chat.

### 1.2 Tokens de color

| Token | Valor | Uso |
|-------|-------|-----|
| `background` | `#191919` | Fondo principal del chat |
| `surface` | `#1c1c1c` | Fondo de docks, cards, overlays |
| `border` | `#262626` | Bordes de inputs, cards, separadores |
| `border-subtle` | `#1f1f1f` | Separadores internos en listas |
| `text-primary` | `#ebebeb` | Texto principal, títulos |
| `text-secondary` | `#d4d4d8` | Texto de contenido de mensajes |
| `text-muted` | `#a1a1aa` | Texto secundario, descripciones |
| `text-ghost` | `#3f3f46` | Labels, hints, texto inactivo |
| `text-hidden` | `#262626` | Texto casi invisible, placeholders |
| `primary` | `#006fee` | Botón principal, acento de selección, links |
| `success` | `#17C964` | Creado, completado, checks |
| `warning` | `#F5A524` | Pendiente, atención, fases "hook" |
| `danger` | `#F31260` | Error, cancelado, prioridad alta |
| `purple` | `#a78bfa` | Personajes, tags secundarios |
| `green` | `#4ade80` | Fondos/locaciones |
| `blue` | `#4da6ff` | Videos, selección activa |

### 1.3 Tipografía

- **Font:** Inter (todo el chat)
- **Monospace:** Para prompts y contenido técnico
- **Tamaños:** Labels `9-9.5px` UPPERCASE con letter-spacing `.5-.7px`, cuerpo `11.5-12.5px`, títulos `12.5-13px` semibold
- **Jerarquía:** Siempre de arriba a abajo — título → descripción → campos → acciones

---

## 2. Estructura del layout

### 2.1 Sidebar (izquierda)

- Ancho: `46-52px`
- Logo "K" arriba (`28-32px`, borderRadius `6-8px`, fondo `#006fee`)
- Iconos de navegación: home, users, folder, film
- Gear abajo pegado al borde
- Borde derecho `1px solid #1a1a1a`

### 2.2 Header

- Altura: `40-44px`
- Contenido: "Kiyoko AI · Project Alpha" (nombre del proyecto en `#006fee`)
- Derecha: **botón Reset** (siempre visible), iconos +, clock
- Borde inferior `1px solid #1f1f1f`

### 2.3 Área de mensajes

- Scroll vertical, `max-width: 640-680px` centrado
- Padding `14-20px` horizontal, `14-20px` vertical superior
- Cuando hay dock activo: **opacity 0.2-0.28**, transición `0.3s ease`

### 2.4 Zona del input (fija abajo)

- Padding `0 18-22px 10-14px`
- Misma `max-width` que mensajes
- El dock crece ARRIBA del input
- El input SIEMPRE es visible debajo del dock

---

## 3. El input y cómo se conecta con los docks

### 3.1 Input en estado normal

```
┌─────────────────────────────────┐
│ 📎  🎤  Escribe algo...    [▲] │  ← border-radius: 10px completo
└─────────────────────────────────┘
```

- Fondo: `rgba(255,255,255,.012)`
- Borde: `1px solid #1f1f1f`
- Border-radius: `9-10px` (todos los lados)
- Botón enviar: `#006fee` (o `#1a1a1a` cuando disabled)

### 3.2 Input con dock abierto

```
┌─────────────────────────────────┐
│                                 │  ← Dock: border-radius 9px 9px 0 0
│     CONTENIDO DEL DOCK          │     (solo esquinas superiores redondeadas)
│                                 │
├─────────────────────────────────┤  ← borderTop sutil, sin gap
│ 📎  🎤  Creando...         [■] │  ← Input: border-radius 0 0 9px 9px
└─────────────────────────────────┘     (solo esquinas inferiores redondeadas)
```

- El dock y el input comparten el mismo ancho y borde lateral
- El dock tiene `border-bottom: none`
- El input tiene `border-top: 1px solid #1a1a1a` (separador sutil, no borde grueso)
- Visualmente son UNA SOLA PIEZA
- El input muestra "Creando..." como placeholder y está deshabilitado
- El botón enviar cambia a `#1a1a1a` (gris oscuro, inactivo)

### 3.3 Animación de apertura del dock

- Keyframe `dockIn`: `translateY(16-20px)` → `translateY(0)` + `opacity 0` → `1`
- Duration: `0.25-0.35s`
- Easing: `cubic-bezier(.22, 1, .36, 1)` (rebote suave)
- Los mensajes se atenúan simultáneamente con `opacity 0.2-0.28`

---

## 4. Flujo de mensajes

### 4.1 Mensaje del usuario

- Alineado a la derecha
- Max-width: `70-72%`
- Padding: `6-8px 11-14px`
- Border-radius: `9-12px 9-12px 2px 9-12px` (esquina inferior derecha casi recta)
- Fondo: `rgba(255,255,255,.03)`
- Borde: `1px solid #1f1f1f`
- Color texto: `#a1a1aa`

### 4.2 Mensaje del asistente

- Alineado a la izquierda, ancho completo
- Badge "KIYOKO AI": cuadrado azul 16-18px con icono sparkle blanco + texto uppercase `#3f3f46`
- Contenido con `padding-left: 21-24px` (alineado al badge)
- Color texto: `#a1a1aa`
- Puede contener bloques ricos (ver sección 6)

### 4.3 Indicador de "pensando"

- Mismo badge de Kiyoko AI
- 3 dots pulsantes con `animation: pulse 0.9s ease` stagger `0.12s`
- Color dots: `#006fee`
- Duración: `800-1200ms` antes de iniciar streaming

### 4.4 Streaming de texto

- El texto aparece carácter por carácter (typewriter)
- Velocidad: `12-16ms` por carácter
- Cursor: `1.5px` ancho, `12-13px` alto, `#006fee`, parpadeo `0.7s`
- Al terminar el streaming:
  - Si hay dock → espera `300-400ms` → abre dock
  - Si hay bloque → renderiza bloque inline
  - Si no → vuelve a `IDLE`

---

## 5. Flujo completo de creación (personaje / fondo / video)

### 5.1 Cadena de eventos paso a paso

```
1. Usuario escribe: "Crea al personaje Juan, 22 años, simpático"
2. Se añade mensaje del usuario al chat
3. FASE THINK: Indicador de pensamiento (dots) — 800-1200ms
4. FASE STREAM: Kiyoko responde con typewriter:
   "Perfecto, preparo el formulario de creación."
5. Al terminar texto → pausa 300ms → FASE DOCK
6. Dock sube con animación dockIn desde el input
7. Mensajes se atenúan a opacity 0.2
8. Input se deshabilita, placeholder "Creando..."
9. La IA pre-rellena los campos con datos del mensaje del usuario
10. Usuario revisa, puede editar campos
11. Opción A — Pulsa "Crear personaje":
    a. FASE SAVE: Dock muestra progreso por pasos (validar → guardar → creado)
    b. Al completar → FASE DONE
    c. Dock se cierra
    d. Mensaje de resultado aparece en el chat con card + sugerencias
    e. Input vuelve a estado normal
12. Opción B — Pulsa "Cancelar":
    a. Dock se cierra
    b. Mensaje de cancelación aparece (pill sutil con dot rojo)
    c. Input vuelve a estado normal
```

### 5.2 El texto de Kiyoko antes del dock

Es crucial que ANTES de abrir cualquier dock, Kiyoko diga algo natural:

| Acción | Texto de Kiyoko |
|--------|-----------------|
| Crear personaje | "Perfecto, preparo el formulario de creación." |
| Crear fondo | "Genial, abro el editor de locaciones." |
| Crear video | "Vamos a configurar el nuevo video." |
| Cancelar creación | (No hay texto previo, es acción del usuario) |
| Elije | "Necesito que elijas una dirección para continuar." |

Si el usuario cambia de opinión o pide otra cosa durante el dock, Kiyoko debería poder cerrar el dock y responder normalmente.

### 5.3 Dock: Crear personaje

```
┌─────────────────────────────────────────┐
│ 👤  Nuevo personaje                   ✕ │  Header: icono púrpura, título, botón cerrar
├─────────────────────────────────────────┤
│  ┌──────┐  NOMBRE                       │
│  │      │  ┌───────────────────────┐    │
│  │ UPLOAD│  │ Juan                  │    │  2 columnas: upload izq, campos der
│  │      │  └───────────────────────┘    │
│  └──────┘  ROL                          │
│            ┌───────────────────────┐    │
│            │ Protagonista        ▾ │    │  Dropdown (no chips, es selección única)
│            └───────────────────────┘    │
│                                         │
│  QUE HACE EN LA HISTORIA                │
│  ┌─────────────────────────────────┐    │
│  │ Joven aventurero de 22 años...  │    │  Textarea
│  └─────────────────────────────────┘    │
│                                         │
│  PERSONALIDAD            ✦ Sugerir      │  Label + botón de IA a la derecha
│  [Simpático] [Optimista] [Impulsivo]    │  Chips
│                                         │
│  PROMPT VISUAL                          │
│  ┌─────────────────────────────────┐    │
│  │ Estilo cinemático, iluminación..│    │  Textarea (monospace)
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│                   Cancelar  [Crear personaje] │  Footer
└─────────────────────────────────────────┘
```

**Campos y comportamiento:**

| Campo | Tipo | Pre-relleno IA | Obligatorio | Notas |
|-------|------|----------------|-------------|-------|
| Imagen upload | Drop zone 56-64px | No | No | Borde dashed `#262626`, icono upload |
| Nombre | Input texto | Sí (del mensaje) | Sí | Si no hay nombre, desactivar botón crear |
| Rol | Dropdown | Sí (default "Protagonista") | No | Opciones: protagonista, secundario, extra, narrador |
| Descripción | Textarea | Sí (si el usuario dio contexto) | No | Multiline |
| Personalidad | Chips + "Sugerir" | Sí (si la mencionó) | No | Botón ✦ Sugerir llama a la IA para generar |
| Prompt visual | Textarea mono | No (se genera después) | No | Placeholder: "Estilo cinemático, iluminación noir..." |

### 5.4 Dock: Crear fondo / locación

```
┌─────────────────────────────────────────┐
│ 📍  Nuevo fondo / locación            ✕ │  Header: icono verde
├─────────────────────────────────────────┤
│  REFERENCIA VISUAL                      │
│  ┌─────────────────────────────────┐    │
│  │     ☁  Subir imagen base       │    │  Drop zone más grande (56-64px alto)
│  │     PNG, JPG hasta 10MB         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  NOMBRE DE LA LOCACIÓN                  │
│  ┌─────────────────────────────────┐    │
│  │ Playa del Horizonte             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ENTORNO                                │
│  [interior] [●exterior] [mixto]         │  Chips, selección única
│                                         │
│  ILUMINACIÓN / MOMENTO                  │
│  ┌──────────┐ ┌──────────┐             │
│  │ Amanecer │ │ Mediodía │             │  Grid 2x2
│  ├──────────┤ ├──────────┤             │
│  │●Atardecer│ │  Noche   │             │
│  └──────────┘ └──────────┘             │
│                                         │
│  DESCRIPCIÓN (PROMPT)  MEJORAR CON IA   │  Label + botón IA azul a la derecha
│  ┌─────────────────────────────────┐    │
│  │ Detalles arquitectónicos...     │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│                    Cancelar  [Crear fondo]│
└─────────────────────────────────────────┘
```

### 5.5 Dock: Crear video

```
┌─────────────────────────────────────────┐
│ 🎬  Nuevo video                       ✕ │  Header: icono azul
├─────────────────────────────────────────┤
│  TÍTULO                                 │
│  ┌─────────────────────────────────┐    │
│  │ Mi Secuencia Cinemática         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  PLATAFORMA DE DESTINO                  │
│  ┌────────┬────────┬────────┬────────┐  │
│  │●Reels  │YouTube │TikTok  │Custom  │  │  Segmented control (no chips)
│  └────────┴────────┴────────┴────────┘  │
│                                         │
│  DURACIÓN         DESCRIPCIÓN           │
│  [0:15][●0:30]    ┌──────────────┐      │  2 columnas
│  [0:60][ 1:30]    │ Notas sobre  │      │
│                   │ el estilo... │      │
│                   └──────────────┘      │
│                                         │
│  ● Resumen: Reels · 9:16 · 0:30s       │  Badge informativo
├─────────────────────────────────────────┤
│                   Cancelar  [Crear video]│
└─────────────────────────────────────────┘
```

### 5.6 Progreso de guardado (Save)

Reemplaza el contenido del dock cuando el usuario pulsa "Crear":

```
┌─────────────────────────────────────────┐
│ 👤  Creando personaje...                │
├─────────────────────────────────────────┤
│  ✓ Validando                            │  Paso 1: spinner → check verde
│  ✓ Guardando en Supabase               │  Paso 2: spinner → check verde  
│  ✓ "Juan" creado                        │  Paso 3: check verde final
├─────────────────────────────────────────┤
│  [input deshabilitado]                  │
└─────────────────────────────────────────┘
```

- Cada paso aparece con `opacity 0→1` y stagger de `0.06-0.08s`
- Spinner: `11-13px`, borde `2px`, `border-top-color: #006fee`, `animation: spin 0.5-0.6s`
- Al completar el último paso → espera `300ms` → cierra dock → muestra resultado

### 5.7 Resultado post-creación

Aparece como mensaje de asistente normal con un bloque inline:

```
KIYOKO AI
┌─────────────────────────────────────────┐
│  [ J ]  Juan  PERSONAJE     ✓ Creado    │  Avatar con inicial, badge tipo, estado
│         Guardado en el proyecto          │
└─────────────────────────────────────────┘

Juan está listo. ¿Siguiente paso?

  › Subir imagen de referencia
  › Generar prompt visual
  › Editar detalles
  › Ver lista de personajes
  › Ver tareas del proyecto
```

**Las sugerencias son interactivas.** Al pulsar cualquiera:
- Se añade como mensaje del usuario al chat
- Kiyoko procesa y responde con el componente correspondiente
- Ejemplo: "Ver lista de personajes" → muestra `CharacterList`
- Ejemplo: "Subir imagen de referencia" → abre diálogo de subida
- Ejemplo: "Generar prompt visual" → Kiyoko genera y muestra `PromptPreview`

### 5.8 Cancelación

```
KIYOKO AI
┌─────────────────────────────────────────┐
│  ● Creación cancelada                   │  Dot rojo `#F31260` (5px) + texto muted
└─────────────────────────────────────────┘
```

- Sin barra lateral de color
- Sin título grande
- Solo una pill sutil con `background: rgba(255,255,255,.012)`, `border: 1px solid #1a1a1a`
- El dock se cierra, el input vuelve a normal

---

## 6. Bloques ricos en mensajes del asistente

### 6.1 Plan de escenas (`SCENE_PLAN`)

**Cuándo aparece:** Cuando el usuario pide planificar escenas o Kiyoko genera un plan automáticamente.

**Componente interactivo:**
- **Header:** icono folder + "Plan de escenas (N escenas)" + "Xs total" + botón "Añadir"
- **Cada escena:** fila con grip handle, número circular con color de fase, título editable (clic para editar inline), descripción, badge de fase, duración, botón eliminar
- **Barra de timeline:** `display: flex`, cada segmento proporcional a `dur`, colores por fase
- **Editable:** clic en título → input inline, Enter o blur para confirmar
- **Añadir:** botón "+ Añadir" crea nueva escena con defaults
- **Eliminar:** botón papelera elimina la escena y la barra se recalcula

Fases y colores:

| Fase | Color | Badge |
|------|-------|-------|
| Hook | `#F5A524` | Gancho |
| Build | `#006fee` | Desarrollo |
| Peak | `#17C964` | Clímax |
| Close | `#7828C8` | Cierre |

### 6.2 Análisis de escena (`ANALYSIS`)

**Cuándo aparece:** Cuando el usuario pide analizar pacing, ritmo, o rendimiento de una escena.

**Componente:**
- **Métricas:** 3 cards en fila con valor grande + label (ej: "4.2s Cut ratio", "Lento Velocidad", "78% Score sync")
- **Sugerencias:** lista de items, cada uno con:
  - Icono zap (activo) o check (aplicado)
  - Título en negrita + badge de severidad (alta/media/baja)
  - Impacto estimado a la derecha (ej: "+15% pacing")
  - Descripción detallada debajo
  - Botones "Aplicar" / "Ignorar"
  - Al aplicar: se tacha el título, icono cambia a check verde, opacity se reduce

### 6.3 Diff / Comparación (`DIFF`)

**Cuándo aparece:** Cuando se compara un cambio antes/después.

**Componente:**
- **Header:** icono edit + nombre del campo
- **2 columnas iguales:**
  - Izquierda: label "ANTES" en `#F31260`, fondo `rgba(243,18,96,.03)`, texto muted
  - Derecha: label "AHORA" en `#17C964`, fondo `rgba(23,201,100,.03)`, texto primario

### 6.4 Prompt Preview (`PROMPT_PREVIEW`)

**Cuándo aparece:** Cuando se genera o muestra un prompt de imagen/video.

**Componente:**
- **Header:** icono camera + "#1 Hook" + badge "Imagen" o "Video"
- **Label:** "PROMPT (EN)" en uppercase ghost
- **Contenido:** texto en monospace, color muted
- **Acciones:** botones "Copiar" (con feedback "✓ Copiado" temporal 1.5s) y "Regenerar"

### 6.5 Lista de personajes (`CHARACTER_LIST`)

**Cuándo aparece:** Cuando se listan los personajes del proyecto.

**Componente:**
- **Header:** icono user + "Personajes (N)" + botón "+ Nuevo"
- **Cada personaje:** avatar circular con iniciales (color por personaje), nombre, rol, badge de estado ("prompt OK" verde / "sin snippet" warning)
- **Botón Nuevo:** al pulsar, crea dock de personaje

### 6.6 Lista de fondos (`BACKGROUND_LIST`)

**Cuándo aparece:** Cuando se listan los fondos del proyecto.

**Componente:** Mismo layout que personajes pero con icono map y color verde, mostrando tipo + momento del día.

### 6.7 Detalle de escena (`SCENE_DETAIL`)

**Cuándo aparece:** Cuando se muestra o edita una escena específica.

**Componente editable:**
- **Header:** "#1" en color de fase + título (editable) + badge fase + duración + botón "Editar"/"Guardar"
- **Modo lectura:**
  - Descripción en texto
  - Chips de personaje (púrpura) y fondo (verde)
  - Bloque de prompt en monospace dentro de card sutil
  - Botones "Regenerar prompt", "Asignar cámara"
- **Modo edición:** (al pulsar "Editar")
  - Título → input inline
  - Descripción → textarea
  - Prompt → textarea editable
  - Los chips siguen visibles pero se podrían cambiar

### 6.8 Resumen del proyecto (`PROJECT_SUMMARY`)

**Cuándo aparece:** Cuando se pide estado general del proyecto.

**Componente:**
- **Header:** icono folder + "Project Alpha" + badge "Activo"
- **Grid 3x2** de métricas:
  - Videos (azul), Personajes (púrpura), Fondos (verde), Escenas (warning), Prompts (gris), Pendientes (danger)
  - Cada celda: número grande en color + label uppercase
- **Footer:** "Última actividad: hace 2h · Creado: 20 Mar 2026"

### 6.9 Resumen del video (`VIDEO_SUMMARY`)

**Cuándo aparece:** Cuando se pide estado de un video específico.

**Componente interactivo:**
- **Header:** icono film + título del video + badge de estado (Draft/Prompting/etc)
- **Info:** plataforma, aspect ratio, duración, nº escenas
- **Barra de progreso:** prompts generados vs total, barra azul animada
- **Lista de escenas expandible:** cada escena se abre al hacer clic mostrando:
  - Personaje y fondo asignados (chips con color)
  - Badges img ✓ / vid ✓ (o ✗)
  - Botones "Gen imagen", "Gen video", "Editar"
  - Al pulsar "Gen imagen" → marca como completada y la barra de progreso se actualiza
- **Botón "Añadir escena":** crea nueva escena al final

### 6.10 Tareas (`TASKS`)

**Cuándo aparece:** Cuando se piden tareas o se crea una nueva.

**Componente completamente interactivo:**
- **Header:** icono task + "Tareas (N pendientes)" + botón "+ Nueva"
- **Crear tarea:** al pulsar "+ Nueva":
  - Se abre formulario inline con animación `up`
  - Input de texto con autofocus
  - Selector de fecha (input text con icono calendario)
  - Botones "Cancelar" / "Crear"
  - Enter en el input crea la tarea
- **Cada tarea:**
  - Checkbox cuadrado con border-radius `4px`
  - Texto de la tarea
  - Fecha (con icono calendario)
  - Badge de prioridad (alta/media/baja con colores danger/warning/ghost)
  - Botón papelera (visible en hover)
  - Al marcar como completada: checkbox se llena de `#17C964`, texto se tacha, tarea se mueve al final
- **Orden:** pendientes arriba, completadas abajo

### 6.11 Workflow / Opciones de acción (`WORKFLOW`)

**Cuándo aparece:** Como botones de acción rápida después de un análisis o resumen.

**Componente:**
- Botones horizontales en flex-wrap
- Cada botón: pill con dot de color a la izquierda + label
- Hover: borde cambia al color del dot, texto se aclara
- Al pulsar: ejecuta la acción (puede abrir dock, generar prompt, etc)

---

## 7. Elije — Overlay de preguntas

### 7.1 Cuándo aparece

Cuando Kiyoko necesita que el usuario tome una decisión para continuar. Puede ser dirección narrativa, estilo visual, etc.

### 7.2 Layout

```
┌─────────────────────────────────────────┐
│ Elije                                   │
│ ¿Qué tono debería tener la transición?  │
│                                         │
│  [A] Suspenso Minimalista               │
│  [B] Drama de Alta Intensidad      ✓    │  ← Seleccionado
│  [C] Atmósfera Etérea                   │
│                                         │
│  SALTAR              [Continuar]        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📎  🎤  Esperando...              [▲]  │  Input conectado
└─────────────────────────────────────────┘
```

### 7.3 Interacción

- Al seleccionar opción B → fondo sutil azul, badge con check
- Al pulsar "Continuar" → se cierra overlay, se añade respuesta del usuario al chat, Kiyoko continúa
- Al pulsar "Saltar" → se cierra overlay, cancelación sutil

### 7.4 Visual de opciones

- Letra badge: `20-22px` cuadrado, border-radius `4-6px`
  - Normal: `background rgba(255,255,255,.03)`, `color #52525b`, `border #262626`
  - Seleccionado: `background rgba(0,111,238,.1)`, `color #4da6ff`, `border rgba(0,111,238,.2)`
- Check de confirmación: icono check `#006fee` al final de la fila seleccionada
- Botón "Continuar": gradiente `linear-gradient(135deg, #006fee, #338af7)` — solo activo si hay selección

---

## 8. Acciones que el usuario puede pedir (y qué responde Kiyoko)

| Comando del usuario | Texto de Kiyoko | Componente que aparece |
|---------------------|-----------------|----------------------|
| "Crea un personaje llamado X..." | "Perfecto, preparo el formulario." | Dock: Character creation |
| "Crea un fondo de..." | "Abro el editor de locaciones." | Dock: Background creation |
| "Crea un video para..." | "Configuro el nuevo video." | Dock: Video creation |
| "Planifica las escenas" | "Plan de escenas del video:" | Bloque: ScenePlan |
| "Analiza la escena 1" | "He analizado Scene 01 a fondo:" | Bloque: Analysis |
| "Compara los cambios" | "Aquí tienes la comparación:" | Bloque: Diff |
| "Genera el prompt de imagen" | "Prompt generado para la escena:" | Bloque: PromptPreview |
| "Muestra detalle de la escena" | "Detalle de la escena #1:" | Bloque: SceneDetail |
| "Lista de personajes" | "Personajes del proyecto:" | Bloque: CharacterList |
| "Lista de fondos" | "Fondos disponibles:" | Bloque: BackgroundList |
| "Resumen del proyecto" | "Resumen del proyecto:" | Bloque: ProjectSummary |
| "Resumen del video" | "Estado del video:" | Bloque: VideoSummary |
| "Muestra las tareas" | "Tareas del proyecto:" | Bloque: Tasks |
| "Elije la dirección" | "Elige una dirección:" | Dock: Elije overlay |
| "Subir imagen al personaje X" | "Abro el uploader:" | Dock o acción directa |
| "Mejorar prompt de la escena X" | "Regenerando prompt:" | Bloque: PromptPreview actualizado |
| "Crea una tarea: X para fecha Y" | "Tarea creada:" | Bloque: Tasks con la nueva tarea |

---

## 9. Estados visuales de cada componente

### 9.1 Chips de selección

| Estado | Border | Background | Color |
|--------|--------|------------|-------|
| Normal | `#262626` | `transparent` | `#3f3f46` |
| Seleccionado | `#006fee` | `rgba(0,111,238,.06)` | `#4da6ff` |
| Hover (si es interactivo) | `#333` | `rgba(255,255,255,.02)` | `#52525b` |

### 9.2 Botones

| Tipo | Background | Color | Border |
|------|------------|-------|--------|
| Primario | `linear-gradient(135deg, #006fee, #338af7)` | `#fff` | none |
| Ghost | `transparent` | `#52525b` | `1px solid #262626` |
| Peligro | `transparent` | `#F31260` | `1px solid #F31260` |
| Disabled | `#1a1a1a` | `#262626` | none |
| Hover primario | `transform: scale(1.02)` | — | — |

### 9.3 Cards de bloque

| Elemento | Valor |
|----------|-------|
| Background | `rgba(255,255,255,.018)` |
| Border | `1px solid #1f1f1f` |
| Border-radius | `8px` |
| Header border-bottom | `1px solid #1a1a1a` |
| Row border-bottom | `1px solid #141414` |
| Row hover | `background: rgba(255,255,255,.01)` |

### 9.4 Badges

| Tipo | Patrón |
|------|--------|
| Cualquier badge | `background: {color}14`, `color: {color}`, `fontSize: 8-8.5px`, `padding: 2px 6px`, `border-radius: 3px`, `uppercase`, `letter-spacing: .4px` |

---

## 10. Animaciones

| Nombre | Keyframes | Uso |
|--------|-----------|-----|
| `up` | `translateY(5-8px)→0` + `opacity 0→1` | Mensajes nuevos, elementos inline |
| `dockIn` | `translateY(16-20px)→0` + `opacity 0→1` | Apertura de docks |
| `fadeIn` | `opacity 0→1` | Empty state, transiciones suaves |
| `blink` | `opacity 1↔0` cada `0.7s` | Cursor de streaming |
| `pulse` | `opacity 0.1↔0.5` cada `0.9s` | Dots de pensamiento |
| `spin` | `rotate(0→360deg)` cada `0.5-0.6s` | Spinners de guardado |

Todas con duración `0.15-0.35s` y easing `cubic-bezier(.22, 1, .36, 1)` excepto spin (linear).

---

## 11. Checklist de implementación

### 11.1 Componentes a crear/modificar

| Componente | Estado | Prioridad |
|-----------|--------|-----------|
| `DockShell.tsx` | Nuevo — shell reutilizable para todos los docks | Alta |
| `CharacterCreationDock.tsx` | Refactorizar existente | Alta |
| `BackgroundCreationDock.tsx` | Refactorizar existente | Alta |
| `VideoCreationDock.tsx` | Refactorizar existente | Alta |
| `ElijeDock.tsx` | Refactorizar de `ChatQuestionPrompt` | Alta |
| `SaveProgress.tsx` | Nuevo — progreso de guardado | Alta |
| `CreationResult.tsx` | Nuevo — card de resultado + sugerencias | Alta |
| `CancelNotice.tsx` | Nuevo — pill de cancelación | Media |
| `ScenePlan.tsx` | Mejorar existente — añadir edición inline, añadir/eliminar | Alta |
| `Analysis.tsx` | Nuevo — métricas + sugerencias aplicables | Alta |
| `DiffBlock.tsx` | Mantener existente | Baja |
| `PromptPreview.tsx` | Mejorar — añadir "Copiar" con feedback | Media |
| `SceneDetail.tsx` | Mejorar — añadir modo edición inline | Alta |
| `CharacterList.tsx` | Mejorar — añadir badges de estado | Media |
| `BackgroundList.tsx` | Mejorar — similar a CharacterList | Media |
| `ProjectSummary.tsx` | Mejorar — grid de métricas | Media |
| `VideoSummary.tsx` | Nuevo/mejorar — escenas expandibles + generación | Alta |
| `TaskBlock.tsx` | Nuevo — tareas interactivas con fechas | Alta |
| `WorkflowButtons.tsx` | Nuevo — botones de acción con dots | Media |

### 11.2 Cambios en el sistema de mensajes

- `injectAssistantNotice` debe aceptar objetos ricos (no solo strings)
- Nuevo tipo de contenido: `creation_result` con `entity` y `suggestions`
- Nuevo tipo: `cancel_notice`
- Los bloques deben poder ser interactivos (estado propio, callbacks)

### 11.3 Cambios en el prompt del modelo

El system prompt debe instruir al modelo a:
1. Siempre emitir texto conversacional ANTES de un bloque `[CREATE:*]`
2. Extraer el máximo de datos del mensaje del usuario para pre-rellenar
3. Usar las sugerencias post-creación como guía para el siguiente paso
4. Cuando el usuario pide una acción de las sugerencias, responder con el componente adecuado

---

## 12. Flujos de usuario más comunes

### 12.1 Crear proyecto desde cero

```
1. Usuario: "Quiero crear un video para Instagram"
2. Kiyoko: texto + dock Video
3. Usuario: confirma → video creado
4. Sugerencia: "Crear personajes"
5. Usuario pulsa → dock Personaje
6. Confirma → personaje creado
7. Sugerencia: "Planificar escenas"
8. Usuario pulsa → Kiyoko genera ScenePlan
9. Usuario edita escenas inline
10. Sugerencia: "Generar prompts"
11. Kiyoko genera → PromptPreview por escena
```

### 12.2 Revisar y mejorar

```
1. Usuario: "Analiza el pacing de la escena 1"
2. Kiyoko: Analysis con métricas + sugerencias
3. Usuario: aplica sugerencia "Apretar Shot 04"
4. Kiyoko: DiffBlock con antes/después
5. Workflow: "Ver plan actualizado"
6. Kiyoko: ScenePlan con cambios
```

### 12.3 Gestión de tareas

```
1. Usuario: "Crea una tarea: generar prompts para escena 3, para el 26 de marzo"
2. Kiyoko: "Tarea creada:" + TaskBlock con la nueva tarea
3. Usuario marca tarea como completada directamente en el bloque
4. Usuario: "Muestra tareas pendientes"
5. Kiyoko: TaskBlock actualizado
```
