// ============================================================
// Agent Selector — Elige agente según intención detectada
// V2: Soporta 30+ intenciones con agentes especializados
// ============================================================

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
import { buildCharacterAgentPrompt } from '@/lib/ai/agents/character-agent';
import { buildBackgroundAgentPrompt } from '@/lib/ai/agents/background-agent';
// task-agent removed — tasks module deferred
import { buildIdeationAgentPrompt } from '@/lib/ai/agents/ideation-agent';

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
  /** Perfil creativo del usuario (para ideation agent) */
  creativeProfile?: {
    video_types?: string | null;
    platforms?: string | null;
    use_context?: string | null;
    purpose?: string | null;
    typical_duration?: string | null;
  };
  /** Stats de tareas */
  taskStats?: { open: number; total: number; urgent: number };
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
    // ============ SCENE CREATION ============
    case 'create_scene':
    case 'list_scenes':
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
        preferredProviders: ['openrouter', 'gemini', 'claude'],
      };

    // ============ PROMPT GENERATION ============
    case 'generate_prompt':
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
        preferredProviders: ['openrouter', 'gemini', 'claude'],
      };

    // ============ SCENE EDITING ============
    case 'edit_scene':
    case 'configure_camera':
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
        preferredProviders: ['openrouter', 'gemini', 'claude'],
      };

    // ============ CHARACTERS ============
    case 'create_character':
    case 'view_character':
    case 'list_characters':
    case 'edit_character':
      return {
        agentName: 'characters',
        systemPrompt: buildCharacterAgentPrompt({
          project: ctx.project,
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          agentTone: ctx.agentTone,
        }),
        temperature: 0.5,
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ BACKGROUNDS ============
    case 'create_background':
    case 'view_background':
    case 'list_backgrounds':
    case 'edit_background':
      return {
        agentName: 'backgrounds',
        systemPrompt: buildBackgroundAgentPrompt({
          project: ctx.project,
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          agentTone: ctx.agentTone,
        }),
        temperature: 0.5,
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ IDEATION ============
    case 'generate_ideas':
      return {
        agentName: 'ideation',
        systemPrompt: buildIdeationAgentPrompt({
          project: ctx.project,
          video: ctx.video,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          agentTone: ctx.agentTone,
          creativeProfile: ctx.creativeProfile,
        }),
        temperature: 0.9,
        preferredProviders: ['openrouter', 'gemini', 'claude'],
      };

    // ============ VIEW SCENE ============
    case 'view_scene':
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
        temperature: 0.3,
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ VIDEO / PROJECT VIEW ============
    case 'create_video':
    case 'view_video':
    case 'edit_video':
    case 'create_project':
    case 'view_project':
    case 'edit_project':
    case 'analyze_video':
    case 'view_activity':
    case 'view_styles':
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
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ ANALYSIS / READINESS ============
    case 'analyze_scene':
    case 'scene_readiness':
    case 'next_steps':
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
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ NARRATION ============
    case 'generate_narration':
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
        temperature: 0.7,
        preferredProviders: ['openrouter', 'gemini', 'claude'],
      };

    // ============ DELETE ============
    case 'delete_entity':
      return {
        agentName: 'editor',
        systemPrompt: buildSceneEditorPrompt({
          video: ctx.video,
          scenes: ctx.scenes,
          characters: ctx.characters,
          backgrounds: ctx.backgrounds,
          project: ctx.project,
          agentTone: ctx.agentTone,
        }),
        temperature: 0.2,
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ NAVIGATION ============
    case 'navigate_to':
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
        temperature: 0.1,
        preferredProviders: ['openrouter', 'gemini'],
      };

    // ============ GENERAL (fallback) ============
    default:
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
        preferredProviders: ['openrouter', 'gemini'],
      };
  }
}
