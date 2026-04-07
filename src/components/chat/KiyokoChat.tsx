'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useKiyokoChat } from '@/hooks/useKiyokoChat';
import type { KiyokoMessage } from '@/hooks/useKiyokoChat';
import { useAIStore } from '@/stores/ai-store';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { CharacterCreationCard } from '@/components/chat/CharacterCreationCard';
import { BackgroundCreationCard } from '@/components/chat/BackgroundCreationCard';
import { VideoCreationCard } from '@/components/chat/VideoCreationCard';
import { ProjectCreationCard } from '@/components/chat/ProjectCreationCard';
import { KiyokoHeader } from '@/components/kiyoko/KiyokoHeader';
import { KiyokoEmptyState } from '@/components/kiyoko/KiyokoEmptyState';
import { StreamingWave } from '@/components/chat/StreamingWave';
import { ChatFollowUpList } from '@/components/chat/ChatFollowUpList';
import { V8_SUGGESTION_STAGGER_MS } from '@/types/chat-v8';
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
import { createClient } from '@/lib/supabase/client';
import { resolveNextStepRoute } from '@/lib/chat/resolve-next-step-route';
import { buildContextClientHint } from '@/lib/chat/build-context-client-hint';
import {
  fetchDashboardContextStats,
  type DashboardContextStatsLite,
} from '@/lib/chat/fetch-dashboard-context-stats';
import { fetchProjectContextStats, type ProjectContextStatsLite } from '@/lib/chat/fetch-project-context-stats';
import { fetchActiveUserApiKeyCount } from '@/lib/chat/fetch-active-user-api-key-count';
import {
  fetchProfileCreativeContext,
  type ProfileCreativeContextLite,
} from '@/lib/chat/fetch-profile-creative-context';
import { ChatContextStrip } from '@/components/chat/ChatContextStrip';
import type { CreationSaveContext } from '@/types/chat-v8';
import type { AiActionPlan } from '@/types/ai-actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KiyokoChatProps {
  mode: 'panel' | 'expanded';
  onClose?: () => void;
  projectSlug?: string;
}

const LAST_CONVERSATION_KEY = 'kiyoko-last-conversation-id';
const HISTORY_WIDTH_KEY = 'kiyoko-history-width';
const HISTORY_OPEN_KEY = 'kiyoko-history-open';

// ---------------------------------------------------------------------------
// KiyokoChat
// ---------------------------------------------------------------------------

