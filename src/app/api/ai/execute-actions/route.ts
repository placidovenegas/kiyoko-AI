import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeActionPlan } from '@/lib/ai/action-executor';
import type { AiActionPlan } from '@/types/ai-actions';

interface ExecuteActionsBody {
  plan: AiActionPlan;
  projectId: string;
  conversationId?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ExecuteActionsBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { plan, projectId, conversationId } = body;

  if (!plan?.actions?.length) {
    return NextResponse.json({ error: 'Missing plan.actions' }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  // Verify the user has access to this project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found or no access' }, { status: 403 });
  }

  try {
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

    return NextResponse.json({
      batchId,
      results,
      successCount,
      failedCount: failedResults.length,
    });
  } catch (err) {
    console.error('[execute-actions]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Execution failed' },
      { status: 500 },
    );
  }
}
