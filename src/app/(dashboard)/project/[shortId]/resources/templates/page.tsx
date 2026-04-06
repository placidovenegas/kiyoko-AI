'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import {
  FileCode, Plus, Tag, Braces, Sparkles,
} from 'lucide-react';
import type { PromptTemplate } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  scene_description: 'bg-blue-500/10 text-blue-400',
  character_prompt: 'bg-purple-500/10 text-purple-400',
  background_prompt: 'bg-green-500/10 text-green-400',
  camera_prompt: 'bg-amber-500/10 text-amber-400',
  narration: 'bg-pink-500/10 text-pink-400',
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

export default function TemplatesPage() {
  const { project } = useProject();
  const supabase = createClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: queryKeys.promptTemplates.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data as PromptTemplate[];
    },
    enabled: !!project?.id,
  });

  const defaultCount = templates.filter((t) => t.is_default).length;
  const uniqueTypes = new Set(templates.map((t) => t.template_type)).size;

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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Plantillas de prompts</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Reutiliza estructuras de prompt para escenas, personajes y fondos. Cada plantilla puede incluir variables dinamicas.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </button>
        </div>

        {/* Metric cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total plantillas" value={String(templates.length)} detail="Plantillas de prompts disponibles" />
          <MetricCard label="Por defecto" value={String(defaultCount)} detail="Aplicadas automaticamente" tone="primary" />
          <MetricCard label="Tipos unicos" value={String(uniqueTypes)} detail="Categorias de plantillas" tone="success" />
        </div>
      </section>

      {/* Content section */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <FileCode className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Sin plantillas</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Crea plantillas de prompts reutilizables para acelerar la generacion de contenido.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Crear primera plantilla
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
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                    {template.is_default && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        default
                      </span>
                    )}
                  </div>

                  {/* Type badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', TYPE_COLORS[template.template_type] ?? 'bg-secondary text-muted-foreground')}>
                      {template.template_type}
                    </span>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
                  )}

                  {/* Template preview */}
                  <div className="mb-3 rounded-xl bg-background p-3">
                    <p className="line-clamp-4 font-mono text-xs text-foreground/70">
                      {template.template_text}
                    </p>
                  </div>

                  {/* Variables */}
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-auto flex flex-wrap items-center gap-1.5">
                      <Braces className="h-3 w-3 text-muted-foreground" />
                      {template.variables.map((v) => (
                        <span
                          key={v}
                          className="rounded-lg bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary"
                        >
                          {`{${v}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
