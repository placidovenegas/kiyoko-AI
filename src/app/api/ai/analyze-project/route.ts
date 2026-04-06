import { NextRequest } from 'next/server';
import {
  apiBadRequest,
  apiError,
  apiResponse,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

/**
 * @deprecated Use /api/ai/analyze-video instead.
 * This route is kept for backwards compatibility and redirects to the new endpoint.
 */
export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const { data: body, response } = await parseApiJson<{ projectId?: string; videoId?: string }>(request, requestContext);
    if (response || !body) {
      return response;
    }

    if (!body.videoId) {
      return apiBadRequest(
        requestContext,
        'This endpoint is deprecated. Use /api/ai/analyze-video with { projectId, videoId } instead.'
      );
    }

    // Forward to the new endpoint
    const origin = request.nextUrl.origin;
    logServerEvent('analyze-project', requestContext, 'Forwarding deprecated endpoint to analyze-video', {
      projectId: body.projectId ?? null,
      videoId: body.videoId,
    });

    const forwardResponse = await fetch(`${origin}/api/ai/analyze-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
        'x-request-id': requestContext.requestId,
        ...(requestContext.clientRequestId ? { 'x-kiyoko-client-request-id': requestContext.clientRequestId } : {}),
      },
      body: JSON.stringify(body),
    });

    return apiResponse(requestContext, forwardResponse);
  } catch (error) {
    return apiError(requestContext, 'analyze-project', error, { message: 'Internal server error' });
  }
}
