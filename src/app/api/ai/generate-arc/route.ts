import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider, logUsage } from '@/lib/ai/router';
import { SYSTEM_PROJECT_GENERATOR } from '@/lib/ai/prompts/system-project-generator';

interface GenerateArcBody {
  projectId: string;
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

    const provider = await getAvailableProvider(user.id, 'text');
    const startTime = Date.now();

    const userPrompt = `Generate a narrative arc for this storyboard project:

Project: ${project.title ?? 'Untitled'}
Brief: ${project.brief ?? 'No brief'}
Duration: ${project.duration ?? 60} seconds
Platform: ${project.platform ?? 'general'}

Scenes:
${(scenes ?? []).map((s: Record<string, unknown>, i: number) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}

Generate a JSON response with the narrative arc phases:
{
  "phases": [
    {
      "id": "hook" | "build" | "peak" | "close",
      "title": "string",
      "description": "string",
      "scene_numbers": ["string"],
      "duration_seconds": number,
      "emotional_goal": "string",
      "pacing": "slow" | "medium" | "fast"
    }
  ],
  "overall_theme": "string",
  "emotional_journey": "string"
}`;

    const result = await provider.instance.generateText(
      {
        prompt: userPrompt,
        systemPrompt: SYSTEM_PROJECT_GENERATOR,
        maxTokens: 2048,
        temperature: 0.6,
      },
      provider.apiKey
    );

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId,
      provider: provider.providerId,
      model: provider.model,
      task: 'generate-arc',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: 0, // TODO: Calculate based on provider pricing
      responseTimeMs,
      success: true,
    });

    let arcData;
    try {
      arcData = JSON.parse(result.text);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    // TODO: Save arc to the database linked to the project

    return NextResponse.json({
      success: true,
      arc: arcData,
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

    console.error('[generate-arc]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
