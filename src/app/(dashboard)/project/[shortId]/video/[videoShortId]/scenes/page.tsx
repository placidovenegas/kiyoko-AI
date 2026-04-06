'use client';

import { useState, useMemo } from 'react';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import { SceneCard } from '@/components/video/SceneCard';
import { SceneCreateModal } from '@/components/modals';
import { cn } from '@/lib/utils/cn';
import { Plus, Film, Clock, Sparkles, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ScenesPage() {
  const { video, scenes, loading: videoLoading } = useVideo();
  const { project } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const basePath = `/project/${project?.short_id}/video/${video?.short_id}`;

  const sortedScenes = useMemo(
    () => [...(scenes ?? [])].sort((a, b) => (a.scene_number ?? 0) - (b.scene_number ?? 0)),
    [scenes],
  );

  const totalDuration = sortedScenes.reduce((s, sc) => s + (sc.duration_seconds ?? 0), 0);
  const nextSceneNumber = sortedScenes.length > 0
    ? Math.max(...sortedScenes.map((s) => s.scene_number ?? 0)) + 1
    : 1;

  /* Loading skeleton */
  if (videoLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Escenas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sortedScenes.length} escenas
            <span className="mx-1.5 text-muted-foreground/40">&middot;</span>
            <Clock className="inline h-3.5 w-3.5 -mt-0.5" /> {totalDuration}s total
            {video?.target_duration_seconds ? ` / ${video.target_duration_seconds}s objetivo` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva escena
        </button>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {sortedScenes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <Film className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin escenas</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-xs text-center">
            Crea tu primera escena o deja que la IA planifique el video completo
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva escena
            </button>
            <button
              type="button"
              onClick={() => { /* TODO: AI generate */ }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Auto-planificar
            </button>
          </div>
        </div>
      )}

      {/* ── Scene grid ──────────────────────────────────────── */}
      {sortedScenes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedScenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} basePath={basePath} />
          ))}
        </div>
      )}

      {/* ── Create modal ────────────────────────────────────── */}
      {video && project && (
        <SceneCreateModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          videoId={video.id}
          projectId={project.id}
          nextSceneNumber={nextSceneNumber}
        />
      )}
    </div>
  );
}
