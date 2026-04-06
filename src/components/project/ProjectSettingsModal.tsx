'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/useUIStore';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { X, Settings2, Bot } from 'lucide-react';

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Proyecto',
    items: [
      { id: 'general' as const, label: 'General', icon: Settings2 },
      { id: 'ia' as const, label: 'Contexto IA', icon: Bot },
    ],
  },
];

// ─── Input classes ───────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/10';

const LABEL_CLASS = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// ─── General section ─────────────────────────────────────────────────────────

function GeneralSection({
  form,
  setForm,
}: {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">General</h2>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Titulo *</label>
        <input
          type="text"
          required
          className={INPUT_CLASS}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Nombre del proyecto"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Cliente</label>
        <input
          type="text"
          className={INPUT_CLASS}
          value={form.client_name}
          onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
          placeholder="Nombre del cliente"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Estado</label>
        <select
          className={INPUT_CLASS}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Estilo base</label>
        <select
          className={INPUT_CLASS}
          value={form.style}
          onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
        >
          <option value="custom">None</option>
          <option value="realistic">Realistic</option>
          <option value="anime">Anime</option>
          <option value="flat_2d">Cartoon</option>
          <option value="cyberpunk">Cinematic</option>
          <option value="pixar">Minimal</option>
          <option value="watercolor">Mixed</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Descripcion</label>
        <textarea
          rows={4}
          className={INPUT_CLASS}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe brevemente el proyecto"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Tags</label>
        <input
          type="text"
          className={INPUT_CLASS}
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="Separa etiquetas por comas"
        />
      </div>
    </div>
  );
}

// ─── IA section ──────────────────────────────────────────────────────────────

function IASection({
  form,
  setForm,
}: {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">Contexto IA</h2>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Briefing del proyecto</label>
        <textarea
          rows={5}
          className={INPUT_CLASS}
          value={form.ai_brief}
          onChange={(e) => setForm((f) => ({ ...f, ai_brief: e.target.value }))}
          placeholder="Describe el briefing del proyecto para que la IA entienda el contexto"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Reglas globales de prompts</label>
        <textarea
          rows={5}
          className={cn(INPUT_CLASS, 'font-mono')}
          value={form.global_prompt_rules}
          onChange={(e) => setForm((f) => ({ ...f, global_prompt_rules: e.target.value }))}
          placeholder="Reglas que se aplicaran a todos los prompts generados"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Descripcion de estilo personalizada</label>
        <textarea
          rows={4}
          className={INPUT_CLASS}
          value={form.custom_style_description}
          onChange={(e) => setForm((f) => ({ ...f, custom_style_description: e.target.value }))}
          placeholder="Describe el estilo visual deseado en detalle"
        />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground">
        La informacion de contexto IA se utiliza para enriquecer los prompts generados
        automaticamente. Cuanto mas detallado sea el briefing, mejores resultados obtendras
        en la generacion de escenas e imagenes.
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectForm {
  title: string;
  client_name: string;
  status: string;
  style: string;
  description: string;
  tags: string;
  ai_brief: string;
  global_prompt_rules: string;
  custom_style_description: string;
}

function buildInitialForm(project: ReturnType<typeof useProject>['project']): ProjectForm {
  return {
    title: project?.title ?? '',
    client_name: project?.client_name ?? '',
    status: project?.status ?? 'draft',
    style: project?.style ?? 'custom',
    description: project?.description ?? '',
    tags: project?.tags?.join(', ') ?? '',
    ai_brief: project?.ai_brief ?? '',
    global_prompt_rules: project?.global_prompt_rules ?? '',
    custom_style_description: project?.custom_style_description ?? '',
  };
}

// ─── Section map ─────────────────────────────────────────────────────────────

type SectionId = 'general' | 'ia';

// ─── Modal ───────────────────────────────────────────────────────────────────

export function ProjectSettingsModal() {
  const {
    projectSettingsModalOpen,
    projectSettingsSection,
    closeProjectSettingsModal,
    openProjectSettingsModal,
  } = useUIStore();

  const { project } = useProject();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProjectForm>(() => buildInitialForm(project));
  const [saving, setSaving] = useState(false);

  // Sync form when project changes or modal opens
  useEffect(() => {
    if (projectSettingsModalOpen && project) {
      setForm(buildInitialForm(project));
    }
  }, [projectSettingsModalOpen, project]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeProjectSettingsModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeProjectSettingsModal]);

  const handleSave = async () => {
    if (!project) return;
    if (!form.title.trim()) {
      toast.error('El titulo es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from('projects')
        .update({
          title: form.title.trim(),
          client_name: form.client_name.trim() || null,
          status: form.status as 'draft' | 'in_progress' | 'review' | 'completed' | 'archived',
          style: form.style as 'pixar' | 'realistic' | 'anime' | 'watercolor' | 'flat_2d' | 'cyberpunk' | 'custom',
          description: form.description.trim() || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          ai_brief: form.ai_brief.trim() || null,
          global_prompt_rules: form.global_prompt_rules.trim() || null,
          custom_style_description: form.custom_style_description.trim() || null,
        })
        .eq('id', project.id);

      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(project.short_id),
      });

      toast.success('Proyecto actualizado');
      closeProjectSettingsModal();
    } catch (err) {
      toast.error('Error al guardar el proyecto');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!projectSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeProjectSettingsModal} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative flex flex-row w-[80vw] h-[85vh] rounded-xl border border-border bg-background shadow-xl overflow-hidden">
            {/* ── Left nav ──────────────────────────────────────────── */}
            <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
              <div className="px-4 pt-5 pb-2">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2">
                  Proyecto
                </p>
              </div>

              <nav className="flex-1 px-2 pb-4">
                {NAV.map((group) => (
                  <div key={group.group} className="mb-2.5">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {group.group}
                    </p>
                    {group.items.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => openProjectSettingsModal(id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] rounded-md transition-colors',
                          projectSettingsSection === id
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              {/* Save button at bottom of sidebar */}
              <div className="px-3 pb-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </aside>

            {/* ── Right content ─────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="max-w-xl mx-auto px-8 py-8">
                {projectSettingsSection === 'ia' ? (
                  <IASection form={form} setForm={setForm} />
                ) : (
                  <GeneralSection form={form} setForm={setForm} />
                )}
              </div>
            </main>

            {/* ── Close ─────────────────────────────────────────────── */}
            <button
              onClick={closeProjectSettingsModal}
              className="absolute right-3 top-3 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </button>
        </div>
      </div>
    </div>
  );
}
