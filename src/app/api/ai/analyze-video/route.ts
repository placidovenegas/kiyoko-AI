import { NextRequest } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_ANALYZER } from '@/lib/ai/prompts/system-analyzer';
import { analysisOutputSchema } from '@/lib/ai/schemas/analysis-output';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  logServerWarning,
  parseApiJson,
} from '@/lib/observability/server';

interface AnalyzeVideoBody {
  projectId: string;
  videoId: string;
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<AnalyzeVideoBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { projectId, videoId } = body;

    if (!projectId) {
      return apiBadRequest(requestContext, 'Missing required field: projectId');
    }

    if (!videoId) {
      return apiBadRequest(requestContext, 'Missing required field: videoId');
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiJson(requestContext, { error: 'Project not found', requestId: requestContext.requestId }, { status: 404 });
    }

    const projectData = project as Record<string, unknown>;

    // Fetch ALL related data in parallel — scenes filtered by videoId
    const [scenesRes, charactersRes, backgroundsRes, arcsRes, timelineRes] = await Promise.all([
      supabase
        .from('scenes')
        .select('*')
        .eq('video_id', videoId)
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
      supabase
        .from('narrative_arcs')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('timeline_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true }),
    ]);

    const scenes = scenesRes.data ?? [];
    const characters = charactersRes.data ?? [];
    const backgrounds = backgroundsRes.data ?? [];
    const arcs = arcsRes.data ?? [];
    const timeline = timelineRes.data ?? [];

    // Build comprehensive context string
    const contextParts: string[] = [
      `=== PROJECT ===`,
      `Title: ${projectData.title ?? 'Untitled'}`,
      `Brief: ${projectData.ai_brief ?? 'No brief'}`,
      `Style: ${projectData.style ?? 'Not specified'}`,
      `Platform: ${projectData.platform ?? 'Not specified'}`,
      `Duration: ${projectData.duration ?? 'Not specified'} seconds`,
      `Aspect Ratio: ${projectData.aspect_ratio ?? 'Not specified'}`,
      '',
      `=== CHARACTERS (${characters.length}) ===`,
      ...characters.map((c: Record<string, unknown>) =>
        `- ${c.name} (${c.role ?? 'unknown role'}): ${c.description ?? ''} | Prompt: ${c.prompt_snippet ?? 'N/A'}`
      ),
      '',
      `=== BACKGROUNDS (${backgrounds.length}) ===`,
      ...backgrounds.map((b: Record<string, unknown>) =>
        `- ${b.name} (${b.location_type ?? ''}, ${b.time_of_day ?? ''}): ${b.description ?? ''} | Prompt: ${b.prompt_snippet ?? 'N/A'}`
      ),
      '',
      `=== SCENES (${scenes.length}) ===`,
      ...scenes.map((s: Record<string, unknown>, i: number) =>
        [
          `Scene ${i + 1} [${s.scene_number}]: "${s.title}"`,
          `  Type: ${s.scene_type ?? 'original'} | Arc Phase: ${s.arc_phase ?? 'N/A'}`,
          `  Duration: ${s.duration_seconds ?? '?'}s | Camera: ${s.camera_angle ?? 'N/A'} | Lighting: ${s.lighting ?? 'N/A'}`,
          `  Description: ${s.description ?? 'N/A'}`,
          `  Image Prompt: ${s.prompt_image ?? 'EMPTY'}`,
          `  Video Prompt: ${s.prompt_video ?? 'EMPTY'}`,
          `  Status: ${s.status ?? 'draft'}`,
        ].join('\n')
      ),
      '',
      `=== NARRATIVE ARCS (${arcs.length}) ===`,
      ...arcs.map((a: Record<string, unknown>) =>
        `- Phase ${a.phase_number}: "${a.title}" (${a.phase}) [${a.start_second}s - ${a.end_second}s] - ${a.description ?? ''}`
      ),
      '',
      `=== TIMELINE (${timeline.length} entries) ===`,
      ...timeline.map((t: Record<string, unknown>) =>
        `- [${t.start_time}-${t.end_time}] "${t.title}" (${t.arc_phase ?? ''})`
      ),
    ];

    const fullContext = contextParts.join('\n');

    const { model, providerId } = await getUserModel(user.id);

    logServerEvent('analyze-video', requestContext, 'Starting video analysis', {
      userId: user.id,
      projectId,
      videoId,
      sceneCount: scenes.length,
      characterCount: characters.length,
      backgroundCount: backgrounds.length,
      arcCount: arcs.length,
      timelineCount: timeline.length,
      providerId,
    });

    const userPrompt = `Analyze this storyboard project scene by scene and provide a detailed diagnostic.

${fullContext}

Respond with a JSON object following the format specified in your instructions.
Be constructive and specific. Evaluate each scene's prompt quality, the narrative flow, visual consistency, pacing, and overall production readiness.`;

    const { experimental_output: output } = await generateText({
      model,
      system: SYSTEM_ANALYZER,
      prompt: userPrompt,
      output: Output.object({ schema: analysisOutputSchema }),
    });

    const diagnostic = output;

    // Save analysis to video_analysis table
    try {
      const admin = createAdminClient();
      const db = admin ?? supabase;

      // Set previous analysis for this video to is_current = false
      await db
        .from('video_analysis')
        .update({ is_current: false })
        .eq('video_id', videoId)
        .eq('is_current', true);

      // Get next version number
      const { data: lastAnalysis } = await db
        .from('video_analysis')
        .select('version')
        .eq('video_id', videoId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (lastAnalysis?.version ?? 0) + 1;

      const { error: insertError } = await db
        .from('video_analysis')
        .insert({
          video_id: videoId,
          version: nextVersion,
          is_current: true,
          status: 'ready',
          strengths: diagnostic?.strengths ?? [],
          weaknesses: diagnostic?.warnings ?? [],
          suggestions: diagnostic?.suggestions ?? [],
          overall_score: diagnostic?.overall_score ?? null,
          summary: diagnostic?.summary ?? '',
          analysis_model: providerId,
        });

      if (insertError) {
        logServerWarning('analyze-video', requestContext, 'Failed to insert video_analysis row', {
          userId: user.id,
          projectId,
          videoId,
          errorMessage: insertError.message,
        });
      }
    } catch (saveError) {
      logServerWarning('analyze-video', requestContext, 'Error saving analysis to DB', {
        userId: user.id,
        projectId,
        videoId,
        errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
      });
    }

    return apiJson(requestContext, {
      success: true,
      data: diagnostic,
      provider: providerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return apiJson(requestContext, { error: message, requestId: requestContext.requestId }, { status: 429 });
    }

    return apiError(requestContext, 'analyze-video', error, {
      message: 'Internal server error',
      extra: {},
    });
  }
}
