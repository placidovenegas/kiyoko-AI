import { NextRequest } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/ai/sdk-router';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_CHARACTER_GENERATOR } from '@/lib/ai/prompts/system-character-generator';
import { charactersArraySchema } from '@/lib/ai/schemas/character-output';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

interface GenerateCharactersBody {
  projectId: string;
  descriptions: Array<{
    name: string;
    role: string;
    details?: string;
  }>;
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<GenerateCharactersBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { projectId, descriptions } = body;

    if (!projectId || !descriptions?.length) {
      return apiBadRequest(requestContext, 'Missing required fields: projectId, descriptions');
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiJson(requestContext, { error: 'Project not found', requestId: requestContext.requestId }, { status: 404 });
    }

    const { model, providerId } = await getUserModel(user.id);
    const startTime = Date.now();

    logServerEvent('generate-characters', requestContext, 'Generating character sheets', {
      userId: user.id,
      projectId,
      providerId,
      descriptionCount: descriptions.length,
    });

    const characterList = descriptions
      .map((d) => `- ${d.name} (${d.role}): ${d.details ?? 'No additional details'}`)
      .join('\n');

    const userPrompt = `Generate detailed character sheets for the following characters in a ${project.style ?? 'Pixar 3D animated'} storyboard:

Project: ${project.title ?? 'Untitled'}
Brief: ${(project as Record<string, unknown>).ai_brief ?? 'No brief'}

Characters to create:
${characterList}

Respond with a JSON object containing a "characters" array and optional "consistency_rules" array.`;

    const { experimental_output: output, usage } = await generateText({
      model,
      system: SYSTEM_CHARACTER_GENERATOR,
      prompt: userPrompt,
      output: Output.object({ schema: charactersArraySchema }),
    });

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId,
      provider: providerId,
      model: providerId,
      task: 'generate-characters',
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

    return apiError(requestContext, 'generate-characters', error, { message: 'Internal server error' });
  }
}
