'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleHelp, Plus, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  CHAT_COMPOSER_UNIFIED_SHELL_CLASS,
  CHAT_COMPOSER_MAX_WIDTH_CLASS,
  CHAT_CREATION_DOCK_CLASS,
  CREATION_FORM_HANDOFF_MS,
  CHAT_DOCK_OVERLAY_ANIMATE,
  CHAT_DOCK_OVERLAY_EXIT,
  CHAT_DOCK_OVERLAY_INITIAL,
  CHAT_DOCK_OVERLAY_TRANSITION,
  CHAT_THREAD_DIM_CLASS,
  creationFormIntroLabel,
} from '@/components/chat/chatDockOverlay';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInputV2 } from '@/components/chat/ChatInputV2';
import { StreamingWave } from '@/components/chat/StreamingWave';
import { ChatFollowUpList } from '@/components/chat/ChatFollowUpList';
import { V8_SUGGESTION_STAGGER_MS } from '@/types/chat-v8';
import { CharacterCreationCard } from '@/components/chat/CharacterCreationCard';
import { BackgroundCreationCard } from '@/components/chat/BackgroundCreationCard';
import { VideoCreationCard } from '@/components/chat/VideoCreationCard';
import { ProjectCreationCard } from '@/components/chat/ProjectCreationCard';
import { useAIStore } from '@/stores/ai-store';
import type { KiyokoMessage } from '@/hooks/useKiyokoChat';
import type { ChatQuestion } from '@/components/chat/ChatQuestionPrompt';
import {
  ChatSandboxEmptyState,
  getSandboxChipsForContext,
  getSandboxContextLabel,
  getSandboxPlaceholder,
  SANDBOX_CONTEXT_OPTIONS,
  type SandboxChatContext,
} from '@/components/chat/ChatSandboxEmptyState';
import { ChatContextStrip } from '@/components/chat/ChatContextStrip';
import { fetchActiveUserApiKeyCount } from '@/lib/chat/fetch-active-user-api-key-count';
import { getSandboxContextStripProps } from '@/lib/chat/sandbox-context-strip-mocks';

type CreationType = 'character' | 'background' | 'video' | 'project';
type ActiveCreation = { messageId: string; type: CreationType; prefill: Record<string, unknown> };

function nowMsg(
  role: 'user' | 'assistant',
  content: string,
  extra?: Partial<Pick<KiyokoMessage, 'creationCancelled'>>,
): KiyokoMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    ...extra,
  };
}

function block(type: string, data: unknown): string {
  return `[${type}]${JSON.stringify(data, null, 2)}[/${type.split(':')[0]}]`;
}

