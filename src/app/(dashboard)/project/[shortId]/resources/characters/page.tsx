'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { CharacterCreateModal } from '@/components/modals';
import type { Character } from '@/types';
import { toast } from 'sonner';
import {
  Copy,
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

const ROLE_COLORS: Record<string, string> = {
  protagonista: 'bg-primary/10 text-primary',
  secundario: 'bg-sky-500/10 text-sky-300',
  extra: 'bg-zinc-500/10 text-zinc-300',
  narrador: 'bg-amber-500/10 text-amber-300',
};

function CharacterAvatar({ character }: { character: Character }) {
  const initials = (character.initials || character.name.slice(0, 2)).toUpperCase();

  if (character.reference_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={character.reference_image_url} alt={character.name} className="h-11 w-11 rounded-xl object-cover" />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: character.color_accent ?? '#6B7280' }}>
      {initials}
    </div>
  );
}

export default function CharactersPage() {
  const { project } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: characters = [], isLoading } = useQuery({
    queryKey: queryKeys.characters.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('project_id', project!.id).order('sort_order');
      if (error) throw error;
      return (data ?? []) as Character[];
    },
    enabled: !!project?.id,
  });

  const characterIds = characters.map((character) => character.id);

  const { data: sceneCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [...queryKeys.characters.byProject(project?.id ?? ''), 'scene-counts'],
    queryFn: async () => {
      if (characterIds.length === 0) return {};
      const { data, error } = await supabase.from('scene_characters').select('character_id').in('character_id', characterIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.character_id] = (counts[row.character_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: characterIds.length > 0,
  });

  const { data: imageCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [...queryKeys.characters.byProject(project?.id ?? ''), 'image-counts'],
    queryFn: async () => {
      if (characterIds.length === 0) return {};
      const { data, error } = await supabase.from('character_images').select('character_id').in('character_id', characterIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.character_id] = (counts[row.character_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: characterIds.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const { error } = await supabase.from('characters').delete().eq('id', characterId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Personaje eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.byProject(project?.id ?? '') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el personaje');
    },
  });

  const charactersWithReference = characters.filter((character) => Boolean(character.reference_image_url)).length;
  const charactersWithPrompt = characters.filter((character) => Boolean(character.prompt_snippet)).length;
  const sceneReadyCharacters = Object.values(sceneCounts).filter((count) => count > 0).length;

  async function copyPrompt(prompt: string | null) {
    if (!prompt) {
      toast.error('Este personaje todavía no tiene prompt');
      return;
    }
    await navigator.clipboard.writeText(prompt);
    toast.success('Prompt copiado');
  }

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
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Personajes</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Aquí solo debería estar la operación del elenco: ver estado, copiar prompt rápido, abrir detalle y gestionar cada personaje desde su propia página.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo personaje
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Elenco" value={String(characters.length)} detail="Personajes activos" />
          <MetricCard label="Con referencia" value={String(charactersWithReference)} detail={`${Math.max(characters.length - charactersWithReference, 0)} sin imagen principal`} tone="primary" />
          <MetricCard label="Listos para escena" value={String(charactersWithPrompt)} detail={`${sceneReadyCharacters} ya aparecen en storyboard`} tone="success" />
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <UserRound className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Todavía no hay personajes</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Crea el primero y luego completa prompts, referencias y reglas dentro de su detalle.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" />
              Crear personaje
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background/80">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Personaje</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Referencia</th>
                  <th className="px-4 py-3 font-medium">Prompt</th>
                  <th className="px-4 py-3 font-medium">Escenas</th>
                  <th className="px-4 py-3 font-medium">Imagenes</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {characters.map((character) => {
                  const href = `/project/${shortId}/resources/characters/${character.id}`;
                  const hasPrompt = Boolean(character.prompt_snippet);
                  const hasReference = Boolean(character.reference_image_url);

                  return (
                    <tr key={character.id} className="transition-colors hover:bg-background/60">
                      <td className="px-4 py-3">
                        <Link href={href} className="flex items-center gap-3">
                          <CharacterAvatar character={character} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{character.name}</p>
                            <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                              {character.visual_description || 'Sin descripción visual todavía'}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]', ROLE_COLORS[character.role ?? ''] ?? 'bg-secondary text-muted-foreground')}>
                          {character.role ?? 'Sin rol'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium', hasReference ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300')}>
                          {hasReference ? 'Lista' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium', hasPrompt ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300')}>
                            {hasPrompt ? 'Disponible' : 'Sin prompt'}
                          </span>
                          <button
                            type="button"
                            onClick={() => void copyPrompt(character.prompt_snippet)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={`Copiar prompt de ${character.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{sceneCounts[character.id] ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <ImageIcon className="h-3.5 w-3.5" />
                          {imageCounts[character.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={href} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                            Abrir
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={href}>Abrir detalle</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void copyPrompt(character.prompt_snippet)}>
                                <Copy className="mr-2 h-3.5 w-3.5" />
                                Copiar prompt
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(character.id)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {project ? (
        <CharacterCreateModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          projectId={project.id}
        />
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, detail, tone = 'default' }: { label: string; value: string; detail: string; tone?: 'default' | 'primary' | 'success'; }) {
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
