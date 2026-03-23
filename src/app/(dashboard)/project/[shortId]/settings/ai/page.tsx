'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { toast } from 'sonner';
import { Bot, Cpu, Save, Sparkles, Eye, Volume2, Film, Image } from 'lucide-react';
import type { ProjectAiAgent, ProjectAiSettings, ProjectAiAgentUpdate, ProjectAiSettingsUpdate } from '@/types';

const DIRECTOR_TYPES = [
  { value: 'pixar_3d', label: 'Director Pixar 3D' },
  { value: 'anime', label: 'Director Anime' },
  { value: 'realistic', label: 'Director Realista' },
  { value: 'comic', label: 'Director Comic' },
  { value: 'custom', label: 'Personalizado' },
];

const TONE_OPTIONS = [
  { value: 'warm_professional', label: 'Warm Professional' },
  { value: 'casual_friendly', label: 'Casual Friendly' },
  { value: 'formal_corporate', label: 'Formal Corporate' },
  { value: 'playful_creative', label: 'Playful Creative' },
  { value: 'serious_dramatic', label: 'Serious Dramatic' },
];

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'pt', label: 'Portugues' },
];

const IMAGE_PROVIDERS = [
  { value: 'grok_aurora', label: 'Grok Aurora' },
  { value: 'stability', label: 'Stability AI' },
  { value: 'openai', label: 'OpenAI DALL-E' },
];

const VIDEO_PROVIDERS = [
  { value: 'grok', label: 'Grok' },
  { value: 'runway', label: 'Runway' },
  { value: 'pika', label: 'Pika' },
];

const TTS_PROVIDERS = [
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'web_speech', label: 'Web Speech API' },
  { value: 'openai', label: 'OpenAI TTS' },
];

const VISION_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' },
];

const VISION_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openai: [
    { value: 'gpt-4o', label: 'gpt-4o' },
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  claude: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  ],
};

