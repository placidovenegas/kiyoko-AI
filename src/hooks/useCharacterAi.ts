'use client';

import { useMutation } from '@tanstack/react-query';

export interface CharacterAiResultSection {
  title: string;
  items: string[];
}

export interface CharacterAiResultPayload {
  title: string;
  summary: string;
  sections: CharacterAiResultSection[];
  suggestions?: string[];
}

export interface CharacterVoiceDirection {
  archetype: string;
  tone: string;
  pace: string;
  recommendedLanguage: 'es' | 'en';
  voiceBrief: string;
  useCases: string[];
}

export interface CharacterDraftResponse {
  draft: {
    name: string;
    initials: string;
    role: 'protagonista' | 'secundario' | 'extra' | 'narrador';
    description: string;
    visual_description: string;
    prompt_snippet: string;
    personality: string;
    signature_clothing: string;
    hair_description: string;
    accessories: string[];
    signature_tools: string[];
    color_accent: string;
  };
  voiceDirection: CharacterVoiceDirection;
  suggestions: string[];
}

export interface CharacterEnrichResponse {
  result: CharacterAiResultPayload;
  updates: {
    description: string | null;
    visual_description: string | null;
    personality: string | null;
    hair_description: string | null;
    signature_clothing: string | null;
    prompt_snippet: string | null;
    ai_prompt_description: string | null;
    accessories: string[] | null;
    color_accent: string | null;
    rules: {
      always: string[];
      never: string[];
    } | null;
  };
  voiceDirection: CharacterVoiceDirection | null;
}

export interface CharacterPromptResponse {
  result: CharacterAiResultPayload;
  updates: {
    prompt_snippet: string;
    ai_prompt_description: string;
  };
}

export interface CharacterAuditResponse {
  result: CharacterAiResultPayload;
}

export interface CharacterSceneSummaryResponse {
  result: CharacterAiResultPayload;
}

async function postCharacterAssist<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/ai/character-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as (T & { error?: string }) | null;

  if (!response.ok || !json) {
    throw new Error(json?.error ?? 'No se pudo completar la acción de IA');
  }

  return json;
}

export function useCharacterAi() {
  const draftMutation = useMutation({
    mutationFn: (payload: {
      projectId: string;
      prompt: string;
      seed?: {
        role?: string;
        description?: string;
        visual_description?: string;
        personality?: string;
      };
    }) => postCharacterAssist<CharacterDraftResponse>({ action: 'draft', ...payload }),
  });

  const auditMutation = useMutation({
    mutationFn: (payload: { projectId: string }) => postCharacterAssist<CharacterAuditResponse>({ action: 'audit', ...payload }),
  });

  const enrichMutation = useMutation({
    mutationFn: (payload: { projectId: string; characterId: string }) => postCharacterAssist<CharacterEnrichResponse>({ action: 'enrich', ...payload }),
  });

  const promptMutation = useMutation({
    mutationFn: (payload: { projectId: string; characterId: string }) => postCharacterAssist<CharacterPromptResponse>({ action: 'prompt', ...payload }),
  });

  const sceneSummaryMutation = useMutation({
    mutationFn: (payload: { projectId: string; characterId: string }) => postCharacterAssist<CharacterSceneSummaryResponse>({ action: 'scene-summary', ...payload }),
  });

  return {
    draftMutation,
    auditMutation,
    enrichMutation,
    promptMutation,
    sceneSummaryMutation,
  };
}