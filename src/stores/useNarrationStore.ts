import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { NarrationStyleId } from '@/lib/narration/styles';

export interface NarrationScene {
  sceneId: string;
  sceneNumber: string;
  title: string;
  description: string;
  durationSeconds: number;
  arcPhase: string;
  narrationText: string;
  narrationStatus: string; // no_text, has_text, silence, generating, generated, uploaded, error, cancelled
  narrationAudioUrl: string | null;
  narrationAudioDurationMs: number | null;
  narrationVoiceId: string | null;
  narrationVoiceName: string | null;
  narrationStyle: string | null;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels: Record<string, string>;
  preview_url: string;
  category: string;
}

interface NarrationStore {
  // Config
  mode: 'per_scene' | 'full_video';
  selectedVoiceId: string | null;
  selectedVoiceName: string | null;
  selectedStyle: NarrationStyleId;
  speed: number;
  stability: number;
  similarity: number;
  language: string;
  customInstructions: string;

  // Voices
  voices: ElevenLabsVoice[];
  voicesLoading: boolean;

  // Scenes
  scenes: NarrationScene[];
  scenesLoading: boolean;

  // Generation
  generatingSceneIds: Set<string>;
  batchProgress: { current: number; total: number } | null;

  // Full audio
  fullText: string;
  fullAudioUrl: string | null;

  // Player
  playingSceneId: string | null;

  // Setters
  setMode: (mode: 'per_scene' | 'full_video') => void;
  setVoice: (voiceId: string, voiceName: string) => void;
  setStyle: (style: NarrationStyleId) => void;
  setSpeed: (speed: number) => void;
  setStability: (stability: number) => void;
  setSimilarity: (similarity: number) => void;
  setLanguage: (lang: string) => void;
  setCustomInstructions: (text: string) => void;

  // Data fetching
  fetchScenes: (projectId: string) => Promise<void>;
  fetchVoices: () => Promise<void>;

  // Text
  updateNarrationText: (sceneId: string, text: string) => void;
  saveNarrationText: (sceneId: string, text: string) => Promise<void>;
  markAsSilence: (sceneId: string) => Promise<void>;

  // Generation
  generateAudioForScene: (sceneId: string, projectId: string) => Promise<void>;
  generateAllTexts: (projectId: string) => Promise<void>;
  generateAllAudio: (projectId: string) => Promise<void>;
  deleteNarration: (sceneId: string) => Promise<void>;

  // Full text
  setFullText: (text: string) => void;

  // Player
  playScene: (sceneId: string | null) => void;

  reset: () => void;
}

