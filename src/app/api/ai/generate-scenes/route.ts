import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider } from '@/lib/ai/router';
import { SYSTEM_SCENE_GENERATOR } from '@/lib/ai/prompts/system-scene-generator';

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

    const provider = await getAvailableProvider(user.id, 'text');

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

Generate a scene that fits naturally within the existing storyboard. Respond with a JSON object containing:
{
  "scene_number": "string (e.g. '3A' or '4')",
  "title": "string",
  "description": "string (narrative description)",
  "scene_type": "original" | "improved" | "new" | "filler" | "video",
  "arc_phase": "hook" | "build" | "peak" | "resolve",
  "prompt_image": "string (detailed image generation prompt)",
  "prompt_video": "string (detailed video generation prompt)",
  "duration_seconds": number,
  "camera_angle": "string",
  "camera_movement": "string",
  "lighting": "string",
  "mood": "string",
  "director_notes": "string",
  "suggested_insert_after": number | null (sort_order value of the scene it should come after, null for first)
}`;

    const result = await provider.instance.generateText(
      {
        prompt: userPrompt,
        systemPrompt: SYSTEM_SCENE_GENERATOR,
        maxTokens: 4096,
        temperature: 0.7,
      },
      provider.apiKey
    );

    // Try to parse the AI response as JSON
    let scene;
    try {
      let text = result.text.trim();
      if (text.startsWith('```json')) {
        text = text.slice(7);
      } else if (text.startsWith('```')) {
        text = text.slice(3);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      const parsed = JSON.parse(text.trim());
      // Handle both single scene object and array
      scene = Array.isArray(parsed) ? parsed[0] : (parsed.scene ?? parsed);
    } catch {
      console.error('[generate-scenes] Failed to parse AI response as JSON');
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON', raw: result.text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scene,
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

    console.error('[generate-scenes]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
