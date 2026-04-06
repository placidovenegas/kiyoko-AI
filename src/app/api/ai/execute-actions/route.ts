import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeActionPlan } from '@/lib/ai/action-executor';
import type { AiActionPlan } from '@/types/ai-actions';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

interface ExecuteActionsBody {
  plan: AiActionPlan;
  projectId: string;
  conversationId?: string;
}

export async function POST(req: NextRequest) {
  const requestContext = createApiRequestContext(req);
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized(requestContext);
  }

  const { data: body, response } = await parseApiJson<ExecuteActionsBody>(req, requestContext);
  if (response || !body) {
    return response;
  }

  const { plan, projectId, conversationId } = body;

  if (!plan?.actions?.length) {
    return apiBadRequest(requestContext, 'Missing plan.actions');
  }
  if (!projectId) {
    return apiBadRequest(requestContext, 'Missing projectId');
  }

  // Verify the user has access to this project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (!project) {
    return apiJson(requestContext, { error: 'Project not found or no access', requestId: requestContext.requestId }, { status: 403 });
  }

  try {
    logServerEvent('execute-actions', requestContext, 'Executing AI action plan', {
      userId: user.id,
      projectId,
      conversationId: conversationId ?? null,
      actionCount: plan.actions.length,
    });

    const { results, batchId } = await executeActionPlan(
      plan.actions,
      projectId,
      user.id,
      conversationId,
    );

    const successCount = results.filter((r) => r.success).length;
    const failedResults = results.filter((r) => !r.success);

    // Emit realtime update so all connected clients refresh
    await supabase.from('realtime_updates').insert({
      project_id: projectId,
      update_type: 'ai_actions_executed',
      payload: {
        batchId,
        successCount,
        failedCount: failedResults.length,
        conversationId: conversationId ?? null,
      },
      user_id: user.id,
    } as never).maybeSingle();

    // Log to activity
    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: user.id,
      action: 'ai_actions_executed',
      entity_type: 'ai_plan',
      entity_id: batchId,
      metadata: {
        summary: plan.summary_es,
        successCount,
        failedCount: failedResults.length,
        conversationId: conversationId ?? null,
      },
    } as never).maybeSingle();

    return apiJson(requestContext, {
      batchId,
      results,
      successCount,
      failedCount: failedResults.length,
    });
  } catch (err) {
    return apiError(requestContext, 'execute-actions', err, {
      message: err instanceof Error ? err.message : 'Execution failed',
      extra: {
        userId: user.id,
        projectId,
        conversationId: conversationId ?? null,
        actionCount: plan.actions.length,
      },
    });
  }
}