export const useNarrationStore = create<NarrationStore>((set, get) => ({
  mode: 'per_scene',
  selectedVoiceId: null,
  selectedVoiceName: null,
  selectedStyle: 'pixar',
  speed: 1.0,
  stability: 0.5,
  similarity: 0.75,
  language: 'es',
  customInstructions: '',
  voices: [],
  voicesLoading: false,
  scenes: [],
  scenesLoading: false,
  generatingSceneIds: new Set(),
  batchProgress: null,
  fullText: '',
  fullAudioUrl: null,
  playingSceneId: null,

  setMode: (mode) => set({ mode }),
  setVoice: (voiceId, voiceName) => set({ selectedVoiceId: voiceId, selectedVoiceName: voiceName }),
  setStyle: (style) => set({ selectedStyle: style }),
  setSpeed: (speed) => set({ speed }),
  setStability: (stability) => set({ stability }),
  setSimilarity: (similarity) => set({ similarity }),
  setLanguage: (lang) => set({ language: lang }),
  setCustomInstructions: (text) => set({ customInstructions: text }),
  setFullText: (text) => set({ fullText: text }),
  playScene: (id) => set({ playingSceneId: id }),

  fetchScenes: async (projectId) => {
    set({ scenesLoading: true });
    const supabase = createClient();
    const { data } = await supabase
      .from('scenes')
      .select('id, scene_number, title, description, duration_seconds, arc_phase, narration_text, narration_status, narration_audio_url, narration_audio_duration_ms, narration_voice_id, narration_voice_name, narration_style')
      .eq('project_id', projectId)
      .order('sort_order');

    const scenes: NarrationScene[] = (data ?? []).map((s: Record<string, unknown>) => ({
      sceneId: s.id as string,
      sceneNumber: s.scene_number as string,
      title: s.title as string,
      description: (s.description as string) || '',
      durationSeconds: (s.duration_seconds as number) || 5,
      arcPhase: (s.arc_phase as string) || 'build',
      narrationText: (s.narration_text as string) || '',
      narrationStatus: (s.narration_status as string) || (s.narration_audio_url ? 'generated' : s.narration_text ? 'has_text' : 'no_text'),
      narrationAudioUrl: (s.narration_audio_url as string) || null,
      narrationAudioDurationMs: (s.narration_audio_duration_ms as number) || null,
      narrationVoiceId: (s.narration_voice_id as string) || null,
      narrationVoiceName: (s.narration_voice_name as string) || null,
      narrationStyle: (s.narration_style as string) || null,
    }));

    set({ scenes, scenesLoading: false });
  },

  fetchVoices: async () => {
    set({ voicesLoading: true });
    try {
      const res = await fetch('/api/ai/voices');
      if (res.ok) {
        const data = await res.json();
        set({ voices: data.voices ?? [], voicesLoading: false });
        // Auto-select first voice if none selected
        const state = get();
        if (!state.selectedVoiceId && data.voices?.length > 0) {
          const first = data.voices[0];
          set({ selectedVoiceId: first.voice_id, selectedVoiceName: first.name });
        }
      }
    } catch {
      set({ voicesLoading: false });
    }
  },

  updateNarrationText: (sceneId, text) => {
    set((s) => ({
      scenes: s.scenes.map((sc) =>
        sc.sceneId === sceneId
          ? { ...sc, narrationText: text, narrationStatus: text ? 'has_text' : 'no_text' }
          : sc
      ),
    }));
  },

  saveNarrationText: async (sceneId, text) => {
    const supabase = createClient();
    const status = text ? 'has_text' : 'no_text';
    await supabase.from('scenes').update({ narration_text: text, narration_status: status }).eq('id', sceneId);
    get().updateNarrationText(sceneId, text);
  },

  markAsSilence: async (sceneId) => {
    const supabase = createClient();
    await supabase.from('scenes').update({ narration_status: 'silence', narration_text: '' }).eq('id', sceneId);
    set((s) => ({
      scenes: s.scenes.map((sc) =>
        sc.sceneId === sceneId ? { ...sc, narrationStatus: 'silence', narrationText: '' } : sc
      ),
    }));
  },

  generateAudioForScene: async (sceneId, projectId) => {
    const state = get();
    const scene = state.scenes.find((s) => s.sceneId === sceneId);
    if (!scene?.narrationText || !state.selectedVoiceId) return;

    set((s) => ({
      generatingSceneIds: new Set(s.generatingSceneIds).add(sceneId),
      scenes: s.scenes.map((sc) => sc.sceneId === sceneId ? { ...sc, narrationStatus: 'generating' } : sc),
    }));

    try {
      const styleConfig = (await import('@/lib/narration/styles')).getStyle(state.selectedStyle);
      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.narrationText,
          voice: state.selectedVoiceId,
          language: state.language,
          stability: styleConfig.elevenLabsSettings.stability,
          similarityBoost: styleConfig.elevenLabsSettings.similarity_boost,
          style: styleConfig.elevenLabsSettings.style,
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('audio')) throw new Error('TTS failed');

      const blob = await res.blob();
      const supabase = createClient();
      const path = `${projectId}/narration/${sceneId}/${Date.now()}.mp3`;

      const { error: uploadErr } = await supabase.storage
        .from('project-assets')
        .upload(path, blob, { contentType: 'audio/mpeg', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
      const durationMs = Math.round((blob.size * 8) / 128);

      await supabase.from('scenes').update({
        narration_audio_url: publicUrl,
        narration_audio_path: path,
        narration_audio_duration_ms: durationMs,
        narration_status: 'generated',
        narration_voice_id: state.selectedVoiceId,
        narration_voice_name: state.selectedVoiceName,
        narration_style: state.selectedStyle,
        narration_speed: state.speed,
      }).eq('id', sceneId);

      set((s) => ({
        scenes: s.scenes.map((sc) =>
          sc.sceneId === sceneId
            ? { ...sc, narrationStatus: 'generated', narrationAudioUrl: publicUrl, narrationAudioDurationMs: durationMs, narrationVoiceId: state.selectedVoiceId, narrationVoiceName: state.selectedVoiceName }
            : sc
        ),
      }));
    } catch {
      set((s) => ({
        scenes: s.scenes.map((sc) => sc.sceneId === sceneId ? { ...sc, narrationStatus: 'error' } : sc),
      }));
    } finally {
      set((s) => {
        const next = new Set(s.generatingSceneIds);
        next.delete(sceneId);
        return { generatingSceneIds: next };
      });
    }
  },

  generateAllTexts: async (projectId) => {
    const state = get();
    const scenesData = state.scenes.map((s) => ({
      id: s.sceneId, scene_number: s.sceneNumber, title: s.title,
      description: s.description, duration_seconds: s.durationSeconds, arc_phase: s.arcPhase,
    }));

    try {
      const res = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'per_scene',
          scenes: scenesData,
          config: {
            styleId: state.selectedStyle,
            customInstructions: state.customInstructions,
            language: state.language,
          },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const supabase = createClient();
      for (const result of (data.results as Array<{ sceneId: string; text: string }>)) {
        if (result.text) {
          await supabase.from('scenes').update({
            narration_text: result.text,
            narration_status: 'has_text',
          }).eq('id', result.sceneId);
        }
      }

      await get().fetchScenes(projectId);
    } catch {
      // Error handled by caller
      throw new Error('Failed to generate texts');
    }
  },

  generateAllAudio: async (projectId) => {
    const state = get();
    const scenesWithText = state.scenes.filter((s) => s.narrationText && s.narrationStatus !== 'silence');
    set({ batchProgress: { current: 0, total: scenesWithText.length } });

    for (let i = 0; i < scenesWithText.length; i++) {
      set({ batchProgress: { current: i + 1, total: scenesWithText.length } });
      await get().generateAudioForScene(scenesWithText[i].sceneId, projectId);
    }

    set({ batchProgress: null });
  },

  deleteNarration: async (sceneId) => {
    const state = get();
    const scene = state.scenes.find((s) => s.sceneId === sceneId);
    if (!scene) return;

    const supabase = createClient();
    if (scene.narrationAudioUrl) {
      // Try to delete from storage
      const pathMatch = scene.narrationAudioUrl.match(/narration\/[^?]+/);
      if (pathMatch) {
        await supabase.storage.from('project-assets').remove([pathMatch[0]]).catch(() => {});
      }
    }

    await supabase.from('scenes').update({
      narration_audio_url: null,
      narration_audio_path: null,
      narration_audio_duration_ms: null,
      narration_status: scene.narrationText ? 'has_text' : 'no_text',
    }).eq('id', sceneId);

    set((s) => ({
      scenes: s.scenes.map((sc) =>
        sc.sceneId === sceneId
          ? { ...sc, narrationAudioUrl: null, narrationAudioDurationMs: null, narrationStatus: sc.narrationText ? 'has_text' : 'no_text' }
          : sc
      ),
    }));
  },

  reset: () => set({
    mode: 'per_scene',
    selectedVoiceId: null,
    selectedVoiceName: null,
    selectedStyle: 'pixar',
    speed: 1.0,
    stability: 0.5,
    similarity: 0.75,
    customInstructions: '',
    voices: [],
    scenes: [],
    generatingSceneIds: new Set(),
    batchProgress: null,
    fullText: '',
    fullAudioUrl: null,
    playingSceneId: null,
  }),
}));
