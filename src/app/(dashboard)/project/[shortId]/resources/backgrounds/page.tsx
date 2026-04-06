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
  Plus, MapPin, Film, Loader2, Clock, Camera,
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
  amanecer: 'Amanecer', dia: 'Día', atardecer: 'Atardecer', noche: 'Noche',
  morning: 'Mañana', day: 'Día', afternoon: 'Tarde', evening: 'Atardecer', night: 'Noche',
};

function BackgroundCard({ background, sceneCount, href, onDelete }: {
  background: Background; sceneCount: number; href: string; onDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
      {/* Thumbnail */}
      <Link href={href} className="block">
        {background.reference_image_url ? (
          <div className="relative h-36 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={background.reference_image_url} alt={background.name} className="h-full w-full object-cover transition group-hover:scale-105" />
            <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent" />
          </div>
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-muted">
            <Image className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={href} className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{background.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {background.location_type && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {LOCATION_LABELS[background.location_type] ?? background.location_type}
                </span>
              )}
              {background.time_of_day && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {TIME_LABELS[background.time_of_day] ?? background.time_of_day}
                </span>
              )}
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center justify-center size-7 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(href)}><Eye className="mr-2 h-3.5 w-3.5" /> Ver detalle</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(href)}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</DropdownMenuItem>
              <DropdownMenuItem><Copy className="mr-2 h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={onDelete}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {background.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{background.description}</p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Film className="h-3 w-3" />{sceneCount} escenas</span>
          {background.available_angles && background.available_angles.length > 0 && (
            <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{background.available_angles.length} ángulos</span>
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="h-36 bg-muted animate-pulse" />
              <div className="p-4 space-y-2"><div className="h-4 w-24 bg-muted rounded animate-pulse" /><div className="h-3 w-full bg-muted rounded animate-pulse" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fondos</h1>
          <p className="text-sm text-muted-foreground mt-1">{backgrounds.length} localización{backgrounds.length !== 1 ? 'es' : ''} en el proyecto</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nuevo fondo
        </button>
      </div>

      {backgrounds.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Sin fondos</h2>
          <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
            Crea fondos y localizaciones. Podrás reutilizarlos en distintas escenas.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
              <Plus className="h-4 w-4" /> Crear fondo
            </button>
            <button className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer">
              <Sparkles className="h-4 w-4 text-primary" /> Generar con IA
            </button>
          </div>
        </div>
      )}

      {backgrounds.length > 0 && (
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
      )}

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
