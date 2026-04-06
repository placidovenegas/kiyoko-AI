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
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Volume2,
} from 'lucide-react';
import { Tabs } from '@heroui/react';
import type { Scene, NarrativeArc } from '@/types';
import { estimateTextDuration } from '@/lib/constants/scene-options';
import { VoiceSelector } from '@/components/narration/VoiceSelector';
import { DEFAULT_VOICE_ES } from '@/lib/tts/elevenlabs';
import { NARRATION_STYLES, DEFAULT_STYLE } from '@/lib/constants/narration-styles';

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

    // Load narration mode from project metadata
    const meta = (project as unknown as Record<string, unknown>);
    setNarrationMode((meta.narration_mode as NarrationMode) || 'per_scene');
    setContinuousText((meta.narration_full_text as string) || '');

    setLoading(false);
  }, [project?.id, supabase]);

  useEffect(() => {
    if (!projectLoading && project?.id) fetchData();
  }, [fetchData, projectLoading, project?.id]);

  // Video filter
  useEffect(() => {
    if (!activeVideo) { setVideoSceneIds(null); return; }
    supabase
      .from('scenes')
      .select('id')
      .eq('video_id', activeVideo.id)
      .then(({ data }) => {
        setVideoSceneIds(data ? new Set(data.map((r) => r.id)) : new Set());
      });
  }, [activeVideo?.id, supabase]);

  const totalDuration = useMemo(() =>
    arcs.length > 0 ? Math.max(...arcs.map((a) => Number(a.end_second))) : 60,
  [arcs]);

  const totalSceneDuration = useMemo(() =>
    scenes.reduce((acc, s) => acc + (s.duration_seconds || 0), 0),
  [scenes]);

  // NOTE: Narration text is now stored per-video in `video_narrations`, not per-scene.
  // Per-scene narration editing is disabled until migrated to the new model.
  const updateNarrationText = useCallback(async (_sceneId: string, _text: string) => {
    toast.info('La narracion ahora se gestiona por video, no por escena.');
  }, []);

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
            projectName: project?.title || '',
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
        await supabase.from('projects').update({ narration_full_text: data.text } as never).eq('id', project.id);
        toast.success('Guion completo generado', { id: toastId });
      } else {
        // Save per-scene texts
        let saved = 0;
        for (const result of data.results as Array<{ sceneId: string; text: string }>) {
          if (result.text) {
            await supabase.from('scenes').update({ narration_text: result.text } as never).eq('id', result.sceneId);
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

  // NOTE: Per-scene voice generation is disabled. Narration audio is now per-video
  // via `video_narrations`. The UI below shows text for reference but audio generation
  // should be done from the video-level narration panel.
  const generatingVoiceId: string | null = null;

  const formatTime = (seconds: number) => `${Math.round(seconds)}s`;

  if (loading || projectLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-16 animate-pulse rounded-xl bg-card" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
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
          <p className="text-sm text-muted-foreground">
            Arco narrativo + texto de voz en off + generacion de audio
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generando...' : 'Generar narracion con IA'}
          </button>
        </div>
      </div>

      {/* Arc Time Bar */}
      <div className="rounded-xl bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arco Narrativo</span>
          <span className="text-xs text-muted-foreground">
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
      <Tabs selectedKey={narrationMode} onSelectionChange={(key) => setNarrationMode(String(key) as NarrationMode)}>
        <Tabs.List>
          <Tabs.Tab id="per_scene" className="gap-1.5">
            <FileText className="h-4 w-4" /> Por escena
          </Tabs.Tab>
          <Tabs.Tab id="continuous" className="gap-1.5">
            <Volume2 className="h-4 w-4" /> Continua
          </Tabs.Tab>
          <Tabs.Tab id="none" className="gap-1.5">
            Sin narracion
          </Tabs.Tab>
        </Tabs.List>

        {/* Per-scene narration */}
        <Tabs.Panel id="per_scene" className="mt-4 space-y-4">
          {/* Config: Voice + Style + Speed */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            {/* Voice */}
            <VoiceSelector value={selectedVoice} onChange={setSelectedVoice} language="es" />

            {/* Narration Style */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estilo de narracion</span>
              <div className="grid grid-cols-3 gap-1.5">
                {NARRATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      'rounded-lg border px-2.5 py-2 text-left transition',
                      selectedStyle === style.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-foreground/20',
                    )}
                  >
                    <span className="block text-xs font-medium text-foreground">{style.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{style.description}</span>
                  </button>
                ))}
              </div>
              {selectedStyle === 'custom' && (
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Describe como quieres que suene la narracion..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              )}
            </div>

            {/* Speed */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Velocidad</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-foreground">{speed}x</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.3}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                aria-label="Velocidad de narracion"
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>0.7x</span>
                <span>1.0x</span>
                <span>1.3x</span>
              </div>
            </div>
          </div>

          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground">No hay escenas</h3>
              <p className="text-sm text-muted-foreground">Crea escenas en el Storyboard para añadir narracion</p>
            </div>
          ) : (
            scenes.map((scene) => {
              const arcPhaseColor = PHASE_COLORS[scene.arc_phase ?? 'build'] || '#6B7280';

              return (
                <div key={scene.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Scene header */}
                  <div className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: arcPhaseColor }}
                    >
                      {scene.scene_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{scene.title}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {scene.duration_seconds}s
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {scene.description ? scene.description.slice(0, 200) : 'Sin descripcion'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      La narracion se gestiona a nivel de video (ver pestana Continua).
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Info banner */}
          {scenes.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground">
                {scenes.length} escenas en este video. La narracion y el audio se gestionan a nivel de video.
              </span>
            </div>
          )}
        </Tabs.Panel>

        {/* Continuous narration */}
        <Tabs.Panel id="continuous" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guion completo</span>
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary transition hover:bg-primary/10"
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
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {continuousText && (
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-card"
            >
              <Mic className="h-4 w-4" /> Generar audio completo
            </button>
            <button
              onClick={() => toast.info('Proximamente: descargar MP3')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-card"
            >
              <Download className="h-4 w-4" /> Descargar MP3
            </button>
          </div>
        </Tabs.Panel>

        {/* No narration */}
        <Tabs.Panel id="none" className="mt-4">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
            <Volume2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground">Sin narracion</h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Este proyecto no usa narracion. Las escenas se reproduciran con su audio original (ambiente, musica, dialogos).
            </p>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
