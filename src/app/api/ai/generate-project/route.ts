import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/ai/sdk-router';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_PROJECT_GENERATOR } from '@/lib/ai/prompts/system-project-generator';
import { projectOutputSchema } from '@/lib/ai/schemas/project-output';

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

    const { model, providerId } = await getUserModel(user.id);
    const startTime = Date.now();

    const userPrompt = `Generate a complete storyboard project with the following details:
- Brief: ${brief}
- Visual Style: ${style}
- Platform: ${platform}
- Duration: ${duration} seconds

Respond with a JSON object matching the schema for: title, description, client_name, style, target_platform, target_duration_seconds, color_palette (primary, secondary, accent, dark, light), and tags.`;

    const { experimental_output: output, usage } = await generateText({
      model,
      system: SYSTEM_PROJECT_GENERATOR,
      prompt: userPrompt,
      output: Output.object({ schema: projectOutputSchema }),
    });

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      provider: providerId,
      model: providerId,
      task: 'generate-project',
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

    console.error('[generate-project]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
