# 🎬 KIYOKO AI — Storyboard Production Studio

## Documento de Especificación Técnica Completa
### Para ejecución automatizada con Claude Code (Codex)

---

## 0. INSTRUCCIONES PREVIAS PARA CLAUDE CODE (LEER ANTES DE EMPEZAR)

### 0.1 Skills que Claude Code debe generar ANTES de escribir código

Claude Code debe crear los siguientes archivos de skill en `.claude/skills/` para que sirvan de referencia interna durante todo el desarrollo:

```
.claude/
├── skills/
│   ├── SKILL_nextjs-app-router.md       # Convenciones Next.js 15 App Router, RSC, layouts
│   ├── SKILL_tailwind-v4.md             # Tailwind v4: @theme, @import, sin config.ts
│   ├── SKILL_supabase-auth-rls.md       # Patrones de Auth, RLS, middleware, triggers
│   ├── SKILL_supabase-storage.md        # Upload, buckets, policies, URLs públicas
│   ├── SKILL_zustand-patterns.md        # Stores, persist, devtools, slices
│   ├── SKILL_multi-ai-provider.md       # Router IA, fallback chain, API keys por usuario
│   ├── SKILL_ai-streaming.md            # Streaming con Anthropic/OpenAI/Google, SSE
│   ├── SKILL_dnd-kit-sortable.md        # Drag & drop con @dnd-kit, sortable lists
│   ├── SKILL_tiptap-editor.md           # Editor rich text, extensiones, placeholder
│   ├── SKILL_framer-motion.md           # AnimatePresence, layout animations, page transitions
│   ├── SKILL_export-generators.md       # HTML autocontenido, JSON, Markdown, PDF
│   └── SKILL_image-pipeline.md          # Upload → sharp resize → Supabase Storage → CDN URL
├── settings.json                        # Config de Claude Code para el proyecto
└── CLAUDE.md                            # Instrucciones globales del proyecto
```

**Contenido de `.claude/CLAUDE.md`:**
```markdown
# Kiyoko AI — Instrucciones para Claude Code

## Reglas del proyecto
- TypeScript estricto en TODO el código (no usar `any`)
- Tailwind v4: estilos en CSS con @theme, NO tailwind.config.ts
- Componentes: function components + hooks, nunca clases
- Imports con alias `@/*` → `src/*`
- Supabase: SIEMPRE usar RLS, nunca bypass desde cliente
- IA: SIEMPRE pasar por el AI Router, nunca llamar SDKs directamente
- Archivos nuevos: crear en la ruta correcta según la estructura del spec
- Tests: al menos smoke test para cada API route

## MCP Servers disponibles
- Supabase MCP: para consultar schema, ejecutar queries, gestionar auth

## Documentación del proyecto
Toda la documentación informativa está en `/docs`. Consultarla antes de implementar.
```

### 0.2 Uso del MCP de Supabase

Claude Code **DEBE** usar el MCP server de Supabase para:

```yaml
MCP Server: Supabase
URL: (se configura al conectar el proyecto Supabase)

Operaciones que Claude Code debe hacer con MCP Supabase:
  - Crear y ejecutar migraciones SQL
  - Verificar que las tablas se crearon correctamente
  - Comprobar RLS policies activas
  - Crear Storage buckets
  - Ejecutar el seed de datos demo (Domenech)
  - Generar tipos TypeScript con `supabase gen types`
  - Verificar que Auth está configurado (email + password)
  - Depurar queries cuando algo falle

NO usar MCP Supabase para:
  - Operaciones en runtime de la app (usar SDK de @supabase/ssr)
  - Bypass de RLS (excepto durante seed con service_role_key)
```

Configurar en `.claude/settings.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-supabase", "--supabase-url", "$SUPABASE_URL", "--supabase-key", "$SUPABASE_SERVICE_ROLE_KEY"]
    }
  }
}
```

### 0.3 Carpeta `/docs` — Documentación del Proyecto

Toda la documentación generada, informativa, de referencia y de uso del proyecto se almacena en `/docs`. Claude Code debe crear esta estructura al inicio:

```
docs/
├── README.md                            # Índice de toda la documentación
├── SETUP.md                             # Guía de instalación paso a paso
├── ARCHITECTURE.md                      # Arquitectura del sistema, diagramas
├── DATABASE.md                          # Schema completo, relaciones, ERD en texto
├── AUTH_AND_ROLES.md                    # Sistema de auth, roles, middleware, flujos
├── AI_PROVIDERS.md                      # Sistema multi-IA, proveedores, fallback, API keys
├── AI_PROMPTS.md                        # Todos los system prompts documentados
├── PAGES_AND_ROUTES.md                  # Mapa de todas las rutas con descripción
├── COMPONENTS.md                        # Catálogo de componentes UI con props
├── API_ROUTES.md                        # Documentación de cada endpoint de API
├── EXPORT_FORMATS.md                    # Especificación de cada formato de export
├── DEMO_DOMENECH.md                     # Documentación del proyecto demo precargado
├── DEPLOYMENT.md                        # Guía de deploy en Vercel + Supabase
├── CHANGELOG.md                         # Historial de cambios del proyecto
├── seed-data/
│   ├── domenech-project.json            # Datos del proyecto demo en JSON
│   ├── domenech-scenes.json             # Todas las 28 escenas con prompts
│   ├── domenech-characters.json         # 4 personajes completos
│   ├── domenech-backgrounds.json        # 3 fondos
│   ├── domenech-timeline.json           # Timeline de montaje
│   ├── domenech-analysis.json           # Diagnóstico completo
│   └── domenech-reference-map.json      # Tabla de qué imagen subir dónde
└── assets/
    ├── erd-diagram.md                   # Diagrama entidad-relación en Mermaid
    ├── auth-flow.md                     # Diagrama de flujo de auth en Mermaid
    ├── ai-router-flow.md               # Diagrama del router IA en Mermaid
    └── wizard-flow.md                   # Diagrama del wizard paso a paso
```

**REGLA**: Cada vez que Claude Code implemente una funcionalidad nueva, DEBE actualizar el doc correspondiente en `/docs`. Si crea una nueva API route → actualizar `API_ROUTES.md`. Si cambia el schema → actualizar `DATABASE.md`.

---

## 0.5 IDENTIDAD DEL PROYECTO

| Campo | Valor |
|-------|-------|
| **Nombre** | **Kiyoko AI** (清子 — "claridad" en japonés, visión clara para cada escena) |
| **Nombre completo** | Kiyoko AI — Storyboard Production Studio |
| **Repositorio** | `kiyoko-studio` |
| **Base de datos Supabase** | `kiyoko_db` |
| **Dominio sugerido** | `kiyoko.ai` o `app.kiyoko.ai` |
| **Tagline** | "Del brief al storyboard en minutos, no en días" |

---

## 1. VISIÓN DEL PRODUCTO

**Kiyoko AI** es una aplicación web fullstack que permite crear storyboards profesionales para producción de vídeo asistidos por IA. El sistema funciona como un **director creativo virtual** que:

1. **Pregunta** al usuario sobre su proyecto (qué negocio, qué quiere comunicar, qué estilo)
2. **Genera automáticamente** todo el plan de producción: escenas, prompts para IA de imagen/vídeo (Grok Aurora, Midjourney, Runway, etc.), personajes, fondos, arco narrativo, timeline de montaje
3. **Permite editar** cada elemento manualmente, reordenar escenas, subir imágenes de referencia y generadas
4. **Exporta** a HTML interactivo, JSON, y Markdown listos para producción
5. **Mejora iterativamente** con un chat IA dentro de cada proyecto

El proyecto incluye como **demo funcional precargada** el caso real de "Domenech Peluquerías" — un storyboard estilo Pixar con 28 escenas, 4 personajes y 3 localizaciones.

---

## 2. STACK TECNOLÓGICO DEFINITIVO

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| **Framework** | **Next.js** (App Router) | 15+ | SSR, RSC, API Routes, middleware, layouts anidados |
| **Lenguaje** | **TypeScript** | 5.5+ | Tipado estricto en todo el proyecto |
| **Estilos** | **Tailwind CSS** | **v4** | Nuevo engine Oxide, `@theme` en CSS, sin tailwind.config |
| **Estado global** | **Zustand** | 5+ | Store ligero, persist, devtools |
| **Iconos** | **@tabler/icons-react** | 3+ | 5400+ iconos, MIT, consistentes |
| **Base de datos** | **Supabase** (PostgreSQL + Auth + Storage + Realtime) | latest | Auth email, RLS, buckets de imágenes |
| **IA (texto)** | **Multi-provider**: Anthropic + Google AI + OpenAI + Groq | latest | Router con fallback automático |
| **IA (imágenes)** | **Google Gemini** (gratis por defecto) + DALL-E + Stability | latest | Generación de imágenes integrada |
| **IA SDK** | `@anthropic-ai/sdk` + `@google/generative-ai` + `openai` + `groq-sdk` | latest | SDKs oficiales de cada provider |
| **Animaciones** | **Framer Motion** | 11+ | Page transitions, layout animations |
| **Formularios** | **React Hook Form** + **Zod** | latest | Validación tipada |
| **Editor rich text** | **Tiptap** | 2+ | Editar prompts y descripciones |
| **Drag & Drop** | **@dnd-kit/core** + **@dnd-kit/sortable** | latest | Reordenar escenas/timeline |
| **Toasts** | **Sonner** | latest | Notificaciones elegantes |
| **Fechas** | **date-fns** | 3+ | Formateo ligero |
| **Copy to clipboard** | **react-hot-toast** o nativo | — | Para botón "Copiar prompt" |
| **Markdown render** | **react-markdown** + **remark-gfm** | latest | Preview de exports .md |
| **Syntax highlight** | **Shiki** | latest | Highlight de prompts en bloques de código |
| **PDF export** | **@react-pdf/renderer** | latest | Exportar a PDF |
| **Image processing** | **sharp** (server) | latest | Thumbnails y optimización |

### Tailwind CSS v4 — Configuración

En Tailwind v4 **NO existe `tailwind.config.ts`**. La configuración va directamente en CSS:

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Colores de marca Kiyoko AI */
  --color-brand-50: #FFF8EB;
  --color-brand-100: #FEECC7;
  --color-brand-200: #FDDA8A;
  --color-brand-300: #FCC44D;
  --color-brand-400: #FBAE24;
  --color-brand-500: #F5930B;
  --color-brand-600: #D97006;
  --color-brand-700: #B54F09;
  --color-brand-800: #923D0E;
  --color-brand-900: #78330F;

  /* Surface (light mode) */
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F8F9FA;
  --color-surface-tertiary: #F1F3F5;

  /* Surface (se sobreescriben en dark) */
  --color-surface-dark: #0F1117;
  --color-surface-dark-secondary: #1A1D27;
  --color-surface-dark-tertiary: #252833;

  /* Fases del arco narrativo */
  --color-phase-hook: #E24B4A;
  --color-phase-build: #BA7517;
  --color-phase-peak: #1D9E75;
  --color-phase-close: #185FA5;

  /* Tipos de escena */
  --color-scene-original: #6B7280;
  --color-scene-improved: #D97706;
  --color-scene-new: #2563EB;
  --color-scene-filler: #8B5CF6;
  --color-scene-video: #EC4899;

  /* Fonts */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  /* Sombras */
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04);
  --shadow-card-hover: 0 4px 12px rgb(0 0 0 / 0.08), 0 2px 4px rgb(0 0 0 / 0.04);
  --shadow-dialog: 0 20px 60px rgb(0 0 0 / 0.15);
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: var(--color-surface-dark);
    --color-surface-secondary: var(--color-surface-dark-secondary);
    --color-surface-tertiary: var(--color-surface-dark-tertiary);
  }
}
```

---

## 2.1 SISTEMA MULTI-IA CON FALLBACK AUTOMÁTICO

### Filosofía: IA gratis por defecto, premium si el usuario quiere

Kiyoko AI funciona **sin que el usuario pague nada de IA** usando tiers gratuitos. Si un usuario quiere más calidad, velocidad o volumen, puede añadir sus propias API keys.

### Proveedores soportados

| Provider | Tipo | Tier gratuito | Modelo por defecto | Uso en Kiyoko AI |
|----------|------|---------------|-------------------|----------------|
| **Google Gemini** | Texto + Imágenes | ✅ 15 RPM gratis (generous) | `gemini-2.0-flash` | **DEFAULT para texto e imágenes** |
| **Anthropic Claude** | Texto | ⚠️ Requiere API key | `claude-sonnet-4-20250514` | Premium text, mejor calidad prompts |
| **Groq** | Texto | ✅ Gratis (rápido) | `llama-3.3-70b-versatile` | Fallback rápido de texto |
| **OpenAI** | Texto + Imágenes | ⚠️ Requiere API key | `gpt-4o-mini` | Alternativa de texto + DALL-E imágenes |
| **Google Imagen 3** | Imágenes | ✅ Incluido en Gemini free | via Gemini API | Generación de imágenes gratis |
| **Stability AI** | Imágenes | ⚠️ Requiere API key | `stable-diffusion-3` | Alternativa de imágenes |

### Cadena de Fallback (Prioridad)

```
TEXTO (generación de storyboards, chat, análisis):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ¿Tiene API key de Claude? ──YES──→ Usar Claude (mejor calidad)
       │ NO                              │ ¿Tiene créditos?
       ▼                                 │ NO → bajar al siguiente
  ¿Tiene API key de OpenAI? ──YES──→ Usar GPT-4o-mini
       │ NO                              │ ¿Tiene créditos?
       ▼                                 │ NO → bajar al siguiente
  Usar Gemini Flash (GRATIS) ────────→ ¿Quota agotada?
       │                                 │ SÍ → bajar al siguiente
       ▼                                 ▼
  Usar Groq LLaMA (GRATIS) ─────────→ ¿Quota agotada?
       │                                 │ SÍ → mostrar error amigable
       ▼                                 ▼
  SIEMPRE hay al menos 2 opciones      "Has agotado los límites gratuitos.
  gratuitas disponibles                  Añade tu API key para continuar."


