'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Calendar, Input, Popover, TextArea, TextField } from '@heroui/react';
import { parseDate, type CalendarDate } from '@internationalized/date';
import {
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Copy,
  FileText,
  FolderKanban,
  ImagePlus,
  Languages,
  Loader2,
  MoreHorizontal,
  Palette,
  PanelRight,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Video,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { FileUpload } from '@/components/shared/FileUpload';
import { ModalShell } from '@/components/modals/shared/ModalShell';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { fetchVideosByProject } from '@/lib/queries/videos';
import { createWorkspaceTask, fetchTaskWorkspace, fetchWorkspaceTasks, updateTaskWorkspace } from '@/lib/queries/tasks';
import { TaskDocumentEditor } from '@/components/tasks/TaskDocumentEditor';
import {
  createEmptyTaskWorkspacePage,
  readTaskWorkspacePage,
  writeTaskWorkspacePage,
  type TaskDocumentDensity,
  type TaskDocumentWidth,
  type TaskPromptItem,
  type TaskWorkspacePageData,
} from '@/lib/tasks/workspace';
import type { TaskCategory, TaskPriority, TaskStatus } from '@/types';

interface TaskWorkspacePageProps {
  taskId?: string;
  initialProjectId?: string;
  initialVideoId?: string;
}

interface TaskWorkspaceFormState {
  projectId: string;
  videoId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  page: TaskWorkspacePageData;
}

type PromptTranslationDirection = 'es-to-en' | 'en-to-es';

type ChromeTranslator = {
  translate: (text: string) => Promise<string>;
};

type ChromeTranslatorWindow = Window & {
  Translator?: {
    create: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<ChromeTranslator>;
  };
};

interface ChipOption<T extends string> { value: T; label: string; color: string }

const CATEGORY_OPTIONS: ChipOption<TaskCategory>[] = [
  { value: 'script', label: 'Guion', color: 'bg-blue-500/15 text-blue-400' },
  { value: 'prompt', label: 'Prompt', color: 'bg-violet-500/15 text-violet-400' },
  { value: 'image_gen', label: 'Imagen', color: 'bg-pink-500/15 text-pink-400' },
  { value: 'video_gen', label: 'Video', color: 'bg-cyan-500/15 text-cyan-400' },
  { value: 'review', label: 'Revision', color: 'bg-amber-500/15 text-amber-400' },
  { value: 'export', label: 'Exportacion', color: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'meeting', label: 'Reunion', color: 'bg-orange-500/15 text-orange-400' },
  { value: 'voiceover', label: 'Locucion', color: 'bg-rose-500/15 text-rose-400' },
  { value: 'editing', label: 'Edicion', color: 'bg-indigo-500/15 text-indigo-400' },
  { value: 'issue', label: 'Incidencia', color: 'bg-red-500/15 text-red-400' },
  { value: 'annotation', label: 'Anotacion', color: 'bg-teal-500/15 text-teal-400' },
  { value: 'other', label: 'Otro', color: 'bg-zinc-500/15 text-zinc-400' },
];

const PRIORITY_OPTIONS: ChipOption<TaskPriority>[] = [
  { value: 'low', label: 'Baja', color: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'medium', label: 'Media', color: 'bg-amber-500/15 text-amber-400' },
  { value: 'high', label: 'Alta', color: 'bg-orange-500/15 text-orange-400' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500/15 text-red-400' },
];

const STATUS_OPTIONS: ChipOption<TaskStatus>[] = [
  { value: 'pending', label: 'Por hacer', color: 'bg-zinc-500/15 text-zinc-400' },
  { value: 'in_progress', label: 'En progreso', color: 'bg-amber-500/15 text-amber-400' },
  { value: 'in_review', label: 'En revision', color: 'bg-blue-500/15 text-blue-400' },
  { value: 'blocked', label: 'Bloqueada', color: 'bg-red-500/15 text-red-400' },
  { value: 'completed', label: 'Completada', color: 'bg-emerald-500/15 text-emerald-400' },
];

const COVER_PRESETS = [
  'linear-gradient(135deg, rgba(0,111,238,0.18), rgba(14,165,164,0.12))',
  'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(244,63,94,0.12))',
  'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.12))',
  'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.12))',
];
const DOCUMENT_WIDTH_OPTIONS: { value: TaskDocumentWidth; label: string }[] = [
  { value: 'default', label: 'Normal' },
  { value: 'wide', label: 'Ancho' },
];
const DOCUMENT_DENSITY_OPTIONS: { value: TaskDocumentDensity; label: string }[] = [
  { value: 'comfortable', label: 'Aireado' },
  { value: 'compact', label: 'Compacto' },
];

function createInitialState(projectId = '', videoId = ''): TaskWorkspaceFormState {
  return {
    projectId,
    videoId,
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    page: createEmptyTaskWorkspacePage(),
  };
}

function createPromptId() {
  return `prompt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TaskWorkspacePage({ taskId, initialProjectId = '', initialVideoId = '' }: TaskWorkspacePageProps) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useDashboard();
  const [form, setForm] = useState<TaskWorkspaceFormState>(() => createInitialState(initialProjectId, initialVideoId));
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [promptDraftTitle, setPromptDraftTitle] = useState('');
  const [promptDraftContent, setPromptDraftContent] = useState('');
  const [promptTranslation, setPromptTranslation] = useState('');
  const [promptTranslationDirection, setPromptTranslationDirection] = useState<PromptTranslationDirection>('en-to-es');
  const [isTranslatingPrompt, setIsTranslatingPrompt] = useState(false);
  const [isChromeTranslatorAvailable, setIsChromeTranslatorAvailable] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('Hazlo mas claro, mas util y mejor estructurado');
  const [aiSourceText, setAiSourceText] = useState('');
  const [aiSelectionPreview, setAiSelectionPreview] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState('');

  const [propertiesPanel, setPropertiesPanel] = useState(false);

  const taskQuery = useQuery({
    queryKey: taskId ? queryKeys.tasks.detail(taskId) : ['tasks', 'detail', 'new'],
    queryFn: () => fetchTaskWorkspace(supabase, taskId!),
    enabled: Boolean(taskId),
  });

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.workspace(),
    queryFn: () => fetchWorkspaceProjects(supabase),
    enabled: Boolean(user.id),
    staleTime: 60_000,
  });

  const videosQuery = useQuery({
    queryKey: queryKeys.videos.byProject(form.projectId || '__none__'),
    queryFn: () => fetchVideosByProject(supabase, form.projectId),
    enabled: Boolean(form.projectId),
    staleTime: 60_000,
  });

  const applyResolvedFormState = useCallback((nextState: TaskWorkspaceFormState) => {
    setForm(nextState);
    setLastSavedSnapshot(JSON.stringify(nextState));
    setHasInitialized(true);
  }, []);

  const clearInvalidVideoSelection = useCallback(() => {
    setForm((current) => ({ ...current, videoId: '' }));
  }, []);

  useEffect(() => {
    if (hasInitialized) return;

    if (taskQuery.data) {
      const page = readTaskWorkspacePage(taskQuery.data.metadata);
      const nextState: TaskWorkspaceFormState = {
        projectId: taskQuery.data.project_id,
        videoId: taskQuery.data.video_id ?? '',
        title: taskQuery.data.title,
        description: taskQuery.data.description ?? '',
        category: taskQuery.data.category,
        priority: taskQuery.data.priority,
        status: taskQuery.data.status,
        dueDate: taskQuery.data.due_date ?? '',
        page,
      };
      applyResolvedFormState(nextState);
      return;
    }

    if (!taskId && projectsQuery.isSuccess) {
      const fallbackProjectId = initialProjectId || projectsQuery.data?.[0]?.id || '';
      const nextState = createInitialState(fallbackProjectId, initialVideoId);
      applyResolvedFormState(nextState);
    }
  }, [applyResolvedFormState, hasInitialized, initialProjectId, initialVideoId, projectsQuery.data, projectsQuery.isSuccess, taskId, taskQuery.data]);

  const videos = useMemo(() => videosQuery.data ?? [], [videosQuery.data]);
  const projectOptions = useMemo(
    () => (projectsQuery.data ?? []).map((project) => ({ id: project.id, label: project.title })),
    [projectsQuery.data],
  );
  const videoOptions = useMemo(
    () => videos.map((video) => ({ id: video.id, label: video.title })),
    [videos],
  );

  useEffect(() => {
    if (!form.videoId) return;
    if (videos.some((video) => video.id === form.videoId)) return;
    clearInvalidVideoSelection();
  }, [clearInvalidVideoSelection, form.videoId, videos]);

  useEffect(() => {
    setIsChromeTranslatorAvailable(Boolean((window as ChromeTranslatorWindow).Translator?.create));
  }, []);

  const snapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = hasInitialized && snapshot !== lastSavedSnapshot;

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!form.projectId) throw new Error('Selecciona un proyecto');
      if (!form.title.trim()) throw new Error('Escribe un titulo');

      const payload = {
        project_id: form.projectId,
        video_id: form.videoId || null,
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        priority: form.priority,
        due_date: form.dueDate || undefined,
        created_by: user.id,
        metadata: writeTaskWorkspacePage(null, form.page),
      };

      console.log('[createTask] payload:', JSON.stringify(payload, null, 2));

      try {
        const result = await createWorkspaceTask(supabase, payload);
        console.log('[createTask] OK:', result);
        return result;
      } catch (err) {
        console.error('[createTask] FAILED:', err);
        throw err;
      }
    },
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dashboard(user.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(task.project_id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(user.id) }),
      ]);
      toast.success('Tarea creada');
      router.replace(`/dashboard/tasks/${task.id}`);
    },
    onError: (error: Error) => {
      console.error('[createTask] onError:', error);
      toast.error(error.message || 'No se pudo crear la tarea');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: () =>
      updateTaskWorkspace(supabase, taskId!, {
        project_id: form.projectId,
        video_id: form.videoId || null,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        status: form.status,
        due_date: form.dueDate || null,
        metadata: writeTaskWorkspacePage(taskQuery.data?.metadata ?? null, form.page),
      }),
    onSuccess: async (task) => {
      setLastSavedSnapshot(JSON.stringify(form));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(task.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dashboard(user.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(task.project_id) }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'No se pudo guardar la tarea');
    },
  });

  const selectedProject = (projectsQuery.data ?? []).find((project) => project.id === form.projectId) ?? null;
  const selectedVideo = videos.find((video) => video.id === form.videoId) ?? null;
  const relatedTasksQuery = useQuery({
    queryKey: form.projectId ? queryKeys.tasks.byProject(form.projectId) : ['tasks', 'project', 'empty'],
    queryFn: async () => {
      const tasks = await fetchWorkspaceTasks(supabase, form.projectId ? [form.projectId] : []);
      return tasks.filter((task) => task.id !== taskId).slice(0, 6);
    },
    enabled: Boolean(form.projectId),
    staleTime: 60_000,
  });

  const buildTaskContext = useCallback(() => {
    const parts: string[] = [];
    if (selectedProject) parts.push(`Proyecto: "${selectedProject.title}" (estilo: ${(selectedProject as Record<string, unknown>).style ?? 'sin definir'})`);
    if (selectedVideo) parts.push(`Video: "${selectedVideo.title}"`);
    parts.push(`Tarea: "${form.title || 'Sin titulo'}" — ${form.description || 'sin descripcion'}`);
    parts.push(`Categoria: ${form.category}, Prioridad: ${form.priority}, Estado: ${form.status}`);
    const related = relatedTasksQuery.data;
    if (related && related.length > 0) {
      parts.push(`Tareas existentes en el proyecto: ${related.map((t) => t.title).join(', ')}`);
    }
    return parts.join('\n');
  }, [selectedProject, selectedVideo, form.title, form.description, form.category, form.priority, form.status, relatedTasksQuery.data]);

  const improvePromptMutation = useMutation({
    mutationFn: async ({ prompt, instruction, actionLabel }: { prompt: string; instruction?: string; actionLabel?: string }) => {
      const context = buildTaskContext();
      const fullInstruction = [
        instruction,
        `\n\nContexto de la tarea (usa esto para dar respuestas relevantes, proponer lo que falta, sugerir siguientes pasos):\n${context}`,
      ].filter(Boolean).join('\n');

      const response = await fetch('/api/ai/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          instruction: fullInstruction,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'No se pudo mejorar el texto con IA');
      }

      return {
        ...(payload as { improved_prompt: string; improvements?: Array<{ text: string }> }),
        actionLabel,
      };
    },
    onError: (error: Error) => {
      toast.error(error.message || 'No se pudo usar la ayuda IA');
    },
  });

  useEffect(() => {
    if (!taskId || !isDirty) return;

    const timeoutId = window.setTimeout(() => {
      updateTaskMutation.mutate();
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [isDirty, snapshot, taskId, updateTaskMutation]);

  function updateField<K extends keyof TaskWorkspaceFormState>(field: K, value: TaskWorkspaceFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openPromptEditor(prompt?: TaskPromptItem) {
    setEditingPromptId(prompt?.id ?? null);
    setPromptDraftTitle(prompt?.title ?? '');
    setPromptDraftContent(prompt?.content ?? '');
    setPromptTranslation('');
    setPromptTranslationDirection('en-to-es');
    setPromptEditorOpen(true);
  }

  function closePromptEditor() {
    setPromptEditorOpen(false);
    setEditingPromptId(null);
    setPromptDraftTitle('');
    setPromptDraftContent('');
    setPromptTranslation('');
    setPromptTranslationDirection('en-to-es');
  }

  const translatePrompt = useCallback(async (direction: PromptTranslationDirection) => {
    const text = promptDraftContent.trim();
    if (!text) {
      toast.error('Escribe un prompt antes de traducirlo');
      return;
    }

    setIsTranslatingPrompt(true);
    setPromptTranslationDirection(direction);

    try {
      const translatorApi = (window as ChromeTranslatorWindow).Translator;
      if (!translatorApi?.create) {
        setIsChromeTranslatorAvailable(false);
        return;
      }

      const translator = await translatorApi.create({
        sourceLanguage: direction === 'es-to-en' ? 'es' : 'en',
        targetLanguage: direction === 'es-to-en' ? 'en' : 'es',
      });
      const translated = await translator.translate(text);
      setPromptTranslation(translated);
    } catch {
      toast.error('No se pudo traducir el prompt');
    } finally {
      setIsTranslatingPrompt(false);
    }
  }, [promptDraftContent]);

  const togglePromptTranslationDirection = useCallback(() => {
    setPromptTranslation('');
    setPromptTranslationDirection((current) => (current === 'en-to-es' ? 'es-to-en' : 'en-to-es'));
  }, []);

  function addPrompt() {
    const title = promptDraftTitle.trim();
    const content = promptDraftContent.trim();
    if (!title || !content) {
      toast.error('Pon un nombre y un contenido para guardar el prompt');
      return;
    }

    if (editingPromptId) {
      setForm((current) => ({
        ...current,
        page: {
          ...current.page,
          prompts: current.page.prompts.map((prompt) => (
            prompt.id === editingPromptId
              ? { ...prompt, title, content }
              : prompt
          )),
        },
      }));
      toast.success('Prompt actualizado');
      closePromptEditor();
      return;
    }

    const nextPrompt: TaskPromptItem = {
      id: createPromptId(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    setForm((current) => ({
      ...current,
      page: {
        ...current.page,
        prompts: [nextPrompt, ...current.page.prompts],
      },
    }));
    toast.success('Prompt guardado');
    closePromptEditor();
  }

  function removePrompt(promptId: string) {
    setForm((current) => ({
      ...current,
      page: {
        ...current.page,
        prompts: current.page.prompts.filter((prompt) => prompt.id !== promptId),
      },
    }));
    closePromptEditor();
    toast.success('Prompt eliminado');
  }

  async function copyPrompt(content: string) {
    await navigator.clipboard.writeText(content);
    toast.success('Prompt copiado');
  }


  const markAsReviewed = useCallback(() => {
    setForm((current) => ({
      ...current,
      page: {
        ...current.page,
        lastReviewedAt: new Date().toISOString(),
      },
    }));
    toast.success('Marcada para revisar mas tarde');
  }, []);

  async function requestAIForSelection(selection: string, instruction?: string, actionLabel?: string) {
    const normalized = selection.trim();
    if (!normalized) {
      toast.error('Selecciona texto dentro de la nota para pedir ayuda a la IA');
      return '';
    }

    setAiSelectionPreview(normalized);
    setAiSourceText(normalized);
    const payload = await improvePromptMutation.mutateAsync({
      prompt: normalized,
      instruction: instruction?.trim() || aiInstruction.trim() || undefined,
      actionLabel,
    });

    const improvedText = payload.improved_prompt.trim();
    if (improvedText) {
      toast.success(`La IA ha completado: ${payload.actionLabel?.trim() || actionLabel || 'Seleccion mejorada'}`);
    }

    return improvedText;
  }

  async function runAIFromSidebar() {
    const prompt = aiSourceText.trim() || promptDraftContent.trim() || form.page.text.trim();
    if (!prompt) {
      toast.error('Escribe o selecciona algo para que la IA pueda ayudarte');
      return;
    }

    setAiSelectionPreview(prompt);
    const payload = await improvePromptMutation.mutateAsync({ prompt, instruction: aiInstruction.trim() || undefined, actionLabel: 'Prompt libre' });
    const improvedText = payload.improved_prompt.trim();
    if (!improvedText) return;

    setPromptDraftContent(improvedText);
    setPromptTranslation('');
    if (!promptEditorOpen) {
      openPromptEditor();
    }
    setForm((current) => ({
      ...current,
      page: {
        ...current.page,
        html: `${current.page.html}<section><h2>Prompt libre</h2><p>${improvedText}</p></section>`,
        text: `${current.page.text}\n\nPrompt libre\n${improvedText}`.trim(),
      },
    }));
    toast.success('La IA ha generado una propuesta en la nota');
  }



  const loading = (taskId && taskQuery.isLoading) || (!hasInitialized && !taskQuery.error);
  const isSaving = updateTaskMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-5 lg:px-6 animate-pulse">
        <div className="h-18 rounded-2xl border border-border bg-card" />
        <div className="h-10 rounded-xl border border-border bg-card" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="h-[70vh] rounded-2xl border border-border bg-card" />
          <div className="h-[70vh] rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (taskId && taskQuery.error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-medium text-foreground">No se pudo cargar la tarea</p>
        <p className="max-w-md text-sm text-muted-foreground">Puede que ya no exista o que no tengas acceso al proyecto.</p>
        <Link href="/dashboard/tasks" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          Volver a tareas
        </Link>
      </div>
    );
  }

  const findOption = <T extends string>(options: ChipOption<T>[], value: T) => options.find((o) => o.value === value);

  return (
    <div className="flex h-full">
      {/* ── Main scrollable area ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover */}
        <div className="group/cover relative h-36 w-full" style={{ background: form.page.cover ?? COVER_PRESETS[0] }}>
          <Popover>
            <Popover.Trigger>
              <button type="button" className="absolute right-4 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/cover:opacity-100">
                <Palette className="size-3" />Cambiar cover
              </button>
            </Popover.Trigger>
            <Popover.Content className="w-64 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
              <p className="px-3 pt-2.5 pb-2 text-[11px] font-medium text-muted-foreground">Cover</p>
              <div className="grid grid-cols-4 gap-2 px-3 pb-3">
                {COVER_PRESETS.map((preset) => (
                  <button key={preset} type="button" onClick={() => setForm((c) => ({ ...c, page: { ...c.page, cover: preset } }))} className={preset === form.page.cover ? 'h-10 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background' : 'h-10 rounded-lg border border-border/50 hover:opacity-80'} style={{ background: preset }} />
                ))}
              </div>
            </Popover.Content>
          </Popover>
        </div>

        {/* Centered content */}
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 lg:px-10">
          {/* Title */}
          <input
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Sin titulo"
            className="mt-6 w-full border-none bg-transparent p-0 text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-foreground/20"
          />

          {/* Inline properties — Notion chips */}
          <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-border pb-4">
            {/* Proyecto */}
            <Popover>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><FolderKanban className="size-3" />Proyecto</span>
                <Popover.Trigger>
                  <button type="button" className="cursor-pointer rounded-md px-1.5 py-1 text-[13px] text-foreground transition-colors hover:bg-accent">
                    {selectedProject?.title ?? <span className="text-muted-foreground/60">Vacio</span>}
                  </button>
                </Popover.Trigger>
              </div>
              <Popover.Content className="w-60 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium text-muted-foreground">Selecciona un proyecto</p>
                <div className="max-h-60 overflow-y-auto px-1.5 pb-1.5">
                  <button type="button" onClick={() => setForm((c) => ({ ...c, projectId: '', videoId: '' }))} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent">Sin proyecto</button>
                  {projectOptions.map((p) => (
                    <button key={p.id} type="button" onClick={() => setForm((c) => ({ ...c, projectId: p.id, videoId: '' }))} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-accent ${form.projectId === p.id ? 'bg-accent font-medium text-foreground' : 'text-foreground'}`}>
                      <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />{p.label}
                    </button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* Video */}
            <Popover>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Video className="size-3" />Video</span>
                <Popover.Trigger>
                  <button type="button" className="cursor-pointer rounded-md px-1.5 py-1 text-[13px] text-foreground transition-colors hover:bg-accent" disabled={!form.projectId}>
                    {videosQuery.isLoading ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : selectedVideo?.title ?? <span className="text-muted-foreground/60">Vacio</span>}
                  </button>
                </Popover.Trigger>
              </div>
              <Popover.Content className="w-80 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium text-muted-foreground">Selecciona un video</p>
                <div className="max-h-60 overflow-y-auto px-1.5 pb-1.5">
                  <button type="button" onClick={() => updateField('videoId', '')} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent">Sin video</button>
                  {videoOptions.map((v) => (
                    <button key={v.id} type="button" onClick={() => updateField('videoId', v.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-accent ${form.videoId === v.id ? 'bg-accent font-medium text-foreground' : 'text-foreground'}`}>
                      <Video className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{v.label}</span>
                    </button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* Estado */}
            <Popover>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Sparkles className="size-3" />Estado</span>
                <Popover.Trigger>
                  <button type="button" className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[13px] font-medium transition-opacity hover:opacity-80 ${findOption(STATUS_OPTIONS, form.status)?.color ?? ''}`}>
                    {findOption(STATUS_OPTIONS, form.status)?.label}
                  </button>
                </Popover.Trigger>
              </div>
              <Popover.Content className="w-52 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium text-muted-foreground">Estado</p>
                <div className="px-1.5 pb-1.5">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} type="button" onClick={() => updateField('status', s.value)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium ${s.color}`}>{s.label}</span>
                      {form.status === s.value && <span className="ml-auto text-primary">&#10003;</span>}
                    </button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* Fecha */}
            <Popover>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="size-3" />Fecha limite</span>
                <Popover.Trigger>
                  <button type="button" className="cursor-pointer rounded-md px-1.5 py-1 text-[13px] text-foreground transition-colors hover:bg-accent">
                    {form.dueDate ? new Date(form.dueDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : <span className="text-muted-foreground/60">Vacio</span>}
                  </button>
                </Popover.Trigger>
              </div>
              <Popover.Content className="overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <Calendar
                  aria-label="Fecha limite"
                  className="rounded-xl bg-popover p-3"
                  value={form.dueDate ? parseDate(form.dueDate) : null}
                  onChange={(date: CalendarDate) => updateField('dueDate', date.toString())}
                >
                  <Calendar.Header className="pb-2">
                    <Calendar.Heading className="text-sm font-semibold text-foreground" />
                    <Calendar.NavButton slot="previous" className="text-muted-foreground hover:text-foreground" />
                    <Calendar.NavButton slot="next" className="text-muted-foreground hover:text-foreground" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => <Calendar.HeaderCell className="text-[11px] font-medium text-muted-foreground">{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => <Calendar.Cell date={date} className="rounded-lg text-sm text-foreground data-[outside-month=true]:text-muted-foreground/30 data-[today=true]:font-bold data-[today=true]:text-primary data-[selected=true]:bg-primary data-[selected=true]:text-white data-[selected=true]:font-semibold hover:bg-accent data-[unavailable=true]:text-muted-foreground/20 data-[unavailable=true]:line-through" />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
                {form.dueDate && (
                  <div className="border-t border-border px-3 py-2">
                    <button type="button" onClick={() => updateField('dueDate', '')} className="text-xs text-muted-foreground hover:text-foreground">Quitar fecha</button>
                  </div>
                )}
              </Popover.Content>
            </Popover>

            {/* Categoria */}
            <Popover>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><FolderKanban className="size-3" />Categoria</span>
                <Popover.Trigger>
                  <button type="button" className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[13px] font-medium transition-opacity hover:opacity-80 ${findOption(CATEGORY_OPTIONS, form.category)?.color ?? ''}`}>
                    {findOption(CATEGORY_OPTIONS, form.category)?.label}
                  </button>
                </Popover.Trigger>
              </div>
              <Popover.Content className="w-52 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium text-muted-foreground">Categoria</p>
                <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button key={c.value} type="button" onClick={() => updateField('category', c.value)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium ${c.color}`}>{c.label}</span>
                      {form.category === c.value && <span className="ml-auto text-primary">&#10003;</span>}
                    </button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* "..." toggle panel */}
            <button type="button" onClick={() => setPropertiesPanel((v) => !v)} className="mb-0.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Mas propiedades">
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Editor + Prompts sidebar */}
          <div className="mt-4 flex gap-4">
            {/* Editor */}
            <div className="min-w-0 flex-1">
              <TaskDocumentEditor
                value={form.page.html}
                onAskAI={requestAIForSelection}
                isAiLoading={improvePromptMutation.isPending}
                aiSelectionPreview={aiSelectionPreview}
                documentWidth={form.page.documentWidth}
                documentDensity={form.page.documentDensity}
                onChange={({ html, text }) => setForm((c) => ({ ...c, page: { ...c.page, html, text } }))}
              />
            </div>

            {/* Sidebar: Prompts + Reference images */}
            <div className="hidden w-64 shrink-0 xl:block">
              <div className="sticky top-4 space-y-5">
                {/* ── Prompts ── */}
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Prompts</span>
                    {form.page.prompts.length > 0 && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{form.page.prompts.length}</span>}
                  </div>

                  <button type="button" onClick={() => openPromptEditor()} className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-accent">
                    <Plus className="size-3.5" />Nueva nota prompt
                  </button>

                  <div className="mt-3 space-y-2.5">
                    {form.page.prompts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-6 text-center">
                        <p className="text-[11px] text-muted-foreground/50">Sin prompts guardados</p>
                      </div>
                    ) : form.page.prompts.map((prompt) => (
                      <button key={prompt.id} type="button" onClick={() => openPromptEditor(prompt)} className="group w-full rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/25 hover:bg-accent/30">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{prompt.title}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Nota prompt</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Abrir</span>
                        </div>
                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-[11px] leading-5 text-muted-foreground">{prompt.content}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/70">
                          <span>{new Date(prompt.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                          <span>{prompt.content.length} caracteres</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Reference files ── */}
                <div>
                  <div className="flex items-center gap-2">
                    <ImagePlus className="size-3.5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Referencias</span>
                  </div>
                  <div className="mt-2">
                    <FileUpload
                      bucket="kiyoko-storage"
                      path={`tasks/${form.projectId || 'draft'}`}
                      files={form.page.referenceFiles}
                      onChange={(files) => setForm((c) => ({ ...c, page: { ...c.page, referenceFiles: files } }))}
                      accept="image/*,.pdf"
                      maxFiles={8}
                      layout="grid"
                      compact
                      label="Subir imagen"
                      disabled={!form.projectId}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2.5 lg:px-10">
            {taskId && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {isSaving ? <><Loader2 className="size-3 animate-spin" />Guardando...</> : isDirty ? <><span className="size-1.5 rounded-full bg-yellow-500" />Sin guardar</> : <><span className="size-1.5 rounded-full bg-emerald-500" />Guardado</>}
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onPress={markAsReviewed} className="text-xs">
                <CheckCheck className="mr-1 h-3.5 w-3.5" />Revisar
              </Button>
              {taskId ? (
                <Button color="primary" size="sm" isDisabled={!isDirty || updateTaskMutation.isPending} onPress={() => updateTaskMutation.mutate()}>
                  {updateTaskMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1 h-3.5 w-3.5" />}Guardar
                </Button>
              ) : (
                <Button color="primary" size="sm" isDisabled={!form.projectId || !form.title.trim() || createTaskMutation.isPending} onPress={() => createTaskMutation.mutate()}>
                  {createTaskMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}Crear tarea
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right properties panel (Notion-style slide) ── */}
      {propertiesPanel && (
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Properties</p>
            <button type="button" onClick={() => setPropertiesPanel(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><PanelRight className="size-4" /></button>
          </div>

          <div className="divide-y divide-border px-4">
            {/* Prioridad */}
            <Popover>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-3.5" />Prioridad</span>
                <Popover.Trigger>
                  <button type="button" className={`rounded-full px-2 py-0.5 text-[12px] font-medium hover:opacity-80 ${findOption(PRIORITY_OPTIONS, form.priority)?.color ?? ''}`}>
                    {findOption(PRIORITY_OPTIONS, form.priority)?.label}
                  </button>
                </Popover.Trigger>
              </div>
              <Popover.Content className="w-44 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium text-muted-foreground">Prioridad</p>
                <div className="px-1.5 pb-1.5">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button key={p.value} type="button" onClick={() => updateField('priority', p.value)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium ${p.color}`}>{p.label}</span>
                      {form.priority === p.value && <span className="ml-auto text-primary">&#10003;</span>}
                    </button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* Ancho */}
            <Popover>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><WandSparkles className="size-3.5" />Ancho</span>
                <Popover.Trigger><button type="button" className="rounded-md px-2 py-0.5 text-xs text-foreground hover:bg-accent">{DOCUMENT_WIDTH_OPTIONS.find((o) => o.value === form.page.documentWidth)?.label ?? 'Normal'}</button></Popover.Trigger>
              </div>
              <Popover.Content className="w-40 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <div className="px-1.5 py-1.5">
                  {DOCUMENT_WIDTH_OPTIONS.map((o) => (
                    <button key={o.value} type="button" onClick={() => setForm((c) => ({ ...c, page: { ...c.page, documentWidth: o.value } }))} className={`flex w-full items-center rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-accent ${form.page.documentWidth === o.value ? 'bg-accent font-medium' : ''}`}>{o.label}{form.page.documentWidth === o.value && <span className="ml-auto text-primary">&#10003;</span>}</button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* Densidad */}
            <Popover>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><WandSparkles className="size-3.5" />Densidad</span>
                <Popover.Trigger><button type="button" className="rounded-md px-2 py-0.5 text-xs text-foreground hover:bg-accent">{DOCUMENT_DENSITY_OPTIONS.find((o) => o.value === form.page.documentDensity)?.label ?? 'Aireado'}</button></Popover.Trigger>
              </div>
              <Popover.Content className="w-40 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
                <div className="px-1.5 py-1.5">
                  {DOCUMENT_DENSITY_OPTIONS.map((o) => (
                    <button key={o.value} type="button" onClick={() => setForm((c) => ({ ...c, page: { ...c.page, documentDensity: o.value } }))} className={`flex w-full items-center rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-accent ${form.page.documentDensity === o.value ? 'bg-accent font-medium' : ''}`}>{o.label}{form.page.documentDensity === o.value && <span className="ml-auto text-primary">&#10003;</span>}</button>
                  ))}
                </div>
              </Popover.Content>
            </Popover>

            {/* Seguimiento */}
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="size-3.5" />Ultima revision</span>
              <span className="text-xs text-foreground">{form.page.lastReviewedAt ? new Date(form.page.lastReviewedAt).toLocaleDateString('es-ES') : 'Nunca'}</span>
            </div>

            {/* Autosave */}
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="size-3.5" />Autosave</span>
              <span className="text-xs text-foreground">{taskId ? (isSaving ? 'Guardando...' : isDirty ? 'Pendiente' : 'OK') : 'Tras crear'}</span>
            </div>

            {/* Relacionadas */}
            {(relatedTasksQuery.data ?? []).length > 0 && (
              <div className="py-2">
                <p className="mb-2 text-xs text-muted-foreground">Relacionadas</p>
                <div className="space-y-1.5">
                  {relatedTasksQuery.data?.map((task) => (
                    <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="block rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-accent">{task.title}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI section */}
          <div className="mt-2 space-y-2 px-4 pb-6">
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent [&::-webkit-details-marker]:hidden">
                <ChevronDown className="size-3 transition-transform group-open:rotate-180" /><WandSparkles className="size-3 text-primary" />Ayuda IA
              </summary>
              <div className="mt-1 space-y-2 pl-5">
                <TextField variant="secondary" value={aiSourceText} onChange={setAiSourceText}><TextArea placeholder="Texto base" rows={2} className="text-xs" /></TextField>
                <TextField variant="secondary" value={aiInstruction} onChange={setAiInstruction}><Input placeholder="Instruccion" className="h-7 text-xs" /></TextField>
                <Button color="primary" size="sm" className="w-full text-xs" onPress={runAIFromSidebar} isDisabled={improvePromptMutation.isPending}>
                  {improvePromptMutation.isPending ? <RefreshCw className="mr-1 size-3 animate-spin" /> : <Sparkles className="mr-1 size-3" />}
                  {improvePromptMutation.isPending ? 'Trabajando...' : 'Mejorar con IA'}
                </Button>
              </div>
            </details>
          </div>
        </aside>
      )}

      <ModalShell
        open={promptEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePromptEditor();
          }
        }}
        title={editingPromptId ? 'Editar prompt' : 'Nuevo prompt'}
        description="Guarda prompts como notas legibles y reutilizables. Desde aqui puedes revisarlos completos, editarlos o eliminarlos."
        dialogClassName="sm:max-w-150"
        footer={(
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {editingPromptId ? (
                <Button variant="ghost" color="danger" size="sm" onPress={() => removePrompt(editingPromptId)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />Eliminar
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onPress={() => void copyPrompt(promptDraftContent)} isDisabled={!promptDraftContent.trim()}>
                <Copy className="mr-1 h-3.5 w-3.5" />Copiar
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onPress={closePromptEditor}>Cancelar</Button>
              <Button color="primary" size="sm" onPress={addPrompt} isDisabled={!promptDraftTitle.trim() || !promptDraftContent.trim()}>
                {editingPromptId ? 'Guardar cambios' : 'Guardar prompt'}
              </Button>
            </div>
          </div>
        )}
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Titulo</label>
              <input
                value={promptDraftTitle}
                onChange={(e) => setPromptDraftTitle(e.target.value)}
                placeholder="Ej. Hook TikTok hero shot"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Contenido</label>
              <textarea
                value={promptDraftContent}
                onChange={(e) => {
                  setPromptDraftContent(e.target.value);
                  setPromptTranslation('');
                }}
                placeholder="Escribe el prompt completo..."
                rows={14}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/40"
              />
            </div>
          </div>

          {isChromeTranslatorAvailable ? (
            <div className="space-y-3 rounded-[24px] border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Languages className="size-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Traduccion</p>
                </div>
                <button
                  type="button"
                  onClick={togglePromptTranslationDirection}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span>{promptTranslationDirection === 'en-to-es' ? 'EN-ES' : 'ES-EN'}</span>
                  <ChevronDown className="size-3 -rotate-90 text-muted-foreground" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void translatePrompt(promptTranslationDirection)}
                disabled={isTranslatingPrompt || !promptDraftContent.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTranslatingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                Traducir
              </button>

              {promptTranslation ? (
                <div className="min-h-105 rounded-2xl bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {promptTranslationDirection === 'es-to-en' ? 'Version en ingles' : 'Version en espanol'}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {promptTranslationDirection === 'es-to-en' ? 'ES-EN' : 'EN-ES'}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                      {promptTranslation.trim().length} chars
                    </span>
                  </div>

                  <div className="mt-4 max-h-90 overflow-auto rounded-2xl border border-border/60 bg-card px-4 py-4">
                    <pre className="whitespace-pre-wrap font-mono text-[12px] leading-6 text-foreground">
                      {promptTranslation}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </ModalShell>
    </div>
  );
}
