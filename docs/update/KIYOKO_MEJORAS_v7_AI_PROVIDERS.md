# 🤖 KIYOKO AI — Mejoras v7: Upgrade del Sistema Multi-IA

## Nuevos providers de texto + nuevo orden de prioridad optimizado para creativos

### Para: Claude Code — Implementación sobre el proyecto existente

---

## 1. POR QUÉ CAMBIAR EL ORDEN

El sistema actual usa **Groq (LLaMA 3.3 70B)** como provider principal. LLaMA es un modelo generalista: rápido pero sin especial talento creativo. Para un estudio de storyboard donde el 90% del trabajo es generar descripciones cinematográficas, prompts visuales con emoción, narración con alma y arcos narrativos con ritmo, necesitamos modelos que destaquen en **escritura creativa**, no en velocidad bruta.

Tras investigar todos los providers con tier gratuito disponibles en marzo 2026, este es el nuevo orden optimizado:

---

## 2. NUEVA CADENA DE PROVIDERS — TEXTO

### Orden de prioridad (de mejor a fallback)

```
┌─────────────────────────────────────────────────────────────────┐
│  CADENA GRATUITA (sin API key del usuario)                       │
│                                                                  │
│  #1  Grok 4.1 Fast (xAI)     ← NUEVO · Mejor creativo gratis  │
│  #2  DeepSeek V3              ← NUEVO · Narrativa profunda      │
│  #3  Gemini 3.1 Flash         ← YA EXISTE · Versátil           │
│  #4  Mistral Large            ← NUEVO · Técnico y preciso       │
│  #5  Groq LLaMA 3.3 70B      ← YA EXISTE · Ultrarrápido        │
│                                                                  │
│  CADENA PREMIUM (si el usuario configura su API key)             │
│                                                                  │
│  #6  Claude Sonnet 4          ← YA EXISTE · El mejor en "alma"  │
│  #7  OpenAI GPT-4o-mini       ← YA EXISTE · Fiable y versátil  │
└─────────────────────────────────────────────────────────────────┘
```

### Justificación del orden

| Posición | Provider | Por qué en esta posición |
|----------|----------|--------------------------|
| **#1 Grok 4.1** | Líder mundial en inteligencia emocional (EQ-Bench3: 1586 Elo) y escritura creativa. Genera texto con personalidad, emoción y ritmo cinematográfico. Gratis. |
| **#2 DeepSeek V3** | Considerado el mejor open-source para narrativas complejas. Combina profundidad analítica con storytelling. Excelente para arcos narrativos y análisis de guión. $0.14/M tokens (prácticamente gratis). |
| **#3 Gemini 3.1 Flash** | Modelo más versátil de Google. Rápido, gratis (60 req/min), buena calidad general. Buen equilibrio entre creatividad y precisión técnica. |
| **#4 Mistral Large** | Modelo europeo con excelente calidad de texto técnico. 1B tokens gratis al mes. Ideal para prompts que necesitan precisión de cámara e iluminación. |
| **#5 Groq LLaMA 3.3** | El más rápido de todos (~300 tok/s). Calidad creativa aceptable. Perfecto como fallback cuando los demás tienen rate limit. Gratis. |
| **#6 Claude Sonnet** | El mejor en escritura con "alma" y personajes vivos. Pero es de pago ($3/$15 por M tokens). Solo para usuarios que pongan su API key. |
| **#7 OpenAI GPT-4o-mini** | Fiable y consistente. De pago ($0.15/$0.60 por M tokens). Fallback premium final. |

---

## 3. DETALLE DE CADA NUEVO PROVIDER

### 3.1 Grok 4.1 Fast (xAI) — NUEVO #1

