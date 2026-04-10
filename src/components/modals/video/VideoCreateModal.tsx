'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import {
  Film, Sparkles, X, Loader2, Monitor, Smartphone, Clock, Camera,
  ChevronRight, Plus, RefreshCw, Check, Send, Wand2, Clapperboard,
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

interface Suggestion { title: string; desc: string; platform: string; dur: number }
interface GenScene { title: string; description: string; arc_phase: string; duration_seconds: number; camera_angle?: string; camera_movement?: string; selected?: boolean }

const VALID_DURS = [3, 4, 5, 6, 8, 10];
function snap(d: number) { return VALID_DURS.reduce((p, c) => Math.abs(c - d) < Math.abs(p - d) ? c : p); }

function makeSugs(name: string): Suggestion[] {
  return [
    { title: `Presentacion de ${name}`, desc: 'Promocional con servicios y equipo', platform: 'youtube', dur: 60 },
    { title: 'Reel Antes/Despues', desc: 'Transformaciones rapidas para redes', platform: 'instagram_reels', dur: 30 },
    { title: 'Spot publicitario', desc: 'Anuncio corto con gancho y CTA', platform: 'tv_commercial', dur: 15 },
    { title: 'Detras de camaras', desc: 'Equipo en accion, momentos reales', platform: 'tiktok', dur: 30 },
    { title: 'Testimonio cliente', desc: 'Experiencia emocional de un cliente', platform: 'youtube', dur: 60 },
    { title: 'Tutorial / How-to', desc: 'Paso a paso educativo', platform: 'youtube', dur: 180 },
    { title: 'Showreel portfolio', desc: 'Compilacion de mejores trabajos', platform: 'instagram_reels', dur: 30 },
    { title: 'Lanzamiento producto', desc: 'Revelar producto con suspense', platform: 'youtube', dur: 60 },
  ].sort(() => Math.random() - 0.5);
}

function mockScenes(dur: number, desc: string, proj: string): GenScene[] {
  const ph = ['hook', 'build', 'build', 'peak', 'close'];
  const ti = ['Apertura', 'Presentacion', 'Desarrollo', 'Climax', 'Cierre y CTA'];
  const ds = [
    `Toma impactante.${proj ? ` ${proj}.` : ''}`, 'Escenario y elementos principales.',
    desc || 'Contenido central del video.', 'Momento de mayor impacto.', 'Mensaje final y CTA.',
  ];
  const n = dur <= 15 ? 3 : dur <= 30 ? 4 : dur <= 60 ? 5 : 6;
  let rem = dur;
  return Array.from({ length: n }, (_, i) => {
    const sd = snap(i === n - 1 ? rem : Math.floor(dur / n)); rem -= sd;
    const pi = Math.min(i, ph.length - 1);
    return { title: ti[pi], description: ds[pi], arc_phase: ph[pi], duration_seconds: sd, camera_angle: i === 0 ? 'wide' : 'medium', camera_movement: i === 0 ? 'dolly_in' : 'tracking' };
  });
}

/* ── Component ────────────────────────────────────────────── */

