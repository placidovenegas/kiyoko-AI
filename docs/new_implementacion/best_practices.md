# Kiyoko AI — Guía Definitiva: Next.js 15 + Supabase + TanStack Query

> Todo lo que necesita un desarrollador para trabajar en este proyecto.
> Copia a `docs/new_implementacion/best_practices.md`

---

## Instalación

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## 1. Arquitectura de datos: Quién hace qué

```
┌────────────────────────────────────────────────────────────────────┐
│                        CARGA INICIAL                               │
│                                                                    │
│  page.tsx (Server Component async)                                 │
│    └── Supabase server client → fetch datos                       │
│          └── Pasa como props a Client Components                   │
│                └── TanStack Query recibe como initialData          │
│                      └── Gestiona caché, refetch, stale            │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                     INTERACTIVIDAD                                 │
│                                                                    │
│  TanStack Query (Client)                                           │
│    ├── useQuery → leer datos con caché inteligente                │
│    ├── useMutation → crear/editar/borrar con optimistic updates   │
│    ├── invalidateQueries → refrescar tras mutación                │
│    └── refetchOnWindowFocus → datos frescos al volver             │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                     TIEMPO REAL                                    │
│                                                                    │
│  Supabase Realtime (Client)                                        │
│    └── postgres_changes listener                                   │
│          └── queryClient.setQueryData() → actualiza caché TQ      │
│                └── Componentes se re-renderizan automáticamente    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                     ESTADO UI                                      │
│                                                                    │
│  Zustand (Client)                                                  │
│    └── SOLO para estado que NO viene del servidor:                 │
│          tema, sidebar, chatPanel, filtros, presencia              │
└────────────────────────────────────────────────────────────────────┘
```

**Regla fundamental:** TanStack Query REEMPLAZA a Zustand para datos del servidor. Ya no necesitas `useProjectStore` ni `useScenesStore` para guardar datos de Supabase. TanStack Query es tu caché.

---

## 2. Setup de TanStack Query

### Provider

```tsx
// src/lib/query/provider.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
```

### Query Client

```tsx
// src/lib/query/client.ts
import { QueryClient, isServer } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Con SSR, staleTime > 0 evita refetch inmediato en el cliente
        // tras la hidratación. 30s es ideal para Kiyoko.
        staleTime: 30 * 1000,

        // Reintentar 1 vez en error (no 3 que es el default)
        retry: 1,

        // Refetch cuando el usuario vuelve a la pestaña
        refetchOnWindowFocus: true,

        // NO refetch al reconectar (Realtime se encarga)
        refetchOnReconnect: false,

        // Garbage collection: eliminar datos no usados tras 5 min
        gcTime: 5 * 60 * 1000,
      },
      mutations: {
        // Reintentar mutaciones 0 veces (fallar rápido)
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: siempre crear nuevo (evita compartir caché entre requests)
    return makeQueryClient();
  }
  // Browser: reusar el mismo cliente
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
```

### Integrar en Root Layout

```tsx
// src/app/layout.tsx
import { QueryProvider } from '@/lib/query/provider';
import { ThemeProvider } from '@/components/shared/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### DevTools

Los DevTools solo se cargan en desarrollo. Aparecen como un botón flotante abajo-izquierda. Desde ahí puedes:
- Ver todas las queries activas y su estado (fresh/stale/fetching)
- Ver el contenido de la caché
- Invalidar queries manualmente
- Ver mutations en curso
- Inspeccionar tiempos de respuesta

---

## 3. Patrón principal: Server fetch → TanStack Query hydration

### Paso 1: Query functions centralizadas

```tsx
// src/lib/queries/videos.ts
// Estas funciones se usan TANTO en el servidor como en el cliente

import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type SupabaseClient = ReturnType<typeof createBrowserClient>;