```typescript
// src/lib/ai/providers/grok.ts

import OpenAI from 'openai';

// Grok usa la misma interfaz que OpenAI (API compatible)
// NO necesita SDK nuevo — usa el paquete 'openai' que ya tenemos

export function createGrokClient(apiKey: string) {
  return new OpenAI({
    baseURL: 'https://api.x.ai/v1',
    apiKey,
  });
}

export async function generateWithGrok(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const client = createGrokClient(apiKey);
  
  const response = await client.chat.completions.create({
    model: 'grok-4.1-fast',  // Modelo rápido gratuito
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,  // Más alto para creatividad
    max_tokens: 4096,
  });
  
  return response.choices[0].message.content || '';
}

// Streaming
export async function* streamWithGrok(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): AsyncGenerator<string> {
  const client = createGrokClient(apiKey);
  
  const stream = await client.chat.completions.create({
    model: 'grok-4.1-fast',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 4096,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
```

**Configuración:**

| Campo | Valor |
|-------|-------|
| SDK | `openai` (ya instalado, API compatible) |
| Base URL | `https://api.x.ai/v1` |
| Modelo | `grok-4.1-fast` |
| Env variable (admin global) | `XAI_API_KEY` |
| Obtener key gratis | https://console.x.ai → Create API Key |
| Tier gratuito | Sí, generoso |
| Rate limit gratis | ~60 req/min (puede variar) |
| Contexto | 131,072 tokens |
| Streaming | ✅ Soportado |
| Coste si se paga | $0.20 input / $0.50 output por M tokens |

**Por qué es el #1 para Kiyoko:**
- Líder en EQ-Bench (inteligencia emocional) → genera descripciones con sentimiento real
- Excelente para diálogos y personalidades de personajes
- Entiende muy bien instrucciones de "mood", "tono emocional", "ritmo narrativo"
- Tier gratis suficiente para uso normal de storyboard

---

### 3.2 DeepSeek V3 — NUEVO #2

```typescript
// src/lib/ai/providers/deepseek.ts

import OpenAI from 'openai';

// DeepSeek también usa interfaz compatible con OpenAI
// NO necesita SDK nuevo

export function createDeepSeekClient(apiKey: string) {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey,
  });
}

export async function generateWithDeepSeek(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const client = createDeepSeekClient(apiKey);
  
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',  // DeepSeek V3
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 4096,
  });
  
  return response.choices[0].message.content || '';
}

// Streaming
export async function* streamWithDeepSeek(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): AsyncGenerator<string> {
  const client = createDeepSeekClient(apiKey);
  
  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 4096,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
```

**Configuración:**

| Campo | Valor |
|-------|-------|
| SDK | `openai` (ya instalado, API compatible) |
| Base URL | `https://api.deepseek.com/v1` |
| Modelo | `deepseek-chat` (V3) |
| Env variable (admin global) | `DEEPSEEK_API_KEY` |
| Obtener key | https://platform.deepseek.com → API Keys |
| Tier gratuito | Créditos iniciales al registrarte |
| Coste real | $0.14 input / $0.28 output por M tokens |
| Contexto | 128,000 tokens |
| Streaming | ✅ Soportado |

**Por qué es el #2:**
- Mejor modelo open-source del mundo para narrativas complejas
- Excelente para generar arcos narrativos coherentes con estructura de 3 actos
- Combina análisis (diagnóstico de storyboard) con creatividad (descripción de escenas)
- A $0.14/M tokens, generar un proyecto completo de 28 escenas cuesta menos de $0.02
- Contexto de 128K → puede analizar TODO el storyboard de golpe

---

### 3.3 Mistral Large — NUEVO #4

```typescript
// src/lib/ai/providers/mistral.ts

import { Mistral } from '@mistralai/mistralai';

export function createMistralClient(apiKey: string) {
  return new Mistral({ apiKey });
}

export async function generateWithMistral(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const client = createMistralClient(apiKey);
  
  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 4096,
  });
  
  return response.choices?.[0]?.message?.content || '';
}

// Streaming
export async function* streamWithMistral(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): AsyncGenerator<string> {
  const client = createMistralClient(apiKey);
  
  const stream = await client.chat.stream({
    model: 'mistral-large-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 4096,
  });
  
  for await (const chunk of stream) {
    const content = chunk.data.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
```

**Configuración:**

