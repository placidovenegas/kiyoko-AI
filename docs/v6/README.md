# Kiyoko AI — Documentación Definitiva (V6)

Este directorio contiene la **documentación oficial** del sistema Kiyoko AI para tu repo actual.

## Alcance y “fuente de verdad”
1. `docs/new/` se considera material **no oficial** para V6 (borradores/propuestas). En V6, `docs/new/` se usa solo como referencia histórica si hace falta.
2. V6 está alineado a:
   - el **código actual** (chat, parsing de bloques, acción/ejecución),
   - el **schema real** de Supabase (consultado por MCP y reflejado en `src/types/database.types.ts`).
3. El sistema IA ↔ Frontend implementa un “contrato de bloques” dentro del texto del modelo (tags tipo `[ACTION_PLAN]...[/ACTION_PLAN]`), parseado por el parser de `src/lib/ai/parse-ai-message.ts` y renderizado en UI.

## Convención de carpetas
- `docs/v6/DB/*`: canon de tablas (columnas clave), y cómo se usan dentro del pipeline.
- `docs/v6/IA/*`: contrato de prompts y bloques, multimodal, calidad y providers.
- `docs/v6/UX/*`: comportamiento del chat (persistencia, streaming SSE, modales/menus).
- `docs/v6/CODE/*`: residuos (duplicación/no uso) y plan de limpieza segura sin romper nada.
- `docs/v6/PAGINAS/*`: auditoría “una a una” para dejar UI/funcionalidad perfecta.

## Cómo se mantiene V6 (reglas anti-regresión)
1. Antes de cambiar el contrato IA:
   - actualizar `parse-ai-message`,
   - actualizar `system-prompt`,
   - actualizar el renderer de UI que consume bloques,
   - y solo después ajustar el executor.
2. Si una tabla o campo no existe en Supabase:
   - se marca como **inaplicable**,
   - o se propone migración explícita (pero no se asume).

## Punto de entrada recomendado
- Empieza por `INDEX.md`.

