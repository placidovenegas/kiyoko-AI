import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/ai/sdk-router';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_CHARACTER_GENERATOR } from '@/lib/ai/prompts/system-character-generator';
import { charactersArraySchema } from '@/lib/ai/schemas/character-output';

interface GenerateCharactersBody {
  projectId: string;
  descriptions: Array<{
    name: string;
    role: string;
    details?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: GenerateCharactersBody = await request.json();
    const { projectId, descriptions } = body;

    if (!projectId || !descriptions?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, descriptions' },
        { status: 400 }
      );
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const { model, providerId } = await getUserModel(user.id);
    const startTime = Date.now();

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

    return NextResponse.json({
      success: true,
      data: output,
      provider: providerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return NextResponse.json(
        { error: message },
        { status: 429 }
      );
    }

    console.error('[generate-characters]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
