'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import {
  X, Sparkles, Send, Loader2, Copy, Check,
  Camera, Expand, Trash2, Wand2,
} from 'lucide-react';
import type { Scene } from '@/types';
import type { Database } from '@/types/database.types';

/* ── Enums ────────────────────────────────────────────── */

type CameraAngle = Database['public']['Enums']['camera_angle'];
type CameraMovement = Database['public']['Enums']['camera_movement'];

const CAMERA_ANGLES: { value: CameraAngle; label: string }[] = [
  { value: 'wide', label: 'Plano general' },
  { value: 'medium', label: 'Plano medio' },
  { value: 'close_up', label: 'Primer plano' },
  { value: 'extreme_close_up', label: 'Extreme close-up' },
  { value: 'pov', label: 'POV' },
  { value: 'low_angle', label: 'Contrapicado' },
  { value: 'high_angle', label: 'Picado' },
  { value: 'birds_eye', label: 'Cenital' },
  { value: 'dutch', label: 'Dutch angle' },
  { value: 'over_shoulder', label: 'Over shoulder' },
];

const CAMERA_MOVEMENTS: { value: CameraMovement; label: string }[] = [
  { value: 'static', label: 'Estatica' },
  { value: 'dolly_in', label: 'Dolly in' },
  { value: 'dolly_out', label: 'Dolly out' },
  { value: 'pan_left', label: 'Pan izquierda' },
  { value: 'pan_right', label: 'Pan derecha' },
  { value: 'tilt_up', label: 'Tilt arriba' },
  { value: 'tilt_down', label: 'Tilt abajo' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'crane', label: 'Grua' },
  { value: 'handheld', label: 'Handheld' },
  { value: 'orbit', label: 'Orbita' },
];

const ARC_PHASES = [
  { value: 'hook', label: 'Hook' },
  { value: 'build', label: 'Build' },
  { value: 'peak', label: 'Peak' },
  { value: 'close', label: 'Close' },
] as const;

/* ── Types ────────────────────────────────────────────── */

interface SceneWorkForm {
  title: string;
  description: string;
  arcPhase: 'hook' | 'build' | 'peak' | 'close';
  duration: number;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  dialogue: string;
  audioMusic: boolean;
  audioDialogue: boolean;
  audioSfx: boolean;
  audioVoiceover: boolean;
}

const DEFAULT_FORM: SceneWorkForm = {
  title: '',
  description: '',
  arcPhase: 'build',
  duration: 5,
  cameraAngle: 'medium',
  cameraMovement: 'static',
  dialogue: '',
  audioMusic: false,
  audioDialogue: false,
  audioSfx: false,
  audioVoiceover: false,
};

interface ActionButton {
  label: string;
  variant: 'primary' | 'ghost' | 'danger';
  action: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionButton[];
  isTyping?: boolean;
}

interface SceneWorkModalProps {
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

/* ── Markdown renderer ────────────────────────────────── */

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
          return <span key={j}>{part}</span>;
        });
        if (line.startsWith('- ') || line.startsWith('• '))
          return <p key={i} className="pl-3 text-sm text-muted-foreground leading-relaxed flex gap-1.5"><span className="text-primary shrink-0">-</span><span>{parts}</span></p>;
        if (line.match(/^[A-Z\u{1F4F7}\u{1F3AC}\u{1F5BC}\u{1F3A5}\u{1F4CB}\u{1F4DD}\u{1F3B5}\u{26A0}\u{2728}]/u))
          return <p key={i} className="text-sm text-foreground leading-relaxed mt-2">{parts}</p>;
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{parts}</p>;
      })}
    </div>
  );
}

/* ── Typing animation ─────────────────────────────────── */

