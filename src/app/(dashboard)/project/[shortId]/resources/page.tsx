'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  BrushCleaning,
  ChevronRight,
  FileCode,
  FolderKanban,
  Image as ImageIcon,
  Layers3,
  Mountain,
  Sparkles,
  Users,
} from 'lucide-react';

function StatCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SectionCard({
  href,
  icon: Icon,
  title,
  description,
  count,
  summary,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
  count: number;
  summary: string;
}) {
  return (
    <Link href={href} className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-5">
        <p className="text-3xl font-semibold tracking-tight text-foreground">{count}</p>
        <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
      </div>
    </Link>
  );
}

export default function ProjectResourcesPage() {
  const { project, characters, backgrounds, stylePresets, loading } = useProject();
  const supabase = createClient();

  const { data: templates = [] } = useQuery({
    queryKey: queryKeys.promptTemplates.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(project?.id),
    staleTime: 30_000,
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <section className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-20 text-center shadow-sm">
          <FolderKanban className="h-12 w-12 text-muted-foreground/30" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Recursos no disponibles</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">No se pudo cargar la biblioteca del proyecto.</p>
        </section>
      </div>
    );
  }

  const characterSummary = characters.length > 0
    ? `${characters.slice(0, 3).map((character) => character.name).join(' / ')}${characters.length > 3 ? '...' : ''}`
    : 'Todavia no hay personajes base';
  const backgroundSummary = backgrounds.length > 0
    ? `${backgrounds.filter((background) => background.reference_image_url).length} con referencia visual`
    : 'Todavia no hay fondos base';
  const styleSummary = stylePresets.length > 0
    ? `${stylePresets.filter((preset) => preset.is_default).length} marcados como default`
    : 'No hay presets configurados';
  const templateSummary = templates.length > 0
    ? `${templates.filter((template) => template.is_default).length} plantillas por defecto`
    : 'No hay plantillas creadas';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Hero section */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">Biblioteca creativa</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Recursos del proyecto</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Centraliza personajes, fondos, presets de estilo y plantillas para que escenas, prompts y automatizaciones mantengan consistencia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/project/${project.short_id}/resources/characters`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Gestionar personajes
            </Link>
            <Link
              href={`/project/${project.short_id}/resources/backgrounds`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Gestionar fondos
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Personajes" value={characters.length} description="Entidades visuales listas para escenas" />
        <StatCard label="Fondos" value={backgrounds.length} description="Locaciones y atmosferas reutilizables" />
        <StatCard label="Estilos" value={stylePresets.length} description="Presets visuales y direccion artistica" />
        <StatCard label="Plantillas" value={templates.length} description="Prompts base para acelerar produccion" />
      </div>

      {/* Section cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          href={`/project/${project.short_id}/resources/characters`}
          icon={Users}
          title="Personajes"
          description="Gestiona fichas, referencias y consistencia visual de elenco."
          count={characters.length}
          summary={characterSummary}
        />
        <SectionCard
          href={`/project/${project.short_id}/resources/backgrounds`}
          icon={Mountain}
          title="Fondos"
          description="Organiza locaciones, tiempos del dia y referencias de ambiente."
          count={backgrounds.length}
          summary={backgroundSummary}
        />
        <SectionCard
          href={`/project/${project.short_id}/resources/styles`}
          icon={BrushCleaning}
          title="Estilos visuales"
          description="Define presets para mantener el mismo lenguaje grafico en todo el proyecto."
          count={stylePresets.length}
          summary={styleSummary}
        />
        <SectionCard
          href={`/project/${project.short_id}/resources/templates`}
          icon={FileCode}
          title="Plantillas de prompts"
          description="Reutiliza estructuras de prompt para escenas, personajes y fondos."
          count={templates.length}
          summary={templateSummary}
        />
      </div>

      {/* Coverage section */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Cobertura creativa actual</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cuanto mas completa este esta biblioteca, mas consistente sera la ayuda de Kiyoko al generar escenas y prompts.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Users className="h-4 w-4 text-primary" /> Cobertura de personajes</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{characters.length > 0 ? 'Ya tienes base suficiente para mantener continuidad visual entre escenas.' : 'Empieza por definir los personajes clave para evitar prompts inconsistentes.'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><ImageIcon className="h-4 w-4 text-primary" /> Cobertura de atmosferas</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{backgrounds.length > 0 ? 'Los fondos ya pueden alimentar moodboards, escenas y referencias de composicion.' : 'Agrega locaciones base para que la direccion visual tenga contexto solido.'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Layers3 className="h-4 w-4 text-primary" /> Estandarizacion</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{stylePresets.length > 0 || templates.length > 0 ? 'Ya existe una capa reusable para estandarizar generacion y revision.' : 'Define presets o plantillas para que la produccion no dependa de prompts improvisados.'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