IMÁGENES (generación de escenas, thumbnails):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ¿Tiene API key de OpenAI? ──YES──→ Usar DALL-E 3 (mejor calidad)
       │ NO                              │ ¿Tiene créditos?
       ▼                                 │ NO → bajar al siguiente
  ¿Tiene API key de Stability? ─YES─→ Usar Stable Diffusion 3
       │ NO                              │ ¿Tiene créditos?
       ▼                                 │ NO → bajar al siguiente
  Usar Gemini Imagen (GRATIS) ───────→ ¿Quota agotada?
       │                                 │ SÍ → mostrar error
       ▼                                 ▼
  SIEMPRE hay al menos 1 opción        "Límite de imágenes alcanzado.
  gratuita disponible                    Añade API key de OpenAI/Stability."
```

### Arquitectura del AI Router

```typescript
// src/lib/ai/router.ts — EL CORAZÓN DEL SISTEMA MULTI-IA

interface AiProvider {
  id: string;                    // 'claude' | 'gemini' | 'openai' | 'groq' | 'stability'
  name: string;                  // Nombre legible
  type: 'text' | 'image' | 'both';
  isFree: boolean;
  priority: number;              // 1=máxima prioridad (user custom key), 99=fallback
  isAvailable: boolean;          // ¿Tiene API key o es gratis?
  hasQuota: boolean;             // ¿Le quedan créditos?
  rateLimitRpm: number;          // Requests por minuto
  models: {
    text?: string;               // Modelo de texto
    image?: string;              // Modelo de imágenes
  };
}

interface AiRouterConfig {
  userId: string;
  task: 'text_generation' | 'image_generation' | 'chat' | 'analysis';
  preferredProvider?: string;    // Si el usuario fuerza un provider específico
  fallbackEnabled: boolean;      // true por defecto
}

// El router decide qué provider usar según:
// 1. ¿El usuario tiene API keys propias configuradas? → Esas primero
// 2. ¿El provider preferido tiene quota? → Usarlo
// 3. ¿Se agotó? → Pasar al siguiente en la cadena
// 4. ¿Todos los de pago agotados? → Usar los gratuitos
// 5. ¿Todo agotado? → Error amigable + invitación a añadir API key

class AiRouter {
  async getProvider(config: AiRouterConfig): Promise<AiProvider>;
  async generateText(prompt: string, systemPrompt: string, config: AiRouterConfig): Promise<AiTextResponse>;
  async generateImage(prompt: string, config: AiRouterConfig): Promise<AiImageResponse>;
  async streamText(prompt: string, systemPrompt: string, config: AiRouterConfig): AsyncIterable<string>;
  async checkQuota(providerId: string, userId: string): Promise<QuotaStatus>;
  async logUsage(providerId: string, userId: string, tokens: number, cost: number): Promise<void>;
}
```

### Tabla de base de datos para API Keys del usuario

```sql
-- =============================================
-- API KEYS DE USUARIO (cifradas)
-- =============================================
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  provider TEXT NOT NULL,           -- 'claude' | 'openai' | 'gemini' | 'groq' | 'stability'
  api_key_encrypted TEXT NOT NULL,  -- Cifrada con AES-256-GCM
  api_key_hint TEXT NOT NULL,       -- "sk-ant-...****7x3F" (últimos 4 chars)
  
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking de uso
  total_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10,4) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,                  -- Último error (rate limit, auth fail, etc)
  last_error_at TIMESTAMPTZ,
  
  -- Límites personalizados por el usuario
  monthly_budget_usd NUMERIC(10,2),  -- NULL = sin límite
  monthly_spent_usd NUMERIC(10,4) DEFAULT 0,
  budget_reset_at TIMESTAMPTZ,       -- Cuándo se resetea el contador mensual
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)          -- Un key por provider por usuario
);

CREATE INDEX idx_api_keys_user ON public.user_api_keys(user_id);

-- RLS: Solo el usuario ve sus propias keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keys" ON public.user_api_keys
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin reads all keys" ON public.user_api_keys
  FOR SELECT USING (is_admin());

-- =============================================
-- LOG DE USO DE IA (para tracking y fallback)
-- =============================================
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  provider TEXT NOT NULL,            -- Qué provider se usó
  model TEXT NOT NULL,               -- Qué modelo exacto
  task TEXT NOT NULL,                 -- 'text_generation' | 'image_generation' | 'chat' | 'analysis'
  
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  
  -- Si hubo fallback
  was_fallback BOOLEAN DEFAULT FALSE,
  original_provider TEXT,            -- Provider original que falló
  fallback_reason TEXT,              -- 'rate_limit' | 'quota_exceeded' | 'auth_error' | 'timeout'
  
  response_time_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON public.ai_usage_logs(user_id);
CREATE INDEX idx_usage_created ON public.ai_usage_logs(created_at);

-- RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON public.ai_usage_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin reads all logs" ON public.ai_usage_logs FOR ALL USING (is_admin());

-- Vista para resumen mensual de uso por usuario
CREATE OR REPLACE VIEW public.ai_usage_monthly AS
SELECT
  user_id,
  provider,
  date_trunc('month', created_at) AS month,
  COUNT(*) AS total_requests,
  SUM(total_tokens) AS total_tokens,
  SUM(estimated_cost_usd) AS total_cost,
  COUNT(*) FILTER (WHERE was_fallback) AS fallback_count,
  COUNT(*) FILTER (WHERE NOT success) AS error_count
FROM public.ai_usage_logs
GROUP BY user_id, provider, date_trunc('month', created_at);
```

### Implementación del AI Router

```typescript
// src/lib/ai/providers/index.ts

export const AI_PROVIDERS = {
  // --- TEXTO ---
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'both' as const,
    isFree: true,
    defaultModel: 'gemini-2.0-flash',
    imageModel: 'imagen-3.0-generate-001',
    rateLimitRpm: 15,           // Free tier
    costPer1kTokens: 0,         // Gratis
    sdk: '@google/generative-ai',
    envKey: 'GOOGLE_AI_API_KEY', // Key global del admin (free tier)
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    type: 'text' as const,
    isFree: false,
    defaultModel: 'claude-sonnet-4-20250514',
    rateLimitRpm: 50,
    costPer1kTokens: 0.003,
    sdk: '@anthropic-ai/sdk',
    envKey: 'ANTHROPIC_API_KEY',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'both' as const,
    isFree: false,
    defaultModel: 'gpt-4o-mini',
    imageModel: 'dall-e-3',
    rateLimitRpm: 60,
    costPer1kTokens: 0.00015,
    sdk: 'openai',
    envKey: 'OPENAI_API_KEY',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    type: 'text' as const,
    isFree: true,
    defaultModel: 'llama-3.3-70b-versatile',
    rateLimitRpm: 30,
    costPer1kTokens: 0,
    sdk: 'groq-sdk',
    envKey: 'GROQ_API_KEY',     // Key global del admin (free tier)
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    type: 'image' as const,
    isFree: false,
    imageModel: 'stable-diffusion-3',
    rateLimitRpm: 10,
    costPerImage: 0.03,
    sdk: 'fetch', // REST API directa
    envKey: 'STABILITY_API_KEY',
  },
} as const;

// Cadena de prioridad para texto (de mejor a fallback)
export const TEXT_PROVIDER_CHAIN = ['claude', 'openai', 'gemini', 'groq'];

// Cadena de prioridad para imágenes
export const IMAGE_PROVIDER_CHAIN = ['openai', 'stability', 'gemini'];
```

```typescript
// src/lib/ai/router.ts — Lógica del Router

import { createClient } from '@/lib/supabase/server';
import { AI_PROVIDERS, TEXT_PROVIDER_CHAIN, IMAGE_PROVIDER_CHAIN } from './providers';
import { decrypt } from '@/lib/utils/crypto';

