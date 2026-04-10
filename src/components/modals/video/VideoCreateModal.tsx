'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import {
  Film, Sparkles, X, Loader2, Monitor, Smartphone, Clock, Camera, ChevronRight,
  ChevronDown, RefreshCw, Check, Lightbulb,
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

interface VideoSuggestion {
  title: string;
  description: string;
  platform: string;
  duration: number;
}

interface GeneratedScene {
  title: string;
  description: string;
  arc_phase: string;
  duration_seconds: number;
  camera_angle?: string;
  camera_movement?: string;
}

/* ── Suggestion templates ────────────────────────────────── */

function generateSuggestions(projectTitle: string, projectStyle: string, charCount: number, bgCount: number, projectDesc: string): VideoSuggestion[] {
  const base = projectTitle || 'el proyecto';
  const all: VideoSuggestion[] = [
    { title: `Presentacion de ${base}`, description: `Video promocional mostrando los servicios y el equipo de ${base}. Ideal para redes y web.`, platform: 'youtube', duration: 60 },
    { title: `Reel — Antes y Despues`, description: `Transformaciones rapidas con transiciones dinamicas. Perfecto para Instagram y TikTok.`, platform: 'instagram_reels', duration: 30 },
    { title: `Spot publicitario ${base}`, description: `Anuncio corto y directo con gancho visual, mensaje clave y CTA final.`, platform: 'tv_commercial', duration: 15 },
    { title: `Detras de camaras`, description: `Muestra el proceso de trabajo, el equipo en accion y momentos reales del dia a dia.`, platform: 'tiktok', duration: 30 },
    { title: `Testimonio de cliente`, description: `Video emocional con la experiencia de un cliente, su historia y el resultado final.`, platform: 'youtube', duration: 60 },
    { title: `Tutorial / How-to`, description: `Paso a paso educativo mostrando un proceso o tecnica. Contenido de valor.`, platform: 'youtube', duration: 180 },
    { title: `Showreel del portfolio`, description: `Compilacion de los mejores trabajos con transiciones rapidas y musica energica.`, platform: 'instagram_reels', duration: 30 },
    { title: `Lanzamiento de producto`, description: `Revelar un nuevo producto o servicio con suspense, detalle y CTA.`, platform: 'youtube', duration: 60 },
  ];
  // Shuffle and return
  return all.sort(() => Math.random() - 0.5);
}

/* ── Nav ──────────────────────────────────────────────────── */

const NAV = [
  { id: 'suggestions', label: 'Sugerencias', icon: Lightbulb },
  { id: 'details', label: 'Video', icon: Film },
  { id: 'scenes', label: 'Escenas', icon: Sparkles },
] as const;

type Step = (typeof NAV)[number]['id'];

/* ── Component ────────────────────────────────────────────── */

