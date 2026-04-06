'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  X, Sparkles, Send, Loader2, Film, Clock, Camera,
  ChevronDown, ChevronUp, Check, RefreshCw, Pencil,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */

interface GeneratedScene {
  title: string;
  description: string;
  duration_seconds: number;
  arc_phase: string;
  camera_angle: string;
  camera_movement: string;
  prompt_image: string;
  prompt_video: string;
  narration_text?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scenes?: GeneratedScene[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectId: string;
  videoTitle: string;
  videoPlatform: string;
  videoDuration: number;
  projectStyle?: string;
  existingSceneCount: number;
}

/* ── Phase colors ──────────────────────────────────────── */

const PHASE_COLORS: Record<string, string> = {
  hook: 'bg-red-500/20 text-red-400 border-red-500/30',
  build: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  peak: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  close: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

/* ── ScenePreviewCard ──────────────────────────────────── */

function ScenePreviewCard({
  scene,
  index,
  expanded,
  onToggle,
  onEdit,
  selected,
  onToggleSelect,
}: {
  scene: GeneratedScene;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (field: string, value: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card transition-all',
      selected ? 'border-primary/40 bg-primary/5' : 'border-border',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggleSelect}
          className={cn(
            'flex size-5 items-center justify-center rounded-md border transition-colors shrink-0',
            selected ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary/40',
          )}
        >
          {selected && <Check className="size-3" />}
        </button>

        <span className="text-xs font-bold text-muted-foreground w-5 text-right">#{index + 1}</span>
        <span className="text-sm font-medium text-foreground flex-1 truncate">{scene.title}</span>

        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', PHASE_COLORS[scene.arc_phase] ?? 'bg-zinc-500/20 text-muted-foreground border-zinc-500/30')}>
          {scene.arc_phase}
        </span>
        <span className="text-[10px] text-muted-foreground">{scene.duration_seconds}s</span>

        <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/50 px-3 py-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Descripción</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{scene.description}</p>
          </div>

          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Camera className="size-3" />{scene.camera_angle} · {scene.camera_movement}</span>
            <span className="flex items-center gap-1"><Clock className="size-3" />{scene.duration_seconds}s</span>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Prompt imagen</p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed bg-background rounded-lg px-2.5 py-2 border border-border/50">{scene.prompt_image}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Prompt video</p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed bg-background rounded-lg px-2.5 py-2 border border-border/50">{scene.prompt_video}</p>
          </div>

          {scene.narration_text && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Narración</p>
              <p className="text-xs italic text-muted-foreground">&ldquo;{scene.narration_text}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Modal ────────────────────────────────────────── */

export function SceneGeneratorModal({
  open,
  onOpenChange,
  videoId,
  projectId,
  videoTitle,
  videoPlatform,
  videoDuration,
  projectStyle,
  existingSceneCount,
}: Props) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<Set<number>>(new Set());
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Select all by default when scenes are generated
  useEffect(() => {
    if (generatedScenes.length > 0) {
      setSelectedScenes(new Set(generatedScenes.map((_, i) => i)));
    }
  }, [generatedScenes]);

  /* ── Generate scenes ────────────────────────────────── */
  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;

    setInput('');
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-scene-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: '__generate_storyboard__',
          brief: text,
          videoId,
          projectId,
          platform: videoPlatform,
          duration: videoDuration,
          style: projectStyle ?? 'pixar',
        }),
      });

      if (!res.ok) throw new Error('Error generating');
      const data = await res.json();

