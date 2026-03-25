# Providers y Router (V6) — unificar para eliminar duplicación

En el repo conviven **dos sistemas** de routing de proveedores:
1. `src/lib/ai/sdk-router.ts` (nuevo, basado en `@ai-sdk/*`, cooldowns + fallback chain `TEXT_CHAIN`)
2. `src/lib/ai/router.ts` (antiguo, funciones `getAvailableProvider`, `generateTextWithFallback`, etc.)

## 1) Cómo usa el chat el sistema nuevo
- Endpoint: `src/app/api/ai/chat/route.ts`
  - Importa:
    - `getAllAvailableModels`, `markProviderFailed`, `createModelWithKey`, `TEXT_CHAIN`
    - y resuelve modelos con cadena + priorización de vision si hay imágenes.
  - Además:
    - lee keys del usuario desde `user_api_keys`
    - y aplica cooldowns deshabilitando providers que fallan.

## 2) Cómo usa generate-image el sistema antiguo
- Endpoint: `src/app/api/ai/generate-image/route.ts`
  - Importa `getAvailableProvider, logUsage` desde `src/lib/ai/router.ts`.
  - No usa `sdk-router.ts`.

Implicación:
- el comportamiento de fallback, cooldown y logging no es consistente entre “chat” y “generación de imagen”.

## 3) Objetivo V6
- Estandarizar TODO el sistema en `sdk-router.ts` para:
  - logging consistente en `ai_usage_logs`,
  - fallback con la misma lógica (y cooldown),
  - y reglas uniformes de “qué modelo” para cada modalidad (`text` vs `image`).

## 4) Resumen de decisiones que debe fijar V6
1. Un solo “entry point” para resolver proveedor/modelo por tarea.
2. Definir una taxonomía de tasks (chat, vision, generate-image, generate-narration, etc.).
3. Asegurar que cada endpoint:
   - registra `ai_usage_logs`,
   - marca cooldown en errores,
   - y respeta la preferencia del usuario cuando aplica.