| Campo | Valor |
|-------|-------|
| SDK | `@mistralai/mistralai` (**NUEVO — instalar**) |
| Modelo | `mistral-large-latest` |
| Env variable (admin global) | `MISTRAL_API_KEY` |
| Obtener key gratis | https://console.mistral.ai → API Keys |
| Tier gratuito | ✅ 1 req/s, 500K tok/min, **1B tokens/mes** |
| Contexto | 128,000 tokens |
| Streaming | ✅ Soportado |
| Coste si se paga | ~$2 input / $6 output por M tokens |

**Por qué es el #4:**
- Modelo europeo con excelente precisión técnica en descripciones
- 1 BILLÓN de tokens gratis al mes → prácticamente ilimitado
- Muy bueno para prompts técnicos de cámara, iluminación y composición
- Más preciso y menos "florero" que otros modelos en instrucciones específicas

---

## 4. ACTUALIZAR EL AI ROUTER

### 4.1 Nuevo registry de providers

```typescript
// src/lib/ai/providers/index.ts — REEMPLAZAR COMPLETO

export const AI_PROVIDERS = {
  
  // ===== GRATIS — CADENA PRINCIPAL =====
  
  grok: {
    id: 'grok',
    name: 'Grok 4.1 (xAI)',
    type: 'text' as const,
    isFree: true,
    priority: 1,                     // ← #1 PRINCIPAL
    defaultModel: 'grok-4.1-fast',
    rateLimitRpm: 60,
    costPer1kTokens: 0,
    sdkType: 'openai-compatible',    // Usa el SDK de OpenAI
    baseUrl: 'https://api.x.ai/v1',
    envKey: 'XAI_API_KEY',
    description: 'El mejor para escritura creativa y emocional',
    creative_score: 10,              // Puntuación interna de calidad creativa
  },
  
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek V3',
    type: 'text' as const,
    isFree: true,                    // Prácticamente gratis
    priority: 2,                     // ← #2
    defaultModel: 'deepseek-chat',
    rateLimitRpm: 60,
    costPer1kTokens: 0.00014,       // $0.14/M tokens
    sdkType: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
    description: 'Narrativas complejas y análisis de guión',
    creative_score: 9,
  },
  
  gemini: {
    id: 'gemini',
    name: 'Gemini 3.1 Flash',
    type: 'both' as const,          // Texto + Imágenes
    isFree: true,
    priority: 3,                     // ← #3
    defaultModel: 'gemini-2.0-flash',
    imageModel: 'gemini-3.1-flash-image-preview',
    rateLimitRpm: 60,
    costPer1kTokens: 0,
    sdkType: 'google',
    envKey: 'GOOGLE_AI_API_KEY',
    description: 'Versátil, rápido, texto e imágenes',
    creative_score: 7,
  },
  
  mistral: {
    id: 'mistral',
    name: 'Mistral Large',
    type: 'text' as const,
    isFree: true,
    priority: 4,                     // ← #4
    defaultModel: 'mistral-large-latest',
    rateLimitRpm: 60,               // 1 req/s = 60/min
    costPer1kTokens: 0,
    sdkType: 'mistral',
    envKey: 'MISTRAL_API_KEY',
    description: 'Preciso y técnico, 1B tokens gratis/mes',
    creative_score: 7,
  },
  
  groq: {
    id: 'groq',
    name: 'Groq LLaMA 3.3 70B',
    type: 'text' as const,
    isFree: true,
    priority: 5,                     // ← #5 (antes era #1)
    defaultModel: 'llama-3.3-70b-versatile',
    rateLimitRpm: 30,
    costPer1kTokens: 0,
    sdkType: 'groq',
    envKey: 'GROQ_API_KEY',
    description: 'Ultrarrápido, buen fallback general',
    creative_score: 6,
  },
  
  // ===== PREMIUM — REQUIERE API KEY DEL USUARIO =====
  
  claude: {
    id: 'claude',
    name: 'Claude Sonnet 4',
    type: 'text' as const,
    isFree: false,
    priority: 6,
    defaultModel: 'claude-sonnet-4-20250514',
    rateLimitRpm: 50,
    costPer1kTokens: 0.003,
    sdkType: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'El mejor en "alma" y personajes vivos',
    creative_score: 10,
  },
  
  openai: {
    id: 'openai',
    name: 'OpenAI GPT-4o-mini',
    type: 'both' as const,
    isFree: false,
    priority: 7,
    defaultModel: 'gpt-4o-mini',
    imageModel: 'dall-e-3',
    rateLimitRpm: 60,
    costPer1kTokens: 0.00015,
    sdkType: 'openai',
    envKey: 'OPENAI_API_KEY',
    description: 'Fiable y versátil, texto + DALL-E para imágenes',
    creative_score: 7,
  },
  
  // ===== IMÁGENES — PREMIUM =====
  
  stability: {
    id: 'stability',
    name: 'Stability AI',
    type: 'image' as const,
    isFree: false,
    priority: 8,
    imageModel: 'stable-diffusion-3',
    rateLimitRpm: 10,
    costPerImage: 0.03,
    sdkType: 'fetch',
    envKey: 'STABILITY_API_KEY',
    description: 'Imágenes de alta calidad con Stable Diffusion',
    creative_score: 8,
  },
  
} as const;

// Cadena de prioridad para TEXTO (orden de intento)
export const TEXT_PROVIDER_CHAIN = [
  'grok',       // #1 — Mejor creativo gratis
  'deepseek',   // #2 — Narrativas profundas
  'gemini',     // #3 — Versátil gratis
  'mistral',    // #4 — Técnico y preciso
  'groq',       // #5 — Ultrarrápido fallback
  'claude',     // #6 — Premium (si hay key)
  'openai',     // #7 — Premium fallback
];

// Cadena de prioridad para IMÁGENES (generación por API)
export const IMAGE_PROVIDER_CHAIN = [
  'openai',     // DALL-E 3 (si hay key)
  'stability',  // Stable Diffusion (si hay key)
  'gemini',     // Gemini Imagen (gratis)
];

// Provider types para el SDK factory
export type ProviderId = keyof typeof AI_PROVIDERS;
export type SdkType = 'openai-compatible' | 'google' | 'mistral' | 'groq' | 'anthropic' | 'openai' | 'fetch';
```

