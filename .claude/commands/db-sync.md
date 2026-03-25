---
description: Verificar sincronización entre schema de Supabase y tipos TypeScript. Detectar tablas sin tipos y tipos sin tablas.
allowed-tools: mcp__supabase, Read, Grep, Bash(npx supabase:*)
agent: db-architect
context: fork
---

## Tarea

Verificar que los tipos TypeScript en `src/types/database.types.ts` están sincronizados con el schema real de Supabase.

## Pasos

1. Obtener tablas actuales de Supabase:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

2. Leer `src/types/database.types.ts` y extraer las interfaces de tablas definidas.

3. Comparar:
   - Tablas en DB que NO están en los tipos → tipos desactualizados
   - Tipos que NO están en la DB → tipos sobrantes (tabla borrada)

4. Verificar enums:
```sql
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;
```

5. Verificar RLS habilitado:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;
```

6. Si hay diferencias, sugerir regenerar tipos:
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

## Output

Reporte con:
- Tablas sincronizadas: X/Y
- Tablas sin tipos: [lista]
- Tipos sin tabla: [lista]
- Enums: X definidos
- RLS: X tablas sin protección
- Acción recomendada: regenerar tipos si hay diferencias
