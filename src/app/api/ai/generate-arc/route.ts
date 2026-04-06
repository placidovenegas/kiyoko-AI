import { NextRequest } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/ai/sdk-router';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_PROJECT_GENERATOR } from '@/lib/ai/prompts/system-project-generator';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

interface GenerateArcBody {
  projectId: string;
}

// No dedicated arc schema file exists, so define inline
const arcOutputSchema = z.object({
  phases: z.array(z.object({
    id: z.enum(['hook', 'build', 'peak', 'close']),
    title: z.string(),
    description: z.string(),
    scene_numbers: z.array(z.string()),
    duration_seconds: z.number(),
    emotional_goal: z.string(),
    pacing: z.enum(['slow', 'medium', 'fast']),
  })),
  overall_theme: z.string(),
  emotional_journey: z.string(),
});

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<GenerateArcBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { projectId } = body;

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

    logServerEvent('generate-arc', requestContext, 'Generating narrative arc', {
      userId: user.id,
      projectId,
      providerId,
      sceneCount: scenes?.length ?? 0,
    });

    const userPrompt = `Generate a narrative arc for this storyboard project:

Project: ${project.title ?? 'Untitled'}
Brief: ${(project as Record<string, unknown>).ai_brief ?? 'No brief'}
Duration: ${(project as Record<string, unknown>).duration ?? 60} seconds
Platform: ${(project as Record<string, unknown>).platform ?? 'general'}

Scenes:
${(scenes ?? []).map((s: Record<string, unknown>, i: number) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}

Generate the narrative arc with phases (hook, build, peak, close), overall_theme, and emotional_journey.`;

    const { experimental_output: output, usage } = await generateText({
      model,
      system: SYSTEM_PROJECT_GENERATOR,
      prompt: userPrompt,
      output: Output.object({ schema: arcOutputSchema }),
    });

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId,
      provider: providerId,
      model: providerId,
      task: 'generate-arc',
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

    return apiError(requestContext, 'generate-arc', error, { message: 'Internal server error' });
  }
}
