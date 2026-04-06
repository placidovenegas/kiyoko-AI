'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideoAnalysis } from '@/lib/queries/videos';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { Button } from '@heroui/react';
import { RefreshCw, Loader2, BarChart3, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { toast } from 'sonner';

interface AnalysisStrength {
  title: string;
  detail: string;
  affected_scenes: number[];
}

interface AnalysisWeakness extends AnalysisStrength {
  severity: string;
}

interface AnalysisSuggestion extends AnalysisStrength {
  type: string;
  priority: string;
  auto_applicable: boolean;
}

export default function VideoAnalysisPage() {
  const { video } = useVideo();
  const supabase = createClient();

  const {
    data: analysis,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.videos.analysis(video?.id ?? ''),
    queryFn: () => fetchVideoAnalysis(supabase, video!.id),
    enabled: !!video?.id,
  });

  // Parse JSON fields
  const strengths = (analysis?.strengths as unknown as AnalysisStrength[]) ?? [];
  const weaknesses = (analysis?.weaknesses as unknown as AnalysisWeakness[]) ?? [];
  const suggestions = (analysis?.suggestions as unknown as AnalysisSuggestion[]) ?? [];

  const handleReAnalyze = () => {
    toast.info('Re-analizando video...');
    // TODO: call /api/ai/analyze-video
  };

  const handleApplySuggestion = (index: number) => {
    toast.info(`Aplicando sugerencia ${index + 1}...`);
    // TODO: call /api/ai/apply-suggestion
  };

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
      <div className="flex flex-col items-center justify-center gap-6 py-24 px-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
          <BarChart3 className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Sin analisis disponible</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Ejecuta un analisis con IA para obtener puntuacion, fortalezas, debilidades y sugerencias de mejora.
          </p>
        </div>
        <Button
          variant="solid"
          color="primary"
          size="lg"
          onClick={handleReAnalyze}
          className="rounded-xl"
        >
          <BarChart3 className="size-4 mr-2" />Analizar video
        </Button>
      </div>
    );
  }

  // --- Analysis view ---
  const updatedAt = analysis.updated_at
    ? formatDistanceToNow(new Date(analysis.updated_at), { addSuffix: true, locale: es })
    : null;

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
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
          <Button
            variant="bordered"
            size="md"
            isLoading={isFetching}
            onClick={() => {
              handleReAnalyze();
              void refetch();
            }}
            className="rounded-xl"
          >
            <RefreshCw className="size-3.5 mr-2" />Re-analizar
          </Button>
        </div>

        {/* Score + Summary */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ScoreGauge score={analysis.overall_score ?? 0} size={140} className="shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Resumen</h2>
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
                <AnalysisCard
                  key={i}
                  type="strength"
                  title={s.title}
                  detail={s.detail}
                  affectedScenes={s.affected_scenes}
                />
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
                <AnalysisCard
                  key={i}
                  type="weakness"
                  title={w.title}
                  detail={w.detail}
                  affectedScenes={w.affected_scenes}
                  severity={w.severity}
                />
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
                <AnalysisCard
                  key={i}
                  type="suggestion"
                  title={s.title}
                  detail={s.detail}
                  affectedScenes={s.affected_scenes}
                  suggestionType={s.type}
                  priority={s.priority}
                  autoApplicable={s.auto_applicable}
                  onApply={() => handleApplySuggestion(i)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