export async function getAvailableProvider(
  userId: string,
  task: 'text' | 'image'
): Promise<{ providerId: string; apiKey: string; model: string }> {
  
  const supabase = await createClient();
  const chain = task === 'text' ? TEXT_PROVIDER_CHAIN : IMAGE_PROVIDER_CHAIN;
  
  // 1. Obtener API keys del usuario
  const { data: userKeys } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // 2. Recorrer la cadena de prioridad
  for (const providerId of chain) {
    const provider = AI_PROVIDERS[providerId];
    
    // ¿El usuario tiene key propia para este provider?
    const userKey = userKeys?.find(k => k.provider === providerId);
    if (userKey) {
      // ¿Ha superado su presupuesto mensual?
      if (userKey.monthly_budget_usd && userKey.monthly_spent_usd >= userKey.monthly_budget_usd) {
        continue; // Skip, presupuesto agotado → siguiente provider
      }
      return {
        providerId,
        apiKey: decrypt(userKey.api_key_encrypted),
        model: task === 'text' ? provider.defaultModel : provider.imageModel,
      };
    }
    
    // ¿Es un provider gratuito con key global del admin?
    if (provider.isFree) {
      const globalKey = process.env[provider.envKey];
      if (globalKey) {
        // Comprobar rate limit del usuario en el último minuto
        const { count } = await supabase
          .from('ai_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('provider', providerId)
          .gte('created_at', new Date(Date.now() - 60000).toISOString());
        
        if ((count || 0) < provider.rateLimitRpm) {
          return {
            providerId,
            apiKey: globalKey,
            model: task === 'text' ? provider.defaultModel : provider.imageModel,
          };
        }
        // Rate limited → siguiente provider
        continue;
      }
    }
  }
  
  throw new Error('NO_PROVIDER_AVAILABLE');
}
```

### Cifrado de API Keys

```typescript
// src/lib/utils/crypto.ts
// Las API keys del usuario se cifran con AES-256-GCM antes de guardar en DB
// La clave de cifrado está en ENCRYPTION_SECRET (env variable, 32 bytes hex)

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET = Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, SECRET, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(data: string): string {
  const [ivHex, tagHex, encHex] = data.split(':');
  const decipher = createDecipheriv(ALGORITHM, SECRET, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}
```

### Página de gestión de API Keys del usuario

```
/settings/api-keys → Página donde cada usuario gestiona SUS API keys

┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ AJUSTES  ›  Claves de IA                                       │
│─────────────────────────────────────────────────────────────────────│
│                                                                     │
│  Kiyoko AI usa IA gratuita por defecto (Gemini + Groq).              │
│  Añade tus propias API keys para usar modelos premium.             │
│                                                                     │
│  ┌─ TEXTO ──────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  🟢 Google Gemini (GRATIS — activo por defecto)               │   │
│  │  └ gemini-2.0-flash · 15 req/min · Sin coste                 │   │
│  │                                                               │   │
│  │  ⚪ Anthropic Claude (requiere API key)                       │   │
│  │  └ claude-sonnet-4 · Mejor calidad de prompts                │   │
│  │  ┌───────────────────────────────────────────────────────┐    │   │
│  │  │ API Key: sk-ant-api03-••••••••••••••••••7x3F          │    │   │
│  │  │ Presupuesto mensual: $5.00  │ Usado: $1.23            │    │   │
│  │  │ [✅ Activa]  [✏️ Editar]  [🗑️ Eliminar]  [🔍 Test]    │    │   │
│  │  └───────────────────────────────────────────────────────┘    │   │
│  │                                                               │   │
│  │  ⚪ OpenAI (requiere API key)                                 │   │
│  │  └ [➕ Añadir API key]                                        │   │
│  │                                                               │   │
│  │  🟢 Groq (GRATIS — activo como fallback)                     │   │
│  │  └ llama-3.3-70b · 30 req/min · Sin coste                    │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ IMÁGENES ───────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  🟢 Google Imagen 3 (GRATIS — via Gemini)                    │   │
│  │  └ Calidad aceptable · Incluido en Gemini free               │   │
│  │                                                               │   │
│  │  ⚪ OpenAI DALL-E 3 (requiere API key)                        │   │
│  │  └ [➕ Añadir API key] · Mejor calidad de imágenes            │   │
│  │                                                               │   │
│  │  ⚪ Stability AI (requiere API key)                           │   │
│  │  └ [➕ Añadir API key] · Stable Diffusion 3                   │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ USO ESTE MES ───────────────────────────────────────────────┐   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │ Gemini   │  │ Claude   │  │ Groq     │  │ Total    │     │   │
│  │  │ 47 req   │  │ 12 req   │  │ 3 req    │  │ 62 req   │     │   │
│  │  │ $0.00    │  │ $1.23    │  │ $0.00    │  │ $1.23    │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ORDEN DE PRIORIDAD (arrastra para reordenar):                      │
│  ┌─────────────────────────────────────────────┐                    │
│  │ ≡ 1. Claude (tu key)          [Premium]     │                    │
│  │ ≡ 2. Gemini Flash             [Gratis]      │                    │
│  │ ≡ 3. Groq LLaMA               [Gratis]      │                    │
│  └─────────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. ARQUITECTURA DE BASE DE DATOS (Supabase — `kiyoko_db`)

### 3.1 Schema SQL completo

```sql
-- =============================================
-- EXTENSIONES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda fuzzy

-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'pending', 'blocked');
CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'review', 'completed', 'archived');
CREATE TYPE project_style AS ENUM ('pixar', 'realistic', 'anime', 'watercolor', 'flat_2d', 'cyberpunk', 'custom');
CREATE TYPE target_platform AS ENUM ('youtube', 'instagram_reels', 'tiktok', 'tv_commercial', 'web', 'custom');
CREATE TYPE scene_type AS ENUM ('original', 'improved', 'new', 'filler', 'video');
CREATE TYPE scene_status AS ENUM ('draft', 'prompt_ready', 'generating', 'generated', 'approved', 'rejected');
CREATE TYPE arc_phase AS ENUM ('hook', 'build', 'peak', 'close');
CREATE TYPE issue_type AS ENUM ('strength', 'warning', 'suggestion');
CREATE TYPE export_format AS ENUM ('html', 'json', 'markdown', 'pdf');
CREATE TYPE camera_angle AS ENUM ('wide', 'medium', 'close_up', 'extreme_close_up', 'pov', 'low_angle', 'high_angle', 'birds_eye', 'dutch', 'over_shoulder');
CREATE TYPE camera_movement AS ENUM ('static', 'dolly_in', 'dolly_out', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'tracking', 'crane', 'handheld', 'orbit');

-- =============================================
-- 1. PROFILES (extiende auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'pending',
  bio TEXT DEFAULT '',
  company TEXT DEFAULT '',
  preferences JSONB DEFAULT '{
    "theme": "system",
    "language": "es",
    "notifications": true,
    "default_style": "pixar"
  }',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PROJECTS
-- =============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  client_logo_url TEXT,
  style project_style NOT NULL DEFAULT 'pixar',
  custom_style_description TEXT, -- Si style='custom'
  status project_status NOT NULL DEFAULT 'draft',
  target_duration_seconds INTEGER DEFAULT 60,
  target_platform target_platform NOT NULL DEFAULT 'youtube',
  
  -- Paleta de colores del proyecto (para exports y UI)
  color_palette JSONB DEFAULT '{
    "primary": "#C8860A",
    "secondary": "#E8943A",
    "accent": "#F5EDD8",
    "dark": "#2A1A0A",
    "light": "#FFF8EB"
  }',
  
  -- Brief original que el usuario dio a la IA
  ai_brief TEXT DEFAULT '',
  
  -- Análisis completo generado por IA (snapshot)
  ai_analysis JSONB DEFAULT '{}',
  
  -- Configuración de generador de imágenes
  image_generator TEXT DEFAULT 'grok_aurora', -- 'grok_aurora' | 'midjourney' | 'dalle' | 'stable_diffusion' | 'flux'
  image_generator_config JSONB DEFAULT '{}',
  
  -- Configuración de generador de vídeo
  video_generator TEXT DEFAULT 'grok_aurora', -- 'grok_aurora' | 'runway' | 'pika' | 'kling'
  video_generator_config JSONB DEFAULT '{}',
  
  -- Metadata extra
  tags TEXT[] DEFAULT '{}',
  is_demo BOOLEAN DEFAULT FALSE, -- TRUE para el proyecto Domenech precargado
  thumbnail_url TEXT,
  cover_image_url TEXT,
  
  -- Stats calculados
  total_scenes INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  total_backgrounds INTEGER DEFAULT 0,
  estimated_duration_seconds NUMERIC(6,1) DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0, -- 0-100

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_status ON public.projects(status);

-- =============================================
-- 3. CHARACTERS (Personajes)
-- =============================================
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  initials TEXT NOT NULL DEFAULT '', -- "JO", "CO", "NE", "RA"
  role TEXT DEFAULT '', -- "Director · El jefe"
  description TEXT DEFAULT '', -- Descripción narrativa libre
  
  -- Descripción visual detallada (para que la IA genere prompts)
  visual_description TEXT DEFAULT '',
  
  -- Snippet reutilizable que se inyecta en los prompts de escena
  -- Ejemplo: "a heavyset confident man, auburn-brown swept-back hair, freckles, wearing a blue steel blazer over a black shirt"
  prompt_snippet TEXT DEFAULT '',
  
  personality TEXT DEFAULT '', -- "Confiado, cálido, líder natural"
  
  -- Atributos visuales constantes
  signature_clothing TEXT DEFAULT '', -- "blazer azul acero + camisa negra"
  hair_description TEXT DEFAULT '', -- "pelo castaño rojizo peinado hacia atrás"
  accessories TEXT[] DEFAULT '{}', -- ["collar plata", "pulseras"]
  signature_tools TEXT[] DEFAULT '{}', -- ["tijeras", "secador rose gold"]
  
  -- Color asociado al personaje (para badges y UI)
  color_accent TEXT DEFAULT '#6B7280',
  
  -- Imagen de referencia (character sheet subida a Storage)
  reference_image_url TEXT,
  reference_image_path TEXT, -- path en bucket storage
  
  -- Escenas en las que aparece (calculado)
  appears_in_scenes TEXT[] DEFAULT '{}', -- ["E1", "E3", "E5"]
  
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_project ON public.characters(project_id);

-- =============================================
-- 4. BACKGROUNDS (Fondos / Localizaciones)
-- =============================================
CREATE TABLE public.backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL, -- "REF-EXT", "REF-PELUCAS", "REF-ESTILISMO"
  name TEXT NOT NULL, -- "Fachada exterior del salón"
  description TEXT DEFAULT '',
  
  -- Tipo de localización
  location_type TEXT DEFAULT 'interior', -- 'interior' | 'exterior' | 'mixed'
  time_of_day TEXT DEFAULT 'day', -- 'dawn' | 'morning' | 'day' | 'golden_hour' | 'evening' | 'night'
  
  -- Prompt snippet que se inyecta en escenas que usan este fondo
  prompt_snippet TEXT DEFAULT '',
  
  -- Imagen de referencia
  reference_image_url TEXT,
  reference_image_path TEXT,
  
  -- Ángulos disponibles para este fondo
  available_angles TEXT[] DEFAULT '{}', -- ["frontal", "lateral", "aéreo", "POV"]
  
  -- Escenas que usan este fondo (calculado)
  used_in_scenes TEXT[] DEFAULT '{}',
  
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backgrounds_project ON public.backgrounds(project_id);

-- =============================================
-- 5. SCENES (Escenas) — TABLA PRINCIPAL
-- =============================================
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Identificación
  scene_number TEXT NOT NULL, -- "E1", "E4A", "N1", "R2", "V7B"
  title TEXT NOT NULL,
  
  -- Clasificación
  scene_type scene_type NOT NULL DEFAULT 'original',
  category TEXT DEFAULT '', -- 'intro' | 'presentation' | 'service' | 'prosthesis' | 'celebration' | 'cta' | 'filler' | 'transition'
  arc_phase arc_phase DEFAULT 'build',
  
  -- Contenido narrativo
  description TEXT DEFAULT '', -- Descripción narrativa de la escena
  director_notes TEXT DEFAULT '', -- Notas de dirección (el "✦" de las mejoras)
  
  -- PROMPTS (el contenido más importante)
  prompt_image TEXT DEFAULT '', -- Prompt completo para generación de IMAGEN
  prompt_video TEXT DEFAULT '', -- Prompt completo para generación de VÍDEO
  prompt_additions TEXT DEFAULT '', -- Adiciones al prompt original (mejoras)
  
  -- Mejoras (lista de strings)
  improvements JSONB DEFAULT '[]', -- [{"type": "improve"|"add", "text": "..."}]
  
  -- Timing
  duration_seconds NUMERIC(4,1) DEFAULT 5.0,
  start_time TEXT DEFAULT '', -- "0:00" (en el timeline)
  end_time TEXT DEFAULT '', -- "0:05"
  
  -- Referencias
  background_id UUID REFERENCES public.backgrounds(id) ON DELETE SET NULL,
  character_ids UUID[] DEFAULT '{}',
  
  -- Imágenes de referencia necesarias para generar esta escena
  -- Ejemplo: ["REF-EXT", "REF-JOSÉ", "REF-CONCHI"]
  required_references TEXT[] DEFAULT '{}',
  reference_tip TEXT DEFAULT '', -- "Sube REF-ESTILISMO + REF-NEREA como principales"
  
  -- Cámara
  camera_angle camera_angle DEFAULT 'medium',
  camera_movement camera_movement DEFAULT 'static',
  camera_notes TEXT DEFAULT '', -- Notas extra de cámara
  
  -- Ambiente
  lighting TEXT DEFAULT '', -- "golden hour", "warm amber studio"
  mood TEXT DEFAULT '', -- "energetic", "emotional"
  music_notes TEXT DEFAULT '', -- "Música emotiva, piano suave"
  sound_notes TEXT DEFAULT '', -- "Solo sonido de tijeras, sin música"
  
  -- Estado de producción
  status scene_status NOT NULL DEFAULT 'draft',
  
  -- Imágenes generadas (URLs en Storage)
  generated_image_url TEXT,
  generated_image_path TEXT,
  generated_image_thumbnail_url TEXT,
  generated_video_url TEXT,
  generated_video_path TEXT,
  
  -- Versiones anteriores
  prompt_history JSONB DEFAULT '[]', -- [{version, prompt, timestamp}]
  
  -- Orden visual
  sort_order INTEGER DEFAULT 0,
  
  -- Notas libres
  notes TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenes_project ON public.scenes(project_id);
CREATE INDEX idx_scenes_type ON public.scenes(scene_type);
CREATE INDEX idx_scenes_sort ON public.scenes(project_id, sort_order);

-- =============================================
-- 6. NARRATIVE_ARCS (Fases del arco narrativo)
-- =============================================
CREATE TABLE public.narrative_arcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  phase TEXT NOT NULL, -- 'hook' | 'presentation' | 'services' | 'specialty' | 'transformation' | 'cta'
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  
  start_second NUMERIC(5,1) DEFAULT 0,
  end_second NUMERIC(5,1) DEFAULT 0,
  
  scene_ids UUID[] DEFAULT '{}',
  scene_numbers TEXT[] DEFAULT '{}', -- ["E1", "N1"] para referencia rápida
  
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '', -- nombre del icono tabler
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_arcs_project ON public.narrative_arcs(project_id);

-- =============================================
-- 7. TIMELINE_ENTRIES (Montaje final segundo a segundo)
-- =============================================
CREATE TABLE public.timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  
  start_time TEXT NOT NULL, -- "0:00"
  end_time TEXT NOT NULL, -- "0:03"
  duration_seconds NUMERIC(4,1) DEFAULT 0,
  
  arc_phase arc_phase DEFAULT 'build',
  phase_color TEXT DEFAULT '#6B7280',
  
  -- Para versiones alternativas (corte largo vs corte para Instagram)
  timeline_version TEXT DEFAULT 'full', -- 'full' | 'short_30s' | 'short_15s' | 'custom'
  
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_project ON public.timeline_entries(project_id);

-- =============================================
-- 8. PROJECT_ISSUES (Diagnóstico / Análisis)
-- =============================================
CREATE TABLE public.project_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  issue_type issue_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  
  category TEXT DEFAULT '', -- 'prompts' | 'narrative' | 'visual' | 'audio' | 'pacing'
  priority INTEGER DEFAULT 0, -- 0=baja, 1=media, 2=alta
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT DEFAULT '',
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_project ON public.project_issues(project_id);

-- =============================================
-- 9. AI_CONVERSATIONS (Chat IA por proyecto)
-- =============================================
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Historial de mensajes
  messages JSONB NOT NULL DEFAULT '[]',
  -- Formato: [{
  --   "id": "uuid",
  --   "role": "user" | "assistant",
  --   "content": "texto del mensaje",
  --   "timestamp": "ISO date",
  --   "attachments": [{"type": "scene"|"character"|"image", "id": "uuid"}]
  -- }]
  
  -- Paso del wizard (si es conversación de creación)
  wizard_step TEXT DEFAULT '', -- 'brief' | 'backgrounds' | 'characters' | 'scenes' | 'review' | 'complete'
  
  -- Tipo de conversación
  conversation_type TEXT DEFAULT 'wizard', -- 'wizard' | 'chat' | 'improve'
  
  title TEXT DEFAULT 'Nueva conversación',
  completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_project ON public.ai_conversations(project_id);

-- =============================================
-- 10. EXPORTS (Historial de exportaciones)
-- =============================================
CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  format export_format NOT NULL,
  file_url TEXT, -- URL en Storage
  file_path TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  
  version INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  
  -- Config usada para generar
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. REFERENCE_MAP (Tabla de qué imagen subir en cada escena)
-- =============================================
CREATE TABLE public.reference_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  background_id UUID REFERENCES public.backgrounds(id) ON DELETE SET NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  
  reference_type TEXT NOT NULL, -- 'background' | 'character'
  priority INTEGER DEFAULT 0, -- Orden de subida al generador
  notes TEXT DEFAULT '', -- "Para que Grok replique la arquitectura"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refmap_scene ON public.reference_maps(scene_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Lee el email del admin desde app settings o variable hardcodeada
  admin_email := coalesce(
    current_setting('app.settings.admin_email', true),
    'TU_EMAIL_AQUI@dominio.com'  -- ← CAMBIAR por tu email real
  );
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = admin_email THEN 'admin'::user_role ELSE 'pending'::user_role END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-updated_at en todas las tablas
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.backgrounds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para recalcular stats del proyecto
CREATE OR REPLACE FUNCTION public.recalc_project_stats(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.projects SET
    total_scenes = (SELECT COUNT(*) FROM public.scenes WHERE project_id = p_id),
    total_characters = (SELECT COUNT(*) FROM public.characters WHERE project_id = p_id),
    total_backgrounds = (SELECT COUNT(*) FROM public.backgrounds WHERE project_id = p_id),
    estimated_duration_seconds = (SELECT COALESCE(SUM(duration_seconds), 0) FROM public.scenes WHERE project_id = p_id),
    completion_percentage = (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status IN ('generated', 'approved'))::NUMERIC / COUNT(*)::NUMERIC) * 100)
      END FROM public.scenes WHERE project_id = p_id
    )
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Row Level Security (RLS)

```sql
-- Activar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_maps ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER: Comprobar si es admin
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HELPER: Comprobar si el usuario está aprobado
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor', 'viewer')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- POLICIES: PROFILES
-- =============================================
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin reads all profiles" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin updates any profile" ON public.profiles FOR UPDATE USING (is_admin());

-- =============================================
-- POLICIES: PROJECTS (y todas las tablas hijas siguen el mismo patrón)
-- =============================================
-- Admin ve todo
CREATE POLICY "Admin full access projects" ON public.projects FOR ALL USING (is_admin());
-- Editor ve y edita sus propios proyectos
CREATE POLICY "Owner full access projects" ON public.projects FOR ALL USING (
  owner_id = auth.uid() AND is_approved()
);
-- Viewer ve proyectos demo
CREATE POLICY "Anyone reads demo projects" ON public.projects FOR SELECT USING (is_demo = TRUE AND is_approved());

-- REPLICAR PATRÓN PARA TABLAS HIJAS (characters, backgrounds, scenes, etc.)
-- Ejemplo para scenes:
CREATE POLICY "Admin full access scenes" ON public.scenes FOR ALL USING (is_admin());
CREATE POLICY "Owner full access scenes" ON public.scenes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = scenes.project_id AND owner_id = auth.uid()) AND is_approved()
);
CREATE POLICY "Demo scenes readable" ON public.scenes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = scenes.project_id AND is_demo = TRUE) AND is_approved()
);
-- (Repetir el mismo patrón para characters, backgrounds, narrative_arcs, timeline_entries, project_issues, ai_conversations, exports, reference_maps)
```

### 3.3 Storage Buckets

```sql
-- Bucket para assets de proyectos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-assets',
  'project-assets',
  true,
  52428800, -- 50MB máx
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']
);