### 4.2 SDK Factory — Crear cliente según el provider

```typescript
// src/lib/ai/providers/factory.ts

import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_PROVIDERS, type ProviderId } from './index';

/**
 * Crea el cliente correcto según el provider.
 * 
 * La clave: Grok, DeepSeek y OpenAI usan el MISMO SDK (openai).
 * Solo cambian la baseURL y la apiKey.
 * Esto simplifica mucho la implementación.
 */
export function createClient(providerId: ProviderId, apiKey: string) {
  const provider = AI_PROVIDERS[providerId];
  
  switch (provider.sdkType) {
    
    // Grok, DeepSeek y OpenAI → mismo SDK, diferente baseURL
    case 'openai-compatible':
      return new OpenAI({
        baseURL: provider.baseUrl,
        apiKey,
      });
    
    case 'openai':
      return new OpenAI({ apiKey });
    
    case 'google':
      return new GoogleGenerativeAI(apiKey);
    
    case 'mistral':
      return new Mistral({ apiKey });
    
    case 'groq':
      return new Groq({ apiKey });
    
    case 'anthropic':
      return new Anthropic({ apiKey });
    
    default:
      throw new Error(`SDK type no soportado: ${provider.sdkType}`);
  }
}
```

### 4.3 Función unificada de generación de texto

