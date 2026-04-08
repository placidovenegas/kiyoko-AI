/**
 * Prompt Engine — Creative Director for Storyboards
 *
 * Generates storyboards, scene prompts, and creative direction
 * using Qwen models via OpenRouter. Acts as the "creative director"
 * that translates user briefs into structured scene data.
 */

import { callQwen, type QwenModel } from './providers/openrouter';

/** Style configuration for storyboard generation */
export interface StoryboardStyle {
  /** Visual style (cinematic, anime, watercolor, etc.) */
  visual_style: string;
  /** Aspect ratio (16:9, 9:16, 1:1, etc.) */
  aspect_ratio: string;
  /** Optional color palette description */
  color_palette?: string;
}

/** A single scene in a generated storyboard */
export interface StoryboardScene {
  /** Scene index (1-based) */
  scene_number: number;
  /** Brief title for the scene */
  title: string;
  /** Detailed image generation prompt */
  image_prompt: string;
  /** Camera movement description */
  camera_movement: string;
  /** Scene duration in seconds */
  duration: number;
  /** Transition to next scene */
  transition: string;
  /** Narration text for this scene */
  narration: string;
  /** Mood/atmosphere keywords */
  mood: string;
}

/** Complete storyboard output */
export interface Storyboard {
  /** Overall project title */
  title: string;
  /** Brief synopsis */
  synopsis: string;
  /** Array of ordered scenes */
  scenes: StoryboardScene[];
  /** Overall style notes */
  style_notes: string;
  /** Suggested music/audio direction */
  audio_direction: string;
}

/** System prompt for the creative director agent */
const DIRECTOR_PROMPT = `You are an expert creative director for storyboarding and AI prompt generation.
Your role is to transform user briefs into detailed, production-ready storyboards.

RULES:
1. Each scene must have a detailed image_prompt suitable for AI image generation (Flux, DALL-E, Midjourney).
2. Image prompts must include: subject, action, environment, lighting, camera angle, style, mood.
3. Maintain visual consistency across scenes (same characters, settings, color palette).
4. Camera movements should be cinematic and purposeful.
5. Transitions should flow naturally between scenes.
6. Narration should complement the visuals, not describe them.

OUTPUT FORMAT: Return valid JSON matching the Storyboard schema with fields:
- title: string
- synopsis: string (1-2 sentences)
- scenes: array of scene objects with scene_number, title, image_prompt, camera_movement, duration, transition, narration, mood
- style_notes: string
- audio_direction: string`;

/**
 * Generate a complete storyboard from a creative brief.
 *
 * @param brief - User's creative brief describing the desired video/story
 * @param style - Visual style configuration
 * @param numScenes - Number of scenes to generate (default: 6)
 * @param sceneDuration - Default duration per scene in seconds (default: 10)
 * @returns Complete storyboard with scenes and metadata
 */
export async function generateStoryboard(
  brief: string,
  style: StoryboardStyle,
  numScenes: number = 6,
  sceneDuration: number = 10
): Promise<Storyboard> {
  const userMessage = [
    `BRIEF: "${brief}"`,
    `STYLE: ${style.visual_style}`,
    `ASPECT RATIO: ${style.aspect_ratio}`,
    style.color_palette ? `COLOR PALETTE: ${style.color_palette}` : '',
    `NUMBER OF SCENES: ${numScenes}`,
    `DEFAULT SCENE DURATION: ${sceneDuration} seconds`,
    '',
    'Generate a complete storyboard with detailed image prompts for each scene.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callQwen(
    DIRECTOR_PROMPT,
    userMessage,
    'qwen/qwen3.5-flash-02-23'
  );

  return result as Storyboard;
}

/**
 * Regenerate a single scene with feedback.
 *
 * @param storyboard - The existing storyboard context
 * @param sceneIndex - Zero-based index of the scene to regenerate
 * @param feedback - User feedback describing desired changes
 * @param model - Optional model override for higher quality
 * @returns Updated scene data
 */
export async function regenerateScene(
  storyboard: Storyboard,
  sceneIndex: number,
  feedback: string,
  model: QwenModel = 'qwen/qwen3.5-flash-02-23'
): Promise<StoryboardScene> {
  const scene = storyboard.scenes[sceneIndex];
  if (!scene) {
    throw new Error(`Scene at index ${sceneIndex} not found`);
  }

  const userMessage = [
    `STORYBOARD TITLE: "${storyboard.title}"`,
    `STYLE NOTES: ${storyboard.style_notes}`,
    `CURRENT SCENE (${scene.scene_number}): ${JSON.stringify(scene)}`,
    `USER FEEDBACK: "${feedback}"`,
    '',
    'Regenerate this single scene incorporating the feedback.',
    'Maintain consistency with the overall storyboard style.',
    'Return a single scene object (not an array).',
  ].join('\n');

  const result = await callQwen(DIRECTOR_PROMPT, userMessage, model);
  return result as StoryboardScene;
}

/**
 * Generate image prompts for existing scenes that lack them.
 *
 * @param scenes - Array of scene descriptions (plain text or partial data)
 * @param style - Visual style to apply
 * @returns Array of detailed image generation prompts
 */
export async function generateImagePrompts(
  scenes: string[],
  style: StoryboardStyle
): Promise<string[]> {
  const userMessage = [
    `VISUAL STYLE: ${style.visual_style}`,
    `ASPECT RATIO: ${style.aspect_ratio}`,
    style.color_palette ? `COLOR PALETTE: ${style.color_palette}` : '',
    '',
    'SCENES:',
    ...scenes.map((s, i) => `${i + 1}. ${s}`),
    '',
    'Generate a detailed image prompt for each scene.',
    'Return JSON: { "prompts": ["prompt1", "prompt2", ...] }',
  ]
    .filter(Boolean)
    .join('\n');

  const result = (await callQwen(
    DIRECTOR_PROMPT,
    userMessage,
    'qwen/qwen3.5-flash-02-23'
  )) as { prompts: string[] };

  return result.prompts;
}
