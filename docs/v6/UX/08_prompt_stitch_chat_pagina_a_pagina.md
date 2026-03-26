# Prompt Stitch — Chat Kiyoko (página a página + interacciones)

Úsalo en **Stitch / Figma AI / herramientas de UI** generando **un artboard por pantalla** (o variaciones de estado en el mismo frame). El cuerpo principal del prompt está en **inglés** (mejor para modelos de diseño); la sección final resume **cómo usarlo** en español.

---

## Cómo invocarlo

1. Pega primero el bloque **«GLOBAL DESIGN SYSTEM»**.
2. Luego pega **una sola sección «ARTBOARD N»** por generación, o pide un **set de 6–8 artboards** listando los números.
3. Para interacciones, añade al final: *“Include interaction notes as numbered callouts on the canvas.”*

---

## GLOBAL DESIGN SYSTEM (pegar una vez)

```
PRODUCT: "Kiyoko AI" — desktop web app, AI assistant for video production (projects, characters, backgrounds, scenes, videos). Visual language: Notion (spacing, clarity) + Supabase (dark, refined). Minimal chrome, no playful illustrations unless subtle.

PALETTE (dark-first):
- Page/chat background: #191919
- Text primary: #EBEBEB; secondary: #71717A
- Card / header bar: #202020; muted strips: #282828
- Border: #2E2E2E, 1px
- Primary action: #006FEE; primary on buttons white text
- Success confirmation: emerald tint (subtle), not neon
- Resizer / drag hover: #3E4452 (only on hover/active, NOT always on)

TYPO: Inter; body 14px; labels 11–12px; section labels 10px uppercase muted.

LAYOUT RULES:
- Chat header bar height ~47px fixed.
- Chat column min readable width ~450px when history is open.
- History sidebar max ~75% viewport width; chat does not shrink below minimum — layout pushes width.
- Resizer: 1px visible line, thin hit area; hover dark grey #3E4452.
- Docked panels above input: width = input width minus 30px, centered; flush to input (no gap); bottom corners square; top corners rounded ~12px; background #191919; border sides + top only.

INTERACTION PRINCIPLES:
- Send: Enter submits; Shift+Enter newline.
- While streaming OR while creating entity: composer disabled, attachments disabled, provider menu disabled; primary button becomes STOP (streaming) or shows loading (creating).
- Cancel creation: closes dock, shows small "Cancelado" banner in message area for ~2.5s, no orphan form in chat stream.
- Question overlay "Elije": keyboard — arrows move selection; A–C letters; Enter confirm; Esc skip; "Other" reveals text field.
```

---

## ARTBOARD 1 — App shell: dashboard con panel de chat cerrado o estrecho

```
ARTBOARD 1 — Dashboard + chat collapsed

FRAME: 1440×900, dark theme.

LEFT: App sidebar (icon rail, ~64px), bg #202020, border-r #2E2E2E.

MAIN: Project/dashboard content area (placeholder blocks: title, cards) bg #191919.

RIGHT EDGE: Thin vertical strip or floating pill "Kiyoko" — chat panel NOT visible or only a narrow tab — suggest user can open assistant.

COMPONENTS: Top nav of dashboard if present; subtle.

INTERACTION CALLOUT: Clicking open-chat expands the chat panel from the right without covering the app sidebar (sidebar stays visible).

OUTPUT: 1 high-fidelity screen + optional annotation numbers.
```

---

## ARTBOARD 2 — Chat panel lateral (sidebar mode): vacío + input

```
ARTBOARD 2 — Chat panel open, EMPTY state

FRAME: 1440×900. Left app sidebar unchanged. Main content area split: main page (blurred or dim placeholder) + CHAT PANEL docked right (~40% width) full height.

CHAT PANEL STRUCTURE (top to bottom):
1) Header ~47px: left context label (project name, muted); right icon buttons: new chat, history, expand. Border-b #2E2E2E, bg #202020.
2) Body: EMPTY STATE centered — short title, description, 3–4 "quick action" pills (rounded, border) in a row or column.
3) Bottom: COMPOSER — textarea (min height), left (+) for attachments, right send button primary. Placeholder "Ask Kiyoko…".

INTERACTION: User can type and click Send; no messages yet. Suggestions chips do NOT show in empty state (or show only quick actions, not post-message suggestions).

OUTPUT: Fidelity UI, dark, calm.
```

---

## ARTBOARD 3 — Conversación normal (mensajes + sugerencias)

```
ARTBOARD 3 — Chat with conversation + suggestions

Same shell as Artboard 2. Message area scrolls with padding (top + sides).

MESSAGES:
- User message: compact block, aligned right or distinct surface.
- Assistant message: left aligned, readable width; markdown-like paragraphs; optional inner "card" for structured content (border #2E2E2E, bg #202020).

Below last assistant message: SUGGESTION CHIPS — horizontal wrap, pill shape, bg #202020, 1px border, small text; hover thin gradient border (teal→blue→purple) very subtle.

COMPOSER: enabled; Send = blue; attachments (+) visible.

INTERACTION CALLOUTS:
(1) Send message → new user bubble appears, then assistant reply area (can show as static mock).
(2) Click chip → chip text sent as user message (visual: chip could de-emphasize after use in a later state — optional second artboard).
```

---

## ARTBOARD 4 — Streaming (IA escribiendo)

```
ARTBOARD 4 — Streaming in progress

Same chat layout. Last assistant message shows TYPING / WAVE indicator at bottom of bubble (subtle animation suggestion).

COMPOSER STATE:
- Textarea DISABLED (muted).
- Send replaced by STOP button (destructive or neutral dark with red hint — keep minimal).
- (+) menu disabled; provider chip disabled; remove attachment disabled.

SUGGESTIONS: HIDDEN (no chips below last message).

INTERACTION: User clicks STOP → streaming ends (annotate); composer re-enabled in next variant.
```

