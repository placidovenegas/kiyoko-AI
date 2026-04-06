import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callQwen, DEFAULT_QWEN_MODEL } from '@/lib/ai/providers/openrouter';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenerateScenePromptsBody {
  sceneId: string;
}

interface GeneratedPrompts {
  prompt_image: string;
  prompt_video: string;
}

interface AudioConfig {
  music?: boolean;
  dialogue?: boolean;
  sfx?: boolean;
  voiceover?: boolean;
  lip_sync?: boolean;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a creative director generating prompts for AI image and video generation.
Generate TWO prompts in English:
1. IMAGE PROMPT: A detailed description for generating a single frame/image. Include: visual style, characters (full description each time), setting, camera angle, lighting, mood, quality terms.
2. VIDEO PROMPT: A detailed description for generating a 10-second video clip starting from the image. Include: camera movement, character actions second by second, ambient effects, audio notes.

Rules:
- Always start image prompt with the visual style
- Always end image prompt with "cinematic, 4K, detailed"
- Video prompt must describe what happens over the full duration
- If audio_config says no music, include "no background music" in video prompt
- If audio_config says dialogue, describe lip movement
- Include character descriptions fully each time for consistency
- Respond ONLY in JSON format: { "prompt_image": "...", "prompt_video": "..." }`;

// ---------------------------------------------------------------------------
// Mock fallback (dev without API key)
// ---------------------------------------------------------------------------

function generateMockPrompts(title: string): GeneratedPrompts {
  return {
    prompt_image: `Pixar 3D animated style, a vibrant scene depicting "${title}". Soft natural lighting, warm color palette, detailed environment with subtle atmospheric effects. Characters rendered with expressive features and detailed textures. Wide shot composition with balanced framing, cinematic, 4K, detailed`,
    prompt_video: `Camera slowly dollies forward into the scene. Characters begin with subtle idle animations in the first 2 seconds. Between seconds 2-5, the main action unfolds with smooth character movements and environmental particles drifting through the air. Seconds 5-8 feature a gentle camera pan revealing additional scene details. Final seconds 8-10 settle on the focal point with ambient lighting shifts. Soft ambient sound design throughout.`,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ctx = createApiRequestContext(request);

  try {
    // Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized(ctx);

    // Parse body
    const { data: body, response } = await parseApiJson<GenerateScenePromptsBody>(request, ctx);
    if (response || !body) return response;

    const { sceneId } = body;
    if (!sceneId) return apiBadRequest(ctx, 'Missing required field: sceneId');

    // ── Fetch scene + relationships ──────────────────────────────────────
    const [sceneRes, cameraRes, sceneCharsRes, sceneBgsRes] = await Promise.all([
      supabase.from('scenes').select('*').eq('id', sceneId).single(),
      supabase.from('scene_camera').select('*').eq('scene_id', sceneId).maybeSingle(),
      supabase
        .from('scene_characters')
        .select('*, characters:character_id(name, prompt_snippet, description)')
        .eq('scene_id', sceneId),
      supabase
        .from('scene_backgrounds')
        .select('*, backgrounds:background_id(name, prompt_snippet, description, location_type, time_of_day)')
        .eq('scene_id', sceneId),
    ]);

    const scene = sceneRes.data;
    if (sceneRes.error || !scene) {
      return apiJson(ctx, { error: 'Scene not found', requestId: ctx.requestId }, { status: 404 });
    }

    // Fetch video + project
    const { data: videoData } = await supabase
      .from('videos')
      .select('platform, aspect_ratio, project_id')
      .eq('id', scene.video_id)
      .single();

    if (!videoData) {
      return apiJson(ctx, { error: 'Video not found', requestId: ctx.requestId }, { status: 404 });
    }

    const { data: projectData } = await supabase
      .from('projects')
      .select('style, ai_brief, owner_id')
      .eq('id', videoData.project_id)
      .single();

    if (!projectData) {
      return apiJson(ctx, { error: 'Project not found', requestId: ctx.requestId }, { status: 404 });
    }

    // Verify ownership
    if (projectData.owner_id !== user.id) {
      return apiUnauthorized(ctx);
    }

    const camera = cameraRes.data;
    const sceneChars = sceneCharsRes.data ?? [];
    const sceneBgs = sceneBgsRes.data ?? [];

    // ── Build user message ───────────────────────────────────────────────
    const audio: AudioConfig = (scene.audio_config as AudioConfig | null) ?? {};

    const characterLines = sceneChars
      .map((sc) => {
        const c = sc.characters as { name: string; prompt_snippet: string | null; description: string | null } | null;
        if (!c) return null;
        return `- ${c.name}: ${c.prompt_snippet || c.description || 'No visual description'}`;
      })
      .filter(Boolean)
      .join('\n');

    const backgroundLines = sceneBgs
      .map((sb) => {
        const b = sb.backgrounds as {
          name: string;
          prompt_snippet: string | null;
          description: string | null;
          location_type: string | null;
          time_of_day: string | null;
        } | null;
        if (!b) return null;
        return `- ${b.name} (${b.location_type ?? ''}, ${b.time_of_day ?? ''}): ${b.prompt_snippet || b.description || 'No description'}`;
      })
      .filter(Boolean)
      .join('\n');

    const userMessage = `SCENE: "${scene.title}"
DESCRIPTION: "${scene.description ?? ''}"
DURATION: ${scene.duration_seconds ?? 5}s
ARC PHASE: ${scene.arc_phase ?? 'N/A'}
CAMERA: ${camera?.camera_angle ?? 'medium'} + ${camera?.camera_movement ?? 'static'}
LIGHTING: ${camera?.lighting ?? 'natural'}
MOOD: ${camera?.mood ?? 'neutral'}
DIALOGUE: "${scene.dialogue ?? ''}"
DIRECTOR NOTES: "${scene.director_notes ?? ''}"
AUDIO: {music: ${audio.music ?? false}, dialogue: ${audio.dialogue ?? false}, sfx: ${audio.sfx ?? false}}

CHARACTERS IN SCENE:
${characterLines || '(none)'}

BACKGROUND:
${backgroundLines || '(none)'}

PROJECT STYLE: ${projectData.style ?? 'Pixar 3D animated'}
PLATFORM: ${videoData.platform ?? 'unknown'} (${videoData.aspect_ratio ?? '16:9'})`;

    logServerEvent('generate-scene-prompts', ctx, 'Generating scene prompts', {
      userId: user.id,
      sceneId,
      videoId: scene.video_id,
      projectId: videoData.project_id,
    });

    // ── Call AI or mock ──────────────────────────────────────────────────
    let prompts: GeneratedPrompts;

    const hasApiKey = !!process.env.OPENROUTER_API_KEY;

    if (hasApiKey) {
      const result = await callQwen(SYSTEM_PROMPT, userMessage, DEFAULT_QWEN_MODEL, 0.8);
      const parsed = result as Record<string, unknown>;

      if (typeof parsed.prompt_image !== 'string' || typeof parsed.prompt_video !== 'string') {
        return apiError(ctx, 'generate-scene-prompts', new Error('Invalid AI response format'), {
          message: 'AI returned invalid format',
          status: 500,
        });
      }

      prompts = {
        prompt_image: parsed.prompt_image,
        prompt_video: parsed.prompt_video,
      };
    } else {
      prompts = generateMockPrompts(scene.title);
    }

    // ── Compute next version numbers ─────────────────────────────────────
    const { data: existingPrompts } = await supabase
      .from('scene_prompts')
      .select('id, prompt_type, version, is_current')
      .eq('scene_id', sceneId)
      .eq('is_current', true);

    const currentImage = existingPrompts?.find((p) => p.prompt_type === 'image');
    const currentVideo = existingPrompts?.find((p) => p.prompt_type === 'video');
    const nextImageVersion = (currentImage?.version ?? 0) + 1;
    const nextVideoVersion = (currentVideo?.version ?? 0) + 1;

    // Mark old prompts as not current
    const oldIds = (existingPrompts ?? []).map((p) => p.id);
    if (oldIds.length > 0) {
      await supabase
        .from('scene_prompts')
        .update({ is_current: false })
        .in('id', oldIds);
    }

    // Insert new prompts
    const generator = hasApiKey ? 'qwen-flash' : 'mock';

    const { error: insertError } = await supabase.from('scene_prompts').insert([
      {
        scene_id: sceneId,
        prompt_type: 'image' as const,
        prompt_text: prompts.prompt_image,
        version: nextImageVersion,
        is_current: true,
        status: 'generated',
        generator,
      },
      {
        scene_id: sceneId,
        prompt_type: 'video' as const,
        prompt_text: prompts.prompt_video,
        version: nextVideoVersion,
        is_current: true,
        status: 'generated',
        generator,
      },
    ]);

    if (insertError) {
      return apiError(ctx, 'generate-scene-prompts', insertError, {
        message: 'Failed to save prompts',
        status: 500,
      });
    }

    logServerEvent('generate-scene-prompts', ctx, 'Prompts generated and saved', {
      sceneId,
      generator,
      imageVersion: nextImageVersion,
      videoVersion: nextVideoVersion,
    });

    return apiJson(ctx, {
      success: true,
      prompt_image: prompts.prompt_image,
      prompt_video: prompts.prompt_video,
      generator,
    });
  } catch (error) {
    return apiError(ctx, 'generate-scene-prompts', error, {
      message: 'Internal server error',
    });
  }
}
