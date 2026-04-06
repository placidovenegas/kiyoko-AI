import { NextResponse } from 'next/server';
import {
  apiBadRequest,
  apiError,
  apiResponse,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';
import { createClient } from '@/lib/supabase/server';

interface ExportJsonBody {
  projectId: string;
}

/**
 * POST /api/export/json
 * Export the full project as a JSON file.
 */
export async function POST(request: Request) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<ExportJsonBody>(request, requestContext);
    if (response) {
      return response;
    }

    const { projectId } = body;

    if (!projectId) {
      return apiBadRequest(requestContext, 'Missing required field: projectId');
    }

    // Fetch project with all related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiError(requestContext, 'export/json', projectError ?? new Error('Project not found'), {
        status: 404,
        message: 'Project not found',
        extra: { projectId, userId: user.id },
      });
    }

    const [
      { data: scenes },
      { data: characters },
      { data: backgrounds },
    ] = await Promise.all([
      supabase.from('scenes').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
      supabase.from('characters').select('*').eq('project_id', projectId),
      supabase.from('backgrounds').select('*').eq('project_id', projectId),
    ]);

    const safeProject = { ...(project as Record<string, unknown>) };
    delete safeProject.owner_id;

    // TODO: Also fetch arc, timeline, diagnostic data

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      generator: 'Kiyoko AI',
      requestId: requestContext.requestId,
      project: safeProject,
      scenes: scenes ?? [],
      characters: characters ?? [],
      backgrounds: backgrounds ?? [],
      // TODO: Include arc, timeline, diagnostic
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    logServerEvent('export/json', requestContext, 'Project exported as JSON', {
      projectId,
      userId: user.id,
      sceneCount: scenes?.length ?? 0,
    });

    return apiResponse(requestContext, new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${(project.title ?? 'storyboard').replace(/[^a-zA-Z0-9]/g, '_')}.json"`,
      },
    }));
  } catch (error) {
    return apiError(requestContext, 'export/json', error);
  }
}
