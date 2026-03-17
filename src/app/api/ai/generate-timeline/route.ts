import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider, logUsage } from '@/lib/ai/router';
import { SYSTEM_TIMELINE_GENERATOR } from '@/lib/ai/prompts/system-timeline-generator';

interface GenerateTimelineBody {
  projectId: string;
  version?: 'full' | 'short_30s' | 'short_15s';
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

    const body: GenerateTimelineBody = await request.json();
    const { projectId, version = 'full' } = body;

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

    const userPrompt = `Generate a ${version} timeline for this storyboard:

Project: ${project.title ?? 'Untitled'}
Target Duration: ${project.duration ?? 60} seconds
Platform: ${project.platform ?? 'general'}
Version: ${version}

Scenes:
${(scenes ?? []).map((s: Record<string, unknown>, i: number) => `${i + 1}. [${s.scene_number ?? `E${i + 1}`}] ${s.title}: ${s.description} (${s.duration_seconds ?? 3}s)`).join('\n')}

Respond with the JSON timeline format as specified.`;

    const result = await provider.instance.generateText(
      {
        prompt: userPrompt,
        systemPrompt: SYSTEM_TIMELINE_GENERATOR,
        maxTokens: 4096,
        temperature: 0.5,
      },
      provider.apiKey
    );

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId,
      provider: provider.providerId,
      model: provider.model,
      task: 'generate-timeline',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: 0, // TODO: Calculate based on provider pricing
      responseTimeMs,
      success: true,
    });

    let timeline;
    try {
      timeline = JSON.parse(result.text);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    // TODO: Save timeline to the database linked to the project

    return NextResponse.json({
      success: true,
      timeline,
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

    console.error('[generate-timeline]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
