# Streaming (V6) — Protocolo SSE y parsing

Este documento explica el flujo real de streaming usado por el chat:
- backend emite un protocolo de eventos en `text/plain` con `X-Vercel-AI-Data-Stream: v1`,
- frontend consume el `ReadableStream`, acumula texto y finalmente parsea bloques IA.

## 1) Backend: emisión desde `/api/ai/chat`
Fuente: `src/app/api/ai/chat/route.ts`

El endpoint:
1. Resuelve proveedores/modelos (con fallback) y crea `systemPrompt`.
2. Llama a `streamText(...)` (AI SDK) y lee el `textStream`.
3. Convierte el stream en un `ReadableStream<Uint8Array>` que emite líneas:
   - `f:<json>`: metadatos (messageId)
   - `0:<json>`: delta de texto
   - `3:<json>`: error
   - `d:<json>`: fin

Además:
- setea headers:
  - `X-Vercel-AI-Data-Stream: v1`
  - `X-AI-Provider`
  - `X-Active-Agent`
  - `X-Context-Level`

## 2) Frontend: consumo en `useKiyokoChat.sendMessage`
Fuente: `src/hooks/useKiyokoChat.ts`

El store:
1. Hace `fetch('/api/ai/chat')` y obtiene `res.body.getReader()`.
2. Lee el stream por chunks y lo divide por `'\n'`.
3. Para cada línea:
   - si empieza por `0:`:
     - `JSON.parse` del payload,
     - acumula texto en `accumulated`,
     - actualiza el mensaje del assistant en tiempo real (bubble live).
   - si empieza por `3:`:
     - interpreta el error y lo lanza/aborta.
   - fallback legacy:
     - si aparece `data: ...`, intenta parsear `payload` con `{ text }` o `{ content }`.
4. Al terminar:
   - llama al parser final `parseAiMessage(accumulated)`,
   - y extrae `actionPlan` (incluye fallback `parseActionPlan` si hace falta).

## 3) Regla de UI durante streaming
Fuente: `src/components/chat/ChatMessage.tsx`

La UI muestra skeleton cuando:
- el mensaje del asistente es el último,
- el parent store está en streaming,
- y el contenido contiene una apertura de tag sin su cierre.

Esto evita parpadeos y mejora percepción de “bloques completos”.

## 4) Requisitos V6 para “contrato perfecto”
1. Backend debe emitir solo el contrato soportado (bloques con tags correctos).
2. Frontend debe usar **solo** el parser canónico (`parseAiMessage`).
3. El fallback legacy debe ser temporal y marcado como deprecable.

