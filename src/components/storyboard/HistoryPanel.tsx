'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Undo2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { undoBatch } from '@/lib/ai/action-executor';
import type { ChangeHistoryEntry } from '@/types/ai-actions';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HistoryBatch {
  batchId: string;
  entries: ChangeHistoryEntry[];
  timestamp: string;
  description: string;
  changeCount: number;
}

interface HistoryPanelProps {
  projectId: string;
  onRefresh: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Action icon helper                                                 */
/* ------------------------------------------------------------------ */

function getActionIcon(action: string) {
  switch (action) {
    case 'delete_scene': return <Trash2 size={12} className="text-red-400" />;
    case 'update_scene':
    case 'update_prompt':
    case 'update_character': return <Pencil size={12} className="text-amber-400" />;
    case 'create_scene': return <Plus size={12} className="text-emerald-400" />;
    case 'reorder_scenes': return <ArrowUpDown size={12} className="text-blue-400" />;
    default: return <Pencil size={12} className="text-foreground/40" />;
  }
}

/* ------------------------------------------------------------------ */
/*  HistoryPanel                                                       */
/* ------------------------------------------------------------------ */

export function HistoryPanel({ projectId, onRefresh, open, onOpenChange }: HistoryPanelProps) {
  const [batches, setBatches] = useState<HistoryBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [undoingBatch, setUndoingBatch] = useState<string | null>(null);
  const [confirmUndo, setConfirmUndo] = useState<string | null>(null);

  /* ---- Fetch history ---- */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('change_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Group by batch_id
      const batchMap = new Map<string, ChangeHistoryEntry[]>();
      const noBatchEntries: ChangeHistoryEntry[] = [];

      for (const entry of (data || []) as ChangeHistoryEntry[]) {
        if (entry.batch_id) {
          const existing = batchMap.get(entry.batch_id) || [];
          existing.push(entry);
          batchMap.set(entry.batch_id, existing);
        } else {
          noBatchEntries.push(entry);
        }
      }

      const grouped: HistoryBatch[] = [];

      for (const [batchId, entries] of batchMap.entries()) {
        const sorted = entries.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        grouped.push({
          batchId,
          entries: sorted,
          timestamp: sorted[0].created_at,
          description: sorted[0].description_es || `${sorted.length} cambios`,
          changeCount: sorted.length,
        });
      }

      // Add unbatched entries as individual "batches"
      for (const entry of noBatchEntries) {
        grouped.push({
          batchId: entry.id,
          entries: [entry],
          timestamp: entry.created_at,
          description: entry.description_es || entry.action,
          changeCount: 1,
        });
      }

      // Sort by timestamp descending
      grouped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setBatches(grouped);
    } catch (err) {
      toast.error('Error al cargar historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  /* ---- Undo batch ---- */
  const handleUndo = useCallback(async (batchId: string) => {
    setUndoingBatch(batchId);
    try {
      const { success, restoredCount } = await undoBatch(batchId);
      if (success) {
        toast.success(`${restoredCount} cambio${restoredCount !== 1 ? 's' : ''} deshecho${restoredCount !== 1 ? 's' : ''}`);
        onRefresh();
        fetchHistory();
      } else {
        toast.error('No se pudieron deshacer los cambios');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al deshacer');
    } finally {
      setUndoingBatch(null);
      setConfirmUndo(null);
    }
  }, [onRefresh, fetchHistory]);

  /* ---- Format timestamp ---- */
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin}m`;
    if (diffHr < 24) return `Hace ${diffHr}h`;
    if (diffDay < 7) return `Hace ${diffDay}d`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-lg max-h-[80vh] bg-background border border-foreground/6 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-xl bg-primary/10">
              <History size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Historial de cambios</h2>
              <p className="text-xs text-foreground/40">{batches.length} grupo{batches.length !== 1 ? 's' : ''} de cambios</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center size-8 rounded-lg text-foreground/40 hover:text-foreground hover:bg-surface-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-foreground/30" />
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History size={32} className="text-foreground/15 mb-3" />
              <p className="text-sm text-foreground/40">No hay cambios registrados</p>
              <p className="text-xs text-foreground/25 mt-1">Los cambios hechos por el Director Creativo apareceran aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/6">
              {batches.map((batch) => (
                <div key={batch.batchId}>
                  {/* Batch header */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedBatch(expandedBatch === batch.batchId ? null : batch.batchId)
                    }
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-secondary/50 transition-colors text-left"
                  >
                    <div className="shrink-0 text-foreground/30">
                      {expandedBatch === batch.batchId ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{batch.description}</p>
                      <p className="text-xs text-foreground/30 mt-0.5">
                        {batch.changeCount} cambio{batch.changeCount !== 1 ? 's' : ''} - {formatTime(batch.timestamp)}
                      </p>
                    </div>
                    {/* Undo button */}
                    {confirmUndo === batch.batchId ? (
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleUndo(batch.batchId)}
                          disabled={undoingBatch === batch.batchId}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          {undoingBatch === batch.batchId ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Check size={10} />
                          )}
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmUndo(null)}
                          className="flex items-center justify-center size-6 rounded-md text-foreground/40 hover:bg-foreground/5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmUndo(batch.batchId);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-foreground/40 hover:text-amber-400 hover:bg-amber-500/10 transition-colors shrink-0"
                        title="Deshacer este grupo de cambios"
                      >
                        <Undo2 size={10} />
                        Deshacer
                      </button>
                    )}
                  </button>

                  {/* Expanded entries */}
                  {expandedBatch === batch.batchId && (
                    <div className="px-5 pb-3">
                      <div className="ml-5 border-l border-foreground/6 pl-4 space-y-2">
                        {batch.entries.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-2">
                            <div className="shrink-0 mt-0.5">
                              {getActionIcon(entry.action)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-foreground/70">
                                {entry.description_es || entry.action}
                              </p>
                              {entry.field_name && entry.field_name !== '_full_record' && (
                                <div className="text-[11px] font-mono mt-0.5">
                                  <span className="text-foreground/25">{entry.field_name}: </span>
                                  {entry.old_value && (
                                    <span className="text-red-400/50 line-through mr-1">
                                      {entry.old_value.slice(0, 50)}
                                    </span>
                                  )}
                                  {entry.new_value && (
                                    <span className="text-emerald-400/70">
                                      {entry.new_value.slice(0, 50)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* What will be restored info */}
                      <div className="ml-5 mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-400/80">
                            Deshacer restaurara {batch.changeCount} campo{batch.changeCount !== 1 ? 's' : ''} a sus valores anteriores.
                            {batch.entries.some((e) => e.action === 'create_scene') && ' Las escenas creadas seran eliminadas.'}
                            {batch.entries.some((e) => e.action === 'delete_scene') && ' Las escenas eliminadas seran restauradas.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
