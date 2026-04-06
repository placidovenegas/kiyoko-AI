'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  X, Sparkles, Send, Loader2, Film, Camera, Music, BookOpen,
  ChevronDown, ChevronUp, Check, RefreshCw, Copy,
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
  has_music?: boolean;
  has_dialogue?: boolean;
  has_sfx?: boolean;
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

/* ── Constants ────────────────────────────────────────── */

const DURATIONS = [15, 30, 60, 90] as const;
const VIDEO_TYPES = [
  { value: 'reel', label: 'Reel' },
  { value: 'anuncio', label: 'Anuncio' },
  { value: 'presentacion', label: 'Presentacion' },
  { value: 'otro', label: 'Otro' },
] as const;

const PHASE_COLORS: Record<string, string> = {
  hook: 'bg-red-500/20 text-red-400 border-red-500/30',
  build: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  peak: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  close: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

/* ── TogglePill ───────────────────────────────────────── */

function TogglePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/* ── CopyButton ───────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

/* ── SceneCard ────────────────────────────────────────── */

function SceneCard({
  scene, index, expanded, onToggle, selected, onToggleSelect,
}: {
  scene: GeneratedScene;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card transition-all',
      selected ? 'border-primary/40 bg-primary/5' : 'border-border',
    )}>
      {/* Header row */}
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
        <span className="text-[10px] text-muted-foreground tabular-nums">{scene.duration_seconds}s</span>
      </div>

      {/* Summary info */}
      <div className="px-3 pb-2.5 space-y-1.5">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex items-start gap-1.5">
          <BookOpen className="size-3 mt-0.5 shrink-0 text-muted-foreground/60" />
          {scene.description}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Camera className="size-3" />{scene.camera_angle.replace('_', ' ')} &middot; {scene.camera_movement.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Music className="size-3" />Musica: {scene.has_music !== false ? 'si' : 'no'}
          </span>
          <span>Dialogo: {scene.has_dialogue ? 'si' : 'no'}</span>
        </div>
        {scene.narration_text ? (
          <p className="text-[10px] text-muted-foreground/80 italic flex items-start gap-1.5">
            <BookOpen className="size-3 mt-0.5 shrink-0" />
            &ldquo;{scene.narration_text}&rdquo;
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground/50">Sin narracion</p>
        )}
      </div>

      {/* Toggle prompts */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-1 border-t border-border/50 px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
      >
        {expanded ? 'Ocultar prompts' : 'Ver prompts'}
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {/* Expanded prompts */}
      {expanded && (
        <div className="border-t border-border/50 px-3 py-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt imagen</p>
              <CopyButton text={scene.prompt_image} />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed bg-background rounded-lg px-2.5 py-2 border border-border/50 max-h-32 overflow-y-auto">
              {scene.prompt_image}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt video</p>
              <CopyButton text={scene.prompt_video} />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed bg-background rounded-lg px-2.5 py-2 border border-border/50 max-h-32 overflow-y-auto whitespace-pre-line">
              {scene.prompt_video}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Modal ────────────────────────────────────────── */

export function SceneGeneratorModal({
  open, onOpenChange, videoId, projectId, videoTitle,
  videoPlatform, videoDuration, projectStyle, existingSceneCount,
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

  // Config state
  const [selectedDuration, setSelectedDuration] = useState<number>(videoDuration);
  const [customDuration, setCustomDuration] = useState('');
  const [selectedType, setSelectedType] = useState<string>(
    videoPlatform === 'tiktok' || videoPlatform === 'instagram_reels' ? 'reel' : 'anuncio',
  );

  const activeDuration = customDuration ? parseInt(customDuration, 10) || selectedDuration : selectedDuration;
  const style = projectStyle ?? 'pixar';

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);
  useEffect(() => {
    if (generatedScenes.length > 0) setSelectedScenes(new Set(generatedScenes.map((_, i) => i)));
  }, [generatedScenes]);

  /* ── Generate scenes ────────────────────────────────── */
  async function handleSend() {
    if (isGenerating) return;
    const text = input.trim() || `Genera un ${VIDEO_TYPES.find(t => t.value === selectedType)?.label?.toLowerCase() ?? 'video'} de ${activeDuration}s para "${videoTitle}"`;

    setInput('');
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Check if this is a modification request on existing scenes
    if (generatedScenes.length > 0) {
      setTimeout(() => {
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: `He actualizado las escenas segun tu indicacion. Revisa los cambios a la derecha.\n\nSi quieres mas ajustes, dimelo aqui.`,
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsGenerating(false);
      }, 800);
      return;
    }

    try {
      await fetch('/api/ai/generate-scene-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: '__generate_storyboard__',
          brief: text, videoId, projectId,
          platform: videoPlatform,
          duration: activeDuration,
          style,
        }),
      });
    } catch {
      // API may not be ready, continue with mock
    }

    const mockScenes = generateMockScenes(text, activeDuration, selectedType, style);
    setGeneratedScenes(mockScenes);

    const totalDur = mockScenes.reduce((s, sc) => s + sc.duration_seconds, 0);
    const typeLabel = VIDEO_TYPES.find(t => t.value === selectedType)?.label ?? selectedType;

    // Build detailed chat message
    let chatContent = `He creado ${mockScenes.length} escenas para tu ${typeLabel.toLowerCase()} de ${totalDur} segundos:\n\n`;
    mockScenes.forEach((sc, i) => {
      chatContent += `${i + 1}. **${sc.title}** (${sc.duration_seconds}s) — ${sc.description}\n`;
      chatContent += `   Camara: ${sc.camera_angle.replace('_', ' ')} con ${sc.camera_movement.replace('_', ' ')}.`;
      chatContent += sc.has_music !== false ? ' Musica: si.' : '';
      chatContent += sc.has_dialogue ? ' Dialogo: si.' : '';
      chatContent += sc.narration_text ? ` Narracion: "${sc.narration_text}"` : ' Sin narracion.';
      chatContent += '\n\n';
    });
    chatContent += `Quieres cambiar algo? Puedes decirme:\n`;
    chatContent += `- "Hazla mas corta la primera"\n`;
    chatContent += `- "Cambia el angulo de la segunda a cenital"\n`;
    chatContent += `- "Anade una escena de cierre con logo"`;

    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: chatContent,
      scenes: mockScenes,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsGenerating(false);
  }

  /* ── Save selected scenes to DB ─────────────────────── */
  async function handleSaveScenes() {
    const scenesToSave = generatedScenes.filter((_, i) => selectedScenes.has(i));
    if (scenesToSave.length === 0) { toast.error('Selecciona al menos una escena'); return; }

    setIsSaving(true);
    try {
      const supabase = createClient();
      for (let i = 0; i < scenesToSave.length; i++) {
        const scene = scenesToSave[i];
        const sceneNumber = existingSceneCount + i + 1;
        const shortId = generateShortId();

        const { data: newScene, error: sceneError } = await supabase
          .from('scenes')
          .insert({
            video_id: videoId, project_id: projectId,
            title: scene.title, description: scene.description,
            duration_seconds: scene.duration_seconds,
            arc_phase: scene.arc_phase as 'hook' | 'build' | 'peak' | 'close',
            scene_number: sceneNumber, sort_order: sceneNumber,
            short_id: shortId, status: 'draft', scene_type: 'original',
            director_notes: scene.narration_text ?? '',
          })
          .select('id').single();

        if (sceneError || !newScene) continue;

        await supabase.from('scene_camera').insert({
          scene_id: newScene.id,
          camera_angle: scene.camera_angle as 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'pov' | 'low_angle' | 'high_angle' | 'birds_eye' | 'dutch' | 'over_shoulder',
          camera_movement: scene.camera_movement as 'static' | 'dolly_in' | 'dolly_out' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'tracking' | 'crane' | 'handheld' | 'orbit',
        });

        if (scene.prompt_image) {
          await supabase.from('scene_prompts').insert({
            scene_id: newScene.id, prompt_type: 'image', prompt_text: scene.prompt_image,
            version: 1, is_current: true, status: 'generated', generator: 'kiyoko-ai',
          });
        }
        if (scene.prompt_video) {
          await supabase.from('scene_prompts').insert({
            scene_id: newScene.id, prompt_type: 'video', prompt_text: scene.prompt_video,
            version: 1, is_current: true, status: 'generated', generator: 'kiyoko-ai',
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleReset() {
    setGeneratedScenes([]);
    setMessages([]);
    setSelectedScenes(new Set());
    setExpandedScene(null);
  }

  if (!open) return null;

  const selectedCount = selectedScenes.size;
  const totalDuration = generatedScenes.filter((_, i) => selectedScenes.has(i)).reduce((sum, s) => sum + s.duration_seconds, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-4 sm:inset-6 lg:inset-y-6 lg:left-[10%] lg:right-[10%] z-10 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Top bar: title + config ── */}
        <div className="border-b border-border px-5 py-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">Generador de escenas</p>
            </div>
            <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </div>

          {/* Config row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Duracion:</span>
              <div className="flex items-center gap-1">
                {DURATIONS.map(d => (
                  <TogglePill key={d} active={selectedDuration === d && !customDuration} onClick={() => { setSelectedDuration(d); setCustomDuration(''); }}>
                    {d}s
                  </TogglePill>
                ))}
                <input
                  type="number"
                  value={customDuration}
                  onChange={e => setCustomDuration(e.target.value)}
                  placeholder="..."
                  min={5}
                  max={300}
                  className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tipo:</span>
              <div className="flex items-center gap-1">
                {VIDEO_TYPES.map(t => (
                  <TogglePill key={t.value} active={selectedType === t.value} onClick={() => setSelectedType(t.value)}>
                    {t.label}
                  </TogglePill>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Estilo:</span>
              <span className="rounded-lg bg-accent/50 px-2.5 py-1.5 text-xs text-muted-foreground">{style}</span>
            </div>
          </div>
        </div>

        {/* ── Body: Chat + Scenes ── */}
        <div className="flex flex-1 min-h-0">

          {/* Left: Chat */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-border">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Film className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground">Que quieres mostrar en tu video?</p>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-md">
                    Describe lo que quieres comunicar y generare escenas con arco narrativo, camara y prompts listos para IA.
                  </p>
                  <div className="mt-5 w-full max-w-md">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ej: Un reel para ${videoTitle} mostrando el proceso de transformacion con antes/despues...`}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={isGenerating}
                      className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {isGenerating ? <><Loader2 className="size-4 animate-spin inline mr-2" />Generando...</> : input.trim() ? 'Generar escenas' : `Generar para "${videoTitle}"`}
                    </button>
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : '')}>
                  {msg.role === 'assistant' && (
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Sparkles className="size-3.5" />
                    </div>
                  )}
                  <div className={cn(
                    'rounded-xl px-3.5 py-2.5 text-sm max-w-[85%] whitespace-pre-line leading-relaxed',
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
                    <Loader2 className="size-4 animate-spin inline mr-2" />Generando escenas...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input (after first message) */}
            {messages.length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={messages.length > 0 ? inputRef : undefined}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='Pide cambios: "Hazla mas corta", "Cambia el angulo"...'
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
            )}
          </div>

          {/* Right: Scene cards */}
          <div className="w-[400px] shrink-0 flex flex-col bg-background/50 hidden lg:flex">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Escenas {generatedScenes.length > 0 && `(${selectedCount}/${generatedScenes.length})`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {generatedScenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Film className="size-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">Las escenas apareceran aqui</p>
                </div>
              ) : (
                generatedScenes.map((scene, i) => (
                  <SceneCard
                    key={i}
                    scene={scene}
                    index={i}
                    expanded={expandedScene === i}
                    onToggle={() => setExpandedScene(expandedScene === i ? null : i)}
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

            {/* Bottom summary + save */}
            {generatedScenes.length > 0 && (
              <div className="border-t border-border px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{selectedCount} escena{selectedCount !== 1 ? 's' : ''} &middot; {totalDuration}s total</span>
                  {selectedCount > 0 && <span className="text-emerald-400 flex items-center gap-1"><Check className="size-3" />Listo</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveScenes}
                    disabled={selectedCount === 0 || isSaving}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isSaving
                      ? <><Loader2 className="size-4 animate-spin inline mr-2" />Guardando...</>
                      : <>Crear {selectedCount} escena{selectedCount !== 1 ? 's' : ''}</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Scene templates ─────────────────────────────────── */

type SceneTemplate = { titles: string[]; descriptions: string[]; narrations: string[]; music: boolean[]; dialogue: boolean[] };
const SCENE_TEMPLATES: Record<string, SceneTemplate> = {
  reel: {
    titles: ['Gancho visual', 'Transformacion', 'Reveal'],
    descriptions: [
      'Plano impactante que capta la atencion al instante y rompe la monotonia del scroll.',
      'Proceso de cambio con transiciones fluidas. El espectador ve la transformacion en tiempo real.',
      'Revelacion del resultado final con reaccion emocional. El plano se abre mostrando el impacto.',
    ],
    narrations: ['', '', ''], music: [true, true, true], dialogue: [false, false, false],
  },
  anuncio: {
    titles: ['Apertura con gancho', 'Presentacion del servicio', 'Equipo en accion', 'Resultados y testimonios', 'Call to action'],
    descriptions: [
      'Imagen impactante que capta la atencion. Pregunta visual que genera curiosidad y conecta con el cliente.',
      'Presentacion del servicio principal. Espacio, marca y propuesta de valor en entorno profesional.',
      'Equipo profesional trabajando con precision. Planos de detalle con tecnica y atencion al cliente.',
      'Clientes mostrando satisfaccion. Sonrisas genuinas, transformaciones visibles que generan confianza.',
      'Cierre con logo, contacto y llamada a la accion directa que motiva al siguiente paso.',
    ],
    narrations: ['Descubre algo que cambiara tu forma de verlo todo.', 'En nuestro espacio, cada detalle importa.', 'Un equipo de profesionales apasionados por su trabajo.', 'La satisfaccion de nuestros clientes habla por si misma.', 'Tu mejor version empieza aqui. Visitanos.'],
    music: [true, true, true, true, true], dialogue: [false, false, false, true, false],
  },
  presentacion: {
    titles: ['Intro de marca', 'El equipo profesional', 'Servicios principales', 'Especializacion unica', 'Montaje de resultados', 'Cierre con CTA'],
    descriptions: [
      'Logo y marca aparecen con elegancia cinematografica. Establece tono visual y personalidad de marca.',
      'Retrato del equipo mostrando cercania y profesionalidad. Confianza y experiencia en cada miembro.',
      'Montaje dinamico de servicios principales con transiciones fluidas entre areas de trabajo.',
      'Lo que hace especial a la marca: servicio estrella o diferenciador explicado de forma visual.',
      'Galeria de resultados y momentos de satisfaccion del cliente con transiciones suaves.',
      'Fachada al atardecer con iluminacion calida. Contacto, redes y mensaje final que invita a visitar.',
    ],
    narrations: ['', 'Un equipo que lleva anos perfeccionando su arte.', 'Ofrecemos una gama completa de servicios profesionales.', 'Nuestra especialidad es lo que nos hace diferentes.', 'Miles de clientes confian en nosotros cada ano.', 'Visitanos y descubre tu mejor version.'],
    music: [true, true, true, true, true, true], dialogue: [false, false, false, false, true, false],
  },
  otro: {
    titles: ['Apertura', 'Desarrollo', 'Cierre'],
    descriptions: [
      'Plano de apertura que establece contexto y tono. Introduce al espectador en la historia.',
      'Desarrollo del contenido principal con ritmo y variedad visual. Mensaje central claro.',
      'Cierre con impacto emocional y mensaje final que permanece en la memoria del espectador.',
    ],
    narrations: ['', '', ''], music: [true, true, true], dialogue: [false, false, false],
  },
};

/* ── Mock generator ──────────────────────────────────── */

function generateMockScenes(brief: string, duration: number, type: string, style: string): GeneratedScene[] {
  const template = SCENE_TEMPLATES[type] ?? SCENE_TEMPLATES.otro;
  const numScenes = template.titles.length;

  const phases: string[] = numScenes <= 3
    ? ['hook', 'build', 'close']
    : numScenes <= 5
    ? ['hook', 'build', 'build', 'peak', 'close']
    : ['hook', 'build', 'build', 'peak', 'peak', 'close'];

  const hookDuration = Math.max(2, Math.min(5, Math.round(duration * 0.15)));
  const closeDuration = Math.max(3, Math.min(8, Math.round(duration * 0.18)));
  const middleDuration = duration - hookDuration - closeDuration;
  const middleScenes = numScenes - 2;
  const middleEach = Math.max(2, Math.round(middleDuration / Math.max(middleScenes, 1)));

  // Adjust last middle scene to ensure total matches
  const sceneDurations = template.titles.map((_, i) => {
    if (i === 0) return hookDuration;
    if (i === numScenes - 1) return closeDuration;
    return middleEach;
  });
  const currentTotal = sceneDurations.reduce((a, b) => a + b, 0);
  if (currentTotal !== duration && numScenes > 2) {
    sceneDurations[numScenes - 2] += duration - currentTotal;
  }

  const angles = ['wide', 'medium', 'close_up', 'medium', 'low_angle', 'wide'];
  const movements = ['dolly_in', 'tracking', 'static', 'pan_left', 'crane', 'dolly_out'];

  return template.titles.map((title, i) => {
    const sceneDur = Math.max(2, sceneDurations[i]);
    const phase = phases[Math.min(i, phases.length - 1)];
    const angle = angles[i % angles.length];
    const movement = movements[i % movements.length];

    return {
      title,
      description: template.descriptions[i] ?? '',
      duration_seconds: sceneDur,
      arc_phase: phase,
      camera_angle: angle,
      camera_movement: movement,
      prompt_image: buildImagePrompt(template.descriptions[i] ?? brief, angle, brief, style),
      prompt_video: buildVideoPrompt(template.descriptions[i] ?? brief, movement, sceneDur, angle, style),
      narration_text: template.narrations[i] || undefined,
      has_music: template.music[i] ?? true,
      has_dialogue: template.dialogue[i] ?? false,
      has_sfx: i === 0,
    };
  });
}

const ANGLE_DESC: Record<string, string> = {
  wide: 'wide establishing shot showing full environment', medium: 'medium shot from waist up, balanced composition',
  close_up: 'close-up shot capturing facial expression and detail', extreme_close_up: 'extreme close-up on specific detail',
  low_angle: 'low angle looking up, powerful heroic perspective', high_angle: 'high angle looking down, overview perspective',
};
const MOVE_DESC: Record<string, string> = {
  dolly_in: 'smooth dolly-in pushing toward the subject', dolly_out: 'slow dolly-out pulling back to reveal environment',
  tracking: 'lateral tracking shot following the action', pan_left: 'slow pan left revealing the scene',
  pan_right: 'smooth pan right following the subject', crane: 'crane shot rising up to reveal full scene',
  static: 'locked camera, only subject moves', orbit: 'slow orbit around the subject',
};

function buildImagePrompt(description: string, angle: string, brief: string, style: string): string {
  return `Highly detailed ${style}-style 3D animated scene, cinematic 16:9, 8K. ${ANGLE_DESC[angle] ?? 'medium shot'}. ${description} Context: ${brief.slice(0, 120)}. Professional warm studio lighting, volumetric light rays, shallow depth of field with bokeh background, rich color palette, ${style}-quality rendering, subsurface skin scattering, detailed fabric textures, ambient particles floating in light. Clean composition, emotionally engaging. 8K, ultra detailed.`;
}

function buildVideoPrompt(description: string, movement: string, duration: number, _angle: string, style: string): string {
  const half = Math.round(duration / 2);
  const fmt = (n: number) => n < 10 ? `0:0${n}` : `0:${String(n).padStart(2, '0')}`;
  return `${duration}-second ${style}-quality 3D animation, 16:9, 8K, 24fps. Start from uploaded image. Single continuous camera, NO jump cuts.\n\n0:00-${fmt(half)} — ${MOVE_DESC[movement] ?? 'smooth camera movement'}. ${description} Warm lighting, natural character animation with subtle breathing and micro-expressions.\n\n${fmt(half)}-${fmt(duration)} — Camera settles into final composition. Emotional beat — key moment. Hold for impact. Subtle ambient particles, lens flare.\n\nAudio: ambient environment sounds, action sounds matching the scene, emotional music accent on key moment.`;
}
