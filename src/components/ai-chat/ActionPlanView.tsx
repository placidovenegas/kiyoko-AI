'use client';

import type { AiActionPlan } from '@/types/ai-actions';

const ACTION_ICONS: Record<string, string> = {
  create_scene: '➕',
  update_scene: '✏️',
  delete_scene: '🗑️',
  reorder_scenes: '↕️',
  update_prompt: '🎨',
  update_camera: '📷',
  add_character_to_scene: '🎭',
  remove_character_from_scene: '👤',
  update_character: '✏️',
  assign_background: '🌄',
  batch_update: '⚡',
  explain: 'ℹ️',
};

interface ActionPlanViewProps {
  plan: AiActionPlan;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export function ActionPlanView({ plan, onConfirm, onCancel, isExecuting }: ActionPlanViewProps) {
  return (
    <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
      {/* Summary */}
      <p className="mb-2 text-sm font-medium">{plan.summary_es}</p>

      {/* Actions list */}
      <div className="mb-3 space-y-2">
        {plan.actions.map((action) => (
          <div key={action.id} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 shrink-0">
              {ACTION_ICONS[action.type] ?? '🔧'}
            </span>
            <div className="min-w-0">
              <p className="text-gray-700 dark:text-gray-300">{action.description_es}</p>
              {action.changes.length > 0 && (
                <div className="mt-0.5 space-y-0.5 text-gray-400">
                  {action.changes.map((c, i) => (
                    <p key={i} className="truncate">
                      <span className="font-mono">{c.field}</span>:{' '}
                      {c.oldValue != null && (
                        <span className="line-through opacity-60">&quot;{String(c.oldValue).slice(0, 40)}&quot; → </span>
                      )}
                      <span>&quot;{String(c.newValue ?? '').slice(0, 60)}&quot;</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <div className="mb-2 space-y-0.5 text-xs text-yellow-500">
          {plan.warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="mb-3 text-xs text-gray-400">
        {plan.total_scenes_affected} escena(s) afectada(s) · {plan.actions.length} acción(es)
      </p>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white
                     transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExecuting ? '⏳ Aplicando...' : '✅ Aplicar cambios'}
        </button>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="rounded-md bg-gray-200 px-3 py-2 text-xs transition-colors
                     hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          ❌
        </button>
      </div>
    </div>
  );
}
