---
name: create-component
description: Cuando necesites crear un componente React nuevo. Decide si es Server o Client Component según la interactividad necesaria.
allowed-tools: Read, Write
---

# Skill: Create Component

## Decisión: Server o Client

```
¿El componente necesita useState, useEffect, onClick,
onChange, useQuery, useMutation, drag&drop, timers,
o cualquier API del browser?
  │
  ├── NO → Server Component (sin "use client")
  │         Solo renderiza datos recibidos como props.
  │         Puede ser async y hacer fetch.
  │
  └── SÍ → Client Component ("use client" arriba)
            Mínimo JS posible. Empujar interactividad
            al componente más pequeño posible.
```

## Estructura de archivos

```
src/components/
├── video/              # Componentes de vídeo
│   ├── VideoCard.tsx         # Server — solo renderiza props
│   ├── VideoGrid.tsx         # Server — lista de VideoCards
│   ├── VideoView.tsx         # Client — useQuery + interactividad
│   └── VideoCreateModal.tsx  # Client — form con estado
```

## Plantilla Server Component

```tsx
// src/components/video/VideoCard.tsx
// NO tiene "use client" → es Server Component

import Image from 'next/image';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Video } from '@/types/video';

interface VideoCardProps {
  video: Video;
  projectShortId: string;
}

export function VideoCard({ video, projectShortId }: VideoCardProps) {
  return (
    <Link
      href={`/project/${projectShortId}/video/${video.short_id}`}
      className="group block rounded-lg border border-border bg-surface-card hover:bg-surface-hover transition-colors"
    >
      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-surface">
        {video.thumbnail_url && (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm truncate">{video.title}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={video.status} />
          <span className="text-xs text-muted-foreground">{video.target_duration_seconds}s</span>
        </div>
      </div>
    </Link>
  );
}
```

## Plantilla Client Component

```tsx
// src/components/video/VideoView.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideoWithScenes } from '@/lib/queries/videos';

interface VideoViewProps {
  videoShortId: string;
}

export function VideoView({ videoShortId }: VideoViewProps) {
  const supabase = createBrowserClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.videos.detail(videoShortId),
    queryFn: () => fetchVideoWithScenes(supabase, videoShortId),
  });

  if (isLoading) return <VideoSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Contenido interactivo */}
    </div>
  );
}
```

## Gotchas

- Un Server Component PUEDE importar un Client Component como hijo.
- Un Client Component NO puede importar un Server Component (pero puede recibirlo como `children`).
- Si solo necesitas un `<Link>` o un `<Image>`, NO es razón para `"use client"`. Ambos funcionan en Server Components.
- Props de Client Components deben ser serializables (no funciones, no clases).
