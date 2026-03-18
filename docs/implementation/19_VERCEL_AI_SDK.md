# Fase 19 — Migración a Vercel AI SDK

## Estado: PENDIENTE

## Origen: Análisis de https://ai-sdk.dev/docs/getting-started/nextjs-app-router

## Objetivo

Migrar el sistema de IA actual (providers manuales + router custom) al Vercel AI SDK (`ai` + `@ai-sdk/react`). Esto elimina código duplicado, añade streaming robusto, validación Zod real, y soporte nativo para todos los providers (incluidos los nuevos de Fase 14).

## Por qué migrar

### Problemas actuales detectados

| # | Problema | Severidad |
|---|---------|-----------|
| 1 | Streaming incompleto en useAiChat — acumula texto raw SSE sin parsear JSON | CRÍTICO |
| 2 | Schemas Zod definidos pero NUNCA usados para validar respuestas (JSON.parse manual) | ALTO |
| 3 | 4 providers duplican lógica de mensajes, tokens, errores (4x código) | ALTO |
| 4 | No hay fallback mid-stream si un provider falla | ALTO |
| 5 | Cada provider reinventa normalización de request/response | MEDIO |
| 6 | Token counting varía por provider → costes incorrectos | MEDIO |
| 7 | Sin timeout ni cancelación de requests | BAJO |

### Qué resuelve el Vercel AI SDK

| Problema | Solución AI SDK |
|----------|----------------|
| Streaming roto | `streamText()` + `toUIMessageStreamResponse()` — streaming SSE nativo |
| Schemas sin usar | `Output.object({ schema: zodSchema })` — validación automática |
| Providers duplicados | Un import por provider (`@ai-sdk/openai`, etc.) — 0 código adapter |
| Sin fallback mid-stream | Middleware + error callbacks nativos |
| useAiChat manual | `useChat()` de `@ai-sdk/react` — maneja todo automáticamente |
| Tool calls para acciones | `tool()` con Zod schemas — perfecto para el Action System (Fase 13) |
| Nuevos providers (Fase 14) | `@ai-sdk/xai` (Grok), `@ai-sdk/deepseek`, `@ai-sdk/mistral` — ya existen |

## Tareas

### 19.1 Instalar dependencias
```bash
npm install ai @ai-sdk/react
npm install @ai-sdk/google @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/groq
# Nuevos providers (Fase 14 — se puede hacer junto):
npm install @ai-sdk/xai @ai-sdk/deepseek @ai-sdk/mistral
```

### 19.2 Crear nuevo AI Router con AI SDK
- [ ] Crear `src/lib/ai/sdk-router.ts` — reemplaza router.ts
- [ ] Provider registry: map de providerId → model instance
- [ ] Función `getModel(task)` que devuelve el modelo correcto según tarea y cadena de prioridad
- [ ] Mantener cadena de fallback con try/catch + next provider
- [ ] Ejemplo:
```typescript
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';

const models = {
  grok: xai('grok-4.1-fast'),
  deepseek: deepseek('deepseek-chat'),
  gemini: google('gemini-2.0-flash'),
  groq: groq('llama-3.3-70b-versatile'),
  claude: anthropic('claude-sonnet-4-20250514'),
  openai: openai('gpt-4o-mini'),
};
```

### 19.3 Migrar API Routes de Generación
- [ ] `/api/ai/generate-project` — usar `generateText()` + `Output.object({ schema: projectOutputSchema })`
- [ ] `/api/ai/generate-scenes` — usar `generateText()` + `Output.array({ element: sceneSchema })`
- [ ] `/api/ai/generate-characters` — usar `generateText()` + `Output.object()`
- [ ] `/api/ai/generate-arc` — usar `generateText()` + `Output.object()`
- [ ] `/api/ai/generate-timeline` — usar `generateText()` + `Output.object()`
- [ ] `/api/ai/improve-prompt` — usar `generateText()` simple
- [ ] `/api/ai/analyze-project` — usar `generateText()` + `Output.object({ schema: analysisSchema })`
- [ ] Eliminar JSON.parse manual — Zod valida automáticamente

### 19.4 Migrar Chat a streamText + useChat
- [ ] `/api/ai/chat/route.ts` — reescribir con:
```typescript
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: getModel('chat'),
    system: SYSTEM_CHAT_DIRECTOR,
    messages,
    tools: {
      // Action system tools para Fase 13
      updateScene: tool({ ... }),
      createScene: tool({ ... }),
      deleteScene: tool({ ... }),
    },
    onFinish: async ({ text, usage }) => {
      await logUsage({ ... });
    },
  });
  return result.toUIMessageStreamResponse();
}
```
- [ ] Reemplazar `useAiChat` hook con `useChat` de `@ai-sdk/react`:
```typescript
import { useChat } from '@ai-sdk/react';

const { messages, sendMessage, status, stop } = useChat({
  api: '/api/ai/chat',
  body: { projectId },
  experimental_throttle: 50,
});
```
- [ ] Eliminar useAiChatStore (useChat maneja el estado)
- [ ] Eliminar parsing SSE manual

