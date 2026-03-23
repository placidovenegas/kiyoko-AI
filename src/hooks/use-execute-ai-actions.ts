'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AiActionPlan, AiActionResult } from '@/types/ai-actions';

interface ExecuteActionsParams {
  plan: AiActionPlan;
  projectId: string;
  conversationId?: string;
}

interface ExecuteActionsResponse {
  batchId: string;
  results: AiActionResult[];
  successCount: number;
  failedCount: number;
}

/**
 * Mutation hook to confirm and execute an AiActionPlan via the server.
 * Invalidates all scene/character/background queries after execution.
 */
export function useExecuteAiActions() {
  const queryClient = useQueryClient();

  return useMutation<ExecuteActionsResponse, Error, ExecuteActionsParams>({
    mutationFn: async ({ plan, projectId, conversationId }) => {
      const res = await fetch('/api/ai/execute-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, projectId, conversationId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      return res.json() as Promise<ExecuteActionsResponse>;
    },
    onSuccess: (data, { projectId }) => {
      // Invalidate all project-related queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['scenes', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['scenes', 'video'] });
      queryClient.invalidateQueries({ queryKey: ['characters', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backgrounds', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'project', projectId] });

      if (data.failedCount === 0) {
        toast.success(`${data.successCount} acción(es) aplicada(s) correctamente`);
      } else {
        toast.warning(`${data.successCount} aplicadas, ${data.failedCount} fallaron`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al ejecutar el plan de acciones');
    },
  });
}
