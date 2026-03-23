// ============================================================
// Agent Selector — Elige agente según intención detectada
// Conecta detect-intent → system prompt + modelo óptimo
// Basado en KIYOKO_DEFINITIVO sección 22
// ============================================================

import type { LanguageModel } from 'ai';
import type { Intent } from '@/lib/ai/detect-intent';
import type { KiyokoActiveAgent } from '@/stores/ai-store';
import type {
  ProjectContext,
  VideoContext,
  SceneContext,
  CharacterContext,
  BackgroundContext,
} from '@/lib/ai/system-prompt';
import { buildRouterPrompt } from '@/lib/ai/agents/router';
import { buildSceneCreatorPrompt } from '@/lib/ai/agents/scene-creator';
import { buildPromptGeneratorPrompt } from '@/lib/ai/agents/prompt-generator';
import { buildSceneEditorPrompt } from '@/lib/ai/agents/scene-editor';

// ---- Context bundle passed from the API route ----

export interface AgentContext {
  project: ProjectContext;
  video: VideoContext;
  scenes: SceneContext[];
  characters: CharacterContext[];
  backgrounds: BackgroundContext[];
  agentTone?: string;
  audioConfig?: string;
  activeSceneId?: string;
  promptTemplates?: Array<{ template_text: string }>;
}

// ---- Selected agent config ----

export interface SelectedAgent {
  agentName: KiyokoActiveAgent;
  systemPrompt: string;
  temperature: number;
  /** Preferred provider IDs in order (first = best for this task) */
  preferredProviders: string[];
}

/**
 * Select the best agent for the detected intent.
 * Returns the system prompt, temperature, and preferred provider chain.
 * The API route resolves the actual LanguageModel from the provider chain.
 */
export function selectAgent(intent: Intent, ctx: AgentContext): SelectedAgent {
  switch (intent) {
    case 'create_scenes':
      return {
        agentName: 'scenes',
        systemPrompt: buildSceneCreatorPrompt({
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          project: ctx.project,
          agentTone: ctx.agentTone,
          audioConfig: ctx.audioConfig,
        }),
        temperature: 0.7,
        // GPT-4o is best for structured scene planning
        preferredProviders: ['openai', 'claude', 'gemini', 'groq'],
      };

    case 'generate_prompts':
      return {
        agentName: 'prompts',
        systemPrompt: buildPromptGeneratorPrompt({
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          project: ctx.project,
          agentTone: ctx.agentTone,
          audioConfig: ctx.audioConfig,
          promptTemplates: ctx.promptTemplates,
        }),
        temperature: 0.8,
        // Claude Sonnet is best for creative prompt writing
        preferredProviders: ['claude', 'openai', 'gemini', 'mistral'],
      };

    case 'edit_scene':
      return {
        agentName: 'editor',
        systemPrompt: buildSceneEditorPrompt({
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          project: ctx.project,
          agentTone: ctx.agentTone,
          activeSceneId: ctx.activeSceneId,
        }),
        temperature: 0.4,
        // GPT-4o-mini is fast and precise for edits
        preferredProviders: ['openai', 'groq', 'gemini', 'mistral'],
      };

    default: // 'general' → router
      return {
        agentName: 'router',
        systemPrompt: buildRouterPrompt({
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          project: ctx.project,
          agentTone: ctx.agentTone,
        }),
        temperature: 0.3,
        // Groq is ultra-fast for routing/general questions
        preferredProviders: ['groq', 'gemini', 'mistral', 'cerebras'],
      };
  }
}
