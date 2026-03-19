'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { NARRATION_STYLES, type NarrationStyleId } from '@/lib/narration/styles';
import { estimateDuration, maxWordsForDuration } from '@/lib/narration/utils';
import { NarrationPlayer } from '@/components/narration/NarrationPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  Mic, Sparkles, Play, Download, Trash2, Upload,
  Loader2, Volume2, Clock, CheckCircle2, AlertTriangle,
  Circle, RotateCcw, Ban, FileText, Check,
  ListMusic, Film,
} from 'lucide-react';

interface NScene {
  id: string;
  scene_number: string;
  title: string;
  description: string;
  duration_seconds: number;
  arc_phase: string;
  narration_text: string;
  narration_status: string;
  narration_audio_url: string | null;
  narration_audio_duration_ms: number | null;
}

interface Voice {
  voice_id: string;
  name: string;
  labels: Record<string, string>;
  preview_url: string;
  category: string;
}

const ARC_COLORS: Record<string, string> = { hook: '#EF4444', build: '#F59E0B', peak: '#10B981', close: '#3B82F6' };

export default function NarrationPage() {
  const { project, loading: projectLoading } = useProject();
  const { video: activeVideo } = useVideo();
  const supabase = createClient();

  // Data
  const [allScenes, setAllScenes] = useState<NScene[]>([]);
  const [videoSceneIds, setVideoSceneIds] = useState<Set<string> | null>(null);
  const scenes = videoSceneIds !== null ? allScenes.filter((s) => videoSceneIds.has(s.id)) : allScenes;
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  // Config
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<NarrationStyleId>('pixar');
  const [speed, setSpeed] = useState(1.0);
  const [customInstructions, setCustomInstructions] = useState('');

  // Per-scene mode
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());

  // Full-video mode
  const [fullText, setFullText] = useState('');
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);

  // Generation state
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('scenes')
      .select('id, scene_number, title, description, duration_seconds, arc_phase, narration_text, narration_status, narration_audio_url, narration_audio_duration_ms')
      .eq('project_id', project.id)
      .order('sort_order');
    setAllScenes((data as NScene[]) ?? []);

    // Load project full text
    const proj = project as unknown as Record<string, string>;
    setFullText(proj.narration_full_text || '');
    setFullAudioUrl(proj.narration_full_audio_url || null);

    setLoading(false);
  }, [project?.id, supabase]);

  // Fetch voices from ElevenLabs
  const fetchVoices = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/voices');
      if (!res.ok) return;
      const data = await res.json();
      const voiceList = data.voices ?? [];
      setVoices(voiceList);
      if (voiceList.length > 0 && !selectedVoice) {
        setSelectedVoice(voiceList[0].voice_id);
      }
    } catch { /* ignore */ }
  }, [selectedVoice]);

  useEffect(() => {
    if (!projectLoading && project?.id) {
      fetchData();
      fetchVoices();
    }
  }, [projectLoading, project?.id, fetchData, fetchVoices]);

  // Fetch video scene IDs when active video changes
  useEffect(() => {
    if (!activeVideo) { setVideoSceneIds(null); return; }
    supabase
      .from('video_cut_scenes')
      .select('scene_id')
      .eq('video_cut_id', activeVideo.id)
      .then(({ data }) => {
        setVideoSceneIds(data ? new Set(data.map((r: { scene_id: string }) => r.scene_id)) : new Set());
      });
  }, [activeVideo?.id, supabase]);

  // Toggle scene selection
  const toggleScene = (id: string) => {
    setSelectedSceneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedSceneIds(new Set(scenes.map((s) => s.id)));
  const selectNone = () => setSelectedSceneIds(new Set());

  // Generate text for selected scenes
  const handleGenerateTexts = useCallback(async () => {
    if (!project?.id) return;
    const target = selectedSceneIds.size > 0
      ? scenes.filter((s) => selectedSceneIds.has(s.id))
      : scenes;

    const tid = toast.loading(`Generando textos para ${target.length} escenas...`);
    setGeneratingAll(true);
    try {
      const res = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'per_scene',
          scenes: target.map((s) => ({
            id: s.id, scene_number: s.scene_number, title: s.title,
            description: s.description, duration_seconds: s.duration_seconds, arc_phase: s.arc_phase,
          })),
          config: { styleId: selectedStyle, customInstructions, language: 'es' },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      for (const r of (data.results as Array<{ sceneId: string; text: string }>)) {
        if (r.text) {
          await supabase.from('scenes').update({ narration_text: r.text, narration_status: 'has_text' }).eq('id', r.sceneId);
        }
      }
      await fetchData();
      toast.success('Textos generados', { id: tid });
    } catch { toast.error('Error al generar textos', { id: tid }); }
    finally { setGeneratingAll(false); }
  }, [project?.id, scenes, selectedSceneIds, selectedStyle, customInstructions, supabase, fetchData]);

  // Generate audio for one scene
  const handleGenerateAudio = useCallback(async (sceneId: string) => {
    if (!project?.id || !selectedVoice) { toast.error('Selecciona una voz'); return; }
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene?.narration_text) { toast.error('Escribe el texto primero'); return; }

    setGeneratingIds((prev) => new Set(prev).add(sceneId));
    const tid = toast.loading('Generando audio...');
    try {
      const style = NARRATION_STYLES[selectedStyle];
      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.narration_text, voice: selectedVoice, language: 'es',
          stability: style.elevenLabsSettings.stability,
          similarityBoost: style.elevenLabsSettings.similarity_boost,
          style: style.elevenLabsSettings.style,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('audio')) throw new Error('TTS failed');
      const blob = await res.blob();
      const path = `${project.id}/narration/${sceneId}/${Date.now()}.mp3`;
      const { error } = await supabase.storage.from('project-assets').upload(path, blob, { contentType: 'audio/mpeg', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
      await supabase.from('scenes').update({ narration_audio_url: publicUrl, narration_audio_path: path, narration_status: 'generated' }).eq('id', sceneId);
      await fetchData();
      toast.success('Audio generado', { id: tid });
    } catch { toast.error('Error al generar audio', { id: tid }); }
    finally { setGeneratingIds((prev) => { const n = new Set(prev); n.delete(sceneId); return n; }); }
  }, [project?.id, scenes, selectedVoice, selectedStyle, supabase, fetchData]);

  // Generate all audio for selected scenes
  const handleGenerateAllAudio = useCallback(async () => {
    if (!selectedVoice) { toast.error('Selecciona una voz primero'); return; }
    const target = scenes.filter((s) => selectedSceneIds.has(s.id) && s.narration_text && !s.narration_audio_url);
    if (target.length === 0) { toast.error('No hay escenas seleccionadas con texto sin audio'); return; }
    setBatchProgress({ current: 0, total: target.length });
    for (let i = 0; i < target.length; i++) {
      setBatchProgress({ current: i + 1, total: target.length });
      await handleGenerateAudio(target[i].id);
    }
    setBatchProgress(null);
    toast.success('Todos los audios generados');
  }, [scenes, selectedSceneIds, selectedVoice, handleGenerateAudio]);

  // Generate full video narration (continuous text)
  const handleGenerateFullText = useCallback(async () => {
    if (!project?.id) return;
    const tid = toast.loading('Generando guion completo del video...');
    setGeneratingAll(true);
    try {
      const res = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'continuous',
          scenes: scenes.map((s) => ({
            id: s.id, scene_number: s.scene_number, title: s.title,
            description: s.description, duration_seconds: s.duration_seconds, arc_phase: s.arc_phase,
          })),
          config: {
            styleId: selectedStyle, customInstructions, language: 'es',
            projectName: (project as unknown as Record<string, string>).title || '',
          },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setFullText(data.text || '');
      await supabase.from('projects').update({ narration_full_text: data.text }).eq('id', project.id);
      toast.success('Guion completo generado', { id: tid });
    } catch { toast.error('Error al generar guion', { id: tid }); }
    finally { setGeneratingAll(false); }
  }, [project, scenes, selectedStyle, customInstructions, supabase]);

  // Generate full audio from full text
  const handleGenerateFullAudio = useCallback(async () => {
    if (!project?.id || !selectedVoice || !fullText) return;
    const tid = toast.loading('Generando audio completo del video...');
    setGeneratingAll(true);
    try {
      const style = NARRATION_STYLES[selectedStyle];
      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText, voice: selectedVoice, language: 'es',
          stability: style.elevenLabsSettings.stability,
          similarityBoost: style.elevenLabsSettings.similarity_boost,
          style: style.elevenLabsSettings.style,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('audio')) throw new Error('TTS failed');
      const blob = await res.blob();
      const path = `${project.id}/narration/full/${Date.now()}.mp3`;
      const { error } = await supabase.storage.from('project-assets').upload(path, blob, { contentType: 'audio/mpeg', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
      setFullAudioUrl(publicUrl);
      await supabase.from('projects').update({ narration_full_audio_url: publicUrl }).eq('id', project.id);
      toast.success('Audio completo generado', { id: tid });
    } catch { toast.error('Error al generar audio', { id: tid }); }
    finally { setGeneratingAll(false); }
  }, [project, fullText, selectedVoice, selectedStyle, supabase]);

  // Stats
  const withAudio = scenes.filter((s) => s.narration_audio_url).length;
  const withText = scenes.filter((s) => s.narration_text).length;
  const totalDuration = scenes.reduce((a, s) => a + (s.duration_seconds || 0), 0);

  if (loading || projectLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-foreground-muted" /></div>;
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ═══ SIDEBAR ═══ */}
      <div className="w-72 shrink-0 overflow-y-auto border-r border-foreground/6 bg-surface p-4 space-y-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Mic className="h-4 w-4 text-brand-500" /> Configuracion
        </h3>

        {/* Voice selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Voz</span>
          {voices.length === 0 ? (
            <p className="text-xs text-foreground-muted">Cargando voces... (necesitas ELEVENLABS_API_KEY)</p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-surface-tertiary p-1">
              {voices.slice(0, 15).map((v) => {
                const isSelected = selectedVoice === v.voice_id;
                const gender = v.labels?.gender || '';
                return (
                  <button
                    key={v.voice_id}
                    onClick={() => setSelectedVoice(v.voice_id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition',
                      isSelected ? 'bg-brand-500 text-white' : 'hover:bg-surface-secondary',
                    )}
                  >
                    <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px]', isSelected ? 'bg-white/20' : gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400')}>
                      <Mic className="h-2.5 w-2.5" />
                    </div>
                    <span className={cn('flex-1 truncate text-xs font-medium', isSelected ? 'text-white' : 'text-foreground')}>{v.name}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                    {v.preview_url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); new Audio(v.preview_url).play(); }}
                        className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', isSelected ? 'bg-white/20 hover:bg-white/30' : 'bg-surface-tertiary hover:bg-surface-secondary')}
                        aria-label={`Preview ${v.name}`}
                      >
                        <Play className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Style selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Estilo de narracion</span>
          <div className="grid grid-cols-2 gap-1">
            {Object.values(NARRATION_STYLES).map((style) => {
              const isActive = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-left transition',
                    isActive
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-surface-tertiary text-foreground-secondary hover:border-foreground/20 hover:bg-surface-secondary',
                  )}
                >
                  <span className={cn('block text-[10px] font-semibold', isActive ? 'text-white' : 'text-foreground')}>{style.name}</span>
                  <span className={cn('block text-[9px] line-clamp-1', isActive ? 'text-white/70' : 'text-foreground-muted')}>{style.description}</span>
                </button>
              );
            })}
          </div>
          {selectedStyle === 'custom' && (
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Instrucciones personalizadas..."
              rows={2}
              className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-2.5 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
            />
          )}
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Velocidad</span>
            <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-bold text-foreground">{speed}x</span>
          </div>
          <input type="range" min={0.7} max={1.3} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full accent-brand-500" />
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-foreground/6 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Narracion y Voz</h2>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-foreground-muted">
                <span>{scenes.length} escenas</span>
                <span className="text-green-400">{withAudio} con audio</span>
                <span className="text-blue-400">{withText} con texto</span>
                <span>{totalDuration}s total</span>
              </div>
            </div>
            <div className="w-28">
              <div className="mb-0.5 text-right text-[10px] font-bold text-foreground">{scenes.length > 0 ? Math.round((withAudio / scenes.length) * 100) : 0}%</div>
              <div className="h-1.5 rounded-full bg-surface-tertiary">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${scenes.length > 0 ? (withAudio / scenes.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Batch progress */}
        {batchProgress && (
          <div className="shrink-0 border-b border-foreground/6 bg-brand-500/5 px-6 py-2 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            <span className="text-xs font-medium text-foreground">Audio {batchProgress.current}/{batchProgress.total}</span>
            <div className="h-1.5 flex-1 rounded-full bg-surface-tertiary">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Tabs: Per-scene / Full video */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="per_scene" className="flex h-full flex-col">
            <div className="shrink-0 px-6 pt-3">
              <TabsList>
                <TabsTrigger value="per_scene" className="gap-1.5">
                  <ListMusic className="h-4 w-4" /> Por escena
                </TabsTrigger>
                <TabsTrigger value="full_video" className="gap-1.5">
                  <Film className="h-4 w-4" /> Video completo
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ═══ PER-SCENE TAB ═══ */}
            <TabsContent value="per_scene" className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {/* Selection toolbar */}
              <div className="flex items-center gap-2 rounded-lg bg-surface-secondary p-2">
                <button onClick={selectAll} className="text-xs text-brand-500 hover:underline">Seleccionar todas</button>
                <button onClick={selectNone} className="text-xs text-foreground-muted hover:underline">Ninguna</button>
                <span className="text-xs text-foreground-muted">{selectedSceneIds.size} seleccionadas</span>
                <div className="flex-1" />
                <button
                  onClick={handleGenerateTexts}
                  disabled={generatingAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-scene-filler px-3 py-1.5 text-xs font-medium text-white transition hover:bg-scene-filler/90 disabled:opacity-50"
                >
                  {generatingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Generar textos IA
                </button>
                <button
                  onClick={handleGenerateAllAudio}
                  disabled={generatingAll || !selectedVoice || selectedSceneIds.size === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  <Volume2 className="h-3 w-3" /> Generar audios
                </button>
              </div>

              {/* Scene cards */}
              {scenes.map((scene) => {
                const isSelected = selectedSceneIds.has(scene.id);
                const isGenerating = generatingIds.has(scene.id);
                const hasText = !!scene.narration_text;
                const hasAudio = !!scene.narration_audio_url;
                const est = hasText ? estimateDuration(scene.narration_text) : 0;
                const fits = est <= scene.duration_seconds;

                return (
                  <div key={scene.id} className={cn('rounded-xl border bg-surface-secondary overflow-hidden transition', isSelected ? 'border-brand-500' : 'border-surface-tertiary')}>
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-surface-tertiary/50 px-3 py-2">
                      <button
                        onClick={() => toggleScene(scene.id)}
                        className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border transition', isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-surface-tertiary hover:border-brand-500/50')}
                        aria-label={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                      <span className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white" style={{ backgroundColor: ARC_COLORS[scene.arc_phase] || '#6B7280' }}>
                        {scene.scene_number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{scene.title}</span>
                      <span className="text-[10px] tabular-nums text-foreground-muted">{scene.duration_seconds}s</span>
                      {hasAudio && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                      {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-400" />}
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-2">
                      {/* Text */}
                      <textarea
                        value={scene.narration_text || ''}
                        onChange={async (e) => {
                          const newScenes = scenes.map((s) => s.id === scene.id ? { ...s, narration_text: e.target.value } : s);
                          setAllScenes(newScenes);
                        }}
                        onBlur={async (e) => {
                          await supabase.from('scenes').update({ narration_text: e.target.value, narration_status: e.target.value ? 'has_text' : 'no_text' }).eq('id', scene.id);
                        }}
                        placeholder="Texto de narracion..."
                        rows={2}
                        className="w-full rounded-lg border border-surface-tertiary bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
                      />

                      {/* Stats */}
                      {hasText && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-foreground-muted">~{est}s | {scene.narration_text.split(/\s+/).length} pal.</span>
                          {fits ? <span className="text-green-500">OK</span> : <span className="text-amber-500">+{(est - scene.duration_seconds).toFixed(1)}s</span>}
                        </div>
                      )}

                      {/* Player */}
                      {hasAudio && (
                        <NarrationPlayer
                          src={scene.narration_audio_url!}
                          sceneLabel={scene.scene_number}
                          compact
                          onDelete={async () => {
                            await supabase.from('scenes').update({ narration_audio_url: null, narration_status: hasText ? 'has_text' : 'no_text' }).eq('id', scene.id);
                            await fetchData();
                          }}
                        />
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!hasText && (
                          <button
                            onClick={async () => {
                              const tid = toast.loading('Generando texto...');
                              try {
                                const res = await fetch('/api/ai/generate-narration', {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    mode: 'per_scene',
                                    scenes: [{ id: scene.id, scene_number: scene.scene_number, title: scene.title, description: scene.description, duration_seconds: scene.duration_seconds, arc_phase: scene.arc_phase }],
                                    config: { styleId: selectedStyle, customInstructions, language: 'es' },
                                  }),
                                });
                                if (!res.ok) throw new Error('err');
                                const data = await res.json();
                                const r = (data.results as Array<{ sceneId: string; text: string }>)?.[0];
                                if (r?.text) {
                                  await supabase.from('scenes').update({ narration_text: r.text, narration_status: 'has_text' }).eq('id', scene.id);
                                  await fetchData();
                                }
                                toast.success('Texto generado', { id: tid });
                              } catch { toast.error('Error', { id: tid }); }
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-scene-filler/10 px-2 py-1 text-[10px] font-medium text-scene-filler hover:bg-scene-filler/20"
                          >
                            <Sparkles className="h-3 w-3" /> Texto IA
                          </button>
                        )}
                        {hasText && !hasAudio && !isGenerating && (
                          <button
                            onClick={() => handleGenerateAudio(scene.id)}
                            disabled={!selectedVoice}
                            className="inline-flex items-center gap-1 rounded-md bg-brand-500/10 px-2 py-1 text-[10px] font-medium text-brand-500 hover:bg-brand-500/20 disabled:opacity-50"
                          >
                            <Mic className="h-3 w-3" /> Audio
                          </button>
                        )}
                        {hasAudio && !isGenerating && (
                          <button onClick={() => handleGenerateAudio(scene.id)} disabled={!selectedVoice} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-foreground-muted hover:bg-surface-tertiary">
                            <RotateCcw className="h-3 w-3" /> Regenerar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* ═══ FULL VIDEO TAB ═══ */}
            <TabsContent value="full_video" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Timeline visual */}
              <div className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Timeline del video</span>
                <div className="flex h-10 overflow-hidden rounded-lg">
                  {scenes.map((scene) => {
                    const widthPct = totalDuration > 0 ? ((scene.duration_seconds || 1) / totalDuration) * 100 : 0;
                    return (
                      <div
                        key={scene.id}
                        className="flex items-center justify-center border-r border-black/20 text-[8px] font-bold text-white"
                        style={{ width: `${widthPct}%`, backgroundColor: ARC_COLORS[scene.arc_phase] || '#6B7280' }}
                        title={`${scene.scene_number} - ${scene.title} (${scene.duration_seconds}s)`}
                      >
                        {widthPct > 3 ? scene.scene_number : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-foreground-muted">
                  <span>0s</span>
                  <span>{Math.round(totalDuration / 2)}s</span>
                  <span>{totalDuration}s</span>
                </div>
              </div>

              {/* Full narration text */}
              <div className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Guion completo de narracion</span>
                  <button
                    onClick={handleGenerateFullText}
                    disabled={generatingAll}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-scene-filler px-3 py-1.5 text-xs font-medium text-white transition hover:bg-scene-filler/90 disabled:opacity-50"
                  >
                    {generatingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Generar guion con IA
                  </button>
                </div>
                <textarea
                  value={fullText}
                  onChange={(e) => setFullText(e.target.value)}
                  onBlur={async () => {
                    if (project?.id) await supabase.from('projects').update({ narration_full_text: fullText }).eq('id', project.id);
                  }}
                  placeholder="El narrador dira este texto sobre todo el video. La IA lo generara analizando todas las escenas y creando un texto fluido y continuo..."
                  rows={12}
                  className="w-full rounded-lg border border-surface-tertiary bg-surface px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
                />
                {fullText && (
                  <div className="flex items-center gap-4 text-xs text-foreground-muted">
                    <span>{fullText.split(/\s+/).filter(Boolean).length} palabras</span>
                    <span>~{estimateDuration(fullText)}s estimados</span>
                    <span>Video: {totalDuration}s</span>
                    {estimateDuration(fullText) <= totalDuration
                      ? <span className="text-green-500">Cabe</span>
                      : <span className="text-amber-500">Excede {(estimateDuration(fullText) - totalDuration).toFixed(1)}s</span>
                    }
                  </div>
                )}
              </div>

              {/* Full audio */}
              <div className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Audio completo</span>
                  <button
                    onClick={handleGenerateFullAudio}
                    disabled={generatingAll || !selectedVoice || !fullText}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    {generatingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
                    Generar audio completo
                  </button>
                </div>
                {fullAudioUrl ? (
                  <NarrationPlayer src={fullAudioUrl} sceneLabel="Completo" />
                ) : (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-tertiary py-8 text-sm text-foreground-muted">
                    {fullText ? 'Pulsa "Generar audio completo" para crear el audio' : 'Primero genera el guion de narracion'}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
