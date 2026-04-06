import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';
import { createClient } from '@/lib/supabase/server';

interface ExportPdfBody {
  projectId: string;
}

/**
 * POST /api/export/pdf
 * Export the project as a PDF document.
 */
export async function POST(request: Request) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<ExportPdfBody>(request, requestContext);
    if (response) {
      return response;
    }

    const { projectId } = body;

    if (!projectId) {
      return apiBadRequest(requestContext, 'Missing required field: projectId');
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiError(requestContext, 'export/pdf', projectError ?? new Error('Project not found'), {
        status: 404,
        message: 'Project not found',
        extra: { projectId, userId: user.id },
      });
    }

    // Fetch related data
    const [
      { data: scenes },
      { data: characters },
    ] = await Promise.all([
      supabase.from('scenes').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
      supabase.from('characters').select('*').eq('project_id', projectId),
    ]);

    // TODO: Implement PDF generation
    // Options for PDF generation:
    // 1. Use a library like @react-pdf/renderer for React-based PDF
    // 2. Use puppeteer/playwright to render the HTML export and convert to PDF
    // 3. Use jsPDF for client-side generation (would need a different approach)
    // 4. Use a headless Chrome service like Browserless

    // For now, return a placeholder error directing to HTML export
    // TODO: Replace with actual PDF generation implementation

    // Placeholder: generate a minimal PDF-like structure
    logServerEvent('export/pdf', requestContext, 'PDF export requested but not implemented', {
      projectId,
      userId: user.id,
      sceneCount: scenes?.length ?? 0,
      characterCount: characters?.length ?? 0,
    });

    return apiJson(
      requestContext,
      {
        error: 'PDF export is not yet implemented. Please use HTML export as an alternative.',
        suggestion: 'POST /api/export/html',
        // TODO: Implement PDF generation using one of the approaches above
      },
      { status: 501 }
    );
  } catch (error) {
    return apiError(requestContext, 'export/pdf', error);
  }
}
