'use client';

import { useEffect, useMemo, useState, type Key } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Description, Input, Label, ListBox, Select, TextArea, TextField } from '@heroui/react';
import { ClipboardList, FolderKanban, Loader2, Plus, Sparkles, Video, WandSparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useProjectQuery } from '@/hooks/queries/useProjectQuery';
import { useVideoQuery } from '@/hooks/queries/useVideoQuery';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { fetchWorkspaceVideos } from '@/lib/queries/videos';
import { createWorkspaceTask } from '@/lib/queries/tasks';
import { queryKeys } from '@/lib/query/keys';
import { buildTaskSuggestions } from '@/lib/tasks/suggestions';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import type { TaskCategory, TaskPriority } from '@/types';

interface TaskPanelForm {
  projectId: string;
  videoId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
}

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'script', label: 'Guion' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'image_gen', label: 'Imagen' },
  { value: 'video_gen', label: 'Video' },
  { value: 'review', label: 'Revision' },
  { value: 'export', label: 'Exportacion' },
  { value: 'meeting', label: 'Reunion' },
  { value: 'voiceover', label: 'Locucion' },
  { value: 'editing', label: 'Edicion' },
  { value: 'issue', label: 'Incidencia' },
  { value: 'annotation', label: 'Anotacion' },
  { value: 'other', label: 'Otro' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];
const NO_PROJECT_KEY = '__none__project';
const NO_VIDEO_KEY = '__none__';

function createEmptyForm(projectId = '', videoId = ''): TaskPanelForm {
  return {
    projectId,
    videoId,
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    dueDate: '',
  };
}

