import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callQwen, DEFAULT_QWEN_MODEL } from '@/lib/ai/providers/openrouter';
import { SYSTEM_SCENE_GENERATOR } from '@/lib/ai/prompts/system-scene-generator';
import { buildPromptMessage, DEFAULT_NEGATIVE_PROMPT, getStyleTag, CAMERA_ANGLE_CMD, CAMERA_MOVE_CMD } from '@/lib/ai/prompt-builder';
import {
  apiBadRequest, apiError, apiJson, apiUnauthorized,
  createApiRequestContext, logServerEvent, parseApiJson,
} from '@/lib/observability/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenerateScenePromptsBody {
  sceneId: string;
  promptType?: 'image' | 'video' | 'both';
}

interface GeneratedPrompts {
  prompt_image: string;
  prompt_video: string;
  negative_prompt?: string;
}

// ---------------------------------------------------------------------------
// Mock fallback
// ---------------------------------------------------------------------------

function generateMockPrompts(title: string, style: string | null): GeneratedPrompts {
  const styleTag = getStyleTag(style);
  return {
    prompt_image: `${styleTag}, a vibrant scene depicting "${title}". Soft natural lighting, warm color palette, detailed environment. Wide shot composition, cinematic, 4K, detailed. ${DEFAULT_NEGATIVE_PROMPT}`,
    prompt_video: `[STYLE]: ${styleTag}, cinematic 16:9, 24fps.\n[DURATION]: 5 seconds.\n[CAMERA]: Medium Shot with Camera holds still.\n\n[TIMELINE]:\n[00:00-00:02]: Scene establishes with subtle ambient movement.\n[00:02-00:04]: Main action unfolds with smooth character movements.\n[00:04-00:05]: Camera settles on focal point.\n\n[AUDIO]: Ambient sound only. NO music.\n[NEGATIVE]: ${DEFAULT_NEGATIVE_PROMPT}`,
    negative_prompt: DEFAULT_NEGATIVE_PROMPT,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ctx = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized(ctx);

    const { data: body, response } = await parseApiJson<GenerateScenePromptsBody>(request, ctx);
    if (response || !body) return response;

    const { sceneId, promptType = 'both' } = body;
    if (!sceneId) return apiBadRequest(ctx, 'Missing required field: sceneId');

    // ── Fetch scene + relationships ─────────────────────────────────────
    const [sceneRes, cameraRes, sceneCharsRes, sceneBgsRes] = await Promise.all([
      supabase.from('scenes').select('*').eq('id', sceneId).single(),
      supabase.from('scene_camera').select('*').eq('scene_id', sceneId).maybeSingle(),
      supabase.from('scene_characters')
        .select('*, characters:character_id(name, prompt_snippet, description)')
        .eq('scene_id', sceneId),
      supabase.from('scene_backgrounds')
        .select('*, backgrounds:background_id(name, prompt_snippet, description, location_type, time_of_day)')
        .eq('scene_id', sceneId),
    ]);

    const scene = sceneRes.data;
    if (sceneRes.error || !scene) {
      return apiJson(ctx, { error: 'Scene not found', requestId: ctx.requestId }, { status: 404 });
    }

    // Fetch video + project
    const { data: videoData } = await supabase
      .from('videos').select('platform, aspect_ratio, project_id')
      .eq('id', scene.video_id).single();
    if (!videoData) {
      return apiJson(ctx, { error: 'Video not found', requestId: ctx.requestId }, { status: 404 });
    }

    const { data: projectData } = await supabase
      .from('projects').select('style, ai_brief, owner_id, global_prompt_rules')
      .eq('id', videoData.project_id).single();
    if (!projectData || projectData.owner_id !== user.id) return apiUnauthorized(ctx);

    // ── Fetch adjacent scene prompts for consistency ────────────────────
    const sceneNumber = scene.scene_number ?? 0;
    const [prevSceneRes, nextSceneRes] = await Promise.all([
      supabase.from('scenes')
        .select('id').eq('video_id', scene.video_id)
        .eq('scene_number', sceneNumber - 1).maybeSingle(),
      supabase.from('scenes')
        .select('id').eq('video_id', scene.video_id)
        .eq('scene_number', sceneNumber + 1).maybeSingle(),
    ]);

    let prevImagePrompt: string | null = null;
    let nextImagePrompt: string | null = null;

    if (prevSceneRes.data) {
      const { data: pp } = await supabase.from('scene_prompts')
        .select('prompt_text').eq('scene_id', prevSceneRes.data.id)
        .eq('prompt_type', 'image').eq('is_current', true).maybeSingle();
      prevImagePrompt = pp?.prompt_text ?? null;
    }
    if (nextSceneRes.data) {
      const { data: np } = await supabase.from('scene_prompts')
        .select('prompt_text').eq('scene_id', nextSceneRes.data.id)
        .eq('prompt_type', 'image').eq('is_current', true).maybeSingle();
      nextImagePrompt = np?.prompt_text ?? null;
    }

    // ── Fetch timeline entry for context ──────────────────────────────
    const { data: timelineEntry } = await supabase.from('timeline_entries')
      .select('description').eq('scene_id', sceneId).maybeSingle();

    // ── Fetch style preset ─────────────────────────────────────────────
    const { data: stylePreset } = await supabase.from('style_presets')
      .select('prompt_prefix, prompt_suffix, negative_prompt')
      .eq('project_id', videoData.project_id).eq('is_default', true).maybeSingle();

    // ── Build prompt message ────────────────────────────────────────────
    const camera = cameraRes.data;
    const sceneChars = sceneCharsRes.data ?? [];
    const sceneBgs = sceneBgsRes.data ?? [];

    const characters = sceneChars.map((sc) => {
      const c = sc.characters as { name: string; prompt_snippet: string | null; description: string | null } | null;
      return { name: c?.name ?? 'Unknown', snippet: c?.prompt_snippet || c?.description || 'No visual description' };
    });

    const backgrounds = sceneBgs.map((sb) => {
      const b = sb.backgrounds as { name: string; prompt_snippet: string | null; description: string | null; location_type: string | null; time_of_day: string | null } | null;
      return {
        name: b?.name ?? 'Unknown', snippet: b?.prompt_snippet || b?.description || 'No description',
        location_type: b?.location_type ?? null, time_of_day: b?.time_of_day ?? null,
      };
    });

    const userMessage = buildPromptMessage({
      scene: {
        title: scene.title, description: scene.description,
        duration_seconds: scene.duration_seconds, arc_phase: scene.arc_phase,
        dialogue: scene.dialogue, director_notes: scene.director_notes,
        audio_config: scene.audio_config as GenerateScenePromptsBody extends never ? never : Record<string, boolean> | null,
      },
      camera: camera ? {
        camera_angle: camera.camera_angle, camera_movement: camera.camera_movement,
        lighting: camera.lighting, mood: camera.mood,
      } : null,
      characters, backgrounds,
      project: { style: projectData.style, global_prompt_rules: projectData.global_prompt_rules },
      video: { platform: videoData.platform, aspect_ratio: videoData.aspect_ratio },
      adjacentPrompts: { prevImage: prevImagePrompt, nextImage: nextImagePrompt },
      stylePreset: stylePreset ? {
        prompt_prefix: stylePreset.prompt_prefix, prompt_suffix: stylePreset.prompt_suffix,
        negative_prompt: stylePreset.negative_prompt,
      } : null,
    });

    // Inject timeline breakdown if available
    const timelineContext = timelineEntry?.description
      ? `\n\nTIMELINE BREAKDOWN (base the video prompt on this second-by-second description):\n${timelineEntry.description}\n`
      : '';
    const finalMessage = userMessage + timelineContext;

    // Inject promptType instruction
    const typeInstruction = promptType === 'image'
      ? '\n\nIMPORTANT: Generate ONLY the image prompt. Set prompt_video to empty string.'
      : promptType === 'video'
        ? '\n\nIMPORTANT: Generate ONLY the video prompt. Set prompt_image to empty string.'
        : '';
    const fullMessage = finalMessage + typeInstruction;

    logServerEvent('generate-scene-prompts', ctx, 'Generating scene prompts', {
      userId: user.id, sceneId, videoId: scene.video_id,
      promptType, hasTimeline: !!timelineEntry?.description,
      hasAdjacentContext: !!(prevImagePrompt || nextImagePrompt),
      hasStylePreset: !!stylePreset,
    });

    // ── Determine if extension (video-only) or insert (short image+video) ──
    const isExtension = scene.scene_type === 'extension';
    const isInsert = scene.scene_type === 'insert';

    // For extensions: fetch parent scene's last image prompt to reference
    let parentImagePrompt: string | null = null;
    if (isExtension && scene.parent_scene_id) {
      const { data: pp } = await supabase.from('scene_prompts')
        .select('prompt_text').eq('scene_id', scene.parent_scene_id)
        .eq('prompt_type', 'image').eq('is_current', true).maybeSingle();
      parentImagePrompt = pp?.prompt_text ?? null;
    }

    // ── Call AI or mock ─────────────────────────────────────────────────
    let prompts: GeneratedPrompts;
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;

    if (isExtension) {
      // Extensions: only video prompt with [CONTINUING FROM PREVIOUS CLIP]
      const extensionInstruction = `${userMessage}\n\nIMPORTANT: This is an EXTENSION scene. Generate ONLY a video prompt.\nStart with "[CONTINUING FROM PREVIOUS CLIP]"\nThe video continues from the last frame of the parent scene.\nDo NOT generate an image prompt — set prompt_image to empty string.\n${parentImagePrompt ? `Parent scene image for reference: "${parentImagePrompt.slice(0, 200)}"` : ''}\nDescribe only the NEW movement/action from this point forward.\nRespond: { "prompt_image": "", "prompt_video": "...", "negative_prompt": "..." }`;

      if (hasApiKey) {
        const result = await callQwen(SYSTEM_SCENE_GENERATOR, extensionInstruction, DEFAULT_QWEN_MODEL, 0.8);
        const parsed = result as Record<string, unknown>;
        prompts = {
          prompt_image: '',
          prompt_video: typeof parsed.prompt_video === 'string' ? parsed.prompt_video : `[CONTINUING FROM PREVIOUS CLIP]\n${getStyleTag(projectData.style)}, cinematic 16:9, 24fps. Continue from last frame.\n${scene.description ?? ''}`,
          negative_prompt: typeof parsed.negative_prompt === 'string' ? parsed.negative_prompt : DEFAULT_NEGATIVE_PROMPT,
        };
      } else {
        const cam = camera ? `${CAMERA_ANGLE_CMD[camera.camera_angle ?? 'medium'] ?? 'Medium Shot'} with ${CAMERA_MOVE_CMD[camera.camera_movement ?? 'static'] ?? 'static shot'}` : 'Medium Shot with static shot';
        prompts = {
          prompt_image: '',
          prompt_video: `[CONTINUING FROM PREVIOUS CLIP]\n[STYLE]: ${getStyleTag(projectData.style)}, cinematic 16:9, 24fps.\n[DURATION]: ${scene.duration_seconds ?? 5} seconds.\n[CAMERA]: ${cam}.\n\n[TIMELINE]:\n[00:00-00:${String(scene.duration_seconds ?? 5).padStart(2, '0')}]: Continue from last frame. ${scene.description ?? 'Action continues.'}\n\n[AUDIO]: Ambient sound only. NO music.\n[NEGATIVE]: ${DEFAULT_NEGATIVE_PROMPT}`,
          negative_prompt: DEFAULT_NEGATIVE_PROMPT,
        };
      }
    } else if (hasApiKey) {
      const result = await callQwen(SYSTEM_SCENE_GENERATOR, fullMessage, DEFAULT_QWEN_MODEL, 0.8);
      const parsed = result as Record<string, unknown>;

      if (typeof parsed.prompt_image !== 'string' || typeof parsed.prompt_video !== 'string') {
        return apiError(ctx, 'generate-scene-prompts', new Error('Invalid AI response format'), {
          message: 'AI returned invalid format', status: 500,
        });
      }

      prompts = {
        prompt_image: parsed.prompt_image,
        prompt_video: parsed.prompt_video,
        negative_prompt: typeof parsed.negative_prompt === 'string' ? parsed.negative_prompt : DEFAULT_NEGATIVE_PROMPT,
      };
    } else {
      prompts = generateMockPrompts(scene.title, projectData.style);
    }

    // ── Version tracking ────────────────────────────────────────────────
    const { data: existingPrompts } = await supabase
      .from('scene_prompts').select('id, prompt_type, version, is_current')
      .eq('scene_id', sceneId).eq('is_current', true);

    const currentImage = existingPrompts?.find((p) => p.prompt_type === 'image');
    const currentVideo = existingPrompts?.find((p) => p.prompt_type === 'video');
    const nextImageVersion = (currentImage?.version ?? 0) + 1;
    const nextVideoVersion = (currentVideo?.version ?? 0) + 1;

    // Mark old prompts as not current
    const oldIds = (existingPrompts ?? []).map((p) => p.id);
    if (oldIds.length > 0) {
      await supabase.from('scene_prompts').update({ is_current: false }).in('id', oldIds);
    }

    // Insert new prompts with quality fields
    const generator = hasApiKey ? 'qwen-flash' : 'mock';
    const negativePrompt = prompts.negative_prompt ?? DEFAULT_NEGATIVE_PROMPT;

    // Extensions: only video prompt. Inserts + originals: both.
    const promptsToInsert = [];

    const shouldGenerateImage = !isExtension && promptType !== 'video' && prompts.prompt_image;
    const shouldGenerateVideo = promptType !== 'image' && prompts.prompt_video;

    if (shouldGenerateImage) {
      promptsToInsert.push({
        scene_id: sceneId, prompt_type: 'image' as const,
        prompt_text: prompts.prompt_image, version: nextImageVersion,
        is_current: true, status: 'generated', generator,
        negative_prompt: negativePrompt, target_tool: 'grok',
      });
    }

    if (shouldGenerateVideo) {
      promptsToInsert.push({
        scene_id: sceneId, prompt_type: 'video' as const,
        prompt_text: prompts.prompt_video, version: nextVideoVersion,
        is_current: true, status: 'generated', generator,
        negative_prompt: negativePrompt, target_tool: 'grok',
      });
    }

    const { error: insertError } = promptsToInsert.length > 0
      ? await supabase.from('scene_prompts').insert(promptsToInsert)
      : { error: null };

    if (insertError) {
      return apiError(ctx, 'generate-scene-prompts', insertError, { message: 'Failed to save prompts', status: 500 });
    }

    logServerEvent('generate-scene-prompts', ctx, 'Prompts generated and saved', {
      sceneId, generator, imageVersion: nextImageVersion, videoVersion: nextVideoVersion,
    });

    // Notification
    await supabase.from('notifications').insert({
      user_id: user.id, type: 'ai_completed', title: 'Prompts generados',
      body: `Prompts para "${scene.title}" generados (v${nextImageVersion}).`,
      read: false,
    });

    return apiJson(ctx, {
      success: true,
      prompt_image: prompts.prompt_image,
      prompt_video: prompts.prompt_video,
      negative_prompt: negativePrompt,
      generator,
    });
  } catch (error) {
    return apiError(ctx, 'generate-scene-prompts', error, { message: 'Internal server error' });
  }
}
