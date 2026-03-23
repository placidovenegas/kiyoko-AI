---
name: fix-error
description: Cuando hay un error de build, runtime, TypeScript, o Supabase que necesita diagnóstico y fix.
allowed-tools: Read, Write, Bash(npm:*), Bash(npx:*), mcp__supabase
---

# Skill: Fix Error

## Diagnóstico rápido

### Error de tipos TypeScript

1. ¿Los tipos de Supabase están desactualizados?
   → Ejecutar: `npx supabase gen types typescript --linked > src/types/database.types.ts`
2. ¿Falta un tipo en `src/types/`?
   → Verificar que existe y está re-exportado desde `src/types/index.ts`

### Error "use client" / Server Component

- `useState`/`useEffect` en Server Component → Añadir `"use client"` o mover a componente hijo.
- `async` en Client Component → Los Client Components NO pueden ser async. Mover fetch al page.tsx padre.
- `cookies()`/`headers()` en Client Component → Solo disponible en Server Components.

### Error de Supabase RLS

- Query devuelve vacío pero hay datos → Falta policy RLS. Verificar con MCP.
- "permission denied for table X" → RLS habilitado pero sin policies. Crear policy.

### Error de TanStack Query

- "No QueryClient set" → Falta `QueryProvider` en el layout padre. Verificar `src/app/layout.tsx`.
- "Hydration mismatch" → El prefetch del servidor no coincide con la query del cliente. Verificar que `queryKey` y `queryFn` son idénticos en ambos lados.
- Datos undefined tras prefetch → El `staleTime` es 0 y se refetcheó antes de hidratar. Subir a 30s mínimo.

### Error de Next.js 15 params

- `params.shortId` es undefined → En Next.js 15, params es `Promise`. Usar `const { shortId } = await params;`
