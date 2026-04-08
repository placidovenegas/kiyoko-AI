/**
 * Creative Advisor — AI-Powered Project Guidance
 *
 * Provides creative advice, feedback, and suggestions for
 * storyboard projects using the Qwen Plus model for higher quality reasoning.
 */

import { callQwen } from './providers/openrouter';

/** Minimal project representation for advice context */
export interface ProjectContext {
  /** Project title */
  title: string;
  /** Project description or brief */
  description: string;
  /** Visual style */
  visual_style: string;
  /** Number of scenes */
  scene_count: number;
  /** Scene summaries */
  scenes: {
    title: string;
    mood: string;
    image_prompt: string;
  }[];
  /** Target audience (optional) */
  target_audience?: string;
  /** Project duration in seconds (optional) */
  total_duration?: number;
}

/** Structured creative advice response */
export interface CreativeAdvice {
  /** Overall assessment of the project */
  assessment: string;
  /** Specific strengths identified */
  strengths: string[];
  /** Areas that could be improved */
  improvements: string[];
  /** Concrete actionable suggestions */
  suggestions: string[];
  /** Narrative flow evaluation */
  narrative_flow: string;
  /** Visual consistency notes */
  visual_consistency: string;
  /** Pacing feedback */
  pacing: string;
}

/** System prompt for the creative advisor agent */
const ADVISOR_PROMPT = `You are a senior creative director with 20+ years of experience in film, animation, and visual storytelling.
Your role is to review storyboard projects and provide constructive, actionable feedback.

APPROACH:
1. Be encouraging but honest — identify both strengths and weaknesses.
2. Focus on storytelling fundamentals: narrative arc, pacing, visual flow.
3. Consider the target audience when giving advice.
4. Provide specific, actionable suggestions (not vague generalizations).
5. Evaluate visual consistency across scenes.

OUTPUT FORMAT: Return valid JSON with fields:
- assessment: overall 2-3 sentence assessment
- strengths: array of specific strengths
- improvements: array of areas needing work
- suggestions: array of concrete actions to take
- narrative_flow: evaluation of story progression
- visual_consistency: notes on visual coherence
- pacing: feedback on scene timing and rhythm`;

/**
 * Get comprehensive creative advice for a project.
 *
 * @param project - Project context with scenes and metadata
 * @param question - Optional specific question to focus the advice
 * @returns Structured creative advice
 */
export async function getCreativeAdvice(
  project: ProjectContext,
  question?: string
): Promise<CreativeAdvice> {
  const userMessage = [
    `PROJECT: "${project.title}"`,
    `DESCRIPTION: ${project.description}`,
    `VISUAL STYLE: ${project.visual_style}`,
    `SCENES (${project.scene_count}):`,
    ...project.scenes.map(
      (s, i) => `  ${i + 1}. "${s.title}" — Mood: ${s.mood}`
    ),
    project.target_audience
      ? `TARGET AUDIENCE: ${project.target_audience}`
      : '',
    project.total_duration
      ? `TOTAL DURATION: ${project.total_duration}s`
      : '',
    question ? `\nSPECIFIC QUESTION: "${question}"` : '',
    '',
    'Provide comprehensive creative feedback on this project.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callQwen(
    ADVISOR_PROMPT,
    userMessage,
    'qwen/qwen3.5-plus-02-15',
    0.7
  );

  return result as CreativeAdvice;
}

/**
 * Get quick feedback on a specific aspect of the project.
 *
 * @param project - Project context
 * @param aspect - Which aspect to evaluate (pacing, mood, transitions, etc.)
 * @returns Focused feedback string
 */
export async function getQuickFeedback(
  project: ProjectContext,
  aspect: 'pacing' | 'mood' | 'transitions' | 'narration' | 'visual_style'
): Promise<{ feedback: string; score: number; suggestions: string[] }> {
  const userMessage = [
    `PROJECT: "${project.title}" (${project.scene_count} scenes)`,
    `SCENES: ${JSON.stringify(project.scenes.map((s) => s.title))}`,
    `EVALUATE: ${aspect}`,
    '',
    `Focus specifically on the ${aspect} of this project.`,
    'Return JSON: { "feedback": "...", "score": 0-100, "suggestions": [...] }',
  ].join('\n');

  const result = (await callQwen(
    ADVISOR_PROMPT,
    userMessage,
    'qwen/qwen3.5-flash-02-23',
    0.6
  )) as { feedback: string; score: number; suggestions: string[] };

  return result;
}
