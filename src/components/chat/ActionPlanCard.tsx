'use client';

import {
  Check,
  X,
  Pencil,
  Trash2,
  Plus,
  ArrowUpDown,
  UserPlus,
  UserMinus,
  ImageIcon,
  MessageSquare,
  Undo2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AiActionPlan, AiAction, AiActionResult } from '@/types/ai-actions';

/* ------------------------------------------------------------------ */
/*  Action type icons                                                  */
/* ------------------------------------------------------------------ */

function getActionIcon(type: AiAction['type']) {
  switch (type) {
    case 'delete_scene': return <Trash2 size={14} className="text-red-400" />;
    case 'update_scene': return <Pencil size={14} className="text-amber-400" />;
    case 'create_scene': return <Plus size={14} className="text-emerald-400" />;
    case 'reorder_scenes': return <ArrowUpDown size={14} className="text-blue-400" />;
    case 'update_character': return <Pencil size={14} className="text-purple-400" />;
    case 'remove_character_from_scene': return <UserMinus size={14} className="text-red-400" />;
    case 'add_character_to_scene': return <UserPlus size={14} className="text-emerald-400" />;
    case 'update_prompt': return <ImageIcon size={14} className="text-cyan-400" />;
    case 'explain': return <MessageSquare size={14} className="text-muted-foreground" />;
    default: return <Pencil size={14} className="text-muted-foreground" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ActionPlanCardProps {
  plan: AiActionPlan;
  isExecuting: boolean;
  results: AiActionResult[] | null;
  batchId: string | null;
  onExecute: () => void;
  onCancel: () => void;
  onModify: (text: string) => void;
  onUndo: (batchId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  ActionPlanCard                                                     */
/* ------------------------------------------------------------------ */

export function ActionPlanCard({
  plan,
  isExecuting,
  results,
  batchId,
  onExecute,
  onCancel,
  onModify,
  onUndo,
}: ActionPlanCardProps) {
  const executed = results !== null;
  const allSuccess = results?.every((r) => r.success) ?? false;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Summary */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">{plan.summary_es}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {plan.total_scenes_affected} escena{plan.total_scenes_affected !== 1 ? 's' : ''} afectada{plan.total_scenes_affected !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions list */}
      <div className="divide-y divide-border">
        {(plan.actions ?? []).map((action, i) => {
          const result = results?.find((r) => r.actionId === action.id);
          // Support both legacy format (target/changes) and new format (table/data)
          const a = action as unknown as Record<string, unknown>;
          const target = a.target as Record<string, unknown> | undefined;
          const changes = a.changes as Array<{ field: string; oldValue: unknown; newValue: unknown }> | undefined;
          const newData = a.data as Record<string, unknown> | undefined;
          const table = a.table as string | undefined;

          return (
            <div key={action.id || i} className="px-4 py-2.5 flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">{getActionIcon(action.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {target?.sceneNumber != null && (
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {String(target.sceneNumber)}
                    </span>
                  )}
                  {!!target?.characterName && (
                    <span className="text-[10px] font-medium text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                      {String(target.characterName)}
                    </span>
                  )}
                  {table && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {table}
                    </span>
                  )}
                </div>
                {/* description — legacy format */}
                {action.description_es && (
                  <p className="text-xs text-muted-foreground mt-1">{action.description_es}</p>
                )}
                {/* changes — legacy format */}
                {(changes?.length ?? 0) > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {changes!.map((change, ci) => (
                      <div key={ci} className="text-[11px] font-mono">
                        <span className="text-muted-foreground">{change.field}: </span>
                        {change.oldValue !== null && (
                          <span className="text-red-400/60 line-through mr-1">
                            {String(change.oldValue).slice(0, 60)}
                          </span>
                        )}
                        {change.newValue !== null && (
                          <span className="text-emerald-400">
                            {String(change.newValue).slice(0, 80)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* data — new format: show key fields */}
                {!changes?.length && newData && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {Object.entries(newData)
                      .filter(([, v]) => v !== null && v !== undefined && !(typeof v === 'string' && v.startsWith('__')))
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <span key={k} className="text-[11px] text-muted-foreground">
                          <span className="opacity-60">{k}:</span>{' '}
                          <span className="text-foreground/80">{String(v).slice(0, 40)}</span>
                        </span>
                      ))}
                  </div>
                )}
              </div>
              {/* Result indicator */}
              {result && (
                <div className="shrink-0 mt-0.5">
                  {result.success ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <X size={14} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warnings */}
      {(plan.warnings?.length ?? 0) > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-amber-500/5">
          {(plan.warnings ?? []).map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Execution results summary */}
      {executed && (
        <div className="px-4 py-2.5 border-t border-border bg-emerald-500/5">
          <div className="flex items-center gap-2">
            {allSuccess ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400" />
            )}
            <span className="text-xs font-medium text-foreground">
              {allSuccess
                ? `${results?.length ?? 0} cambio${(results?.length ?? 0) !== 1 ? 's' : ''} aplicado${(results?.length ?? 0) !== 1 ? 's' : ''} correctamente`
                : `${results?.filter((r) => r.success).length ?? 0}/${results?.length ?? 0} cambios aplicados`}
            </span>
          </div>
          {(results ?? []).filter((r) => !r.success).map((r) => (
            <p key={r.actionId} className="text-[11px] text-red-400 mt-1">
              Error: {r.error}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        {!executed ? (
          <>
            <button
              type="button"
              onClick={onExecute}
              disabled={isExecuting}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                isExecuting && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isExecuting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              {isExecuting ? 'Aplicando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => onModify('Modifica el plan: ')}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil size={12} />
              Modificar
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X size={12} />
              Cancelar
            </button>
          </>
        ) : (
          batchId && (
            <button
              type="button"
              onClick={() => onUndo(batchId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Undo2 size={12} />
              Deshacer
            </button>
          )
        )}
      </div>
    </div>
  );
}
