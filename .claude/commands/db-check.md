---
description: Verificar estado de la base de datos. Comprobar tablas existentes, RLS, indices y diferencias con el schema v4 esperado.
allowed-tools: mcp__supabase, Read
agent: db-architect
context: fork
---

## Tarea

Verificar que la base de datos Supabase coincide con el schema v4 definido en la documentación.

## Pasos

1. Ejecutar vía MCP: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
2. Comparar con las 46 tablas esperadas en `docs/new_implementacion/db_schema_v4_additions.md`.
3. Verificar RLS: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;`
4. Verificar enums: `SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;`
5. Reportar qué falta, qué sobra, y qué no tiene RLS.
