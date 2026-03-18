import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getModelWithFallback } from '@/lib/ai/sdk-router';
import { SYSTEM_SCENE_GENERATOR } from '@/lib/ai/prompts/system-scene-generator';
import { sceneOutputSchema } from '@/lib/ai/schemas/scene-output';

interface GenerateScenesBody {
  projectId: string;
  instruction: string;
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

    const body: GenerateScenesBody = await request.json();
    const { projectId, instruction } = body;

    if (!projectId || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, instruction' },
        { status: 400 }
      );
    }

    // Verify user owns this project and get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
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

    const { model, providerId } = getModelWithFallback();

    const userPrompt = `Generate a new scene for this storyboard project based on the user's instruction.

=== PROJECT ===
Title: ${project.title ?? 'Untitled'}
Brief: ${project.brief ?? 'No brief'}
Style: ${project.style ?? 'Pixar 3D animated'}
Platform: ${project.platform ?? 'Not specified'}

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

    console.error('[generate-scenes]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