-- Bucket para avatares de usuario
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5242880); -- 5MB

-- Bucket para exports generados
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false);

-- Policies de storage
CREATE POLICY "Approved users upload assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-assets' AND is_approved());
CREATE POLICY "Public read assets" ON storage.objects
  FOR SELECT USING (bucket_id IN ('project-assets', 'avatars'));
CREATE POLICY "Owners delete own assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. ESTRUCTURA DE ARCHIVOS COMPLETA

```
kiyoko-studio/
├── .env.local
├── .env.example
├── .claude/
│   ├── CLAUDE.md                            # Instrucciones globales
│   ├── settings.json                        # MCP servers config
│   └── skills/                              # Skills de referencia para Claude Code
│       ├── SKILL_nextjs-app-router.md
│       ├── SKILL_tailwind-v4.md
│       ├── SKILL_supabase-auth-rls.md
│       ├── SKILL_supabase-storage.md
│       ├── SKILL_zustand-patterns.md
│       ├── SKILL_multi-ai-provider.md
│       ├── SKILL_ai-streaming.md
│       ├── SKILL_dnd-kit-sortable.md
│       ├── SKILL_tiptap-editor.md
│       ├── SKILL_framer-motion.md
│       ├── SKILL_export-generators.md
│       └── SKILL_image-pipeline.md
├── docs/                                    # TODA la documentación del proyecto
│   ├── README.md
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── AUTH_AND_ROLES.md
│   ├── AI_PROVIDERS.md
│   ├── AI_PROMPTS.md
│   ├── PAGES_AND_ROUTES.md
│   ├── COMPONENTS.md
│   ├── API_ROUTES.md
│   ├── EXPORT_FORMATS.md
│   ├── DEMO_DOMENECH.md
│   ├── DEPLOYMENT.md
│   ├── CHANGELOG.md
│   ├── seed-data/
│   │   ├── domenech-project.json
│   │   ├── domenech-scenes.json
│   │   ├── domenech-characters.json
│   │   ├── domenech-backgrounds.json
│   │   ├── domenech-timeline.json
│   │   ├── domenech-analysis.json
│   │   └── domenech-reference-map.json
│   └── assets/
│       ├── erd-diagram.md
│       ├── auth-flow.md
│       ├── ai-router-flow.md
│       └── wizard-flow.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs              # Tailwind v4 usa postcss
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   ├── 00003_storage_buckets.sql
│   │   └── 00004_seed_domenech.sql  # Proyecto demo completo
│   └── seed.sql
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── logo-dark.svg
│   ├── og-image.png                 # Open Graph image
│   └── demo/
│       └── domenech/                # Assets del proyecto demo
│           ├── jose.png
│           ├── conchi.png
│           ├── peluquera_2.png      # Nerea
│           ├── peluquero_1.png      # Raúl
│           ├── ref-ext.png
│           ├── ref-pelucas.png
│           └── ref-estilismo.png
├── src/
│   ├── app/
│   │   ├── layout.tsx               # RootLayout: providers, fonts, metadata
│   │   ├── page.tsx                 # Landing → redirect a /dashboard o /login
│   │   ├── globals.css              # Tailwind v4 @theme + custom CSS
│   │   ├── not-found.tsx            # 404 custom
│   │   ├── error.tsx                # Error boundary global
│   │   ├── loading.tsx              # Loading global
│   │   │
│   │   ├── (auth)/                  # ← Grupo de rutas sin layout de dashboard
│   │   │   ├── layout.tsx           # Layout centrado, fondo decorativo
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # LOGIN
│   │   │   ├── register/
│   │   │   │   └── page.tsx         # REGISTRO
│   │   │   ├── pending/
│   │   │   │   └── page.tsx         # CUENTA PENDIENTE
│   │   │   ├── blocked/
│   │   │   │   └── page.tsx         # CUENTA BLOQUEADA
│   │   │   └── forgot-password/
│   │   │       └── page.tsx         # RECUPERAR CONTRASEÑA
│   │   │
│   │   ├── (dashboard)/             # ← Grupo con sidebar + header
│   │   │   ├── layout.tsx           # DashboardLayout: sidebar + header + main
│   │   │   ├── page.tsx             # DASHBOARD / LISTA DE PROYECTOS
│   │   │   │
│   │   │   ├── new/                 # ← Crear nuevo proyecto (wizard IA)
│   │   │   │   ├── page.tsx         # WIZARD IA: paso a paso
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── admin/               # ← Solo visible para role='admin'
│   │   │   │   ├── page.tsx         # PANEL ADMIN: resumen
│   │   │   │   └── users/
│   │   │   │       └── page.tsx     # GESTIÓN DE USUARIOS
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx         # AJUSTES DE PERFIL
│   │   │   │   └── api-keys/
│   │   │   │       └── page.tsx     # GESTIÓN DE API KEYS DE IA
│   │   │   │
│   │   │   └── p/[slug]/            # ← Proyecto individual
│   │   │       ├── layout.tsx       # ProjectLayout: tabs + contexto
│   │   │       ├── page.tsx         # OVERVIEW DEL PROYECTO
│   │   │       ├── loading.tsx
│   │   │       ├── analysis/
│   │   │       │   └── page.tsx     # PESTAÑA: DIAGNÓSTICO
│   │   │       ├── arc/
│   │   │       │   └── page.tsx     # PESTAÑA: ARCO NARRATIVO
│   │   │       ├── scenes/
│   │   │       │   ├── page.tsx     # PESTAÑA: TODAS LAS ESCENAS
│   │   │       │   └── [sceneId]/
│   │   │       │       └── page.tsx # DETALLE DE ESCENA INDIVIDUAL
│   │   │       ├── characters/
│   │   │       │   └── page.tsx     # PESTAÑA: PERSONAJES
│   │   │       ├── backgrounds/
│   │   │       │   └── page.tsx     # PESTAÑA: FONDOS / LOCALIZACIONES
│   │   │       ├── timeline/
│   │   │       │   └── page.tsx     # PESTAÑA: TIMELINE / MONTAJE
│   │   │       ├── references/
│   │   │       │   └── page.tsx     # PESTAÑA: MAPA DE REFERENCIAS
│   │   │       ├── chat/
│   │   │       │   └── page.tsx     # PESTAÑA: CHAT IA
│   │   │       ├── exports/
│   │   │       │   └── page.tsx     # PESTAÑA: EXPORTAR
│   │   │       └── settings/
│   │   │           └── page.tsx     # CONFIG DEL PROYECTO
│   │   │
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── generate-project/route.ts
│   │       │   ├── generate-scenes/route.ts
│   │       │   ├── generate-image/route.ts      # Genera imagen con provider disponible
│   │       │   ├── improve-prompt/route.ts
│   │       │   ├── analyze-project/route.ts
│   │       │   ├── generate-timeline/route.ts
│   │       │   ├── generate-characters/route.ts
│   │       │   ├── generate-arc/route.ts
│   │       │   ├── chat/route.ts
│   │       │   └── providers/
│   │       │       └── status/route.ts          # GET: estado de providers del usuario
│   │       ├── user/
│   │       │   ├── api-keys/route.ts            # CRUD de API keys del usuario
│   │       │   ├── api-keys/[id]/route.ts       # Update/delete key específica
│   │       │   ├── api-keys/test/route.ts       # POST: testear una API key
│   │       │   └── usage/route.ts               # GET: estadísticas de uso mensual
│   │       ├── export/
│   │       │   ├── html/route.ts
│   │       │   ├── json/route.ts
│   │       │   ├── markdown/route.ts
│   │       │   └── pdf/route.ts
│   │       └── admin/
│   │           ├── users/route.ts
│   │           └── users/[userId]/route.ts
│   │
│   ├── components/
│   │   ├── ui/                       # Componentes base (20+)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── AlertDialog.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── DropdownMenu.tsx
│   │   │   ├── Sheet.tsx
│   │   │   ├── Switch.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── ScrollArea.tsx
│   │   │   ├── Separator.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── CopyButton.tsx        # Botón copiar al clipboard
│   │   │   ├── ImageUpload.tsx        # Dropzone de imágenes
│   │   │   ├── ImagePreview.tsx       # Preview con lightbox
│   │   │   ├── PromptBlock.tsx        # Bloque de código con copy + highlight
│   │   │   ├── StatusBadge.tsx        # Badge de estado (draft, approved, etc)
│   │   │   └── ColorPicker.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarNav.tsx
│   │   │   ├── SidebarProjectNav.tsx  # Nav del proyecto activo
│   │   │   ├── Header.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── UserMenu.tsx
│   │   │
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectGrid.tsx
│   │   │   ├── ProjectOverview.tsx
│   │   │   ├── ProjectSettings.tsx
│   │   │   ├── ProjectStats.tsx
│   │   │   ├── ProjectTabs.tsx
│   │   │   ├── ProjectWizard.tsx
│   │   │   ├── WizardStepBrief.tsx
│   │   │   ├── WizardStepBackgrounds.tsx
│   │   │   ├── WizardStepCharacters.tsx
│   │   │   ├── WizardStepScenes.tsx
│   │   │   └── WizardStepReview.tsx
│   │   │
│   │   ├── scenes/
│   │   │   ├── SceneCard.tsx          # Card colapsable
│   │   │   ├── SceneCardExpanded.tsx   # Contenido expandido (prompts, mejoras)
│   │   │   ├── SceneDetail.tsx        # Página completa de escena
│   │   │   ├── ScenePromptEditor.tsx  # Editor de prompt con Tiptap
│   │   │   ├── ScenePromptViewer.tsx  # Vista con syntax highlight + copy
│   │   │   ├── SceneGrid.tsx          # Grid con filtros
│   │   │   ├── SceneFilters.tsx       # Filtros: tipo, fase, fondo, personaje
│   │   │   ├── SceneImageUpload.tsx   # Subir imagen generada
│   │   │   ├── SceneImageGallery.tsx  # Ver imagen generada + referencia lado a lado
│   │   │   ├── SceneReferenceTable.tsx # Tabla de "qué imágenes subir"
│   │   │   ├── SceneTimeline.tsx      # Vista mini-timeline
│   │   │   ├── SceneDragList.tsx      # Lista reordenable DnD
│   │   │   ├── SceneCreateDialog.tsx  # Modal para crear escena manual
│   │   │   └── SceneAiImproveButton.tsx # Botón "Mejorar con IA"
│   │   │
│   │   ├── characters/
│   │   │   ├── CharacterCard.tsx      # Card con avatar, nombre, rol, imagen
│   │   │   ├── CharacterGrid.tsx
│   │   │   ├── CharacterForm.tsx      # Formulario crear/editar
│   │   │   ├── CharacterDetail.tsx    # Vista detalle con prompt snippet
│   │   │   ├── CharacterImageUpload.tsx
│   │   │   └── CharacterPromptSnippet.tsx  # El snippet copiable
│   │   │
│   │   ├── backgrounds/
│   │   │   ├── BackgroundCard.tsx
│   │   │   ├── BackgroundGrid.tsx
│   │   │   ├── BackgroundForm.tsx
│   │   │   ├── BackgroundDetail.tsx
│   │   │   └── BackgroundImageUpload.tsx
│   │   │
│   │   ├── analysis/
│   │   │   ├── AnalysisDashboard.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   ├── IssueList.tsx
│   │   │   ├── ArcSteps.tsx
│   │   │   └── ScoreBar.tsx
│   │   │
│   │   ├── arc/
│   │   │   ├── ArcView.tsx
│   │   │   ├── ArcPhaseCard.tsx
│   │   │   └── ArcTimebar.tsx
│   │   │
│   │   ├── timeline/
│   │   │   ├── TimelineView.tsx
│   │   │   ├── TimelineEntry.tsx
│   │   │   ├── TimelineDragSort.tsx
│   │   │   ├── TimelineVersionTabs.tsx # full | short_30s | short_15s
│   │   │   └── TimelineDirectorNote.tsx
│   │   │
│   │   ├── references/
│   │   │   ├── ReferenceMap.tsx        # Tabla grande de qué subir dónde
│   │   │   ├── ReferenceMapRow.tsx
│   │   │   └── ReferenceInstructions.tsx # Instrucciones de cómo subir a Grok
│   │   │
│   │   ├── ai/
│   │   │   ├── AiChat.tsx
│   │   │   ├── AiChatMessage.tsx
│   │   │   ├── AiChatInput.tsx
│   │   │   ├── AiChatSuggestions.tsx   # Sugerencias rápidas
│   │   │   ├── AiGenerateButton.tsx
│   │   │   ├── AiStreamingText.tsx     # Texto que aparece token a token
│   │   │   └── AiLoadingDots.tsx
│   │   │
│   │   ├── exports/
│   │   │   ├── ExportPanel.tsx
│   │   │   ├── ExportPreview.tsx
│   │   │   ├── ExportHistory.tsx
│   │   │   └── ExportFormatCard.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── UserTable.tsx
│   │       ├── UserRoleBadge.tsx
│   │       └── UserRoleSelect.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── admin.ts
│   │   ├── ai/
│   │   │   ├── router.ts                  # AI Router principal (fallback chain)
│   │   │   ├── providers/
│   │   │   │   ├── index.ts               # Registry de providers + constantes
│   │   │   │   ├── base.ts                # Interfaz base AiProvider
│   │   │   │   ├── claude.ts              # Adapter para Anthropic Claude
│   │   │   │   ├── gemini.ts              # Adapter para Google Gemini (texto + imágenes)
│   │   │   │   ├── openai.ts              # Adapter para OpenAI (texto + DALL-E)
│   │   │   │   ├── groq.ts               # Adapter para Groq (texto rápido)
│   │   │   │   └── stability.ts           # Adapter para Stability AI (imágenes)
│   │   │   ├── prompts/
│   │   │   │   ├── system-project-generator.ts
│   │   │   │   ├── system-scene-generator.ts
│   │   │   │   ├── system-scene-improver.ts
│   │   │   │   ├── system-analyzer.ts
│   │   │   │   ├── system-timeline-generator.ts
│   │   │   │   ├── system-character-generator.ts
│   │   │   │   └── system-chat-assistant.ts
│   │   │   └── schemas/
│   │   │       ├── project-output.ts
│   │   │       ├── scene-output.ts
│   │   │       ├── character-output.ts
│   │   │       ├── analysis-output.ts
│   │   │       └── timeline-output.ts
│   │   ├── export/
│   │   │   ├── generate-html.ts
│   │   │   ├── generate-json.ts
│   │   │   ├── generate-markdown.ts
│   │   │   └── generate-pdf.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       ├── slugify.ts
│   │       ├── crypto.ts                  # Encrypt/decrypt API keys (AES-256-GCM)
│   │       ├── format-time.ts
│   │       ├── format-duration.ts
│   │       ├── image-utils.ts
│   │       └── constants.ts
│   │
│   ├── stores/
│   │   ├── useProjectStore.ts
│   │   ├── useUIStore.ts
│   │   ├── useAiChatStore.ts
│   │   ├── useAiProviderStore.ts          # Estado del provider activo + quotas
│   │   └── useFilterStore.ts
│   │
│   ├── hooks/
│   │   ├── useProject.ts
│   │   ├── useScenes.ts
│   │   ├── useCharacters.ts
│   │   ├── useBackgrounds.ts
│   │   ├── useTimeline.ts
│   │   ├── useIssues.ts
│   │   ├── useAuth.ts
│   │   ├── useAdmin.ts
│   │   ├── useAiGenerate.ts
│   │   ├── useAiChat.ts
│   │   ├── useAiProvider.ts               # Hook para obtener provider disponible
│   │   ├── useApiKeys.ts                  # Hook para CRUD de API keys
│   │   ├── useAiUsage.ts                  # Hook para estadísticas de uso
│   │   ├── useExport.ts
│   │   ├── useImageUpload.ts
│   │   └── useDebounce.ts
│   │
│   ├── types/
│   │   ├── database.ts               # Generado con supabase gen types
│   │   ├── project.ts
│   │   ├── scene.ts
│   │   ├── character.ts
│   │   ├── background.ts
│   │   ├── timeline.ts
│   │   ├── ai.ts                     # Tipos genéricos IA
│   │   ├── ai-providers.ts           # Tipos del sistema multi-provider
│   │   └── export.ts
│   │
│   └── middleware.ts
```

