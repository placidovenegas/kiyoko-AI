# Resumen Completo de Todos los Cambios — Fases 0-6

## Estadisticas Generales

| Metrica | Valor |
|---------|-------|
| Commits totales | ~30 |
| Archivos eliminados | ~65 |
| Archivos creados | ~20 |
| Archivos modificados | ~50+ |
| Lineas eliminadas | ~8,500+ |
| Lineas añadidas | ~4,000+ |
| Resultado neto | -4,500 lineas (app mas limpia y con mas features) |
| Migraciones BD | 2 (prompt quality fields + extension/insert types) |

---

## Fase 0: Limpieza Fundamental

### Modulo de tareas eliminado (-6,095 lineas, 44 archivos)
- 12 paginas, 5 componentes, 2 hooks, 3 modales, 2 libs, 1 agente IA
- Eliminado de layout, header, sidebar, modals/index, select-agent
- Tabla `tasks` mantenida en BD para futuro

### API routes muertas eliminadas (4 rutas)
- analyze-project, derive-video, generate-extensions, generate-project

### Archivos legacy eliminados
- Sidebar.tsx (stub vacio), ChatInputV2.tsx (duplicado)

### Stack IA simplificado (8 → 3+1 proveedores)
- **OpenRouter (Qwen)**: cerebro — texto, chat, prompts
- **Gemini Flash**: ojos — vision, analisis imagenes
- **Mistral (Voxtral)**: voz — TTS narracion
- **Claude**: premium opcional (solo con API key del usuario)
- Eliminados: Groq, Cerebras, Grok/xAI, DeepSeek, OpenAI, Stability
- 11 archivos actualizados (sdk-router, provider-registry, select-agent, chat, api-keys, settings UI, types)

---

## Fase 1: Fundamentos

### Constantes centralizadas (`src/lib/constants/status.ts`)
- SCENE_STATUS_LABELS/DOT/BADGE, PHASE_STYLES/BADGE/LABELS/HEX
- VIDEO_STATUS_LABELS/BADGE/DOT, PROJECT_STATUS_LABELS/BADGE
- 11 archivos actualizados, ~20 definiciones duplicadas eliminadas

### Componentes reutilizables extraidos
- `EditableText.tsx` → `src/components/shared/`
- `ExpandablePrompt.tsx` → `src/components/shared/`

### Migracion BD: scene_prompts mejorado
- negative_prompt, prompt_quality_score, target_tool, visual_style_notes
- Types regenerados

### Migracion a HeroUI (6 archivos)
- SceneWorkForm: TextField, TextArea, Slider (reemplazo de input, textarea, range)
- CharacterPickerModal: TextField, Select+ListBox
- DashboardHomeView: TextField, Select+ListBox
- ProjectCreationCard: TextField x2, TextArea, Select
- VideoCreationCard: TextField, TextArea
- SceneSelect: HeroUI Select internamente

---

## Fase 2: Calidad de Prompts

### Prompt builder centralizado (`src/lib/ai/prompt-builder.ts`)
- `buildPromptMessage()` — constructor con estructura Grok
- `getStyleTag()` — mapea estilos a tags visuales
- `buildAdjacentContext()` — inyecta prompts de escenas vecinas
- `DEFAULT_NEGATIVE_PROMPT` — constante reutilizable
- `CAMERA_ANGLE_CMD`, `CAMERA_MOVE_CMD` — mapeos a comandos Grok

### `/api/ai/generate-scene-prompts` reescrito
- Usa `SYSTEM_SCENE_GENERATOR` (guia Grok completa)
- Busca prompts de escena anterior/siguiente para consistencia visual
- Carga style_presets (prefix, suffix, negative) del proyecto
- Carga global_prompt_rules del proyecto
- Guarda negative_prompt y target_tool en BD
- Mock prompts en formato [STYLE]/[TIMELINE]

### System prompts mejorados (3 archivos)
- system-scene-generator.ts: guia Grok completa (planos, timing, audio, negative)
- system-scene-improver.ts: deteccion de intents del usuario
- prompt-generator.ts: formato video Grok con comandos de camara

---

## Fase 3: UX del Storyboard

### Breadcrumbs en Header
- Navegacion clickable: Proyecto > Video > Escena
- Separadores ChevronRight, links funcionales

