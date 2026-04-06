'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useParams } from 'next/navigation';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Film, Loader2, Clock, Camera } from 'lucide-react';
import type { Background } from '@/types';

// ─── Background Card ───────────────────────────────────────
function BackgroundCard({
  background,
  sceneCount,
  href,
}: {
  background: Background;
  sceneCount: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
      )}
    >
      {/* Thumbnail / placeholder */}
      {background.reference_image_url ? (
        <div className="relative h-36 w-full overflow-hidden bg-background">
          <img
            src={background.reference_image_url}
            alt={background.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-background">
          <MapPin className="h-10 w-10 text-border" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
            {background.code}
          </span>
          {background.location_type && (
            <span className="text-[10px] text-muted-foreground">{background.location_type}</span>
          )}
        </div>

        <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
          {background.name}
        </h3>

        {background.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {background.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5" />
            Aparece en: {sceneCount}
          </span>
          {background.time_of_day && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {background.time_of_day}
            </span>
          )}
          {background.available_angles && background.available_angles.length > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" />
              {background.available_angles.length} angulos
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function BackgroundsPage() {
  const { project } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const supabase = createClient();

  // ── Backgrounds ──
  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: queryKeys.backgrounds.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backgrounds')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data as Background[];
    },
    enabled: !!project?.id,
  });

  // ── Scene counts per background ──
  const backgroundIds = backgrounds.map((b) => b.id);

  const { data: sceneCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [...queryKeys.backgrounds.byProject(project?.id ?? ''), 'scene-counts'],
    queryFn: async () => {
      if (backgroundIds.length === 0) return {};
      const { data, error } = await supabase
        .from('scene_backgrounds')
        .select('background_id')
        .in('background_id', backgroundIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.background_id] = (counts[row.background_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: backgroundIds.length > 0,
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Fondos{' '}
            <span className="text-muted-foreground font-normal">({backgrounds.length})</span>
          </h1>
        </div>
        <Button
          variant="primary"
          size="md"
          className="rounded-md"
        >
          <Plus className="h-4 w-4 mr-2" />Nuevo fondo
        </Button>
      </div>

      {/* ── Empty state ── */}
      {backgrounds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Sin fondos
          </h2>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Crea fondos y localizaciones para tu proyecto. Podras reutilizarlos en distintas escenas con angulos y horas del dia diferentes.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />Crear primer fondo
          </Button>
        </div>
      ) : (
        /* ── Grid ── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {backgrounds.map((background) => (
            <BackgroundCard
              key={background.id}
              background={background}
              sceneCount={sceneCounts[background.id] ?? 0}
              href={`/project/${shortId}/resources/backgrounds/${background.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