export async function fetchVideosByProject(
  supabase: SupabaseClient,
  projectId: string
) {
  const { data, error } = await supabase
    .from('videos')
    .select('*, style_presets(*)')
    .eq('project_id', projectId)
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function fetchVideoWithScenes(
  supabase: SupabaseClient,
  videoShortId: string
) {
  const { data: video, error: vError } = await supabase
    .from('videos')
    .select('*, style_presets(*)')
    .eq('short_id', videoShortId)
    .single();

  if (vError) throw vError;

  const { data: scenes, error: sError } = await supabase
    .from('scenes')
    .select(`
      *,
      scene_camera(*),
      scene_characters(*, characters(*)),
      scene_backgrounds(*, backgrounds(*))
    `)
    .eq('video_id', video.id)
    .order('sort_order');

  if (sError) throw sError;

  return { video, scenes: scenes ?? [] };
}
```

### Paso 2: Server Component prefetch + hydration

```tsx
// src/app/(dashboard)/project/[shortId]/video/[videoShortId]/page.tsx
// SERVER COMPONENT — fetch en el servidor, hidratar TanStack Query

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { createServerClient } from '@/lib/supabase/server';
import { fetchVideoWithScenes } from '@/lib/queries/videos';
import { VideoView } from '@/components/video/VideoView';
import { notFound } from 'next/navigation';

export default async function VideoPage({
  params,
}: {
  params: Promise<{ shortId: string; videoShortId: string }>;
}) {
  const { videoShortId } = await params;
  const supabase = await createServerClient();
  const queryClient = new QueryClient();

  try {
    // Prefetch en el servidor — se cachea en TanStack Query
    await queryClient.prefetchQuery({
      queryKey: ['video', videoShortId],
      queryFn: () => fetchVideoWithScenes(supabase, videoShortId),
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoView videoShortId={videoShortId} />
    </HydrationBoundary>
  );
}
```

### Paso 3: Client Component consume la caché

```tsx
// src/components/video/VideoView.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { fetchVideoWithScenes } from '@/lib/queries/videos';

export function VideoView({ videoShortId }: { videoShortId: string }) {
  const supabase = createBrowserClient();

  // Los datos YA están en caché gracias al prefetch del servidor.
  // useQuery los devuelve instantáneamente sin hacer fetch.
  // Después de 30s (staleTime), hará refetch en background.
  const { data, isLoading, error } = useQuery({
    queryKey: ['video', videoShortId],
    queryFn: () => fetchVideoWithScenes(supabase, videoShortId),
  });

  if (isLoading) return <VideoSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  const { video, scenes } = data;

  return (
    <div>
      <VideoHeader video={video} />
      <SceneBoard scenes={scenes} videoId={video.id} />
    </div>
  );
}
```

**Flujo completo:**
1. Usuario navega a `/project/abc/video/xyz`
2. `page.tsx` (Server) hace fetch y prefetch en QueryClient
3. `HydrationBoundary` serializa la caché y la envía al cliente
4. `VideoView` (Client) llama `useQuery` con la misma key
5. TanStack Query encuentra los datos en caché → render inmediato, 0 fetch
6. Tras 30s, refetch silencioso en background
7. Si hay cambios, re-render automático

---

## 4. Query Keys — Convención para Kiyoko

```tsx
// src/lib/query/keys.ts
// Centralizar todas las keys evita inconsistencias

export const queryKeys = {
  // Proyectos
  projects: {
    all: ['projects'] as const,
    byOrg: (orgId: string) => ['projects', 'org', orgId] as const,
    detail: (shortId: string) => ['projects', shortId] as const,
  },

  // Vídeos
  videos: {
    byProject: (projectId: string) => ['videos', 'project', projectId] as const,
    detail: (shortId: string) => ['video', shortId] as const,
    analysis: (videoId: string) => ['video-analysis', videoId] as const,
    narration: (videoId: string) => ['video-narration', videoId] as const,
  },

  // Escenas
  scenes: {
    byVideo: (videoId: string) => ['scenes', 'video', videoId] as const,
    detail: (sceneShortId: string) => ['scene', sceneShortId] as const,
  },

  // Recursos
  characters: {
    byProject: (projectId: string) => ['characters', 'project', projectId] as const,
    detail: (charId: string) => ['character', charId] as const,
    images: (charId: string) => ['character-images', charId] as const,
  },

  backgrounds: {
    byProject: (projectId: string) => ['backgrounds', 'project', projectId] as const,
  },

  // Tareas
  tasks: {
    byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
    byVideo: (videoId: string) => ['tasks', 'video', videoId] as const,
  },

  // Publicaciones
  publications: {
    byProject: (projectId: string) => ['publications', 'project', projectId] as const,
  },

  // Conversaciones IA
  conversations: {
    byProject: (projectId: string) => ['conversations', 'project', projectId] as const,
  },
};
```

---

## 5. Mutations con Optimistic Updates

### Ejemplo: Actualizar título de escena (se siente instantáneo)

```tsx
// src/hooks/useUpdateScene.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import type { Scene } from '@/types/scene';

export function useUpdateScene(videoShortId: string) {
  const supabase = createBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sceneId, data }: { sceneId: string; data: Partial<Scene> }) => {
      const { error } = await supabase
        .from('scenes')
        .update(data)
        .eq('id', sceneId);
      if (error) throw error;
    },

    // OPTIMISTIC UPDATE: actualiza la UI al instante, antes de que el servidor responda
    onMutate: async ({ sceneId, data }) => {
      // Cancelar queries en curso para evitar sobreescritura
      await queryClient.cancelQueries({ queryKey: queryKeys.videos.detail(videoShortId) });

      // Guardar snapshot para rollback
      const previous = queryClient.getQueryData(queryKeys.videos.detail(videoShortId));

      // Actualizar caché optimistamente
      queryClient.setQueryData(
        queryKeys.videos.detail(videoShortId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            scenes: old.scenes.map((s: Scene) =>
              s.id === sceneId ? { ...s, ...data } : s
            ),
          };
        }
      );

      return { previous };
    },

    // Si falla, rollback al snapshot
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.videos.detail(videoShortId),
          context.previous
        );
      }
    },

    // Siempre refrescar después (por si el optimistic fue incorrecto)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(videoShortId) });
    },
  });
}
```

```tsx
// Uso en componente
'use client';

