import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider, logUsage } from '@/lib/ai/router';
import { SYSTEM_PROJECT_GENERATOR } from '@/lib/ai/prompts/system-project-generator';

interface GenerateProjectBody {
  brief: string;
  style: string;
  platform: string;
  duration: number;
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

    const body: GenerateProjectBody = await request.json();
    const { brief, style, platform, duration } = body;

    if (!brief || !style || !platform || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: brief, style, platform, duration' },
        { status: 400 }
      );
    }

    const provider = await getAvailableProvider(user.id, 'text');
    const startTime = Date.now();

    // TODO: Build the user prompt from the body fields
    const userPrompt = `Generate a complete storyboard project with the following details:
- Brief: ${brief}
- Visual Style: ${style}
- Platform: ${platform}
- Duration: ${duration} seconds

Respond with a JSON object containing: title, description, scenes (array), characters (array), backgrounds (array), arc_phases (array).`;

    const result = await provider.instance.generateText(
      {
        prompt: userPrompt,
        systemPrompt: SYSTEM_PROJECT_GENERATOR,
        maxTokens: 4096,
        temperature: 0.7,
      },
      provider.apiKey
    );

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      provider: provider.providerId,
      model: provider.model,
      task: 'generate-project',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: 0, // TODO: Calculate based on provider pricing
      responseTimeMs,
      success: true,
    });

    // TODO: Parse the AI response JSON and validate structure
    // TODO: Save the project to the database
    // TODO: Return the saved project with its ID

    let projectData;
    try {
      projectData = JSON.parse(result.text);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: projectData,
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

    console.error('[generate-project]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
