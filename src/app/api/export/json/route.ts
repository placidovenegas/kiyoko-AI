import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ExportJsonBody {
  projectId: string;
}

/**
 * POST /api/export/json
 * Export the full project as a JSON file.
 */
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

    const body: ExportJsonBody = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Fetch project with all related data
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

    const [
      { data: scenes },
      { data: characters },
      { data: backgrounds },
    ] = await Promise.all([
      supabase.from('scenes').select('*').eq('project_id', projectId).order('order', { ascending: true }),
      supabase.from('characters').select('*').eq('project_id', projectId),
      supabase.from('backgrounds').select('*').eq('project_id', projectId),
    ]);

    // TODO: Also fetch arc, timeline, diagnostic data

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      generator: 'Kiyoko AI',
      project: {
        ...project,
        // Remove internal fields
        user_id: undefined,
      },
      scenes: scenes ?? [],
      characters: characters ?? [],
      backgrounds: backgrounds ?? [],
      // TODO: Include arc, timeline, diagnostic
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${(project.title ?? 'storyboard').replace(/[^a-zA-Z0-9]/g, '_')}.json"`,
      },
    });
  } catch (error) {
    console.error('[export/json]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