function SceneTitle({ scene, videoShortId }) {
  const { mutate, isPending } = useUpdateScene(videoShortId);

  return (
    <input
      defaultValue={scene.title}
      onBlur={(e) => mutate({ sceneId: scene.id, data: { title: e.target.value } })}
      className={isPending ? 'opacity-50' : ''}
    />
  );
}
```

### Ejemplo: Crear escena

```tsx
// src/hooks/useCreateScene.ts
export function useCreateScene(videoId: string, videoShortId: string) {
  const supabase = createBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewScene) => {
      const { data: scene, error } = await supabase
        .from('scenes')
        .insert({ ...data, video_id: videoId })
        .select()
        .single();
      if (error) throw error;
      return scene;
    },

    onSuccess: () => {
      // Invalidar para refetch con la nueva escena
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(videoShortId) });
    },
  });
}
```

### Ejemplo: Borrar escena

```tsx
export function useDeleteScene(videoShortId: string) {
  const supabase = createBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sceneId: string) => {
      const { error } = await supabase.from('scenes').delete().eq('id', sceneId);
      if (error) throw error;
    },

    // Optimistic: quitar de la lista al instante
    onMutate: async (sceneId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.videos.detail(videoShortId) });
      const previous = queryClient.getQueryData(queryKeys.videos.detail(videoShortId));

      queryClient.setQueryData(queryKeys.videos.detail(videoShortId), (old: any) => ({
        ...old,
        scenes: old.scenes.filter((s: Scene) => s.id !== sceneId),
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.videos.detail(videoShortId), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(videoShortId) });
    },
  });
}
```

---

## 6. Supabase Realtime → TanStack Query

### El puente: Realtime actualiza la caché de TanStack Query directamente

```tsx
// src/hooks/useRealtimeSync.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';

