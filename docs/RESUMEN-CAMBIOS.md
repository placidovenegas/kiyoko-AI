# Resumen de Todos los Cambios Realizados

## Estadisticas Generales

| Metrica | Valor |
|---------|-------|
| Commits totales | ~25 commits |
| Archivos eliminados | ~60+ |
| Archivos creados | ~15 |
| Archivos modificados | ~40+ |
| Lineas eliminadas | ~8,000+ |
| Lineas añadidas | ~3,000+ |
| Resultado neto | -5,000 lineas (app mas limpia) |

---

## Fase 0: Limpieza Fundamental

### Modulo de tareas eliminado (44 archivos, -6,095 lineas)
- 12 paginas de tareas (`/tasks/*`, `/dashboard/tasks/*`, `/project/*/tasks/*`)
- 5 componentes de tareas (TaskCreatePanel, TaskWorkspacePage, etc.)
- 2 hooks (useTasks, useDashboardTasks)
- 3 archivos de modal (TaskCreateModal, types, useCreateTask)
- 2 libs de tareas (workspace.ts, suggestions.ts)
- 1 agente IA (task-agent.ts)
- Eliminado de: layout.tsx, Header.tsx, SidebarNavFixed.tsx, modals/index.ts, select-agent.ts
- Tabla `tasks` se mantiene en BD para reimplementar despues

### API routes muertas eliminadas (4 rutas)
- `/api/ai/analyze-project` (deprecated redirect)
- `/api/ai/derive-video` (sin UI)
- `/api/ai/generate-extensions` (sin UI)
- `/api/ai/generate-project` (incompleta)

### Archivos legacy eliminados
- `Sidebar.tsx` (stub vacio, reemplazado por AppSidebar)
- `ChatInputV2.tsx` (componente duplicado no usado)

### Stack IA simplificado (de 8 a 3 proveedores)

**Antes**: Groq → Mistral → Gemini → Cerebras → Grok → DeepSeek → Claude → OpenAI (8 proveedores)

**Ahora (Stack B)**:
| Proveedor | Rol | Env var |
|-----------|-----|---------|
| OpenRouter (Qwen 3.5) | Cerebro — texto, chat, prompts | OPENROUTER_API_KEY |
| Gemini Flash | Ojos — vision, analisis imagenes | GOOGLE_AI_API_KEY |
| Mistral (Voxtral) | Voz — TTS narracion | MISTRAL_API_KEY |
| Claude (opcional) | Premium — mejor calidad | ANTHROPIC_API_KEY |

Archivos actualizados: sdk-router.ts, provider-registry.ts, select-agent.ts, chat/route.ts, api-keys routes, ApiKeysSection.tsx, types/index.ts

### Types limpiados
- Eliminadas referencias a tablas dropped: `Export`, `BillingEvent`, `Comment`
- `AiProviderId` reducido de 9 opciones a 4

---

## Fase 1: Fundamentos

### Constantes centralizadas
- Creado `src/lib/constants/status.ts` con TODAS las constantes de status/phase
- 11 archivos actualizados para importar del archivo central
- Eliminadas ~20 definiciones duplicadas de PHASE_STYLES, STATUS_COLORS, STATUS_LABELS
- Corregida inconsistencia: sidebar usaba opacity 400, paginas 500 → ahora unificado

### Componentes reutilizables extraidos
- `EditableText.tsx` → extraido de scene detail page a `src/components/shared/`
- `ExpandablePrompt.tsx` → extraido de video page a `src/components/shared/`

### Migracion BD: scene_prompts mejorado
- `negative_prompt` (TEXT) — prompt negativo automatico
- `prompt_quality_score` (SMALLINT 1-10) — evaluacion de calidad
- `target_tool` (TEXT, default 'grok') — herramienta destino
- `visual_style_notes` (TEXT) — notas de estilo entre escenas
- Types regenerados con nuevos campos

### Componentes HeroUI (6 archivos migrados)
- SceneWorkForm: input, textarea x2, range → TextField, TextArea, Slider
- CharacterPickerModal: input search, select role → TextField, Select+ListBox
- DashboardHomeView: input search, select sort → TextField, Select+ListBox
- ProjectCreationCard: inputs, textarea, select → TextField, TextArea, Select
- VideoCreationCard: input, textarea → TextField, TextArea
- SceneSelect: native select → HeroUI Select internamente

---

## Fase 2: Calidad de Prompts

### Prompt builder centralizado
- Creado `src/lib/ai/prompt-builder.ts`:
  - `buildPromptMessage()` — constructor con estructura Grok
  - `getStyleTag()` — mapea estilos a tags visuales completos
  - `buildAdjacentContext()` — inyecta prompts de escenas vecinas
  - `DEFAULT_NEGATIVE_PROMPT` — constante reutilizable
  - Mapeos de camera angle/movement a comandos Grok

### Contexto adyacente en generacion de prompts
- `/api/ai/generate-scene-prompts` reescrito completamente:
  - Busca prompts de escena anterior y siguiente (por scene_number)
  - Inyecta contexto: "PREVIOUS SCENE PROMPT: ... maintain visual consistency"
  - Carga `style_presets` del proyecto (prefix, suffix, negative)
  - Carga `global_prompt_rules` del proyecto
  - Usa `SYSTEM_SCENE_GENERATOR` (guia Grok) en vez de prompt basico inline
  - Guarda `negative_prompt` y `target_tool` en BD
  - Mock prompts ahora usan formato [STYLE]/[TIMELINE] de Grok

