/**
 * Scene Analyzer — AI-Powered Scene Analysis and Interpolation
 *
 * Combines Gemini Vision (image analysis) with Qwen (creative reasoning)
 * to analyze scenes and generate intermediate scenes for smooth transitions.
 */

import {
  analyzeMultipleImages,
  type SceneImageAnalysis,
} from './providers/gemini-vision';
import { callQwen } from './providers/openrouter';

/** Minimal scene representation for analysis */
export interface SceneInput {
  /** Scene index */
  index: number;
  /** Scene title or description */
  title: string;
  /** Image prompt used for generation */
  image_prompt: string;
  /** Camera movement */
  camera_movement: string;
  /** Mood/atmosphere */
  mood: string;
  /** Duration in seconds */
  duration: number;
  /** Optional base64 image for visual analysis */
  imageBase64?: string;
  /** MIME type of the image */
  imageMimeType?: string;
}

/** Style context for scene generation */
export interface SceneStyle {
  /** Visual style name */
  visual_style: string;
  /** Aspect ratio */
  aspect_ratio: string;
  /** Color palette description */
  color_palette?: string;
}

/** Generated intermediate scene */
export interface InterpolatedScene {
  /** Position: between which two scene indices */
  after_scene: number;
  /** Scene title */
  title: string;
  /** Full image generation prompt */
  image_prompt: string;
  /** Camera movement */
  camera_movement: string;
  /** Mood/atmosphere */
  mood: string;
  /** Duration in seconds */
  duration: number;
  /** Transition to next scene */
  transition: string;
  /** Narration text */
  narration: string;
  /** Reasoning for this scene */
  reasoning: string;
}

/** System prompt for scene interpolation */
const INTERPOLATION_PROMPT = `You are a creative director specializing in scene transitions and narrative flow.
Your task is to analyze existing scenes and generate intermediate scenes that create smooth transitions.

RULES:
1. Intermediate scenes must bridge the visual and narrative gap between adjacent scenes.
2. Maintain consistent visual style, color palette, and character appearance.
3. Camera movements should create natural flow from one scene to the next.
4. Each intermediate scene needs a detailed image_prompt for AI image generation.
5. Transitions should feel organic, not abrupt.

OUTPUT FORMAT: Return valid JSON with:
{ "scenes": [{ after_scene, title, image_prompt, camera_movement, mood, duration, transition, narration, reasoning }] }`;

/**
 * Generate intermediate scenes to insert between existing scenes.
 *
 * Analyzes the narrative and visual flow between scenes and creates
 * bridging scenes for smoother transitions.
 *
 * @param existingScenes - Current ordered scenes
 * @param style - Visual style context
 * @param userRules - Optional user-defined constraints
 * @returns Array of scenes to insert between existing ones
 */
export async function insertScenesBetween(
  existingScenes: SceneInput[],
  style: SceneStyle,
  userRules?: string
): Promise<InterpolatedScene[]> {
  const sceneSummaries = existingScenes.map((s) => ({
    index: s.index,
    title: s.title,
    image_prompt: s.image_prompt,
    camera_movement: s.camera_movement,
    mood: s.mood,
    duration: s.duration,
  }));

  const userMessage = [
    `EXISTING SCENES: ${JSON.stringify(sceneSummaries)}`,
    `VISUAL STYLE: ${style.visual_style}`,
    `ASPECT RATIO: ${style.aspect_ratio}`,
    style.color_palette ? `COLOR PALETTE: ${style.color_palette}` : '',
    userRules ? `USER RULES: ${userRules}` : '',
    '',
    'Analyze the transitions between each pair of adjacent scenes.',
    'Generate intermediate scenes where the transition feels abrupt or disconnected.',
    'Not every pair needs an intermediate scene — only where it improves flow.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = (await callQwen(
    INTERPOLATION_PROMPT,
    userMessage,
    'qwen/qwen3.5-plus-02-15'
  )) as { scenes: InterpolatedScene[] };

  return result.scenes;
}

/**
 * Analyze scene images and provide visual consistency feedback.
 *
 * Uses Gemini Vision to analyze each scene's image and then Qwen
 * to evaluate visual consistency across the sequence.
 *
 * @param scenes - Scenes with base64 image data
 * @returns Analysis results and consistency recommendations
 */
export async function analyzeSceneConsistency(
  scenes: SceneInput[]
): Promise<{
  imageAnalyses: SceneImageAnalysis[];
  consistencyReport: ConsistencyReport;
}> {
  // Filter scenes that have images
  const scenesWithImages = scenes.filter(
    (s): s is SceneInput & { imageBase64: string } => !!s.imageBase64
  );

  if (scenesWithImages.length === 0) {
    throw new Error('No scenes with images provided for analysis');
  }

  // Analyze all images in parallel via Gemini Vision
  const imageAnalyses = await analyzeMultipleImages(
    scenesWithImages.map((s) => ({
      base64: s.imageBase64,
      mimeType: s.imageMimeType || 'image/png',
    }))
  );

  // Use Qwen to evaluate consistency across analyses
  const consistencyMessage = [
    'SCENE ANALYSES:',
    JSON.stringify(
      imageAnalyses.map((a, i) => ({
        scene_index: scenesWithImages[i].index,
        title: scenesWithImages[i].title,
        ...a,
      }))
    ),
    '',
    'Evaluate visual consistency across these scenes.',
    'Return JSON: { "overall_score": 0-100, "issues": [...], "recommendations": [...] }',
  ].join('\n');

  const consistencyResult = (await callQwen(
    'You are a visual consistency expert for storyboard production.',
    consistencyMessage,
    'qwen/qwen3.5-flash-02-23'
  )) as ConsistencyReport;

  return { imageAnalyses, consistencyReport: consistencyResult };
}

/** Consistency evaluation report */
export interface ConsistencyReport {
  /** Overall consistency score (0-100) */
  overall_score: number;
  /** Identified consistency issues */
  issues: string[];
  /** Recommendations for improving consistency */
  recommendations: string[];
}