export function useRealtimeSync(projectId: string) {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  useEffect(() => {
    const channel = supabase
      .channel(`project:${projectId}`)

      // Escenas cambiadas por otro usuario
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        // Actualizar directamente la caché de TanStack Query
        // NO hacer invalidate (evita refetch innecesario)
        queryClient.setQueriesData(
          { queryKey: ['video'] },  // Actualiza CUALQUIER query de vídeo
          (old: any) => {
            if (!old?.scenes) return old;
            return {
              ...old,
              scenes: old.scenes.map((s: any) =>
                s.id === payload.new.id ? { ...s, ...payload.new } : s
              ),
            };
          }
        );
      })

      // Escenas creadas
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        // Para inserts, invalidar es más seguro (necesita datos completos con joins)
        queryClient.invalidateQueries({
          queryKey: queryKeys.scenes.byVideo(payload.new.video_id),
        });
      })

      // Escenas borradas
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        queryClient.setQueriesData(
          { queryKey: ['video'] },
          (old: any) => {
            if (!old?.scenes) return old;
            return {
              ...old,
              scenes: old.scenes.filter((s: any) => s.id !== payload.old.id),
            };
          }
        );
      })

      // Vídeos actualizados
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'videos',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.videos.byProject(projectId),
        });
      })

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, supabase]);
}
```

### Dónde montar el listener

```tsx
// src/app/(dashboard)/project/[shortId]/layout.tsx
import { RealtimeSyncWrapper } from '@/components/shared/RealtimeSyncWrapper';

export default async function ProjectLayout({ children, params }) {
  const { shortId } = await params;
  const project = await getProject(shortId);

  return (
    <ProjectProvider project={project}>
      <RealtimeSyncWrapper projectId={project.id} />
      {children}
    </ProjectProvider>
  );
}
```

```tsx
// src/components/shared/RealtimeSyncWrapper.tsx
'use client';

import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function RealtimeSyncWrapper({ projectId }: { projectId: string }) {
  useRealtimeSync(projectId);
  return null; // No renderiza nada, solo activa el listener
}
```

---

## 7. Supabase — Mejores prácticas

### Tipar TODOS los clientes

```tsx
// src/lib/supabase/client.ts
'use client';

import { createBrowserClient as create } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createBrowserClient() {
  return create<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```tsx
// src/lib/supabase/server.ts
import { createServerClient as create } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export async function createServerClient() {
  const cookieStore = await cookies();

  return create<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar en Server Components (solo funciona en Route Handlers/Server Actions)
          }
        },
      },
    }
  );
}
```

```tsx
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// SOLO para operaciones admin del servidor. Bypasea RLS.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### RLS — Reglas para Kiyoko

```sql
-- PATRÓN BASE: Owner puede todo
-- Usar (select auth.uid()) en vez de auth.uid() para performance (initPlan caching)

-- Proyectos: owner o compartido conmigo
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
USING (
  owner_id = (select auth.uid())
  OR id IN (
    SELECT project_id FROM project_shares
    WHERE shared_with_user = (select auth.uid())
  )
);

CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
USING (owner_id = (select auth.uid()));

CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated
USING (owner_id = (select auth.uid()));

-- Helper function para verificar acceso al proyecto (reutilizable)
CREATE OR REPLACE FUNCTION has_project_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM project_shares WHERE project_id = p_project_id AND shared_with_user = auth.uid()
  );
$$;

-- Tablas hijas: usar la helper function
CREATE POLICY "videos_select" ON videos FOR SELECT TO authenticated
USING ((select has_project_access(project_id)));

CREATE POLICY "scenes_select" ON scenes FOR SELECT TO authenticated
USING ((select has_project_access(project_id)));