### System prompts mejorados (3 archivos)
- `system-scene-generator.ts`: reescrito con guia completa Grok (planos, movimientos, timing, audio, negative)
- `system-scene-improver.ts`: mejorado con deteccion de intents del usuario
- `prompt-generator.ts` (agente): actualizado con formato video Grok y comandos de camara

---

## Fase 3: UX del Storyboard

### Breadcrumbs en Header
- Navegacion: Proyecto > Video > Escena (clickable)
- Separadores con ChevronRight
- Links funcionales a cada nivel

### Boton "Copiar para Grok"
- Formatea todos los prompts con headers de escena
- Incluye titulo, duracion, numero de escena
- Secciones imagen + video por separado
- Boton destacado con color primary
- Funcion `copyForGrok()` independiente

### Filtros de escenas
- Filtro por status: Todas / Borrador / Con prompt / Generadas / Aprobadas
- Conteo en cada filtro
- Se aplica al storyboard view
- Oculta filtros vacios

---

## SceneWorkModal — Rediseño Completo

### Layout unificado (Form + IA)
- Manual y IA coexisten side-by-side (no tabs separados)
- Formulario siempre visible a la izquierda
- Chat IA siempre visible a la derecha (340px)

### IA conectada a API real
- Chat llama a `/api/ai/generate-scenes` con contexto del proyecto
- Fallback a sugerencias locales si API no disponible
- Auto-sugerencia al cambiar posicion de insercion

### Auto-generacion de prompts
- Al crear escena → auto-llama a `/api/ai/generate-scene-prompts`
- Toast de progreso: "Generando prompts..." → "Prompts generados"
- Boton: "Crear y generar prompts" (una sola accion)

### Personajes y fondos inline
- CharacterChips: chips con avatar, busqueda, añadir/quitar
- BackgroundChips: chips con nombre, busqueda, añadir/quitar

### Sugerencias con descripcion rica
- Tarjeta de sugerencia con titulo, fase, duracion, camara, descripcion completa
- Botones: "Usar sugerencia" / "Otra opcion"
- Preview de prompts cuando la IA los genera

### Dropdown acciones funcionales
- Ver detalle, Editar, Regenerar prompts, Duplicar, Insertar antes, Eliminar
- Todas implementadas (antes eran "proximamente")

### Generacion paralela
- "Generar todos" ahora en batches de 3 (antes era secuencial)
- Toast con progreso: "X/Y prompts generados"

---

## Skill de Grok Video
- `.claude/skills/grok-video-prompts.md` — guia completa de cinematografia
- Estructura de prompt obligatoria para Grok Imagine
- Diccionario de planos y movimientos de camara
- Reglas de timing, audio, negative prompts
- Integrada en los system prompts de la app

---

## Documentacion
- `docs/PLAN-MAESTRO-ACCIONES.md` (805 lineas) — roadmap completo con 250+ tareas
- `docs/MEJORAS-COMPLETAS.md` — plan de mejoras por area
- `docs/GUIA_GROK_VIDEO_CINEMATOGRAFIA.md` — guia de cinematografia del usuario

---

## Mejoras Pendientes (Fases 4-7)

### Fase 4: Personajes y Fondos
- [ ] Edicion post-creacion (modal para editar campos)
- [ ] Prompt snippet editor con preview en tiempo real
- [ ] Turnaround de personajes (hoja de referencia multi-angulo)
- [ ] Variantes de fondos (diferentes horas del dia)
- [ ] Vista de coherencia por personaje (todas las escenas donde aparece)

### Fase 5: Export y Publicacion
- [ ] PDF storyboard funcional con @react-pdf/renderer
- [ ] ZIP completo (imagenes + prompts + script)
- [ ] Formato "Copiar para IA" optimizado por herramienta
- [ ] Calendario de publicaciones
- [ ] Export selectivo por escenas

### Fase 6: Settings y Mobile
- [ ] API Keys con boton "Probar conexion" por cada key
- [ ] Preferencias de IA (modelo, temperatura, estilo por defecto)
- [ ] Mobile: menu hamburguesa, bottom nav, drawer para chat
- [ ] Atajos de teclado (Cmd+K search, Cmd+N crear, Escape cerrar)

### Fase 7: Polish Final
- [ ] Loading skeletons en todas las listas
- [ ] Animaciones de entrada/salida en modales
- [ ] Accesibilidad (focus trap, aria-labels, contraste)
- [ ] Performance (paginacion de escenas, lazy loading de imagenes)
- [ ] Prompt scoring: evaluacion automatica de calidad 1-10
- [ ] A/B testing de prompts: generar 2 variantes
- [ ] Registro de correcciones del usuario para aprendizaje

### Sistema de Aprendizaje de IA (pendiente)
- [ ] Reglas de prompt en Project Settings (estructura preferida, herramienta destino)
- [ ] Style presets aplicados automaticamente (prefix, suffix, negative)
- [ ] Registro de correcciones del usuario (diff original vs editado)
- [ ] Deteccion de patrones ("siempre añades lighting" → sugerir regla)
- [ ] Feedback por prompt (👍/👎 con razones)
- [ ] Templates de prompt guardables ("Guardar como template")
- [ ] Chat detecta intents: "mas cinematico" → añade depth of field automaticamente