export function ChatSandboxView() {
  const { isCreating, creatingLabel } = useAIStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<KiyokoMessage[]>([]);
  const [sandboxContext, setSandboxContext] = useState<SandboxChatContext>('dashboard');

  const [showSuggestionChips, setShowSuggestionChips] = useState(false);

  const [activeCreation, setActiveCreation] = useState<ActiveCreation | null>(null);
  const [pendingCreation, setPendingCreation] = useState<ActiveCreation | null>(null);
  const dismissedCreationMessageIdsRef = useRef<Set<string>>(new Set());

  const [isStreamingFake, setIsStreamingFake] = useState(false);
  /** Onda “pensando / preparando” (no es escritura). Mientras tanto no hay texto typewriter. */
  const [sandboxThinking, setSandboxThinking] = useState<{ label: string } | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typewriterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultQuestion = useMemo((): ChatQuestion => ({
    title: 'Elige',
    prompt: '¿Qué quieres probar ahora?',
    options: [
      { id: 'clear_chat', label: 'Limpiar chat' },
      { id: 'simulate_streaming', label: 'Simular streaming' },
      { id: 'sample_text', label: 'Mensaje de ejemplo (solo texto)' },
    ],
    allowOther: true,
  }), []);

  const [inputQuestion, setInputQuestion] = useState<ChatQuestion | null>(null);

  const [userApiKeyCount, setUserApiKeyCount] = useState<number | null>(null);
  const [userApiKeyLoading, setUserApiKeyLoading] = useState(true);

  const sandboxStripProps = useMemo(() => getSandboxContextStripProps(sandboxContext), [sandboxContext]);

  useEffect(() => {
    let cancelled = false;
    setUserApiKeyLoading(true);
    void fetchActiveUserApiKeyCount()
      .then((n) => {
        if (!cancelled) setUserApiKeyCount(n);
      })
      .finally(() => {
        if (!cancelled) setUserApiKeyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showInputQuestion = useCallback(() => {
    setInputQuestion(defaultQuestion);
  }, [defaultQuestion]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const push = useCallback((msg: KiyokoMessage) => {
    setMessages((prev) => [...prev, msg]);
    scrollToEnd();
  }, [scrollToEnd]);

  const clearSandboxTimers = useCallback(() => {
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearSandboxTimers();
  }, [clearSandboxTimers]);

  /** Pensando (onda) → escritura tipo IA → bloque completo al terminar el intro. */
  const insertWithNaturalFlow = useCallback(
    (thinkingLabel: string, intro: string, rest: string) => {
      clearSandboxTimers();
      setSandboxThinking({ label: thinkingLabel });
      thinkingTimerRef.current = setTimeout(() => {
        setSandboxThinking(null);
        const messageId = crypto.randomUUID();
        push({
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        });
        setIsStreamingFake(true);
        let i = 0;
        const charMs = 14;
        const tick = () => {
          i += 1;
          const slice = intro.slice(0, i);
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, content: slice } : m)),
          );
          scrollToEnd();
          if (i < intro.length) {
            typewriterTimerRef.current = setTimeout(tick, charMs);
          } else {
            setIsStreamingFake(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId ? { ...m, content: `${intro}\n\n${rest}` } : m,
              ),
            );
            scrollToEnd();
          }
        };
        tick();
      }, 950);
    },
    [clearSandboxTimers, push, scrollToEnd],
  );

  /** Solo texto con fase pensar + typewriter (sin bloque rico al final). */
  const simulateAssistantTyping = useCallback(
    (thinkingLabel: string, fullText: string) => {
      clearSandboxTimers();
      setSandboxThinking({ label: thinkingLabel });
      thinkingTimerRef.current = setTimeout(() => {
        setSandboxThinking(null);
        const messageId = crypto.randomUUID();
        push({
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        });
        setIsStreamingFake(true);
        let i = 0;
        const charMs = 14;
        const tick = () => {
          i += 1;
          const slice = fullText.slice(0, i);
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, content: slice } : m)),
          );
          scrollToEnd();
          if (i < fullText.length) {
            typewriterTimerRef.current = setTimeout(tick, charMs);
          } else {
            setIsStreamingFake(false);
          }
        };
        tick();
      }, 900);
    },
    [clearSandboxTimers, push, scrollToEnd],
  );

  const onSend = useCallback((text: string, _files?: File[]) => {
    push(nowMsg('user', text));
    // Echo assistant to make it feel interactive (no IA).
    push(nowMsg('assistant', `Entendido: ${text}`));
  }, [push]);

  const onStop = useCallback(() => {
    clearSandboxTimers();
    setSandboxThinking(null);
    setIsStreamingFake(false);
    useAIStore.getState().setCreating(false);
  }, [clearSandboxTimers]);

  const onExecute = useCallback((messageId: string) => {
    push(nowMsg('assistant', `✅ (sandbox) Ejecutado plan para messageId=${messageId}`));
  }, [push]);

  const onCancelPlan = useCallback((messageId: string) => {
    push(nowMsg('assistant', `🛑 (sandbox) Cancelado plan para messageId=${messageId}`));
  }, [push]);

  const onModify = useCallback((text: string) => {
    push(nowMsg('user', text));
  }, [push]);

  const onUndo = useCallback((batchId: string) => {
    push(nowMsg('assistant', `↩️ (sandbox) Undo batch=${batchId}`));
  }, [push]);

  const onWorkflowAction = useCallback((actionId: string, label: string) => {
    push(nowMsg('assistant', `(sandbox) Workflow ${actionId}: ${label}`));
  }, [push]);

  const handleCreationCancel = useCallback(() => {
    if (!activeCreation) return;
    dismissedCreationMessageIdsRef.current.add(activeCreation.messageId);
    setActiveCreation(null);
    push(
      nowMsg('assistant', '', {
        creationCancelled: { subtitle: 'Puedes intentarlo de nuevo cuando quieras.' },
      }),
    );
  }, [activeCreation, push]);

  const handleCreationCreated = useCallback((msg: string) => {
    if (!activeCreation) return;
    dismissedCreationMessageIdsRef.current.add(activeCreation.messageId);
    push(nowMsg('assistant', msg));
    const messageId = activeCreation.messageId;
    setTimeout(() => setActiveCreation((cur) => (cur?.messageId === messageId ? null : cur)), 400);
  }, [activeCreation, push]);

  const contextEntities = useMemo(() => ({
    scenes: [
      { id: 'scene_1', label: 'Escena 1', sublabel: 'Hook', badge: '3s' },
      { id: 'scene_2', label: 'Escena 2', sublabel: 'Build', badge: '5s' },
    ],
    videos: [
      { id: 'video_1', label: 'Video 1', sublabel: 'Instagram Reels', badge: '30s' },
    ],
    characters: [
      { id: 'char_1', label: 'Luna', sublabel: 'protagonista' },
      { id: 'char_2', label: 'Kai', sublabel: 'secundario' },
    ],
    backgrounds: [
      { id: 'bg_1', label: 'Playa', sublabel: 'exterior · dia' },
      { id: 'bg_2', label: 'Café', sublabel: 'interior · noche' },
    ],
  }), []);

  const insert = useCallback((assistantContent: string) => {
    push(nowMsg('assistant', assistantContent));
  }, [push]);

  const clearChat = useCallback(() => {
    clearSandboxTimers();
    setSandboxThinking(null);
    setIsStreamingFake(false);
    setActiveCreation(null);
    setPendingCreation(null);
    useAIStore.getState().setCreating(false);
    dismissedCreationMessageIdsRef.current.clear();
    setMessages([]);
    setInputQuestion(null);
    setShowSuggestionChips(false);
  }, [clearSandboxTimers]);

  const isChatEmpty = messages.length === 0;
  const lastUserPromptForSkeleton = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return null;
  }, [messages]);
  const contextChips = useMemo(() => getSandboxChipsForContext(sandboxContext), [sandboxContext]);

  const handleSuggestionClick = useCallback((s: string) => {
    onSend(s);
  }, [onSend]);

  const handleEmptyAction = useCallback(
    (prompt: string) => {
      onSend(prompt);
    },
    [onSend],
  );

  /** Mientras “piensa” (onda), no marcamos el último mensaje como stream de texto. */
  const isStreaming = (isStreamingFake || isCreating) && !sandboxThinking;

  const handleCreateCardRequested = useCallback((payload: { messageId: string; type: CreationType; prefill: Record<string, unknown> }) => {
    if (dismissedCreationMessageIdsRef.current.has(payload.messageId)) return;
    if (activeCreation?.messageId === payload.messageId) return;
    if (pendingCreation?.messageId === payload.messageId) return;

    const next: ActiveCreation = { messageId: payload.messageId, type: payload.type, prefill: payload.prefill };

    if (isStreaming) {
      setPendingCreation(next);
      useAIStore.getState().setCreating(true, creationFormIntroLabel(payload.type));
      return;
    }
    setActiveCreation(next);
  }, [activeCreation?.messageId, pendingCreation?.messageId, isStreaming]);

  useEffect(() => {
    if (isStreaming) return;
    if (!pendingCreation) return;
    const payload = pendingCreation;
    const id = window.setTimeout(() => {
      setActiveCreation(payload);
      setPendingCreation(null);
      useAIStore.getState().setCreating(false);
    }, CREATION_FORM_HANDOFF_MS);
    return () => window.clearTimeout(id);
  }, [isStreaming, pendingCreation]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* Top controls */}
      <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-3 py-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground">Chat sandbox</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          sin peticiones a IA · la franja de contexto replica la de producción
        </span>

        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
          <span className="sr-only">Contexto</span>
          <span aria-hidden className="hidden sm:inline">Contexto</span>
          <select
            value={sandboxContext}
            onChange={(e) => setSandboxContext(e.target.value as SandboxChatContext)}
            className={cn(
              'h-7 min-w-34 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-ring/50',
            )}
          >
            {SANDBOX_CONTEXT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setShowSuggestionChips((v) => !v)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium border border-border transition-colors',
              showSuggestionChips
                ? 'text-foreground bg-accent border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
            title={showSuggestionChips ? 'Ocultar sugerencias rápidas' : 'Mostrar sugerencias rápidas en el chat'}
          >
            <Sparkles size={12} className="inline-block mr-1" />
            Sugerencias
          </button>
          <button
            type="button"
            onClick={showInputQuestion}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium border border-border',
              'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            )}
            title="Mostrar opciones sobre el input"
          >
            <CircleHelp size={12} className="inline-block mr-1" />
            Opciones input
          </button>
          <button
            type="button"
            onClick={() => {
              simulateAssistantTyping(
                'Pensando…',
                'Aquí tienes una respuesta de ejemplo: el texto aparece como si la IA estuviera escribiendo en vivo, sin bloques todavía.',
              );
            }}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium border border-border',
              'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            )}
          >
            <Plus size={12} className="inline-block mr-1" />
            Simular streaming
          </button>

          <button
            type="button"
            onClick={clearChat}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium border border-border',
              'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            )}
          >
            <Trash2 size={12} className="inline-block mr-1" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Block buttons */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-3 py-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={clearChat}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent text-muted-foreground"
        >
          Limpiar chat
        </button>
        <button
          type="button"
          onClick={() => insert(
            '### Selecciona una o varias opciones\n\n'
            + 'Te muestro el editor abajo; este texto se queda en el chat.\n\n'
            + '☐ Opción A\n☐ Opción B\n☐ Opción C',
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          CHOICES
        </button>
        <button
          type="button"
          onClick={() => insert(
            `${block('OPTIONS', ['Instagram', 'TikTok', 'YouTube'])}`,
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          OPTIONS
        </button>
        <button
          type="button"
          onClick={() => insert(
            `${block('SELECT:character', {})}`,
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          SELECT
        </button>
        <button
          type="button"
          onClick={() => insert(
            `${block('PREVIEW:character', { name: 'Luna', role: 'protagonista', description: 'Heroína de verano' })}`,
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          PREVIEW
        </button>
        <button
          type="button"
          onClick={() => insert(`Aquí tienes un plan.\n\n\`\`\`json\n${JSON.stringify({
            type: 'action_plan',
            summary_es: 'Crear 2 escenas y actualizar un prompt.',
            total_scenes_affected: 2,
            warnings: ['Revisar duraciones antes de guardar'],
            actions: [
              { id: 'a1', type: 'create_scene', table: 'scenes', data: { title: 'Hook', duration_seconds: 3 } },
              { id: 'a2', type: 'update_prompt', table: 'scene_prompts', data: { prompt_image: 'cinematic, soft light' } },
            ],
          }, null, 2)}\n\`\`\``)}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          ACTION_PLAN
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Preparando creador de personaje…',
              'Voy a abrir el formulario de personaje para que revises o completes los datos.',
              `[CREATE:character]{"name":"Luna","role":"protagonista"}[/CREATE:character]`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          CREATE personaje
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Preparando editor de fondo…',
              'Te muestro el editor de fondos para definir locación y ambiente.',
              `[CREATE:background]{"name":"Playa","time_of_day":"dia","location_type":"exterior"}[/CREATE:background]`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          CREATE fondo
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Preparando asistente de video…',
              'Abro el asistente para crear un video: plataforma, duración y título.',
              `[CREATE:video]{"title":"Summer Sale","platform":"instagram_reels","target_duration_seconds":30}[/CREATE:video]`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          CREATE video
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Preparando asistente de proyecto…',
              'Abro el formulario para crear un proyecto: título, cliente y estilo.',
              `[CREATE:project]{"title":"Mi campaña","description":"","client_name":"","style":"pixar"}[/CREATE:project]`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          CREATE proyecto
        </button>
        <button
          type="button"
          onClick={() => insert(
            `${block('DIFF:title', { field: 'Título', before: 'Hola', after: 'Hola mundo' })}`,
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          DIFF
        </button>
        <button
          type="button"
          onClick={() => insert(
            `${block('PROMPT_PREVIEW:image', { prompt_type: 'image', prompt_en: 'cinematic portrait, soft light', scene_number: 1, scene_title: 'Hook' })}`,
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          PROMPT_PREVIEW
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Montando plan de escenas…',
              'Te muestro el plan de escenas propuesto con duraciones y fases narrativas.',
              `${block('SCENE_PLAN', [
                { scene_number: 1, title: 'Hook', duration: 3, arc_phase: 'hook', description: 'Presentación rápida' },
                { scene_number: 2, title: 'Build', duration: 5, arc_phase: 'build', description: 'Contexto + oferta' },
              ])}`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          SCENE_PLAN
        </button>
        <button
          type="button"
          onClick={() => insert(`${block('SCENE_DETAIL', {
            scene_number: 1,
            title: 'Hook',
            description: 'Aparece el personaje en la playa con un texto de oferta.',
            duration_seconds: 3,
            arc_phase: 'hook',
            characters: [{ name: 'Luna', role: 'protagonista' }],
            background: { name: 'Playa', time_of_day: 'dia', angle: 'wide shot' },
            camera: { camera_angle: 'wide', camera_movement: 'slow push-in', lighting: 'golden', mood: 'happy' },
            prompt_image: 'wide shot, beach, golden hour, smiling protagonist',
            prompt_video: 'slow push-in, beach, warm light, upbeat energy',
          })}`)}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          SCENE_DETAIL
        </button>
        <button
          type="button"
          onClick={() => insert(`${block('RESOURCE_LIST', {
            type: 'characters',
            characters: [
              { name: 'Luna', role: 'protagonista', prompt_snippet: 'young woman, beach outfit' },
              { name: 'Kai', role: 'secundario' },
            ],
          })}`)}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          RESOURCE_LIST
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Generando resumen…',
              'Generando el resumen del proyecto con el estado de videos, escenas y prompts.',
              `${block('PROJECT_SUMMARY', { title: 'Proyecto Demo', video_count: 1, scene_count: 2, character_count: 2, background_count: 2, prompts_done: 1, prompts_total: 4, warnings: ['Faltan prompts de video'] })}`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          PROJECT_SUMMARY
        </button>
        <button
          type="button"
          onClick={() =>
            insertWithNaturalFlow(
              'Preparando resumen de video…',
              'Aquí va el resumen de este video: escenas, recursos y prompts listos.',
              `${block('VIDEO_SUMMARY', { title: 'Video Demo', scene_count: 2, character_names: ['Luna'], background_names: ['Playa'], prompts_image_done: 1, prompts_video_done: 0, prompts_total: 4, has_narration: false })}`,
            )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          VIDEO_SUMMARY
        </button>
        <button
          type="button"
          onClick={() => insert(
            `Acciones rápidas disponibles.\n\n[WORKFLOW: export_video|Exportar video, regenerate_prompts|Regenerar prompts]`,
          )}
          className="px-2.5 py-1 rounded-md text-[11px] border border-border hover:bg-accent"
        >
          WORKFLOW
        </button>
      </div>

      <ChatContextStrip
        contextLevel={sandboxStripProps.contextLevel}
        projectTitle={sandboxStripProps.projectTitle}
        videoTitle={sandboxStripProps.videoTitle}
        sceneLabel={sandboxStripProps.sceneLabel}
        projectLoading={sandboxStripProps.projectLoading}
        stats={sandboxStripProps.stats}
        statsLoading={sandboxStripProps.statsLoading}
        dashboardStats={sandboxStripProps.dashboardStats}
        dashboardStatsLoading={sandboxStripProps.dashboardStatsLoading}
        userApiKeyCount={userApiKeyCount}
        userApiKeyLoading={userApiKeyLoading}
      />

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-h-0 pt-2 px-3 sm:px-5">
        <div
          className={cn(
            'flex-1 overflow-y-auto min-h-0 px-6 sm:px-8 pt-4 pb-4 space-y-4 overscroll-contain relative z-0 transition-opacity duration-200',
            (activeCreation || pendingCreation) && CHAT_THREAD_DIM_CLASS,
          )}
        >
          {isChatEmpty ? (
            <ChatSandboxEmptyState context={sandboxContext} onAction={handleEmptyAction} />
          ) : (
            messages.map((m, idx) => (
              <ChatMessage
                key={m.id}
                message={m}
                activeAgent="sandbox"
                isLastMessage={idx === messages.length - 1}
                isStreaming={isStreaming}
                hideCreateCards
                onCreateCardRequested={handleCreateCardRequested}
                contextEntities={contextEntities}
                onExecute={(messageId, plan) => {
                  void plan;
                  onExecute(messageId);
                }}
                onCancel={(messageId) => onCancelPlan(messageId)}
                onModify={onModify}
                onSend={(text) => onSend(text)}
                onUndo={onUndo}
                onWorkflowAction={onWorkflowAction}
                userPromptHint={lastUserPromptForSkeleton}
              />
            ))
          )}

          {showSuggestionChips && !isChatEmpty && !isStreaming && !isCreating && !sandboxThinking && !activeCreation && !pendingCreation && (
            <div className="pl-1 sm:pl-2 max-w-[min(100%,42rem)]">
              <ChatFollowUpList
                title="Sugerencias"
                items={contextChips}
                staggerMs={V8_SUGGESTION_STAGGER_MS}
                onSelect={(s) => handleSuggestionClick(s)}
              />
            </div>
          )}

          {(sandboxThinking || (isCreating && creatingLabel)) && (
            <StreamingWave label={sandboxThinking?.label ?? creatingLabel ?? '…'} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Compositor unificado: formulario + input, un solo borde */}
        <div
          className={cn(
            'shrink-0 relative z-20',
            CHAT_COMPOSER_MAX_WIDTH_CLASS,
            activeCreation ? 'px-3 pb-3' : '',
          )}
        >
          {activeCreation ? (
            <div className={CHAT_COMPOSER_UNIFIED_SHELL_CLASS}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeCreation.type}-${activeCreation.messageId}`}
                  className={cn(CHAT_CREATION_DOCK_CLASS, 'shrink-0 flex flex-col')}
                  initial={CHAT_DOCK_OVERLAY_INITIAL}
                  animate={CHAT_DOCK_OVERLAY_ANIMATE}
                  exit={CHAT_DOCK_OVERLAY_EXIT}
                  transition={CHAT_DOCK_OVERLAY_TRANSITION}
                >
                  {activeCreation.type === 'character' && (
                    <CharacterCreationCard
                      dock
                      sandbox
                      projectId={undefined}
                      prefill={{
                        name: String(activeCreation.prefill.name ?? ''),
                        role: String(activeCreation.prefill.role ?? 'protagonista'),
                        description: String(activeCreation.prefill.description ?? ''),
                        personality: String(activeCreation.prefill.personality ?? ''),
                        visual_description: String(activeCreation.prefill.visual_description ?? ''),
                      }}
                      onCreated={handleCreationCreated}
                      onCancel={handleCreationCancel}
                    />
                  )}
                  {activeCreation.type === 'background' && (
                    <BackgroundCreationCard
                      dock
                      sandbox
                      projectId={undefined}
                      prefill={{
                        name: String(activeCreation.prefill.name ?? ''),
                        location_type: String(activeCreation.prefill.location_type ?? 'exterior'),
                        time_of_day: String(activeCreation.prefill.time_of_day ?? 'dia'),
                        description: String(activeCreation.prefill.description ?? ''),
                      }}
                      onCreated={handleCreationCreated}
                      onCancel={handleCreationCancel}
                    />
                  )}
                  {activeCreation.type === 'video' && (
                    <VideoCreationCard
                      dock
                      sandbox
                      projectId={undefined}
                      prefill={{
                        title: String(activeCreation.prefill.title ?? ''),
                        platform: String(activeCreation.prefill.platform ?? 'instagram_reels'),
                        target_duration_seconds: activeCreation.prefill.target_duration_seconds
                          ? Number(activeCreation.prefill.target_duration_seconds)
                          : undefined,
                        description: String(activeCreation.prefill.description ?? ''),
                      }}
                      onCreated={handleCreationCreated}
                      onCancel={handleCreationCancel}
                    />
                  )}
                  {activeCreation.type === 'project' && (
                    <ProjectCreationCard
                      dock
                      sandbox
                      prefill={{
                        title: String(activeCreation.prefill.title ?? ''),
                        description: String(activeCreation.prefill.description ?? ''),
                        client_name: String(activeCreation.prefill.client_name ?? ''),
                        style: String(activeCreation.prefill.style ?? 'pixar'),
                      }}
                      onCreated={handleCreationCreated}
                      onCancel={handleCreationCancel}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <ChatInputV2
                onSend={onSend}
                onStop={onStop}
                isStreaming={isStreaming}
                activeProvider={null}
                allowFiles
                placeholder={
                  activeCreation || isCreating
                    ? (creatingLabel ?? 'Creando...')
                    : getSandboxPlaceholder(sandboxContext)
                }
                contextLabel={getSandboxContextLabel(sandboxContext)}
                disableProvidersFetch
                creationDockOpen
                dockTail
                embeddedInComposer
                question={inputQuestion}
                onQuestionSkip={() => setInputQuestion(null)}
                onQuestionAnswer={(ans) => {
                  if (ans.id === 'clear_chat') {
                    clearChat();
                    return;
                  }
                  if (ans.id === 'simulate_streaming') {
                    setInputQuestion(null);
                    simulateAssistantTyping(
                      'Pensando…',
                      'Respuesta simulada: así se vería el texto mientras la IA escribe, sin usar la API.',
                    );
                    return;
                  }
                  if (ans.id === 'sample_text') {
                    insert('Mensaje de ejemplo del asistente (solo texto, sin bloques).');
                    setInputQuestion(null);
                    return;
                  }
                  setInputQuestion(null);
                }}
              />
            </div>
          ) : (
            <ChatInputV2
              onSend={onSend}
              onStop={onStop}
              isStreaming={isStreaming}
              activeProvider={null}
              allowFiles
              placeholder={
                activeCreation || isCreating
                  ? (creatingLabel ?? 'Creando...')
                  : getSandboxPlaceholder(sandboxContext)
              }
              contextLabel={getSandboxContextLabel(sandboxContext)}
              disableProvidersFetch
              creationDockOpen={false}
              dockTail={false}
              embeddedInComposer={false}
              question={inputQuestion}
              onQuestionSkip={() => setInputQuestion(null)}
              onQuestionAnswer={(ans) => {
                if (ans.id === 'clear_chat') {
                  clearChat();
                  return;
                }
                if (ans.id === 'simulate_streaming') {
                  setInputQuestion(null);
                  simulateAssistantTyping(
                    'Pensando…',
                    'Respuesta simulada: así se vería el texto mientras la IA escribe, sin usar la API.',
                  );
                  return;
                }
                if (ans.id === 'sample_text') {
                  insert('Mensaje de ejemplo del asistente (solo texto, sin bloques).');
                  setInputQuestion(null);
                  return;
                }
                setInputQuestion(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