export function KiyokoChat({ mode, onClose, projectSlug: projectSlugProp }: KiyokoChatProps) {
  const pathname = usePathname();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [sceneLabel, setSceneLabel] = useState<string | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectContextStatsLite | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [userApiKeyCount, setUserApiKeyCount] = useState<number | null>(null);
  const [userApiKeyLoading, setUserApiKeyLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardContextStatsLite | null>(null);
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(false);
  const [profileCreative, setProfileCreative] = useState<ProfileCreativeContextLite | null>(null);

  const [historyWidth, setHistoryWidth] = useState(() => {
    if (typeof window === 'undefined') return 240;
    const saved = localStorage.getItem(HISTORY_WIDTH_KEY);
    if (saved) {
      const w = parseInt(saved, 10);
      if (!isNaN(w)) return w;
    }
    return 320;
  });

  const {
    messages,
    isStreaming,
    isThinking,
    conversationId,
    conversations,
    suggestions,
    sendMessage,
    stopStreaming,
    activeProvider,
    executeActionPlan,
    cancelActionPlan,
    undoBatch,
    loadConversation,
    loadConversations,
    startNewConversation,
    setProject,
    setContext,
    clearSuggestions,
    persistConversationNow,
    projectId: chatProjectId,
    projectSlug: projectSlugStore,
    videoId: chatVideoId,
    sceneId: chatSceneId,
    contextLevel: chatContextLevel,
  } = useKiyokoChat();

  const isExpandedMode = mode === 'expanded';
  const [historyOpen, setHistoryOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return mode === 'expanded';
    const saved = localStorage.getItem(HISTORY_OPEN_KEY);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return mode === 'expanded';
  });
  const activeAgent = useAIStore((s) => s.activeAgent);
  const sidebarWidth = useAIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAIStore((s) => s.setSidebarWidth);

  // ---- Creation overlay (no debe renderizar dentro del historial) ----
  type CreationType = 'character' | 'background' | 'video' | 'project';
  type ActiveCreation = {
    messageId: string;
    type: CreationType;
    prefill: Record<string, unknown>;
  };

  const [activeCreation, setActiveCreation] = useState<ActiveCreation | null>(null);
  /** Formulario listo pero aún no montado: la IA sigue escribiendo el mensaje (stream). */
  const [pendingCreation, setPendingCreation] = useState<ActiveCreation | null>(null);
  const dismissedCreationMessageIdsRef = useRef<Set<string>>(new Set());

  // ---- Context change note (scene switch indicator) ----
  const [contextChangeNote, setContextChangeNote] = useState<string | null>(null);
  const prevSceneRef = useRef<string | null>(null);

  const defaultNextSteps = useCallback((t: CreationType): string[] => {
    switch (t) {
      case 'character':
        return ['Ver personaje', 'Subir imagen referencia', 'Regenerar prompt', 'Personajes', 'Tareas'];
      case 'background':
        return ['Ver fondo', 'Subir referencia', 'Regenerar prompt', 'Fondos', 'Tareas'];
      case 'video':
        return ['Ver vídeo', 'Escenas', 'Tareas', 'Ajustes del proyecto'];
      case 'project':
        return ['Abrir proyecto', 'Crear vídeo', 'Añadir personaje', 'Tareas'];
      default:
        return ['Tareas', 'Volver al proyecto'];
    }
  }, []);

  const parseCreatedEntityName = useCallback((msg: string): string => {
    const m =
      msg.match(/Personaje "([^"]+)"/)
      ?? msg.match(/Fondo "([^"]+)"/)
      ?? msg.match(/Video "([^"]+)"/)
      ?? msg.match(/Proyecto "([^"]+)"/i);
    return (m?.[1] ?? 'Recurso').trim();
  }, []);

  const injectAssistantMessage = useCallback(
    (partial: Partial<KiyokoMessage> & Pick<KiyokoMessage, 'content'>) => {
      const { messages: currentMessages } = useKiyokoChat.getState();
      const assistantMsg: KiyokoMessage = {
        ...partial,
        id: partial.id ?? crypto.randomUUID(),
        role: 'assistant',
        content: partial.content,
        timestamp: partial.timestamp ?? new Date(),
        creationSuccess: partial.creationSuccess,
      };
      useKiyokoChat.setState({
        messages: [...currentMessages, assistantMsg],
      });
      clearSuggestions();
      void persistConversationNow();
    },
    [clearSuggestions, persistConversationNow],
  );

  const injectAssistantNotice = useCallback(
    (text: string) => {
      injectAssistantMessage({ content: text });
    },
    [injectAssistantMessage],
  );

  const handleCreateCardRequested = useCallback((payload: {
    messageId: string;
    type: 'character' | 'background' | 'video' | 'project';
    prefill: Record<string, unknown>;
  }) => {
    const dismissed = dismissedCreationMessageIdsRef.current.has(payload.messageId);
    if (dismissed) return;
    if (activeCreation?.messageId === payload.messageId) return;
    if (pendingCreation?.messageId === payload.messageId) return;

    const next: ActiveCreation = {
      messageId: payload.messageId,
      type: payload.type,
      prefill: payload.prefill,
    };

    if (isStreaming) {
      setPendingCreation(next);
      useAIStore.getState().setCreating(true, creationFormIntroLabel(payload.type));
      return;
    }
    setActiveCreation(next);
  }, [isStreaming, activeCreation?.messageId, pendingCreation?.messageId]);

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

  const handleActiveCreationCancel = useCallback(() => {
    if (!activeCreation) return;
    dismissedCreationMessageIdsRef.current.add(activeCreation.messageId);
    setActiveCreation(null);
    injectAssistantMessage({
      content: '',
      creationCancelled: { subtitle: 'Puedes intentarlo de nuevo cuando quieras.' },
    });
  }, [activeCreation, injectAssistantMessage]);

  const handleActiveCreationCreated = useCallback((msg: string, ctx?: CreationSaveContext) => {
    if (!activeCreation) return;
    dismissedCreationMessageIdsRef.current.add(activeCreation.messageId);
    const name = parseCreatedEntityName(msg);
    const t = activeCreation.type;
    const badge =
      t === 'character' ? 'CHARACTER'
      : t === 'background' ? 'BACKGROUND'
      : t === 'video' ? 'VIDEO'
      : 'PROJECT';
    const entityLabel =
      t === 'character' ? 'Personaje'
      : t === 'background' ? 'Fondo'
      : t === 'video' ? 'Vídeo'
      : 'Proyecto';
    const createdEntityKind =
      t === 'character' ? 'character'
      : t === 'background' ? 'background'
      : t === 'video' ? 'video'
      : 'project';
    injectAssistantMessage({
      content: '',
      creationSuccess: {
        name,
        entityLabel,
        badge,
        nextSteps: defaultNextSteps(t),
        createdEntityKind,
        entityId: ctx?.entityId,
        videoShortId: ctx?.videoShortId,
        projectShortId: ctx?.projectShortId,
      },
    });

    if (t === 'project' && ctx?.projectShortId?.trim()) {
      router.push(`/project/${ctx.projectShortId.trim()}`);
    }

    const messageId = activeCreation.messageId;
    setTimeout(() => {
      setActiveCreation((cur) => (cur?.messageId === messageId ? null : cur));
    }, 2500);
  }, [activeCreation, defaultNextSteps, injectAssistantMessage, parseCreatedEntityName, router]);

  // UX: el chat no debe hacerse ilegible por culpa del historial.
  const CHAT_MIN_WIDTH = 450;
  // El separador/“strip” visible debe ser fino para que no se note separación.
  // `w-px` = 1px.
  const RESIZE_HANDLE_WIDTH = 1;
  // No ponemos un mínimo rígido: si el panel lateral es más estrecho,
  // el clamp permitirá que el historial baje por debajo de este valor.
  const HISTORY_MIN_WIDTH = 160;

  const clampHistoryWidth = useCallback((w: number) => {
    if (typeof window === 'undefined') return w;

    // Historial máximo = 75% del viewport
    const capByPercent = window.innerWidth * 0.75;
    // Historial máximo para mantener chat >= 450px EXCLUYENDO el separador
    // (limitado por viewport)
    const capByChatViewport = window.innerWidth - (CHAT_MIN_WIDTH + RESIZE_HANDLE_WIDTH);
    // Historial máximo para mantener chat >= 450px dentro del panel real
    const capByChatPanel = sidebarWidth - (CHAT_MIN_WIDTH + RESIZE_HANDLE_WIDTH);

    const maxAllowed = Math.floor(Math.min(capByPercent, capByChatViewport, capByChatPanel));
    if (maxAllowed <= 0) return 0;

    // Si el viewport no permite ni 450px de chat + historial mínimo, degradamos
    // (mejor que desbordar/romper el layout).
    if (maxAllowed < HISTORY_MIN_WIDTH) return Math.floor(Math.min(maxAllowed, w));

    return Math.floor(Math.max(HISTORY_MIN_WIDTH, Math.min(maxAllowed, w)));
  }, [sidebarWidth]);

  const handleHistoryToggle = useCallback(() => {
    // Sólo tiene sentido en expanded mode, pero lo protegemos igual.
    if (!isExpandedMode) return;
    setHistoryOpen((v) => !v);
  }, [isExpandedMode]);

  // ---- Parse URL context ----
  const projectShortId = useMemo(() => {
    const m = pathname.match(/\/project\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  /** Slug del proyecto en URL: prop explícita > store > segmento actual. */
  const effectiveProjectShortId = useMemo(() => {
    const fromProp = projectSlugProp?.trim();
    if (fromProp) return fromProp;
    if (projectSlugStore) return projectSlugStore;
    return projectShortId;
  }, [projectSlugProp, projectSlugStore, projectShortId]);

  const videoShortId = useMemo(() => {
    const m = pathname.match(/\/video\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const sceneShortId = useMemo(() => {
    const m = pathname.match(/\/scene\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  // ---- Context label + type ----
  const contextLabel = useMemo(() => {
    if (videoTitle) return videoTitle;
    if (projectTitle) return projectTitle;
    return 'Dashboard';
  }, [videoTitle, projectTitle]);

  const contextType = useMemo((): 'dashboard' | 'project' | 'video' | 'scene' => {
    if (sceneShortId && videoShortId) return 'scene';
    if (videoShortId) return 'video';
    if (projectShortId) return 'project';
    return 'dashboard';
  }, [sceneShortId, videoShortId, projectShortId]);

  const projectLoadingStrip = Boolean(projectShortId && !projectTitle);

  useEffect(() => {
    if (!chatProjectId) {
      setProjectStats(null);
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    let cancelled = false;
    void fetchProjectContextStats(chatProjectId, chatVideoId)
      .then((s) => {
        if (!cancelled) setProjectStats(s);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chatProjectId, chatVideoId]);

  useEffect(() => {
    if (chatProjectId) {
      setDashboardStats(null);
      setDashboardStatsLoading(false);
      return;
    }
    setDashboardStatsLoading(true);
    let cancelled = false;
    void fetchDashboardContextStats()
      .then((s) => {
        if (!cancelled) setDashboardStats(s);
      })
      .finally(() => {
        if (!cancelled) setDashboardStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chatProjectId]);

  /** Al volver a la pestaña, refrescar conteos (tareas, BYOK) sin spinner completo. */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (chatProjectId) {
        void fetchProjectContextStats(chatProjectId, chatVideoId).then(setProjectStats);
      } else {
        void fetchDashboardContextStats().then(setDashboardStats);
      }
      void fetchActiveUserApiKeyCount().then(setUserApiKeyCount);
      void fetchProfileCreativeContext().then(setProfileCreative);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [chatProjectId, chatVideoId]);

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

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetchProfileCreativeContext().then((p) => {
        if (!cancelled) setProfileCreative(p);
      });
    };
    load();
    const onProfileUpdated = () => load();
    window.addEventListener('kiyoko-profile-updated', onProfileUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('kiyoko-profile-updated', onProfileUpdated);
    };
  }, []);

  const clientHintForApi = useMemo(
    () =>
      buildContextClientHint({
        contextLevel: chatContextLevel,
        projectTitle,
        videoTitle,
        sceneLabel,
        projectId: chatProjectId,
        videoId: chatVideoId,
        sceneId: chatSceneId,
        stats: projectStats,
        dashboardStats: chatProjectId ? null : dashboardStats,
        activeUserApiKeyCount: userApiKeyCount,
        profileCreative,
      }),
    [
      chatContextLevel,
      projectTitle,
      videoTitle,
      sceneLabel,
      chatProjectId,
      chatVideoId,
      chatSceneId,
      projectStats,
      dashboardStats,
      userApiKeyCount,
      profileCreative,
    ],
  );

  useEffect(() => {
    useKiyokoChat.setState({ contextClientHint: clientHintForApi });
  }, [clientHintForApi]);

  useEffect(() => {
    if (!sceneShortId) {
      setSceneLabel(null);
      return;
    }
    const supabase = createClient();
    void supabase
      .from('scenes')
      .select('scene_number, title')
      .eq('short_id', sceneShortId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setSceneLabel(null);
          return;
        }
        const num = data.scene_number ?? '?';
        const t = (data.title as string)?.trim();
        setSceneLabel(`#${num}${t ? ` · ${t}` : ''}`);
      });
  }, [sceneShortId]);

  const contextStrip = (
    <ChatContextStrip
      contextLevel={chatContextLevel}
      projectTitle={projectTitle}
      videoTitle={videoTitle}
      sceneLabel={sceneLabel}
      projectLoading={projectLoadingStrip}
      stats={chatProjectId ? projectStats : null}
      statsLoading={Boolean(chatProjectId && statsLoading)}
      dashboardStats={chatProjectId ? null : dashboardStats}
      dashboardStatsLoading={Boolean(!chatProjectId && dashboardStatsLoading)}
      userApiKeyCount={userApiKeyCount}
      userApiKeyLoading={userApiKeyLoading}
    />
  );

  // ---- Persist historyWidth ----
  useEffect(() => {
    localStorage.setItem(HISTORY_WIDTH_KEY, historyWidth.toString());
  }, [historyWidth]);

  // ---- Persist history open state ----
  useEffect(() => {
    localStorage.setItem(HISTORY_OPEN_KEY, String(historyOpen));
  }, [historyOpen]);

  // Clamp para que siempre respetemos:
  // - historial <= 75vw
  // - chat >= 450px (si el viewport lo permite)
  useEffect(() => {
    setHistoryWidth((w) => clampHistoryWidth(w));
  }, [clampHistoryWidth]);

  // ---- Fetch project info from URL ----
  useEffect(() => {
    const supabase = createClient();
    const query = projectShortId
      ? supabase.from('projects').select('id, title, slug').eq('short_id', projectShortId).single()
      : Promise.resolve({ data: null });

    query.then(({ data }) => {
      setProjectTitle(data ? (data.title as string) : null);
      if (data) {
        setProject(data.id as string, data.slug as string);
        // Only set project-level context if we're not in a video (video effect will override)
        if (!videoShortId) setContext('project', null, null);
      } else {
        setProject(null, null);
        if (!videoShortId) {
          setContext('dashboard', null, null);
        }
      }
    });
  }, [projectShortId, videoShortId, setProject, setContext]);

  // ---- Fetch video info from URL + update context level ----
  // RULE (Section 16): New conversation every time user enters a video.
  // Context is always fresh — old conversations are saved but NOT restored.
  const prevVideoRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const videoQuery = videoShortId
      ? supabase.from('videos').select('id, title').eq('short_id', videoShortId).single()
      : Promise.resolve({ data: null });

    videoQuery.then(async ({ data: videoData }) => {
      setVideoTitle(videoData ? (videoData.title as string) : null);

      if (videoData) {
        // Fresh conversation ONLY when switching between videos (not when leaving to project)
        if (prevVideoRef.current && prevVideoRef.current !== videoShortId) {
          startNewConversation();
        }
        prevVideoRef.current = videoShortId ?? null;

        // If we have a scene in the URL, resolve its ID and set scene context
        if (sceneShortId) {
          const { data: sceneData } = await supabase
            .from('scenes')
            .select('id')
            .eq('short_id', sceneShortId)
            .single();
          setContext('scene', videoData.id as string, sceneData?.id as string ?? null);

          // Show context change note when switching scenes
          if (prevSceneRef.current && prevSceneRef.current !== sceneShortId) {
            setContextChangeNote('Has cambiado a otra escena');
            setTimeout(() => setContextChangeNote(null), 5000);
          }
          prevSceneRef.current = sceneShortId;
        } else {
          prevSceneRef.current = null;
          setContext('video', videoData.id as string, null);
        }
      } else if (!projectShortId) {
        prevVideoRef.current = null;
        setContext('dashboard', null, null);
      }
    });
  }, [videoShortId, sceneShortId, projectShortId, setContext, startNewConversation]);

  // ---- Load conversations on mount ----
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ---- Persist active conversationId ----
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(LAST_CONVERSATION_KEY, conversationId);
    }
  }, [conversationId]);

  // ---- Auto scroll ----
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: isNewMessage ? 'smooth' : 'instant',
    });
  }, [messages]);

  // ---- Handlers ----
  // ---- Detect navigation commands and navigate instantly ----
  const tryNavigate = useCallback((text: string): boolean => {
    const { videoCuts } = useKiyokoChat.getState();
    const projectShortId = pathname.match(/\/project\/([^/]+)/)?.[1];
    if (!projectShortId || !videoCuts.length) return false;

    const trimmed = text.trim();
    const prefixMatch = trimmed.match(/^(entra en|ir a|abre|abrir|go to|open|selecciona|seleccionar|abrelo|abreme)\s+(.+)$/i);

    // With prefix: always try navigation
    // Without prefix: only try if the text closely matches a video title (min 3 words overlap)
    const query = (prefixMatch ? prefixMatch[2] : trimmed).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"]/g, '');

    const video = videoCuts.find((v) => {
      const t = v.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (t.includes(query) || query.includes(t)) return true;
      // Partial match: all words of query must be in title
      const words = query.split(/\s+/).filter((w) => w.length > 2);
      return words.length >= 1 && words.every((w) => t.includes(w));
    });

    if (video) {
      // Without prefix, require strong match (at least 60% of title words matched)
      if (!prefixMatch) {
        const titleWords = video.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
        const queryWords = query.split(/\s+/).filter((w) => w.length > 2);
        const matchCount = titleWords.filter((tw) => queryWords.some((qw) => tw.includes(qw) || qw.includes(tw))).length;
        if (matchCount < titleWords.length * 0.5) return false;
      }

      const { messages: msgs } = useKiyokoChat.getState();
      const userMsg: KiyokoMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
      const assistantMsg: KiyokoMessage = {
        id: crypto.randomUUID(), role: 'assistant',
        content: `Abriendo "${video.title}"...`,
        timestamp: new Date(),
      };
      useKiyokoChat.setState({ messages: [...msgs, userMsg, assistantMsg] });
      void persistConversationNow();
      router.push(`/project/${projectShortId}/video/${video.short_id}`);
      return true;
    }

    return false;
  }, [pathname, router]);

  // ---- Smart command handler: fetch data from Supabase and show components ----
  const trySmartCommand = useCallback(async (text: string): Promise<boolean> => {
    const t = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const supabase = createClient();
    const { projectId: pid } = useKiyokoChat.getState();
    if (!pid) return false;

    const inject = (userText: string, assistantContent: string) => {
      const { messages: msgs } = useKiyokoChat.getState();
      useKiyokoChat.setState({
        messages: [
          ...msgs,
          { id: crypto.randomUUID(), role: 'user' as const, content: userText, timestamp: new Date() },
          { id: crypto.randomUUID(), role: 'assistant' as const, content: assistantContent, timestamp: new Date() },
        ],
      });
      void persistConversationNow();
    };

    // ---- "muestrame los personajes" / "ver personajes" ----
    if (/^(muestr|ver|show|lista).*(personaje|character)/i.test(t)) {
      const { data } = await supabase.from('characters')
        .select('id, name, role, prompt_snippet, reference_image_url')
        .eq('project_id', pid).order('name');
      const chars = (data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id, name: c.name, role: c.role,
        prompt_snippet: c.prompt_snippet, image_url: c.reference_image_url,
      }));
      inject(text, `${chars.length} personaje${chars.length !== 1 ? 's' : ''} en el proyecto:\n\n[RESOURCE_LIST]\n${JSON.stringify({ type: 'characters', characters: chars })}\n[/RESOURCE_LIST]`);
      return true;
    }

    // ---- "muestrame los fondos" / "ver fondos" ----
    if (/^(muestr|ver|show|lista).*(fondo|background|locacion)/i.test(t)) {
      const { data } = await supabase.from('backgrounds')
        .select('id, name, location_type, time_of_day, prompt_snippet, reference_image_url')
        .eq('project_id', pid).order('name');
      const bgs = (data ?? []).map((b: Record<string, unknown>) => ({
        id: b.id, name: b.name, location_type: b.location_type,
        time_of_day: b.time_of_day, prompt_snippet: b.prompt_snippet, image_url: b.reference_image_url,
      }));
      inject(text, `${bgs.length} fondo${bgs.length !== 1 ? 's' : ''}:\n\n[RESOURCE_LIST]\n${JSON.stringify({ type: 'backgrounds', backgrounds: bgs })}\n[/RESOURCE_LIST]`);
      return true;
    }

    // ---- "muestrame las escenas" / "ver escenas" ----
    if (/^(muestr|ver|show|lista).*(escena|scene)/i.test(t) && !/crear|nuevo|new/i.test(t)) {
      const { videoId } = useKiyokoChat.getState();
      if (!videoId) {
        // No video context — show videos to pick
        const { data: vids } = await supabase.from('videos')
          .select('title, short_id').eq('project_id', pid).order('created_at');
        if (vids?.length) {
          const opts = (vids as Array<Record<string, unknown>>).map((v) => `Abrir "${v.title}"`);
          inject(text, `Para ver escenas necesitas estar en un video. Elige uno:\n\n[OPTIONS]\n${JSON.stringify(opts)}\n[/OPTIONS]`);
        } else {
          inject(text, `No hay videos en el proyecto. Crea uno primero.\n\n[OPTIONS]\n["Crear video"]\n[/OPTIONS]`);
        }
        return true;
      }
      // Fetch scenes for current video
      const { data: scenes } = await supabase.from('scenes')
        .select(`id, scene_number, title, description, duration_seconds, arc_phase, status,
          scene_characters(character_id, characters(name)),
          scene_backgrounds(backgrounds(name)),
          scene_prompts(prompt_type, is_current)`)
        .eq('video_id', videoId).order('sort_order');

      if (!scenes?.length) {
        inject(text, `Este video no tiene escenas todavia.\n\n[OPTIONS]\n["Crear escenas","Crear video"]\n[/OPTIONS]`);
        return true;
      }

      const sceneItems = (scenes as Array<Record<string, unknown>>).map((s) => {
        const chars = ((s.scene_characters as Array<{ characters: { name: string } | null }>) ?? [])
          .map((sc) => sc.characters?.name).filter(Boolean);
        const bg = ((s.scene_backgrounds as Array<{ backgrounds: { name: string } | null }>) ?? [])[0]
          ?.backgrounds?.name ?? null;
        const prompts = (s.scene_prompts as Array<{ prompt_type: string; is_current: boolean }>) ?? [];
        const hasImg = prompts.some((p) => p.prompt_type === 'image' && p.is_current);
        const hasVid = prompts.some((p) => p.prompt_type === 'video' && p.is_current);
        return {
          scene_number: s.scene_number, title: s.title, duration_seconds: s.duration_seconds,
          arc_phase: s.arc_phase, description: s.description,
          character: chars[0] ?? null, background: bg,
          has_image_prompt: hasImg, has_video_prompt: hasVid,
        };
      });

      const planJson = JSON.stringify(sceneItems.map((s) => ({
        scene_number: s.scene_number, title: s.title,
        duration: s.duration_seconds, arc_phase: s.arc_phase,
        description: (s.description as string)?.slice(0, 80) ?? '',
        character: s.character, background: s.background,
      })));

      inject(text, `${sceneItems.length} escena${sceneItems.length !== 1 ? 's' : ''} en el video:\n\n[SCENE_PLAN]\n${planJson}\n[/SCENE_PLAN]\n\n[SUGGESTIONS]\n["Generar prompts","Editar escena","Crear mas escenas"]\n[/SUGGESTIONS]`);
      return true;
    }

    // ---- "muestrame los videos" / "abreme los videos" ----
    if (/^(muestr|ver|show|lista|abr).*(video|videos)/i.test(t) && !/crear|nuevo|new/i.test(t)) {
      const { data } = await supabase.from('videos')
        .select('id, title, short_id, platform, target_duration_seconds, status')
        .eq('project_id', pid).order('created_at');
      const videos = (data ?? []).map((v: Record<string, unknown>) => ({
        title: v.title, short_id: v.short_id, platform: v.platform,
        duration: v.target_duration_seconds, status: v.status,
      }));
      const opts = videos.map((v: Record<string, unknown>) => `Abrir "${v.title}"`);
      inject(text, `${videos.length} video${videos.length !== 1 ? 's' : ''} en el proyecto:\n\n[OPTIONS]\n${JSON.stringify(opts)}\n[/OPTIONS]`);
      return true;
    }

    // ---- "editar/ver personaje X" ----
    const charMatch = t.match(/^(editar|ver|mostrar|show|edit|abr)\s*(personaje|character)\s+(.+)$/i);
    if (charMatch) {
      const q = charMatch[3].replace(/['"]/g, '');
      const { data } = await supabase.from('characters')
        .select('id, name, role, prompt_snippet, reference_image_url')
        .eq('project_id', pid).ilike('name', `%${q}%`).limit(1);
      if (data?.length) {
        const c = data[0] as Record<string, unknown>;
        inject(text, `Datos de ${c.name}:\n\n[RESOURCE_LIST]\n${JSON.stringify({
          type: 'characters', characters: [{ id: c.id, name: c.name, role: c.role, prompt_snippet: c.prompt_snippet, image_url: c.reference_image_url }],
        })}\n[/RESOURCE_LIST]`);
        return true;
      }
    }

    // ---- "eliminar personaje X" ----
    const delMatch = t.match(/^(eliminar|borrar|delete|remove)\s*(personaje|character)\s+(.+)$/i);
    if (delMatch) {
      const q = delMatch[3].replace(/['"]/g, '');
      const { data: chars } = await supabase.from('characters')
        .select('id, name, role, reference_image_url')
        .eq('project_id', pid).ilike('name', `%${q}%`).limit(1);
      if (chars?.length) {
        const c = chars[0] as Record<string, unknown>;
        // Check dependencies
        const { count } = await supabase.from('scene_characters')
          .select('id', { count: 'exact', head: true })
          .eq('character_id', c.id as string);
        const sceneCount = count ?? 0;

        if (sceneCount > 0) {
          inject(text, `No se puede eliminar "${c.name}" porque aparece en ${sceneCount} escena${sceneCount !== 1 ? 's' : ''}. Modifica primero las escenas para quitar este personaje.\n\n[OPTIONS]\n["Ver escenas donde aparece","Editar personaje ${c.name}"]\n[/OPTIONS]`);
        } else {
          inject(text, `"${c.name}" no aparece en ninguna escena. Puedes eliminarlo:\n\n[RESOURCE_LIST]\n${JSON.stringify({
            type: 'characters', characters: [{ id: c.id, name: c.name, role: c.role, image_url: c.reference_image_url }],
          })}\n[/RESOURCE_LIST]\n\n[OPTIONS]\n["Confirmar eliminar ${c.name}","Cancelar"]\n[/OPTIONS]`);
        }
        return true;
      }
    }

    // ---- "confirmar eliminar X" ----
    const confirmDelMatch = t.match(/^confirmar eliminar\s+(.+)$/i);
    if (confirmDelMatch) {
      const q = confirmDelMatch[1].replace(/['"]/g, '');
      const { data: chars } = await supabase.from('characters')
        .select('id, name').eq('project_id', pid).ilike('name', `%${q}%`).limit(1);
      if (chars?.length) {
        const c = chars[0] as Record<string, unknown>;
        const { error } = await supabase.from('characters').delete().eq('id', c.id as string);
        if (error) {
          inject(text, `Error al eliminar: ${error.message}`);
        } else {
          inject(text, `Personaje "${c.name}" eliminado correctamente.\n\n[SUGGESTIONS]\n["Ver personajes","Crear personaje"]\n[/SUGGESTIONS]`);
        }
        return true;
      }
    }

    // ---- "abreme el proyecto" / "volver al proyecto" ----
    if (/^(abr|volver|ir).*(proyecto|project|inicio)/i.test(t)) {
      const pShortId = pathname.match(/\/project\/([^/]+)/)?.[1];
      if (pShortId) {
        inject(text, 'Volviendo al proyecto...');
        router.push(`/project/${pShortId}`);
        return true;
      }
    }

    return false;
  }, [pathname, router]);

  // ---- Detect creation commands and show forms instantly (no AI round-trip) ----
  const CREATION_PATTERNS: Array<{ pattern: RegExp; block: string }> = useMemo(() => [
    { pattern: /^(crear|nuevo|new|create)\s*(un\s+)?v[ií]deo$/i, block: '[CREATE:video]\n{"title":"","platform":"instagram_reels","target_duration_seconds":30,"description":""}\n[/CREATE]' },
    { pattern: /^(crear|nuevo|new|create)\s*(un\s+)?proyecto$/i, block: '[CREATE:project]\n{"title":"","description":"","client_name":"","style":"pixar"}\n[/CREATE]' },
    { pattern: /^(crear|nuevo|new|create|a[ñn]adir)\s*(un\s+)?personaje$/i, block: '[CREATE:character]\n{"name":"","role":"protagonista","description":"","personality":"","visual_description":""}\n[/CREATE]' },
    { pattern: /^(crear|nuevo|new|create|a[ñn]adir)\s*(un\s+)?fondo$/i, block: '[CREATE:background]\n{"name":"","location_type":"exterior","time_of_day":"dia","description":""}\n[/CREATE]' },
    { pattern: /^(crear|nuevo|new|create|a[ñn]adir)\s*(un\s+)?(background|locaci[oó]n)$/i, block: '[CREATE:background]\n{"name":"","location_type":"exterior","time_of_day":"dia","description":""}\n[/CREATE]' },
  ], []);

  const injectCreationForm = useCallback((text: string): boolean => {
    const match = CREATION_PATTERNS.find((p) => p.pattern.test(text.trim()));
    if (!match) return false;

    // Add user message + instant assistant response with the form
    const { messages: currentMessages } = useKiyokoChat.getState();
    const userMsg: KiyokoMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    const assistantMsg: KiyokoMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Rellena los datos:\n\n${match.block}`,
      timestamp: new Date(),
    };
    useKiyokoChat.setState({
      messages: [...currentMessages, userMsg, assistantMsg],
    });
    void persistConversationNow();
    return true;
  }, [CREATION_PATTERNS]);

  const handleSend = useCallback(
    async (text: string, files?: File[]) => {
      if (!files?.length) {
        // 1. Smart commands first (show characters, scenes, delete, etc.)
        if (await trySmartCommand(text)) return;
        // 2. Creation forms (crear video, personaje, fondo)
        if (injectCreationForm(text)) return;
        // 3. Navigation (entra en X, abre X)
        if (tryNavigate(text)) return;
      }

      if (files?.length) {
        const images = files.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        sendMessage(text, images);
      } else {
        sendMessage(text);
      }
    },
    [sendMessage, injectCreationForm, tryNavigate, trySmartCommand],
  );

  const handlePostCreationStep = useCallback(
    (label: string, message: KiyokoMessage) => {
      const cs = message.creationSuccess;
      if (!cs?.createdEntityKind) {
        void sendMessage(label);
        return;
      }
      const route = resolveNextStepRoute({
        label,
        projectShortId: effectiveProjectShortId,
        createdEntityKind: cs.createdEntityKind,
        createdEntityId: cs.entityId,
        videoShortId: cs.videoShortId,
        createdProjectShortId: cs.projectShortId,
      });
      if (route) router.push(route);
      else void sendMessage(label);
    },
    [effectiveProjectShortId, router, sendMessage],
  );

  const handleQuickAction = useCallback(
    (prompt: string) => {
      // Try instant form injection first
      if (injectCreationForm(prompt)) return;
      sendMessage(prompt);
    },
    [sendMessage, injectCreationForm],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      clearSuggestions();
      // Try instant form injection first
      if (injectCreationForm(suggestion)) return;
      sendMessage(suggestion);
    },
    [sendMessage, clearSuggestions, injectCreationForm],
  );

  const handleExecute = useCallback(
    (messageId: string, plan: AiActionPlan) => { executeActionPlan(messageId, plan); },
    [executeActionPlan],
  );

  const handleCancel = useCallback(
    (messageId: string) => { cancelActionPlan(messageId); },
    [cancelActionPlan],
  );

  const [prefillText, setPrefillText] = useState<string | null>(null);
  const handleModify = useCallback((text: string) => { setPrefillText(text); }, []);
  const handlePrefillConsumed = useCallback(() => { setPrefillText(null); }, []);

  const handleWorkflowAction = useCallback(
    (_actionId: string, label: string) => { sendMessage(label); },
    [sendMessage],
  );

  const handleHistorySelect = useCallback(
    (convId: string) => { loadConversation(convId); },
    [loadConversation],
  );

  const handleNewChat = useCallback(() => {
    startNewConversation();
    localStorage.removeItem(LAST_CONVERSATION_KEY);
    setActiveCreation(null);
    setPendingCreation(null);
    useAIStore.getState().setCreating(false);
  }, [startNewConversation]);

  // ---- Resize handler (expanded history) ----
  const handleHistoryResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = historyWidth;
    const onMove = (ev: MouseEvent) => {
      // El handle irá a la izquierda del historial: arrastrar hacia la derecha
      // reduce el ancho del historial y "empuja" el chat.
      const dx = ev.clientX - startX;
      const raw = startW - dx;
      setHistoryWidth(clampHistoryWidth(raw));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [historyWidth, clampHistoryWidth]);

  // UX: si el historial está abierto, expandimos el panel lateral para que el chat
  // no se reduzca visualmente (comportamiento tipo Cursor).
  useEffect(() => {
    if (!isExpandedMode) return;
    // Cuando el historial está abierto añadimos también el ancho del separador.
    const requiredSidebarWidth = historyOpen
      ? (CHAT_MIN_WIDTH + RESIZE_HANDLE_WIDTH + historyWidth)
      : CHAT_MIN_WIDTH;
    const target = typeof window === 'undefined' ? requiredSidebarWidth : Math.min(window.innerWidth, requiredSidebarWidth);

    // No queremos “pisar” el resize del usuario.
    // Sólo aumentamos el sidebar si hace falta para mantener el chat >= 450px.
    if (sidebarWidth + 1 < target) setSidebarWidth(target);
  }, [isExpandedMode, historyOpen, historyWidth, sidebarWidth, setSidebarWidth, CHAT_MIN_WIDTH, RESIZE_HANDLE_WIDTH]);

  // ---- Placeholder ----
  const placeholder = projectTitle
    ? `Pregúntale a Kiyoko sobre "${projectTitle}"...`
    : 'Escribe un mensaje a Kiyoko...';

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative overflow-hidden">

      {/* ================================================================
          Expanded mode layout: LEFT main chat + RIGHT history sidebar
          ================================================================ */}
      {isExpandedMode ? (
        <div className="flex flex-1 min-h-0">
          {/* Main chat */}
          <div className="flex flex-col flex-1 min-w-0 h-full">
            <KiyokoHeader
              contextLabel={contextLabel}
              isStreaming={isStreaming}
              isThinking={isThinking}
              onNewChat={handleNewChat}
              onHistoryToggle={handleHistoryToggle}
              compact
              contextStrip={contextStrip}
              activeProvider={activeProvider}
            />
            <ChatBody
              messages={messages}
              suggestions={suggestions}
              isStreaming={isStreaming}
              isThinking={isThinking}
              activeAgent={activeAgent}
              projectId={chatProjectId}
              handleQuickAction={handleQuickAction}
              handleSuggestionClick={handleSuggestionClick}
              handleExecute={handleExecute}
              handleCancel={handleCancel}
              handleModify={handleModify}
              handleWorkflowAction={handleWorkflowAction}
              undoBatch={undoBatch}
              messagesEndRef={messagesEndRef}
              handleSend={handleSend}
              stopStreaming={stopStreaming}
              onClearConversation={handleNewChat}
              activeProvider={activeProvider}
              placeholder={placeholder}
              isExpandedMode
              contextLabel={contextLabel}
              contextType={contextType}
              prefillText={prefillText}
              onPrefillConsumed={handlePrefillConsumed}
              compactHeader
              hideCreateCards
              onCreateCardRequested={handleCreateCardRequested}
              activeCreation={activeCreation}
              pendingCreation={pendingCreation}
              onActiveCreationCancel={handleActiveCreationCancel}
              onActiveCreationCreated={handleActiveCreationCreated}
              onPostCreationStep={handlePostCreationStep}
              contextChangeNote={contextChangeNote}
            />
          </div>

          {historyOpen && (
            <>
              {/* Resize handle (a la izquierda del historial) */}
              <div
                className="w-px shrink-0 cursor-col-resize bg-transparent relative group"
                onMouseDown={handleHistoryResizeMouseDown}
              >
                <div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-[#3E4452] group-active:bg-[#3E4452] transition-colors"
                />
              </div>

              {/* History sidebar — visible when expanded, resizable */}
              <div
                className="shrink-0 h-full overflow-hidden"
                style={{ width: historyWidth }}
              >
                <ChatHistorySidebar
                  conversations={conversations}
                  activeConversationId={conversationId}
                  onSelect={handleHistorySelect}
                  onNewChat={handleNewChat}
                />
              </div>
            </>
          )}
        </div>

      ) : (
        /* ================================================================
           Panel mode layout: chat + history side by side (flex row)
           ================================================================ */
        <div className="flex flex-1 min-h-0">
          {/* Main chat */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            <KiyokoHeader
              contextLabel={contextLabel}
              isStreaming={isStreaming}
              isThinking={isThinking}
              onNewChat={handleNewChat}
              contextStrip={contextStrip}
              activeProvider={activeProvider}
            />
            <ChatBody
              messages={messages}
              suggestions={suggestions}
              isStreaming={isStreaming}
              isThinking={isThinking}
              activeAgent={activeAgent}
              projectId={chatProjectId}
              handleQuickAction={handleQuickAction}
              handleSuggestionClick={handleSuggestionClick}
              handleExecute={handleExecute}
              handleCancel={handleCancel}
              handleModify={handleModify}
              handleWorkflowAction={handleWorkflowAction}
              undoBatch={undoBatch}
              messagesEndRef={messagesEndRef}
              handleSend={handleSend}
              stopStreaming={stopStreaming}
              onClearConversation={handleNewChat}
              activeProvider={activeProvider}
              placeholder={placeholder}
              isExpandedMode={false}
              contextLabel={contextLabel}
              contextType={contextType}
              prefillText={prefillText}
              onPrefillConsumed={handlePrefillConsumed}
              hideCreateCards
              onCreateCardRequested={handleCreateCardRequested}
              activeCreation={activeCreation}
              pendingCreation={pendingCreation}
              onActiveCreationCancel={handleActiveCreationCancel}
              onActiveCreationCreated={handleActiveCreationCreated}
              onPostCreationStep={handlePostCreationStep}
              contextChangeNote={contextChangeNote}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatBody (internal)
// ---------------------------------------------------------------------------

interface ChatBodyProps {
  messages: KiyokoMessage[];
  suggestions: string[];
  isStreaming: boolean;
  /** Fase THINK (V8): puntos antes del stream visible */
  isThinking: boolean;
  activeAgent: string;
  projectId: string | null;
  handleQuickAction: (prompt: string) => void;
  handleSuggestionClick: (suggestion: string) => void;
  handleExecute: (messageId: string, plan: AiActionPlan) => void;
  handleCancel: (messageId: string) => void;
  handleModify: (prefill: string) => void;
  handleWorkflowAction: (actionId: string, label: string) => void;
  undoBatch: (batchId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (text: string, files?: File[]) => void;
  stopStreaming: () => void;
  onClearConversation: () => void;
  activeProvider: string | null;
  placeholder: string;
  isExpandedMode: boolean;
  contextLabel: string;
  contextType: 'dashboard' | 'project' | 'video' | 'scene';
  prefillText: string | null;
  onPrefillConsumed: () => void;
  compactHeader?: boolean;
  // [CREATE:*] blocks → no deben renderizar cards dentro del historial.
  hideCreateCards?: boolean;
  onCreateCardRequested?: (payload: {
    messageId: string;
    type: 'character' | 'background' | 'video' | 'project';
    prefill: Record<string, unknown>;
  }) => void;

  // Overlay UI (arriba del input)
  activeCreation?: null | {
    messageId: string;
    type: 'character' | 'background' | 'video' | 'project';
    prefill: Record<string, unknown>;
  };
  /** Stream aún en curso: el formulario se abrirá al terminar (tras handoff). */
  pendingCreation?: null | {
    messageId: string;
    type: 'character' | 'background' | 'video' | 'project';
    prefill: Record<string, unknown>;
  };
  onActiveCreationCancel?: () => void;
  onActiveCreationCreated?: (msg: string, ctx?: CreationSaveContext) => void;
  onPostCreationStep?: (label: string, message: KiyokoMessage) => void;
  contextChangeNote?: string | null;
}

function ChatBody({
  messages,
  suggestions,
  isStreaming,
  isThinking,
  activeAgent,
  projectId,
  handleQuickAction,
  handleSuggestionClick,
  handleExecute,
  handleCancel,
  handleModify,
  handleWorkflowAction,
  undoBatch,
  messagesEndRef,
  handleSend,
  stopStreaming,
  onClearConversation,
  activeProvider,
  placeholder,
  contextLabel,
  contextType,
  prefillText,
  onPrefillConsumed,
  compactHeader,
  hideCreateCards,
  onCreateCardRequested,
  activeCreation,
  pendingCreation = null,
  onActiveCreationCancel,
  onActiveCreationCreated,
  onPostCreationStep,
  contextChangeNote = null,
}: ChatBodyProps) {
  const { isCreating, creatingLabel } = useAIStore();
  const inputPlaceholder =
    activeCreation || pendingCreation || isCreating ? (creatingLabel ?? 'Creando...') : placeholder;

  const lastUserPromptForSkeleton = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return null;
  }, [messages]);

  const messagesAreaClass = compactHeader
    ? 'flex-1 overflow-y-auto min-h-0 px-5 sm:px-7 pt-3 pb-3 space-y-4 overscroll-contain'
    : 'flex-1 overflow-y-auto min-h-0 px-6 sm:px-8 pt-4 pb-4 space-y-4 overscroll-contain';

  return (
    <div className="flex flex-col flex-1 min-h-0 pt-2 px-3 sm:px-5">
      {/* Messages area — se atenúa mientras el formulario de creación está anclado al input */}
      <div
        className={cn(
          messagesAreaClass,
          'relative z-0 transition-opacity duration-200',
          (activeCreation || pendingCreation) && CHAT_THREAD_DIM_CLASS,
        )}
      >
        {/* Empty state — contextual quick actions (Section 23.8) */}
        {messages.length === 0 && (
          <KiyokoEmptyState
            contextLevel={contextType}
            contextLabel={contextLabel}
            onQuickAction={handleQuickAction}
          />
        )}

        {/* Context change note */}
        <AnimatePresence>
          {contextChangeNote && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto px-4 py-2 text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                {contextChangeNote}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list */}
        {messages.map((message, idx) => (
          <ChatMessage
            key={message.id}
            message={message}
            activeAgent={activeAgent}
            projectId={projectId ?? undefined}
            isLastMessage={idx === messages.length - 1}
            isStreaming={isStreaming}
            hideCreateCards={hideCreateCards}
            onCreateCardRequested={onCreateCardRequested}
            onExecute={handleExecute}
            onCancel={handleCancel}
            onModify={handleModify}
            onSend={handleSend}
            onPostCreationStep={onPostCreationStep}
            onUndo={undoBatch}
            onWorkflowAction={handleWorkflowAction}
            isAssistantThinking={
              idx === messages.length - 1 &&
              isStreaming &&
              isThinking &&
              message.role === 'assistant' &&
              !message.content.trim()
            }
            userPromptHint={lastUserPromptForSkeleton}
          />
        ))}

        {/* Sugerencias — lista vertical con chevrón (misma línea que post-creación) */}
        {suggestions.length > 0 && !isStreaming && !isThinking && !isCreating && !activeCreation && !pendingCreation && (
          <div className="pl-1 sm:pl-2 max-w-[min(100%,42rem)]">
            <ChatFollowUpList
              title="Sugerencias"
              items={suggestions}
              staggerMs={V8_SUGGESTION_STAGGER_MS}
              onSelect={(suggestion) => handleSuggestionClick(suggestion)}
            />
          </div>
        )}

        {/* Actividad de creación / guardado (visible también con el formulario anclado al input) */}
        {isCreating && creatingLabel && (
          <StreamingWave label={creatingLabel} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Compositor: un solo borde redondeado; el formulario crece encima del input */}
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
                    projectId={projectId ?? undefined}
                    prefill={{
                      name: String(activeCreation.prefill.name ?? ''),
                      role: String(activeCreation.prefill.role ?? 'protagonista'),
                      description: String(activeCreation.prefill.description ?? ''),
                      personality: String(activeCreation.prefill.personality ?? ''),
                      visual_description: String(activeCreation.prefill.visual_description ?? ''),
                    }}
                    onCreated={(msg, ctx) => onActiveCreationCreated?.(msg, ctx)}
                    onCancel={() => onActiveCreationCancel?.()}
                  />
                )}

                {activeCreation.type === 'background' && (
                  <BackgroundCreationCard
                    dock
                    projectId={projectId ?? undefined}
                    prefill={{
                      name: String(activeCreation.prefill.name ?? ''),
                      location_type: String(activeCreation.prefill.location_type ?? 'exterior'),
                      time_of_day: String(activeCreation.prefill.time_of_day ?? 'dia'),
                      description: String(activeCreation.prefill.description ?? ''),
                    }}
                    onCreated={(msg, ctx) => onActiveCreationCreated?.(msg, ctx)}
                    onCancel={() => onActiveCreationCancel?.()}
                  />
                )}

                {activeCreation.type === 'video' && (
                  <VideoCreationCard
                    dock
                    projectId={projectId ?? undefined}
                    prefill={{
                      title: String(activeCreation.prefill.title ?? ''),
                      platform: String(activeCreation.prefill.platform ?? 'instagram_reels'),
                      target_duration_seconds: activeCreation.prefill.target_duration_seconds
                        ? Number(activeCreation.prefill.target_duration_seconds)
                        : undefined,
                      description: String(activeCreation.prefill.description ?? ''),
                    }}
                    onCreated={(msg, ctx) => onActiveCreationCreated?.(msg, ctx)}
                    onCancel={() => onActiveCreationCancel?.()}
                  />
                )}

                {activeCreation.type === 'project' && (
                  <ProjectCreationCard
                    dock
                    prefill={{
                      title: String(activeCreation.prefill.title ?? ''),
                      description: String(activeCreation.prefill.description ?? ''),
                      client_name: String(activeCreation.prefill.client_name ?? ''),
                      style: String(activeCreation.prefill.style ?? 'pixar'),
                    }}
                    onCreated={(msg, ctx) => onActiveCreationCreated?.(msg, ctx)}
                    onCancel={() => onActiveCreationCancel?.()}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <ChatInput
              onSend={handleSend}
              onStop={stopStreaming}
              onClearConversation={onClearConversation}
              isStreaming={isStreaming || isCreating}
              activeProvider={activeProvider}
              allowFiles
              placeholder={inputPlaceholder}
              contextLabel={contextLabel}
              contextType={contextType}
              prefillText={prefillText}
              onPrefillConsumed={onPrefillConsumed}
              creationDockOpen
              dockTail
              embeddedInComposer
            />
          </div>
        ) : (
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            onClearConversation={onClearConversation}
            isStreaming={isStreaming || isCreating}
            activeProvider={activeProvider}
            allowFiles
            placeholder={inputPlaceholder}
            contextLabel={contextLabel}
            contextType={contextType}
            prefillText={prefillText}
            onPrefillConsumed={onPrefillConsumed}
            creationDockOpen={false}
            dockTail={false}
            embeddedInComposer={false}
          />
        )}
      </div>
    </div>
  );
}
