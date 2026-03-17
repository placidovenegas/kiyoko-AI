import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider, logUsage } from '@/lib/ai/router';
import { SYSTEM_CHARACTER_GENERATOR } from '@/lib/ai/prompts/system-character-generator';

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

    const provider = await getAvailableProvider(user.id, 'text');
    const startTime = Date.now();

    const characterList = descriptions
      .map((d) => `- ${d.name} (${d.role}): ${d.details ?? 'No additional details'}`)
      .join('\n');

    const userPrompt = `Generate detailed character sheets for the following characters in a ${project.style ?? 'Pixar 3D animated'} storyboard:

Project: ${project.title ?? 'Untitled'}
Brief: ${project.brief ?? 'No brief'}

Characters to create:
${characterList}

Respond with the JSON character sheet format as specified.`;

    const result = await provider.instance.generateText(
      {
        prompt: userPrompt,
        systemPrompt: SYSTEM_CHARACTER_GENERATOR,
        maxTokens: 4096,
        temperature: 0.7,
      },
      provider.apiKey
    );

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId,
      provider: provider.providerId,
      model: provider.model,
      task: 'generate-characters',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: 0, // TODO: Calculate based on provider pricing
      responseTimeMs,
      success: true,
    });

    let characterData;
    try {
      characterData = JSON.parse(result.text);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    // TODO: Save characters to the database linked to the project

    return NextResponse.json({
      success: true,
      ...characterData,
      provider: provider.providerId,
      model: provider.model,
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