```typescript
// src/lib/ai/providers/generate-text.ts

import { AI_PROVIDERS, type ProviderId } from './index';
import { createClient } from './factory';

interface GenerateTextOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Genera texto con cualquier provider usando una interfaz unificada.
 * El router llama a esta función con el provider que toque.
 */
export async function generateText(
  providerId: ProviderId,
  apiKey: string,
  options: GenerateTextOptions
): Promise<string> {
  const { prompt, systemPrompt, temperature = 0.8, maxTokens = 4096 } = options;
  const provider = AI_PROVIDERS[providerId];
  
  // === Providers compatibles con OpenAI (Grok, DeepSeek, OpenAI) ===
  if (provider.sdkType === 'openai-compatible' || provider.sdkType === 'openai') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('openai').default>;
    const response = await client.chat.completions.create({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });
    return response.choices[0].message.content || '';
  }
  
  // === Gemini ===
  if (provider.sdkType === 'google') {
    const genAI = createClient(providerId, apiKey) as InstanceType<typeof import('@google/generative-ai').GoogleGenerativeAI>;
    const model = genAI.getGenerativeModel({ 
      model: provider.defaultModel,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  
  // === Mistral ===
  if (provider.sdkType === 'mistral') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('@mistralai/mistralai').Mistral>;
    const response = await client.chat.complete({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      maxTokens,
    });
    return response.choices?.[0]?.message?.content || '';
  }
  
  // === Groq ===
  if (provider.sdkType === 'groq') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('groq-sdk').default>;
    const response = await client.chat.completions.create({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });
    return response.choices[0].message.content || '';
  }
  
  // === Anthropic (Claude) ===
  if (provider.sdkType === 'anthropic') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('@anthropic-ai/sdk').default>;
    const response = await client.messages.create({
      model: provider.defaultModel,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock?.text || '';
  }
  
  throw new Error(`Provider no soportado: ${providerId}`);
}
```

### 4.4 Función unificada de streaming

```typescript
// src/lib/ai/providers/stream-text.ts

import { AI_PROVIDERS, type ProviderId } from './index';
import { createClient } from './factory';

/**
 * Stream de texto con cualquier provider.
 * Devuelve un AsyncGenerator que emite tokens uno a uno.
 */
export async function* streamText(
  providerId: ProviderId,
  apiKey: string,
  options: { prompt: string; systemPrompt: string; temperature?: number; maxTokens?: number }
): AsyncGenerator<string> {
  const { prompt, systemPrompt, temperature = 0.8, maxTokens = 4096 } = options;
  const provider = AI_PROVIDERS[providerId];
  
  // === OpenAI-compatible (Grok, DeepSeek, OpenAI) ===
  if (provider.sdkType === 'openai-compatible' || provider.sdkType === 'openai') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('openai').default>;
    const stream = await client.chat.completions.create({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
    return;
  }
  
  // === Gemini ===
  if (provider.sdkType === 'google') {
    const genAI = createClient(providerId, apiKey) as InstanceType<typeof import('@google/generative-ai').GoogleGenerativeAI>;
    const model = genAI.getGenerativeModel({
      model: provider.defaultModel,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
    return;
  }
  
  // === Mistral ===
  if (provider.sdkType === 'mistral') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('@mistralai/mistralai').Mistral>;
    const stream = await client.chat.stream({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      maxTokens,
    });
    for await (const chunk of stream) {
      const content = chunk.data.choices[0]?.delta?.content;
      if (content) yield content;
    }
    return;
  }
  
  // === Groq ===
  if (provider.sdkType === 'groq') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('groq-sdk').default>;
    const stream = await client.chat.completions.create({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
    return;
  }
  
  // === Anthropic ===
  if (provider.sdkType === 'anthropic') {
    const client = createClient(providerId, apiKey) as InstanceType<typeof import('@anthropic-ai/sdk').default>;
    const stream = client.messages.stream({
      model: provider.defaultModel,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
    return;
  }
  
  throw new Error(`Streaming no soportado para: ${providerId}`);
}
```

---

## 5. NUEVAS VARIABLES DE ENTORNO

Añadir al `.env.local`:

