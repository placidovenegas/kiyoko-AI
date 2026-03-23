'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useKiyokoChat } from '@/hooks/useKiyokoChat';
import type { KiyokoMessage } from '@/hooks/useKiyokoChat';
import { useAIStore } from '@/stores/ai-store';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { KiyokoHeader } from '@/components/kiyoko/KiyokoHeader';
import { KiyokoEmptyState } from '@/components/kiyoko/KiyokoEmptyState';
import { StreamingWave } from '@/components/chat/StreamingWave';
import { createClient } from '@/lib/supabase/client';
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

// ---------------------------------------------------------------------------
// KiyokoChat
// ---------------------------------------------------------------------------

export function KiyokoChat({ mode, onClose }: KiyokoChatProps) {
  const pathname = usePathname();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [historyWidth, setHistoryWidth] = useState(() => {
    if (typeof window === 'undefined') return 240;
    const saved = localStorage.getItem(HISTORY_WIDTH_KEY);
    if (saved) {
      const w = parseInt(saved, 10);
      if (!isNaN(w) && w >= 180 && w <= 480) return w;
    }
    return 240;
  });
  const hasRestoredRef = useRef(false);

  const {
    messages,
    isStreaming,
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
    projectId: chatProjectId,
  } = useKiyokoChat();

  const isExpandedMode = mode === 'expanded';
  const activeAgent = useAIStore((s) => s.activeAgent);

  // ---- Parse URL context ----
  const projectShortId = useMemo(() => {
    const m = pathname.match(/\/project\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const videoShortId = useMemo(() => {
    const m = pathname.match(/\/video\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const sceneShortId = useMemo(() => {
    const m = pathname.match(/\/scene\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const isOrgRoute = pathname.startsWith('/organizations/');

  // ---- Context label + type ----
  const contextLabel = useMemo(() => {
    if (videoTitle) return videoTitle;
    if (projectTitle) return projectTitle;
    if (isOrgRoute) return 'Organización';
    return 'Dashboard';
  }, [videoTitle, projectTitle, isOrgRoute]);

  const contextType = useMemo((): 'dashboard' | 'organization' | 'project' | 'video' | 'scene' => {
    if (sceneShortId && videoShortId) return 'scene';
    if (videoShortId) return 'video';
    if (projectShortId) return 'project';
    if (isOrgRoute) return 'organization';
    return 'dashboard';
  }, [sceneShortId, videoShortId, projectShortId, isOrgRoute]);

  // ---- Persist historyWidth ----
  useEffect(() => {
    localStorage.setItem(HISTORY_WIDTH_KEY, historyWidth.toString());
  }, [historyWidth]);

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
        if (!videoShortId) setContext('dashboard', null, null);
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
        } else {
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

  // ---- Restore last conversation on mount ----
  useEffect(() => {
    if (hasRestoredRef.current) return;
    const lastId = localStorage.getItem(LAST_CONVERSATION_KEY);
    if (lastId) {
      hasRestoredRef.current = true;
      loadConversation(lastId);
    }
  }, [loadConversation]);

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
  }, [startNewConversation]);

  // ---- Resize handler (expanded history) ----
  const handleHistoryResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = historyWidth;
    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(180, Math.min(480, startW + (ev.clientX - startX)));
      setHistoryWidth(newW);
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
  }, [historyWidth]);

  // ---- Placeholder ----
  const placeholder = projectTitle
    ? `Pregúntale a Kiyoko sobre "${projectTitle}"...`
    : 'Escribe un mensaje a Kiyoko...';

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative overflow-hidden">

      {/* ================================================================
          Expanded mode layout: LEFT history sidebar (always) + RIGHT main
          ================================================================ */}
      {isExpandedMode ? (
        <div className="flex flex-1 min-h-0">
          {/* History sidebar — always visible when expanded, resizable */}
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

          {/* Resize handle */}
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-teal-500/40 active:bg-teal-500/60 relative group"
            onMouseDown={handleHistoryResizeMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-teal-500/40 transition-colors" />
          </div>

          {/* Main chat */}
          <div className="flex flex-col flex-1 min-w-0 h-full">
            <KiyokoHeader
              contextLabel={contextLabel}
              isStreaming={isStreaming}
              onNewChat={handleNewChat}
            />
            <ChatBody
              messages={messages}
              suggestions={suggestions}
              isStreaming={isStreaming}
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
            />
          </div>
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
              onNewChat={handleNewChat}
              onHistoryToggle={() => {}}
            />
            <ChatBody
              messages={messages}
              suggestions={suggestions}
              isStreaming={isStreaming}
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
  contextType: 'dashboard' | 'organization' | 'project' | 'video' | 'scene';
  prefillText: string | null;
  onPrefillConsumed: () => void;
}

function ChatBody({
  messages,
  suggestions,
  isStreaming,
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
}: ChatBodyProps) {
  const { isCreating, creatingLabel } = useAIStore();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4 overscroll-contain">
        {/* Empty state — contextual quick actions (Section 23.8) */}
        {messages.length === 0 && (
          <KiyokoEmptyState
            contextLevel={contextType}
            contextLabel={contextLabel}
            onQuickAction={handleQuickAction}
          />
        )}

        {/* Message list */}
        {messages.map((message, idx) => (
          <ChatMessage
            key={message.id}
            message={message}
            activeAgent={activeAgent}
            projectId={projectId ?? undefined}
            isLastMessage={idx === messages.length - 1}
            isStreaming={isStreaming}
            onExecute={handleExecute}
            onCancel={handleCancel}
            onModify={handleModify}
            onSend={handleSend}
            onUndo={undoBatch}
            onWorkflowAction={handleWorkflowAction}
          />
        ))}

        {/* Suggestions — inline after last message */}
        {suggestions.length > 0 && !isStreaming && (
          <div className="pl-6.5 flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="relative px-3.5 py-2 rounded-full text-xs font-medium text-foreground bg-card border border-border hover:border-transparent transition-all duration-200 group overflow-hidden"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-linear-to-r from-teal-500 via-blue-500 to-purple-500 p-px">
                  <span className="block size-full rounded-full bg-card" />
                </span>
                <span className="relative">{suggestion}</span>
              </button>
            ))}
          </div>
        )}

        {/* Creating animation — shown while saving to Supabase */}
        {isCreating && creatingLabel && (
          <StreamingWave label={creatingLabel} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — always visible, send disabled while creating */}
      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          onClearConversation={onClearConversation}
          isStreaming={isStreaming || isCreating}
          activeProvider={activeProvider}
          allowFiles
          placeholder={isCreating ? (creatingLabel ?? 'Creando...') : placeholder}
          contextLabel={contextLabel}
          contextType={contextType}
          prefillText={prefillText}
          onPrefillConsumed={onPrefillConsumed}
        />
      </div>
    </div>
  );
}
