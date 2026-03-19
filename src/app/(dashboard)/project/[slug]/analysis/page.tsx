'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';

interface ProjectIssue {
  id: string;
  issue_type: 'strength' | 'warning' | 'suggestion';
  title: string;
  description: string;
  category: string;
  resolved: boolean;
  sort_order: number;
}

interface ProjectMetrics {
  total_scenes: number;
  total_characters: number;
  total_backgrounds: number;
  estimated_duration_seconds: number;
}

export default function AnalysisPage() {
  const { project: projectCtx, loading: projectLoading } = useProject();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);

  const fetchData = useCallback(async () => {
    if (!projectCtx?.id) return;
    setLoading(true);

    const proj = projectCtx as unknown as Record<string, number>;
    setMetrics({
      total_scenes: proj.total_scenes ?? 0,
      total_characters: proj.total_characters ?? 0,
      total_backgrounds: proj.total_backgrounds ?? 0,
      estimated_duration_seconds: proj.estimated_duration_seconds ?? 0,
    });

    // Fetch issues
    const { data: issuesData } = await supabase
      .from('project_issues')
      .select('*')
      .eq('project_id', projectCtx.id)
      .order('sort_order', { ascending: true });

    setIssues(issuesData ?? []);
    setLoading(false);
  }, [projectCtx?.id, supabase]);

  useEffect(() => {
    if (!projectLoading && projectCtx?.id) fetchData();
  }, [fetchData, projectLoading, projectCtx?.id]);

  const handleResolve = async (issueId: string) => {
    const { error } = await supabase
      .from('project_issues')
      .update({ resolved: true })
      .eq('id', issueId);

    if (!error) {
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, resolved: true } : issue
        )
      );
    }
  };

  const handleRegenerate = () => {
    // Toast placeholder
    alert('Proximamente');
  };

  const strengths = issues.filter((i) => i.issue_type === 'strength');
  const warnings = issues.filter((i) => i.issue_type === 'warning');
  const suggestions = issues.filter((i) => i.issue_type === 'suggestion');

  const METRICS_CARDS = [
    { label: 'Escenas', value: metrics?.total_scenes ?? 0, icon: '🎬' },
    {
      label: 'Duracion',
      value: metrics?.estimated_duration_seconds
        ? `~${Math.round(metrics.estimated_duration_seconds)}s`
        : '—',
      icon: '⏱',
    },
    { label: 'Fondos', value: metrics?.total_backgrounds ?? 0, icon: '🖼' },
    { label: 'Personajes', value: metrics?.total_characters ?? 0, icon: '👤' },
  ];

  const SECTIONS = [
    {
      title: 'Fortalezas',
      type: 'strength' as const,
      items: strengths,
      color: 'bg-green-500/10 text-green-600',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-500',
      icon: '✓',
    },
    {
      title: 'Advertencias',
      type: 'warning' as const,
      items: warnings,
      color: 'bg-yellow-500/10 text-yellow-600',
      borderColor: 'border-yellow-500/20',
      iconColor: 'text-yellow-500',
      icon: '⚠',
    },
    {
      title: 'Sugerencias',
      type: 'suggestion' as const,
      items: suggestions,
      color: 'bg-blue-500/10 text-blue-600',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-500',
      icon: '+',
    },
  ];

  if (loading || projectLoading) {
    return (

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-surface-secondary" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-secondary" />
          </div>
          <div className="h-10 w-48 animate-pulse rounded-lg bg-surface-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Diagnostico</h2>
          <p className="text-sm text-foreground-muted">
            Analisis completo del guion y storyboard
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Regenerar analisis con IA
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {METRICS_CARDS.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl bg-surface-secondary p-4"
          >
            <div className="mb-2 text-2xl">{metric.icon}</div>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <p className="text-sm font-medium text-foreground-secondary">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      {/* Issues sections */}
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className={`rounded-xl border ${section.borderColor} bg-surface-secondary p-4`}
          >
            <h3
              className={`mb-3 inline-block rounded-md px-2 py-1 text-sm font-semibold ${section.color}`}
            >
              {section.title}
            </h3>
            {section.items.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                Ejecuta el analisis con IA para ver resultados aqui.
              </p>
            ) : (
              <ul className="space-y-3">
                {section.items.map((issue) => (
                  <li
                    key={issue.id}
                    className={`flex items-start gap-3 rounded-lg border border-surface-tertiary p-3 ${
                      issue.resolved ? 'opacity-50' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        section.type === 'strength'
                          ? 'bg-green-500/20 text-green-600'
                          : section.type === 'warning'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-blue-500/20 text-blue-600'
                      }`}
                    >
                      {section.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {issue.title}
                        </p>
                        {issue.category && (
                          <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-foreground-muted">
                            {issue.category}
                          </span>
                        )}
                        {issue.resolved && (
                          <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                            Resuelto
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {issue.description}
                      </p>
                    </div>
                    {(section.type === 'warning' || section.type === 'suggestion') &&
                      !issue.resolved && (
                        <button
                          onClick={() => handleResolve(issue.id)}
                          className="shrink-0 rounded-lg border border-surface-tertiary px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:bg-surface-tertiary"
                        >
                          Marcar como resuelto
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
