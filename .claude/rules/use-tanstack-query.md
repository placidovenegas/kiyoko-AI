---
description: Usar TanStack Query en vez de useState+useEffect para datos del servidor
globs: ["src/hooks/**/*.ts", "src/hooks/**/*.tsx", "src/components/**/*.tsx"]
---

Para fetch de datos del servidor, SIEMPRE usar `useQuery` de TanStack Query.

NUNCA este patrón:
```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { fetch(...).then(setData).finally(() => setLoading(false)); }, []);
```

SIEMPRE este patrón:
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.recurso.detail(id),
  queryFn: () => fetchRecurso(supabase, id),
});
```

Para mutaciones, usar `useMutation` con optimistic updates.
Query keys SIEMPRE de `src/lib/query/keys.ts`.
