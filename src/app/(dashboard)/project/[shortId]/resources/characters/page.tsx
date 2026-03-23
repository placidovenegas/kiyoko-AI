'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useParams } from 'next/navigation';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  Plus, Users, Image as ImageIcon, Film, Loader2,
  MoreHorizontal, Eye, Pencil, Copy, Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Character } from '@/types';

// ─── Character Avatar ──────────────────────────────────────
function CharacterAvatar({ character }: { character: Character }) {
  const bg = character.color_accent ?? '#0EA5A0';

  if (character.reference_image_url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={character.reference_image_url}
        alt={character.name}
        className="h-16 w-16 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {character.initials || character.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Character Card ────────────────────────────────────────
function CharacterCard({
  character,
  sceneCount,
  imageCount,
  href,
  onAction,
}: {
  character: Character;
  sceneCount: number;
  imageCount: number;
  href: string;
  onAction?: (action: string, character: Character) => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-all',
        'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
      )}
    >
      <Link href={href} className="flex items-start gap-3 mb-3">
        <CharacterAvatar character={character} />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate text-sm font-bold text-foreground">
            {character.name}
          </h3>
          {character.role && (
            <p className="truncate text-xs text-muted-foreground">{character.role}</p>
          )}
        </div>
      </Link>

      {character.visual_description && (
        <Link href={href}>
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {character.visual_description}
          </p>
        </Link>
      )}

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5" />
            {sceneCount} escenas
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" />
            {imageCount} img
          </span>
        </div>

        {/* Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground',
                'opacity-0 transition-opacity group-hover:opacity-100',
                'hover:bg-secondary hover:text-foreground',
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onAction?.('view', character)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction?.('edit', character)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction?.('duplicate', character)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400"
              onClick={() => onAction?.('delete', character)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function CharactersPage() {
  const { project } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const supabase = createClient();

  // ── Characters ──
  const { data: characters = [], isLoading } = useQuery({
    queryKey: queryKeys.characters.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data as Character[];
    },
    enabled: !!project?.id,
  });

  // ── Scene counts per character ──
  const characterIds = characters.map((c) => c.id);

  const { data: sceneCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [...queryKeys.characters.byProject(project?.id ?? ''), 'scene-counts'],
    queryFn: async () => {
      if (characterIds.length === 0) return {};
      const { data, error } = await supabase
        .from('scene_characters')
        .select('character_id')
        .in('character_id', characterIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.character_id] = (counts[row.character_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: characterIds.length > 0,
  });

  // ── Image counts per character ──
  const { data: imageCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [...queryKeys.characters.byProject(project?.id ?? ''), 'image-counts'],
    queryFn: async () => {
      if (characterIds.length === 0) return {};
      const { data, error } = await supabase
        .from('character_images')
        .select('character_id')
        .in('character_id', characterIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.character_id] = (counts[row.character_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: characterIds.length > 0,
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Personajes{' '}
            <span className="text-muted-foreground font-normal">({characters.length})</span>
          </h1>
        </div>
        <KButton
          variant="primary"
          size="md"
          icon={<Plus className="h-4 w-4" />}
        >
          Nuevo personaje
        </KButton>
      </div>

      {/* Empty state */}
      {characters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Sin personajes
          </h2>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Crea personajes para tu proyecto. Podras asignarlos a escenas y generar imagenes consistentes.
          </p>
          <KButton
            variant="primary"
            size="lg"
            icon={<Plus className="h-4 w-4" />}
          >
            Crear primer personaje
          </KButton>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              sceneCount={sceneCounts[character.id] ?? 0}
              imageCount={imageCounts[character.id] ?? 0}
              href={`/project/${shortId}/resources/characters/${character.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
