'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@heroui/react';
import { Bot, ImagePlus, Save, Settings2, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useProject } from '@/contexts/ProjectContext';
import { WorkspaceSettingsModal, type WorkspaceSettingsNavGroup } from '@/components/settings/WorkspaceSettingsModal';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import type { Project, ProjectUpdate } from '@/types';

const NAV: WorkspaceSettingsNavGroup[] = [
  {
    group: 'Proyecto',
    items: [
      { id: 'general', label: 'General', icon: Settings2 },
      { id: 'ia', label: 'Contexto IA', icon: Bot },
    ],
  },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'review', label: 'En revision' },
  { value: 'completed', label: 'Completado' },
  { value: 'archived', label: 'Archivado' },
];

const STYLE_OPTIONS = [
  { value: 'realistic', label: 'Realista' },
  { value: 'anime', label: 'Anime' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'cinematic', label: 'Cinematografico' },
  { value: 'minimal', label: 'Minimalista' },
  { value: 'mixed', label: 'Mixto' },
];

const fieldClassName = 'mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/10';

interface ProjectSettingsFormState {
  title: string;
  description: string;
  clientName: string;
  style: string;
  status: string;
  tags: string;
  aiBrief: string;
  globalPromptRules: string;
  customStyleDescription: string;
  coverImageUrl: string;
}

function createState(project: Project): ProjectSettingsFormState {
  return {
    title: project.title,
    description: project.description ?? '',
    clientName: project.client_name ?? '',
    style: project.style ?? '',
    status: project.status,
    tags: (project.tags ?? []).join(', '),
    aiBrief: project.ai_brief ?? '',
    globalPromptRules: project.global_prompt_rules ?? '',
    customStyleDescription: project.custom_style_description ?? '',
    coverImageUrl: project.cover_image_url ?? '',
  };
}

function parseTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ProjectSettingsModal() {
  const { project, loading } = useProject();
  const {
    projectSettingsModalOpen,
    projectSettingsSection,
    openProjectSettingsModal,
    closeProjectSettingsModal,
  } = useUIStore();

  if (!project || loading) {
    return null;
  }

  return (
    <ProjectSettingsModalContent
      key={project.id}
      project={project}
      isOpen={projectSettingsModalOpen}
      activeSection={projectSettingsSection}
      onClose={closeProjectSettingsModal}
      onSelectSection={openProjectSettingsModal}
    />
  );
}