```env
# =============================================
# IA — PROVIDERS GLOBALES (del admin)
# =============================================

# #1 — Grok (xAI) — GRATIS — NUEVO
# Obtener en: https://console.x.ai
# El mejor para escritura creativa y emocional
XAI_API_KEY=xai-...

# #2 — DeepSeek — CASI GRATIS ($0.14/M tokens) — NUEVO
# Obtener en: https://platform.deepseek.com
# El mejor para narrativas complejas y análisis
DEEPSEEK_API_KEY=sk-...

# #3 — Google Gemini — GRATIS (ya existe)
GOOGLE_AI_API_KEY=AIza...

# #4 — Mistral — GRATIS (1B tokens/mes) — NUEVO
# Obtener en: https://console.mistral.ai
# Preciso y técnico
MISTRAL_API_KEY=...

# #5 — Groq — GRATIS (ya existe)
GROQ_API_KEY=gsk_...

# Premium (opcionales — solo si el admin los configura)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

Añadir al `.env.example`:

```env
# IA — Providers gratuitos (configurar al menos 2 para fallback)
XAI_API_KEY=                        # GRATIS: https://console.x.ai
DEEPSEEK_API_KEY=                   # ~GRATIS: https://platform.deepseek.com
GOOGLE_AI_API_KEY=                  # GRATIS: https://aistudio.google.com/apikey
MISTRAL_API_KEY=                    # GRATIS: https://console.mistral.ai
GROQ_API_KEY=                       # GRATIS: https://console.groq.com/keys

# IA — Premium (opcionales)
ANTHROPIC_API_KEY=                  # PAGO: https://console.anthropic.com
OPENAI_API_KEY=                     # PAGO: https://platform.openai.com
```

---

## 6. NUEVA DEPENDENCIA

```bash
# Solo 1 paquete nuevo — los demás ya están instalados
npm install @mistralai/mistralai

# Ya instalados y que se reutilizan:
# openai          → para OpenAI, Grok (xAI) y DeepSeek
# @google/generative-ai → para Gemini
# groq-sdk        → para Groq
# @anthropic-ai/sdk → para Claude
```

---

## 7. ACTUALIZAR LA PÁGINA DE API KEYS

### 7.1 Página del admin (env keys globales)

En `/admin` o en la config del servidor, el admin ve:

```
┌─ PROVIDERS GLOBALES (gratis para todos los usuarios) ────────┐
│                                                               │
│  #1 🟢 Grok 4.1 (xAI)           Conectado ✅                 │
│     xai-****3kF · 42 req hoy · Mejor creativo                │
│                                                               │
│  #2 🟢 DeepSeek V3               Conectado ✅                 │
│     sk-****x9P · 18 req hoy · Narrativas profundas           │
│                                                               │
│  #3 🟢 Gemini 3.1 Flash          Conectado ✅                 │
│     AIza****mQ · 127 req hoy · Versátil                      │
│                                                               │
│  #4 🟢 Mistral Large             Conectado ✅                 │
│     ****8tW · 8 req hoy · Técnico y preciso                  │
│                                                               │
│  #5 🟢 Groq LLaMA 3.3            Conectado ✅                 │
│     gsk_****2nR · 31 req hoy · Ultrarrápido                  │
│                                                               │
│  ── PREMIUM ──────────────────────────────────────────────    │
│  #6 ⚪ Claude Sonnet              No configurado               │
│  #7 ⚪ OpenAI GPT-4o              No configurado               │
└───────────────────────────────────────────────────────────────┘
```

### 7.2 Página del usuario `/settings/api-keys`

El usuario ve los providers gratis activos + puede añadir keys premium:

```
┌─ PROVIDERS DE TEXTO ─────────────────────────────────────────┐
│                                                               │
│  🟢 Grok 4.1 (xAI)           GRATIS — Activo por defecto     │
│     El mejor para escritura creativa y emocional              │
│                                                               │
│  🟢 DeepSeek V3               GRATIS — Activo como fallback   │
│     Narrativas complejas y análisis de guión                  │
│                                                               │
│  🟢 Gemini 3.1 Flash          GRATIS — Activo como fallback   │
│     Versátil, rápido, texto e imágenes                        │
│                                                               │
│  🟢 Mistral Large             GRATIS — Activo como fallback   │
│     Preciso y técnico, 1B tokens gratis/mes                   │
│                                                               │
│  🟢 Groq LLaMA 3.3            GRATIS — Activo como fallback   │
│     Ultrarrápido                                              │
│                                                               │
│  ── ¿QUIERES MÁS CALIDAD? Añade tu API key ──────────────    │
│                                                               │
│  ⚪ Anthropic Claude           $3/$15 por M tokens             │
│     El mejor en "alma" y personajes vivos                     │
│     [➕ Añadir API key]                                        │
│                                                               │
│  ⚪ OpenAI GPT-4o              $2.50/$10 por M tokens          │
│     Fiable y versátil + DALL-E para imágenes                  │
│     [➕ Añadir API key]                                        │
└───────────────────────────────────────────────────────────────┘
```

---

## 8. QUÉ PROVIDER USA CADA TAREA

| Tarea | Provider recomendado | Por qué |
|-------|---------------------|---------|
| Chat del storyboard (instrucciones del usuario) | **Grok** | Entiende mejor la intención emocional |
| Generar descripción de escena (español) | **Grok** | Escribe con alma y ritmo narrativo |
| Generar prompt de imagen (inglés) | **DeepSeek** | Muy preciso con instrucciones técnicas |
| Generar prompt de vídeo (inglés) | **DeepSeek** | Combina técnica con narrativa |
| Analizar storyboard completo | **DeepSeek** | Mejor análisis largo con 128K contexto |
| Generar narración/voz en off | **Grok** | Texto emotivo y con ritmo |
| Generar arco narrativo | **DeepSeek** | Estructura narrativa profunda |
| Mejorar un prompt existente | **Mistral** | Precisión técnica en ajustes |
| Crear ficha de personaje | **Grok** | Personalidad y descripción viva |
| Generar timeline | **Gemini** | Rápido para cálculos y estructuras |
| Respuesta rápida (fallback) | **Groq** | Velocidad máxima |

**NOTA**: El router sigue la cadena de prioridad automáticamente. Si Grok tiene rate limit → pasa a DeepSeek → si también → Gemini → etc. La tabla de arriba es la "preferencia ideal" pero el sistema se adapta solo.

---

## 9. INDICADOR DE PROVIDER EN LA UI

Cuando la IA responde, mostrar un badge sutil indicando qué modelo se usó:

```
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 He generado la descripción de la escena E4A.                 │
│                                                                  │
│ "Con la precisión de una cirujana, Nerea aplica el adhesivo      │
│  profesional sobre la línea del nacimiento del cabello..."       │
│                                                                  │
│                                    Generado con Grok 4.1 ⚡      │
└──────────────────────────────────────────────────────────────────┘
```

Si hubo fallback:
```
                          Generado con DeepSeek V3 🔄 (Grok no disponible)