---

## ARTBOARD 5 — Overlay "Elije" (pregunta anclada al input)

```
ARTBOARD 5 — Question dock + composer

Show the docked panel IMMEDIATELY ABOVE the composer, visually ATTACHED (no gap).

PANEL:
- Width: centered, 30px narrower than composer width (draw with guides).
- Title "Elije"; subtitle question text muted.
- Options: vertical list; each row letter badge A/B/C, label; one row SELECTED with primary border + soft fill.
- Footer: "Saltar" ghost button + "Continuar" primary.

COMPOSER: slightly de-emphasized optional; user still sees it; if spec requires, textarea empty waiting for answer.

INTERACTION CALLOUTS:
- Enter = Continuar with selected option.
- Esc = Saltar.
- Arrow keys = change selection (show on annotation).
- "Other…" row: optional third artboard variant with small text field under that row.

OUTPUT: Show flush join: panel bottom edge = input top edge; no rounded bottom on panel.
```

---

## ARTBOARD 6 — Crear personaje (dock de creación + mensajes atenuados)

```
ARTBOARD 6 — Create character dock

MESSAGE AREA: reduced opacity ~45% (still readable) — annotation "dimmed while dock open".

DOCK (same geometry as Elije): form "Nuevo personaje", header with purple user icon.

FORM FIELDS:
- Left: dashed image upload square OR thumbnail with remove.
- Right: name input, role dropdown.
- Sections: "Que hace en la historia" textarea; "Personalidad" with "Sugerir" link; "Prompt visual (EN)" textarea with "Generar" link.

FOOTER: Cancelar (ghost) | Crear personaje (primary).

COMPOSER: DISABLED or read-only; placeholder "Creando…" OR show creating spinner in header strip — pick one consistent pattern.

INTERACTION CALLOUTS:
(1) Cancelar → dock closes; small banner "Cancelado" appears above input area with message "Has cancelado la creación del personaje …" (show example name).
(2) Crear personaje → primary shows loading; then SUCCESS STATE (Artboard 7).
```

---

## ARTBOARD 7 — Éxito tras crear (dentro del dock)

```
ARTBOARD 7 — Creation success micro-state

Same dock position. Inside dock: compact SUCCESS strip — green subtle border/bg, check icon, "Personaje «Name» creado", secondary line with role.

Then dock auto-closes (annotate); assistant confirmation message appears in thread (optional small line in message list).

COMPOSER: re-enabled.

INTERACTION: After ~2.5s dock dismisses — show as note, not animation.
```

---

## ARTBOARD 8 — Crear fondo / locación (variante)

```
ARTBOARD 8 — Create background dock

Same dock rules. Header: green pin icon, "Nuevo fondo / locación".

CONTENT: image ref upload; name; chips: interior | exterior | mixto; row: time of day amanecer/dia/atardecer/noche; prompt EN textarea + Generar.

FOOTER: Cancelar | Crear fondo.

INTERACTION: Same cancel/success pattern as character; banner text references "fondo".
```

---

## ARTBOARD 9 — Crear vídeo (variante)

```
ARTBOARD 9 — Create video dock

Header: blue film icon, "Nuevo video".

FIELDS: title + "Sugerir"; platform segmented buttons (Instagram Reels 9:16, YouTube 16:9, etc.); duration chips 15s–5min; description + Generar.

READ-ONLY summary line: platform · aspect · duration.

FOOTER: Cancelar | Crear vídeo.

INTERACTION: Cannot submit without title — show disabled primary until title non-empty (annotation).
```

---

## ARTBOARD 10 — Modo expandido: chat + historial a la derecha

```
ARTBOARD 10 — Expanded chat + history column

Three columns: App sidebar | MAIN CHAT | HISTORY.

MAIN CHAT: header + messages + composer (same components).

HISTORY COLUMN: width ~240–320px; search field; sections Today/Yesterday; conversation rows with title + time; "Nuevo" button at top.

BETWEEN chat and history: vertical RESIZER 1px; hover #3E4452.

RULE: Chat column keeps min width; history pushes layout (do not crush chat below ~450px — show generous desktop width).

INTERACTION: Drag resizer — annotate. Click row — loads conversation (static mock).
```

---

## ARTBOARD 11 — Página sandbox de pruebas (opcional)

```
ARTBOARD 11 — Chat sandbox / playground

Same chat visually but TOP or SIDE toolbar with buttons: "Insert block: OPTIONS, SCENE_PLAN, CREATE:character…" and "Limpiar chat".

Purpose: designer sees this is a DEV surface — optional subtle "Sandbox" badge.

Composer may include Elije demo — reuse Artboard 5.

INTERACTION: Buttons do not call real AI — show as UI only.
```

---

## Notas de uso (español)

- **Orden recomendado** para Stitch: 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 1 → 11.
- **Siempre** repetir el bloque GLOBAL o al menos colores + reglas del dock (30px, sin hueco, sin radio inferior).
- Para **interacciones**, pide explícitamente *callouts numerados* en el lienzo o una **tabla de interacción** en el mismo archivo de exportación.
- **Enviar**: solo con mensaje listo y no en streaming; **Stop** corta stream.
- **Crear**: botón primario en el dock; durante guardado todo deshabilitado; **Cancelar** cierra y muestra banner; **éxito** micro-estado verde y luego cierre.

---

*Documento de apoyo para diseño; coherente con `UX/06_chat_referencia_visual_flujos_y_tema.md`.*
