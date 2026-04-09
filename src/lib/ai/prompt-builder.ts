/**
 * Centralized prompt builder for scene image/video generation.
 * Builds structured prompts following the Grok Imagine format.
 */

/* ── Default negative prompt ─────────────────────────────── */

export const DEFAULT_NEGATIVE_PROMPT = 'No blurry faces, no extra limbs, no flickering lighting, no text or watermarks, no deformations, no morphing between frames.';

/* ── Style tags ──────────────────────────────────────────── */

const STYLE_TAGS: Record<string, string> = {
  pixar: 'Disney-Pixar 3D animation, 8K, subsurface scattering, expressive eyes, vibrant colors, global illumination, cinematic 16:9',
  realistic: 'Photorealistic, cinematic realism, shot on 35mm film, natural lighting, high texture detail, 8K',
  anime: 'Modern high-end anime, Studio Mappa style, cel-shading, dynamic particles, cinematic lighting, 16:9',
  watercolor: 'Watercolor illustration, soft edges, pastel tones, artistic brushstrokes, 16:9',
  flat_2d: 'Flat 2D vector illustration, bold shapes, clean lines, vibrant colors, 16:9',
  cyberpunk: 'Cyberpunk neon aesthetic, high contrast, wet pavement reflections, volumetric fog, teal and orange, 16:9',
  cinematic: 'Cinematic realism, shot on 35mm film, natural lighting, shallow DOF, anamorphic lens, 8K',
};

export function getStyleTag(style: string | null | undefined): string {
  return STYLE_TAGS[style ?? ''] ?? 'Cinematic, high quality, 8K, 16:9';
}

/* ── Camera commands for Grok ────────────────────────────── */

const CAMERA_ANGLE_CMD: Record<string, string> = {
  wide: 'Extreme Wide Shot',
  medium: 'Medium Shot',
  close_up: 'Close-up',
  extreme_close_up: 'Extreme Close-up',
  pov: 'POV shot / First-person view',
  low_angle: 'Low Angle Shot',
  high_angle: 'High Angle Shot',
  birds_eye: 'Top-Down / Overhead Shot',
  dutch: 'Dutch Angle',
  over_shoulder: 'Over-the-shoulder shot',
};

const CAMERA_MOVE_CMD: Record<string, string> = {
  static: 'Camera holds still / static shot',
  dolly_in: 'Camera slowly pushes in toward subject',
  dolly_out: 'Camera pulls back from subject',
  pan_left: 'Camera pans left',
  pan_right: 'Camera pans right',
  tilt_up: 'Camera tilts up',
  tilt_down: 'Camera tilts down',
  tracking: 'Camera tracks alongside the subject',
  crane: 'Camera cranes up / ascending crane shot',
  handheld: 'Camera shake, handheld movement',
  orbit: 'Camera orbits around the subject 180°',
};

/* ── Build adjacent context ──────────────────────────────── */

export function buildAdjacentContext(prevPrompt: string | null, nextPrompt: string | null): string {
  const parts: string[] = [];
  if (prevPrompt) {
    parts.push(`PREVIOUS SCENE PROMPT (maintain visual consistency): "${prevPrompt.slice(0, 150)}..."`);
  }
  if (nextPrompt) {
    parts.push(`NEXT SCENE PROMPT (prepare transition): "${nextPrompt.slice(0, 150)}..."`);
  }
  if (parts.length === 0) return '';
  return `\nADJACENT SCENE CONTEXT:\n${parts.join('\n')}\nIMPORTANT: Maintain consistent lighting, color palette, and visual style with adjacent scenes.\n`;
}

/* ── Build user message for AI ───────────────────────────── */