-- INDEXAR columnas usadas en RLS (crítico para performance)
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_project_shares_user ON project_shares(shared_with_user);
CREATE INDEX idx_videos_project ON videos(project_id);
CREATE INDEX idx_scenes_project ON scenes(project_id);
```

### Supabase Realtime — Qué tablas publicar

```sql
-- Solo publicar tablas que necesitan tiempo real
-- NO publicar tablas de logs, billing, feedback

ALTER PUBLICATION supabase_realtime ADD TABLE scenes;
ALTER PUBLICATION supabase_realtime ADD TABLE videos;
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE backgrounds;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_updates;
-- NO añadir: activity_log, ai_usage_logs, billing_events, etc.
```

### Supabase Storage — Políticas

```sql
-- Bucket kiyoko-storage: solo usuarios autenticados
CREATE POLICY "auth_users_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kiyoko-storage');

CREATE POLICY "auth_users_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kiyoko-storage');

-- Archivos compartidos: acceso público con token
CREATE POLICY "public_share_read" ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'kiyoko-storage'
  AND (storage.foldername(name))[1] = 'shared'
);
```

---

## 8. Next.js 15 — Server Components y archivos especiales

### Regla: page.tsx y layout.tsx SIEMPRE Server Component

```tsx
// ✅ page.tsx es async Server Component
export default async function VideoPage({ params }) {
  const data = await fetchVideoWithScenes(params.videoShortId);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoView videoShortId={params.videoShortId} />
    </HydrationBoundary>
  );
}

// ❌ NUNCA poner "use client" en page.tsx
'use client'; // ← PROHIBIDO en page.tsx
```

### loading.tsx en CADA ruta (skeletons automáticos)

```tsx
// app/(dashboard)/project/[shortId]/video/[videoShortId]/loading.tsx
export default function VideoLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-8 w-64 bg-surface-hover rounded" />
      <div className="h-10 w-full bg-surface-hover rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 bg-surface-hover rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

### error.tsx en CADA ruta

```tsx
// app/(dashboard)/project/[shortId]/video/[videoShortId]/error.tsx
'use client';

export default function VideoError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-lg font-medium">Error al cargar el vídeo</p>
      <p className="text-text-muted text-sm">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-kiyoko-teal text-white rounded-lg">
        Reintentar
      </button>
    </div>
  );
}
```

### Streaming con Suspense

```tsx
// Cargar secciones pesadas sin bloquear la página
import { Suspense } from 'react';

export default async function VideoPage({ params }) {
  return (
    <div>
      {/* Se renderiza inmediatamente */}
      <VideoHeaderServer videoShortId={params.videoShortId} />

      {/* Se streamea cuando esté listo */}
      <Suspense fallback={<SceneGridSkeleton />}>
        <SceneGridServer videoShortId={params.videoShortId} />
      </Suspense>

      <Suspense fallback={<AnalysisSkeleton />}>
        <VideoAnalysisServer videoShortId={params.videoShortId} />
      </Suspense>
    </div>
  );
}
```

### Metadata dinámica

```tsx
// En cada page.tsx que necesite SEO
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data: video } = await supabase
    .from('videos')
    .select('title')
    .eq('short_id', params.videoShortId)
    .single();

  return {
    title: `${video?.title ?? 'Vídeo'} | Kiyoko AI`,
  };
}
```

---

## 9. Zustand — Solo para estado de UI (NO datos del servidor)

### Lo que va en Zustand