      // Mock scenes for now (API returns prompt, we generate mock scenes)
      const mockScenes: GeneratedScene[] = generateMockScenes(text, videoDuration, videoPlatform);
      setGeneratedScenes(mockScenes);

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `He creado ${mockScenes.length} escenas para tu video. Revísalas abajo y dime si quieres cambiar algo.`,
        scenes: mockScenes,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      // Fallback: generate mock scenes even without API
      const mockScenes = generateMockScenes(text, videoDuration, videoPlatform);
      setGeneratedScenes(mockScenes);

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `He planificado ${mockScenes.length} escenas basándome en tu descripción. Revisa cada una y dime qué cambiar.`,
        scenes: mockScenes,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsGenerating(false);
    }
  }

  /* ── Save selected scenes to DB ─────────────────────── */
  async function handleSaveScenes() {
    const scenesToSave = generatedScenes.filter((_, i) => selectedScenes.has(i));
    if (scenesToSave.length === 0) {
      toast.error('Selecciona al menos una escena');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();

      for (let i = 0; i < scenesToSave.length; i++) {
        const scene = scenesToSave[i];
        const sceneNumber = existingSceneCount + i + 1;
        const shortId = generateShortId();

        // Insert scene
        const { data: newScene, error: sceneError } = await supabase
          .from('scenes')
          .insert({
            video_id: videoId,
            project_id: projectId,
            title: scene.title,
            description: scene.description,
            duration_seconds: scene.duration_seconds,
            arc_phase: scene.arc_phase as 'hook' | 'build' | 'peak' | 'close',
            scene_number: sceneNumber,
            sort_order: sceneNumber,
            short_id: shortId,
            status: 'draft',
            scene_type: 'original',
            director_notes: scene.narration_text ?? '',
          })
          .select('id')
          .single();

        if (sceneError || !newScene) continue;

        // Insert camera
        await supabase.from('scene_camera').insert({
          scene_id: newScene.id,
          camera_angle: scene.camera_angle as 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'pov' | 'low_angle' | 'high_angle' | 'birds_eye' | 'dutch' | 'over_shoulder',
          camera_movement: scene.camera_movement as 'static' | 'dolly_in' | 'dolly_out' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'tracking' | 'crane' | 'handheld' | 'orbit',
        });

        // Insert prompts
        if (scene.prompt_image) {
          await supabase.from('scene_prompts').insert({
            scene_id: newScene.id,
            prompt_type: 'image',
            prompt_text: scene.prompt_image,
            version: 1,
            is_current: true,
            status: 'generated',
            generator: 'kiyoko-ai',
          });
        }
        if (scene.prompt_video) {
          await supabase.from('scene_prompts').insert({
            scene_id: newScene.id,
            prompt_type: 'video',
            prompt_text: scene.prompt_video,
            version: 1,
            is_current: true,
            status: 'generated',
            generator: 'kiyoko-ai',
          });
        }
      }

      toast.success(`${scenesToSave.length} escenas creadas`);
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      onOpenChange(false);
    } catch {
      toast.error('Error al guardar escenas');
    } finally {
      setIsSaving(false);
    }
  }

  /* ── Key handler ────────────────────────────────────── */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!open) return null;

  const selectedCount = selectedScenes.size;
  const totalDuration = generatedScenes.filter((_, i) => selectedScenes.has(i)).reduce((sum, s) => sum + s.duration_seconds, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-4 sm:inset-8 lg:inset-y-8 lg:left-[15%] lg:right-[15%] z-10 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Generador de escenas</p>
              <p className="text-[11px] text-muted-foreground">{videoTitle} · {videoPlatform} · {videoDuration}s</p>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Body: Chat + Scenes ── */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Chat */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-border">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Film className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground">Describe tu video</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Cuéntame qué quieres mostrar y generaré las escenas con arco narrativo, cámara, y prompts.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {[
                      'Anuncio 30s mostrando el equipo y servicios',
                      'Reel 15s con transformación antes/después',
                      'Presentación 60s con todos los profesionales',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInput(suggestion)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : '')}>
                  {msg.role === 'assistant' && (
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Sparkles className="size-3.5" />
                    </div>
                  )}
                  <div className={cn(
                    'rounded-xl px-3.5 py-2.5 text-sm max-w-[85%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border text-foreground',
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Sparkles className="size-3.5 animate-pulse" />
                  </div>
                  <div className="rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin inline mr-2" />
                    Generando escenas...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={generatedScenes.length > 0 ? 'Pide cambios: "Hazla más corta", "Cambia el ángulo"...' : 'Describe tu video...'}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating}
                  className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                >
                  {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Generated scenes */}
          <div className="w-[380px] shrink-0 flex flex-col bg-background/50 hidden lg:flex">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Escenas generadas {generatedScenes.length > 0 && `(${selectedCount}/${generatedScenes.length})`}
                </p>
                {generatedScenes.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{totalDuration}s total</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {generatedScenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Film className="size-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">Las escenas aparecerán aquí</p>
                </div>
              ) : (
                generatedScenes.map((scene, i) => (
                  <ScenePreviewCard
                    key={i}
                    scene={scene}
                    index={i}
                    expanded={expandedScene === i}
                    onToggle={() => setExpandedScene(expandedScene === i ? null : i)}
                    onEdit={() => {}}
                    selected={selectedScenes.has(i)}
                    onToggleSelect={() => {
                      const next = new Set(selectedScenes);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      setSelectedScenes(next);
                    }}
                  />
                ))
              )}
            </div>

            {/* Save button */}
            {generatedScenes.length > 0 && (
              <div className="border-t border-border px-4 py-3 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveScenes}
                  disabled={selectedCount === 0 || isSaving}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? (
                    <><Loader2 className="size-4 animate-spin inline mr-2" />Guardando...</>
                  ) : (
                    <>Crear {selectedCount} escena{selectedCount !== 1 ? 's' : ''} · {totalDuration}s</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setGeneratedScenes([]); setMessages([]); setSelectedScenes(new Set()); }}
                  className="w-full rounded-xl border border-border py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <RefreshCw className="size-3 inline mr-1.5" />
                  Empezar de nuevo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mock scene generator (until API is connected) ──── */

function generateMockScenes(brief: string, duration: number, platform: string): GeneratedScene[] {
  const numScenes = Math.max(3, Math.round(duration / 10));
  const phases = ['hook', 'build', 'build', 'peak', 'close'];
  const angles = ['wide', 'medium', 'close_up', 'extreme_close_up', 'low_angle'];
  const movements = ['dolly_in', 'static', 'tracking', 'pan_left', 'crane'];

  const scenes: GeneratedScene[] = [];
  const sceneDuration = Math.round(duration / numScenes);

  for (let i = 0; i < numScenes; i++) {
    const phase = phases[Math.min(i, phases.length - 1)];
    scenes.push({
      title: `Escena ${i + 1}`,
      description: `Escena generada basada en: "${brief.slice(0, 60)}..."`,
      duration_seconds: i === 0 ? Math.min(sceneDuration, 5) : sceneDuration,
      arc_phase: phase,
      camera_angle: angles[i % angles.length],
      camera_movement: movements[i % movements.length],
      prompt_image: `Pixar 3D animation style, ${brief.slice(0, 100)}, scene ${i + 1}, ${phase} phase, ${angles[i % angles.length]} shot, cinematic, 4K, detailed`,
      prompt_video: `Starting from frame: ${movements[i % movements.length]} camera, ${brief.slice(0, 80)}, ${sceneDuration} seconds, cinematic motion`,
      narration_text: i === 0 ? 'Narración de apertura...' : undefined,
    });
  }

  return scenes;
}
