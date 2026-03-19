'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  Sparkles,
  Mic,
  Play,
  Pause,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Volume2,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Scene } from '@/types/scene';
import { estimateTextDuration } from '@/lib/constants/scene-options';
import { speakText, isSpeechSynthesisAvailable } from '@/lib/tts/web-speech';
import { VoiceSelector } from '@/components/narration/VoiceSelector';
import { NarrationPlayer } from '@/components/narration/NarrationPlayer';
import { DEFAULT_VOICE_ES } from '@/lib/tts/elevenlabs';
import { NARRATION_STYLES, getStyleById, DEFAULT_STYLE } from '@/lib/constants/narration-styles';

interface NarrativeArc {
  id: string;
  phase: string;
  phase_number: number;
  title: string;
  description: string;
  start_second: number;
  end_second: number;
  scene_numbers: string[];
  color: string;
  sort_order: number;
}

const PHASE_COLORS: Record<string, string> = {
  hook: '#E24B4A',
  build: '#BA7517',
  peak: '#1D9E75',
  close: '#185FA5',
};

const PHASE_LABELS: Record<string, string> = {
  hook: 'Gancho',
  build: 'Desarrollo',
  peak: 'Climax',
  close: 'Cierre',
};

type NarrationMode = 'none' | 'per_scene' | 'continuous';

