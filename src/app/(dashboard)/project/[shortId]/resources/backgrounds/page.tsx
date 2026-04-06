'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useParams, useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import {
  Plus, MapPin, Film, Clock, Camera,
  MoreHorizontal, Eye, Pencil, Copy, Trash2, Sparkles, Image,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Background } from '@/types';
import { BackgroundCreateModal } from '@/components/modals';

const LOCATION_LABELS: Record<string, string> = {
  interior: 'Interior', exterior: 'Exterior', mixto: 'Mixto',
};
const TIME_LABELS: Record<string, string> = {
  amanecer: 'Amanecer', dia: 'Dia', atardecer: 'Atardecer', noche: 'Noche',
  morning: 'Manana', day: 'Dia', afternoon: 'Tarde', evening: 'Atardecer', night: 'Noche',
};

function MetricCard({ label, value, detail, tone = 'default' }: {
  label: string; value: string; detail: string; tone?: 'default' | 'primary' | 'success';
}) {
  const toneClassName = tone === 'primary'
    ? 'text-primary'
    : tone === 'success'
      ? 'text-emerald-300'
      : 'text-foreground';

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tracking-tight', toneClassName)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function BackgroundCard({ background, sceneCount, href, onDelete }: {
  background: Background; sceneCount: number; href: string; onDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md">
      {/* Thumbnail */}
      <Link href={href} className="block">
        {background.reference_image_url ? (
          <div className="relative h-40 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={background.reference_image_url} alt={background.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-muted/50">
            <Image className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{background.name}</h3>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {background.location_type && (
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {LOCATION_LABELS[background.location_type] ?? background.location_type}
                </span>
              )}
              {background.time_of_day && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {TIME_LABELS[background.time_of_day] ?? background.time_of_day}
                </span>
              )}
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100 cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(href)}><Eye className="mr-2 h-3.5 w-3.5" /> Ver detalle</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(href)}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</DropdownMenuItem>
              <DropdownMenuItem><Copy className="mr-2 h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {background.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{background.description}</p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Film className="h-3 w-3" />{sceneCount} escenas</span>
          {background.available_angles && background.available_angles.length > 0 && (
            <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{background.available_angles.length} angulos</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BackgroundsPage() {
  const { project } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: queryKeys.backgrounds.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase.from('backgrounds').select('*').eq('project_id', project!.id).order('sort_order');
      return (data ?? []) as Background[];
    },
    enabled: !!project?.id,
  });

  const backgroundIds = backgrounds.map((b) => b.id);

  const { data: sceneCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [...queryKeys.backgrounds.byProject(project?.id ?? ''), 'scene-counts'],
    queryFn: async () => {
      if (!backgroundIds.length) return {};
      const { data } = await supabase.from('scene_backgrounds').select('background_id').in('background_id', backgroundIds);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => { counts[r.background_id] = (counts[r.background_id] ?? 0) + 1; });
      return counts;
    },
    enabled: backgroundIds.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('backgrounds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fondo eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(project?.id ?? '') });
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const backgroundsWithReference = backgrounds.filter((bg) => Boolean(bg.reference_image_url)).length;
  const backgroundsUsedInScenes = Object.values(sceneCounts).filter((count) => count > 0).length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-3xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header section */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fondos</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Gestiona localizaciones, ambientes y fondos reutilizables. Cada fondo puede tener imagen de referencia, angulos y descripcion para prompts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo fondo
          </button>
        </div>

        {/* Metric cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total fondos" value={String(backgrounds.length)} detail="Localizaciones en el proyecto" />
          <MetricCard label="Con referencia" value={String(backgroundsWithReference)} detail={`${Math.max(backgrounds.length - backgroundsWithReference, 0)} sin imagen principal`} tone="primary" />
          <MetricCard label="Usados en escenas" value={String(backgroundsUsedInScenes)} detail={`${backgrounds.length - backgroundsUsedInScenes} sin usar todavia`} tone="success" />
        </div>
      </section>

      {/* Content section */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {backgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Sin fondos</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Crea fondos y localizaciones. Podras reutilizarlos en distintas escenas para mantener consistencia visual.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Crear fondo
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Sparkles className="h-4 w-4 text-primary" /> Generar con IA
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {backgrounds.map((bg) => (
                <BackgroundCard
                  key={bg.id}
                  background={bg}
                  sceneCount={sceneCounts[bg.id] ?? 0}
                  href={`/project/${shortId}/resources/backgrounds/${bg.id}`}
                  onDelete={() => deleteMutation.mutate(bg.id)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {project && (
        <BackgroundCreateModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          projectId={project.id}
        />
      )}
    </div>
  );
}