export function TaskCreatePanel() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const params = useParams<{ shortId?: string; videoShortId?: string }>();
  const { user } = useDashboard();
  const open = useUIStore((state) => state.taskCreatePanelOpen);
  const draft = useUIStore((state) => state.taskCreateDraft);
  const closePanel = useUIStore((state) => state.closeTaskCreatePanel);

  const routeShortId = typeof params.shortId === 'string' ? params.shortId : undefined;
  const routeVideoShortId = typeof params.videoShortId === 'string' ? params.videoShortId : undefined;
  const currentProjectState = useProjectQuery(routeShortId);
  const currentVideoState = useVideoQuery(routeVideoShortId);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.workspace(),
    queryFn: () => fetchWorkspaceProjects(supabase),
    enabled: open,
    staleTime: 60_000,
  });

  const [form, setForm] = useState<TaskPanelForm>(createEmptyForm());
  const [didInit, setDidInit] = useState(false);
  const fieldClassName = "[&_input]:bg-background/95 [&_input]:border-border [&_input]:text-foreground [&_input]:shadow-none [&_input]:placeholder:text-muted-foreground [&_input]:hover:border-foreground/15 [&_input]:focus-visible:border-primary/45 [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-primary/20 [&_textarea]:bg-background/95 [&_textarea]:border-border [&_textarea]:text-foreground [&_textarea]:shadow-none [&_textarea]:placeholder:text-muted-foreground [&_textarea]:hover:border-foreground/15 [&_textarea]:focus-visible:border-primary/45 [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20 [&_[data-slot='trigger']]:bg-background/95 [&_[data-slot='trigger']]:border-border [&_[data-slot='trigger']]:text-foreground [&_[data-slot='trigger']]:shadow-none [&_[data-slot='trigger']]:hover:border-foreground/15 [&_[data-slot='trigger']]:focus-within:border-primary/45 [&_[data-slot='trigger']]:focus-within:ring-2 [&_[data-slot='trigger']]:focus-within:ring-primary/20";

  const workspaceProjects = projectsQuery.data ?? [];
  const workspaceProjectIds = useMemo(() => workspaceProjects.map((project) => project.id).sort(), [workspaceProjects]);
  const shouldWaitForRouteProject = Boolean(routeShortId) && currentProjectState.isLoading;
  const shouldWaitForRouteVideo = Boolean(routeVideoShortId) && currentVideoState.isLoading;

  useEffect(() => {
    if (!open) {
      setDidInit(false);
      setForm(createEmptyForm());
      return;
    }

    if (didInit || !projectsQuery.isSuccess || shouldWaitForRouteProject || shouldWaitForRouteVideo) return;

    const defaultProjectId = draft.projectId ?? currentProjectState.project?.id ?? workspaceProjects[0]?.id ?? '';
    const defaultVideoId = draft.videoId ?? currentVideoState.video?.id ?? '';

    setForm({
      projectId: defaultProjectId,
      videoId: defaultVideoId,
      title: draft.title ?? '',
      description: draft.description ?? '',
      category: draft.category ?? 'other',
      priority: draft.priority ?? 'medium',
      dueDate: draft.dueDate ?? '',
    });
    setDidInit(true);
  }, [
    currentProjectState.project?.id,
    currentProjectState.isLoading,
    currentVideoState.video?.id,
    currentVideoState.isLoading,
    didInit,
    draft.category,
    draft.description,
    draft.dueDate,
    draft.priority,
    draft.projectId,
    draft.title,
    draft.videoId,
    open,
    projectsQuery.isSuccess,
    shouldWaitForRouteProject,
    shouldWaitForRouteVideo,
    workspaceProjects,
  ]);

  const selectedVideosQuery = useQuery({
    queryKey: ['task-create-panel', 'videos', ...workspaceProjectIds],
    queryFn: async () => {
      return fetchWorkspaceVideos(supabase, workspaceProjectIds);
    },
    enabled: open && projectsQuery.isSuccess && workspaceProjectIds.length > 0,
    staleTime: 60_000,
  });

  const selectedVideos = useMemo(() => {
    return (selectedVideosQuery.data ?? []).filter((video) => video.project_id === form.projectId);
  }, [form.projectId, selectedVideosQuery.data]);

  useEffect(() => {
    if (!form.videoId) return;
    if (selectedVideos.some((video) => video.id === form.videoId)) return;
    setForm((current) => ({ ...current, videoId: '' }));
  }, [form.videoId, selectedVideos]);

  const suggestions = useMemo(() => {
    return buildTaskSuggestions({
      project: currentProjectState.project,
      videos: currentProjectState.videos,
      currentVideo: currentVideoState.video,
      scenes: currentVideoState.scenes,
      analysis: currentVideoState.analysis,
      narration: currentVideoState.narration,
    });
  }, [
    currentProjectState.project,
    currentProjectState.videos,
    currentVideoState.analysis,
    currentVideoState.narration,
    currentVideoState.scenes,
    currentVideoState.video,
  ]);

  const selectedProject = workspaceProjects.find((project) => project.id === form.projectId) ?? null;
  const selectedVideo = selectedVideos.find((video) => video.id === form.videoId) ?? null;

  const createTaskMutation = useMutation({
    mutationFn: async () => createWorkspaceTask(supabase, {
      project_id: form.projectId,
      video_id: form.videoId || null,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      due_date: form.dueDate,
      created_by: user.id,
    }),
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(task.project_id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dashboard(user.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(user.id) }),
      ]);
      toast.success('Tarea creada correctamente');
      closePanel();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'No se pudo crear la tarea');
    },
  });

  function updateField<K extends keyof TaskPanelForm>(field: K, value: TaskPanelForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applySuggestion(index: number) {
    const item = suggestions[index];
    if (!item) return;

    setForm((current) => ({
      ...current,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      videoId: item.videoId ?? current.videoId,
      projectId: current.projectId || currentProjectState.project?.id || current.projectId,
    }));
  }

  function handleClose() {
    closePanel();
  }

  function openFullPage() {
    const search = new URLSearchParams();
    if (form.projectId) search.set('projectId', form.projectId);
    if (form.videoId) search.set('videoId', form.videoId);
    handleClose();
    router.push(`/dashboard/tasks/new${search.toString() ? `?${search.toString()}` : ''}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex h-[min(860px,92vh)] w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-3">
          <Button isIconOnly variant="ghost" size="sm" onPress={handleClose} aria-label="Cerrar modal" className="text-foreground/70 hover:bg-accent hover:text-foreground">
            <X size={16} />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <ClipboardList className="size-3.5 text-primary" />
              <span className="truncate uppercase tracking-[0.14em]">Nueva tarea</span>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <section className="kiyoko-panel-section space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Crear tarea</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                    Crea una tarea manual con contexto de proyecto y video, o usa sugerencias calculadas a partir del estado actual del trabajo.
                  </p>
                </div>
                <span className="kiyoko-panel-chip shrink-0 text-[10px] uppercase tracking-[0.12em]">
                  Personal
                </span>
              </div>
            </section>

            <section className="kiyoko-panel-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Contexto operativo</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    La tarea puede quedar vinculada a un proyecto completo o a un video especifico.
                  </p>
                </div>
                <span className="kiyoko-panel-chip max-w-60 truncate text-[10px] uppercase tracking-[0.12em]">
                  {draft.source ?? (routeVideoShortId ? 'video' : routeShortId ? 'proyecto' : 'workspace')}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <Select
                  variant="secondary"
                  aria-label="Proyecto"
                  selectedKey={form.projectId || NO_PROJECT_KEY}
                  onSelectionChange={(key: Key | null) => setForm((current) => ({ ...current, projectId: key === NO_PROJECT_KEY ? '' : ((key as string | null) ?? ''), videoId: '' }))}
                  isDisabled={projectsQuery.isLoading || workspaceProjects.length === 0}
                  className={cn(fieldClassName, 'w-full')}
                >
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Proyecto</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item key={NO_PROJECT_KEY} id={NO_PROJECT_KEY}>Selecciona un proyecto</ListBox.Item>
                      {workspaceProjects.map((project) => (
                        <ListBox.Item key={project.id} id={project.id}>{project.title}</ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  variant="secondary"
                  aria-label="Video"
                  selectedKey={form.videoId || NO_VIDEO_KEY}
                  onSelectionChange={(key: Key | null) => updateField('videoId', key === NO_VIDEO_KEY ? '' : ((key as string | null) ?? ''))}
                  isDisabled={!form.projectId || selectedVideosQuery.isLoading}
                  className={cn(fieldClassName, 'w-full')}
                >
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Video</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item key={NO_VIDEO_KEY} id={NO_VIDEO_KEY}>Sin vincular a video</ListBox.Item>
                      {selectedVideos.map((video) => (
                        <ListBox.Item key={video.id} id={video.id}>{video.title}</ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                {form.projectId ? (
                  <p className="text-xs text-muted-foreground">
                    {selectedVideosQuery.isError
                      ? 'No se pudieron cargar los videos del workspace.'
                      : selectedVideosQuery.isLoading
                      ? 'Cargando videos del proyecto...'
                      : selectedVideos.length > 0
                        ? `${selectedVideos.length} videos disponibles para vincular.`
                        : 'Este proyecto no tiene videos disponibles todavia.'}
                  </p>
                ) : null}

                <TextField variant="secondary" value={form.title} onChange={(value) => updateField('title', value)} isRequired className={fieldClassName}>
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Titulo</Label>
                  <Input placeholder="Ej. Revisar prompts del video principal" autoFocus />
                  <Description className="text-xs leading-5 text-muted-foreground">Define una accion concreta y facil de escanear.</Description>
                </TextField>

                <TextField variant="secondary" value={form.description} onChange={(value) => updateField('description', value)} className={cn(fieldClassName, '[&_textarea]:min-h-28')}>
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Descripcion</Label>
                  <TextArea placeholder="Que hay que hacer, por que y que resultado se espera" rows={3} />
                </TextField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    variant="secondary"
                    aria-label="Categoria"
                    selectedKey={form.category}
                    onSelectionChange={(key: Key | null) => {
                      if (key) updateField('category', key as TaskCategory);
                    }}
                    className={cn(fieldClassName, 'w-full')}
                  >
                    <Label className="mb-1.5 text-[13px] font-medium text-foreground">Categoria</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {CATEGORY_OPTIONS.map((option) => (
                          <ListBox.Item key={option.value} id={option.value}>{option.label}</ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Select
                    variant="secondary"
                    aria-label="Prioridad"
                    selectedKey={form.priority}
                    onSelectionChange={(key: Key | null) => {
                      if (key) updateField('priority', key as TaskPriority);
                    }}
                    className={cn(fieldClassName, 'w-full')}
                  >
                    <Label className="mb-1.5 text-[13px] font-medium text-foreground">Prioridad</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {PRIORITY_OPTIONS.map((option) => (
                          <ListBox.Item key={option.value} id={option.value}>{option.label}</ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <TextField variant="secondary" value={form.dueDate} onChange={(value) => updateField('dueDate', value)} className={fieldClassName}>
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Fecha limite</Label>
                  <Input type="date" />
                </TextField>
              </div>
            </section>

            <section className="kiyoko-panel-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Sugerencias de tarea</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Si estas dentro de un proyecto o video, analizamos su estado para proponerte las siguientes acciones utiles.
                  </p>
                </div>
                <span className="kiyoko-panel-chip text-[10px] uppercase tracking-[0.12em]">
                  {suggestions.length} sugerencias
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {suggestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground md:col-span-2">
                    Abre este panel desde un proyecto o desde un video para obtener sugerencias mas precisas, o completa la tarea manualmente.
                  </div>
                ) : suggestions.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-border bg-background/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          <WandSparkles className="h-3 w-3 text-primary" />
                          {item.priority}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                      </div>
                      {item.videoId ? <Video className="mt-0.5 h-4 w-4 text-primary" /> : <FolderKanban className="mt-0.5 h-4 w-4 text-primary" />}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.rationale}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {item.category}
                      </span>
                      <Button variant="secondary" className="kiyoko-panel-secondary-button" onPress={() => applySuggestion(index)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Usar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-background/85 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Plus className="size-4 text-primary" />
                Resumen rapido
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Proyecto</p>
                  <p className="mt-1 font-medium text-foreground">{selectedProject?.title ?? 'Sin seleccionar'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Video</p>
                  <p className="mt-1 font-medium text-foreground">{selectedVideo?.title ?? 'No vinculado'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Prioridad</p>
                  <p className="mt-1 font-medium text-foreground">{PRIORITY_OPTIONS.find((item) => item.value === form.priority)?.label ?? 'Media'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">
            {form.videoId ? 'La tarea quedara vinculada tambien a un video.' : 'La tarea se asociara solo al proyecto.'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onPress={openFullPage}>Abrir en grande</Button>
            <Button variant="ghost" onPress={handleClose}>Cancelar</Button>
            <Button color="primary" onPress={() => createTaskMutation.mutate()} isDisabled={!form.projectId || !form.title.trim() || createTaskMutation.isPending}>
              {createTaskMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Crear tarea
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}