export default function ScriptNarrationPage() {
  const { project, loading: projectLoading } = useProject();
  const { video: activeVideo } = useVideo();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [arcs, setArcs] = useState<NarrativeArc[]>([]);
  const [allScenes, setAllScenes] = useState<Scene[]>([]);
  const [videoSceneIds, setVideoSceneIds] = useState<Set<string> | null>(null);
  const scenes = videoSceneIds !== null ? allScenes.filter((s) => videoSceneIds.has(s.id)) : allScenes;
  const [narrationMode, setNarrationMode] = useState<NarrationMode>('per_scene');
  const [continuousText, setContinuousText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ES);
  const [selectedStyle, setSelectedStyle] = useState(DEFAULT_STYLE);
  const [customInstructions, setCustomInstructions] = useState('');
  const [speed, setSpeed] = useState(1.0);

  const fetchData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);

    const [arcsRes, scenesRes] = await Promise.all([
      supabase.from('narrative_arcs').select('*').eq('project_id', project.id).order('sort_order'),
      supabase.from('scenes').select('*').eq('project_id', project.id).order('sort_order'),
    ]);

    setArcs(arcsRes.data ?? []);
    setAllScenes((scenesRes.data as Scene[]) ?? []);

    // Load narration mode from project
    const proj = project as unknown as Record<string, unknown>;
    setNarrationMode((proj.narration_mode as NarrationMode) || 'per_scene');
    setContinuousText((proj.narration_full_text as string) || '');

    setLoading(false);
  }, [project?.id, supabase]);

  useEffect(() => {
    if (!projectLoading && project?.id) fetchData();
  }, [fetchData, projectLoading, project?.id]);

  // Video filter
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

  const totalDuration = useMemo(() =>
    arcs.length > 0 ? Math.max(...arcs.map((a) => Number(a.end_second))) : 60,
  [arcs]);

  const totalSceneDuration = useMemo(() =>
    scenes.reduce((acc, s) => acc + (s.duration_seconds || 0), 0),
  [scenes]);

  const updateNarrationText = useCallback(async (sceneId: string, text: string) => {
    setAllScenes((prev) => prev.map((s) => s.id === sceneId ? { ...s, narration_text: text } : s));
    const { error } = await supabase.from('scenes').update({ narration_text: text }).eq('id', sceneId);
    if (error) toast.error('Error al guardar narracion');
  }, [supabase]);

  const handleGenerateAll = useCallback(async () => {
    if (!project?.id || scenes.length === 0) return;
    setGenerating(true);
    const toastId = toast.loading(
      narrationMode === 'continuous' ? 'Generando guion completo...' : 'Generando textos de narracion...'
    );

    try {
      const sceneData = scenes.map((s) => ({
        id: s.id,
        scene_number: s.scene_number,
        title: s.title,
        description: s.description || '',
        duration_seconds: s.duration_seconds || 5,
        arc_phase: s.arc_phase,
      }));

      const res = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: narrationMode === 'continuous' ? 'continuous' : 'per_scene',
          scenes: sceneData,
          config: {
            styleId: selectedStyle,
            customInstructions,
            language: 'es',
            perspective: 'tercera persona',
            projectName: (project as unknown as Record<string, string>).title || '',
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).error || `Error ${res.status}`);
      }

      const data = await res.json();

      if (data.mode === 'continuous') {
        // Save continuous text to project
        setContinuousText(data.text);
        await supabase.from('projects').update({ narration_full_text: data.text }).eq('id', project.id);
        toast.success('Guion completo generado', { id: toastId });
      } else {
        // Save per-scene texts
        let saved = 0;
        for (const result of data.results as Array<{ sceneId: string; text: string }>) {
          if (result.text) {
            await supabase.from('scenes').update({ narration_text: result.text }).eq('id', result.sceneId);
            saved++;
          }
        }
        await fetchData();
        toast.success(`Narracion generada para ${saved} escenas`, { id: toastId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error: ${msg}`, { id: toastId });
    } finally {
      setGenerating(false);
    }
  }, [project, scenes, supabase, fetchData, narrationMode, selectedStyle, customInstructions]);

  const [generatingVoiceId, setGeneratingVoiceId] = useState<string | null>(null);

  const handleGenerateVoice = useCallback(async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    const narrationText = (scene as unknown as Record<string, string>)?.narration_text;
    if (!narrationText) {
      toast.error('Primero escribe o genera el texto de narracion');
      return;
    }

    setGeneratingVoiceId(sceneId);
    const toastId = toast.loading(`Generando audio con ElevenLabs...`);

    try {
      const currentStyle = getStyleById(selectedStyle);
      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: narrationText,
          voice: selectedVoice,
          language: 'es',
          stability: currentStyle.elevenLabs.stability,
          similarityBoost: currentStyle.elevenLabs.similarityBoost,
          style: currentStyle.elevenLabs.style,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('audio')) {
        const audioBlob = await res.blob();
        toast.loading('Subiendo a storage...', { id: toastId });

        // Upload to Supabase Storage
        const filePath = `${project!.id}/narration/${sceneId}.mp3`;
        const { error: uploadErr } = await supabase.storage
          .from('project-assets')
          .upload(filePath, audioBlob, { contentType: 'audio/mpeg', upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(filePath);

        // Save URL to scene
        await supabase.from('scenes').update({ narration_audio_url: publicUrl }).eq('id', sceneId);
        await fetchData();
        toast.success('Audio generado y guardado', { id: toastId });
      } else {
        // API not available — try browser fallback
        const errData = await res.json().catch(() => ({}));
        if (isSpeechSynthesisAvailable()) {
          toast.info('TTS del servidor no disponible. Reproduciendo con voz del navegador...', { id: toastId });
          await speakText(narrationText, { lang: 'es-ES' });
        } else {
          toast.error((errData as Record<string, string>).tip || 'TTS no disponible', { id: toastId });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error: ${msg}`, { id: toastId });
    } finally {
      setGeneratingVoiceId(null);
    }
  }, [scenes, project, supabase, fetchData, selectedVoice]);

  const handleDeleteAudio = useCallback(async (sceneId: string) => {
    try {
      const filePath = `${project!.id}/narration/${sceneId}.mp3`;
      await supabase.storage.from('project-assets').remove([filePath]);
      await supabase.from('scenes').update({ narration_audio_url: null }).eq('id', sceneId);
      await fetchData();
      toast.success('Audio eliminado');
    } catch {
      toast.error('Error al eliminar audio');
    }
  }, [project, supabase, fetchData]);

  const handleGenerateAllVoices = useCallback(async () => {
    if (!project?.id) return;
    const scenesWithText = scenes.filter((s) => (s as unknown as Record<string, string>).narration_text);
    if (scenesWithText.length === 0) {
      toast.error('No hay escenas con texto de narracion. Genera los textos primero.');
      return;
    }

    setGenerating(true);
    let done = 0;
    for (const scene of scenesWithText) {
      const narrationText = (scene as unknown as Record<string, string>).narration_text;
      if (!narrationText) continue;

      toast.info(`Generando audio ${++done}/${scenesWithText.length}...`);
      try {
        const bulkStyle = getStyleById(selectedStyle);
        const res = await fetch('/api/ai/generate-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: narrationText,
            voice: selectedVoice,
            language: 'es',
            stability: bulkStyle.elevenLabs.stability,
            similarityBoost: bulkStyle.elevenLabs.similarityBoost,
            style: bulkStyle.elevenLabs.style,
          }),
        });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('audio')) continue;

        const blob = await res.blob();
        const filePath = `${project.id}/narration/${scene.id}.mp3`;
        await supabase.storage.from('project-assets').upload(filePath, blob, { contentType: 'audio/mpeg', upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(filePath);
        await supabase.from('scenes').update({ narration_audio_url: publicUrl }).eq('id', scene.id);
      } catch { /* continue with next */ }
    }
    await fetchData();
    setGenerating(false);
    toast.success(`Audio generado para ${done} escenas`);
  }, [project, scenes, supabase, fetchData, selectedVoice]);

  const formatTime = (seconds: number) => `${Math.round(seconds)}s`;

  if (loading || projectLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-surface-secondary" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Guion y Narracion</h2>
          <p className="text-sm text-foreground-muted">
            Arco narrativo + texto de voz en off + generacion de audio
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generando...' : 'Generar narracion con IA'}
          </button>
        </div>
      </div>

      {/* Arc Time Bar */}
      <div className="rounded-xl bg-surface-secondary p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Arco Narrativo</span>
          <span className="text-xs text-foreground-muted">
            <Clock className="mr-1 inline h-3 w-3" />
            {totalSceneDuration}s total
          </span>
        </div>
        <div className="flex h-10 overflow-hidden rounded-lg">
          {arcs.length > 0 ? (
            arcs.map((arc) => {
              const duration = Number(arc.end_second) - Number(arc.start_second);
              const widthPercent = (duration / totalDuration) * 100;
              return (
                <div
                  key={arc.id}
                  className="flex items-center justify-center transition-opacity hover:opacity-90"
                  style={{ width: `${widthPercent}%`, backgroundColor: PHASE_COLORS[arc.phase] || '#6B7280' }}
                >
                  <span className="text-[10px] font-semibold text-white">{arc.title}</span>
                </div>
              );
            })
          ) : (
            (['hook', 'build', 'peak', 'close'] as const).map((phase) => (
              <div key={phase} className="flex flex-1 items-center justify-center" style={{ backgroundColor: PHASE_COLORS[phase] }}>
                <span className="text-[10px] font-semibold text-white">{PHASE_LABELS[phase]}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Narration Mode Tabs */}
      <Tabs value={narrationMode} onValueChange={(v) => setNarrationMode(v as NarrationMode)}>
        <TabsList>
          <TabsTrigger value="per_scene" className="gap-1.5">
            <FileText className="h-4 w-4" /> Por escena
          </TabsTrigger>
          <TabsTrigger value="continuous" className="gap-1.5">
            <Volume2 className="h-4 w-4" /> Continua
          </TabsTrigger>
          <TabsTrigger value="none" className="gap-1.5">
            Sin narracion
          </TabsTrigger>
        </TabsList>

        {/* Per-scene narration */}
        <TabsContent value="per_scene" className="mt-4 space-y-4">
          {/* Config: Voice + Style + Speed */}
          <div className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4 space-y-4">
            {/* Voice */}
            <VoiceSelector value={selectedVoice} onChange={setSelectedVoice} language="es" />

            {/* Narration Style */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Estilo de narracion</span>
              <div className="grid grid-cols-3 gap-1.5">
                {NARRATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      'rounded-lg border px-2.5 py-2 text-left transition',
                      selectedStyle === style.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-surface-tertiary hover:border-foreground/20',
                    )}
                  >
                    <span className="block text-xs font-medium text-foreground">{style.label}</span>
                    <span className="block text-[10px] text-foreground-muted">{style.description}</span>
                  </button>
                ))}
              </div>
              {selectedStyle === 'custom' && (
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Describe como quieres que suene la narracion..."
                  rows={2}
                  className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
                />
              )}
            </div>

            {/* Speed */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Velocidad</span>
                <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-bold text-foreground">{speed}x</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.3}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                aria-label="Velocidad de narracion"
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-[9px] text-foreground-muted">
                <span>0.7x</span>
                <span>1.0x</span>
                <span>1.3x</span>
              </div>
            </div>
          </div>

          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-16">
              <FileText className="mb-3 h-10 w-10 text-foreground-muted/30" />
              <h3 className="text-lg font-semibold text-foreground">No hay escenas</h3>
              <p className="text-sm text-foreground-muted">Crea escenas en el Storyboard para añadir narracion</p>
            </div>
          ) : (
            scenes.map((scene) => {
              const narration = (scene as unknown as Record<string, string>).narration_text || '';
              const audioUrl = (scene as unknown as Record<string, string>).narration_audio_url || '';
              const estimate = narration ? estimateTextDuration(narration) : null;
              const fits = estimate ? estimate.fitsInSeconds(scene.duration_seconds) : true;
              const arcPhaseColor = PHASE_COLORS[scene.arc_phase] || '#6B7280';
              const isGeneratingThis = generatingVoiceId === scene.id;

              return (
                <div key={scene.id} className="rounded-xl border border-surface-tertiary bg-surface-secondary overflow-hidden">
                  {/* Scene header */}
                  <div className="flex items-center gap-3 border-b border-surface-tertiary/50 px-4 py-2.5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: arcPhaseColor }}
                    >
                      {scene.scene_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{scene.title}</span>
                    <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] tabular-nums text-foreground-muted">
                      {scene.duration_seconds}s
                    </span>
                    {audioUrl && <Volume2 className="h-3.5 w-3.5 text-green-500" />}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Narration text */}
                    <textarea
                      value={narration}
                      onChange={(e) => updateNarrationText(scene.id, e.target.value)}
                      placeholder="Escribe el texto de narracion para esta escena..."
                      rows={2}
                      aria-label={`Narracion de escena ${scene.scene_number}`}
                      className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />

                    {/* Duration estimate */}
                    {estimate && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-foreground-muted">
                          <Clock className="h-3 w-3" />
                          ~{estimate.durationSeconds}s ({estimate.wordCount} pal.)
                        </span>
                        {fits ? (
                          <span className="inline-flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-3 w-3" /> Cabe en {scene.duration_seconds}s
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <AlertTriangle className="h-3 w-3" /> Excede {(estimate.durationSeconds - scene.duration_seconds).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    )}

                    {/* Audio player (if generated) */}
                    {audioUrl && (
                      <NarrationPlayer
                        src={audioUrl}
                        sceneLabel={scene.scene_number}
                        onDelete={() => handleDeleteAudio(scene.id)}
                      />
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateVoice(scene.id)}
                        disabled={isGeneratingThis || !narration}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-500 transition hover:bg-brand-500/20 disabled:opacity-50"
                        aria-label="Generar audio"
                      >
                        {isGeneratingThis ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Generando...</>
                        ) : (
                          <><Mic className="h-3 w-3" /> {audioUrl ? 'Regenerar audio' : 'Generar audio'}</>
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          const tid = toast.loading('Generando texto...');
                          try {
                            const res = await fetch('/api/ai/generate-narration', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                mode: 'per_scene',
                                scenes: [{
                                  id: scene.id, scene_number: scene.scene_number,
                                  title: scene.title, description: scene.description || '',
                                  duration_seconds: scene.duration_seconds || 5, arc_phase: scene.arc_phase,
                                }],
                                config: { styleId: selectedStyle, customInstructions, language: 'es' },
                              }),
                            });
                            if (!res.ok) throw new Error('API error');
                            const data = await res.json();
                            const result = (data.results as Array<{ sceneId: string; text: string }>)?.[0];
                            if (result?.text) { updateNarrationText(scene.id, result.text); toast.success('Texto generado', { id: tid }); }
                            else toast.info('Escena sin narracion (silenciosa)', { id: tid });
                          } catch { toast.error('Error al generar texto', { id: tid }); }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-medium text-[#8B5CF6] transition hover:bg-[#8B5CF6]/20"
                      >
                        <Sparkles className="h-3 w-3" /> Generar texto IA
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Bulk actions */}
          {scenes.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-surface-tertiary bg-surface-secondary p-4">
              <span className="text-xs text-foreground-muted">
                {scenes.filter((s) => (s as unknown as Record<string, string>).narration_audio_url).length}/{scenes.length} escenas con audio
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAll}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6]/10 px-3 py-2 text-xs font-medium text-[#8B5CF6] transition hover:bg-[#8B5CF6]/20 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {generating ? 'Generando textos...' : 'Generar todos los textos'}
                </button>
                <button
                  onClick={handleGenerateAllVoices}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {generating ? 'Generando audios...' : 'Generar todos los audios'}
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Continuous narration */}
        <TabsContent value="continuous" className="mt-4">
          <div className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Guion completo</span>
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-500 transition hover:bg-brand-500/10"
              >
                <Sparkles className="h-3 w-3" /> Generar con IA
              </button>
            </div>
            <textarea
              value={continuousText}
              onChange={(e) => setContinuousText(e.target.value)}
              placeholder="Escribe el guion completo de narracion que se leera sobre todo el video..."
              rows={12}
              aria-label="Guion de narracion continua"
              className="w-full rounded-lg border border-surface-tertiary bg-surface px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {continuousText && (
              <div className="mt-3 flex items-center gap-4 text-xs text-foreground-muted">
                {(() => {
                  const est = estimateTextDuration(continuousText);
                  return (
                    <>
                      <span>{est.wordCount} palabras</span>
                      <span>~{est.durationSeconds}s estimados</span>
                      <span>Objetivo: {totalSceneDuration}s</span>
                      {est.fitsInSeconds(totalSceneDuration) ? (
                        <span className="inline-flex items-center gap-1 text-green-500">
                          <CheckCircle2 className="h-3 w-3" /> Cabe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <AlertTriangle className="h-3 w-3" /> Excede por {(est.durationSeconds - totalSceneDuration).toFixed(1)}s
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              onClick={() => toast.info('Proximamente: generar audio completo')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-tertiary px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-secondary"
            >
              <Mic className="h-4 w-4" /> Generar audio completo
            </button>
            <button
              onClick={() => toast.info('Proximamente: descargar MP3')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-tertiary px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-secondary"
            >
              <Download className="h-4 w-4" /> Descargar MP3
            </button>
          </div>
        </TabsContent>

        {/* No narration */}
        <TabsContent value="none" className="mt-4">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-16">
            <Volume2 className="mb-3 h-10 w-10 text-foreground-muted/30" />
            <h3 className="text-lg font-semibold text-foreground">Sin narracion</h3>
            <p className="max-w-sm text-center text-sm text-foreground-muted">
              Este proyecto no usa narracion. Las escenas se reproduciran con su audio original (ambiente, musica, dialogos).
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
