/**
 * Gemini Vision Client — Image Analysis
 *
 * Analyzes uploaded images for composition, mood, style, and other
 * visual properties relevant to storyboard and scene creation.
 *
 * Uses Google Generative AI SDK (Gemini 2.0 Flash) with inline image data.
 * Requires: GEMINI_API_KEY environment variable (same key as main Gemini provider)
 */

import { GoogleGenerativeAI, type Part } from '@google/generative-ai';

/** Structured analysis result for a scene image */
export interface SceneImageAnalysis {
  /** Description of the visual composition (rule of thirds, symmetry, etc.) */
  composition: string;
  /** Main subjects detected in the image */
  subjects: string[];
  /** Overall mood/atmosphere of the image */
  mood: string;
  /** Dominant and accent colors identified */
  colors: string[];
  /** Detected artistic style (cinematic, anime, photorealistic, etc.) */
  style_detected: string;
  /** Action or movement happening in the scene */
  action: string;
  /** Camera angle (low, high, eye-level, bird's eye, etc.) */
  camera_angle: string;
  /** Lighting conditions and quality */
  lighting: string;
  /** Suggestions for improving the scene */
  suggested_improvements: string[];
}

/** Vision analysis system prompt */
const VISION_SYSTEM_PROMPT = `You are an expert visual analyst for storyboarding and scene composition.
Analyze the provided image and return a JSON object with these fields:
- composition: describe the visual composition technique
- subjects: array of main subjects/elements in the scene
- mood: the emotional atmosphere
- colors: array of dominant colors (use descriptive names)
- style_detected: the artistic/visual style
- action: what action or movement is depicted
- camera_angle: the camera perspective
- lighting: describe the lighting setup
- suggested_improvements: array of actionable suggestions

Return ONLY valid JSON, no markdown or extra text.`;

/**
 * Create a Gemini client for vision tasks.
 */
function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Analyze a single image for scene-relevant properties.
 *
 * @param imageBase64 - Base64-encoded image data (without data URI prefix)
 * @param mimeType - Image MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns Structured analysis of the image
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string = 'image/png'
): Promise<SceneImageAnalysis> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imagePart: Part = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await model.generateContent([
    VISION_SYSTEM_PROMPT,
    imagePart,
  ]);

  const response = result.response;
  const text = response.text();

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(cleaned) as SceneImageAnalysis;
}

/**
 * Analyze multiple images in parallel.
 *
 * @param images - Array of images with base64 data and MIME types
 * @returns Array of structured analyses, one per image
 */
export async function analyzeMultipleImages(
  images: { base64: string; mimeType: string }[]
): Promise<SceneImageAnalysis[]> {
  return Promise.all(
    images.map((img) => analyzeImage(img.base64, img.mimeType))
  );
}
