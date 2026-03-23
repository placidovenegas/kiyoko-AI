import { NextRequest, NextResponse } from 'next/server';

/**
 * @deprecated Use /api/ai/analyze-video instead.
 * This route is kept for backwards compatibility and redirects to the new endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { projectId?: string; videoId?: string };

    if (!body.videoId) {
      return NextResponse.json(
        {
          error: 'This endpoint is deprecated. Use /api/ai/analyze-video with { projectId, videoId } instead.',
          redirect: '/api/ai/analyze-video',
        },
        { status: 400 }
      );
    }

    // Forward to the new endpoint
    const origin = request.nextUrl.origin;
    const response = await fetch(`${origin}/api/ai/analyze-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[analyze-project] redirect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
