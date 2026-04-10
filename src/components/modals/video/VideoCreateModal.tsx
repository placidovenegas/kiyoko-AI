'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import {
  Film, Sparkles, X, Loader2, Monitor, Smartphone, Clock,
  ChevronRight, ChevronLeft, Plus, RefreshCw, Check, Send, Wand2, Clapperboard,
  Music, Upload,
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
import { StreamingWave } from '@/components/chat/StreamingWave';

/* ── Types ────────────────────────────────────────────────── */

interface Suggestion { title: string; desc: string; platform: string; dur: number }
interface GenScene { title: string; description: string; arc_phase: string; duration_seconds: number; camera_angle?: string; camera_movement?: string; selected?: boolean; timeline?: string; expanded?: boolean }

const VALID_DURS = [3, 4, 5, 6, 8, 10];
function snap(d: number) { return VALID_DURS.reduce((p, c) => Math.abs(c - d) < Math.abs(p - d) ? c : p); }

function genTimeline(title: string, desc: string, dur: number, cam: string, move: string, phase: string): string {
  const blocks: string[] = [];
  let t = 0;
  const blockSize = Math.max(2, Math.min(3, Math.floor(dur / 3)));

  const camLabels: Record<string, string> = { wide: 'Plano general', medium: 'Plano medio', close_up: 'Primer plano', extreme_close_up: 'Primerísimo plano' };
  const moveLabels: Record<string, string> = { static: 'Camara estatica', dolly_in: 'Camara avanza lentamente', dolly_out: 'Camara retrocede', tracking: 'Camara sigue al sujeto', orbit: 'Camara gira alrededor', crane: 'Camara asciende con grua' };
  const camL = camLabels[cam] ?? 'Plano medio';
  const moveL = moveLabels[move] ?? 'Camara estatica';

  if (phase === 'hook') {
    blocks.push(`[00:00-00:0${Math.min(blockSize, dur)}]: ${camL}. ${title} — ${desc}. ${moveL} estableciendo la escena.`);
    t = blockSize;
    if (t < dur) { blocks.push(`[00:0${t}-00:0${Math.min(t + blockSize, dur)}]: La accion se intensifica. Elementos visuales clave aparecen para captar atencion inmediata.`); t += blockSize; }
    if (t < dur) { blocks.push(`[00:0${t}-00:${String(dur).padStart(2, '0')}]: Transicion al siguiente momento. ${moveL} se detiene en el punto focal.`); }
  } else if (phase === 'peak') {
    blocks.push(`[00:00-00:0${Math.min(blockSize, dur)}]: ${camL}. Momento de maxima intensidad. ${moveL} con energia.`);
    t = blockSize;
    if (t < dur) { blocks.push(`[00:0${t}-00:0${Math.min(t + blockSize, dur)}]: ${desc}. La accion alcanza su punto mas alto. Expresiones intensas, movimiento dinamico.`); t += blockSize; }
    if (t < dur) { blocks.push(`[00:0${t}-00:${String(dur).padStart(2, '0')}]: Climax visual. ${moveL}. Todo converge en un instante de impacto maximo.`); }
  } else if (phase === 'close') {
    blocks.push(`[00:00-00:0${Math.min(blockSize, dur)}]: ${camL}. ${desc}. El ritmo se calma.`);
    t = blockSize;
    if (t < dur) { blocks.push(`[00:0${t}-00:0${Math.min(t + blockSize, dur)}]: ${moveL} retrocediendo. La escena se resuelve con serenidad.`); t += blockSize; }
    if (t < dur) { blocks.push(`[00:0${t}-00:${String(dur).padStart(2, '0')}]: Cierre. Ultimo momento visual antes de la transicion. Fade suave.`); }
  } else {
    blocks.push(`[00:00-00:0${Math.min(blockSize, dur)}]: ${camL}. ${title} — ${desc}. ${moveL} acompanando la narracion.`);
    t = blockSize;
    if (t < dur) { blocks.push(`[00:0${t}-00:0${Math.min(t + blockSize, dur)}]: La escena se desarrolla. Detalles visuales que enriquecen la narrativa. ${moveL}.`); t += blockSize; }
    if (t < dur) { blocks.push(`[00:0${t}-00:${String(dur).padStart(2, '0')}]: Preparacion para la siguiente escena. El movimiento se suaviza hacia la transicion.`); }
  }
  return blocks.join('\n');
}

