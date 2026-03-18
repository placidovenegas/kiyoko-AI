# Fase 14 — Nuevos Providers IA (Upgrade Multi-IA)

## Estado: PENDIENTE

## Origen: docs/update/KIYOKO_MEJORAS_v7_AI_PROVIDERS.md

## Objetivo

Añadir Grok (xAI), DeepSeek y Mistral como nuevos providers de texto, reordenar la cadena de prioridad optimizada para trabajo creativo, e implementar SDK Factory para providers OpenAI-compatible.

## Nueva Cadena de Providers (Texto)

```
CADENA GRATUITA (sin API key del usuario):
#1  Grok 4.1 Fast (xAI)     ← NUEVO — Mejor creativo gratuito
#2  DeepSeek V3              ← NUEVO — Narrativa profunda
#3  Gemini 3.1 Flash         ← EXISTE — Versátil
#4  Mistral Large            ← NUEVO — Precisión técnica
#5  Groq LLaMA 3.3 70B      ← EXISTE — Ultrarrápido

CADENA PREMIUM (usuario configura API key):
#6  Claude Sonnet 4          ← EXISTE — Mejor "alma"
#7  OpenAI GPT-4o-mini       ← EXISTE — Fiable
```

## Tareas

### 14.1 Crear Provider Grok (xAI)
- [ ] Crear `src/lib/ai/providers/grok.ts`
- [ ] Usa OpenAI SDK con baseURL `https://api.x.ai/v1`
- [ ] Modelo: `grok-4.1-fast`
- [ ] Tier gratuito, ~60 req/min, 131K context
- [ ] Líder en EQ-Bench (inteligencia emocional)

### 14.2 Crear Provider DeepSeek
- [ ] Crear `src/lib/ai/providers/deepseek.ts`
- [ ] Usa OpenAI SDK con baseURL `https://api.deepseek.com/v1`
- [ ] Modelo: `deepseek-chat`
- [ ] $0.14/M tokens, 128K context
- [ ] Mejor open-source para narrativas complejas

### 14.3 Crear Provider Mistral
- [ ] Crear `src/lib/ai/providers/mistral.ts`
- [ ] Usa `@mistralai/mistralai` SDK (nueva dependencia)
- [ ] Modelo: `mistral-large-latest`
- [ ] 1B tokens gratis/mes, 128K context

### 14.4 SDK Factory Pattern
- [ ] Crear función `createOpenAICompatibleClient(baseURL, apiKey)` para Grok y DeepSeek
- [ ] Interfaz unificada `generateText()` para todos los providers
- [ ] Interfaz unificada `streamText()` (AsyncGenerator) para todos

### 14.5 Actualizar AI Router
- [ ] Actualizar `src/lib/ai/providers/index.ts` con nuevos providers y configs
- [ ] Añadir `creative_score` a cada provider config
- [ ] Reordenar TEXT_PROVIDER_CHAIN: grok → deepseek → gemini → mistral → groq → claude → openai
- [ ] Actualizar `src/lib/ai/router.ts` con nuevas instancias

### 14.6 Variables de Entorno
- [ ] Añadir a .env.example: XAI_API_KEY, DEEPSEEK_API_KEY, MISTRAL_API_KEY
- [ ] Documentar en CLAUDE.md

### 14.7 Nueva Dependencia
- [ ] `npm install @mistralai/mistralai`

### 14.8 Mapeo Tarea → Provider Recomendado
- [ ] Chat → Grok (mejor intención emocional)
- [ ] Descripción escena → Grok (escribe con alma)
- [ ] Prompt imagen → DeepSeek (preciso con instrucciones técnicas)
- [ ] Prompt vídeo → DeepSeek (combina técnica con narrativa)
- [ ] Análisis completo → DeepSeek (mejor análisis largo, 128K)
- [ ] Narración → Grok (texto emocional con ritmo)
- [ ] Arco narrativo → DeepSeek (estructura narrativa profunda)
- [ ] Mejorar prompt → Mistral (precisión técnica)
- [ ] Ficha personaje → Grok (personalidad y descripción vívida)
- [ ] Timeline → Gemini (rápido para cálculos)
- [ ] Fallback rápido → Groq (velocidad máxima)

### 14.9 UI — Badge de Provider
- [ ] Mostrar badge con icono del provider en cada respuesta IA
- [ ] Tooltip con nombre del modelo usado
- [ ] En admin: página con todos los providers y su estado
- [ ] En settings usuario: providers gratuitos + opción premium

## Criterios de Aceptación
- [ ] Los 3 nuevos providers funcionan (Grok, DeepSeek, Mistral)
- [ ] Cadena de fallback reordenada para creativos
- [ ] SDK Factory reutilizable para providers OpenAI-compatible
- [ ] Badge de provider visible en respuestas
- [ ] .env.example actualizado con nuevas keys