export function VideoCreateModal({ open, onOpenChange, projectId, projectShortId, onSuccess }: ModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useCreateVideo(projectId);

  let projectTitle = ''; let projectStyle = 'pixar'; let projectDesc = '';
  let charCount = 0; let bgCount = 0;
  try {
    const ctx = useProject();
    projectTitle = ctx.project?.title ?? '';
    projectStyle = ctx.project?.style ?? 'pixar';
    projectDesc = ctx.project?.description ?? '';
    charCount = ctx.characters?.length ?? 0;
    bgCount = ctx.backgrounds?.length ?? 0;
  } catch { /* not in project context */ }

  const [step, setStep] = useState<Step>('suggestions');
  const [form, setForm] = useState<VideoFormData>({ ...DEFAULT_VIDEO });

  // Suggestions
  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>(() =>
    generateSuggestions(projectTitle, projectStyle, charCount, bgCount, projectDesc).slice(0, 3)
  );
  const [showMoreCount, setShowMoreCount] = useState(3);

  // Scenes
  const [aiInstruction, setAiInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [savingScenes, setSavingScenes] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const updateField = useCallback(<K extends keyof VideoFormData>(key: K, value: VideoFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const handlePlatformChange = useCallback((platform: VideoFormData['platform']) => {
    const p = PLATFORMS.find((pl) => pl.value === platform);
    setForm((f) => ({ ...f, platform, aspect_ratio: (p?.ratio ?? '16:9') as VideoFormData['aspect_ratio'] }));
  }, []);

  function handleClose() {
    setForm({ ...DEFAULT_VIDEO }); setStep('suggestions');
    setSuggestions(generateSuggestions(projectTitle, projectStyle, charCount, bgCount, projectDesc).slice(0, 3));
    setShowMoreCount(3); setAiInstruction(''); setGeneratedScenes([]); setEditingIdx(null);
    onOpenChange(false);
  }

  /* ── Use suggestion → fill form ────────────────────────── */
  function useSuggestion(s: VideoSuggestion) {
    setForm({
      title: s.title,
      description: s.description,
      platform: s.platform as VideoFormData['platform'],
      target_duration_seconds: s.duration,
      aspect_ratio: (PLATFORMS.find(p => p.value === s.platform)?.ratio ?? '16:9') as VideoFormData['aspect_ratio'],
    });
    setStep('details');
  }

  /* ── Show more suggestions ─────────────────────────────── */
  function showMore() {
    const all = generateSuggestions(projectTitle, projectStyle, charCount, bgCount, projectDesc);
    const next = showMoreCount + 2;
    setSuggestions(all.slice(0, next));
    setShowMoreCount(next);
  }

  /* ── Generate scenes ───────────────────────────────────── */
  async function handleGenerateScenes() {
    setGenerating(true);
    toast.ai('Generando escenas con IA...', { id: 'gen-scenes' });

    const instruction = `Genera escenas para "${form.title}" de ${form.target_duration_seconds}s en ${form.platform} (${form.aspect_ratio}).
${form.description ? `Descripcion: ${form.description}` : ''}
${aiInstruction ? `Instrucciones: ${aiInstruction}` : ''}
Estilo: ${projectStyle}. Arco narrativo (hook→build→peak→close) cubriendo ${form.target_duration_seconds}s.`;

    try {
      const res = await fetch('/api/ai/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, instruction }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setGeneratedScenes(prev => [...prev, json.data]);
          toast.success('Escena generada', { id: 'gen-scenes' });
          setGenerating(false);
          return;
        }
      }
    } catch { /* fallback */ }

    // Fallback: mock scenes
    const dur = form.target_duration_seconds;
    const phases = ['hook', 'build', 'build', 'peak', 'close'];
    const titles = ['Apertura impactante', 'Presentacion del contexto', 'Desarrollo principal', 'Momento clave', 'Cierre y CTA'];
    const descs = [
      `Toma dinamica que capta la atencion en los primeros segundos. ${projectTitle ? `Contexto de ${projectTitle}.` : ''}`,
      `Se establece el escenario. ${charCount > 0 ? `Aparecen los personajes principales.` : ''} ${bgCount > 0 ? `Fondo principal del proyecto.` : ''}`,
      `${form.description || 'La narrativa se desarrolla mostrando el contenido central.'}`,
      'El momento de mayor impacto visual y emocional del video.',
      'Cierre con mensaje final, logo y llamada a la accion.',
    ];
    const count = dur <= 15 ? 3 : dur <= 30 ? 4 : dur <= 60 ? 5 : 6;
    const sceneDur = Math.floor(dur / count);
    const scenes: GeneratedScene[] = [];
    for (let i = 0; i < count; i++) {
      const pi = Math.min(i, phases.length - 1);
      scenes.push({
        title: titles[pi], description: descs[pi],
        arc_phase: phases[pi], duration_seconds: i === count - 1 ? dur - sceneDur * (count - 1) : sceneDur,
        camera_angle: i === 0 ? 'wide' : i === count - 1 ? 'medium' : 'close_up',
        camera_movement: i === 0 ? 'dolly_in' : 'tracking',
      });
    }
    setGeneratedScenes(scenes);
    toast.success(`${scenes.length} escenas generadas`, { id: 'gen-scenes' });
    setGenerating(false);
  }

  /* ── Update a scene ────────────────────────────────────── */
  function updateScene(idx: number, field: keyof GeneratedScene, value: string | number) {
    setGeneratedScenes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  /* ── Create video + scenes + prompts ───────────────────── */
  async function handleCreateAll() {
    if (!form.title.trim()) return;
    setSavingScenes(true);
    toast.ai('Creando video y escenas...', { id: 'create-all' });

    try {
      const video = await mutation.mutateAsync(form);
      if (!video?.id) throw new Error('No se pudo crear el video');

      if (generatedScenes.length > 0) {
        const supabase = createClient();
        for (let i = 0; i < generatedScenes.length; i++) {
          const s = generatedScenes[i];
          const { data: newScene } = await supabase.from('scenes').insert({
            video_id: video.id, project_id: projectId, title: s.title,
            description: s.description, duration_seconds: s.duration_seconds,
            arc_phase: s.arc_phase as 'hook' | 'build' | 'peak' | 'close',
            scene_number: i + 1, sort_order: i + 1, short_id: generateShortId(),
            status: 'draft', scene_type: 'original',
          }).select('id').single();
          if (newScene) {
            await supabase.from('scene_camera').insert({
              scene_id: newScene.id,
              camera_angle: (s.camera_angle ?? 'medium') as Database['public']['Enums']['camera_angle'],
              camera_movement: (s.camera_movement ?? 'static') as Database['public']['Enums']['camera_movement'],
            });
            fetch('/api/ai/generate-scene-prompts', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sceneId: newScene.id }),
            }).catch(() => {});
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      toast.success(`Video creado con ${generatedScenes.length} escenas`, { id: 'create-all' });
      handleClose(); onSuccess?.();
      if (video.short_id && projectShortId) router.push(`/project/${projectShortId}/video/${video.short_id}`);
    } catch {
      toast.error('Error al crear', { id: 'create-all' });
    }
    setSavingScenes(false);
  }

  if (!open) return null;

  const isVertical = form.aspect_ratio === '9:16';
  const totalDur = generatedScenes.reduce((s, sc) => s + sc.duration_seconds, 0);
  const canGoToScenes = form.title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex h-[min(720px,88vh)] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Left nav */}
        <div className="w-44 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Nuevo video</p>
          </div>
          <nav className="flex-1 px-2 space-y-0.5">
            {NAV.map(item => {
              const disabled = item.id === 'scenes' && !canGoToScenes;
              return (
                <button key={item.id} type="button" disabled={disabled}
                  onClick={() => { if (!disabled) setStep(item.id); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors',
                    step === item.id ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60',
                    disabled && 'opacity-40 cursor-not-allowed',
                  )}>
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                  {item.id === 'scenes' && generatedScenes.length > 0 && (
                    <span className="ml-auto text-[10px] text-primary font-medium">{generatedScenes.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">
              {step === 'suggestions' ? 'Que video quieres crear?' : step === 'details' ? 'Detalles del video' : 'Preview de escenas'}
            </p>
            <button type="button" onClick={handleClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* ── Step: Suggestions ──────────────────────── */}
            {step === 'suggestions' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Basandome en <span className="text-foreground font-medium">{projectTitle || 'tu proyecto'}</span>
                    {charCount > 0 && ` (${charCount} personajes`}{bgCount > 0 && `, ${bgCount} fondos`}{(charCount > 0 || bgCount > 0) && ')'}
                    , te sugiero estos videos:
                  </p>
                </div>

                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => useSuggestion(s)}
                      className="w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] text-muted-foreground">
                          <span>{PLATFORMS.find(p => p.value === s.platform)?.label}</span>
                          <span>{s.duration >= 60 ? `${Math.floor(s.duration / 60)}m` : `${s.duration}s`}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {showMoreCount < 8 && (
                  <button type="button" onClick={showMore}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                    <ChevronDown className="size-3" /> Ver mas sugerencias
                  </button>
                )}

                <div className="pt-2 border-t border-border">
                  <button type="button" onClick={() => setStep('details')}
                    className="w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    O crear desde cero →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: Details ──────────────────────────── */}
            {step === 'details' && (
              <div className="space-y-4 max-w-md">
                <TextField variant="secondary" value={form.title} onChange={(v) => updateField('title', v)} isRequired autoFocus>
                  <Label>Titulo *</Label>
                  <Input placeholder="Ej. Spot primavera 2025" />
                </TextField>

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
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Duracion</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATIONS.map(d => (
                      <button key={d.value} type="button" onClick={() => updateField('target_duration_seconds', d.value)}
                        className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          form.target_duration_seconds === d.value ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/20')}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={cn('rounded-md border border-border bg-background flex items-center justify-center', isVertical ? 'w-7 h-12' : 'w-12 h-7')}>
                    <span className="text-[7px] text-muted-foreground/50">{form.aspect_ratio}</span>
                  </div>
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{form.aspect_ratio}</span> · {isVertical ? 'Vertical' : 'Horizontal'}</p>
                </div>

                <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
                  <Label>Descripcion</Label>
                  <TextArea placeholder="De que trata este video..." rows={2} />
                </TextField>
              </div>
            )}

            {/* ── Step: Scenes ───────────────────────────── */}
            {step === 'scenes' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background/50 p-3 text-[11px] text-muted-foreground">
                  <span className="text-foreground font-medium">{form.title}</span> · {PLATFORMS.find(p => p.value === form.platform)?.label} · {form.target_duration_seconds}s · {projectStyle}
                </div>

                {generatedScenes.length === 0 && !generating && (
                  <>
                    <TextField variant="secondary" value={aiInstruction} onChange={setAiInstruction}>
                      <Label>Que quieres en el video? (opcional)</Label>
                      <TextArea placeholder="Ej. Presentar al equipo, mostrar transformaciones..." rows={3} />
                    </TextField>
                    <button type="button" onClick={handleGenerateScenes}
                      className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      <Sparkles className="size-4" /> Generar escenas con IA
                    </button>
                  </>
                )}

                {generating && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Generando escenas...</span>
                  </div>
                )}

                {generatedScenes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{generatedScenes.length} escenas · {totalDur}s total</p>
                      <button type="button" onClick={() => { setGeneratedScenes([]); handleGenerateScenes(); }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <RefreshCw className="size-2.5" /> Regenerar todo
                      </button>
                    </div>

                    {generatedScenes.map((s, i) => (
                      <div key={i} className="rounded-xl border border-border bg-background/50 overflow-hidden">
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                            {editingIdx === i ? (
                              <input type="text" value={s.title} onChange={e => updateScene(i, 'title', e.target.value)}
                                onBlur={() => setEditingIdx(null)} autoFocus
                                className="text-sm font-medium text-foreground bg-transparent border-b border-primary/30 outline-none flex-1" />
                            ) : (
                              <button type="button" onClick={() => setEditingIdx(i)}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate text-left">
                                {s.title}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] shrink-0">
                            <span className={cn('rounded-md px-1.5 py-0.5 font-medium text-white', PHASE_STYLES[s.arc_phase] ?? 'bg-zinc-500')}>
                              {s.arc_phase}
                            </span>
                            <span className="flex items-center gap-0.5 text-muted-foreground"><Clock className="size-2.5" />{s.duration_seconds}s</span>
                          </div>
                        </div>
                        <div className="px-3.5 pb-2.5">
                          {editingIdx === i ? (
                            <textarea value={s.description} onChange={e => updateScene(i, 'description', e.target.value)}
                              rows={2} className="w-full text-[11px] text-muted-foreground bg-transparent border border-border rounded-lg px-2 py-1 outline-none focus:border-primary/30" />
                          ) : (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 cursor-pointer" onClick={() => setEditingIdx(i)}>
                              {s.description}
                            </p>
                          )}
                          {s.camera_angle && (
                            <p className="text-[9px] text-muted-foreground/50 mt-1 flex items-center gap-1">
                              <Camera className="size-2" /> {s.camera_angle} · {s.camera_movement}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-border px-6 py-3 shrink-0">
            {step === 'suggestions' && (
              <button type="button" onClick={handleClose}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                Cancelar
              </button>
            )}

            {step === 'details' && (
              <>
                <button type="button" onClick={() => setStep('suggestions')}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  ← Atras
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => { handleCreateAll(); }} disabled={!canGoToScenes || savingScenes}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                  Crear sin escenas
                </button>
                <button type="button" onClick={() => setStep('scenes')} disabled={!canGoToScenes}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  Generar escenas <ChevronRight className="size-3.5" />
                </button>
              </>
            )}

            {step === 'scenes' && (
              <>
                <button type="button" onClick={() => setStep('details')}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  ← Volver
                </button>
                <div className="flex-1" />
                {generatedScenes.length > 0 && (
                  <button type="button" onClick={handleCreateAll} disabled={savingScenes}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {savingScenes ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Crear video con {generatedScenes.length} escenas
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
