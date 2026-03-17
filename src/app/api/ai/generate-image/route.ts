import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider, logUsage } from '@/lib/ai/router';

interface GenerateImageBody {
  prompt: string;
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

    const body: GenerateImageBody = await request.json();
    const { prompt, projectId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      );
    }

    // Verify user owns this project if projectId is provided
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    const provider = await getAvailableProvider(user.id, 'image');
    const startTime = Date.now();

    if (!provider.instance.generateImage) {
      return NextResponse.json(
        { error: 'Selected provider does not support image generation' },
        { status: 500 }
      );
    }

    const result = await provider.instance.generateImage(
      {
        prompt,
        width: 1024,
        height: 1024,
      },
      provider.apiKey
    );

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId: projectId ?? undefined,
      provider: provider.providerId,
      model: provider.model,
      task: 'generate-image',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0, // TODO: Calculate image cost from provider config
      responseTimeMs,
      success: true,
    });

    // TODO: Upload image to Supabase Storage and return the stored URL
    // TODO: Save image reference in the database

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      provider: provider.providerId,
      model: result.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return NextResponse.json(
        { error: message },
        { status: 429 }
      );
    }

    console.error('[generate-image]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