---

## 5. TODAS LAS PÁGINAS — DETALLE VISUAL Y FUNCIONAL

### 5.1 `/login` — Inicio de Sesión

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ┌──────────────────────────────────┐                │
│         │  🎬 KIYOKO AI                       │                │
│         │  AI Storyboard Production Studio  │                │
│         │                                   │                │
│         │  ┌─────────────────────────────┐  │                │
│         │  │ Email                       │  │                │
│         │  └─────────────────────────────┘  │                │
│         │  ┌─────────────────────────────┐  │                │
│         │  │ Contraseña                  │  │                │
│         │  └─────────────────────────────┘  │                │
│         │                                   │                │
│         │  [██████ Iniciar sesión ██████]    │                │
│         │                                   │                │
│         │  ¿No tienes cuenta? Regístrate    │                │
│         │  ¿Olvidaste tu contraseña?        │                │
│         └──────────────────────────────────┘                │
│                                                             │
│  (fondo: gradiente sutil brand-500 → brand-900)            │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidad**: Supabase Auth `signInWithPassword`. Si el usuario tiene `role=pending` → redirect a `/pending`. Si `role=blocked` → redirect a `/blocked`.

---

### 5.2 `/register` — Registro

Mismo layout que login pero con campos: Nombre completo, Email, Contraseña, Confirmar contraseña. Al registrarse → se crea profile con `role=pending` (excepto ADMIN_EMAIL que es `admin`).

---

### 5.3 `/pending` — Cuenta Pendiente

```
┌─────────────────────────────────────────────────┐
│                                                 │
│     ⏳  Tu cuenta está pendiente de             │
│         aprobación                              │
│                                                 │
│     Un administrador revisará tu solicitud      │
│     pronto. Recibirás un email cuando tu        │
│     cuenta sea activada.                        │
│                                                 │
│     [Cerrar sesión]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 5.4 `/dashboard` (LISTA DE PROYECTOS) — La página principal

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (260px)        │  HEADER: Mis Proyectos    [+ Nuevo Proyecto]│
│                        │─────────────────────────────────────────────│
│ 🎬 KIYOKO AI             │                                             │
│ ───────────────        │  FILTROS: [Todos ▾] [Estado ▾] [Buscar...] │
│                        │                                             │
│ 📁 Mis Proyectos  ←   │  ┌─── PROJECT CARD ──────────────────────┐  │
│ ➕ Nuevo Proyecto       │  │ ┌────────┐                           │  │
│                        │  │ │ 🖼️ thumb│  Domenech Peluquerías    │  │
│ ─── RECIENTES ───      │  │ │ (cover │  Pixar · 75s · YouTube   │  │
│ 📌 Domenech Pelucas    │  │ │ image) │  28 escenas · 4 personaj │  │
│ 📌 Clínica Dental      │  │ └────────┘                           │  │
│                        │  │ [■■■■■■■■░░] 72% completado          │  │
│ ─── ADMIN ───          │  │                                       │  │
│ 👥 Gestionar usuarios  │  │ 🟢 En progreso  ·  Hace 2 horas      │  │
│                        │  │ [★ DEMO]                              │  │
│ ─── CUENTA ───         │  └──────────────────────────────────────┘  │
│ ⚙️ Ajustes             │                                             │
│ 🌙 Tema: Sistema ▾    │  ┌─── PROJECT CARD ──────────────────────┐  │
│ 🚪 Cerrar sesión       │  │ (otro proyecto...)                    │  │
│                        │  └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Lo que se ve**:
- Grid de cards de proyectos con thumbnail/cover, título, info, barra de progreso, estado
- Las imágenes de cover se muestran como thumbnails (160x90 o similar)
- Badge "DEMO" en el proyecto Domenech precargado
- Estadísticas rápidas en cada card: nº escenas, personajes, duración

**Funcionalidad**:
- Filtrar por estado (draft, in_progress, completed, archived)
- Buscar por título o cliente
- Ordenar por fecha, nombre, progreso
- Click en card → navega a `/p/[slug]`
- Botón "+ Nuevo Proyecto" → navega a `/new`

---

### 5.5 `/new` — WIZARD IA (Crear nuevo proyecto)

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  WIZARD: Nuevo Proyecto                                   │
│         │───────────────────────────────────────────────────────────│
│         │                                                           │
│         │  PASOS: ① Brief  ② Fondos  ③ Personajes  ④ Escenas  ⑤ Rev│
│         │  ═══════════════●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│         │                                                           │
│         │  ┌───── CHAT IA ──────────────────────────────────────┐   │
│         │  │                                                    │   │
│         │  │ 🤖 ¡Hola! Soy tu director creativo virtual.       │   │
│         │  │    Vamos a crear tu storyboard paso a paso.       │   │
│         │  │                                                    │   │
│         │  │    Para empezar, cuéntame:                        │   │
│         │  │    → ¿De qué trata tu proyecto de vídeo?          │   │
│         │  │    → ¿Quién es el cliente?                        │   │
│         │  │    → ¿Qué quieres comunicar?                      │   │
│         │  │                                                    │   │
│         │  │ 👤 Es un vídeo para una peluquería llamada        │   │
│         │  │    Domenech que también hace prótesis capilares.   │   │
│         │  │    Quiero estilo Pixar, para YouTube, 60-75 seg.  │   │
│         │  │                                                    │   │
│         │  │ 🤖 ¡Perfecto! Entiendo: un vídeo promocional     │   │
│         │  │    estilo Pixar 3D para Domenech Peluquerías...   │   │
│         │  │                                                    │   │
│         │  │    RESUMEN DEL BRIEF:                              │   │
│         │  │    ┌─────────────────────────────────────────┐     │   │
│         │  │    │ Cliente: Domenech Peluquerías            │     │   │
│         │  │    │ Estilo: Pixar 3D Animation               │     │   │
│         │  │    │ Duración: 60-75 segundos                 │     │   │
│         │  │    │ Plataforma: YouTube                      │     │   │
│         │  │    │ Servicios: Peluquería + Prótesis capilar │     │   │
│         │  │    └─────────────────────────────────────────┘     │   │
│         │  │                                                    │   │
│         │  │    ¿Es correcto? ¿Quieres añadir algo?            │   │
│         │  │    [✅ Confirmar y continuar]  [✏️ Modificar]       │   │
│         │  │                                                    │   │
│         │  ├────────────────────────────────────────────────────┤   │
│         │  │ [📎 Adjuntar imagen]  Escribe tu respuesta...  [→]│   │
│         │  └────────────────────────────────────────────────────┘   │
│         │                                                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Pasos del wizard**:

| Paso | La IA pregunta | El usuario responde | La IA genera |
|------|---------------|-------------------|-------------|
| **① Brief** | ¿De qué trata? ¿Cliente? ¿Objetivo? ¿Estilo? ¿Duración? ¿Plataforma? | Texto libre o selecciona opciones | Resumen del brief para confirmar |
| **② Fondos** | ¿Cuántas localizaciones? Describe cada una. ¿Tienes fotos? | Describe o sube fotos de referencia | Código (REF-xxx), nombre, prompt snippet por fondo |
| **③ Personajes** | ¿Cuántos personajes? Describe aspecto, rol, herramientas | Describe o sube character sheets | Ficha completa, prompt snippet, color, herramientas |
| **④ Escenas** | (genera automáticamente basándose en los pasos anteriores) | Revisa y pide cambios | Escenas con prompts imagen+vídeo, arco narrativo, timeline |
| **⑤ Revisión** | Muestra el proyecto completo + diagnóstico | Aprueba o pide más cambios | Guarda todo en Supabase, redirect a `/p/[slug]` |

**Las imágenes se ven**: Cuando el usuario sube fotos de referencia en los pasos 2 y 3, se muestran como thumbnails junto al chat. Las fotos se suben a Supabase Storage `project-assets/{projectId}/references/`.

---

### 5.6 `/p/[slug]` — OVERVIEW DEL PROYECTO

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Domenech Peluquerías · Overview          [⚙️] [📤 Export]│
│         │───────────────────────────────────────────────────────────│
│ PROYECTO│  TABS: [Overview] Diagnóstico  Arco  Escenas  Personajes │
│ ACTIVO: │        Fondos  Timeline  Referencias  Chat IA  Exportar  │
│         │───────────────────────────────────────────────────────────│
│ 📊 Over │                                                           │
│ 🔍 Diag │  ┌─ STATS ─────────────────────────────────────────────┐  │
│ 📈 Arco │  │ 28 escenas  │  4 personajes  │  3 fondos  │  ~75s  │  │
│ 🎬 Esce │  │ ■■■■■■■░░░  │  ■■■■■■■■■■   │  ■■■■■■■■  │  opt.  │  │
│ 👥 Pers │  │ 72% done    │  completos     │  con refs  │  target│  │
│ 🏠 Fond │  └────────────────────────────────────────────────────┘  │
│ ⏱️ Time │                                                           │
│ 📋 Refs │  ┌─ COVER IMAGE ───────────────────────────────────────┐  │
│ 💬 Chat │  │                                                     │  │
│ 📤 Exp  │  │   🖼️ [Imagen de cover del proyecto — grande]        │  │
│         │  │   Si no hay: placeholder con gradiente de marca     │  │
│         │  │                                                     │  │
│         │  └─────────────────────────────────────────────────────┘  │
│         │                                                           │
│         │  ┌─ INFO ────────────┐  ┌─ ÚLTIMAS ESCENAS ───────────┐  │
│         │  │ Cliente: Domenech │  │ 🖼️ E4A  🖼️ E4B  🖼️ E5      │  │
│         │  │ Estilo: Pixar     │  │ Pegamento Colocac Celebrac   │  │
│         │  │ Plataforma: YT    │  │ (thumbnails de imágenes      │  │
│         │  │ Generador: Grok   │  │  generadas si las hay)       │  │
│         │  │ [✏️ Editar]        │  │ [Ver todas →]                │  │
│         │  └───────────────────┘  └─────────────────────────────┘  │
│         │                                                           │
│         │  ┌─ ACTIVIDAD RECIENTE ────────────────────────────────┐  │
│         │  │ • Escena N7 aprobada — hace 2h                      │  │
│         │  │ • 3 nuevos prompts generados — hace 5h              │  │
│         │  │ • Personaje Nerea actualizado — ayer                 │  │
│         │  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Lo que se ve**: Stats, cover image (grande), info del proyecto, grid de últimas escenas con thumbnails, actividad reciente.

---

### 5.7 `/p/[slug]/analysis` — DIAGNÓSTICO

```
┌─────────────────────────────────────────────────────────────────────┐
│  TABS: Overview  [Diagnóstico]  Arco  Escenas...                    │
│─────────────────────────────────────────────────────────────────────│
│                                                                     │
│  ┌──── MÉTRICAS ─────────────────────────────────────────────────┐  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │ │ Escenas  │ │ Duración │ │ Fondos   │ │ Personaj │          │  │
│  │ │   28     │ │  ~75s    │ │   3      │ │   4      │          │  │
│  │ │ 16+12new │ │ opt:60-75│ │ con refs │ │ fichas ok│          │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  PUNTUACIÓN POR ÁREAS                                               │
│  ┌─ ✅ Prompts técnicos — muy sólidos ──────────────────────────┐  │
│  │ Descripción de personajes precisa, iluminación bien...        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌─ ✅ Prótesis capilar masculina — secuencia sobresaliente ────┐  │
│  │ Las escenas 4A y 4B son el punto más fuerte del anuncio...    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌─ ⚠️ El gancho inicial es demasiado suave ────────────────────┐  │
│  │ En publicidad moderna los primeros 3 segundos deben ser...    │  │
│  │ [✅ Resuelto]  [🤖 Generar solución con IA]                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌─ ➕ Falta el momento "antes/después" visual ─────────────────┐  │
│  │ El anuncio muestra el proceso pero no una comparativa...      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [🤖 Regenerar análisis con IA]                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Funcionalidad**: Cada issue tiene botón para marcar como resuelto y botón para que la IA genere una solución (nueva escena, mejora de prompt, etc.)

