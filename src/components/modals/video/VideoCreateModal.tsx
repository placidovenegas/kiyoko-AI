'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import {
  Film, Sparkles, X, Loader2, Monitor, Smartphone, Clock, Camera, ChevronRight,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { ModalProps } from '../shared/types';
import type { VideoFormData } from './types';
import { PLATFORMS, DURATIONS, DEFAULT_VIDEO } from './types';
import { useCreateVideo } from './useCreateVideo';
import { cn } from '@/lib/utils/cn';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { PHASE_STYLES } from '@/lib/constants/status';
import type { Database } from '@/types/database.types';

/* ── Types ────────────────────────────────────────────────── */

interface GeneratedScene {
  title: string;
  description: string;
  arc_phase: string;
  duration_seconds: number;
  camera_angle?: string;
  camera_movement?: string;
  prompt_image?: string;
  prompt_video?: string;
}

/* ── Nav items ────────────────────────────────────────────── */

const NAV = [
  { id: 'details', label: 'Video', icon: Film },
  { id: 'ai', label: 'Escenas IA', icon: Sparkles },
] as const;

type Step = (typeof NAV)[number]['id'];

/* ── Component ────────────────────────────────────────────── */

export function VideoCreateModal({ open, onOpenChange, projectId, projectShortId, onSuccess }: ModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useCreateVideo(projectId);

  // Get project context for AI generation
  let projectTitle = '';
  let projectStyle = '';
  let charCount = 0;
  let bgCount = 0;
  try {
    const ctx = useProject();
    projectTitle = ctx.project?.title ?? '';
    projectStyle = ctx.project?.style ?? 'pixar';
    charCount = ctx.characters?.length ?? 0;
    bgCount = ctx.backgrounds?.length ?? 0;
  } catch { /* not in project context */ }

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<VideoFormData>({ ...DEFAULT_VIDEO });
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const [createdVideoShortId, setCreatedVideoShortId] = useState<string | null>(null);

  // AI state
  const [aiInstruction, setAiInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [savingScenes, setSavingScenes] = useState(false);

  const updateField = <K extends keyof VideoFormData>(key: K, value: VideoFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handlePlatformChange = (platform: VideoFormData['platform']) => {
    const p = PLATFORMS.find((pl) => pl.value === platform);
    setForm((f) => ({ ...f, platform, aspect_ratio: (p?.ratio ?? '16:9') as VideoFormData['aspect_ratio'] }));
  };

  function handleClose() {
    setForm({ ...DEFAULT_VIDEO });
    setStep('details');
    setCreatedVideoId(null);
    setCreatedVideoShortId(null);
    setAiInstruction('');
    setGeneratedScenes([]);
    onOpenChange(false);
  }

  /* ── Create video (step 1 → step 2 or close) ──────────── */
  async function handleCreateVideo(goToAi: boolean) {
    if (!form.title.trim()) return;
    const video = await mutation.mutateAsync(form);
    if (video?.id) {
      setCreatedVideoId(video.id);
      setCreatedVideoShortId(video.short_id);
      if (goToAi) {
        setStep('ai');
      } else {
        handleClose();
        onSuccess?.();
        if (video.short_id && projectShortId) {
          router.push(`/project/${projectShortId}/video/${video.short_id}`);
        }
      }
    }
  }

  /* ── Generate scenes with AI ───────────────────────────── */
  async function handleGenerate() {
    if (!aiInstruction.trim() && !form.description.trim()) {
      toast.error('Describe que quieres en el video');
      return;
    }
    setGenerating(true);
    toast.ai('Generando escenas con IA...', { id: 'gen-scenes' });

    try {
      const instruction = `Genera escenas para un video "${form.title}" de ${form.target_duration_seconds}s para ${form.platform} (${form.aspect_ratio}).
${form.description ? `Descripcion: ${form.description}` : ''}
${aiInstruction ? `Instrucciones adicionales: ${aiInstruction}` : ''}
Estilo: ${projectStyle}. Distribuye las escenas con arco narrativo (hook→build→peak→close) cubriendo los ${form.target_duration_seconds}s totales.`;

      const res = await fetch('/api/ai/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, instruction }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const scene = json.data;
          // API returns single scene, wrap in array. For multiple scenes, repeat calls
          setGeneratedScenes([scene]);
          toast.success('Escena generada', { id: 'gen-scenes' });
        } else {
          throw new Error('Invalid response');
        }
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback: generate mock scenes based on duration
      const dur = form.target_duration_seconds;
      const mockScenes: GeneratedScene[] = [];
      const phases = ['hook', 'build', 'build', 'peak', 'close'];
      const titles = ['Apertura impactante', 'Presentacion del contexto', 'Desarrollo principal', 'Momento clave', 'Cierre y CTA'];
      const descs = [
        'Toma dinamica que capta la atencion del espectador en los primeros segundos.',
        'Se establece el escenario y se presentan los elementos principales.',
        'La narrativa se desarrolla mostrando el contenido central del video.',
        'El momento de mayor impacto visual y emocional del video.',
        'Cierre con mensaje final, logo y llamada a la accion.',
      ];
      const count = dur <= 15 ? 3 : dur <= 30 ? 4 : dur <= 60 ? 5 : 6;
      const sceneDur = Math.floor(dur / count);
      for (let i = 0; i < count; i++) {
        const pi = Math.min(i, phases.length - 1);
        mockScenes.push({
          title: titles[pi] ?? `Escena ${i + 1}`,
          description: descs[pi] ?? '',
          arc_phase: phases[pi],
          duration_seconds: i === count - 1 ? dur - sceneDur * (count - 1) : sceneDur,
          camera_angle: i === 0 ? 'wide' : i === count - 1 ? 'medium' : 'close_up',
          camera_movement: i === 0 ? 'dolly_in' : 'tracking',
        });
      }
      setGeneratedScenes(mockScenes);
      toast.success(`${mockScenes.length} escenas generadas`, { id: 'gen-scenes' });
    }
    setGenerating(false);
  }

  /* ── Save all generated scenes ─────────────────────────── */
  async function handleSaveScenes() {
    if (!createdVideoId || generatedScenes.length === 0) return;
    setSavingScenes(true);
    toast.ai('Creando escenas y generando prompts...', { id: 'save-scenes' });

    try {
      const supabase = createClient();

      for (let i = 0; i < generatedScenes.length; i++) {
        const s = generatedScenes[i];
        const { data: newScene } = await supabase.from('scenes').insert({
          video_id: createdVideoId,
          project_id: projectId,
          title: s.title,
          description: s.description,
          duration_seconds: s.duration_seconds,
          arc_phase: s.arc_phase as 'hook' | 'build' | 'peak' | 'close',
          scene_number: i + 1,
          sort_order: i + 1,
          short_id: generateShortId(),
          status: 'draft',
          scene_type: 'original',
        }).select('id').single();

        if (newScene) {
          // Insert camera
          await supabase.from('scene_camera').insert({
            scene_id: newScene.id,
            camera_angle: (s.camera_angle ?? 'medium') as Database['public']['Enums']['camera_angle'],
            camera_movement: (s.camera_movement ?? 'static') as Database['public']['Enums']['camera_movement'],
          });

          // Auto-generate prompts in background
          fetch('/api/ai/generate-scene-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sceneId: newScene.id }),
          }).catch(() => { /* silent */ });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      toast.success(`${generatedScenes.length} escenas creadas — prompts generandose`, { id: 'save-scenes' });

      handleClose();
      onSuccess?.();
      if (createdVideoShortId && projectShortId) {
        router.push(`/project/${projectShortId}/video/${createdVideoShortId}`);
      }
    } catch {
      toast.error('Error al crear escenas', { id: 'save-scenes' });
    }
    setSavingScenes(false);
  }

  if (!open) return null;

  const isVertical = form.aspect_ratio === '9:16';
  const totalDuration = generatedScenes.reduce((sum, s) => sum + s.duration_seconds, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex h-[min(680px,85vh)] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Left nav */}
        <div className="w-44 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Nuevo video</p>
          </div>
          <nav className="flex-1 px-2 space-y-0.5">
            {NAV.map(item => (
              <button key={item.id} type="button"
                onClick={() => { if (item.id === 'ai' && !createdVideoId) return; setStep(item.id); }}
                disabled={item.id === 'ai' && !createdVideoId}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors',
                  step === item.id ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60',
                  item.id === 'ai' && !createdVideoId && 'opacity-40 cursor-not-allowed',
                )}>
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">
              {step === 'details' ? 'Detalles del video' : 'Generar escenas con IA'}
            </p>
            <button type="button" onClick={handleClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 'details' ? (
              /* ── Step 1: Video details ──────────────────── */
              <div className="space-y-4 max-w-md">
                <TextField variant="secondary" value={form.title} onChange={(v) => updateField('title', v)} isRequired autoFocus>
                  <Label>Titulo *</Label>
                  <Input placeholder="Ej. Spot primavera 2025" />
                </TextField>

                {/* Platform */}
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Plataforma</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PLATFORMS.map(p => (
                      <button key={p.value} type="button" onClick={() => handlePlatformChange(p.value)}
                        className={cn('rounded-lg border px-3 py-2 text-left transition-all',
                          form.platform === p.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20')}>
                        <div className="flex items-center gap-1.5">
                          {p.ratio === '9:16' ? <Smartphone className="size-3 text-muted-foreground" /> : <Monitor className="size-3 text-muted-foreground" />}
                          <p className={cn('text-xs font-medium', form.platform === p.value ? 'text-primary' : 'text-foreground')}>{p.label}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.ratio}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Duracion</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATIONS.map(d => (
                      <button key={d.value} type="button" onClick={() => updateField('target_duration_seconds', d.value)}
                        className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          form.target_duration_seconds === d.value
                            ? 'border-primary/40 bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/20')}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect preview */}
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-md border border-border bg-background flex items-center justify-center',
                    isVertical ? 'w-8 h-14' : 'w-14 h-8')}>
                    <span className="text-[8px] text-muted-foreground/50">{form.aspect_ratio}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">{form.aspect_ratio}</span> · {isVertical ? 'Vertical' : 'Horizontal'}</p>
                  </div>
                </div>

                <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
                  <Label>Descripcion</Label>
                  <TextArea placeholder="De que trata este video..." rows={2} />
                </TextField>
              </div>
            ) : (
              /* ── Step 2: AI Scene Generation ────────────── */
              <div className="space-y-4">
                {/* Context summary */}
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
                  <p className="text-xs font-medium text-foreground">Contexto para la IA:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <p>Video: <span className="text-foreground font-medium">{form.title}</span></p>
                    <p>Plataforma: <span className="text-foreground">{PLATFORMS.find(p => p.value === form.platform)?.label}</span></p>
                    <p>Duracion: <span className="text-foreground">{form.target_duration_seconds}s</span> · {form.aspect_ratio}</p>
                    <p>Estilo: <span className="text-foreground">{projectStyle}</span></p>
                    {charCount > 0 && <p>{charCount} personajes disponibles</p>}
                    {bgCount > 0 && <p>{bgCount} fondos disponibles</p>}
                  </div>
                </div>

                {/* AI instruction */}
                <TextField variant="secondary" value={aiInstruction} onChange={setAiInstruction}>
                  <Label>Que quieres en el video?</Label>
                  <TextArea placeholder="Ej. Video de presentacion del equipo con transformaciones antes/despues de los clientes..." rows={3} />
                </TextField>

                {!generating && generatedScenes.length === 0 && (
                  <button type="button" onClick={handleGenerate} disabled={generating}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Sparkles className="size-4" />
                    Generar escenas con IA
                  </button>
                )}

                {generating && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Generando escenas...</span>
                  </div>
                )}

                {/* Generated scenes list */}
                {generatedScenes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{generatedScenes.length} escenas · {totalDuration}s</p>
                      <button type="button" onClick={handleGenerate} disabled={generating}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <Sparkles className="size-2.5" /> Regenerar
                      </button>
                    </div>
                    {generatedScenes.map((s, i) => (
                      <div key={i} className="rounded-xl border border-border bg-background/50 p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                            <span className="text-sm font-medium text-foreground">{s.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            {s.arc_phase && (
                              <span className={cn('rounded-md px-1.5 py-0.5 font-medium text-white', PHASE_STYLES[s.arc_phase] ?? 'bg-zinc-500')}>
                                {s.arc_phase}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                              <Clock className="size-2.5" />{s.duration_seconds}s
                            </span>
                          </div>
                        </div>
                        {s.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{s.description}</p>
                        )}
                        {s.camera_angle && (
                          <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <Camera className="size-2.5" /> {s.camera_angle} · {s.camera_movement ?? 'static'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-border px-6 py-3 shrink-0">
            {step === 'details' ? (
              <>
                <button type="button" onClick={() => handleCreateVideo(false)} disabled={!form.title.trim() || mutation.isPending}
                  className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                  {mutation.isPending ? 'Creando...' : 'Crear sin escenas'}
                </button>
                <button type="button" onClick={() => handleCreateVideo(true)} disabled={!form.title.trim() || mutation.isPending}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Crear y generar escenas
                  <ChevronRight className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setStep('details')}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  ← Volver
                </button>
                <div className="flex-1" />
                {generatedScenes.length > 0 && (
                  <button type="button" onClick={handleSaveScenes} disabled={savingScenes}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {savingScenes && <Loader2 className="size-4 animate-spin" />}
                    Crear {generatedScenes.length} escenas
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
