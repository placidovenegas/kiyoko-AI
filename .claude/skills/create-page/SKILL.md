---
name: create-page
description: Cuando necesites crear una nueva página (ruta) en la app Next.js. Incluye page.tsx, loading.tsx, error.tsx y opcionalmente layout.tsx.
---

# Skill: Create Page

## Estructura de archivos por ruta

Cada ruta nueva DEBE crear estos archivos:

```
src/app/(dashboard)/[...ruta]/
├── page.tsx          # Server Component async (OBLIGATORIO)
├── loading.tsx       # Skeleton de carga (OBLIGATORIO)
├── error.tsx         # Error boundary (OBLIGATORIO)
└── layout.tsx        # Solo si la ruta necesita contexto compartido (OPCIONAL)
```

## Plantilla page.tsx (Server Component)

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { createServerClient } from '@/lib/supabase/server';
import { queryKeys } from '@/lib/query/keys';
import { NombreView } from '@/components/nombre/NombreView';
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  return { title: 'Título | Kiyoko AI' };
}

export default async function NombrePage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const supabase = await createServerClient();
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.recurso.detail(shortId),
    queryFn: async () => {
      const { data, error } = await supabase.from('tabla').select('*').eq('short_id', shortId).single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NombreView shortId={shortId} />
    </HydrationBoundary>
  );
}
```

## Plantilla loading.tsx

```tsx
export default function NombreLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-8 w-64 bg-surface-hover rounded" />
      <div className="h-4 w-96 bg-surface-hover rounded" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-surface-hover rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

## Plantilla error.tsx

```tsx
'use client';

export default function NombreError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-lg font-medium">Error al cargar</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-kiyoko-teal text-white rounded-lg hover:bg-kiyoko-teal/90">
        Reintentar
      </button>
    </div>
  );
}
```

## Gotchas

- `params` en Next.js 15 es una `Promise`. Siempre hacer `const { shortId } = await params;`
- El `QueryClient` en page.tsx se crea nuevo cada vez (server). No reutilizar.
- NUNCA importar componentes con `"use client"` que usen hooks de browser en page.tsx directamente. Envolver en `<HydrationBoundary>`.
