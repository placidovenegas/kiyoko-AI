'use client';

import { useState, useEffect } from 'react';
import { Modal, useOverlayState } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/useUIStore';
import { useVideo } from '@/contexts/VideoContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { X, Settings2, AudioLines } from 'lucide-react';

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Video',
    items: [
      { id: 'general' as const, label: 'General', icon: Settings2 },
      { id: 'narracion' as const, label: 'Narracion', icon: AudioLines },
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
  form: VideoForm;
  setForm: React.Dispatch<React.SetStateAction<VideoForm>>;
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
          placeholder="Nombre del video"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Plataforma</label>
        <select
          className={INPUT_CLASS}
          value={form.platform}
          onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
        >
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram_reels">Instagram Reels</option>
          <option value="tv_commercial">TV</option>
          <option value="web">Web</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Estado</label>
        <select
          className={INPUT_CLASS}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Draft</option>
          <option value="prompting">Prompting</option>
          <option value="generating">Generating</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="exported">Exported</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Tipo de video</label>
        <select
          className={INPUT_CLASS}
          value={form.video_type}
          onChange={(e) => setForm((f) => ({ ...f, video_type: e.target.value }))}
        >
          <option value="long">Storyboard</option>
          <option value="short">Animatic</option>
          <option value="ad">Ad</option>
          <option value="reel">Social</option>
          <option value="custom">Other</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Aspect ratio</label>
        <select
          className={INPUT_CLASS}
          value={form.aspect_ratio}
          onChange={(e) => setForm((f) => ({ ...f, aspect_ratio: e.target.value }))}
        >
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
          <option value="4:5">4:5</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Duracion objetivo (segundos)</label>
        <input
          type="number"
          className={INPUT_CLASS}
          value={form.target_duration_seconds}
          onChange={(e) =>
            setForm((f) => ({ ...f, target_duration_seconds: e.target.value }))
          }
          placeholder="60"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Descripcion</label>
        <textarea
          rows={4}
          className={INPUT_CLASS}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe brevemente el video"
        />
      </div>
    </div>
  );
}

// ─── Narracion section ───────────────────────────────────────────────────────

function NarracionSection({
  form,
  setForm,
}: {
  form: VideoForm;
  setForm: React.Dispatch<React.SetStateAction<VideoForm>>;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">Narracion</h2>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Proveedor</label>
        <input
          type="text"
          className={INPUT_CLASS}
          value={form.narration_provider}
          onChange={(e) => setForm((f) => ({ ...f, narration_provider: e.target.value }))}
          placeholder="ElevenLabs, OpenAI, etc."
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Nombre de voz</label>
        <input
          type="text"
          className={INPUT_CLASS}
          value={form.narration_voice_name}
          onChange={(e) => setForm((f) => ({ ...f, narration_voice_name: e.target.value }))}
          placeholder="Nombre de la voz seleccionada"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Estilo de narracion</label>
        <input
          type="text"
          className={INPUT_CLASS}
          value={form.narration_style}
          onChange={(e) => setForm((f) => ({ ...f, narration_style: e.target.value }))}
          placeholder="Narrativo, conversacional, dramatico..."
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>Velocidad</label>
        <input
          type="number"
          step={0.1}
          className={INPUT_CLASS}
          value={form.narration_speed}
          onChange={(e) => setForm((f) => ({ ...f, narration_speed: e.target.value }))}
          placeholder="1.0"
        />
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoForm {
  title: string;
  platform: string;
  status: string;
  video_type: string;
  aspect_ratio: string;
  target_duration_seconds: string;
  description: string;
  narration_provider: string;
  narration_voice_name: string;
  narration_style: string;
  narration_speed: string;
}

function buildInitialForm(video: ReturnType<typeof useVideo>['video']): VideoForm {
  return {
    title: video?.title ?? '',
    platform: video?.platform ?? 'youtube',
    status: video?.status ?? 'draft',
    video_type: video?.video_type ?? 'long',
    aspect_ratio: video?.aspect_ratio ?? '16:9',
    target_duration_seconds: video?.target_duration_seconds?.toString() ?? '',
    description: video?.description ?? '',
    narration_provider: video?.narration_provider ?? '',
    narration_voice_name: video?.narration_voice_name ?? '',
    narration_style: video?.narration_style ?? '',
    narration_speed: video?.narration_speed?.toString() ?? '',
  };
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function VideoSettingsModal() {
  const {
    videoSettingsModalOpen,
    videoSettingsSection,
    closeVideoSettingsModal,
    openVideoSettingsModal,
  } = useUIStore();

  const { video } = useVideo();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<VideoForm>(() => buildInitialForm(video));
  const [saving, setSaving] = useState(false);

  // Sync form when video changes or modal opens
  useEffect(() => {
    if (videoSettingsModalOpen && video) {
      setForm(buildInitialForm(video));
    }
  }, [videoSettingsModalOpen, video]);

  const modalState = useOverlayState({
    isOpen: videoSettingsModalOpen,
    onOpenChange: (open) => {
      if (!open) closeVideoSettingsModal();
    },
  });

  const handleSave = async () => {
    if (!video) return;
    if (!form.title.trim()) {
      toast.error('El titulo es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const durationNum = form.target_duration_seconds
        ? Number(form.target_duration_seconds)
        : null;
      const speedNum = form.narration_speed ? Number(form.narration_speed) : null;

      const { error } = await supabase
        .from('videos')
        .update({
          title: form.title.trim(),
          platform: form.platform as 'youtube' | 'instagram_reels' | 'tiktok' | 'tv_commercial' | 'web' | 'custom',
          status: form.status as 'draft' | 'prompting' | 'generating' | 'review' | 'approved' | 'exported',
          video_type: form.video_type as 'long' | 'short' | 'reel' | 'story' | 'ad' | 'custom',
          aspect_ratio: form.aspect_ratio || null,
          target_duration_seconds: durationNum,
          description: form.description.trim() || null,
          narration_provider: form.narration_provider.trim() || null,
          narration_voice_name: form.narration_voice_name.trim() || null,
          narration_style: form.narration_style.trim() || null,
          narration_speed: speedNum,
        })
        .eq('id', video.id);

      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: queryKeys.videos.detail(video.short_id),
      });

      toast.success('Video actualizado');
      closeVideoSettingsModal();
    } catch (err) {
      toast.error('Error al guardar el video');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Modal.Backdrop />
      <Modal.Container
        placement="center"
        size="cover"
        className={cn(
          'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-45%]',
        )}
      >
        <Modal.Dialog className="p-0! bg-transparent! shadow-none! max-w-none! w-auto!">
          <div className="flex flex-row w-[80vw] h-[85vh] rounded-xl border border-border bg-background shadow-xl overflow-hidden">
            {/* ── Left nav ──────────────────────────────────────────── */}
            <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
              <div className="px-4 pt-5 pb-2">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2">
                  Video
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
                        onClick={() => openVideoSettingsModal(id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] rounded-md transition-colors',
                          videoSettingsSection === id
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
                {videoSettingsSection === 'narracion' ? (
                  <NarracionSection form={form} setForm={setForm} />
                ) : (
                  <GeneralSection form={form} setForm={setForm} />
                )}
              </div>
            </main>

            {/* ── Close ─────────────────────────────────────────────── */}
            <Modal.CloseTrigger className="absolute right-3 top-3 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Modal.CloseTrigger>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