export interface PromptBuildContext {
  scene: {
    title: string;
    description: string | null;
    duration_seconds: number | null;
    arc_phase: string | null;
    dialogue: string | null;
    director_notes: string | null;
    audio_config: { music?: boolean; dialogue?: boolean; sfx?: boolean; voiceover?: boolean } | null;
  };
  camera: {
    camera_angle: string | null;
    camera_movement: string | null;
    lighting: string | null;
    mood: string | null;
  } | null;
  characters: Array<{ name: string; snippet: string }>;
  backgrounds: Array<{ name: string; snippet: string; location_type: string | null; time_of_day: string | null }>;
  project: {
    style: string | null;
    global_prompt_rules: string | null;
  };
  video: {
    platform: string | null;
    aspect_ratio: string | null;
  };
  adjacentPrompts: {
    prevImage: string | null;
    nextImage: string | null;
  };
  stylePreset: {
    prompt_prefix: string | null;
    prompt_suffix: string | null;
    negative_prompt: string | null;
  } | null;
}

export function buildPromptMessage(ctx: PromptBuildContext): string {
  const { scene, camera, characters, backgrounds, project, video, adjacentPrompts, stylePreset } = ctx;

  const audio = scene.audio_config ?? {};
  const style = getStyleTag(project.style);
  const angleCmd = CAMERA_ANGLE_CMD[camera?.camera_angle ?? 'medium'] ?? 'Medium Shot';
  const moveCmd = CAMERA_MOVE_CMD[camera?.camera_movement ?? 'static'] ?? 'Static shot';

  const charLines = characters.length > 0
    ? characters.map(c => `- ${c.name}: ${c.snippet}`).join('\n')
    : '(no characters assigned)';

  const bgLines = backgrounds.length > 0
    ? backgrounds.map(b => `- ${b.name} (${b.location_type ?? ''}, ${b.time_of_day ?? ''}): ${b.snippet}`).join('\n')
    : '(no background assigned)';

  const adjacentCtx = buildAdjacentContext(adjacentPrompts.prevImage, adjacentPrompts.nextImage);

  const negativePrompt = stylePreset?.negative_prompt ?? DEFAULT_NEGATIVE_PROMPT;
  const prefix = stylePreset?.prompt_prefix ?? '';
  const suffix = stylePreset?.prompt_suffix ?? '';

  return `SCENE: "${scene.title}"
DESCRIPTION: "${scene.description ?? ''}"
DURATION: ${scene.duration_seconds ?? 5}s
ARC PHASE: ${scene.arc_phase ?? 'build'}
CAMERA: ${angleCmd} with ${moveCmd}
LIGHTING: ${camera?.lighting ?? 'natural'}
MOOD: ${camera?.mood ?? 'neutral'}
DIALOGUE: "${scene.dialogue ?? ''}"
DIRECTOR NOTES: "${scene.director_notes ?? ''}"
AUDIO: {music: ${audio.music ?? false}, dialogue: ${audio.dialogue ?? false}, sfx: ${audio.sfx ?? false}}

CHARACTERS IN SCENE:
${charLines}

BACKGROUND:
${bgLines}

PROJECT STYLE: ${style}
${prefix ? `STYLE PREFIX: ${prefix}` : ''}
${suffix ? `STYLE SUFFIX: ${suffix}` : ''}
PLATFORM: ${video.platform ?? 'youtube'} (${video.aspect_ratio ?? '16:9'})
${project.global_prompt_rules ? `GLOBAL RULES: ${project.global_prompt_rules}` : ''}

NEGATIVE PROMPT (include at end): ${negativePrompt}
${adjacentCtx}
IMPORTANT RULES:
- Image prompt: max 60-80 words, ALWAYS in English
- Video prompt: use [STYLE]/[DURATION]/[CAMERA]/[TIMELINE] Grok format
- 1 action per 2-3 seconds in video timeline
- 1 camera movement per 2-3 second block
- If no music: include "NO music. NO soundtrack."
- If no dialogue: include "NO DIALOGUE. NO LIP MOVEMENT."
- Include NEGATIVE prompt at the end of image prompt
- Respond ONLY in JSON: { "prompt_image": "...", "prompt_video": "...", "negative_prompt": "..." }`;
}