---

### 5.8 `/p/[slug]/scenes` — TODAS LAS ESCENAS

```
┌─────────────────────────────────────────────────────────────────────┐
│  TABS: ...  [Escenas]  ...         [+ Nueva escena] [🤖 Generar IA]│
│─────────────────────────────────────────────────────────────────────│
│                                                                     │
│  FILTROS:                                                           │
│  Tipo: [Todas] [Originales] [Mejoradas] [Nuevas] [Relleno] [Vídeo]│
│  Fase: [Todas] [Gancho🔴] [Desarrollo🟠] [Clímax🟢] [Cierre🔵]    │
│  Fondo: [Todos] [Exterior] [Sala prótesis] [Sala principal]        │
│  Vista: [📋 Lista] [🔲 Grid] [⏱️ Timeline]                         │
│                                                                     │
│  ┌─ ESCENA E1 ── [Mejorada🟠] ── Logo Reveal ─── 5s ───── ▼ ──┐  │
│  │                                                               │  │
│  │  (COLAPSADA: solo título, número, tipo, duración, tags)      │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ ESCENA E4A ── [Mejorada🟠] ── Pegamento ─── 8s ──── ▲ ────┐  │
│  │                                                               │  │
│  │  (EXPANDIDA al hacer click ▲)                                │  │
│  │                                                               │  │
│  │  ┌─ IMAGEN GENERADA ─┐  ┌─ IMAGEN REFERENCIA ────────────┐  │  │
│  │  │                    │  │                                 │  │  │
│  │  │ 🖼️ [Si hay imagen  │  │ 🖼️ REF-PELUCAS  🖼️ REF-NEREA  │  │  │
│  │  │  generada, se      │  │ (thumbnails de las refs        │  │  │
│  │  │  muestra aquí      │  │  necesarias, clickables)       │  │  │
│  │  │  a tamaño medio]   │  │                                 │  │  │
│  │  │                    │  │                                 │  │  │
│  │  │ [📤 Subir imagen]  │  │                                 │  │  │
│  │  └────────────────────┘  └─────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌─ MEJORAS ──────────────────────────────────────────────┐  │  │
│  │  │ → El prompt actual no especifica la hora del día...    │  │  │
│  │  │ → La cámara debe arrancar desde el suelo...            │  │  │
│  │  │ + Añadir variante: ángulo desde el interior...         │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌─ PROMPT DE IMAGEN ─────────────────────────────────────┐  │  │
│  │  │ ```                                                    │  │  │
│  │  │ Pixar Studios 3D animated render, interior of          │  │  │
│  │  │ Domenech hair salon prosthesis consultation area...    │  │  │
│  │  │ ```                                            [📋 Copy]│  │  │
│  │  │                              [✏️ Editar] [🤖 Mejorar IA]│  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌─ PROMPT DE VÍDEO ──────────────────────────────────────┐  │  │
│  │  │ ```                                                    │  │  │
│  │  │ SILENT SCENE. NO DIALOGUE...                           │  │  │
│  │  │ ```                                            [📋 Copy]│  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  REFS NECESARIAS: [🖼️ REF-PELUCAS] [👤 REF-NEREA]            │  │
│  │  Tip: "Sube REF-PELUCAS como fondo y REF-NEREA como..."     │  │
│  │                                                               │  │
│  │  META: Cámara: close medium · Mov: static · Luz: warm       │  │
│  │        Mood: emotional · Fase: peak🟢 · Estado: prompt_ready │  │
│  │                                                               │
│  │  [✏️ Editar escena] [🗑️ Eliminar] [🤖 Regenerar prompt IA]    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Lo que se ve en cada escena expandida**:
1. **Imagen generada** — grande a la izquierda (si existe). Botón subir si no hay.
2. **Imágenes de referencia** — thumbnails de los fondos y personajes necesarios
3. **Mejoras** — lista con iconos → (mejorar) y + (añadir)
4. **Prompt de imagen** — bloque de código con syntax highlight + botón copiar + editar + mejorar con IA
5. **Prompt de vídeo** — mismo formato
6. **Referencias necesarias** — badges clickables que llevan a la ficha del fondo/personaje
7. **Tip de producción** — consejo de qué subir primero al generador
8. **Metadata** — cámara, movimiento, iluminación, mood, fase, estado
9. **Acciones** — editar, eliminar, regenerar con IA

---

### 5.9 `/p/[slug]/scenes/[sceneId]` — DETALLE DE ESCENA INDIVIDUAL

Página completa dedicada a una sola escena. Layout:
- **Columna izquierda (60%)**: Imagen generada grande, galería de versiones, prompt editor con Tiptap
- **Columna derecha (40%)**: Metadata, referencias, mejoras, historial de versiones del prompt
- **Abajo**: Navegación prev/next entre escenas

---

### 5.10 `/p/[slug]/characters` — PERSONAJES

```
┌─────────────────────────────────────────────────────────────────────┐
│  TABS: ...  [Personajes]  ...                     [+ Nuevo personaje]│
│─────────────────────────────────────────────────────────────────────│
│                                                                     │
│  BIBLIA DE PERSONAJES                                               │
│                                                                     │
│  ┌─── CARD ─────────┐  ┌─── CARD ─────────┐  ┌─── CARD ────────┐  │
│  │ ┌──────────────┐  │  │ ┌──────────────┐  │  │ ┌─────────────┐ │  │
│  │ │              │  │  │ │              │  │  │ │             │ │  │
│  │ │  🖼️ IMAGEN   │  │  │ │  🖼️ IMAGEN   │  │  │ │  🖼️ IMAGEN  │ │  │
│  │ │  REFERENCIA  │  │  │ │  REFERENCIA  │  │  │ │  REFERENCIA │ │  │
│  │ │  (jose.png)  │  │  │ │ (conchi.png) │  │  │ │(nerea.png)  │ │  │
│  │ │              │  │  │ │              │  │  │ │             │ │  │
│  │ └──────────────┘  │  │ └──────────────┘  │  │ └─────────────┘ │  │
│  │                    │  │                    │  │                 │  │
│  │  [JO] José         │  │  [CO] Conchi       │  │  [NE] Nerea    │  │
│  │  Director · Jefe   │  │  Estilista senior  │  │  Espec. prótes │  │
│  │                    │  │                    │  │                 │  │
│  │  — Blazer azul     │  │  — Jersey rosa     │  │  — Chaquetón   │  │
│  │  — Pelo castaño    │  │  — Pelo rubio riz  │  │  — Moño bajo   │  │
│  │  — Cortes M y F    │  │  — Tinte y color   │  │  — Prótesis    │  │
│  │  — Lavados         │  │  — Secado          │  │  — Permanentes │  │
│  │  — Asesor prótesis │  │  — Pelucas femen   │  │  — La + técnic │  │
│  │                    │  │                    │  │                 │  │
│  │  Aparece en:       │  │  Aparece en:       │  │  Aparece en:   │  │
│  │  E3 E5 E6 E8 E9   │  │  E3 E5 E6 E7B E9  │  │  E3 E4A E4B   │  │
│  │  N5 N8             │  │  N4                │  │  E5 E7C E9 N7 │  │
│  │                    │  │                    │  │                 │  │
│  │  PROMPT SNIPPET:   │  │                    │  │                 │  │
│  │  ┌──────────────┐  │  │                    │  │                 │  │
│  │  │ "a heavyset  │  │  │                    │  │                 │  │
│  │  │  confident   │  │  │                    │  │                 │  │
│  │  │  man, auburn │  │  │                    │  │                 │  │
│  │  │  hair..."    │  │  │                    │  │                 │  │
│  │  │      [📋Copy]│  │  │                    │  │                 │  │
│  │  └──────────────┘  │  │                    │  │                 │  │
│  │                    │  │                    │  │                 │  │
│  │  [✏️ Edit] [🗑️ Del]│  │  [✏️ Edit] [🗑️ Del]│  │  [✏️][🗑️]      │  │
│  └────────────────────┘  └────────────────────┘  └─────────────────┘  │
│                                                                     │
│  REGLAS DE CONSISTENCIA VISUAL                                      │
│  ┌─ ✅ Ropa invariable en todo el anuncio ──────────────────────┐  │
│  ┌─ ⚠️ Guantes para escenas de prótesis ────────────────────────┐  │
│  ┌─ ➕ Herramientas como extensión del personaje ────────────────┐  │
└─────────────────────────────────────────────────────────────────────┘
```

**Lo que se ve**: Imagen de referencia del personaje grande y visible, todas sus fichas, el prompt snippet copiable, y en qué escenas aparece (badges clickables).

---

### 5.11 `/p/[slug]/backgrounds` — FONDOS / LOCALIZACIONES

Grid similar a personajes. Cada card muestra la imagen de referencia del fondo, su código, nombre, prompt snippet copiable, y en qué escenas se usa.

---

### 5.12 `/p/[slug]/arc` — ARCO NARRATIVO

```
┌─────────────────────────────────────────────────────────────────────┐
│  ARCO NARRATIVO MEJORADO — 75 SEGUNDOS                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ BARRA VISUAL PROPORCIONAL AL TIEMPO                          │   │
│  │ [🔴 HOOK 0-5s][🟠 PRESENT 5-15s][🟠 SERVICES 15-35s]       │   │
│  │ [🟢 SPECIALTY 35-55s][🟢 TRANSF 55-65s][🔵 CTA 65-75s]     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ 1. GANCHO (0-5s) 🔴 ────────────────────────────────────────┐  │
│  │ Emoción antes que marca                                       │  │
│  │ Cold open: close-up de manos trabajando en silencio...        │  │
│  │ Escenas: [N1] [E1]                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌─ 2. PRESENTACIÓN (5-15s) 🟠 ─────────────────────────────────┐  │
│  │ ...                                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  (etc.)                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.13 `/p/[slug]/timeline` — MONTAJE FINAL

