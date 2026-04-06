import { NextRequest } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/ai/sdk-router';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_TIMELINE_GENERATOR } from '@/lib/ai/prompts/system-timeline-generator';
import { timelineOutputSchema } from '@/lib/ai/schemas/timeline-output';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

interface GenerateTimelineBody {
  projectId: string;
  version?: 'full' | 'short_30s' | 'short_15s';
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<GenerateTimelineBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { projectId, version = 'full' } = body;

    if (!projectId) {
      return apiBadRequest(requestContext, 'Missing required field: projectId');
    }

    // Fetch project and scenes
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiJson(requestContext, { error: 'Project not found', requestId: requestContext.requestId }, { status: 404 });
    }

    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    const { model, providerId } = await getUserModel(user.id);
    const startTime = Date.now();

    logServerEvent('generate-timeline', requestContext, 'Generating timeline', {
      userId: user.id,
      projectId,
      providerId,
      version,
      sceneCount: scenes?.length ?? 0,
    });

    const userPrompt = `Generate a ${version} timeline for this storyboard:

Project: ${project.title ?? 'Untitled'}
Target Duration: ${(project as Record<string, unknown>).duration ?? 60} seconds
Platform: ${(project as Record<string, unknown>).platform ?? 'general'}
Version: ${version}

Scenes:
${(scenes ?? []).map((s: Record<string, unknown>, i: number) => `${i + 1}. [${s.scene_number ?? `E${i + 1}`}] ${s.title}: ${s.description} (${s.duration_seconds ?? 3}s)`).join('\n')}

Respond with the timeline matching the required schema: version, total_duration_seconds, entries array, and director_notes.`;

    const { experimental_output: output, usage } = await generateText({
      model,
      system: SYSTEM_TIMELINE_GENERATOR,
      prompt: userPrompt,
      output: Output.object({ schema: timelineOutputSchema }),
    });

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId,
      provider: providerId,
      model: providerId,
      task: 'generate-timeline',
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      estimatedCost: 0,
      responseTimeMs,
      success: true,
    });

    return apiJson(requestContext, {
      success: true,
      data: output,
      provider: providerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return apiJson(requestContext, { error: message, requestId: requestContext.requestId }, { status: 429 });
    }

    return apiError(requestContext, 'generate-timeline', error, { message: 'Internal server error' });
  }
}
