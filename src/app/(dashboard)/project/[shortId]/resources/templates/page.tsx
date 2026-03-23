'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  Loader2, FileCode, Plus, Tag, Braces,
} from 'lucide-react';
import type { PromptTemplate } from '@/types';

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    scene_description: 'bg-blue-500/20 text-blue-400',
    character_prompt: 'bg-purple-500/20 text-purple-400',
    background_prompt: 'bg-green-500/20 text-green-400',
    camera_prompt: 'bg-amber-500/20 text-amber-400',
    narration: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Plantillas de prompts{' '}
            <span className="font-normal text-muted-foreground">({templates.length})</span>
          </h1>
        </div>
        <KButton variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
          Nueva plantilla
        </KButton>
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <FileCode className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">Sin plantillas</h2>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Crea plantillas de prompts reutilizables para acelerar la generacion de contenido.
          </p>
          <KButton variant="primary" size="lg" icon={<Plus className="h-4 w-4" />}>
            Crear primera plantilla
          </KButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                {template.is_default && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                    default
                  </span>
                )}
              </div>

              {/* Type badge */}
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[template.template_type] ?? 'bg-secondary text-muted-foreground'}`}>
                  {template.template_type}
                </span>
              </div>

              {/* Description */}
              {template.description && (
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
              )}

              {/* Template preview */}
              <div className="mb-3 rounded-lg bg-background p-3">
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
                      className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary"
                    >
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