function ProjectSettingsModalContent({
  project,
  isOpen,
  activeSection,
  onClose,
  onSelectSection,
}: {
  project: Project;
  isOpen: boolean;
  activeSection: string;
  onClose: () => void;
  onSelectSection: (section?: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<ProjectSettingsFormState>(() => createState(project));

  const saveMutation = useMutation({
    mutationFn: async (payload: ProjectUpdate) => {
      const supabase = createClient();
      const { error } = await supabase.from('projects').update(payload).eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.short_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.workspace() });
      toast.success('Ajustes del proyecto guardados');
    },
    onError: (error) => {
      console.error(error);
      toast.error('No se pudieron guardar los ajustes');
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `projects/${project.id}/cover-${crypto.randomUUID()}.${ext}`;
      const payload = new FormData();
      payload.append('bucket', 'project-assets');
      payload.append('path', path);
      payload.append('file', file);

      const response = await fetch('/api/storage/object', { method: 'POST', body: payload });
      const body = (await response.json().catch(() => null)) as { file?: { url: string }; error?: string } | null;
      if (!response.ok || !body?.file?.url) {
        throw new Error(body?.error ?? 'No se pudo subir la portada');
      }

      const supabase = createClient();
      const { error } = await supabase.from('projects').update({ cover_image_url: body.file.url }).eq('id', project.id);
      if (error) throw error;
      return body.file.url;
    },
    onSuccess: (url) => {
      setForm((current) => ({ ...current, coverImageUrl: url }));
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.short_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.workspace() });
      toast.success('Portada actualizada');
    },
  });

  const deleteCoverMutation = useMutation({
    mutationFn: async () => {
      if (form.coverImageUrl) {
        const path = (() => {
          try {
            const url = new URL(form.coverImageUrl);
            return url.pathname.split('/object/public/project-assets/')[1] ?? '';
          } catch {
            return '';
          }
        })();

        if (path) {
          await fetch('/api/storage/object', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: 'project-assets', path }),
          }).catch(() => null);
        }
      }

      const supabase = createClient();
      const { error } = await supabase.from('projects').update({ cover_image_url: null }).eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm((current) => ({ ...current, coverImageUrl: '' }));
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.short_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.workspace() });
      toast.success('Portada eliminada');
    },
  });

  const isSaving = saveMutation.isPending || uploadCoverMutation.isPending || deleteCoverMutation.isPending;

  const hasChanges = useMemo(() => JSON.stringify({
    title: form.title,
    description: form.description,
    clientName: form.clientName,
    style: form.style,
    status: form.status,
    tags: parseTags(form.tags),
    aiBrief: form.aiBrief,
    globalPromptRules: form.globalPromptRules,
    customStyleDescription: form.customStyleDescription,
    coverImageUrl: form.coverImageUrl,
  }) !== JSON.stringify({
    title: project.title,
    description: project.description ?? '',
    clientName: project.client_name ?? '',
    style: project.style ?? '',
    status: project.status,
    tags: project.tags ?? [],
    aiBrief: project.ai_brief ?? '',
    globalPromptRules: project.global_prompt_rules ?? '',
    customStyleDescription: project.custom_style_description ?? '',
    coverImageUrl: project.cover_image_url ?? '',
  }), [form, project]);

  function updateField<Key extends keyof ProjectSettingsFormState>(key: Key, value: ProjectSettingsFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    saveMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      client_name: form.clientName.trim() || null,
      style: (form.style || null) as ProjectUpdate['style'],
      status: form.status as ProjectUpdate['status'],
      tags: parseTags(form.tags),
      ai_brief: form.aiBrief.trim() || null,
      global_prompt_rules: form.globalPromptRules.trim() || null,
      custom_style_description: form.customStyleDescription.trim() || null,
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadCoverMutation.mutate(file);
    event.target.value = '';
  }

  return (
    <WorkspaceSettingsModal
      isOpen={isOpen}
      activeSection={activeSection}
      title="Ajustes del proyecto"
      nav={NAV}
      onClose={onClose}
      onSelectSection={onSelectSection}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{project.title}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Configura este proyecto sin salir del flujo</h1>
          </div>
          <Button color="primary" className="h-10 rounded-xl px-4 text-sm font-semibold" isDisabled={!hasChanges || !form.title.trim() || isSaving} onPress={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>

        {activeSection === 'general' ? (
          <div className="space-y-6">
            <SectionHeader title="Identidad" description="Lo esencial del proyecto, como se presenta y como se clasifica dentro del workspace." />

            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {form.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverImageUrl} alt={project.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]">
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground/30" />
                      <p className="mt-3 text-sm text-muted-foreground">Todavia no hay portada</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent-soft-hover">
                  <Upload className="h-4 w-4 text-primary" />
                  {uploadCoverMutation.isPending ? 'Subiendo...' : 'Subir portada'}
                </button>
                <button type="button" onClick={() => deleteCoverMutation.mutate()} disabled={!form.coverImageUrl || deleteCoverMutation.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent-soft-hover disabled:opacity-50">
                  <Trash2 className="h-4 w-4 text-danger" />
                  Quitar portada
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Titulo</label>
                <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className={fieldClassName} placeholder="Nombre del proyecto" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <input value={form.clientName} onChange={(event) => updateField('clientName', event.target.value)} className={fieldClassName} placeholder="Cliente o marca" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Estado</label>
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className={fieldClassName}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Estilo base</label>
                <select value={form.style} onChange={(event) => updateField('style', event.target.value)} className={fieldClassName}>
                  <option value="">Sin definir</option>
                  {STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Descripcion</label>
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className={cn(fieldClassName, 'min-h-28 resize-y')} placeholder="Objetivo, tono y resultado esperado" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Tags</label>
              <input value={form.tags} onChange={(event) => updateField('tags', event.target.value)} className={fieldClassName} placeholder="campana, lanzamiento, vertical" />
              <p className="mt-2 text-xs text-muted-foreground">Separa etiquetas por comas.</p>
            </div>
          </div>
        ) : null}

        {activeSection === 'ia' ? (
          <div className="space-y-6">
            <SectionHeader title="Contexto creativo para IA" description="La informacion que la IA usa para proponer tareas, prompts y direccion del proyecto." />
            <div>
              <label className="text-sm font-medium text-foreground">Briefing del proyecto</label>
              <textarea value={form.aiBrief} onChange={(event) => updateField('aiBrief', event.target.value)} rows={5} className={cn(fieldClassName, 'min-h-32 resize-y')} placeholder="Que busca el proyecto, a quien va dirigido y que debe optimizar la IA" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Reglas globales de prompts</label>
              <textarea value={form.globalPromptRules} onChange={(event) => updateField('globalPromptRules', event.target.value)} rows={5} className={cn(fieldClassName, 'min-h-32 resize-y font-mono text-[13px] leading-6')} placeholder="Consistencia visual, restricciones, camara, vestuario, composicion" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripcion de estilo personalizada</label>
              <textarea value={form.customStyleDescription} onChange={(event) => updateField('customStyleDescription', event.target.value)} rows={4} className={cn(fieldClassName, 'min-h-28 resize-y')} placeholder="Matices extra sobre el estilo base del proyecto" />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Consejo operativo</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Cuanto mejor definas briefing, reglas y estilo, mas consistente sera la ayuda de Kiyoko al crear tareas, prompts, personajes o fondos.</p>
            </div>
          </div>
        ) : null}
      </div>
    </WorkspaceSettingsModal>
  );
}
