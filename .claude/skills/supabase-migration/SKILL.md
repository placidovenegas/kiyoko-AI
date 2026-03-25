---
name: supabase-migration
description: Cuando necesites crear, modificar o borrar tablas, enums, indices, RLS policies o seeds en Supabase. También para ejecutar SQL vía MCP.
---

# Skill: Supabase Migration

## Antes de empezar

1. Lee `docs/new_implementacion/db_redesign_v3.md` para las definiciones de tablas.
2. Lee `docs/new_implementacion/db_schema_v4_additions.md` para tablas v4 adicionales.
3. Si hay un seed de referencia, lee `docs/new_implementacion/00004_seed_domenech_v4.sql`.

## Orden de operaciones

1. **Enums primero** — `CREATE TYPE ... AS ENUM` antes de cualquier tabla que los use.
2. **Tablas padres antes que hijas** — profiles → organizations → projects → videos → scenes.
3. **Índices después de tablas** — `CREATE INDEX` una vez que la tabla existe.
4. **RLS después de tablas** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies.
5. **Seeds al final** — después de que todo el schema exista.

## Patrones RLS para Kiyoko

```sql
-- Helper function reutilizable (crear una vez)
CREATE OR REPLACE FUNCTION has_project_access(p_project_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM project_shares WHERE project_id = p_project_id AND shared_with_user = auth.uid()
  );
$$;

-- Patrón owner: usar (select auth.uid()) NO auth.uid()
CREATE POLICY "select" ON tabla FOR SELECT TO authenticated
USING (owner_id = (select auth.uid()));

-- Patrón project child: usar helper function
CREATE POLICY "select" ON tabla FOR SELECT TO authenticated
USING ((select has_project_access(project_id)));
```

## Tras finalizar

Ejecutar: `npx supabase gen types typescript --linked > src/types/database.types.ts`
