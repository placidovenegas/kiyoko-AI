import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getModelWithFallback } from '@/lib/ai/sdk-router';
import { SYSTEM_ANALYZER } from '@/lib/ai/prompts/system-analyzer';
import { analysisOutputSchema } from '@/lib/ai/schemas/analysis-output';

interface AnalyzeProjectBody {
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

    const body: AnalyzeProjectBody = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Fetch project
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

    // Fetch ALL related data in parallel
    const [scenesRes, charactersRes, backgroundsRes, arcsRes, timelineRes] = await Promise.all([
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
      `Title: ${project.title ?? 'Untitled'}`,
      `Brief: ${project.brief ?? 'No brief'}`,
      `Style: ${project.style ?? 'Not specified'}`,
      `Platform: ${project.platform ?? 'Not specified'}`,
      `Duration: ${project.duration ?? 'Not specified'} seconds`,
      `Aspect Ratio: ${project.aspect_ratio ?? 'Not specified'}`,
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

    const { model, providerId } = getModelWithFallback();

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

    // UPDATE project_issues table with the new analysis results
    try {
      // Delete old AI-generated issues for this project
      await supabase
        .from('project_issues')
        .delete()
        .eq('project_id', projectId);

      // Build new issues from the diagnostic
      const newIssues: Array<Record<string, unknown>> = [];
      let sortOrder = 0;

      if (diagnostic && diagnostic.strengths && Array.isArray(diagnostic.strengths)) {
        for (const s of diagnostic.strengths) {
          newIssues.push({
            project_id: projectId,
            issue_type: 'strength',
            title: s.title ?? 'Strength',
            description: s.description ?? '',
            category: s.category ?? '',
            priority: 0,
            sort_order: sortOrder++,
          });
        }
      }

      if (diagnostic && diagnostic.warnings && Array.isArray(diagnostic.warnings)) {
        for (const w of diagnostic.warnings) {
          newIssues.push({
            project_id: projectId,
            issue_type: 'warning',
            title: w.title ?? 'Warning',
            description: w.description ?? '',
            category: w.category ?? '',
            priority: w.priority ?? 1,
            sort_order: sortOrder++,
          });
        }
      }

      if (diagnostic && diagnostic.suggestions && Array.isArray(diagnostic.suggestions)) {
        for (const s of diagnostic.suggestions) {
          newIssues.push({
            project_id: projectId,
            issue_type: 'suggestion',
            title: s.title ?? 'Suggestion',
            description: s.description ?? '',
            category: s.category ?? '',
            priority: 0,
            sort_order: sortOrder++,
          });
        }
      }

      if (newIssues.length > 0) {
        const { error: insertError } = await supabase
          .from('project_issues')
          .insert(newIssues);

        if (insertError) {
          console.error('[analyze-project] Failed to insert project issues:', insertError);
        }
      }
    } catch (issueError) {
      // Don't fail the whole request if issue update fails
      console.error('[analyze-project] Error updating project_issues:', issueError);
    }

    return NextResponse.json({
      success: true,
      data: diagnostic,
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

    console.error('[analyze-project]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
