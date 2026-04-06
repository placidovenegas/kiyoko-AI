import { NextRequest } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_SCENE_GENERATOR } from '@/lib/ai/prompts/system-scene-generator';
import { sceneOutputSchema } from '@/lib/ai/schemas/scene-output';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

interface GenerateScenesBody {
  projectId: string;
  instruction: string;
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<GenerateScenesBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { projectId, instruction } = body;

    if (!projectId || !instruction) {
      return apiBadRequest(requestContext, 'Missing required fields: projectId, instruction');
    }

    // Verify user owns this project and get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiJson(requestContext, { error: 'Project not found', requestId: requestContext.requestId }, { status: 404 });
    }

    // Fetch project context in parallel
    const [scenesRes, charactersRes, backgroundsRes] = await Promise.all([
      supabase
        .from('scenes')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('backgrounds')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
    ]);

    const scenes = scenesRes.data ?? [];
    const characters = charactersRes.data ?? [];
    const backgrounds = backgroundsRes.data ?? [];

    // Build context for the AI
    const existingScenesInfo = scenes.length > 0
      ? scenes.map((s: Record<string, unknown>, i: number) =>
          `Scene ${i + 1} [${s.scene_number}]: "${s.title}" - ${s.description ?? 'No description'} (${s.arc_phase ?? 'N/A'}, ${s.duration_seconds ?? '?'}s)`
        ).join('\n')
      : 'No scenes exist yet.';

    const characterDescriptions = characters.length > 0
      ? characters.map((c: Record<string, unknown>) =>
          `- ${c.name} (${c.role ?? 'unknown'}): ${c.prompt_snippet ?? c.description ?? 'No description'}`
        ).join('\n')
      : 'No characters defined yet.';

    const backgroundDescriptions = backgrounds.length > 0
      ? backgrounds.map((b: Record<string, unknown>) =>
          `- ${b.name} (${b.location_type ?? ''}, ${b.time_of_day ?? ''}): ${b.prompt_snippet ?? b.description ?? 'No description'}`
        ).join('\n')
      : 'No backgrounds defined yet.';

    const { model, providerId } = await getUserModel(user.id);

    logServerEvent('generate-scenes', requestContext, 'Generating scene suggestion', {
      userId: user.id,
      projectId,
      providerId,
      sceneCount: scenes.length,
      characterCount: characters.length,
      backgroundCount: backgrounds.length,
      instructionLength: instruction.length,
    });

    const userPrompt = `Generate a new scene for this storyboard project based on the user's instruction.

=== PROJECT ===
Title: ${project.title ?? 'Untitled'}
Brief: ${(project as Record<string, unknown>).ai_brief ?? 'No brief'}
Style: ${project.style ?? 'Pixar 3D animated'}
Platform: ${(project as Record<string, unknown>).platform ?? 'Not specified'}

=== EXISTING SCENES (${scenes.length}) ===
${existingScenesInfo}

=== CHARACTERS ===
${characterDescriptions}

=== BACKGROUNDS ===
${backgroundDescriptions}

=== USER INSTRUCTION ===
${instruction}

Generate a scene that fits naturally within the existing storyboard. Return a single scene object matching the required schema.`;

    const { experimental_output: output } = await generateText({
      model,
      system: SYSTEM_SCENE_GENERATOR,
      prompt: userPrompt,
      output: Output.object({ schema: sceneOutputSchema }),
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

    return apiError(requestContext, 'generate-scenes', error, { message: 'Internal server error' });
  }
}