function addTimelines(scenes: GenScene[]): GenScene[] {
  return scenes.map(s => ({
    ...s,
    timeline: s.timeline ?? genTimeline(s.title, s.description, s.duration_seconds, s.camera_angle ?? 'medium', s.camera_movement ?? 'static', s.arc_phase),
  }));
}

function makeSugs(name: string): Suggestion[] {
  return [
    { title: `Presentacion de ${name}`, desc: 'Promocional con servicios y equipo', platform: 'youtube', dur: 60 },
    { title: 'Reel Antes/Despues', desc: 'Transformaciones rapidas para redes', platform: 'instagram_reels', dur: 30 },
    { title: 'Spot publicitario', desc: 'Anuncio corto con gancho y CTA', platform: 'tv_commercial', dur: 15 },
    { title: 'Detras de camaras', desc: 'Equipo en accion, momentos reales', platform: 'tiktok', dur: 30 },
    { title: 'Testimonio cliente', desc: 'Experiencia emocional de un cliente', platform: 'youtube', dur: 60 },
    { title: 'Tutorial / How-to', desc: 'Paso a paso educativo', platform: 'youtube', dur: 180 },
  ].sort(() => Math.random() - 0.5);
}

function mockScenes(dur: number, desc: string, proj: string): GenScene[] {
  const ph = ['hook', 'build', 'build', 'peak', 'close'];
  const ti = ['Apertura', 'Presentacion', 'Desarrollo', 'Climax', 'Cierre y CTA'];
  const ds = [`Toma impactante.${proj ? ` ${proj}.` : ''}`, 'Escenario y elementos.', desc || 'Contenido central.', 'Momento de mayor impacto.', 'Mensaje final y CTA.'];
  const n = dur <= 15 ? 3 : dur <= 30 ? 4 : dur <= 60 ? 5 : 6;
  let rem = dur;
  return Array.from({ length: n }, (_, i) => {
    const sd = snap(i === n - 1 ? rem : Math.floor(dur / n)); rem -= sd;
    return { title: ti[Math.min(i, 4)], description: ds[Math.min(i, 4)], arc_phase: ph[Math.min(i, 4)], duration_seconds: sd, camera_angle: i === 0 ? 'wide' : 'medium', camera_movement: i === 0 ? 'dolly_in' : 'tracking' };
  });
}

/* ── Component ────────────────────────────────────────────── */

