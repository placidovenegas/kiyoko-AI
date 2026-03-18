# Fase 09 — Integración IA Completa

## Estado: ✅ COMPLETADO (base — pendiente mejoras v4)

## Objetivo

Implementar todas las API routes de IA, system prompts, wizard de creación de proyectos, chat por proyecto, y botones de generación/mejora.

## API Routes

### 9.1 Generación
- `/api/ai/generate-project` — Genera proyecto completo desde brief
- `/api/ai/generate-scenes` — Genera escenas para un proyecto
- `/api/ai/generate-image` — Genera imagen con provider disponible
- `/api/ai/generate-characters` — Genera personajes desde descripción
- `/api/ai/generate-arc` — Genera arco narrativo
- `/api/ai/generate-timeline` — Genera timeline de montaje

### 9.2 Mejora
- `/api/ai/improve-prompt` — Mejora un prompt existente
- `/api/ai/analyze-project` — Análisis/diagnóstico del proyecto

### 9.3 Chat
- `/api/ai/chat` — Chat conversacional con streaming

## System Prompts (`src/lib/ai/prompts/`)
- `system-project-generator.ts` — Director creativo para wizard
- `system-scene-generator.ts` — Generador de escenas con reglas
- `system-scene-improver.ts` — Mejorador de prompts
- `system-analyzer.ts` — Analista de storyboard
- `system-timeline-generator.ts` — Generador de timeline
- `system-character-generator.ts` — Generador de personajes
- `system-chat-assistant.ts` — Asistente en chat

## Zod Schemas (`src/lib/ai/schemas/`)
- `project-output.ts`, `scene-output.ts`, `character-output.ts`
- `analysis-output.ts`, `timeline-output.ts`

## Wizard IA (`/new`)
5 pasos conversacionales:
1. Brief (qué, quién, estilo, duración)
2. Fondos (localizaciones, fotos)
3. Personajes (aspecto, rol)
4. Escenas (generación automática)
5. Revisión (confirmar y guardar)

## Hooks
- `useAiGenerate.ts` — Generación de contenido
- `useAiChat.ts` — Chat con streaming
- `useAiProvider.ts` — Provider activo

## Criterios de Aceptación
- [x] Todas las API routes usando AI Router
- [x] Wizard completo de 5 pasos (/new)
- [x] Chat con streaming funcional (/api/ai/chat)
- [x] Botones "Mejorar con IA" en escenas (/api/ai/improve-prompt)
- [x] Generación de imágenes funcional (/api/ai/generate-image)

## Notas de implementación
### API Routes implementadas (11):
- /api/ai/generate-project — Genera proyecto desde brief
- /api/ai/generate-scenes — Genera escenas
- /api/ai/generate-image — Genera imagen
- /api/ai/generate-characters — Genera personajes
- /api/ai/generate-arc — Genera arco narrativo
- /api/ai/generate-timeline — Genera timeline
- /api/ai/generate-voice — TTS con Google Cloud
- /api/ai/improve-prompt — Mejora prompts
- /api/ai/analyze-project — Diagnóstico IA
- /api/ai/chat — Chat con streaming
- /api/ai/providers/status — Estado providers

### System Prompts implementados (10):
system-analyzer, system-character-generator, system-chat-assistant, system-chat-director, system-narration-generator, system-project-generator, system-scene-generator, system-scene-improver, system-storyboard-director, system-timeline-generator

### Schemas Zod implementados (5):
analysis-output, character-output, project-output, scene-output, timeline-output

### Hooks implementados:
useAiGenerate.ts, useAiChat.ts, useAiProvider.ts
### Store: useAiChatStore.ts

### Pendiente → ver Fase 13 (Chat Director):
- [ ] Action system completo con plan → confirmar → ejecutar
- [ ] Chat como panel lateral en storyboard
- [ ] Contexto completo del proyecto en cada mensaje
- [ ] Comandos globales desde el chat
- [ ] Reglas de personaje inyectadas en prompts