function TypingMessage({ content, actions, onFinished, onAction }: {
  content: string;
  actions?: ActionButton[];
  onFinished: () => void;
  onAction?: (id: string) => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const words = content.split(' ');
    const interval = setInterval(() => {
      i++;
      setDisplayed(words.slice(0, i).join(' '));
      if (i >= words.length) { clearInterval(interval); setDone(true); onFinished(); }
    }, 30);
    return () => clearInterval(interval);
  }, [content, onFinished]);

  return (
    <div>
      <MarkdownText text={displayed} />
      {!done && <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />}
      {done && actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
          {actions.map(a => (
            <button
              key={a.label}
              type="button"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                a.variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                a.variant === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' :
                'border border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              onClick={() => onAction?.(a.action)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Quick actions (edit mode) ────────────────────────── */

function getQuickActions(scene: Scene, allScenes: Scene[]) {
  const idx = allScenes.findIndex(s => s.id === scene.id);
  const prev = idx > 0 ? allScenes[idx - 1] : null;
  const next = idx < allScenes.length - 1 ? allScenes[idx + 1] : null;

  return [
    { id: 'improve', label: 'Mejorar escena', icon: Sparkles, desc: 'Mejoras de composicion y narrativa', color: 'text-primary bg-primary/10 border-primary/20' },
    { id: 'extend', label: 'Extender escena', icon: Expand, desc: `Extension de ${scene.duration_seconds ?? 5}s`, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'edit-camera', label: 'Cambiar camara', icon: Camera, desc: 'Angulos y movimientos alternativos', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { id: 'regenerate', label: 'Regenerar prompts', icon: Wand2, desc: 'Nuevos prompts de imagen y video', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'delete', label: 'Eliminar escena', icon: Trash2, desc: prev && next ? `Impacto entre "${prev.title}" y "${next.title}"` : 'Impacto en flujo narrativo', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  ];
}

/* ── IA response generators ───────────────────────────── */

function generateResponse(actionId: string, scene: Scene, allScenes: Scene[]): { content: string; actions?: ActionButton[] } {
  const idx = allScenes.findIndex(s => s.id === scene.id);
  const prev = idx > 0 ? allScenes[idx - 1] : null;
  const next = idx < allScenes.length - 1 ? allScenes[idx + 1] : null;

  switch (actionId) {
    case 'improve':
      return {
        content: `**Sugerencias para "${scene.title}":**\n\n**Camara:** Un ${scene.scene_number === 1 ? 'close-up con dolly-in' : 'tracking lateral'} daria mas energia.\n\n**Narrativa:** ${scene.arc_phase === 'hook' ? 'Como gancho, los primeros 2s son criticos.' : 'Refuerza la conexion con la escena anterior.'}\n\n**Prompt:** Anade "volumetric light, shallow depth of field, warm grading".\n\nQuieres que aplique alguna mejora?`,
        actions: [
          { label: 'Aplicar mejoras', variant: 'primary', action: 'apply_improvements' },
          { label: 'Solo prompt imagen', variant: 'ghost', action: 'improve_image_only' },
        ],
      };
    case 'extend':
      return {
        content: `**Extension de "${scene.title}":**\n\nClip de 6s que continua desde el ultimo frame.\n\n- 0-2s: Transicion suave\n- 2-4s: Desarrollo con nuevo angulo\n- 4-6s: Cierre hacia la siguiente escena\n\nGenero la extension?`,
        actions: [
          { label: 'Crear extension', variant: 'primary', action: 'create_extension' },
          { label: 'Cambiar parametros', variant: 'ghost', action: 'edit_extension' },
        ],
      };
    case 'edit-camera':
      return {
        content: `**3 opciones de camara:**\n\n**Opcion 1: Cinematografica**\n- low_angle + crane\n\n**Opcion 2: Intima**\n- close_up + static\n\n**Opcion 3: Dinamica**\n- medium + tracking\n\nCual prefieres?`,
        actions: [
          { label: 'Cinematografica', variant: 'primary', action: 'camera_1' },
          { label: 'Intima', variant: 'ghost', action: 'camera_2' },
          { label: 'Dinamica', variant: 'ghost', action: 'camera_3' },
        ],
      };
    case 'regenerate':
      return {
        content: `Regenerando prompts para "${scene.title}"...\n\nIncluiran:\n- Mas detalle en texturas\n- Iluminacion volumetrica\n- Desglose segundo a segundo\n\nGenero ahora?`,
        actions: [
          { label: 'Generar ahora', variant: 'primary', action: 'regenerate_prompts' },
          { label: 'Solo imagen', variant: 'ghost', action: 'regen_image' },
        ],
      };
    case 'delete': {
      let analysis = `**Impacto de eliminar escena #${scene.scene_number} "${scene.title}":**\n\n`;
      if (prev && next) {
        analysis += `"${prev.title}" conectara con "${next.title}".\n\n`;
        if (prev.arc_phase !== next.arc_phase) analysis += `Atencion: salto de fase (${prev.arc_phase} -> ${next.arc_phase}).`;
      } else if (!prev) {
        analysis += `"${next!.title}" pasara a ser la apertura.`;
      } else {
        analysis += `"${prev.title}" pasara a ser el cierre.`;
      }
      return {
        content: analysis,
        actions: [
          { label: 'Confirmar eliminacion', variant: 'danger', action: 'delete_scene' },
          { label: 'Cancelar', variant: 'ghost', action: 'cancel' },
        ],
      };
    }
    default:
      return { content: 'Procesando...' };
  }
}

/* ── Create-mode IA suggestions ───────────────────────── */

const CREATE_SUGGESTIONS = [
  { label: 'Gancho visual de 3s', prompt: 'Crea una escena de 3 segundos que funcione como gancho visual. Algo impactante que capte la atencion inmediatamente.' },
  { label: 'Escena de transicion', prompt: 'Crea una escena de transicion suave entre dos momentos del video. Movimiento de camara fluido.' },
  { label: 'Close-up del producto', prompt: 'Crea un primer plano cinematografico del producto con iluminacion dramatica y detalles de textura.' },
];

/* ── Main modal ───────────────────────────────────────── */

export function SceneWorkModal({
  open, onOpenChange, videoId, projectId,
  nextSceneNumber, scene, imagePrompt, videoPrompt, allScenes = [], onUpdate,
}: SceneWorkModalProps) {
  const isEdit = !!scene;
  const sceneNumber = isEdit ? scene.scene_number : (nextSceneNumber ?? 1);

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [mode, setMode] = useState<'manual' | 'ia'>('manual');
  const [form, setForm] = useState<SceneWorkForm>(DEFAULT_FORM);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setInput('');
    if (isEdit && scene) {
      setForm({
        title: scene.title ?? '',
        description: scene.description ?? '',
        arcPhase: (scene.arc_phase as SceneWorkForm['arcPhase']) ?? 'build',
        duration: scene.duration_seconds ?? 5,
        cameraAngle: 'medium',
        cameraMovement: 'static',
        dialogue: scene.dialogue ?? '',
        audioMusic: false,
        audioDialogue: !!scene.dialogue,
        audioSfx: false,
        audioVoiceover: false,
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, isEdit, scene]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const updateField = <K extends keyof SceneWorkForm>(key: K, val: SceneWorkForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  /* ── IA handlers ── */

  const handleQuickAction = useCallback((actionId: string) => {
    if (!scene) return;
    setIsProcessing(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: `Accion: ${actionId}` }]);

    setTimeout(() => {
      const resp = generateResponse(actionId, scene, allScenes);
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant', content: resp.content,
        actions: resp.actions, isTyping: true,
      }]);
      setIsProcessing(false);
    }, 300);
  }, [scene, allScenes]);

  function handleSend() {
    if (!input.trim() || isProcessing) return;
    const text = input.trim();
    setInput('');
    setIsProcessing(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    setTimeout(() => {
      const reply = isEdit
        ? `Entendido. He analizado tu peticion para "${scene?.title}". Aplicare los cambios sugeridos.`
        : `Entendido. He creado una escena basada en tu descripcion. Revisa la previsualizacion y ajusta lo que necesites.`;
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply, isTyping: true }]);
      setIsProcessing(false);
    }, 800);
  }

  function handleActionButton(actionId: string) {
    if (actionId === 'cancel') {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Cancelado. Sin cambios.' }]);
      return;
    }
    if (actionId === 'close') { onOpenChange(false); return; }
    if (actionId.startsWith('save_') || actionId === 'apply_improvements' || actionId === 'delete_scene') {
      toast.success(actionId === 'delete_scene' ? 'Escena eliminada' : 'Escena actualizada');
      onUpdate?.();
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Cambios guardados.' }]);
      return;
    }
    // Generic follow-up
    setIsProcessing(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Procesando... Los cambios se aplicaran en breve.', isTyping: true }]);
      setIsProcessing(false);
    }, 400);
  }

  /* ── Save logic ── */

  async function handleCreate() {
    if (!form.title.trim()) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const shortId = generateShortId();
      const { data: newScene, error } = await supabase.from('scenes').insert({
        video_id: videoId,
        project_id: projectId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration_seconds: form.duration,
        arc_phase: form.arcPhase,
        scene_number: sceneNumber,
        sort_order: sceneNumber * 1000,
        short_id: shortId,
        status: 'draft',
        scene_type: 'original',
        dialogue: form.dialogue.trim() || null,
      }).select('id').single();

      if (error) throw error;

      if (newScene) {
        await supabase.from('scene_camera').insert({
          scene_id: newScene.id,
          camera_angle: form.cameraAngle,
          camera_movement: form.cameraMovement,
        });
      }

      toast.success('Escena creada');
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['scenes-nav'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear escena');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    if (!scene || !form.title.trim()) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('scenes').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration_seconds: form.duration,
        arc_phase: form.arcPhase,
        dialogue: form.dialogue.trim() || null,
      }).eq('id', scene.id);

      if (error) throw error;

      await supabase.from('scene_camera').upsert({
        scene_id: scene.id,
        camera_angle: form.cameraAngle,
        camera_movement: form.cameraMovement,
      }, { onConflict: 'scene_id' });

      toast.success('Escena actualizada');
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['scenes-nav'] });
      onUpdate?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }

  function copyPrompt(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(label);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopiedPrompt(null), 2000);
  }

  if (!open) return null;

  const quickActions = isEdit && scene ? getQuickActions(scene, allScenes) : [];

  /* ── Shared input classes ── */
  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1 block';

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="fixed inset-4 sm:inset-8 lg:inset-y-8 lg:left-[10%] lg:right-[10%] z-10 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-4">
            {/* Mode tabs */}
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {(['manual', 'ia'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'manual' ? 'Manual' : 'Con IA'}
                </button>
              ))}
            </div>

            <span className="text-sm font-semibold text-foreground">
              {isEdit ? `Editar escena #${sceneNumber}` : `Nueva escena #${sceneNumber}`}
            </span>
          </div>

          <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Body: two panels ── */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT PANEL */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-border">
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* Manual mode */}
              {mode === 'manual' && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className={labelCls}>Titulo *</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Ej. Ana entra en la oficina"
                      value={form.title}
                      onChange={e => updateField('title', e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Descripcion visual</label>
                    <textarea
                      className={inputCls}
                      rows={3}
                      placeholder="Describe que se ve en la escena..."
                      value={form.description}
                      onChange={e => updateField('description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Fase narrativa</label>
                      <select
                        className={cn(inputCls, 'appearance-none')}
                        value={form.arcPhase}
                        onChange={e => updateField('arcPhase', e.target.value as SceneWorkForm['arcPhase'])}
                      >
                        {ARC_PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Duracion: {form.duration}s</label>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        step={1}
                        value={form.duration}
                        onChange={e => updateField('duration', Number(e.target.value))}
                        className="w-full mt-1 accent-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Angulo de camara</label>
                      <select
                        className={cn(inputCls, 'appearance-none')}
                        value={form.cameraAngle}
                        onChange={e => updateField('cameraAngle', e.target.value as CameraAngle)}
                      >
                        {CAMERA_ANGLES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Movimiento</label>
                      <select
                        className={cn(inputCls, 'appearance-none')}
                        value={form.cameraMovement}
                        onChange={e => updateField('cameraMovement', e.target.value as CameraMovement)}
                      >
                        {CAMERA_MOVEMENTS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Audio</label>
                    <div className="flex flex-wrap gap-4 mt-1">
                      {([
                        ['audioMusic', 'Musica'],
                        ['audioDialogue', 'Dialogo'],
                        ['audioSfx', 'SFX'],
                        ['audioVoiceover', 'Voiceover'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={e => updateField(key, e.target.checked)}
                            className="accent-primary"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Dialogo / Narracion</label>
                    <textarea
                      className={inputCls}
                      rows={2}
                      placeholder="Que se dice o narra en esta escena..."
                      value={form.dialogue}
                      onChange={e => updateField('dialogue', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* IA mode */}
              {mode === 'ia' && (
                <div className="space-y-4">
                  {/* Quick actions (edit mode, no messages yet) */}
                  {isEdit && messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Que quieres hacer con esta escena?</p>
                      <div className="grid gap-2">
                        {quickActions.map(qa => {
                          const Icon = qa.icon;
                          return (
                            <button
                              key={qa.id}
                              type="button"
                              onClick={() => handleQuickAction(qa.id)}
                              className={cn('flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md', qa.color)}
                            >
                              <Icon className="size-4 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{qa.label}</p>
                                <p className="text-[11px] opacity-70 mt-0.5">{qa.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Create-mode suggestions */}
                  {!isEdit && messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Describe que quieres en esta escena y Kiyoko te ayudara a crearla.</p>
                      <div className="grid gap-2">
                        {CREATE_SUGGESTIONS.map(s => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => { setInput(s.prompt); inputRef.current?.focus(); }}
                            className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-left text-sm text-foreground hover:bg-primary/10 transition-colors"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {messages.map(msg => (
                    <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : '')}>
                      {msg.role === 'assistant' && (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                          <Sparkles className="size-3.5" />
                        </div>
                      )}
                      <div className={cn(
                        'rounded-xl px-3.5 py-2.5 max-w-[90%]',
                        msg.role === 'user' ? 'bg-primary text-primary-foreground text-sm' : 'bg-background border border-border',
                      )}>
                        {msg.role === 'assistant' && msg.isTyping ? (
                          <TypingMessage
                            content={msg.content}
                            actions={msg.actions}
                            onAction={handleActionButton}
                            onFinished={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyping: false } : m))}
                          />
                        ) : msg.role === 'assistant' ? (
                          <div>
                            <MarkdownText text={msg.content} />
                            {msg.actions && msg.actions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                                {msg.actions.map(a => (
                                  <button
                                    key={a.label}
                                    type="button"
                                    className={cn(
                                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                      a.variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                                      a.variant === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' :
                                      'border border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                                    )}
                                    onClick={() => handleActionButton(a.action)}
                                  >
                                    {a.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : msg.content}
                      </div>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <Sparkles className="size-3.5 animate-pulse" />
                      </div>
                      <div className="rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin inline mr-2" />Analizando...
                      </div>
                    </div>
                  )}

                  {messages.length > 0 && !isProcessing && (
                    <button type="button" onClick={() => setMessages([])} className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Volver a acciones
                    </button>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* IA input bar (only in IA mode) */}
            {mode === 'ia' && (
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Describe que quieres..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Preview */}
          <div className="w-[340px] shrink-0 flex-col bg-background/50 hidden lg:flex">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Scene preview card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">#{sceneNumber}</span>
                  <span className="text-sm font-semibold text-foreground truncate">{form.title || 'Sin titulo'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{form.duration}s</span>
                  <span>-</span>
                  <span>{form.arcPhase}</span>
                </div>

                {form.description && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Descripcion</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{form.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Camara</p>
                  <p className="text-xs text-foreground">
                    {CAMERA_ANGLES.find(a => a.value === form.cameraAngle)?.label ?? form.cameraAngle}
                    {' - '}
                    {CAMERA_MOVEMENTS.find(m => m.value === form.cameraMovement)?.label ?? form.cameraMovement}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Audio</p>
                  <p className="text-xs text-foreground">
                    {[
                      form.audioMusic && 'Musica',
                      form.audioDialogue && 'Dialogo',
                      form.audioSfx && 'SFX',
                      form.audioVoiceover && 'Voiceover',
                    ].filter(Boolean).join(', ') || 'Sin audio'}
                  </p>
                </div>

                {form.dialogue && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dialogo</p>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">"{form.dialogue}"</p>
                  </div>
                )}
              </div>

              {/* Prompts (edit mode) */}
              {isEdit && imagePrompt && (
                <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt imagen</p>
                    <button
                      type="button"
                      onClick={() => copyPrompt(imagePrompt, 'Prompt imagen')}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {copiedPrompt === 'Prompt imagen' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copiedPrompt === 'Prompt imagen' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{imagePrompt}</p>
                </div>
              )}

              {isEdit && videoPrompt && (
                <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt video</p>
                    <button
                      type="button"
                      onClick={() => copyPrompt(videoPrompt, 'Prompt video')}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {copiedPrompt === 'Prompt video' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copiedPrompt === 'Prompt video' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{videoPrompt}</p>
                </div>
              )}

              {!isEdit && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                  <Sparkles className="size-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Los prompts se generaran despues de crear la escena</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isEdit ? handleSave : handleCreate}
              disabled={!form.title.trim() || isSaving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear escena'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
