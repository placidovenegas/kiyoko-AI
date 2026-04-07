'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import {
  Palette, Plus, Star, Pencil, X, Save, Sparkles,
} from 'lucide-react';
import type { StylePreset, StylePresetUpdate } from '@/types';

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

  const defaultCount = presets.filter((p) => p.is_default).length;
  const withReferenceCount = presets.filter((p) => Boolean(p.reference_image_url)).length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header section */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Estilos visuales</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Define presets de estilo para mantener consistencia visual en todo el proyecto. Cada preset incluye prompt prefix, suffix y referencia visual.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo estilo
          </button>
        </div>

        {/* Metric cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total estilos" value={String(presets.length)} detail="Presets visuales disponibles" />
          <MetricCard label="Por defecto" value={String(defaultCount)} detail="Aplicados automaticamente" tone="primary" />
          <MetricCard label="Con referencia" value={String(withReferenceCount)} detail="Incluyen imagen de referencia" tone="success" />
        </div>
      </section>

      {/* Content section */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <Palette className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Sin estilos</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Crea presets de estilo para mantener consistencia visual en tu proyecto.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Crear primer estilo
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
                >
                  {/* Reference image */}
                  {preset.reference_image_url && (
                    <div className="h-32 overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.reference_image_url}
                        alt="Reference"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {editingId === preset.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">Editando</span>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                          placeholder="Nombre"
                        />
                        <textarea
                          value={editPrefix}
                          onChange={(e) => setEditPrefix(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                          placeholder="Prompt prefix"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              updatePreset.mutate({
                                id: preset.id,
                                updates: { name: editName, prompt_prefix: editPrefix || null },
                              })
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Save className="h-3.5 w-3.5" /> Guardar
                          </button>
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
                            type="button"
                            onClick={() => startEdit(preset)}
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
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
                          <div className="mt-auto rounded-xl bg-background p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Prompt prefix</p>
                            <p className="mt-1 line-clamp-3 text-xs text-foreground/70">{preset.prompt_prefix}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
