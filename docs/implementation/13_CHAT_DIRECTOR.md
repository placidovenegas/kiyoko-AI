# Fase 13 — Chat IA como Director Creativo

## Estado: ⚠️ PARCIAL (action-executor implementado, UI y flujo pendientes)

## Origen: docs/update/KIYOKO_MEJORAS_v4_FINAL.md

## Objetivo

Convertir el Chat IA en el centro de control del storyboard. El usuario habla con Kiyoko como un director de cine, y Kiyoko ejecuta cambios sobre escenas, personajes, prompts y timeline automáticamente con plan de acción → confirmación → ejecución.

## Lo que ya existe

### Implementado:
- `src/lib/ai/action-executor.ts` — Ejecutor completo con soporte para: update_scene, delete_scene, create_scene, reorder_scenes, update_character, remove/add_character_from_scene, update_prompt, explain
- `src/lib/ai/action-executor.ts` — executeActionPlan() para batch + undoBatch() para deshacer
- `src/types/ai-actions.ts` — Tipos AiAction, AiActionPlan, AiActionType, AiActionResult
- `src/lib/ai/prompts/system-chat-director.ts` — System prompt del chat director
- `src/lib/ai/prompts/system-storyboard-director.ts` — System prompt del storyboard director
- `src/components/storyboard/ChatStoryboard.tsx` — Componente base del chat en storyboard
- `src/components/storyboard/HistoryPanel.tsx` — Panel de historial
- `src/stores/useAiChatStore.ts` — Store del chat

## Tareas Pendientes

### 13.1 Action Parser
- [ ] Crear `src/lib/ai/action-parser.ts` — Parsea respuesta de IA (markdown + JSON embebido) a array de AiAction
- [ ] Detectar bloques ```json con AiActionPlan en respuestas del chat
- [ ] Validar acciones con Zod schema

### 13.2 UI de Plan de Acciones en el Chat
- [ ] Crear componente `ActionPlanCard` — Muestra plan con:
  - Summary en español
  - Lista de acciones con iconos por tipo (✏️ editar, 🗑️ eliminar, ➕ crear, 🔄 reordenar)
  - Botones [Aplicar todos] [Modificar plan] [Cancelar]
  - Warnings si hay escenas afectadas
- [ ] Crear componente `ActionResultCard` — Muestra resultado:
  - ✅ Escena X modificada (click para ver)
  - Prompts regenerados
  - Barra de progreso de ejecución
- [ ] Crear `ChatConfirmBar` — Barra inferior de confirmación
- [ ] Crear `ChatScenePreview` — Preview inline de escena en el chat
- [ ] Crear `ChatProgressIndicator` — Indicador de progreso de ejecución

### 13.3 Chat como Panel del Storyboard
- [ ] Mover el chat de `/p/[slug]/chat` (pestaña) AL storyboard como panel lateral
- [ ] Integrar `react-resizable-panels` para split storyboard|chat dentro de /p/[slug]/storyboard
- [ ] El chat tiene contexto completo: escenas, personajes, fondos, reglas
- [ ] Quick actions: [Revisar personajes] [Reducir escenas] [Ordenar timeline] [Explicar el vídeo]
- [ ] El panel se puede expandir, contraer y redimensionar

### 13.4 Contexto Completo del Proyecto
- [ ] Crear función `buildProjectContext()` que carga: proyecto, escenas, personajes, fondos, arco, reglas
- [ ] Inyectar contexto en cada mensaje del chat
- [ ] Incluir reglas de personajes en el contexto

### 13.5 Reglas de Personajes
- [ ] ALTER TABLE characters ADD COLUMN role_rules JSONB DEFAULT '[]'
- [ ] ALTER TABLE characters ADD COLUMN ai_notes TEXT DEFAULT ''
- [ ] UI para editar reglas en la card de personaje
- [ ] El chat guarda reglas automáticamente ("José no lava cabezas" → regla)
- [ ] Las reglas se inyectan en system prompts al generar/mejorar

### 13.6 Reglas Globales del Proyecto
- [ ] ALTER TABLE projects ADD COLUMN global_rules JSONB DEFAULT '[]'
- [ ] UI para ver/editar reglas globales en settings
- [ ] Comandos del chat que aplican a todo el proyecto

### 13.7 Resumen Automático del Storyboard
- [ ] Al abrir el chat, Kiyoko muestra resumen:
  - "Tu storyboard tiene X escenas, Xs de duración (objetivo: Ys)"
  - "Escenas sin imagen: X, sin prompt: Y"
  - "Personajes: listado"
- [ ] Calcular stats en tiempo real

### 13.8 Historial con Undo
- [ ] CREATE TABLE change_history (id, project_id, user_id, entity_type, entity_id, action, field_name, old_value, new_value, batch_id, description_es, created_at) — con RLS
- [ ] UI del historial en el panel lateral (timeline con batch undo)
- [ ] Botón "Deshacer último cambio" que usa undoBatch()

### 13.9 API Route para Ejecutar Acciones
- [ ] Crear `/api/ai/execute-actions/route.ts`
- [ ] Recibe AiAction[], projectId, ejecuta con executeActionPlan()
- [ ] Retorna resultados + batchId

### 13.10 System Prompt Mejorado
- [ ] Actualizar system-chat-director.ts con:
  - Reglas de acción (siempre mostrar plan antes de actuar)
  - Formato JSON para AiActionPlan
  - Reglas de personajes inyectadas
  - Reglas globales inyectadas
  - Comandos por categoría (personajes, escenas, duración, prompts, ordenación)

## Criterios de Aceptación
- [ ] Chat muestra plan de acciones antes de ejecutar
- [ ] Usuario puede aprobar/rechazar/modificar el plan
- [ ] Acciones se ejecutan correctamente contra Supabase
- [ ] Undo funcional (deshacer último batch)
- [ ] Reglas de personaje se guardan y se usan en generación
- [ ] Chat como panel del storyboard (no pestaña separada)
- [ ] Resumen automático al abrir el chat
