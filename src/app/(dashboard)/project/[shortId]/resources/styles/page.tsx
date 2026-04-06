'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@heroui/react';
import {
  Loader2, Palette, Plus, Star, Pencil, X, Save,
} from 'lucide-react';
import type { StylePreset, StylePresetUpdate } from '@/types';

export default function StylesPage() {
  const { project } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrefix, setEditPrefix] = useState('');

  const { data: presets = [], isLoading } = useQuery({
    queryKey: queryKeys.stylePresets.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_presets')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data as StylePreset[];
    },
    enabled: !!project?.id,
  });

  const updatePreset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: StylePresetUpdate }) => {
      const { error } = await supabase.from('style_presets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.stylePresets.byProject(project?.id ?? '') });
      setEditingId(null);
    },
  });

  function startEdit(preset: StylePreset) {
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditPrefix(preset.prompt_prefix ?? '');
  }

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
          <Palette className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Estilos visuales{' '}
            <span className="font-normal text-muted-foreground">({presets.length})</span>
          </h1>
        </div>
        <Button variant="primary" size="md" startContent={<Plus className="h-4 w-4" />} className="rounded-md">
          Nuevo estilo
        </Button>
      </div>

      {/* Empty state */}
      {presets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <Palette className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">Sin estilos</h2>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Crea presets de estilo para mantener consistencia visual en tu proyecto.
          </p>
          <Button variant="primary" size="lg" startContent={<Plus className="h-4 w-4" />} className="rounded-md">
            Crear primer estilo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
            >
              {editingId === preset.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">Editando</span>
                    <Button variant="ghost" size="sm" isIconOnly className="h-6 w-6" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    placeholder="Nombre"
                  />
                  <textarea
                    value={editPrefix}
                    onChange={(e) => setEditPrefix(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    placeholder="Prompt prefix"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      startContent={<Save className="h-3.5 w-3.5" />}
                      onClick={() =>
                        updatePreset.mutate({
                          id: preset.id,
                          updates: { name: editName, prompt_prefix: editPrefix || null },
                        })
                      }
                      className="rounded-md"
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{preset.name}</h3>
                      {preset.is_default && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <button
                      onClick={() => startEdit(preset)}
                      className="text-muted-foreground transition hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  {preset.style_type && (
                    <span className="mb-2 self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {preset.style_type}
                    </span>
                  )}

                  {preset.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{preset.description}</p>
                  )}

                  {preset.prompt_prefix && (
                    <div className="mt-auto rounded-lg bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground">Prompt prefix:</p>
                      <p className="mt-1 line-clamp-3 text-xs text-foreground/70">{preset.prompt_prefix}</p>
                    </div>
                  )}

                  {preset.reference_image_url && (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <img
                        src={preset.reference_image_url}
                        alt="Reference"
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