export function VideoCreateModal({ open, onOpenChange, projectId, projectShortId, onSuccess }: ModalProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const mut = useCreateVideo(projectId);

  let projTitle = ''; let projStyle = 'pixar'; let chars = 0; let bgs = 0;
  try { const c = useProject(); projTitle = c.project?.title ?? ''; projStyle = c.project?.style ?? 'pixar'; chars = c.characters?.length ?? 0; bgs = c.backgrounds?.length ?? 0; } catch {}

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<VideoFormData>({ ...DEFAULT_VIDEO });
  const [allSugs] = useState<Suggestion[]>(() => makeSugs(projTitle));
  const [sugVis, setSugVis] = useState(3);

  const [generating, setGenerating] = useState(false);
  const [scenes, setScenes] = useState<GenScene[]>([]);
  const [saving, setSaving] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatFocused, setChatFocused] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  // Audio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [audioSections, setAudioSections] = useState<Array<{ type: string; durationSeconds: number; mood: string; energy: string; suggestedSceneType: string }>>([]);

  const upd = useCallback(<K extends keyof VideoFormData>(k: K, v: VideoFormData[K]) => setForm(f => ({ ...f, [k]: v })), []);
  function close() { setForm({ ...DEFAULT_VIDEO }); setStep(1); setScenes([]); setEditIdx(null); setChatInput(''); setSugVis(3); onOpenChange(false); }
  function useSug(s: Suggestion) {
    setForm({ title: s.title, description: s.desc, platform: s.platform as VideoFormData['platform'], target_duration_seconds: s.dur, aspect_ratio: (PLATFORMS.find(p => p.value === s.platform)?.ratio ?? '16:9') as VideoFormData['aspect_ratio'] });
  }

  async function genScenes() {
    setGenerating(true); toast.ai('Generando escenas...', { id: 'gs' });
    try {
      const r = await fetch('/api/ai/generate-scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, instruction: `Escenas para "${form.title}" ${form.target_duration_seconds}s ${form.platform} estilo ${projStyle}. ${form.description ?? ''}` }) });
      if (r.ok) { const j = await r.json(); if (j.success && j.data) { setScenes(addTimelines([{ ...j.data, duration_seconds: snap(j.data.duration_seconds ?? 5) }])); toast.success('Generada', { id: 'gs' }); setGenerating(false); return; } }
    } catch {}
    setScenes(addTimelines(mockScenes(form.target_duration_seconds, form.description, projTitle)));
    toast.success('Escenas generadas', { id: 'gs' }); setGenerating(false);
  }

  function toggleSel(i: number) { setScenes(p => p.map((s, j) => j === i ? { ...s, selected: !s.selected } : s)); }

  async function regenOne(i: number) {
    toast.ai('Regenerando...', { id: `r${i}` });
    try {
      const s = scenes[i];
      const r = await fetch('/api/ai/generate-scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, instruction: `Alternativa para: "${s.title}" (${s.arc_phase}, ${s.duration_seconds}s). Estilo ${projStyle}. 3-10s.` }) });
      if (r.ok) { const j = await r.json(); if (j.success && j.data) { setScenes(p => p.map((sc, k) => k === i ? { ...j.data, duration_seconds: snap(j.data.duration_seconds ?? s.duration_seconds) } : sc)); toast.success('OK', { id: `r${i}` }); return; } }
    } catch {}
    toast.success('Sin cambios', { id: `r${i}` });
  }

  async function chatSend() {
    const t = chatInput.trim(); if (!t || chatBusy) return;
    const sel = scenes.map((s, i) => s.selected ? i : -1).filter(i => i >= 0);
    // If no scenes selected, apply to ALL scenes
    const targets = sel.length > 0 ? sel : scenes.map((_, i) => i);
    const targetLabel = sel.length > 0 ? `escena${sel.length > 1 ? 's' : ''} #${sel.map(i => i + 1).join(', #')}` : 'todas las escenas';

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: t }]);
    setChatBusy(true);

    const up = [...scenes];
    const changes: string[] = [];
    for (const idx of targets) {
      const s = up[idx];
      try {
        const r = await fetch('/api/ai/generate-scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, instruction: `Actualiza: "${s.title}" (${s.arc_phase}, ${s.duration_seconds}s). Feedback: "${t}". Estilo ${projStyle}. 3-10s.` }) });
        if (r.ok) { const j = await r.json(); if (j.success && j.data) { up[idx] = { ...j.data, duration_seconds: snap(j.data.duration_seconds ?? s.duration_seconds), selected: false }; changes.push(`#${idx + 1} "${j.data.title}"`); continue; } }
      } catch {}
      up[idx] = { ...s, description: `${s.description} — ${t}`, selected: false };
      changes.push(`#${idx + 1} actualizada`);
    }
    setScenes(up);

    // Show feedback in chat
    const feedback = changes.length > 0
      ? `He actualizado ${targetLabel}: ${changes.join(', ')}.`
      : `He aplicado tus cambios a ${targetLabel}.`;
    setChatMessages(prev => [...prev, { role: 'assistant', text: feedback }]);
    setChatBusy(false);
  }

  /* ── Audio upload + analyze (in step 1) ─────────────────── */
  async function handleAudioUpload(file: File) {
    setAudioFile(file);
    setAnalyzingAudio(true);

    try {
      // Get audio duration from browser
      const audioDur = await new Promise<number>((resolve) => {
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener('loadedmetadata', () => resolve(Math.round(audio.duration)));
        audio.addEventListener('error', () => resolve(180));
      });

      // Auto-fill form from file
      const fileName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setForm(f => ({
        ...f,
        title: f.title || fileName,
        target_duration_seconds: audioDur,
        description: f.description || `Videoclip basado en la cancion "${fileName}"`,
      }));

      // Try to upload and analyze with API
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'mp3';
      const path = `audio/${projectId}/${generateShortId()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      if (uploadError) {
        // Storage might not be configured — use mock analysis
        const mockSections = generateAudioScenes(audioDur);
        setScenes(addTimelines(mockSections));
        setAudioSections(mockSections.map(s => ({ type: s.arc_phase, durationSeconds: s.duration_seconds, mood: s.description, energy: 'medium', suggestedSceneType: s.arc_phase })));
        toast.success(`Cancion analizada — ${mockSections.length} escenas generadas`, { id: 'audio-analyze' });
        setAnalyzingAudio(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      setAudioUrl(urlData.publicUrl);

      // Create a temp video to associate the analysis (will be replaced on final save)
      // For now just do mock analysis since we don't have videoId yet
      const mockSections = generateAudioScenes(audioDur);
      setScenes(mockSections);
      setAudioSections(mockSections.map(s => ({ type: s.arc_phase, durationSeconds: s.duration_seconds, mood: s.description, energy: 'medium', suggestedSceneType: s.arc_phase })));

      toast.success(`Cancion analizada — ${mockSections.length} escenas, ${audioDur}s`, { id: 'audio-analyze' });

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Cancion "${fileName}" analizada. ${mockSections.length} secciones detectadas. Duracion: ${audioDur}s. Las escenas estan listas en el paso 2.`,
      }]);

    } catch {
      toast.error('Error al analizar audio', { id: 'audio-analyze' });
    }
    setAnalyzingAudio(false);
  }

  function generateAudioScenes(dur: number): GenScene[] {
    const structure: Array<{ type: string; pct: number; title: string; mood: string; phase: string; cam: string; move: string }> = [
      { type: 'intro', pct: 0.08, title: 'Intro', mood: 'Atmosferico, establecer tono', phase: 'hook', cam: 'wide', move: 'dolly_in' },
      { type: 'verse', pct: 0.15, title: 'Estrofa 1', mood: 'Narrativo, presentar contexto', phase: 'build', cam: 'medium', move: 'tracking' },
      { type: 'chorus', pct: 0.12, title: 'Estribillo 1', mood: 'Energetico, momento clave', phase: 'peak', cam: 'close_up', move: 'orbit' },
      { type: 'verse', pct: 0.15, title: 'Estrofa 2', mood: 'Desarrollo, profundizar', phase: 'build', cam: 'medium', move: 'tracking' },
      { type: 'chorus', pct: 0.12, title: 'Estribillo 2', mood: 'Maximo impacto visual', phase: 'peak', cam: 'close_up', move: 'dolly_in' },
      { type: 'bridge', pct: 0.10, title: 'Puente', mood: 'Reflexivo, cambio de ritmo', phase: 'build', cam: 'wide', move: 'crane' },
      { type: 'chorus', pct: 0.15, title: 'Estribillo final', mood: 'Climax, explosion visual', phase: 'peak', cam: 'close_up', move: 'orbit' },
      { type: 'outro', pct: 0.13, title: 'Outro', mood: 'Cierre, fade out', phase: 'close', cam: 'wide', move: 'dolly_out' },
    ];
    const scenes: GenScene[] = [];
    let t = 0;
    for (const s of structure) {
      const raw = Math.round(dur * s.pct);
      const sd = snap(raw);
      if (t + sd > dur + 5) break; // Don't exceed duration by much
      scenes.push({
        title: s.title, description: s.mood, arc_phase: s.phase,
        duration_seconds: sd, camera_angle: s.cam, camera_movement: s.move,
      });
      t += sd;
    }
    return scenes;
  }

  async function createAll() {
    if (!form.title.trim()) return; setSaving(true); toast.ai('Creando video...', { id: 'ca' });
    try {
      const v = await mut.mutateAsync(form); if (!v?.id) throw 0;
      if (scenes.length > 0) {
        const sb = createClient();
        for (let i = 0; i < scenes.length; i++) {
          const s = scenes[i];
          const { data: ns } = await sb.from('scenes').insert({ video_id: v.id, project_id: projectId, title: s.title, description: s.description, duration_seconds: s.duration_seconds, arc_phase: s.arc_phase as 'hook' | 'build' | 'peak' | 'close', scene_number: i + 1, sort_order: i + 1, short_id: generateShortId(), status: 'draft', scene_type: 'original' }).select('id').single();
          if (ns) {
            await sb.from('scene_camera').insert({ scene_id: ns.id, camera_angle: (s.camera_angle ?? 'medium') as Database['public']['Enums']['camera_angle'], camera_movement: (s.camera_movement ?? 'static') as Database['public']['Enums']['camera_movement'] });
            fetch('/api/ai/generate-scene-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sceneId: ns.id }) }).catch(() => {});
          }
        }
      }
      qc.invalidateQueries({ queryKey: ['scenes'] }); qc.invalidateQueries({ queryKey: ['video'] });
      toast.success(`Video con ${scenes.length} escenas creado`, { id: 'ca' });
      close(); onSuccess?.();
      if (v.short_id && projectShortId) router.push(`/project/${projectShortId}/video/${v.short_id}`);
    } catch { toast.error('Error', { id: 'ca' }); }
    setSaving(false);
  }

  if (!open) return null;
  const isV = form.aspect_ratio === '9:16';
  const totDur = scenes.reduce((a, s) => a + s.duration_seconds, 0);
  const selCount = scenes.filter(s => s.selected).length;
  const ok = form.title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={close}>
      <div className="flex h-[min(740px,90vh)] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
            <div>
              <p className="text-sm font-semibold text-foreground">{step === 1 ? 'Nuevo video' : 'Escenas del video'}</p>
              <p className="text-[10px] text-muted-foreground">
                {step === 1 ? 'Define los detalles del video' : `${form.title} · ${PLATFORMS.find(p => p.value === form.platform)?.label} · ${form.target_duration_seconds}s`}
              </p>
            </div>
            <button type="button" onClick={close} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><X className="size-4" /></button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── Step 1: Video details ─────────────── */}
              {step === 1 && (
                <div className="space-y-5 max-w-lg">
                  <TextField variant="secondary" value={form.title} onChange={v => upd('title', v)} isRequired autoFocus>
                    <Label>Titulo *</Label><Input placeholder="Ej. Spot primavera 2025" />
                  </TextField>

                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Plataforma</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PLATFORMS.map(p => (
                        <button key={p.value} type="button" onClick={() => { upd('platform', p.value); upd('aspect_ratio', (p.ratio ?? '16:9') as VideoFormData['aspect_ratio']); }}
                          className={cn('rounded-lg border px-3 py-2 text-left transition-all', form.platform === p.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20')}>
                          <div className="flex items-center gap-1.5">
                            {p.ratio === '9:16' ? <Smartphone className="size-3 text-muted-foreground" /> : <Monitor className="size-3 text-muted-foreground" />}
                            <p className={cn('text-xs font-medium', form.platform === p.value ? 'text-primary' : 'text-foreground')}>{p.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-muted-foreground">Duracion</p>
                      {audioFile && <span className="text-[10px] text-primary font-medium">Cancion: {form.target_duration_seconds}s</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {DURATIONS.map(d => (
                        <button key={d.value} type="button" onClick={() => upd('target_duration_seconds', d.value)}
                          className={cn('rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all', form.target_duration_seconds === d.value ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/20')}>
                          {d.label}
                        </button>
                      ))}
                      <TextField variant="secondary"
                        value={!DURATIONS.some(d => d.value === form.target_duration_seconds) ? String(form.target_duration_seconds) : ''}
                        onChange={v => { const n = parseInt(v, 10); if (n > 0) upd('target_duration_seconds', n); }}
                        className="w-20">
                        <Label className="sr-only">Duracion custom</Label>
                        <Input type="number" placeholder="Otra" className="text-center" />
                      </TextField>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2">
                    <div className={cn('rounded border border-border/50 bg-card flex items-center justify-center', isV ? 'w-6 h-10' : 'w-10 h-6')}>
                      <span className="text-[7px] text-muted-foreground/40">{form.aspect_ratio}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{form.aspect_ratio} · {isV ? 'Vertical' : 'Horizontal'}</p>
                      <p className="text-[10px] text-muted-foreground">Basado en {PLATFORMS.find(p => p.value === form.platform)?.label}</p>
                    </div>
                  </div>

                  <TextField variant="secondary" value={form.description} onChange={v => upd('description', v)}>
                    <Label>Descripcion</Label><TextArea placeholder="De que trata este video... (ayuda a la IA a generar mejores escenas)" rows={3} />
                  </TextField>

                  {/* Audio upload */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Cancion (opcional)</p>
                    {!audioFile ? (
                      <label className={cn(
                        'flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 cursor-pointer transition-all',
                        analyzingAudio ? 'border-primary/40 bg-primary/5 cursor-wait' : 'border-border hover:border-primary/30 hover:bg-primary/5',
                      )}>
                        {analyzingAudio ? (
                          <>
                            <Loader2 className="size-4 text-primary animate-spin" />
                            <span className="text-xs text-primary font-medium animate-pulse">Analizando cancion...</span>
                          </>
                        ) : (
                          <>
                            <Music className="size-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Sube un MP3 o WAV para generar un videoclip</span>
                          </>
                        )}
                        <input type="file" accept="audio/*" className="hidden" disabled={analyzingAudio}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioUpload(f); }} />
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                        <Music className="size-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{audioFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{form.target_duration_seconds}s · {scenes.length} escenas generadas</p>
                        </div>
                        <button type="button" onClick={() => { setAudioFile(null); setAudioUrl(null); setAudioSections([]); setScenes([]); }}
                          className="text-muted-foreground hover:text-foreground shrink-0"><X className="size-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2: Scenes ────────────────────── */}
              {step === 2 && (
                <div className="space-y-3">
                  {/* Empty state */}
                  {scenes.length === 0 && !generating && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-5">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-lg animate-pulse" />
                        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15">
                          <Clapperboard className="size-7 text-primary" />
                        </div>
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="text-base font-semibold text-foreground">Genera las escenas con IA</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {audioFile
                            ? `Escenas alineadas con "${audioFile.name}" ya generadas. Pulsa "Generar escenas" para recrearlas.`
                            : `Storyboard con arco narrativo optimizado para ${PLATFORMS.find(p => p.value === form.platform)?.label}.`
                          }
                        </p>
                      </div>
                      <button type="button" onClick={genScenes}
                        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Sparkles className="size-4" /> Generar escenas
                      </button>
                    </div>
                  )}

                  {/* Generating state with StreamingWave */}
                  {generating && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <StreamingWave label="Generando escenas" />
                    </div>
                  )}

                  {/* Scene list */}
                  {scenes.length > 0 && !generating && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">{scenes.length} escenas</p>
                          <span className="text-[10px] text-muted-foreground">· {totDur}s total</span>
                        </div>
                        <button type="button" onClick={() => { setScenes([]); genScenes(); }}
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                          <RefreshCw className="size-2.5" /> Regenerar todo
                        </button>
                      </div>
                      {scenes.map((s, i) => (
                        <div key={i} className={cn('rounded-xl border overflow-hidden transition-all duration-150',
                          s.selected ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-card hover:border-primary/20')}>
                          <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                            <button type="button" onClick={() => toggleSel(i)}
                              className={cn('flex size-4.5 items-center justify-center rounded border shrink-0 transition-all duration-150',
                                s.selected ? 'bg-primary border-primary text-white scale-105' : 'border-border/60 hover:border-primary/40')}>
                              {s.selected && <Check className="size-2.5" />}
                            </button>
                            <span className="text-[10px] font-bold text-muted-foreground/50 w-5 text-right">#{i + 1}</span>
                            {editIdx === i ? (
                              <input type="text" value={s.title} onChange={e => setScenes(p => p.map((sc, j) => j === i ? { ...sc, title: e.target.value } : sc))}
                                onBlur={() => setEditIdx(null)} autoFocus className="text-sm font-medium bg-transparent border-b border-primary/30 outline-none flex-1 text-foreground" />
                            ) : (
                              <button type="button" onClick={() => setEditIdx(i)} className="text-sm font-medium text-foreground hover:text-primary truncate text-left flex-1 transition-colors">{s.title}</button>
                            )}
                            <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-white shrink-0', PHASE_STYLES[s.arc_phase] ?? 'bg-zinc-500')}>{s.arc_phase}</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 flex items-center gap-0.5"><Clock className="size-2.5" />{s.duration_seconds}s</span>
                            <button type="button" onClick={() => regenOne(i)} title="Regenerar"
                              className="text-muted-foreground/30 hover:text-foreground transition-colors shrink-0"><RefreshCw className="size-3" /></button>
                          </div>
                          {/* Description */}
                          {editIdx === i ? (
                            <div className="px-3.5 pb-2">
                              <textarea value={s.description} onChange={e => setScenes(p => p.map((sc, j) => j === i ? { ...sc, description: e.target.value } : sc))}
                                rows={2} className="w-full text-xs text-muted-foreground bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/30 resize-none" />
                            </div>
                          ) : (
                            <button type="button" onClick={() => setScenes(p => p.map((sc, j) => j === i ? { ...sc, expanded: !sc.expanded } : sc))}
                              className="w-full px-3.5 pb-2 text-left">
                              <p className="text-[11px] text-muted-foreground/60 line-clamp-1 hover:text-muted-foreground transition-colors">{s.description}</p>
                            </button>
                          )}

                          {/* Expandable timeline */}
                          {s.expanded && !editIdx && s.timeline && (
                            <div className="mx-3.5 mb-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="size-2.5" /> Timeline
                                </p>
                                <button type="button" onClick={() => setEditIdx(i)} className="text-[9px] text-primary hover:underline">Editar</button>
                              </div>
                              {s.timeline.split('\n').map((line, li) => {
                                const match = line.match(/^\[(\d{2}:\d{2})-(\d{2}:\d{2})\]:\s*(.*)/);
                                if (!match) return <p key={li} className="text-[10px] text-muted-foreground">{line}</p>;
                                return (
                                  <div key={li} className="flex gap-2">
                                    <span className="text-[9px] font-mono text-primary/60 shrink-0 w-16 pt-0.5">{match[1]}-{match[2]}</span>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{match[3]}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Click to expand hint */}
                          {!s.expanded && s.timeline && !editIdx && (
                            <button type="button" onClick={() => setScenes(p => p.map((sc, j) => j === i ? { ...sc, expanded: true } : sc))}
                              className="w-full px-3.5 pb-2 flex items-center gap-1 text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                              <ChevronRight className="size-2.5" /> Ver timeline
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            {step === 1 && (
              <div className="w-72 shrink-0 border-l border-border bg-background/30 overflow-y-auto px-4 py-4 space-y-2.5 hidden lg:block">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sugerencias</p>
                {allSugs.slice(0, sugVis).map((s, i) => (
                  <button key={i} type="button" onClick={() => useSug(s)}
                    className="w-full rounded-xl border border-border p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group">
                    <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{s.desc}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-1">{PLATFORMS.find(p => p.value === s.platform)?.label} · {s.dur >= 60 ? `${Math.floor(s.dur / 60)}m` : `${s.dur}s`}</p>
                  </button>
                ))}
                {sugVis < allSugs.length && (
                  <button type="button" onClick={() => setSugVis(v => v + 2)}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mx-auto">
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            {step === 2 && scenes.length > 0 && (
              <div className="w-72 shrink-0 border-l border-border bg-background/30 flex flex-col hidden lg:flex">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                      <Sparkles className="size-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Kiyoko IA</p>
                      <p className="text-[9px] text-muted-foreground">
                        {selCount > 0 ? `${selCount} seleccionada${selCount > 1 ? 's' : ''} — solo esas se actualizan` : 'Sin seleccion — se actualizan todas'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 px-3 py-2 overflow-y-auto space-y-2">
                  {chatMessages.length === 0 && !chatBusy && (
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed py-2">
                      Describe que cambiar. Si marcas escenas, solo esas se actualizan. Si no, se actualizan todas.
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn('rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed',
                      msg.role === 'user' ? 'bg-primary/10 text-foreground ml-4' : 'bg-card border border-border text-muted-foreground mr-2')}>
                      {msg.text}
                    </div>
                  ))}
                  {chatBusy && (
                    <div className="py-1">
                      <StreamingWave label="Actualizando" />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-border">
                  <div className={cn('rounded-xl border transition-all duration-150',
                    chatFocused ? 'border-primary/60 shadow-[0_0_0_2px_rgba(20,184,166,0.08)]' : 'border-border')}>
                    <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onFocus={() => setChatFocused(true)} onBlur={() => setChatFocused(false)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); } }}
                      placeholder="Que cambiarias..." rows={2}
                      className="w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/40" />
                    <div className="flex items-center justify-end px-2 pb-2">
                      <button type="button" onClick={chatSend} disabled={!chatInput.trim() || chatBusy}
                        className={cn('flex size-7 items-center justify-center rounded-lg transition-colors',
                          chatInput.trim() ? 'bg-primary text-white hover:bg-primary/90' : 'text-muted-foreground/30')}>
                        {chatBusy ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  <ChevronLeft className="size-3" /> Atras
                </button>
              )}
              <span className="text-[10px] text-muted-foreground">
                {step === 1 ? (ok ? 'Paso 1 de 2' : '') : `Paso 2 de 2${scenes.length > 0 ? ` · ${scenes.length} escenas · ${totDur}s` : ''}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button type="button" onClick={() => setStep(2)} disabled={!ok}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  Siguiente <ChevronRight className="size-3" />
                </button>
              )}
              {step === 2 && (
                <>
                  <button type="button" onClick={() => { setScenes([]); createAll(); }} disabled={saving}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                    Crear sin escenas
                  </button>
                  {scenes.length > 0 ? (
                    <button type="button" onClick={createAll} disabled={saving}
                      className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary/20">
                      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                      Crear con {scenes.length} escenas
                    </button>
                  ) : !generating && (
                    <button type="button" onClick={genScenes}
                      className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-md shadow-primary/20">
                      <Sparkles className="size-3.5" /> Generar escenas
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