export default function AISettingsPage() {
  const { project, loading: projectLoading } = useProject();
  const queryClient = useQueryClient();

  // ── Local form state ──
  const [agentForm, setAgentForm] = useState<{
    name: string;
    system_prompt: string;
    tone: string;
    creativity_level: number;
    language: string;
  } | null>(null);

  const [settingsForm, setSettingsForm] = useState<{
    image_provider: string;
    video_provider: string;
    video_base_duration_seconds: number;
    video_extension_duration_seconds: number;
    tts_provider: string;
    vision_provider: string;
    vision_model: string;
  } | null>(null);

  // ── Queries ──
  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: queryKeys.aiAgent.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('project_ai_agents')
        .select('*')
        .eq('project_id', project!.id)
        .eq('is_default', true)
        .single();
      if (error) throw error;
      return data as ProjectAiAgent;
    },
    enabled: !!project?.id,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.aiSettings.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('project_ai_settings')
        .select('*')
        .eq('project_id', project!.id)
        .single();
      if (error) throw error;
      return data as ProjectAiSettings;
    },
    enabled: !!project?.id,
  });

  // ── Initialize forms when data loads ──
  if (agent && !agentForm) {
    setAgentForm({
      name: agent.name,
      system_prompt: agent.system_prompt,
      tone: agent.tone ?? 'warm_professional',
      creativity_level: agent.creativity_level ?? 0.7,
      language: agent.language ?? 'es',
    });
  }

  if (settings && !settingsForm) {
    setSettingsForm({
      image_provider: settings.image_provider ?? 'grok_aurora',
      video_provider: settings.video_provider ?? 'grok',
      video_base_duration_seconds: settings.video_base_duration_seconds ?? 6,
      video_extension_duration_seconds: settings.video_extension_duration_seconds ?? 6,
      tts_provider: settings.tts_provider ?? 'elevenlabs',
      vision_provider: settings.vision_provider ?? 'openai',
      vision_model: settings.vision_model ?? 'gpt-4o',
    });
  }

  // ── Mutations ──
  const saveAgent = useMutation({
    mutationFn: async (updates: ProjectAiAgentUpdate) => {
      if (!agent) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('project_ai_agents')
        .update(updates)
        .eq('id', agent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiAgent.byProject(project?.id ?? '') });
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (updates: ProjectAiSettingsUpdate) => {
      if (!settings) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('project_ai_settings')
        .update(updates)
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiSettings.byProject(project?.id ?? '') });
    },
  });

  const handleSave = async () => {
    try {
      const promises: Promise<unknown>[] = [];
      if (agentForm && agent) {
        promises.push(saveAgent.mutateAsync({
          name: agentForm.name,
          system_prompt: agentForm.system_prompt,
          tone: agentForm.tone,
          creativity_level: agentForm.creativity_level,
          language: agentForm.language,
        }));
      }
      if (settingsForm && settings) {
        promises.push(saveSettings.mutateAsync({
          image_provider: settingsForm.image_provider,
          video_provider: settingsForm.video_provider,
          video_base_duration_seconds: settingsForm.video_base_duration_seconds,
          video_extension_duration_seconds: settingsForm.video_extension_duration_seconds,
          tts_provider: settingsForm.tts_provider,
          vision_provider: settingsForm.vision_provider,
          vision_model: settingsForm.vision_model,
        }));
      }
      await Promise.all(promises);
      toast.success('Configuracion de IA guardada');
    } catch {
      toast.error('Error al guardar configuracion');
    }
  };

  const isLoading = projectLoading || agentLoading || settingsLoading;
  const isSaving = saveAgent.isPending || saveSettings.isPending;

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-secondary" />
        <div className="h-80 animate-pulse rounded-xl bg-secondary" />
        <div className="h-48 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  // ── Empty state (no agent configured) ──
  if (!agent || !settings) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">Sin configuracion de IA</h2>
        <p className="text-sm text-muted-foreground">
          Este proyecto no tiene un agente de IA configurado. Crea uno desde la vista de proyecto.
        </p>
      </div>
    );
  }

  const currentVisionModels = VISION_MODELS[settingsForm?.vision_provider ?? 'openai'] ?? VISION_MODELS.openai;

  return (
    <div className="h-full overflow-y-auto mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Configuracion de IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ajusta el director de IA y los generadores externos del proyecto</p>
      </div>

      {/* ── Director IA ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Director IA</h2>
        </div>

        {agentForm && (
          <div className="space-y-4">
            {/* Director type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo de director</label>
              <select
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                className="w-full h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {DIRECTOR_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* System prompt */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">System prompt</label>
              <textarea
                value={agentForm.system_prompt}
                onChange={(e) => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Eres Kiyoko, una directora de video..."
              />
            </div>

            {/* Tone + Language row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tono</label>
                <select
                  value={agentForm.tone}
                  onChange={(e) => setAgentForm({ ...agentForm, tone: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Idioma</label>
                <select
                  value={agentForm.language}
                  onChange={(e) => setAgentForm({ ...agentForm, language: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Creativity slider */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Creatividad</label>
                <span className="text-xs font-mono text-primary">{agentForm.creativity_level.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={agentForm.creativity_level}
                onChange={(e) => setAgentForm({ ...agentForm, creativity_level: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Conservador</span>
                <span>Creativo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Generadores externos ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Generadores externos</h2>
        </div>

        {settingsForm && (
          <div className="space-y-4">
            {/* Image provider */}
            <div className="flex items-center gap-3">
              <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
              <label className="w-16 shrink-0 text-xs font-medium text-muted-foreground">Imagen</label>
              <select
                value={settingsForm.image_provider}
                onChange={(e) => setSettingsForm({ ...settingsForm, image_provider: e.target.value })}
                className="flex-1 h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {IMAGE_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Video provider + durations */}
            <div className="flex flex-wrap items-center gap-3">
              <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
              <label className="w-16 shrink-0 text-xs font-medium text-muted-foreground">Video</label>
              <select
                value={settingsForm.video_provider}
                onChange={(e) => setSettingsForm({ ...settingsForm, video_provider: e.target.value })}
                className="min-w-35 flex-1 h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {VIDEO_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Base:</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settingsForm.video_base_duration_seconds}
                  onChange={(e) => setSettingsForm({ ...settingsForm, video_base_duration_seconds: parseInt(e.target.value) || 6 })}
                  className="w-16 h-9 rounded-lg border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-muted-foreground">s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ext:</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settingsForm.video_extension_duration_seconds}
                  onChange={(e) => setSettingsForm({ ...settingsForm, video_extension_duration_seconds: parseInt(e.target.value) || 6 })}
                  className="w-16 h-9 rounded-lg border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-muted-foreground">s</span>
              </div>
            </div>

            {/* TTS provider */}
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <label className="w-16 shrink-0 text-xs font-medium text-muted-foreground">TTS</label>
              <select
                value={settingsForm.tts_provider}
                onChange={(e) => setSettingsForm({ ...settingsForm, tts_provider: e.target.value })}
                className="flex-1 h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {TTS_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Vision provider + model */}
            <div className="flex flex-wrap items-center gap-3">
              <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
              <label className="w-16 shrink-0 text-xs font-medium text-muted-foreground">Vision</label>
              <select
                value={settingsForm.vision_provider}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  const models = VISION_MODELS[newProvider] ?? [];
                  setSettingsForm({
                    ...settingsForm,
                    vision_provider: newProvider,
                    vision_model: models[0]?.value ?? '',
                  });
                }}
                className="min-w-35 flex-1 h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {VISION_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <select
                value={settingsForm.vision_model}
                onChange={(e) => setSettingsForm({ ...settingsForm, vision_model: e.target.value })}
                className="min-w-35 flex-1 h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {currentVisionModels.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
