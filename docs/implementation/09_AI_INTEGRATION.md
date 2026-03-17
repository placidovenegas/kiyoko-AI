# Fase 09 — Integración IA Completa

## Estado: PENDIENTE

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
- [ ] Todas las API routes usando AI Router
- [ ] Wizard completo de 5 pasos
- [ ] Chat con streaming funcional
- [ ] Botones "Mejorar con IA" en escenas
- [ ] Generación de imágenes funcional