```

---

## 10. PRIORIDAD DE IMPLEMENTACIÓN

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Crear `grok.ts` provider (usa SDK openai) | Bajo | 🔴 Crítico |
| 2 | Crear `deepseek.ts` provider (usa SDK openai) | Bajo | 🔴 Crítico |
| 3 | Instalar + crear `mistral.ts` provider | Bajo | 🔴 Crítico |
| 4 | Actualizar `providers/index.ts` con nuevo orden | Bajo | 🔴 Crítico |
| 5 | Crear `factory.ts` (SDK factory unificado) | Medio | 🔴 Crítico |
| 6 | Crear `generate-text.ts` (interfaz unificada) | Medio | 🔴 Crítico |
| 7 | Crear `stream-text.ts` (streaming unificado) | Medio | 🔴 Crítico |
| 8 | Actualizar el AI Router con nueva cadena | Medio | 🔴 Crítico |
| 9 | Añadir env variables + `.env.example` | Bajo | 🔴 Crítico |
| 10 | Actualizar página `/settings/api-keys` | Medio | 🟠 Alto |
| 11 | Badge de provider en respuestas del chat | Bajo | 🟡 Medio |
| 12 | Tabla de qué provider usa cada tarea | Bajo | 🟡 Medio |
| 13 | Actualizar `docs/AI_PROVIDERS.md` | Bajo | 🟡 Medio |

**Esfuerzo total estimado**: Bajo-Medio. Los 3 nuevos providers usan SDKs que ya tenemos instalados (excepto Mistral). La mayor parte del trabajo es refactorizar el router para que use la interfaz unificada.

---

*Kiyoko AI — Mejoras v7 · Upgrade Multi-IA · 17 marzo 2026*