```
┌─────────────────────────────────────────────────────────────────────┐
│  SECUENCIA DE MONTAJE — 85 SEGUNDOS                                 │
│                                                                     │
│  VERSIÓN: [Completa (1:25)] [Instagram 30s] [TikTok 15s]           │
│                                                                     │
│  🔴 0:00─0:03  N1 · Cold open tijeras                              │
│  │             Misterio. Sin música, solo sonido de tijeras.        │
│  🔴 0:03─0:08  E1 · Logo reveal                                    │
│  │             Entra la música. Mechón dorado forma DOMENECH.       │
│  🟠 0:08─0:13  E2 · Exterior dolly-in                              │
│  │             Cámara desde el suelo. Fachada DOMENECH emerge.      │
│  🟠 0:13─0:20  E3 · Equipo completo                                │
│  │             Los 4 con herramientas. Dolly-in lento.              │
│  🟠 0:20─0:35  Montaje servicios rápido (E6,E7,E7B,E7C,E7D,N8,N9)│
│  │             Corte rápido entre: Raúl cortando → barba →...       │
│  🟢 0:35─0:38  R4 · Título "¿Pérdida de cabello?"                  │
│  │             Pausa dramática. Cambio emocional.                   │
│  🟢 0:38─0:43  N6 · Beauty shot prótesis                           │
│  │             ...                                                  │
│  (etc.)                                                             │
│                                                                     │
│  ┌─ NOTA DE DIRECCIÓN ──────────────────────────────────────────┐   │
│  │ Versión larga (1:25) para YouTube. Para Instagram usar el    │   │
│  │ corte de 30s: N1→E1→Montaje→E4A+4B→N7→E5→E9                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [🤖 Regenerar timeline IA] [✏️ Editar manualmente] [↕️ Reordenar] │
└─────────────────────────────────────────────────────────────────────┘
```

**Funcionalidad**: Drag & drop para reordenar entradas. Tabs para versiones (full, 30s, 15s).

---

### 5.14 `/p/[slug]/references` — MAPA DE REFERENCIAS

```
┌─────────────────────────────────────────────────────────────────────┐
│  ¿QUÉ SUBIR EN CADA ESCENA?                                        │
│                                                                     │
│  Tabla con: Escena | REF-EXT | REF-PELUCAS | REF-ESTILISMO |       │
│            JOSÉ | CONCHI | NEREA | RAÚL | TIP                       │
│                                                                     │
│  E1 Logo    │  —   │  —     │  —        │ — │ — │ — │ — │ Puro DG │
│  E2 Exter   │  ✅  │  —     │  —        │ — │ — │ — │ — │ Fachada │
│  E3 Equipo  │  —   │  —     │  ✅       │ ✅│ ✅│ ✅│ ✅│ 5 imgs  │
│  E4A Pegam  │  —   │  ✅    │  —        │ — │ — │ ✅│ — │ Nerea+  │
│  ...                                                                │
│                                                                     │
│  CÓMO SUBIR LAS IMÁGENES EN GROK:                                  │
│  1. Ve a grok.com → selecciona "Aurora"                             │
│  2. Haz clic en el icono de clip 📎                                 │
│  3. Sube primero la imagen de FONDO                                 │
│  4. Luego sube la(s) imagen(es) de PERSONAJE                       │
│  5. Escribe: "Use these images as style reference."                 │
│  6. Pega el prompt completo de la escena                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.15 `/p/[slug]/chat` — CHAT IA DEL PROYECTO

Chat conversacional con contexto del proyecto completo. La IA puede:
- Generar nuevas escenas
- Mejorar prompts existentes
- Analizar problemas
- Sugerir cambios en el arco narrativo
- Responder preguntas sobre producción

---

### 5.16 `/p/[slug]/exports` — EXPORTAR

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXPORTAR PROYECTO                                                  │
│                                                                     │
│  ┌─ HTML ────────────┐  ┌─ JSON ────────────┐  ┌─ MARKDOWN ─────┐  │
│  │ 📄 HTML            │  │ {} JSON           │  │ # Markdown     │  │
│  │ Interactivo        │  │ Estructurado      │  │ Con prompts    │  │
│  │                    │  │                    │  │                │  │
│  │ Archivo HTML auto- │  │ Todo el proyecto  │  │ Similar al     │  │
│  │ contenido con tabs │  │ en JSON para      │  │ archivo de     │  │
│  │ diagnóstico, arco, │  │ importar en otro  │  │ producción     │  │
│  │ escenas, timeline. │  │ sistema o backup. │  │ original.      │  │
│  │                    │  │                    │  │                │  │
│  │ [⬇️ Descargar HTML]│  │ [⬇️ Descargar JSON]│  │ [⬇️ Descargar] │  │
│  └────────────────────┘  └────────────────────┘  └────────────────┘  │
│                                                                     │
│  ┌─ PDF ─────────────┐                                              │
│  │ 📕 PDF             │                                              │
│  │ Documento formal   │                                              │
│  │ [⬇️ Descargar PDF] │                                              │
│  └────────────────────┘                                              │
│                                                                     │
│  HISTORIAL DE EXPORTACIONES                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ v3 · HTML · 14 mar 2026 · 2.1 MB              [⬇️ Descargar] │  │
│  │ v2 · JSON · 12 mar 2026 · 850 KB              [⬇️ Descargar] │  │
│  │ v1 · HTML · 10 mar 2026 · 1.8 MB              [⬇️ Descargar] │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.17 `/admin/users` — GESTIÓN DE USUARIOS (Solo admin)

```
┌─────────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE USUARIOS                          [Invitar usuario]     │
│                                                                     │
│  FILTRO: [Todos] [Pendientes🟡] [Editores🟢] [Bloqueados🔴]        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 👤 Juan García                                                 │  │
│  │ juan@email.com · Registrado: 15 mar 2026                      │  │
│  │ Estado: 🟡 Pendiente                                           │  │
│  │                                                                │  │
│  │ [✅ Aprobar como Editor] [✅ Aprobar como Viewer] [🚫 Bloquear]│  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 👤 María López                                                 │  │
│  │ maria@email.com · Registrado: 10 mar 2026                     │  │
│  │ Estado: 🟢 Editor · Último acceso: hace 3h                     │  │
│  │                                                                │  │
│  │ [Cambiar rol ▾]  [🚫 Bloquear]                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. VARIABLES DE ENTORNO

```env
# .env.local

# =============================================
# SUPABASE
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# =============================================
# IA — PROVIDERS GLOBALES (del admin, para tier gratuito)
# =============================================
# Google Gemini (GRATIS) — Obtener en: https://aistudio.google.com/apikey
# Este es el provider por DEFECTO para texto e imágenes
GOOGLE_AI_API_KEY=AIza...

# Groq (GRATIS) — Obtener en: https://console.groq.com/keys
# Fallback rápido para texto cuando Gemini tiene rate limit
GROQ_API_KEY=gsk_...

# Anthropic Claude (OPCIONAL — requiere créditos)
# Si el admin quiere usar Claude como provider premium global
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI (OPCIONAL — requiere créditos)
# Para DALL-E 3 y GPT-4o como opción premium
OPENAI_API_KEY=sk-proj-...

# =============================================
# SEGURIDAD
# =============================================
# Clave para cifrar las API keys de los usuarios en la DB
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_SECRET=a1b2c3d4e5f6...64_hex_chars

# =============================================
# ADMIN
# =============================================
# El ÚNICO email que tendrá acceso inmediato como admin
ADMIN_EMAIL=tu-email@dominio.com

# =============================================
# APP
# =============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Kiyoko AI
```

**`.env.example`** (se commitea al repo, sin valores reales):
```env
# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA — Al menos Google AI es necesario para el tier gratuito
GOOGLE_AI_API_KEY=                  # GRATIS: https://aistudio.google.com/apikey
GROQ_API_KEY=                       # GRATIS: https://console.groq.com/keys
ANTHROPIC_API_KEY=                  # OPCIONAL (premium)
OPENAI_API_KEY=                     # OPCIONAL (premium + DALL-E)

# Seguridad
ENCRYPTION_SECRET=                  # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin
ADMIN_EMAIL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Kiyoko AI
```

---

## 7. SISTEMA DE AUTENTICACIÓN Y ROLES

```
REGISTRO → Supabase Auth crea user → Trigger crea profile
    │
    ├── Si email === ADMIN_EMAIL → role = 'admin' → acceso total
    │
    └── Si otro email → role = 'pending' → pantalla de espera
                │
                ├── Admin aprueba → role = 'editor' → CRUD propio
                ├── Admin aprueba → role = 'viewer' → solo lectura
                └── Admin bloquea → role = 'blocked' → sin acceso

MIDDLEWARE (src/middleware.ts):
  1. No hay sesión → /login
  2. role = 'pending' → /pending
  3. role = 'blocked' → /blocked
  4. Ruta /admin/* y role ≠ 'admin' → /dashboard (redirect)
  5. Resto → permitir
```

---

## 8. FLUJO COMPLETO DEL ASISTENTE IA

### System Prompt del Generador de Proyectos

```
Eres Kiyoko AI, un director creativo y productor audiovisual experto.
Tu trabajo es guiar al usuario paso a paso para crear un storyboard profesional.

PROCESO:
1. Pregunta sobre el proyecto (brief, cliente, objetivo, estilo, duración, plataforma)
2. Pregunta sobre localizaciones/fondos (interiores, exteriores, hora del día)
3. Pregunta sobre personajes (aspecto, rol, herramientas, personalidad)
4. Genera automáticamente: escenas, prompts, arco narrativo, timeline, diagnóstico
5. Permite revisión y refinamiento iterativo

REGLAS PARA PROMPTS:
- Empezar siempre con el estilo visual: "Pixar Studios 3D animated render" (o el elegido)
- Describir composición de cámara con terminología cinematográfica
- Especificar iluminación con detalle (golden hour, warm amber, etc.)
- Detallar posición y acción de CADA personaje
- Las escenas son SILENTES: "NO DIALOGUE. NO SPEAKING. NO LIP MOVEMENT."
- Terminar con el estilo y duración

FORMATO DE RESPUESTA: Responde SIEMPRE en JSON cuando se te pida.
Responde en el IDIOMA del usuario.
```

### JSON de respuesta IA (documentado en código con Zod schemas)

El esquema completo está definido en `src/lib/ai/schemas/` con Zod. El output incluye: project, characters[], backgrounds[], scenes[], narrative_arc[], timeline[], analysis{strengths[], warnings[], suggestions[], metrics}.

---

## 9. GESTIÓN DE IMÁGENES

### Estructura de Storage en Supabase

```
project-assets/
├── {projectId}/
│   ├── cover.webp                    # Cover del proyecto
│   ├── references/
│   │   ├── backgrounds/
│   │   │   ├── ref-ext.png           # Fondo exterior
│   │   │   ├── ref-pelucas.png       # Fondo sala prótesis
│   │   │   └── ref-estilismo.png     # Fondo sala principal
│   │   └── characters/
│   │       ├── jose.png              # Character sheet José
│   │       ├── conchi.png
│   │       ├── nerea.png
│   │       └── raul.png
│   ├── generated/
│   │   ├── images/
│   │   │   ├── e1-logo-reveal.webp   # Imagen generada escena E1
│   │   │   ├── e4a-pegamento.webp
│   │   │   └── ...
│   │   └── videos/
│   │       ├── v6-equipo.mp4
│   │       └── ...
│   └── exports/
│       ├── v1-html.html
│       └── v2-json.json
```

### Componente ImageUpload

- Dropzone con drag & drop
- Preview antes de subir
- Crop / resize opcional
- Progress bar durante upload
- Se sube a Supabase Storage
- Se guarda la URL en la tabla correspondiente (character.reference_image_url, scene.generated_image_url, etc.)
- Thumbnails generados automáticamente con `sharp` en API route

### Visualización de imágenes en la app

| Lugar | Tamaño | Lo que muestra |
|-------|--------|---------------|
| ProjectCard (dashboard) | 320x180 | Cover o placeholder gradiente |
| SceneCard (colapsada) | 48x48 | Thumbnail mini de imagen generada |
| SceneCard (expandida) | 400x300 | Imagen generada + refs lado a lado |
| SceneDetail (página completa) | 800x600 | Imagen grande con lightbox al click |
| CharacterCard | 200x200 | Character sheet de referencia |
| BackgroundCard | 300x200 | Foto de referencia del fondo |
| Timeline | 64x36 | Tiny thumbnails junto a cada entrada |
| ReferenceMap (tabla) | 32x32 | Mini iconos indicando si hay imagen |
| Chat IA | 300xAuto | Imágenes adjuntas en mensajes |

---

## 10. DATOS PRECARGADOS: PROYECTO DEMO DOMENECH

El script de seed (`supabase/migrations/00004_seed_domenech.sql`) debe insertar TODO el contenido de los dos archivos proporcionados:

### De `DOMENECH_VIDEO_v3_con_referencias.md`:
- **7 imágenes de referencia** (REF-EXT, REF-PELUCAS, REF-ESTILISMO, REF-JOSÉ, REF-CONCHI, REF-NEREA, REF-RAÚL)
- **9 escenas principales** (E1-E9) con prompts de imagen completos
- **4 escenas de relleno** (R1-R4) con prompts
- **7 escenas de vídeo** (V6, V7, V7B, V7C, V7D, V8, V9) con prompts
- **Tabla de referencia** de qué imagen subir en cada escena
- **Instrucciones de uso** para Grok Aurora

### De `domenech_storyboard_profesional.html`:
- **4 escenas mejoradas** (E1, E2, E3, E5, E8) con mejoras y adiciones al prompt
- **12 escenas nuevas** (N1-N12) con prompts completos y notas de dirección
- **Arco narrativo** de 6 fases con tiempos
- **Timeline** de montaje de 15 entradas con tiempos exactos (0:00-1:25)
- **Diagnóstico** con 3 strengths, 3 warnings, 3 suggestions
- **4 fichas de personaje** completas con skills y reglas de consistencia

**TOTAL: 28 escenas** (9 principales + 4 relleno + 12 nuevas + 3 extras de vídeo)