### 19.5 Migrar useAiGenerate
- [ ] Actualizar `useAiGenerate.ts` para que siga usando fetch pero espere JSON validado del server
- [ ] O usar `useObject` de `@ai-sdk/react` para streaming de objetos estructurados

### 19.6 Tool Definitions para Action System (con Fase 13)
- [ ] Definir herramientas del chat como `tool()` con Zod input schemas:
```typescript
import { tool } from 'ai';
import { z } from 'zod';

const chatTools = {
  updateScene: tool({
    description: 'Actualiza campos de una escena existente',
    inputSchema: z.object({
      sceneId: z.string(),
      changes: z.record(z.unknown()),
      reason: z.string(),
    }),
    execute: async ({ sceneId, changes }) => { ... },
  }),
  createScene: tool({ ... }),
  deleteScene: tool({ ... }),
  reorderScenes: tool({ ... }),
};
```
- [ ] El modelo llama a tools automáticamente — sin necesidad de parsear JSON de la respuesta
- [ ] Eliminar action-parser.ts (el SDK parsea tool calls nativamente)

### 19.7 Eliminar código legacy
- [ ] Eliminar `src/lib/ai/providers/gemini.ts`
- [ ] Eliminar `src/lib/ai/providers/claude.ts`
- [ ] Eliminar `src/lib/ai/providers/openai.ts`
- [ ] Eliminar `src/lib/ai/providers/groq.ts`
- [ ] Eliminar `src/lib/ai/providers/stability.ts` (o mantener para imágenes si no hay SDK)
- [ ] Eliminar `src/lib/ai/providers/base.ts`
- [ ] Simplificar `src/lib/ai/providers/index.ts` (solo configs, no adapters)
- [ ] Reemplazar `src/lib/ai/router.ts` con `sdk-router.ts`
- [ ] Eliminar `src/stores/useAiChatStore.ts` (useChat maneja estado)

### 19.8 Activar Zod Schemas existentes
- [ ] Conectar `src/lib/ai/schemas/project-output.ts` → `Output.object({ schema })`
- [ ] Conectar `src/lib/ai/schemas/scene-output.ts` → `Output.array({ element })`
- [ ] Conectar `src/lib/ai/schemas/character-output.ts`
- [ ] Conectar `src/lib/ai/schemas/analysis-output.ts`
- [ ] Conectar `src/lib/ai/schemas/timeline-output.ts`
- [ ] Las respuestas ahora se validan automáticamente contra los schemas

### 19.9 Middleware para logging y fallback
- [ ] Crear middleware de AI SDK para logging automático de uso
- [ ] Middleware para rate limiting por provider
- [ ] Middleware para fallback automático entre providers

## Impacto en otras fases

| Fase | Impacto |
|------|---------|
| 13 (Chat Director) | Tool calls nativos reemplazan action-parser.ts — mucho más simple |
| 14 (Nuevos Providers) | Solo instalar `@ai-sdk/xai`, `@ai-sdk/deepseek`, `@ai-sdk/mistral` — 0 código adapter |
| 15 (Narración) | generateText + Output.object para generar narración estructurada |
| 17 (UI Storyboard) | useChat hook maneja streaming perfecto en el panel del chat |

## Archivos a eliminar (~500 líneas)
- src/lib/ai/providers/base.ts
- src/lib/ai/providers/gemini.ts
- src/lib/ai/providers/claude.ts
- src/lib/ai/providers/openai.ts
- src/lib/ai/providers/groq.ts
- src/lib/ai/providers/stability.ts (evaluar si mantener para imágenes)
- src/stores/useAiChatStore.ts
- src/hooks/useAiChat.ts (reemplazado por useChat de @ai-sdk/react)

## Archivos a crear/reescribir
- src/lib/ai/sdk-router.ts (nuevo — reemplaza router.ts)
- src/lib/ai/tools.ts (nuevo — definiciones de tools para chat)
- Reescribir: todos los /api/ai/*/route.ts

## Criterios de Aceptación
- [ ] Todas las API routes usan generateText/streamText del AI SDK
- [ ] Chat usa useChat hook con streaming perfecto
- [ ] Schemas Zod validan todas las respuestas estructuradas
- [ ] Providers legacy eliminados (~500 líneas menos)
- [ ] Fallback entre providers funcional
- [ ] Tool calls funcionan en el chat (para Fase 13)
- [ ] Logging de uso automático vía middleware
