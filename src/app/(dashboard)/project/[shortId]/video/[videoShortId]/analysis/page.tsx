'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideoAnalysis } from '@/lib/queries/videos';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import {
  RefreshCw, Loader2, BarChart3, TrendingUp, AlertTriangle,
  Lightbulb, Sparkles, CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface AnalysisStrength {
  title: string;
  detail: string;
  affected_scenes?: number[] | null;
}

interface AnalysisWeakness extends AnalysisStrength {
  severity?: string;
}

interface AnalysisSuggestion extends AnalysisStrength {
  type?: string;
  priority?: string;
  auto_applicable?: boolean;
}

export default function VideoAnalysisPage() {
  const { project } = useProject();
  const { video } = useVideo();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const {
    data: analysis,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.videos.analysis(video?.id ?? ''),
    queryFn: () => fetchVideoAnalysis(supabase, video!.id),
    enabled: !!video?.id,
  });

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id, videoId: video?.id }),
      });
      if (!res.ok) throw new Error('Error al analizar');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Analisis completado');
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.analysis(video?.id ?? '') });
    },
    onError: () => toast.error('Error al analizar el video'),
  });

  // Apply suggestion mutation
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestion: AnalysisSuggestion) => {
      const res = await fetch('/api/ai/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project?.id,
          videoId: video?.id,
          suggestion,
        }),
      });
      if (!res.ok) throw new Error('Error al aplicar sugerencia');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Sugerencia aplicada');
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.analysis(video?.id ?? '') });
    },
    onError: () => toast.error('Error al aplicar sugerencia'),
  });

  // Parse JSON fields
  const strengths = (analysis?.strengths as unknown as AnalysisStrength[]) ?? [];
  const weaknesses = (analysis?.weaknesses as unknown as AnalysisWeakness[]) ?? [];
  const suggestions = (analysis?.suggestions as unknown as AnalysisSuggestion[]) ?? [];

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando analisis...</p>
      </div>
    );
  }

  // --- Empty state ---
  if (!analysis) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-6 py-24">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
            <BarChart3 className="size-10 text-primary" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Analiza tu video con IA
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              La IA revisara todas las escenas y dara una puntuacion de calidad con sugerencias de mejora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analizar video
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // --- Analysis view ---
  const updatedAt = analysis.updated_at
    ? formatDistanceToNow(new Date(analysis.updated_at), { addSuffix: true, locale: es })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analisis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {updatedAt && <>Ultima version: {updatedAt}</>}
            {analysis.analysis_model && (
              <>
                {updatedAt && <span className="mx-2">|</span>}
                Modelo: {analysis.analysis_model}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition disabled:opacity-50 flex items-center gap-2"
        >
          {analyzeMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Re-analizar
        </button>
      </div>

      {/* Score + Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreGauge score={analysis.overall_score ?? 0} size={140} className="shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-medium text-foreground">Resumen</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {analysis.summary ?? 'No hay resumen disponible.'}
            </p>
            {/* Quick stats */}
            <div className="mt-4 flex flex-wrap gap-3">
              {strengths.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <TrendingUp className="size-3" />
                  {strengths.length} fortaleza{strengths.length !== 1 ? 's' : ''}
                </span>
              )}
              {weaknesses.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  <AlertTriangle className="size-3" />
                  {weaknesses.length} debilidad{weaknesses.length !== 1 ? 'es' : ''}
                </span>
              )}
              {suggestions.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                  <Lightbulb className="size-3" />
                  {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-emerald-400" />
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fortalezas ({strengths.length})
            </h3>
          </div>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
              >
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.detail}</p>
                {s.affected_scenes && s.affected_scenes.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {s.affected_scenes?.map((n) => (
                      <span key={n} className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        E{n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-amber-400" />
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Debilidades ({weaknesses.length})
            </h3>
          </div>
          <div className="space-y-2">
            {weaknesses.map((w, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{w.title}</p>
                  {w.severity && (
                    <span className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase',
                      w.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                      w.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-zinc-500/10 text-zinc-400',
                    )}>
                      {w.severity}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{w.detail}</p>
                {w.affected_scenes && w.affected_scenes.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {w.affected_scenes?.map((n) => (
                      <span key={n} className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        E{n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="size-4 text-blue-400" />
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sugerencias ({suggestions.length})
            </h3>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      {s.priority && (
                        <span className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase',
                          s.priority === 'high' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-blue-500/10 text-blue-400',
                        )}>
                          {s.priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.detail}</p>
                    {s.affected_scenes && s.affected_scenes.length > 0 && (
                      <div className="mt-2 flex gap-1.5">
                        {s.affected_scenes?.map((n) => (
                          <span key={n} className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                            E{n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {s.auto_applicable && (
                    <button
                      type="button"
                      onClick={() => applySuggestionMutation.mutate(s)}
                      disabled={applySuggestionMutation.isPending}
                      className="shrink-0 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {applySuggestionMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      Aplicar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
