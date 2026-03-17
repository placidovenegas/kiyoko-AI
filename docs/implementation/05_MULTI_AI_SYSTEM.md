# Fase 05 — Sistema Multi-IA con Fallback

## Estado: PENDIENTE

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
- [ ] Router selecciona provider correctamente
- [ ] Fallback automático cuando un provider falla
- [ ] API keys cifradas en DB
- [ ] Página de gestión de keys funcional
- [ ] Logs de uso registrados
