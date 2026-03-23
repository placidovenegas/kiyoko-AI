'use client';

import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  MapPin,
  Palette,
  FileText,
  Plus,
  Sparkles,
  Pencil,
  ChevronRight,
} from 'lucide-react';
import type { Character, Background, StylePreset, PromptTemplate } from '@/types';

type TabKey = 'characters' | 'backgrounds' | 'styles' | 'templates';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: typeof Users;
  href: string;
}

export default function ResourcesPage() {
  const { project, loading: projectLoading } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const [activeTab, setActiveTab] = useState<TabKey>('characters');

  // ── Queries ──
  const { data: characters = [], isLoading: charsLoading } = useQuery({
    queryKey: queryKeys.characters.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Character[];
    },
    enabled: !!project?.id,
  });

  const { data: backgrounds = [], isLoading: bgsLoading } = useQuery({
    queryKey: queryKeys.backgrounds.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('backgrounds')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Background[];
    },
    enabled: !!project?.id,
  });

  const { data: stylePresets = [], isLoading: stylesLoading } = useQuery({
    queryKey: queryKeys.stylePresets.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('style_presets')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as StylePreset[];
    },
    enabled: !!project?.id,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['prompt-templates', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as PromptTemplate[];
    },
    enabled: !!project?.id,
  });

  const tabs: TabConfig[] = [
    { key: 'characters', label: `Personajes (${characters.length})`, icon: Users, href: `/project/${shortId}/resources/characters` },
    { key: 'backgrounds', label: `Fondos (${backgrounds.length})`, icon: MapPin, href: `/project/${shortId}/resources/backgrounds` },
    { key: 'styles', label: `Estilos (${stylePresets.length})`, icon: Palette, href: `/project/${shortId}/resources/styles` },
    { key: 'templates', label: `Plantillas (${templates.length})`, icon: FileText, href: `/project/${shortId}/resources/templates` },
  ];

  const loading = projectLoading || charsLoading || bgsLoading || stylesLoading || templatesLoading;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-32 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Recursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Personajes, fondos, estilos y plantillas del proyecto</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {/* TODO: AI generate */}}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-card"
          >
            <Sparkles className="h-4 w-4 text-primary" /> Generar con IA
          </button>
          <Link
            href={tabs.find((t) => t.key === activeTab)?.href ?? '#'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Ver todos
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Characters tab ── */}
      {activeTab === 'characters' && (
        <>
          {characters.length === 0 ? (
            <EmptyResourceState
              icon={Users}
              title="No hay personajes"
              description="Crea personajes manualmente o genera con IA"
              href={`/project/${shortId}/resources/characters`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {characters.map((char) => (
                <Link
                  key={char.id}
                  href={`/project/${shortId}/resources/characters/${char.id}`}
                  className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
                >
                  <div className="mb-3 flex items-center gap-3">
                    {char.reference_image_url ? (
                      <img src={char.reference_image_url} alt={char.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: char.color_accent || '#6B7280' }}
                      >
                        {char.initials || char.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">{char.name}</h3>
                      {char.role && <p className="truncate text-xs text-muted-foreground">{char.role}</p>}
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  {char.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{char.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Backgrounds tab ── */}
      {activeTab === 'backgrounds' && (
        <>
          {backgrounds.length === 0 ? (
            <EmptyResourceState
              icon={MapPin}
              title="No hay fondos"
              description="Crea fondos manualmente o genera con IA"
              href={`/project/${shortId}/resources/backgrounds`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {backgrounds.map((bg) => (
                <Link
                  key={bg.id}
                  href={`/project/${shortId}/resources/backgrounds/${bg.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/30"
                >
                  {bg.reference_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={bg.reference_image_url} alt={bg.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-background">
                      <MapPin className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{bg.name}</h3>
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{bg.code}</span>
                    </div>
                    {bg.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{bg.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Styles tab ── */}
      {activeTab === 'styles' && (
        <>
          {stylePresets.length === 0 ? (
            <EmptyResourceState
              icon={Palette}
              title="No hay estilos"
              description="Define presets de estilo visual para tus escenas"
              href={`/project/${shortId}/resources/styles`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stylePresets.map((preset) => (
                <Link
                  key={preset.id}
                  href={`/project/${shortId}/resources/styles`}
                  className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{preset.name}</h3>
                    {preset.is_default && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Default</span>
                    )}
                  </div>
                  {preset.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{preset.description}</p>
                  )}
                  {preset.style_type && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{preset.style_type}</span>
                  )}
                  {preset.prompt_prefix && (
                    <div className="mt-2 rounded bg-background px-2 py-1">
                      <p className="line-clamp-2 font-mono text-[10px] text-muted-foreground">{preset.prompt_prefix}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Templates tab ── */}
      {activeTab === 'templates' && (
        <>
          {templates.length === 0 ? (
            <EmptyResourceState
              icon={FileText}
              title="No hay plantillas"
              description="Crea plantillas de prompt reutilizables"
              href={`/project/${shortId}/resources/templates`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <Link
                  key={tpl.id}
                  href={`/project/${shortId}/resources/templates`}
                  className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{tpl.template_type}</span>
                  </div>
                  {tpl.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{tpl.description}</p>
                  )}
                  <div className="rounded bg-background px-2 py-1">
                    <p className="line-clamp-3 font-mono text-[10px] text-muted-foreground">{tpl.template_text}</p>
                  </div>
                  {tpl.variables && tpl.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tpl.variables.map((v) => (
                        <span key={v} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          {`{${v}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Shared empty state component ──
function EmptyResourceState({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/30" />
      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
      >
        <ChevronRight className="h-4 w-4" /> Ver seccion
      </Link>
    </div>
  );
}
