import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getModelWithFallback, logUsage } from '@/lib/ai/sdk-router';
import { SYSTEM_PROJECT_GENERATOR } from '@/lib/ai/prompts/system-project-generator';

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
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: GenerateArcBody = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Fetch project and scenes
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

    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    const { model, providerId } = getModelWithFallback();
    const startTime = Date.now();

    const userPrompt = `Generate a narrative arc for this storyboard project:

Project: ${project.title ?? 'Untitled'}
Brief: ${project.brief ?? 'No brief'}
Duration: ${project.duration ?? 60} seconds
Platform: ${project.platform ?? 'general'}

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

    console.error('[generate-arc]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