```tsx
// src/stores/useUIStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  chatPanelOpen: boolean;
  chatPanelWidth: number;
  chatExpanded: boolean;
  scenesView: 'grid' | 'list' | 'timeline';

  setTheme: (t: UIStore['theme']) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setChatWidth: (w: number) => void;
  expandChat: () => void;
  collapseChat: () => void;
  setScenesView: (v: UIStore['scenesView']) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      chatPanelOpen: false,
      chatPanelWidth: 380,
      chatExpanded: false,
      scenesView: 'grid',

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleChat: () => set((s) => ({ chatPanelOpen: !s.chatPanelOpen, chatExpanded: false })),
      setChatWidth: (chatPanelWidth) => set({ chatPanelWidth }),
      expandChat: () => set({ chatExpanded: true, chatPanelOpen: false }),
      collapseChat: () => set({ chatExpanded: false, chatPanelOpen: true }),
      setScenesView: (scenesView) => set({ scenesView }),
    }),
    {
      name: 'kiyoko-ui',
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        chatPanelWidth: s.chatPanelWidth,
        scenesView: s.scenesView,
      }),
    }
  )
);
```

### Lo que NO va en Zustand (ahora va en TanStack Query)

```
ANTES (Zustand)                           AHORA (TanStack Query)
──────────────────────────────            ──────────────────────────────
useProjectStore.project                   useQuery({ queryKey: ['projects', shortId] })
useProjectStore.scenes                    useQuery({ queryKey: ['video', shortId] })
useProjectStore.characters                useQuery({ queryKey: ['characters', projectId] })
useActiveVideoStore.video                 useQuery({ queryKey: ['video', videoShortId] })
useScenesStore.scenes                     Incluido en query del vídeo
useNarrationStore.narration               useQuery({ queryKey: ['video-narration', videoId] })
```

---

## 10. Resumen: Qué tecnología para qué

```
NECESIDAD                                 TECNOLOGÍA
──────────────────────────────            ──────────────────────────────
Carga inicial de página                   Server Component async + prefetch TQ
Caché de datos del servidor               TanStack Query (useQuery)
Crear/editar/borrar datos                 TanStack Query (useMutation)
Optimistic updates                        useMutation.onMutate + setQueryData
Refetch al volver a la pestaña            TanStack Query (refetchOnWindowFocus)
Tiempo real (cambios de otros)            Supabase Realtime → setQueryData
Autenticación                             Supabase Auth + middleware Next.js
Autorización                              Supabase RLS (base de datos)
Estado de UI (tema, sidebar, chat)        Zustand con persist
Chat IA streaming                         API Route + Vercel AI SDK
Subida de archivos                        Supabase Storage
Skeletons de carga                        loading.tsx (automático)
Manejo de errores                         error.tsx (automático)
404                                       not-found.tsx (automático)
SEO                                       generateMetadata en page.tsx
Debug de datos                            TanStack DevTools
```

---

## 11. Reglas para Claude Code

Pega esto al inicio de cualquier prompt:

```
REGLAS para Kiyoko AI:

DATOS:
- Server Components async para carga inicial. Prefetch con TanStack Query + HydrationBoundary.
- useQuery para leer datos en Client Components. NUNCA useState+useEffect para fetch.
- useMutation para escribir datos. Siempre con optimistic update (onMutate + setQueryData).
- invalidateQueries tras cada mutación exitosa.
- Query keys centralizadas en lib/query/keys.ts.
- Query functions en lib/queries/ (compartidas server/client).
- Supabase Realtime actualiza caché TQ con setQueryData, no con invalidate.

UI:
- Zustand SOLO para estado de UI (tema, sidebar, chat panel). NUNCA para datos del servidor.
- loading.tsx con skeleton en cada ruta.
- error.tsx con retry en cada ruta.

SUPABASE:
- Todos los clientes tipados con Database de database.types.ts.
- RLS habilitado en TODAS las tablas. Usar (select auth.uid()) para performance.
- Indexar columnas usadas en RLS.
- Storage en bucket kiyoko-storage.

NEXT.JS:
- page.tsx y layout.tsx SIEMPRE Server Components (sin "use client").
- "use client" solo en componentes con useState, useEffect, onClick, useQuery, useMutation.
- Metadata dinámica con generateMetadata.
- next/image siempre, nunca <img>.
```
