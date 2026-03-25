---
name: create-hook
description: Cuando necesites crear un custom hook para fetch (useQuery), mutaciones (useMutation) o suscripciones realtime con Supabase.
---

# Skill: Create Hook

## Tipos de hooks en Kiyoko

### Hook de lectura (useQuery wrapper)

```tsx
// src/hooks/useNombreRecurso.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';

export function useNombreRecurso(parentId: string) {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: queryKeys.recurso.byParent(parentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabla')
        .select('*')
        .eq('parent_id', parentId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!parentId,  // No ejecutar si no hay ID
  });
}
```

### Hook de mutación con optimistic update

```tsx
// src/hooks/useUpdateNombreRecurso.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';

export function useUpdateNombreRecurso() {
  const supabase = createBrowserClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Recurso> }) => {
      const { error } = await supabase.from('tabla').update(data).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, data }) => {
      const key = queryKeys.recurso.byParent(parentId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old: any[]) =>
        old?.map(item => item.id === id ? { ...item, ...data } : item)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.recurso.byParent(parentId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurso.byParent(parentId) });
    },
  });
}
```

### Hook de creación

```tsx
export function useCreateNombreRecurso(parentId: string) {
  const supabase = createBrowserClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewRecurso) => {
      const { data: created, error } = await supabase
        .from('tabla')
        .insert({ ...data, parent_id: parentId })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurso.byParent(parentId) });
    },
  });
}
```

### Hook de eliminación con optimistic

```tsx
export function useDeleteNombreRecurso(parentId: string) {
  const supabase = createBrowserClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabla').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const key = queryKeys.recurso.byParent(parentId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old: any[]) => old?.filter(item => item.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.recurso.byParent(parentId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurso.byParent(parentId) });
    },
  });
}
```

## Gotchas

- Siempre importar query keys de `@/lib/query/keys.ts`, no hardcodear strings.
- `enabled: !!parentId` para evitar queries con undefined.
- En optimistic updates, siempre guardar `prev` para rollback en `onError`.
- `onSettled` (no `onSuccess`) para invalidar: se ejecuta tanto en éxito como en error.
