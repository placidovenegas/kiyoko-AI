'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import {
  X, Sparkles, Send, Loader2, Copy, Check, Camera, Expand,
  Trash2, Wand2, Music, MessageSquare, Film, Clock, ChevronDown,
} from 'lucide-react';
import type { Scene } from '@/types';
import type { Database } from '@/types/database.types';

/* ── Types ─────────────────────────────────────────────── */

type CameraAngle = Database['public']['Enums']['camera_angle'];
type CameraMovement = Database['public']['Enums']['camera_movement'];

interface SceneForm {
  title: string;
  description: string;
  arcPhase: string;
  duration: number;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  dialogue: string;
  music: boolean;
  dialogue_audio: boolean;
  sfx: boolean;
  voiceover: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectId: string;
  nextSceneNumber?: number;
  scene?: Scene | null;
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  allScenes?: Scene[];
  onUpdate?: () => void;
}

/* ── Constants ─────────────────────────────────────────── */

const PHASES = [
  { value: 'hook', label: 'Hook', color: 'bg-red-500' },
  { value: 'build', label: 'Build', color: 'bg-amber-500' },
  { value: 'peak', label: 'Peak', color: 'bg-emerald-500' },
  { value: 'close', label: 'Close', color: 'bg-blue-500' },
];

const ANGLES: { value: CameraAngle; label: string }[] = [
  { value: 'wide', label: 'General' }, { value: 'medium', label: 'Medio' },
  { value: 'close_up', label: 'Primer plano' }, { value: 'extreme_close_up', label: 'Extreme CU' },
  { value: 'pov', label: 'POV' }, { value: 'low_angle', label: 'Contrapicado' },
  { value: 'high_angle', label: 'Picado' }, { value: 'birds_eye', label: 'Cenital' },
  { value: 'dutch', label: 'Dutch' }, { value: 'over_shoulder', label: 'Over shoulder' },
];

const MOVEMENTS: { value: CameraMovement; label: string }[] = [
  { value: 'static', label: 'Estática' }, { value: 'dolly_in', label: 'Dolly in' },
  { value: 'dolly_out', label: 'Dolly out' }, { value: 'pan_left', label: 'Pan izq' },
  { value: 'pan_right', label: 'Pan der' }, { value: 'tilt_up', label: 'Tilt up' },
  { value: 'tilt_down', label: 'Tilt down' }, { value: 'tracking', label: 'Tracking' },
  { value: 'crane', label: 'Grúa' }, { value: 'handheld', label: 'Handheld' },
  { value: 'orbit', label: 'Órbita' },
];

const DEFAULT_FORM: SceneForm = {
  title: '', description: '', arcPhase: 'build', duration: 5,
  cameraAngle: 'medium', cameraMovement: 'static', dialogue: '',
  music: false, dialogue_audio: false, sfx: false, voiceover: false,
};

/* ── Pill selector ─────────────────────────────────────── */