export function VideoCreateModal({ open, onOpenChange, projectId, projectShortId, onSuccess }: ModalProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const mut = useCreateVideo(projectId);

  let projTitle = ''; let projStyle = 'pixar'; let chars = 0; let bgs = 0;
  try { const c = useProject(); projTitle = c.project?.title ?? ''; projStyle = c.project?.style ?? 'pixar'; chars = c.characters?.length ?? 0; bgs = c.backgrounds?.length ?? 0; } catch {}

  const [step, setStep] = useState<'video' | 'scenes'>('video');
  const [form, setForm] = useState<VideoFormData>({ ...DEFAULT_VIDEO });
  const [allSugs] = useState<Suggestion[]>(() => makeSugs(projTitle));
  const [sugVisible, setSugVisible] = useState(3);

  const [generating, setGenerating] = useState(false);
  const [scenes, setScenes] = useState<GenScene[]>([]);
  const [saving, setSaving] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const upd = useCallback(<K extends keyof VideoFormData>(k: K, v: VideoFormData[K]) => setForm(f => ({ ...f, [k]: v })), []);

  function close() { setForm({ ...DEFAULT_VIDEO }); setStep('video'); setScenes([]); setEditIdx(null); setChatInput(''); setSugVisible(3); onOpenChange(false); }

  function useSug(s: Suggestion) {
    setForm({ title: s.title, description: s.desc, platform: s.platform as VideoFormData['platform'], target_duration_seconds: s.dur, aspect_ratio: (PLATFORMS.find(p => p.value === s.platform)?.ratio ?? '16:9') as VideoFormData['aspect_ratio'] });
  }

  async function genScenes() {
    setGenerating(true); toast.ai('Generando escenas...', { id: 'gs' });
    try {
      const r = await fetch('/api/ai/generate-scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, instruction: `Escenas para "${form.title}" ${form.target_duration_seconds}s ${form.platform} estilo ${projStyle}. ${form.description ?? ''}` }) });
      if (r.ok) { const j = await r.json(); if (j.success && j.data) { setScenes([{ ...j.data, duration_seconds: snap(j.data.duration_seconds ?? 5) }]); toast.success('Generada', { id: 'gs' }); setGenerating(false); return; } }
    } catch {}
    setScenes(mockScenes(form.target_duration_seconds, form.description, projTitle));
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
    if (sel.length === 0) { toast.error('Selecciona escenas'); return; }
    setChatInput(''); setChatBusy(true); toast.ai('Actualizando...', { id: 'cu' });
    const up = [...scenes];
    for (const idx of sel) {
      const s = up[idx];
      try {
        const r = await fetch('/api/ai/generate-scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, instruction: `Actualiza: "${s.title}" (${s.arc_phase}, ${s.duration_seconds}s). Feedback: "${t}". Estilo ${projStyle}. 3-10s.` }) });
        if (r.ok) { const j = await r.json(); if (j.success && j.data) { up[idx] = { ...j.data, duration_seconds: snap(j.data.duration_seconds ?? s.duration_seconds), selected: false }; continue; } }
      } catch {}
      up[idx] = { ...s, description: `${s.description} — ${t}`, selected: false };
    }
    setScenes(up); toast.success('Actualizado', { id: 'cu' }); setChatBusy(false);
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
      <div className="flex h-[min(720px,88vh)] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Nav */}
        <div className="w-36 shrink-0 border-r border-border flex flex-col">
          <div className="px-3 pt-4 pb-2"><p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Nuevo video</p></div>
          <nav className="flex-1 px-2 space-y-0.5">
            {[
              { id: 'video' as const, label: 'Video', icon: Film, dis: false },
              { id: 'scenes' as const, label: 'Escenas', icon: Sparkles, dis: !ok },
            ].map(n => (
              <button key={n.id} type="button" disabled={n.dis} onClick={() => !n.dis && setStep(n.id)}
                className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
                  step === n.id ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60',
                  n.dis && 'opacity-40 cursor-not-allowed')}>
                <n.icon className="size-3.5" />{n.label}
                {n.id === 'scenes' && scenes.length > 0 && <span className="ml-auto text-[10px] text-primary font-medium">{scenes.length}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-2.5 shrink-0">
            <p className="text-sm font-semibold">{step === 'video' ? 'Detalles del video' : 'Escenas del video'}</p>
            <button type="button" onClick={close} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><X className="size-4" /></button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              {/* ── Video ──────────────────────────── */}
              {step === 'video' && (
                <div className="space-y-4 max-w-md">
                  <TextField variant="secondary" value={form.title} onChange={v => upd('title', v)} isRequired autoFocus>
                    <Label>Titulo *</Label><Input placeholder="Ej. Spot primavera 2025" />
                  </TextField>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Plataforma</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PLATFORMS.map(p => (
                        <button key={p.value} type="button" onClick={() => { upd('platform', p.value); upd('aspect_ratio', (p.ratio ?? '16:9') as VideoFormData['aspect_ratio']); }}
                          className={cn('rounded-lg border px-2.5 py-1.5 text-left transition-all', form.platform === p.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20')}>
                          <div className="flex items-center gap-1">
                            {p.ratio === '9:16' ? <Smartphone className="size-3 text-muted-foreground" /> : <Monitor className="size-3 text-muted-foreground" />}
                            <p className={cn('text-[11px] font-medium', form.platform === p.value ? 'text-primary' : 'text-foreground')}>{p.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Duracion</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DURATIONS.map(d => (
                        <button key={d.value} type="button" onClick={() => upd('target_duration_seconds', d.value)}
                          className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-all', form.target_duration_seconds === d.value ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/20')}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn('rounded border border-border bg-background flex items-center justify-center', isV ? 'w-5 h-9' : 'w-9 h-5')}>
                      <span className="text-[6px] text-muted-foreground/40">{form.aspect_ratio}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground"><span className="font-medium text-foreground">{form.aspect_ratio}</span> · {isV ? 'Vertical' : 'Horizontal'}</p>
                  </div>
                  <TextField variant="secondary" value={form.description} onChange={v => upd('description', v)}>
                    <Label>Descripcion</Label><TextArea placeholder="De que trata este video..." rows={2} />
                  </TextField>
                </div>
              )}

              {/* ── Scenes ─────────────────────────── */}
              {step === 'scenes' && (
                <div className="space-y-3">
                  {/* Context bar */}
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span><span className="text-foreground font-medium">{form.title}</span> · {PLATFORMS.find(p => p.value === form.platform)?.label} · {form.target_duration_seconds}s · {projStyle}</span>
                    {chars > 0 && <span className="text-[10px]">{chars} personajes · {bgs} fondos</span>}
                  </div>

                  {/* Empty state */}
                  {scenes.length === 0 && !generating && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Clapperboard className="size-7 text-primary" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-semibold text-foreground">Genera las escenas con IA</p>
                        <p className="text-xs text-muted-foreground max-w-xs">Kiyoko creara un storyboard completo con arco narrativo, camara y descripciones para cada escena.</p>
                      </div>
                      <button type="button" onClick={genScenes}
                        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <Sparkles className="size-4" /> Generar escenas
                      </button>
                    </div>
                  )}

                  {/* Loading */}
                  {generating && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                        <Loader2 className="size-5 animate-spin text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Generando escenas...</p>
                    </div>
                  )}

                  {/* Scene list */}
                  {scenes.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">{scenes.length} escenas · {totDur}s total</p>
                        <button type="button" onClick={() => { setScenes([]); genScenes(); }}
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                          <RefreshCw className="size-2.5" /> Regenerar todo
                        </button>
                      </div>
                      {scenes.map((s, i) => (
                        <div key={i} className={cn('rounded-xl border overflow-hidden transition-all',
                          s.selected ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-card hover:border-border/80')}>
                          <div className="flex items-center gap-2 px-3 py-2">
                            <button type="button" onClick={() => toggleSel(i)}
                              className={cn('flex size-4 items-center justify-center rounded border shrink-0 transition-colors',
                                s.selected ? 'bg-primary border-primary text-white' : 'border-border/60 hover:border-primary/40')}>
                              {s.selected && <Check className="size-2.5" />}
                            </button>
                            <span className="text-[10px] font-bold text-muted-foreground/60 w-4">#{i + 1}</span>
                            {editIdx === i ? (
                              <input type="text" value={s.title} onChange={e => setScenes(p => p.map((sc, j) => j === i ? { ...sc, title: e.target.value } : sc))}
                                onBlur={() => setEditIdx(null)} autoFocus className="text-xs font-medium bg-transparent border-b border-primary/30 outline-none flex-1" />
                            ) : (
                              <button type="button" onClick={() => setEditIdx(i)} className="text-xs font-medium text-foreground hover:text-primary truncate text-left flex-1 transition-colors">{s.title}</button>
                            )}
                            <span className={cn('rounded px-1.5 py-0.5 text-[8px] font-semibold text-white shrink-0', PHASE_STYLES[s.arc_phase] ?? 'bg-zinc-500')}>{s.arc_phase}</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{s.duration_seconds}s</span>
                            <button type="button" onClick={() => regenOne(i)} title="Regenerar esta escena"
                              className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"><RefreshCw className="size-3" /></button>
                          </div>
                          {editIdx === i ? (
                            <div className="px-3 pb-2.5">
                              <textarea value={s.description} onChange={e => setScenes(p => p.map((sc, j) => j === i ? { ...sc, description: e.target.value } : sc))}
                                rows={2} className="w-full text-[11px] text-muted-foreground bg-transparent border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary/30 resize-none" />
                            </div>
                          ) : (
                            <p className="px-3 pb-2 text-[10px] text-muted-foreground/70 line-clamp-1 cursor-pointer hover:text-muted-foreground transition-colors" onClick={() => setEditIdx(i)}>{s.description}</p>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            {step === 'video' && (
              <div className="w-64 shrink-0 border-l border-border bg-background/30 overflow-y-auto px-3 py-3 space-y-2 hidden lg:block">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Sugerencias</p>
                {allSugs.slice(0, sugVisible).map((s, i) => (
                  <button key={i} type="button" onClick={() => useSug(s)}
                    className="w-full rounded-lg border border-border p-2.5 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group">
                    <p className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{s.title}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{s.desc}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-0.5">{PLATFORMS.find(p => p.value === s.platform)?.label} · {s.dur >= 60 ? `${Math.floor(s.dur / 60)}m` : `${s.dur}s`}</p>
                  </button>
                ))}
                {sugVisible < allSugs.length && (
                  <button type="button" onClick={() => setSugVisible(v => v + 2)}
                    className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mx-auto">
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            {step === 'scenes' && scenes.length > 0 && (
              <div className="w-64 shrink-0 border-l border-border bg-background/30 flex flex-col hidden lg:flex">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-[10px] font-semibold text-foreground">
                    {selCount > 0 ? `${selCount} escena${selCount > 1 ? 's' : ''} seleccionada${selCount > 1 ? 's' : ''}` : 'Editar con IA'}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Marca escenas y describe que cambiar</p>
                </div>
                <div className="flex-1" />
                <div className="px-3 py-3 border-t border-border">
                  <div className="flex gap-1.5">
                    <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); } }}
                      placeholder={selCount > 0 ? 'Que cambiarias...' : 'Selecciona escenas primero'} rows={2} disabled={selCount === 0}
                      className="flex-1 resize-none rounded-lg border border-border bg-card px-2.5 py-2 text-[11px] outline-none placeholder:text-muted-foreground/40 focus:border-primary/30 disabled:opacity-40" />
                    <button type="button" onClick={chatSend} disabled={!chatInput.trim() || selCount === 0 || chatBusy}
                      className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 shrink-0 self-end transition-colors">
                      {chatBusy ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer — always visible */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3 shrink-0">
            {step === 'video' && (
              <>
                <button type="button" onClick={() => { setScenes([]); createAll(); }} disabled={!ok || saving}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                  Crear sin escenas
                </button>
                <button type="button" onClick={() => setStep('scenes')} disabled={!ok}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  Siguiente <ChevronRight className="size-3" />
                </button>
              </>
            )}
            {step === 'scenes' && (
              <>
                <button type="button" onClick={() => { setScenes([]); createAll(); }} disabled={saving}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50">
                  Crear sin escenas
                </button>
                {scenes.length > 0 ? (
                  <button type="button" onClick={createAll} disabled={saving}
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                    Crear video con {scenes.length} escenas
                  </button>
                ) : (
                  <button type="button" onClick={genScenes} disabled={generating}
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                    {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Generar escenas
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
