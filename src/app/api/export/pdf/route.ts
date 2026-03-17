import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ExportPdfBody {
  projectId: string;
}

/**
 * POST /api/export/pdf
 * Export the project as a PDF document.
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

    const body: ExportPdfBody = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Fetch project data
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

    // Fetch related data
    const [
      { data: scenes },
      { data: characters },
    ] = await Promise.all([
      supabase.from('scenes').select('*').eq('project_id', projectId).order('order', { ascending: true }),
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
    console.log('[export/pdf] Project has', scenes?.length ?? 0, 'scenes and', characters?.length ?? 0, 'characters');

    return NextResponse.json(
      {
        error: 'PDF export is not yet implemented. Please use HTML export as an alternative.',
        suggestion: 'POST /api/export/html',
        // TODO: Implement PDF generation using one of the approaches above
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('[export/pdf]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
