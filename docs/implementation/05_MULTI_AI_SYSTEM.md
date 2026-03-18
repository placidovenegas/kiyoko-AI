# Fase 05 — Sistema Multi-IA con Fallback

## Estado: ✅ COMPLETADO (base — pendiente nuevos providers v7)

## Objetivo

Implementar el AI Router con cadena de fallback automático, adapters para cada provider, cifrado de API keys, y la página de gestión de claves.

## Providers Soportados

| Provider | Tipo | Gratis | Modelo Default |
|----------|------|--------|---------------|
| Google Gemini | Texto + Imágenes | Si | gemini-2.0-flash |
| Anthropic Claude | Texto | No | claude-sonnet-4 |
| OpenAI | Texto + Imágenes | No | gpt-4o-mini + dall-e-3 |
| Groq | Texto | Si | llama-3.3-70b |
| Stability AI | Imágenes | No | stable-diffusion-3 |

## Tareas

### 5.1 AI Router (`src/lib/ai/router.ts`)
- `getAvailableProvider(userId, task)` — Selecciona provider según cadena
- `generateText()`, `generateImage()`, `streamText()`
- `checkQuota()`, `logUsage()`

### 5.2 Provider Adapters (`src/lib/ai/providers/`)
- `base.ts` — Interfaz base AiProvider
- `gemini.ts`, `claude.ts`, `openai.ts`, `groq.ts`, `stability.ts`
- `index.ts` — Registry + constantes + cadenas de prioridad

### 5.3 Cifrado de API Keys (`src/lib/utils/crypto.ts`)
- AES-256-GCM encrypt/decrypt
- ENCRYPTION_SECRET en env

### 5.4 API Routes
- `/api/ai/providers/status` — Estado de providers del usuario
- `/api/user/api-keys` — CRUD de API keys
- `/api/user/api-keys/[id]` — Update/delete específica
- `/api/user/api-keys/test` — Testear una API key
- `/api/user/usage` — Estadísticas de uso mensual

### 5.5 Página de Gestión (`/settings/api-keys`)
- Lista de providers con estado
- Añadir/editar/eliminar API keys
- Presupuesto mensual por provider
- Resumen de uso del mes

### 5.6 Stores y Hooks
- `useAiProviderStore.ts` — Estado del provider activo
- `useApiKeys.ts` — CRUD de API keys
- `useAiUsage.ts` — Estadísticas de uso

## Cadena de Fallback
```
TEXTO: Claude → OpenAI → Gemini (gratis) → Groq (gratis)
IMÁGENES: DALL-E → Stability → Gemini Imagen (gratis)
```

## Criterios de Aceptación
- [x] Router selecciona provider correctamente
- [x] Fallback automático cuando un provider falla (generateTextWithFallback, streamTextWithFallback)
- [x] API keys cifradas en DB (AES-256-GCM en crypto.ts)
- [x] Página de gestión de keys funcional (/settings/api-keys)
- [x] Logs de uso registrados (ai_usage_logs + logUsage())

## Notas de implementación
- AI Router completo con fallback: router.ts
- 5 providers: Gemini, Claude, OpenAI, Groq, Stability
- Cadena texto actual: Groq → Gemini → Claude → OpenAI
- Cadena imágenes actual: OpenAI → Stability → Gemini
- Stores: useAiProviderStore.ts
- Hooks: useAiProvider.ts, useApiKeys.ts, useAiUsage.ts
- API routes: /api/ai/providers/status, /api/user/api-keys (CRUD + test), /api/user/usage

### Pendiente → ver Fase 14 (Nuevos Providers v7):
- [ ] Añadir Grok, DeepSeek, Mistral
- [ ] Reordenar cadena de prioridad para creativos
- [ ] SDK Factory pattern
- [ ] Badge de provider en respuestas
