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

## Estructura del proyecto
- `src/app/` — Next.js App Router pages y API routes
- `src/components/` — Componentes React organizados por dominio
- `src/lib/` — Lógica de negocio (supabase, ai, export, utils)
- `src/stores/` — Zustand stores
- `src/hooks/` — Custom hooks
- `src/types/` — TypeScript types e interfaces

## MCP Servers disponibles
- Supabase MCP: para consultar schema, ejecutar queries, gestionar auth

## Documentación del proyecto
Toda la documentación informativa está en `/docs`. Consultarla antes de implementar.
Plan de implementación en `/docs/implementation/`.
