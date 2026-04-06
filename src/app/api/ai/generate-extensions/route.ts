import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/ai/sdk-router';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
} from '@/lib/observability/server';

interface GenerateExtensionBody {
  sceneId: string;
  parentClipId: string;
  projectId: string;
  videoId?: string;
}

export async function POST(req: NextRequest) {
  const requestContext = createApiRequestContext(req);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiUnauthorized(requestContext, 'Not authenticated');
  }

  const body = await req.json() as GenerateExtensionBody;
  const { sceneId, parentClipId, projectId } = body;

  if (!sceneId || !parentClipId) {
    return apiBadRequest(requestContext, 'Missing sceneId or parentClipId');
  }

  // Get the parent clip
  const { data: parentClip } = await supabase
    .from('scene_video_clips')
    .select('*')
    .eq('id', parentClipId)
    .single();

  if (!parentClip) {
    return apiJson(requestContext, { error: 'Parent clip not found', requestId: requestContext.requestId }, { status: 404 });
  }

  // Get project AI settings for video provider config
  const { data: aiSettings } = await supabase
    .from('project_ai_settings')
    .select('*')
    .eq('project_id', projectId)
    .single();

  // Calculate extension number
  const { count } = await supabase
    .from('scene_video_clips')
    .select('*', { count: 'exact', head: true })
    .eq('scene_id', sceneId)
    .eq('clip_type', 'extension');

  const extensionNumber = (count ?? 0) + 1;
  const extensionDuration =
    aiSettings?.video_extension_duration_seconds ?? 6;

  // Build extension prompt
  const extensionPrompt = `[extension ${extensionNumber}] Continuing from last frame, ${
    parentClip.visual_description_es ??
    parentClip.prompt_video ??
    'continue the scene smoothly'
  }`;

  // Insert the extension clip record (status: pending -- actual generation happens externally)
  const { data: newClip, error } = await supabase
    .from('scene_video_clips')
    .insert({
      scene_id: sceneId,
      clip_type: 'extension',
      extension_number: extensionNumber,
      parent_clip_id: parentClipId,
      duration_seconds: extensionDuration,
      prompt_video: extensionPrompt,
      prompt_image_first_frame: parentClip.last_frame_url
        ? 'Continue from this frame'
        : null,
      generator: aiSettings?.video_provider ?? 'grok',
      status: 'pending',
      version: 1,
      is_current: true,
      ai_extension_reasoning: `Extension ${extensionNumber} from ${parentClip.clip_type} clip. Duration: ${extensionDuration}s. Uses last frame of parent clip as reference.`,
    })
    .select()
    .single();

  if (error) {
    return apiError(requestContext, 'generate-extensions', error, {
      message: error.message,
      extra: { userId: user.id, sceneId, parentClipId, projectId },
    });
  }

  logServerEvent('generate-extensions', requestContext, 'Generated extension clip placeholder', {
    userId: user.id,
    projectId,
    sceneId,
    parentClipId,
    extensionNumber,
  });

  // Log
  await logUsage({
    userId: user.id,
    projectId,
    provider: aiSettings?.video_provider ?? 'grok',
    model: 'video-extension',
    task: 'generate_extension',
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
    responseTimeMs: 0,
    success: true,
  });

  return apiJson(requestContext, { clip: newClip });
}