### Boton "Copiar para Grok"
- Formatea prompts con headers de escena numerados
- Secciones imagen + video separadas
- Boton destacado con color primary en quick actions

### Filtros de escenas
- Todas / Borrador / Con prompt / Generadas / Aprobadas
- Conteo live, se aplica al storyboard view

---

## Fase 4: Extensions e Inserts

### Migracion BD
- `extension` e `insert` añadidos al enum scene_type
- `parent_scene_id` (FK) para agrupar children bajo padre
- `sub_order` para ordenar dentro del grupo

### Extension scenes (continuacion de clip)
- Solo prompt de video (no imagen — usa ultimo frame del padre)
- Video prompt empieza con `[CONTINUING FROM PREVIOUS CLIP]`
- Camara PUEDE cambiar (angulo, movimiento independiente)
- Personajes/fondos heredados del padre
- Max 3 extensiones por escena padre

### Insert scenes (plano detalle)
- Imagen + video propios (cutaway independiente)
- Duracion corta por defecto (2s)
- Propios personajes y fondos

### SceneWorkForm actualizado
- Selector tipo: Original / Extension / Insert
- Selector de escena padre (HeroUI Select)
- Banner informativo para extensiones
- Oculta pickers de personajes/fondos en extensiones

### Prompt generation actualizado
- Extensions: busca prompt imagen del padre como referencia
- Extensions: instruye al AI a generar solo video
- Insert: genera ambos normalmente

---

## Fase 5-6: Export y Settings

### Export (ya funcional)
- JSON, Markdown, HTML: descargan correctamente
- PDF: genera HTML optimizado para imprimir (Ctrl+P)
- Copiar prompts por escena individual
- Copiar para Grok formateado desde storyboard

### API Keys con test de conexion
- Boton ⚡ "Probar" junto a cada key configurada
- Llama a /api/user/api-keys/test
- Feedback visual: verde = OK, rojo = error
- Spinner durante test
- En secciones Esencial y Premium

---

## SceneWorkModal — Rediseño Completo

- Layout unificado: Form + IA Chat side-by-side
- IA conectada a API real `/api/ai/generate-scenes`
- Auto-generacion de prompts al crear escena
- Boton "Crear y generar prompts"
- Personajes/fondos inline con chips + busqueda
- Sugerencias contextuales con descripcion rica
- Selector Extension/Insert con padre
- Dropdown acciones: duplicar, eliminar, insertar, regenerar

---

## Skill de Grok Video
- `.claude/skills/grok-video-prompts.md` — cinematografia completa
- Integrada en system prompts de la app

---

## Documentacion
- `PLAN-MAESTRO-ACCIONES.md` (805 lineas, 250+ tareas)
- `MEJORAS-COMPLETAS.md` — plan por area
- `GUIA_GROK_VIDEO_CINEMATOGRAFIA.md` — guia del usuario
- `RESUMEN-CAMBIOS.md` — este documento

---

## Mejoras Pendientes

### Alta prioridad
- [ ] Edicion post-creacion de personajes (todos los campos)
- [ ] Prompt snippet editor con preview en tiempo real
- [ ] Edicion manual de prompts en escena detalle
- [ ] Storyboard: mostrar extensions/inserts indentados bajo padre
- [ ] Vista de coherencia: comparar prompts de escenas adyacentes

### Media prioridad
- [ ] Turnaround de personajes (hoja de referencia multi-angulo)
- [ ] Variantes de fondos (diferentes horas del dia)
- [ ] Historial de versiones de prompts
- [ ] Prompt scoring automatico (calidad 1-10)
- [ ] Mobile: menu hamburguesa, bottom nav, drawer para chat
- [ ] Atajos de teclado (Cmd+K, Cmd+N, Escape)

### Baja prioridad
- [ ] Loading skeletons en listas
- [ ] Animaciones entrada/salida modales
- [ ] Accesibilidad (focus trap, aria-labels)
- [ ] Paginacion de escenas para videos largos
- [ ] A/B testing de prompts
- [ ] Registro de correcciones del usuario para aprendizaje IA
- [ ] Templates de prompt guardables
- [ ] ZIP export con todo el material
- [ ] MP3 narracion export
- [ ] Calendario de publicaciones