function PillSelect({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
              value === o.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
            )}
          >
            {o.color && <span className={cn('size-2 rounded-full', o.color)} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Toggle chip ───────────────────────────────────────── */

function ToggleChip({ label, icon: Icon, active, onClick }: {
  label: string; icon: typeof Music; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary/10 border border-primary/30 text-primary'
          : 'bg-card border border-border text-muted-foreground hover:border-primary/20',
      )}
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

/* ── Main Modal ────────────────────────────────────────── */

export function SceneWorkModal({
  open, onOpenChange, videoId, projectId, nextSceneNumber = 1,
  scene, imagePrompt, videoPrompt, allScenes = [], onUpdate,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!scene;
  const [mode, setMode] = useState<'manual' | 'ia'>('manual');
  const [form, setForm] = useState<SceneForm>(DEFAULT_FORM);
  const [insertPosition, setInsertPosition] = useState<'end' | number>('end');
  const [saving, setSaving] = useState(false);

  // IA mode state
  const [iaInput, setIaInput] = useState('');
  const [iaMessages, setIaMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [iaProcessing, setIaProcessing] = useState(false);
  const iaEndRef = useRef<HTMLDivElement>(null);

  // Init form from scene (edit mode)
  useEffect(() => {
    if (open && scene) {
      setForm({
        title: scene.title ?? '', description: scene.description ?? '',
        arcPhase: scene.arc_phase ?? 'build', duration: Number(scene.duration_seconds) || 5,
        cameraAngle: 'medium', cameraMovement: 'static', dialogue: scene.dialogue ?? '',
        music: false, dialogue_audio: false, sfx: false, voiceover: false,
      });
    } else if (open) {
      setForm(DEFAULT_FORM);
      setIaMessages([]);
      setIaInput('');
    }
  }, [open, scene]);

  useEffect(() => { iaEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [iaMessages]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onOpenChange]);

  const update = useCallback(<K extends keyof SceneForm>(key: K, val: SceneForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  // Adjacent scenes context
  const prevScene = typeof insertPosition === 'number' ? allScenes[insertPosition] : null;
  const nextScene = typeof insertPosition === 'number' ? allScenes[insertPosition + 1] : null;

  /* ── Auto-suggestion when position changes in IA mode ── */
  const lastSuggestedPositionRef = useRef<'end' | number | null>(null);

  useEffect(() => {
    if (!open || isEdit || mode !== 'ia') return;
    if (insertPosition === 'end') return;
    if (insertPosition === lastSuggestedPositionRef.current) return;
    if (typeof insertPosition !== 'number') return;

    const prev = allScenes[insertPosition];
    const next = allScenes[insertPosition + 1];
    if (!prev) return;

    lastSuggestedPositionRef.current = insertPosition;
    setIaMessages([]);
    setIaProcessing(true);

    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      // Determine suggested phase based on adjacent scenes
      const prevPhase: string = prev.arc_phase ?? 'build';
      const nextPhase: string | undefined = next?.arc_phase ?? undefined;
      let suggestedPhase = 'build';
      if (prevPhase === 'hook') suggestedPhase = 'build';
      else if (prevPhase === 'build' && nextPhase === 'peak') suggestedPhase = 'build';
      else if (prevPhase === 'build' && nextPhase === 'close') suggestedPhase = 'peak';
      else if (prevPhase === 'peak') suggestedPhase = 'close';
      else if (!nextPhase) suggestedPhase = prevPhase === 'peak' ? 'close' : 'peak';

      // Pick camera based on context
      const suggestedAngle: CameraAngle = prevPhase === 'hook' ? 'medium' : prevPhase === 'peak' ? 'close_up' : 'wide';
      const suggestedMovement: CameraMovement = suggestedPhase === 'peak' ? 'dolly_in' : suggestedPhase === 'close' ? 'dolly_out' : 'tracking';
      const suggestedDuration = prevPhase === 'hook' ? 4 : prevPhase === 'peak' ? 6 : 5;

      const prevTitle = prev.title ?? `Escena #${prev.scene_number}`;
      const nextTitle = next?.title ?? 'el final del vídeo';
      const prevDesc = prev.description ? ` — ${prev.description.slice(0, 80)}` : '';
      const nextDesc = next?.description ? ` — ${next.description.slice(0, 80)}` : '';

      const phaseLabel = PHASES.find(p => p.value === suggestedPhase)?.label ?? suggestedPhase;
      const angleLabel = ANGLES.find(a => a.value === suggestedAngle)?.label ?? 'Medio';
      const movLabel = MOVEMENTS.find(m => m.value === suggestedMovement)?.label ?? 'Estática';

      const suggestionTitle = suggestedPhase === 'peak'
        ? 'Momento clave de tensión'
        : suggestedPhase === 'close'
          ? 'Cierre y resolución'
          : 'Desarrollo de la narrativa';

      const content = `He analizado las escenas adyacentes para sugerirte la mejor transición:

**← Escena anterior:** "${prevTitle}"${prevDesc} (${prev.duration_seconds}s · ${prev.arc_phase})
**→ Escena siguiente:** "${nextTitle}"${nextDesc}${next ? ` (${next.duration_seconds}s · ${next.arc_phase})` : ''}

---

**Mi sugerencia:**

**Título:** ${suggestionTitle}
**Fase narrativa:** ${phaseLabel}
**Duración:** ${suggestedDuration}s
**Cámara:** ${angleLabel} con ${movLabel}

Esta escena debería funcionar como puente entre ambas, ${suggestedPhase === 'peak' ? 'elevando la intensidad antes del cierre' : suggestedPhase === 'close' ? 'resolviendo la tensión de la escena anterior' : 'construyendo la tensión narrativa hacia el clímax'}.

¿Qué prefieres?`;

      setIaMessages([{
        id: `auto-${Date.now()}`,
        role: 'assistant',
        content,
      }]);
      setIaProcessing(false);

      // Pre-fill the form with the suggestion
      setForm(f => ({
        ...f,
        title: suggestionTitle,
        arcPhase: suggestedPhase,
        duration: suggestedDuration,
        cameraAngle: suggestedAngle,
        cameraMovement: suggestedMovement,
      }));
    }, 800);

    return () => clearTimeout(timer);
  }, [open, isEdit, mode, insertPosition, allScenes]);

  // Reset suggestion ref when modal closes
  useEffect(() => {
    if (!open) lastSuggestedPositionRef.current = null;
  }, [open]);

  /* ── Save ────────────────────────────────────────────── */
  async function handleSave() {
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      if (isEdit && scene) {
        await supabase.from('scenes').update({
          title: form.title, description: form.description,
          arc_phase: form.arcPhase as 'hook' | 'build' | 'peak' | 'close',
          duration_seconds: form.duration, dialogue: form.dialogue,
        }).eq('id', scene.id);
        toast.success('Escena actualizada');
      } else {
        const num = insertPosition === 'end' ? allScenes.length + 1 : (typeof insertPosition === 'number' ? insertPosition + 2 : nextSceneNumber);
        const { data: newScene } = await supabase.from('scenes').insert({
          video_id: videoId, project_id: projectId, title: form.title,
          description: form.description, duration_seconds: form.duration,
          arc_phase: form.arcPhase as 'hook' | 'build' | 'peak' | 'close',
          scene_number: num, sort_order: num, short_id: generateShortId(),
          status: 'draft', scene_type: 'original', dialogue: form.dialogue,
        }).select('id').single();
        if (newScene) {
          await supabase.from('scene_camera').insert({
            scene_id: newScene.id,
            camera_angle: form.cameraAngle,
            camera_movement: form.cameraMovement,
          });
        }
        toast.success('Escena creada');
      }
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      onUpdate?.();
      onOpenChange(false);
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  }

  /* ── IA handler ──────────────────────────────────────── */
  function handleIaSend() {
    const text = iaInput.trim();
    if (!text || iaProcessing) return;
    setIaInput('');
    setIaProcessing(true);
    setIaMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);
    setTimeout(() => {
      const context = prevScene ? `Insertar entre "${prevScene.title}" y "${nextScene?.title ?? 'final'}".` : '';
      setIaMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant',
        content: `He analizado tu petición${context ? ` (${context})` : ''}. Sugiero una escena de ${form.duration}s con ${ANGLES.find(a => a.value === form.cameraAngle)?.label ?? 'plano medio'}.\n\n¿Quieres que rellene el formulario con esta sugerencia?`,
      }]);
      setIaProcessing(false);
    }, 600);
  }

  if (!open) return null;

  const sceneNum = isEdit ? scene?.scene_number : (insertPosition === 'end' ? allScenes.length + 1 : (typeof insertPosition === 'number' ? insertPosition + 2 : nextSceneNumber));

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-4 sm:inset-6 lg:inset-y-6 lg:left-[10%] lg:right-[10%] z-10 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          <div className="flex rounded-lg border border-border p-0.5 bg-background">
            {(['manual', 'ia'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)} className={cn(
                'rounded-md px-3.5 py-1.5 text-xs font-medium transition-all',
                mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}>
                {m === 'manual' ? 'Manual' : '✨ Con IA'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {isEdit ? `Editar escena #${scene?.scene_number}` : `Nueva escena #${sceneNum}`}
            </p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left: Form or IA ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {mode === 'manual' ? (
              <div className="space-y-5 max-w-lg">
                {/* Position */}
                {!isEdit && allScenes.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Insertar</p>
                    <select
                      value={insertPosition === 'end' ? 'end' : String(insertPosition)}
                      onChange={e => setInsertPosition(e.target.value === 'end' ? 'end' : parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                    >
                      <option value="end">Al final (escena #{allScenes.length + 1})</option>
                      {allScenes.map((s, i) => (
                        <option key={s.id} value={i}>Después de #{s.scene_number} "{s.title}"</option>
                      ))}
                    </select>
                    {prevScene && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-[11px] text-muted-foreground">
                        <span>←</span>
                        <span className="text-foreground font-medium">{prevScene.title}</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-foreground font-medium">{nextScene?.title ?? 'Final'}</span>
                        <span>→</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Título <span className="text-danger-500">*</span></p>
                  <input
                    type="text" value={form.title} onChange={e => update('title', e.target.value)}
                    placeholder="Ej. Ana entra en la oficina" autoFocus
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Descripción visual</p>
                  <textarea
                    value={form.description} onChange={e => update('description', e.target.value)}
                    placeholder="Describe qué se ve en la escena..." rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none resize-y placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                  />
                </div>

                {/* Phase pills */}
                <PillSelect label="Fase narrativa" options={PHASES} value={form.arcPhase} onChange={v => update('arcPhase', v)} />

                {/* Duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground">Duración</p>
                    <span className="text-sm font-semibold text-primary tabular-nums">{form.duration}s</span>
                  </div>
                  <input
                    type="range" min={1} max={30} step={1} value={form.duration}
                    onChange={e => update('duration', parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>1s</span><span>15s</span><span>30s</span>
                  </div>
                </div>

                {/* Camera — two inline selects */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Ángulo</p>
                    <div className="relative">
                      <select value={form.cameraAngle} onChange={e => update('cameraAngle', e.target.value as CameraAngle)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none appearance-none pr-8 focus:border-primary/30">
                        {ANGLES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Movimiento</p>
                    <div className="relative">
                      <select value={form.cameraMovement} onChange={e => update('cameraMovement', e.target.value as CameraMovement)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none appearance-none pr-8 focus:border-primary/30">
                        {MOVEMENTS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Audio toggles */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Audio</p>
                  <div className="flex flex-wrap gap-1.5">
                    <ToggleChip label="Música" icon={Music} active={form.music} onClick={() => update('music', !form.music)} />
                    <ToggleChip label="Diálogo" icon={MessageSquare} active={form.dialogue_audio} onClick={() => update('dialogue_audio', !form.dialogue_audio)} />
                    <ToggleChip label="SFX" icon={Film} active={form.sfx} onClick={() => update('sfx', !form.sfx)} />
                    <ToggleChip label="Voiceover" icon={Music} active={form.voiceover} onClick={() => update('voiceover', !form.voiceover)} />
                  </div>
                </div>

                {/* Dialogue */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Diálogo / Narración</p>
                  <textarea
                    value={form.dialogue} onChange={e => update('dialogue', e.target.value)}
                    placeholder="Qué se dice o narra en esta escena..." rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none resize-y placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                  />
                </div>
              </div>
            ) : (
              /* ── IA Mode ── */
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-3">
                  {iaMessages.length === 0 && (
                    <div className="space-y-4 py-4">
                      {/* Position selector in IA mode */}
                      {!isEdit && allScenes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-medium text-muted-foreground">¿Dónde va esta escena?</p>
                          <select
                            value={insertPosition === 'end' ? 'end' : String(insertPosition)}
                            onChange={e => setInsertPosition(e.target.value === 'end' ? 'end' : parseInt(e.target.value, 10))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/30"
                          >
                            <option value="end">Al final (escena #{allScenes.length + 1})</option>
                            {allScenes.map((s, i) => (
                              <option key={s.id} value={i}>Después de #{s.scene_number} "{s.title}"</option>
                            ))}
                          </select>
                          {prevScene && (
                            <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 text-[11px] text-muted-foreground space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="size-3 text-primary" />
                                <p className="text-[11px] font-medium text-primary">Kiyoko está analizando el contexto...</p>
                              </div>
                              <p>← <strong className="text-foreground">{prevScene.title}</strong> ({prevScene.duration_seconds}s · {prevScene.arc_phase})</p>
                              {nextScene && <p>→ <strong className="text-foreground">{nextScene.title}</strong> ({nextScene.duration_seconds}s · {nextScene.arc_phase})</p>}
                              <p className="text-muted-foreground/60 mt-0.5">Generando sugerencia automática...</p>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground">
                        {isEdit ? '¿Qué quieres hacer con esta escena?' : (
                          insertPosition === 'end' && allScenes.length > 0
                            ? 'Selecciona una posición entre escenas para que Kiyoko te sugiera automáticamente, o describe lo que quieres.'
                            : allScenes.length === 0
                              ? 'Describe tu primera escena y Kiyoko te ayudará a crearla.'
                              : 'Describe qué quieres y Kiyoko te ayudará a crearla.'
                        )}
                      </p>
                      {!isEdit && (
                        <div className="flex flex-wrap gap-1.5">
                          {['Gancho visual impactante', 'Transición suave', 'Close-up emocional', 'Escena de acción'].map(s => (
                            <button key={s} type="button" onClick={() => setIaInput(s)}
                              className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {isEdit && (
                        <div className="grid gap-2">
                          {[
                            { label: 'Mejorar escena', icon: Sparkles, color: 'text-primary bg-primary/10 border-primary/20' },
                            { label: 'Extender escena', icon: Expand, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                            { label: 'Cambiar cámara', icon: Camera, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                            { label: 'Regenerar prompts', icon: Wand2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                          ].map(a => (
                            <button key={a.label} type="button" onClick={() => { setIaInput(a.label); handleIaSend(); }}
                              className={cn('flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm font-medium transition-all hover:shadow-md', a.color)}>
                              <a.icon className="size-4" />{a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {iaMessages.map(msg => (
                    <div key={msg.id}>
                      <div className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : '')}>
                        {msg.role === 'assistant' && <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5"><Sparkles className="size-3" /></div>}
                        <div className={cn('rounded-xl px-3 py-2 text-sm max-w-[85%]',
                          msg.role === 'user' ? 'bg-primary text-primary-foreground whitespace-pre-line' : 'bg-background border border-border text-foreground')}>
                          {msg.role === 'assistant' ? (
                            <div className="space-y-2 [&_strong]:font-semibold [&_strong]:text-foreground">
                              {msg.content.split('\n').map((line, li) => {
                                if (line === '---') return <hr key={li} className="border-border my-1" />;
                                if (line.startsWith('**') && line.includes(':**')) {
                                  const parts = line.match(/^\*\*(.+?):\*\*\s?(.*)/);
                                  if (parts) return <p key={li} className="text-xs"><strong>{parts[1]}:</strong> {parts[2]}</p>;
                                }
                                if (line.startsWith('**') && line.endsWith('**')) {
                                  return <p key={li} className="text-xs font-semibold text-foreground mt-2">{line.replace(/\*\*/g, '')}</p>;
                                }
                                if (!line.trim()) return null;
                                return <p key={li} className="text-xs text-muted-foreground">{line}</p>;
                              })}
                            </div>
                          ) : msg.content}
                        </div>
                      </div>
                      {/* Action buttons after auto-suggestion */}
                      {msg.role === 'assistant' && msg.id.startsWith('auto-') && (
                        <div className="flex items-center gap-2 mt-2 ml-8">
                          <button type="button"
                            onClick={() => { setMode('manual'); }}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                            <Check className="size-3" />Usar sugerencia
                          </button>
                          <button type="button"
                            onClick={() => {
                              setIaInput('Dame otra opción diferente');
                              setTimeout(() => handleIaSend(), 50);
                            }}
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                            Otra opción
                          </button>
                          <button type="button"
                            onClick={() => setIaInput('')}
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                            Personalizar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {iaProcessing && (
                    <div className="flex gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0"><Sparkles className="size-3 animate-pulse" /></div>
                      <div className="rounded-xl bg-background border border-border px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin inline mr-1.5" />Pensando...
                      </div>
                    </div>
                  )}
                  <div ref={iaEndRef} />
                </div>
                <div className="flex items-end gap-2 pt-3 border-t border-border mt-3">
                  <textarea value={iaInput} onChange={e => setIaInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIaSend(); } }}
                    placeholder="Describe qué quieres..." rows={2}
                    className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/30"
                  />
                  <button type="button" onClick={handleIaSend} disabled={!iaInput.trim() || iaProcessing}
                    className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Preview ── */}
          <div className="w-[300px] shrink-0 border-l border-border bg-background/50 p-4 overflow-y-auto hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">#{sceneNum}</span>
                <span className="text-sm font-medium text-foreground truncate">{form.title || 'Sin título'}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="size-3" />{form.duration}s</span>
                <span className={cn('size-2 rounded-full', PHASES.find(p => p.value === form.arcPhase)?.color ?? 'bg-zinc-500')} />
                <span>{form.arcPhase}</span>
              </div>

              {form.description && <p className="text-xs text-muted-foreground line-clamp-3">{form.description}</p>}

              <div className="text-[11px] text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5"><Camera className="size-3" />{ANGLES.find(a => a.value === form.cameraAngle)?.label} · {MOVEMENTS.find(m => m.value === form.cameraMovement)?.label}</p>
                <p className="flex items-center gap-1.5">
                  <Music className="size-3" />
                  {[form.music && 'Música', form.sfx && 'SFX', form.dialogue_audio && 'Diálogo', form.voiceover && 'Voz'].filter(Boolean).join(' · ') || 'Sin audio'}
                </p>
              </div>

              {form.dialogue && (
                <p className="text-xs italic text-muted-foreground border-l-2 border-primary/20 pl-2 line-clamp-2">&ldquo;{form.dialogue}&rdquo;</p>
              )}

              {/* Prompts (edit mode) */}
              {isEdit && (imagePrompt || videoPrompt) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {imagePrompt && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">Prompt imagen</p>
                      <p className="font-mono text-[10px] text-muted-foreground line-clamp-2 bg-background rounded px-2 py-1">{imagePrompt}</p>
                    </div>
                  )}
                  {videoPrompt && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">Prompt video</p>
                      <p className="font-mono text-[10px] text-muted-foreground line-clamp-2 bg-background rounded px-2 py-1">{videoPrompt}</p>
                    </div>
                  )}
                </div>
              )}

              {!isEdit && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-[10px] text-muted-foreground">
                  <Sparkles className="size-3 text-primary shrink-0" />
                  Los prompts se generarán al crear
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 shrink-0">
          <button type="button" onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={!form.title.trim() || saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear escena'}
          </button>
        </div>
      </div>
    </div>
  );
}
