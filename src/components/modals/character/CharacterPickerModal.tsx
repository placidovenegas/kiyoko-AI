'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TextField, Input, Select, ListBox, Label } from '@heroui/react';
import type { Key } from 'react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { Search, X, Loader2, UserRound } from 'lucide-react';
import type { Character } from '@/types';

const ROLE_OPTIONS = [
  { value: 'protagonista', label: 'Protagonista' },
  { value: 'secundario', label: 'Secundario' },
  { value: 'fondo', label: 'Fondo' },
  { value: 'mencion', label: 'Menci\u00f3n' },
] as const;

interface CharacterPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sceneId: string;
  assignedCharacterIds: string[];
  onAssign: (characterId: string, role: string) => void;
}

export function CharacterPickerModal({
  open,
  onOpenChange,
  projectId,
  sceneId,
  assignedCharacterIds,
  onAssign,
}: CharacterPickerModalProps) {
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const supabase = createClient();

  const { data: characters = [], isLoading } = useQuery({
    queryKey: queryKeys.characters.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Character[];
    },
    enabled: open && !!projectId,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return characters;
    const q = search.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.visual_description ?? '').toLowerCase().includes(q) ||
        (c.role ?? '').toLowerCase().includes(q),
    );
  }, [characters, search]);

  function handleAssign(characterId: string) {
    const role = roles[characterId] ?? 'secundario';
    setAssigning(characterId);
    onAssign(characterId, role);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Asignar personaje</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <TextField variant="secondary" value={search} onChange={setSearch}>
            <Label className="sr-only">Buscar personaje</Label>
            <Input placeholder="Buscar personaje..." />
          </TextField>
        </div>

        {/* Character list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserRound className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Sin resultados' : 'No hay personajes en este proyecto'}
              </p>
            </div>
          ) : (
            filtered.map((character) => {
              const isAssigned = assignedCharacterIds.includes(character.id);
              const initials = (character.initials || character.name.slice(0, 2)).toUpperCase();

              return (
                <div
                  key={character.id}
                  className={`rounded-xl border border-border bg-background p-4 transition ${
                    isAssigned ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {character.reference_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={character.reference_image_url}
                        alt={character.name}
                        className="h-9 w-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: character.color_accent ?? '#6B7280' }}
                      >
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{character.name}</p>
                        {character.role && (
                          <span className="text-[10px] text-muted-foreground">
                            {character.role}
                          </span>
                        )}
                        {isAssigned && (
                          <span className="text-[10px] text-primary font-medium ml-auto shrink-0">
                            Ya asignado
                          </span>
                        )}
                      </div>
                      {character.visual_description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {character.visual_description}
                        </p>
                      )}

                      {!isAssigned && (
                        <div className="mt-2 flex items-center gap-2">
                          <Select
                            variant="secondary"
                            aria-label="Rol del personaje"
                            selectedKey={roles[character.id] ?? 'secundario'}
                            onSelectionChange={(key: Key | null) => {
                              if (key) setRoles((prev) => ({ ...prev, [character.id]: String(key) }));
                            }}
                            className="min-w-[120px]"
                          >
                            <Label className="sr-only">Rol</Label>
                            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                            <Select.Popover><ListBox>
                              {ROLE_OPTIONS.map((opt) => (
                                <ListBox.Item key={opt.value} id={opt.value}>{opt.label}</ListBox.Item>
                              ))}
                            </ListBox></Select.Popover>
                          </Select>
                          <button
                            type="button"
                            onClick={() => handleAssign(character.id)}
                            disabled={assigning === character.id}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {assigning === character.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Asignar'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
