import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserModel } from '@/lib/ai/get-user-model';
import { generateObject } from 'ai';
import { z } from 'zod';
import { logUsage } from '@/lib/ai/sdk-router';
import { nanoid } from 'nanoid';
import type { Database } from '@/types/database.types';
import {
  apiBadRequest,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

type TargetPlatform = Database['public']['Enums']['target_platform'];
type VideoType = Database['public']['Enums']['video_type'];

const derivationPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  scenesToKeep: z.array(
    z.object({
      sourceSceneId: z.string(),
      newDurationSeconds: z.number(),
      modifications: z.string().optional(),
    })
  ),
  newScenes: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        durationSeconds: z.number(),
        insertAfterSceneId: z.string().optional(),
      })
    )
    .optional(),
  estimatedTotalDuration: z.number(),
  reasoning: z.string(),
});

interface DeriveVideoBody {
  projectId: string;
  sourceVideoId: string;
  platform?: TargetPlatform;
  targetDuration?: number;
  tone?: string;
  userDescription?: string;
}

const VALID_PLATFORMS: TargetPlatform[] = [
  'youtube',
  'instagram_reels',
  'tiktok',
  'tv_commercial',
  'web',
  'custom',
];

const SHORT_PLATFORMS: TargetPlatform[] = [
  'tiktok',
  'instagram_reels',
];

function resolveVideoType(duration: number): VideoType {
  return duration <= 60 ? 'short' : 'long';
}

function resolveAspectRatio(platform: TargetPlatform): string {
  return SHORT_PLATFORMS.includes(platform) ? '9:16' : '16:9';
}

function resolvePlatform(input: string | undefined, fallback: TargetPlatform): TargetPlatform {
  if (input && (VALID_PLATFORMS as string[]).includes(input)) {
    return input as TargetPlatform;
  }
  return fallback;
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

  const { data: body, response } = await parseApiJson<DeriveVideoBody>(req, requestContext);
  if (response || !body) {
    return response;
  }

  const {
    projectId,
    sourceVideoId,
    platform,
    targetDuration,
    tone,
    userDescription,
  } = body;

  if (!projectId || !sourceVideoId) {
    return apiBadRequest(requestContext, 'Missing projectId or sourceVideoId');
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .single();

  if (!project) {
    return apiJson(requestContext, { error: 'Project not found or no access', requestId: requestContext.requestId }, { status: 403 });
  }

  // Get source video + scenes
  const { data: sourceVideo } = await supabase
    .from('videos')
    .select('*')
    .eq('id', sourceVideoId)
    .eq('project_id', projectId)
    .single();
  if (!sourceVideo) {
    return apiJson(requestContext, { error: 'Source video not found', requestId: requestContext.requestId }, { status: 404 });
  }

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('video_id', sourceVideoId)
    .order('sort_order');

  // Ask AI to create derivation plan
  const { model, providerId } = await getUserModel(user.id);
  const startTime = Date.now();

  const totalSourceDuration =
    scenes?.reduce((s, sc) => s + (sc.duration_seconds ?? 0), 0) ?? 0;

  const { object: plan, usage } = await generateObject({
    model,
    schema: derivationPlanSchema,
    prompt: `You are a video production AI. Given a source video with ${scenes?.length ?? 0} scenes (total ${totalSourceDuration}s), create a derivation plan for a new ${platform ?? 'short'} video of ~${targetDuration ?? 30}s.

Source video: "${sourceVideo.title}" (${sourceVideo.platform}, ${sourceVideo.target_duration_seconds}s)
User request: ${userDescription ?? `Create a ${targetDuration}s version for ${platform}`}
${tone ? `Tone: ${tone}` : ''}

Scenes:
${(scenes ?? []).map((s, i) => `${i + 1}. "${s.title}" (${s.duration_seconds}s, ${s.arc_phase ?? 'unknown'}) — ${s.description?.slice(0, 100) ?? ''}`).join('\n')}

Select the most impactful scenes, suggest duration adjustments, and optionally add new scenes. Prioritize emotional moments and the hook.`,
  });

  const responseTimeMs = Date.now() - startTime;

  logServerEvent('derive-video', requestContext, 'Generated derivation plan', {
    userId: user.id,
    projectId,
    sourceVideoId,
    providerId,
    shouldExecute: req.headers.get('x-execute-plan') === 'true',
    sceneCount: scenes?.length ?? 0,
  });

  await logUsage({
    userId: user.id,
    projectId,
    provider: providerId,
    model: 'derive',
    task: 'derive_video',
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    estimatedCost: 0,
    responseTimeMs,
    success: true,
  });

  // If the caller wants to execute the plan, create the video + scenes
  const shouldExecute = req.headers.get('x-execute-plan') === 'true';

  if (shouldExecute) {
    const newShortId = nanoid(12);
    const resolvedPlatform = resolvePlatform(platform, sourceVideo.platform);
    const resolvedDuration = targetDuration ?? 30;
    const resolvedVideoType = resolveVideoType(resolvedDuration);
    const resolvedAspect = resolveAspectRatio(resolvedPlatform);

    const { data: newVideo } = await supabase
      .from('videos')
      .insert({
        project_id: projectId,
        short_id: newShortId,
        title: plan.title,
        slug: plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: plan.description,
        video_type: resolvedVideoType,
        platform: resolvedPlatform,
        aspect_ratio: resolvedAspect,
        target_duration_seconds: resolvedDuration,
        status: 'draft',
        sort_order: 0,
      })
      .select()
      .single();

    if (newVideo) {
      // Insert video_derivation record
      await supabase.from('video_derivations').insert({
        source_video_id: sourceVideoId,
        derived_video_id: newVideo.id,
        derivation_type: 'adaptation',
        derivation_notes: plan.reasoning,
      });

      // Copy selected scenes
      for (let i = 0; i < plan.scenesToKeep.length; i++) {
        const kept = plan.scenesToKeep[i];
        const sourceScene = scenes?.find((s) => s.id === kept.sourceSceneId);
        if (!sourceScene) continue;

        await supabase.from('scenes').insert({
          video_id: newVideo.id,
          project_id: projectId,
          short_id: nanoid(12),
          title: sourceScene.title,
          description: kept.modifications ?? sourceScene.description,
          scene_number: i + 1,
          sort_order: i,
          duration_seconds: kept.newDurationSeconds,
          arc_phase: sourceScene.arc_phase,
          status: 'draft',
          scene_type: 'original',
          client_annotation: sourceScene.client_annotation,
          annotation_source: sourceScene.annotation_source,
          director_notes: sourceScene.director_notes,
        });
      }
    }

    return apiJson(requestContext, { plan, video: newVideo });
  }

  return apiJson(requestContext, { plan });
}
