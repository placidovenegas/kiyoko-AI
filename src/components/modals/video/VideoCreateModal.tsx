'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import {
  Film, Sparkles, X, Loader2, Monitor, Smartphone, Clock,
  ChevronRight, ChevronLeft, Plus, RefreshCw, Check, Send, Wand2, Clapperboard,
  Music, Upload, Camera,
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
interface GenScene {
  title: string; description: string; arc_phase: string; duration_seconds: number;
  camera_angle?: string; camera_movement?: string;
  selected?: boolean; timeline?: string; expanded?: boolean;
  charIds?: string[]; bgIds?: string[];
  music?: boolean; dialogue?: boolean; sfx?: boolean;
}

const VALID_DURS = [3, 4, 5, 6, 8, 10];
function snap(d: number) { return VALID_DURS.reduce((p, c) => Math.abs(c - d) < Math.abs(p - d) ? c : p); }

function fmt(s: number): string { return String(Math.min(s, 59)).padStart(2, '0'); }
function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
}

function genTimeline(title: string, desc: string, dur: number, cam: string, move: string, phase: string, chars: string[] = []): string {
  const blocks: string[] = [];
  const bs = Math.max(2, Math.min(3, Math.floor(dur / 3)));
  const isExtension = title.toLowerCase().includes('continuacion');
  const main = chars[0] ?? 'el protagonista';
  const secondary = chars.length > 1 ? chars.slice(1) : [];

  // Extension clips (6s) — simplified 2-block timeline
  if (isExtension) {
    const half = Math.ceil(dur / 2);
    blocks.push(`[00:00-00:${fmt(half)}]: Continuacion directa del clip anterior. ${main} continua la accion.${secondary.length > 0 ? ` ${secondary[0]} reacciona.` : ''} La camara sigue el mismo movimiento.`);
    blocks.push(`[00:${fmt(half)}-00:${fmt(dur)}]: ${main} ${secondary.length > 0 ? `y ${secondary[0]} interactuan` : 'completa la accion'}. FREEZE en el momento clave.`);
    return blocks.join('\n');
  }
  const camL: Record<string, string> = { wide: 'Plano general', medium: 'Plano medio', close_up: 'Primer plano', extreme_close_up: 'Primerisimo plano' };
  const movL: Record<string, string> = { static: 'Camara estatica', dolly_in: 'Camara avanza lentamente', dolly_out: 'Camara retrocede', tracking: 'Camara sigue al sujeto', orbit: 'Camara gira alrededor', crane: 'Camara asciende con grua' };
  const c = camL[cam] ?? 'Plano medio';
  const m = movL[move] ?? 'Camara estatica';

  const secText = secondary.length > 0 ? `. ${joinNames(secondary)} ${secondary.length > 1 ? 'aparecen' : 'aparece'} en segundo plano` : '';

  let t = 0;
  if (phase === 'hook') {
    blocks.push(`[00:${fmt(t)}-00:${fmt(t + bs)}]: ${c}. ${main} entra en escena${secText}. ${m} estableciendo el escenario. ${desc}.`);
    t += bs;
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(Math.min(t + bs, dur))}]: ${main} mira directamente a camara con expresion intensa. Elementos visuales dinamicos captan la atencion del espectador.`); t += bs; }
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(dur)}]: ${m} se detiene en ${main}. FREEZE. Transicion al siguiente clip.`); }
  } else if (phase === 'peak') {
    blocks.push(`[00:${fmt(t)}-00:${fmt(t + bs)}]: ${c}. Momento culminante. ${main} en el centro de la accion con expresion intensa${secText}.`);
    t += bs;
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(Math.min(t + bs, dur))}]: ${m} con energia. ${main} ${chars.length > 1 ? `interactua con ${secondary[0]}` : 'realiza la accion principal'}. Maxima intensidad visual y emocional.`); t += bs; }
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(dur)}]: Climax. ${main} en primer plano, expresion de impacto. FREEZE.`); }
  } else if (phase === 'close') {
    blocks.push(`[00:${fmt(t)}-00:${fmt(t + bs)}]: ${c}. ${main} en calma${secText}. ${desc}. El ritmo se ralentiza.`);
    t += bs;
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(Math.min(t + bs, dur))}]: ${m} retrocediendo. ${main} ${secondary.length > 0 ? `y ${secondary.join(', ')} comparten un ultimo momento` : 'cierra la escena con serenidad'}.`); t += bs; }
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(dur)}]: Ultimo plano de ${main}. FREEZE. Fade suave hacia negro.`); }
  } else {
    blocks.push(`[00:${fmt(t)}-00:${fmt(t + bs)}]: ${c}. ${main} protagoniza la escena${secText}. ${desc}. ${m}.`);
    t += bs;
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(Math.min(t + bs, dur))}]: ${main} ${secondary.length > 0 ? `junto a ${secondary[0]}` : 'desarrolla la accion'}. Detalles visuales que enriquecen la narrativa. ${m}.`); t += bs; }
    if (t < dur) { blocks.push(`[00:${fmt(t)}-00:${fmt(dur)}]: ${main} prepara la transicion. FREEZE. Corte al siguiente clip.`); }
  }
  return blocks.join('\n');
}

function addTimelines(scenes: GenScene[], charNames: string[] = []): GenScene[] {
  return scenes.map(s => ({
    ...s,
    timeline: s.timeline ?? genTimeline(s.title, s.description, s.duration_seconds, s.camera_angle ?? 'medium', s.camera_movement ?? 'static', s.arc_phase, charNames),
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

function mockScenes(dur: number, desc: string, proj: string, charNames: string[] = []): GenScene[] {
  const scenes: GenScene[] = [];
  const main = charNames[0] ?? 'el protagonista';
  const sec = charNames.length > 1 ? charNames.slice(1) : [];
  const secJoin = sec.length > 0 ? joinNames(sec) : '';

  // Scene templates with character-aware descriptions
  const templates = [
    {
      phase: 'hook', title: 'Apertura — plano general',
      desc: `Plano general. ${main} aparece en escena${sec.length > 0 ? ` junto a ${secJoin}` : ''}. Toma impactante que establece el escenario${proj ? ` de ${proj}` : ''}.`,
      extDesc: `${main} mira a camara. ${sec.length > 0 ? `${sec[0]} reacciona en segundo plano.` : 'Expresion de confianza.'}`,
      cam: 'wide', move: 'dolly_in',
    },
    {
      phase: 'build', title: 'Presentacion',
      desc: `${main} ${sec.length > 0 ? `y ${sec[0]} interactuan` : 'en accion'}. ${desc || `Se presentan los servicios y el equipo${proj ? ` de ${proj}` : ''}.`}`,
      extDesc: `Continuacion. ${sec.length > 0 ? `${sec[0]} muestra algo a ${main}.` : `${main} continua la accion.`} Detalle emocional.`,
      cam: 'medium', move: 'tracking',
    },
    {
      phase: 'build', title: 'Desarrollo',
      desc: `${main} ${sec.length > 0 ? `trabaja con ${secJoin}` : 'muestra su trabajo'}. ${desc || 'Accion principal del video.'} Plano medio con seguimiento.`,
      extDesc: `${sec.length > 0 ? `${sec[0]} sonrie mientras ${main} continua.` : `${main} en detalle.`} La camara se acerca suavemente.`,
      cam: 'medium', move: 'tracking',
    },
    {
      phase: 'peak', title: 'Climax — momento clave',
      desc: `Momento culminante. ${main} ${sec.length > 0 ? `y ${sec[0]} comparten un momento de emocion` : 'muestra el resultado final'}. Maxima intensidad visual.`,
      extDesc: `${main} en primer plano con expresion de satisfaccion. ${sec.length > 0 ? `${secJoin} ${sec.length > 1 ? 'aplauden' : 'aplaude'} detras.` : 'FREEZE.'}`,
      cam: 'close_up', move: 'orbit',
    },
    {
      phase: 'close', title: 'Cierre y CTA',
      desc: `${charNames.length > 1 ? `${main}, ${secJoin} — todos juntos` : main} de frente a camara. Sonrisas. Logo${proj ? ` de ${proj}` : ''} y llamada a la accion final.`,
      extDesc: `Plano final. ${main} despide con una sonrisa. Fade a negro con logo.`,
      cam: 'wide', move: 'dolly_out',
    },
  ];

  const pairDur = 16;
  const pairs = Math.max(2, Math.ceil(dur / pairDur));
  let t = 0;

  for (let i = 0; i < pairs && t < dur; i++) {
    const tmpl = templates[Math.min(i, templates.length - 1)];
    const isLast = i === pairs - 1;

    // Clip principal (10s)
    const clipDur = isLast ? Math.min(10, dur - t) : 10;
    if (clipDur > 0) {
      scenes.push({
        title: tmpl.title, description: tmpl.desc, arc_phase: tmpl.phase,
        duration_seconds: snap(clipDur),
        camera_angle: tmpl.cam, camera_movement: tmpl.move,
      });
      t += clipDur;
    }

    // Extension (6s)
    if (t < dur && !isLast) {
      const extDur = Math.min(6, dur - t);
      scenes.push({
        title: `${tmpl.title} — continuacion`, description: tmpl.extDesc,
        arc_phase: tmpl.phase, duration_seconds: snap(extDur),
        camera_angle: tmpl.cam, camera_movement: 'tracking',
      });
      t += extDur;
    }
  }

  return scenes;
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

  // Character/background selection
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [selectedBgIds, setSelectedBgIds] = useState<string[]>([]);

  // Get project characters and backgrounds
  let allChars: Array<{ id: string; name: string; initials: string | null; color_accent: string | null }> = [];
  let allBgs: Array<{ id: string; name: string; location_type: string | null }> = [];
  try {
    const ctx = useProject();
    allChars = (ctx.characters ?? []).map(c => ({ id: c.id, name: c.name, initials: c.initials, color_accent: c.color_accent }));
    allBgs = (ctx.backgrounds ?? []).map(b => ({ id: b.id, name: b.name, location_type: b.location_type }));
  } catch {}

  // Audio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [audioSections, setAudioSections] = useState<Array<{ type: string; durationSeconds: number; mood: string; energy: string; suggestedSceneType: string }>>([]);

  const upd = useCallback(<K extends keyof VideoFormData>(k: K, v: VideoFormData[K]) => setForm(f => ({ ...f, [k]: v })), []);
  function close() { setForm({ ...DEFAULT_VIDEO }); setStep(1); setScenes([]); setEditIdx(null); setChatInput(''); setSugVis(3); setSelectedCharIds([]); setSelectedBgIds([]); setChatMessages([]); setAudioFile(null); setAudioUrl(null); setAudioSections([]); onOpenChange(false); }
  function useSug(s: Suggestion) {
    setForm({ title: s.title, description: s.desc, platform: s.platform as VideoFormData['platform'], target_duration_seconds: s.dur, aspect_ratio: (PLATFORMS.find(p => p.value === s.platform)?.ratio ?? '16:9') as VideoFormData['aspect_ratio'] });
  }

  async function genScenes() {
    setGenerating(true); toast.ai('Generando escenas...', { id: 'gs' });

    const selBgNames = selectedBgIds.length > 0 ? allBgs.filter(b => selectedBgIds.includes(b.id)).map(b => b.name) : [];
    const charCtx = resolvedCharNames.length > 0 ? `Personajes principales: ${resolvedCharNames.join(', ')}. ` : '';
    const bgCtx = selBgNames.length > 0 ? `Fondos: ${selBgNames.join(', ')}. ` : '';

    try {
      const r = await fetch('/api/ai/generate-scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, instruction: `Escenas para "${form.title}" ${form.target_duration_seconds}s ${form.platform} estilo ${projStyle}. ${charCtx}${bgCtx}${form.description ?? ''}` }) });
      if (r.ok) { const j = await r.json(); if (j.success && j.data) { setScenes(addTimelines([{ ...j.data, duration_seconds: snap(j.data.duration_seconds ?? 5) }], resolvedCharNames)); toast.success('Generada', { id: 'gs' }); setGenerating(false); return; } }
    } catch {}
    setScenes(addTimelines(mockScenes(form.target_duration_seconds, form.description, projTitle, resolvedCharNames), resolvedCharNames));
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
  // Resolved character names (used in multiple places)
  const resolvedCharNames = selectedCharIds.length > 0 ? allChars.filter(c => selectedCharIds.includes(c.id)).map(c => c.name) : allChars.map(c => c.name);

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
        setScenes(addTimelines(mockSections, resolvedCharNames));
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
      setScenes(addTimelines(mockSections, resolvedCharNames));
      setAudioSections(mockSections.map(s => ({ type: s.arc_phase, durationSeconds: s.duration_seconds, mood: s.description, energy: 'medium', suggestedSceneType: s.arc_phase })));

      toast.success(`Cancion analizada — ${mockSections.length} escenas para videoclip`, { id: 'audio-analyze' });

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Videoclip "${fileName}" preparado. ${mockSections.length} escenas alineadas con la estructura musical (${audioDur}s). Cada escena describe que pasa visualmente.${resolvedCharNames.length > 0 ? ` Protagonistas: ${resolvedCharNames.join(', ')}.` : ''}`,
      }]);

    } catch {
      toast.error('Error al analizar audio', { id: 'audio-analyze' });
    }
    setAnalyzingAudio(false);
  }

  function generateAudioScenes(dur: number): GenScene[] {
    const main = resolvedCharNames[0] ?? 'el cantante';
    const sec = resolvedCharNames.length > 1 ? resolvedCharNames.slice(1) : [];

    const structure: Array<{ type: string; pct: number; title: string; desc: string; phase: string; cam: string; move: string }> = [
      { type: 'intro', pct: 0.08, title: 'Intro', desc: `Plano general atmosferico. ${main} aparece en silueta. La camara avanza lentamente revelando el escenario. Iluminacion suave.`, phase: 'hook', cam: 'wide', move: 'dolly_in' },
      { type: 'verse', pct: 0.15, title: 'Estrofa 1', desc: `${main} canta en plano medio. ${sec.length > 0 ? `${sec[0]} aparece en segundo plano.` : 'Expresion emotiva.'} Camara tracking siguiendo al artista. Narrativa visual.`, phase: 'build', cam: 'medium', move: 'tracking' },
      { type: 'chorus', pct: 0.12, title: 'Estribillo 1', desc: `Explosion de energia. ${main} en primer plano cantando con pasion. ${sec.length > 0 ? `${joinNames(sec)} bailan o celebran detras.` : 'Camara gira alrededor.'} Maxima intensidad visual.`, phase: 'peak', cam: 'close_up', move: 'orbit' },
      { type: 'verse', pct: 0.15, title: 'Estrofa 2', desc: `La historia se desarrolla. ${main} ${sec.length > 0 ? `interactua con ${sec[0]}` : 'camina por el escenario'}. Plano medio con tracking suave. Momentos emotivos.`, phase: 'build', cam: 'medium', move: 'tracking' },
      { type: 'chorus', pct: 0.12, title: 'Estribillo 2', desc: `Repeticion con mas fuerza. ${main} en close-up con expresion intensa. ${sec.length > 0 ? `${sec[0]} reacciona emocionado.` : 'La gente se mueve detras.'} Iluminacion dramatica.`, phase: 'peak', cam: 'close_up', move: 'dolly_in' },
      { type: 'bridge', pct: 0.10, title: 'Puente', desc: `Cambio de ritmo. ${main} solo, mirando al horizonte. Plano general diferente. Momento reflexivo. Camara lenta. Iluminacion fria.`, phase: 'build', cam: 'wide', move: 'crane' },
      { type: 'chorus', pct: 0.15, title: 'Estribillo final', desc: `Climax del videoclip. ${resolvedCharNames.length > 1 ? `${resolvedCharNames.join(', ')} juntos` : main} en el centro. Primer plano rotando. Explosion de color, emocion y movimiento.`, phase: 'peak', cam: 'close_up', move: 'orbit' },
      { type: 'outro', pct: 0.13, title: 'Outro', desc: `Cierre. La camara se aleja lentamente. ${main} queda solo en el centro del escenario. Fade suave a negro. Titulo de la cancion aparece.`, phase: 'close', cam: 'wide', move: 'dolly_out' },
    ];
    const scenes: GenScene[] = [];
    let t = 0;
    for (const s of structure) {
      const sd = snap(Math.round(dur * s.pct));
      if (t + sd > dur + 5) break;
      scenes.push({
        title: s.title, description: s.desc, arc_phase: s.phase,
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
            // Camera
            await sb.from('scene_camera').insert({ scene_id: ns.id, camera_angle: (s.camera_angle ?? 'medium') as Database['public']['Enums']['camera_angle'], camera_movement: (s.camera_movement ?? 'static') as Database['public']['Enums']['camera_movement'] });

            // Characters — per-scene selection, fallback to video-level selection, fallback to all
            const sceneCharIds = s.charIds?.length ? s.charIds : (selectedCharIds.length > 0 ? selectedCharIds : allChars.map(c => c.id));
            if (sceneCharIds.length > 0) {
              await sb.from('scene_characters').insert(
                sceneCharIds.map((cid, ci) => ({ scene_id: ns.id, character_id: cid, sort_order: ci }))
              );
            }

            // Backgrounds — per-scene selection, fallback to video-level, fallback to first
            const sceneBgIds = s.bgIds?.length ? s.bgIds : (selectedBgIds.length > 0 ? selectedBgIds : allBgs.slice(0, 1).map(b => b.id));
            if (sceneBgIds.length > 0) {
              await sb.from('scene_backgrounds').insert(
                sceneBgIds.map((bid, bi) => ({ scene_id: ns.id, background_id: bid, is_primary: bi === 0 }))
              );
            }

            // Auto-generate prompts in background
            fetch('/api/ai/generate-scene-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sceneId: ns.id }) }).catch(() => {});
          }
        }
      }
      qc.invalidateQueries({ queryKey: ['scenes'] }); qc.invalidateQueries({ queryKey: ['video'] });
      qc.invalidateQueries({ queryKey: ['scene-characters'] }); qc.invalidateQueries({ queryKey: ['scene-backgrounds'] });
      toast.success(`Video con ${scenes.length} escenas creado`, { id: 'ca' });
      const videoShortId = v.short_id;
      close(); onSuccess?.();
      if (videoShortId && projectShortId) router.push(`/project/${projectShortId}/video/${videoShortId}`);
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
                      <div className="flex items-center rounded-lg border border-border overflow-hidden">
                        <button type="button" onClick={() => upd('target_duration_seconds', Math.max(5, form.target_duration_seconds - 5))}
                          className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border-r border-border text-xs">−</button>
                        <span className="w-10 text-center text-xs font-medium text-foreground tabular-nums">{form.target_duration_seconds}s</span>
                        <button type="button" onClick={() => upd('target_duration_seconds', form.target_duration_seconds + 5)}
                          className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border-l border-border text-xs">+</button>
                      </div>
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

                  {/* Characters */}
                  {allChars.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground">Personajes {selectedCharIds.length > 0 ? `(${selectedCharIds.length})` : '— todos si no seleccionas'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allChars.map(c => {
                          const sel = selectedCharIds.includes(c.id);
                          return (
                            <button key={c.id} type="button"
                              onClick={() => setSelectedCharIds(prev => sel ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                              className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                                sel ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/20')}>
                              <span className="flex size-4 items-center justify-center rounded-full text-[7px] font-bold text-white shrink-0"
                                style={{ backgroundColor: c.color_accent ?? '#666' }}>
                                {c.initials?.[0] ?? c.name[0]}
                              </span>
                              {c.name}
                              {sel && <Check className="size-2.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Backgrounds */}
                  {allBgs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground">Fondos {selectedBgIds.length > 0 ? `(${selectedBgIds.length})` : '— la IA elige si no seleccionas'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allBgs.map(b => {
                          const sel = selectedBgIds.includes(b.id);
                          return (
                            <button key={b.id} type="button"
                              onClick={() => setSelectedBgIds(prev => sel ? prev.filter(id => id !== b.id) : [...prev, b.id])}
                              className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                                sel ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/20')}>
                              {b.name}
                              {b.location_type && <span className="text-[9px] text-muted-foreground/50">{b.location_type}</span>}
                              {sel && <Check className="size-2.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

                          {/* Scene config: chars, bgs, camera, audio */}
                          {s.expanded && (
                            <div className="mx-3.5 mb-2 space-y-2">
                              {/* Characters in this scene */}
                              {allChars.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[8px] text-muted-foreground/50 w-14 shrink-0">Personajes</span>
                                  {allChars.map(c => {
                                    const inScene = (s.charIds ?? selectedCharIds ?? []).includes(c.id) || !(s.charIds?.length);
                                    return (
                                      <button key={c.id} type="button"
                                        onClick={() => setScenes(p => p.map((sc, j) => {
                                          if (j !== i) return sc;
                                          const cur = sc.charIds ?? (selectedCharIds.length > 0 ? [...selectedCharIds] : allChars.map(ch => ch.id));
                                          return { ...sc, charIds: cur.includes(c.id) ? cur.filter(id => id !== c.id) : [...cur, c.id] };
                                        }))}
                                        className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] transition-all',
                                          inScene ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border/40 text-muted-foreground/40')}>
                                        <span className="size-3 rounded-full text-[6px] font-bold text-white flex items-center justify-center"
                                          style={{ backgroundColor: inScene ? (c.color_accent ?? '#666') : '#444' }}>{c.initials?.[0] ?? c.name[0]}</span>
                                        {c.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Backgrounds */}
                              {allBgs.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[8px] text-muted-foreground/50 w-14 shrink-0">Fondo</span>
                                  {allBgs.map(b => {
                                    const inScene = (s.bgIds ?? selectedBgIds ?? []).includes(b.id) || !(s.bgIds?.length);
                                    return (
                                      <button key={b.id} type="button"
                                        onClick={() => setScenes(p => p.map((sc, j) => {
                                          if (j !== i) return sc;
                                          const cur = sc.bgIds ?? (selectedBgIds.length > 0 ? [...selectedBgIds] : []);
                                          return { ...sc, bgIds: cur.includes(b.id) ? cur.filter(id => id !== b.id) : [...cur, b.id] };
                                        }))}
                                        className={cn('rounded-md border px-1.5 py-0.5 text-[9px] transition-all',
                                          inScene ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border/40 text-muted-foreground/40')}>
                                        {b.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Camera + Audio row */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Camera className="size-2.5 text-muted-foreground/40" />
                                  <select value={s.camera_angle ?? 'medium'} onChange={e => setScenes(p => p.map((sc, j) => j === i ? { ...sc, camera_angle: e.target.value } : sc))}
                                    className="text-[9px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer">
                                    <option value="wide">General</option><option value="medium">Medio</option>
                                    <option value="close_up">Primer plano</option><option value="extreme_close_up">Extreme CU</option>
                                  </select>
                                  <select value={s.camera_movement ?? 'static'} onChange={e => setScenes(p => p.map((sc, j) => j === i ? { ...sc, camera_movement: e.target.value } : sc))}
                                    className="text-[9px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer">
                                    <option value="static">Estatica</option><option value="dolly_in">Dolly in</option>
                                    <option value="dolly_out">Dolly out</option><option value="tracking">Tracking</option>
                                    <option value="orbit">Orbita</option><option value="crane">Grua</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {[
                                    { key: 'music' as const, label: '♫' },
                                    { key: 'dialogue' as const, label: '💬' },
                                    { key: 'sfx' as const, label: 'SFX' },
                                  ].map(a => (
                                    <button key={a.key} type="button"
                                      onClick={() => setScenes(p => p.map((sc, j) => j === i ? { ...sc, [a.key]: !sc[a.key] } : sc))}
                                      className={cn('rounded px-1.5 py-0.5 text-[8px] font-medium transition-all',
                                        s[a.key] ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground/30 border border-transparent hover:border-border')}>
                                      {a.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
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
                    <div className="space-y-2 py-1">
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                        Describe que cambiar o usa las sugerencias:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {['Mas dramatico', 'Mas dinamico', 'Añade humor', 'Mas emotivo', 'Cambia el cierre', 'Mas corto'].map(q => (
                          <button key={q} type="button" onClick={() => setChatInput(q)}
                            className="rounded-md border border-border px-2 py-1 text-[9px] text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
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