---

## 11. OPERACIONES CRUD — QUÉ SE PUEDE CREAR, EDITAR Y ELIMINAR

| Entidad | Crear | Leer | Editar | Eliminar | Generar con IA |
|---------|-------|------|--------|----------|---------------|
| Proyecto | ✅ Manual o IA | ✅ | ✅ Todos los campos | ✅ Con confirmación | ✅ Wizard completo |
| Escena | ✅ Manual o IA | ✅ | ✅ Prompts, metadata, imagen | ✅ | ✅ Prompt, mejoras, imagen |
| Personaje | ✅ Manual o IA | ✅ | ✅ Todo + subir imagen | ✅ | ✅ Ficha + snippet |
| Fondo | ✅ Manual o IA | ✅ | ✅ Todo + subir imagen | ✅ | ✅ Snippet |
| Arco narrativo | ✅ (autogen) | ✅ | ✅ Fases y escenas | ✅ | ✅ Regenerar |
| Timeline | ✅ Manual o IA | ✅ | ✅ Reordenar, editar | ✅ | ✅ Regenerar |
| Issues | ✅ (autogen) | ✅ | ✅ Resolver, notas | ✅ | ✅ Regenerar análisis |
| API Keys | ✅ El usuario | ✅ Propias | ✅ Activar/desactivar, budget | ✅ | — |
| Uso IA | — | ✅ Propias (admin: todas) | — | — | — |
| Usuarios | — | ✅ Admin | ✅ Admin cambia rol | — | — |

---

## 12. INSTRUCCIONES DE EJECUCIÓN PARA CLAUDE CODE

### FASE 0: Preparación (ANTES de escribir código)

**0.1 — Crear skills y docs**
```
Crear la carpeta .claude/ con CLAUDE.md, settings.json y todos los SKILL_*.md
Crear la carpeta docs/ con la estructura completa de documentación
Cada skill debe contener las mejores prácticas y patrones de la tecnología
```

**0.2 — Configurar MCP de Supabase**
```
Verificar que el MCP de Supabase está configurado en .claude/settings.json
Usarlo para: crear tablas, verificar schema, ejecutar migraciones, seed data
```

**0.3 — Crear seed-data JSONs en docs/**
```
Extraer TODOS los datos del proyecto Domenech de los archivos fuente
y guardarlos como JSON estructurados en docs/seed-data/
Estos JSONs servirán como fuente de verdad para el seed SQL
```

### FASE 1: Scaffolding
```bash
npx create-next-app@latest kiyoko-studio --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd kiyoko-studio

# Core
npm install @supabase/supabase-js @supabase/ssr zustand @tabler/icons-react
npm install framer-motion react-hook-form @hookform/resolvers zod
npm install sonner date-fns clsx tailwind-merge

# Multi-AI providers
npm install @anthropic-ai/sdk @google/generative-ai openai groq-sdk

# Editor y UI
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-markdown remark-gfm shiki react-dropzone
```
Crear estructura de carpetas completa según sección 4.
Crear `.env.example` con todos los campos de la sección 6.
Actualizar `docs/SETUP.md` con instrucciones de instalación.

### FASE 2: Tailwind v4 + Tema + Componentes UI
Configurar `globals.css` con `@theme` según sección 2.
Crear TODOS los componentes UI base (Button, Card, Badge, Input, Dialog, Tabs, etc.).
Crear componentes layout (Sidebar, Header, Breadcrumbs, MobileNav, ThemeToggle).
Actualizar `docs/COMPONENTS.md`.

### FASE 3: Base de Datos con MCP Supabase
Usar MCP Supabase para:
- Ejecutar schema SQL completo (sección 3 + tablas multi-IA de sección 2.1)
- Aplicar RLS policies
- Crear Storage buckets
- Verificar que todo está correcto con queries de comprobación
- Generar tipos TypeScript con `supabase gen types`
Actualizar `docs/DATABASE.md` con ERD y relaciones.

### FASE 4: Auth + Roles + Middleware
Login, register, pending, blocked, forgot-password.
Middleware de protección de rutas.
Trigger auto-perfil con role check.
Panel admin de usuarios.
Actualizar `docs/AUTH_AND_ROLES.md`.

### FASE 5: Sistema Multi-IA (Router + Providers + API Keys)
Implementar el AI Router con fallback chain (sección 2.1).
Crear adapters para: Gemini, Claude, OpenAI, Groq, Stability.
Implementar cifrado de API keys (crypto.ts).
Crear API routes: `/api/ai/providers/status`, `/api/user/api-keys/*`, `/api/user/usage`.
Crear página `/settings/api-keys` para gestión de keys.
Crear tablas `user_api_keys` y `ai_usage_logs` en Supabase.
Actualizar `docs/AI_PROVIDERS.md`.

### FASE 6: CRUD de Proyectos
Dashboard con grid de cards, filtros, búsqueda.
Overview del proyecto con stats y cover image.
Settings del proyecto.
Formularios con React Hook Form + Zod.
Actualizar `docs/PAGES_AND_ROUTES.md`.

### FASE 7: Todas las Pestañas del Proyecto
Implementar CADA pestaña según los wireframes de sección 5:
- `/p/[slug]/analysis` → Diagnóstico con métricas e issues
- `/p/[slug]/arc` → Arco narrativo con barra visual y fases
- `/p/[slug]/scenes` → Escenas con filtros, expand/collapse, prompts copiables
- `/p/[slug]/scenes/[sceneId]` → Detalle individual de escena
- `/p/[slug]/characters` → Grid de personajes con imágenes y snippets
- `/p/[slug]/backgrounds` → Grid de fondos
- `/p/[slug]/timeline` → Timeline con drag & drop y versiones
- `/p/[slug]/references` → Tabla de qué imagen subir dónde
- `/p/[slug]/chat` → Chat IA con contexto del proyecto
- `/p/[slug]/exports` → Panel de exportación
Actualizar `docs/PAGES_AND_ROUTES.md` y `docs/COMPONENTS.md`.

### FASE 8: Escenas en Detalle (la parte más importante)
SceneCard con expand/collapse.
Prompts con syntax highlight (Shiki) y botón copiar.
Upload de imágenes generadas con dropzone.
Galería de imágenes: generada + referencia lado a lado.
Filtros por tipo, fase, fondo, personaje.
Drag & drop para reordenar.
SceneCreateDialog para crear escena manual.
Actualizar `docs/COMPONENTS.md`.

### FASE 9: Integración IA Completa
API routes para: generate-project, generate-scenes, generate-image, improve-prompt, analyze-project, generate-timeline, chat.
TODAS las rutas usan el AI Router (NUNCA llamar SDKs directamente).
System prompts completos en `lib/ai/prompts/`.
Wizard de nuevo proyecto con chat step-by-step (5 pasos).
Chat IA dentro de cada proyecto con streaming.
Botones "Mejorar con IA" y "Regenerar" en escenas, análisis, timeline.
Generación de imágenes con Gemini/DALL-E según provider disponible.
Actualizar `docs/AI_PROMPTS.md` y `docs/API_ROUTES.md`.

### FASE 10: Exportaciones
Generador de HTML autocontenido (como el de Domenech).
Exportador JSON completo.
Exportador Markdown con prompts en bloques de código.
Exportador PDF.
Preview antes de descargar.
Historial de exportaciones.
Actualizar `docs/EXPORT_FORMATS.md`.

### FASE 11: Seed del Proyecto Demo Domenech
Script SQL (o script TS que use MCP) con TODOS los datos:
- 28 escenas con prompts completos extraídos de los archivos fuente
- 4 personajes con fichas y prompt snippets
- 3 fondos con descripciones y prompt snippets
- 6 fases del arco narrativo
- 15 entradas de timeline con tiempos exactos
- 9 issues de diagnóstico
- Tabla de referencia completa
Verificar que el proyecto demo se renderiza correctamente en TODAS las pestañas.
Actualizar `docs/DEMO_DOMENECH.md`.

### FASE 12: Pulido Final
Responsive design completo (mobile-first).
Dark mode / Light mode / System con ThemeToggle.
Animaciones con Framer Motion (page transitions, layout).
Loading states y skeletons en TODAS las páginas.
Error handling con toasts (Sonner).
Empty states con ilustración cuando no hay datos.
Sidebar colapsable en mobile.
SEO y meta tags.
Actualizar `docs/DEPLOYMENT.md` y `docs/CHANGELOG.md`.

---

## 13. CRITERIOS DE ACEPTACIÓN COMPLETOS

### Docs y Skills
- [ ] Carpeta `.claude/` con CLAUDE.md, settings.json y 12 SKILL_*.md
- [ ] Carpeta `docs/` con 15 archivos .md + seed-data/ con 7 JSONs
- [ ] Cada doc actualizado con el contenido real implementado
- [ ] MCP de Supabase configurado y funcional en settings.json

### Auth y Acceso
- [ ] Login con email + password funcional
- [ ] Solo ADMIN_EMAIL tiene acceso inmediato como admin
- [ ] Nuevos usuarios ven `/pending` hasta aprobación
- [ ] Admin puede aprobar/bloquear desde `/admin/users`
- [ ] Usuarios bloqueados ven `/blocked`
- [ ] Middleware protege todas las rutas

### Sistema Multi-IA
- [ ] Gemini (gratis) funciona como provider por defecto de texto
- [ ] Gemini Imagen (gratis) funciona para generar imágenes
- [ ] Groq (gratis) funciona como fallback de texto
- [ ] Si el usuario añade API key de Claude → se usa primero para texto
- [ ] Si el usuario añade API key de OpenAI → se usa DALL-E para imágenes
- [ ] Fallback automático cuando un provider se queda sin quota
- [ ] API keys cifradas en la DB (AES-256-GCM)
- [ ] Página `/settings/api-keys` funcional: añadir, editar, eliminar, testear keys
- [ ] Dashboard de uso mensual por provider con costes
- [ ] Orden de prioridad personalizable por el usuario
- [ ] Rate limiting per-user per-provider funcional
- [ ] Log de uso en `ai_usage_logs` para cada request

### Dashboard
- [ ] Grid de proyectos con cover images, stats, progreso
- [ ] Filtros y búsqueda funcionan
- [ ] Botón "Nuevo Proyecto" lleva al wizard

### Wizard IA
- [ ] Chat paso a paso funcional (5 pasos)
- [ ] La IA pregunta y genera según las respuestas
- [ ] Usa el AI Router (nunca SDK directo) → funciona con provider gratis
- [ ] Se pueden subir imágenes de referencia durante el wizard
- [ ] Al finalizar se guarda todo en Supabase
- [ ] Redirect al proyecto creado

### Proyecto — Todas las pestañas
- [ ] Overview con stats, cover, info, últimas escenas
- [ ] Diagnóstico con métricas, issues (strength/warning/suggestion)
- [ ] Arco narrativo con barra visual + fases expandibles
- [ ] Escenas con filtros, expand/collapse, prompts copiables, imágenes
- [ ] Personajes con imagen de referencia visible, prompt snippet copiable
- [ ] Fondos con imagen visible, snippet copiable
- [ ] Timeline con entries, versiones, drag reorder
- [ ] Referencias con tabla completa y instrucciones
- [ ] Chat IA funcional con contexto del proyecto (usa AI Router)
- [ ] Exportar a HTML/JSON/Markdown/PDF con descarga

### Escenas (detalle)
- [ ] Cada escena muestra: imagen generada (si hay), imagen referencia, mejoras, prompt imagen, prompt vídeo
- [ ] Prompts con syntax highlight y botón copiar
- [ ] Botón "Mejorar con IA" funcional (usa AI Router → provider disponible)
- [ ] Botón "Generar imagen" funcional (usa Gemini gratis o DALL-E si hay key)
- [ ] Se pueden subir imágenes generadas manualmente
- [ ] Se pueden editar todos los campos
- [ ] Drag & drop para reordenar

### Imágenes
- [ ] Upload de imágenes funcional (dropzone)
- [ ] Generación de imágenes integrada (Gemini gratis por defecto)
- [ ] Imágenes se ven en: cards, detalle, galería
- [ ] Lightbox al hacer click en imagen grande
- [ ] Thumbnails generados para performance

### Proyecto Demo
- [ ] Domenech aparece como proyecto precargado con badge "DEMO"
- [ ] Todas las 28 escenas con prompts completos
- [ ] 4 personajes con fichas completas
- [ ] 3 fondos con descripciones
- [ ] Arco narrativo de 6 fases
- [ ] Timeline de 15 entradas
- [ ] Diagnóstico con 9 issues

### UI/UX
- [ ] Responsive en móvil y tablet
- [ ] Dark mode / Light mode / System
- [ ] Animaciones de transición con Framer Motion
- [ ] Loading states y skeletons en todas las páginas
- [ ] Error handling con toasts
- [ ] Empty states con ilustración cuando no hay datos
- [ ] Sidebar colapsable en mobile

### Documentación
- [ ] `docs/README.md` con índice completo
- [ ] `docs/SETUP.md` permite montar el proyecto desde cero
- [ ] `docs/DATABASE.md` con ERD y schema actual
- [ ] `docs/AI_PROVIDERS.md` con diagrama del router y todos los providers
- [ ] `docs/PAGES_AND_ROUTES.md` con mapa completo de rutas
- [ ] `docs/API_ROUTES.md` con todos los endpoints documentados
- [ ] `docs/CHANGELOG.md` actualizado con cada fase completada
- [ ] Seed data JSONs completos en `docs/seed-data/`

---

*Kiyoko AI — Storyboard Production Studio · Especificación v3.0 · 17 marzo 2026*
