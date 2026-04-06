'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@heroui/react';
import { AudioLines, MonitorPlay, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import { WorkspaceSettingsModal, type WorkspaceSettingsNavGroup } from '@/components/settings/WorkspaceSettingsModal';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import type { Video, VideoUpdate } from '@/types';

const NAV: WorkspaceSettingsNavGroup[] = [
  {
    group: 'Video',
    items: [
      { id: 'general', label: 'General', icon: Settings2 },
      { id: 'narration', label: 'Narracion', icon: AudioLines },
    ],
  },
];

const PLATFORM_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tv', label: 'TV / Cine' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'prompting', label: 'Creando prompts' },
  { value: 'generating', label: 'Generando' },
  { value: 'review', label: 'En revision' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'exported', label: 'Exportado' },
];

const VIDEO_TYPE_OPTIONS = [
  { value: 'storyboard', label: 'Storyboard' },
  { value: 'animatic', label: 'Animatic' },
  { value: 'ad', label: 'Anuncio' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Otro' },
];

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
];

const fieldClassName = 'mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/10';

interface VideoSettingsFormState {
  title: string;
  description: string;
  platform: string;
  status: string;
  videoType: string;
  aspectRatio: string;
  targetDurationSeconds: string;
  isPrimary: boolean;
  narrationProvider: string;
  narrationVoiceName: string;
  narrationStyle: string;
  narrationSpeed: string;
}

function createState(video: Video): VideoSettingsFormState {
  return {
    title: video.title,
    description: video.description ?? '',
    platform: video.platform,
    status: video.status,
    videoType: video.video_type,
    aspectRatio: video.aspect_ratio ?? '',
    targetDurationSeconds: String(video.target_duration_seconds ?? ''),
    isPrimary: Boolean(video.is_primary),
    narrationProvider: video.narration_provider ?? '',
    narrationVoiceName: video.narration_voice_name ?? '',
    narrationStyle: video.narration_style ?? '',
    narrationSpeed: String(video.narration_speed ?? ''),
  };
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function VideoSettingsModal() {
  const { project } = useProject();
  const { video, loading } = useVideo();
  const {
    videoSettingsModalOpen,
    videoSettingsSection,
    openVideoSettingsModal,
    closeVideoSettingsModal,
  } = useUIStore();

  if (!project || !video || loading) return null;

  return (
    <VideoSettingsModalContent
      key={video.id}
      projectShortId={project.short_id}
      video={video}
      isOpen={videoSettingsModalOpen}
      activeSection={videoSettingsSection}
      onClose={closeVideoSettingsModal}
      onSelectSection={openVideoSettingsModal}
    />
  );
}

function VideoSettingsModalContent({
  projectShortId,
  video,
  isOpen,
  activeSection,
  onClose,
  onSelectSection,
}: {
  projectShortId: string;
  video: Video;
  isOpen: boolean;
  activeSection: string;
  onClose: () => void;
  onSelectSection: (section?: string) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VideoSettingsFormState>(() => createState(video));

  const saveMutation = useMutation({
    mutationFn: async (payload: VideoUpdate) => {
      const supabase = createClient();
      const { error } = await supabase.from('videos').update(payload).eq('id', video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(video.short_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(video.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectShortId) });
      toast.success('Ajustes del video guardados');
    },
    onError: (error) => {
      console.error(error);
      toast.error('No se pudieron guardar los ajustes del video');
    },
  });

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(createState(video)), [form, video]);

  function updateField<Key extends keyof VideoSettingsFormState>(key: Key, value: VideoSettingsFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    saveMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      platform: form.platform as VideoUpdate['platform'],
      status: form.status as VideoUpdate['status'],
      video_type: form.videoType as VideoUpdate['video_type'],
      aspect_ratio: form.aspectRatio || null,
      target_duration_seconds: form.targetDurationSeconds ? Number(form.targetDurationSeconds) : null,
      is_primary: form.isPrimary,
      narration_provider: form.narrationProvider || null,
      narration_voice_name: form.narrationVoiceName.trim() || null,
      narration_style: form.narrationStyle.trim() || null,
      narration_speed: form.narrationSpeed ? Number(form.narrationSpeed) : null,
    });
  }

  return (
    <WorkspaceSettingsModal
      isOpen={isOpen}
      activeSection={activeSection}
      title="Ajustes del video"
      nav={NAV}
      onClose={onClose}
      onSelectSection={onSelectSection}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{video.title}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Configura este video desde el mismo flujo</h1>
          </div>
          <Button color="primary" className="h-10 rounded-xl px-4 text-sm font-semibold" isDisabled={!hasChanges || !form.title.trim() || saveMutation.isPending} onPress={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>

        {activeSection === 'general' ? (
          <div className="space-y-6">
            <SectionHeader title="General" description="Identidad, formato de salida y estado actual del video." />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Titulo</label>
                <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className={fieldClassName} placeholder="Nombre del video" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Plataforma</label>
                <select value={form.platform} onChange={(event) => updateField('platform', event.target.value)} className={fieldClassName}>
                  {PLATFORM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Estado</label>
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className={fieldClassName}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tipo de video</label>
                <select value={form.videoType} onChange={(event) => updateField('videoType', event.target.value)} className={fieldClassName}>
                  {VIDEO_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Aspect ratio</label>
                <select value={form.aspectRatio} onChange={(event) => updateField('aspectRatio', event.target.value)} className={fieldClassName}>
                  <option value="">Sin definir</option>
                  {ASPECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Duracion objetivo</label>
                <input value={form.targetDurationSeconds} onChange={(event) => updateField('targetDurationSeconds', event.target.value)} className={fieldClassName} placeholder="Ej. 30" inputMode="numeric" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Descripcion</label>
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className={cn(fieldClassName, 'min-h-28 resize-y')} placeholder="Resumen creativo o notas operativas del video" />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
              <input type="checkbox" checked={form.isPrimary} onChange={(event) => updateField('isPrimary', event.target.checked)} className="h-4 w-4 rounded border-border" />
              Marcar como video principal del proyecto
            </label>
          </div>
        ) : null}

        {activeSection === 'narration' ? (
          <div className="space-y-6">
            <SectionHeader title="Narracion y voz" description="Parametros base para voz, estilo y ritmo si este video usa narracion generada." />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Proveedor</label>
                <input value={form.narrationProvider} onChange={(event) => updateField('narrationProvider', event.target.value)} className={fieldClassName} placeholder="Ej. elevenlabs" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Nombre de voz</label>
                <input value={form.narrationVoiceName} onChange={(event) => updateField('narrationVoiceName', event.target.value)} className={fieldClassName} placeholder="Nombre descriptivo de la voz" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Estilo de narracion</label>
                <input value={form.narrationStyle} onChange={(event) => updateField('narrationStyle', event.target.value)} className={fieldClassName} placeholder="Calma, energetica, institucional..." />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Velocidad</label>
                <input value={form.narrationSpeed} onChange={(event) => updateField('narrationSpeed', event.target.value)} className={fieldClassName} placeholder="1, 1.1, 0.9..." inputMode="decimal" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground"><MonitorPlay className="h-4 w-4 text-primary" /> Consejo operativo</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Usa este modal para fijar el formato del video y el comportamiento de narracion sin salir de la pagina actual. Los cambios se reflejan en el overview y en los flujos de exportacion.</p>
            </div>
          </div>
        ) : null}
      </div>
    </WorkspaceSettingsModal>
  );
}
