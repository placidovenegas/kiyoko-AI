import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { executeActionPlan as execPlan, executeNewActionPlan, undoBatch as undoActionBatch } from '@/lib/ai/action-executor';
import type { AiActionPlan, AiActionResult, ActionPlan } from '@/types/ai-actions';
import { parseAiMessage } from '@/lib/ai/parse-ai-message';
import type { ContextLevel } from '@/types/ai-context';
import { useAIStore } from '@/stores/ai-store';
import { useUIStore } from '@/stores/useUIStore';
import type { KiyokoActiveAgent } from '@/stores/ai-store';
import { toast } from 'sonner';
import { randomThinkDurationMs } from '@/types/chat-v8';
import type { CreatedEntityKind } from '@/lib/chat/resolve-next-step-route';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageAttachment {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
}

export interface KiyokoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[]; // URLs of attached images
  audioUrl?: string; // URL of generated audio (TTS)
  actionPlan?: AiActionPlan;
  executionResults?: AiActionResult[];
  executedBatchId?: string;
  isExecuting?: boolean;
  /** Aviso persistente de cancelación de flujo de creación (dock) */
  creationCancelled?: { subtitle?: string };
  /** Post-creación V8: tarjeta de éxito + siguiente paso */
  creationSuccess?: {
    name: string;
    entityLabel: string;
    badge: string;
    nextSteps: string[];
    /** Ausente en conversaciones guardadas antes de V8 routing */
    createdEntityKind?: CreatedEntityKind;
    entityId?: string;
    videoShortId?: string;
    /** Tras CREATE proyecto: short_id del nuevo proyecto (siguiente paso / navegación) */
    projectShortId?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface VideoCut {
  id: string;
  title: string;
  short_id: string;
  platform: string;
  target_duration_seconds: number;
  is_primary: boolean;
  status: string;
}

interface KiyokoChatState {
  // State
  messages: KiyokoMessage[];
  isStreaming: boolean;
  /** Fase THINK (V8): puntos antes de mostrar tokens del asistente en el hilo */
  isThinking: boolean;
  conversationId: string | null;
  projectId: string | null;
  projectSlug: string | null;
  conversations: Conversation[];
  isExpanded: boolean;
  attachedImages: ImageAttachment[];
  suggestions: string[];
  activeProvider: string | null;
  videoCuts: VideoCut[];
  activeVideoCutId: string | null;
  // Contexto de navegación (v5)
  contextLevel: ContextLevel;
  videoId: string | null;         // UUID del video activo (distinto de activeVideoCutId que es legado)
  sceneId: string | null;         // UUID de la escena activa
  /** Texto para system prompt (`buildContextClientHint`) */
  contextClientHint: string | null;

  // Methods
  setProject: (id: string | null, slug: string | null) => void;
  setContext: (level: ContextLevel, videoId?: string | null, sceneId?: string | null) => void;
  sendMessage: (text: string, images?: ImageAttachment[]) => Promise<void>;
  stopStreaming: () => void;
  executeActionPlan: (messageId: string, plan: AiActionPlan) => Promise<void>;
  cancelActionPlan: (messageId: string) => void;
  undoBatch: (batchId: string) => Promise<void>;
  loadConversation: (convId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  startNewConversation: () => void;
  persistConversationNow: () => Promise<void>;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  clearSuggestions: () => void;
  setActiveVideoCut: (cutId: string | null) => void;
  loadVideoCuts: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseActionPlan(content: string): AiActionPlan | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
    if (parsed.type === 'action_plan' && Array.isArray(parsed.actions)) {
      return {
        summary_es: (parsed.summary_es as string) || '',
        actions: parsed.actions,
        total_scenes_affected: (parsed.total_scenes_affected as number) || 0,
        warnings: (parsed.warnings as string[]) || [],
      } satisfies AiActionPlan;
    }
  } catch {
    // malformed JSON — ignore
  }
  return null;
}

function parseSuggestions(content: string): string[] {
  // Look for suggestions block in the response
  const suggestionsMatch = content.match(/\[SUGERENCIAS\]([\s\S]*?)(?:\[\/SUGERENCIAS\]|$)/);
  if (!suggestionsMatch) return [];

  return suggestionsMatch[1]
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 4);
}

function generateId(): string {
  return crypto.randomUUID();
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

async function uploadImage(file: File, projectId: string | null): Promise<string | null> {
  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    toast.error(`La imagen "${file.name}" supera los 10MB`);
    return null;
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'png';
  const path = `${projectId || 'general'}/${generateId()}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { contentType: file.type });

  if (error) {
    console.error('Upload error:', error);
    toast.error(`Error al subir "${file.name}": ${error.message}`);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(path);

  return urlData?.publicUrl || null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

// AbortController stored outside Zustand (not serializable)
let currentAbortController: AbortController | null = null;
/** Timer fase THINK (V8) — limpiar en stopStreaming / abort */
let activeThinkTimer: ReturnType<typeof setTimeout> | null = null;

export const useKiyokoChat = create<KiyokoChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  isThinking: false,
  conversationId: null,
  projectId: null,
  projectSlug: null,
  conversations: [],
  isExpanded: false,
  attachedImages: [],
  suggestions: [],
  activeProvider: null,
  videoCuts: [],
  activeVideoCutId: null,
  // v5 context
  contextLevel: 'dashboard',
  videoId: null,
  sceneId: null,
  /** Resumen enviado al API (`buildContextClientHint`) — lo actualiza KiyokoChat */
  contextClientHint: null as string | null,

  // ---- Context (v5) -------------------------------------------------------

  setContext(level, videoId = null, sceneId = null) {
    set({ contextLevel: level, videoId, sceneId });
  },

  // ---- Video cuts ---------------------------------------------------------

  setActiveVideoCut(cutId) {
    set({ activeVideoCutId: cutId });
  },

  async loadVideoCuts() {
    const { projectId } = get();
    if (!projectId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from('videos')
      .select('id, title, short_id, platform, target_duration_seconds, is_primary, status')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (data) {
      const cuts = data as VideoCut[];
      set({ videoCuts: cuts });
      // Auto-select primary cut if none selected
      const { activeVideoCutId } = get();
      if (!activeVideoCutId && cuts.length > 0) {
        const primary = cuts.find((c) => c.is_primary);
        set({ activeVideoCutId: primary?.id ?? cuts[0].id });
      }
    }
  },

  // ---- Project context ---------------------------------------------------

  setProject(id, slug) {
    const { projectId: currentId } = get();
    if (currentId !== id) {
      // Clear chat state and reload for new project
      set({
        projectId: id,
        projectSlug: slug,
        messages: [],
        conversationId: null,
        conversations: [],
        suggestions: [],
        activeProvider: null,
        videoCuts: [],
        activeVideoCutId: null,
      });
      // Load video cuts for this project (if any)
      if (id) {
        const supabase = createClient();
        supabase
          .from('videos')
          .select('id, title, short_id, platform, target_duration_seconds, is_primary, status')
          .eq('project_id', id)
          .order('sort_order', { ascending: true })
          .then(({ data }) => {
            const cuts = (data ?? []) as VideoCut[];
            const primary = cuts.find((c) => c.is_primary);
            set({ videoCuts: cuts, activeVideoCutId: primary?.id ?? cuts[0]?.id ?? null });
          });
      }
      // Reload all user conversations (not filtered by project)
      get().loadConversations();
    }
  },

  // ---- Expand / collapse -------------------------------------------------

  toggleExpanded() {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },

  setExpanded(expanded) {
    set({ isExpanded: expanded });
  },

  // ---- Image attachments -------------------------------------------------

  addImages(files) {
    const newAttachments: ImageAttachment[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    set((state) => ({
      attachedImages: [...state.attachedImages, ...newAttachments].slice(0, 5), // max 5
    }));
  },

  removeImage(index) {
    set((state) => {
      const updated = [...state.attachedImages];
      const removed = updated.splice(index, 1);
      removed.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return { attachedImages: updated };
    });
  },

  clearImages() {
    set((state) => {
      state.attachedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return { attachedImages: [] };
    });
  },

  clearSuggestions() {
    set({ suggestions: [] });
  },

  // ---- Stop streaming ---------------------------------------------------

  stopStreaming() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    if (activeThinkTimer) {
      clearTimeout(activeThinkTimer);
      activeThinkTimer = null;
    }
    set({ isStreaming: false, activeProvider: null, isThinking: false });
  },

  // ---- Send message (SSE streaming) -------------------------------------

  async sendMessage(text, images) {
    // Cancel any in-flight request
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const { messages, projectId, conversationId, attachedImages: storeImages, activeVideoCutId, contextLevel, videoId, sceneId } = get();
    const imagesToUpload = images || storeImages;

    // 1. Upload images if any
    let imageUrls: string[] = [];
    if (imagesToUpload.length > 0) {
      const uploadPromises = imagesToUpload.map((img) => uploadImage(img.file, projectId));
      const results = await Promise.all(uploadPromises);
      imageUrls = results.filter((url): url is string => url !== null);
    }

    // 2. User message + placeholder del asistente (evita zona vacía hasta el primer token)
    const assistantId = generateId();
    const userMessage: KiyokoMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      images: imageUrls.length > 0 ? imageUrls : undefined,
    };
    const assistantPlaceholder: KiyokoMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    set({
      messages: [...messages, userMessage, assistantPlaceholder],
      isStreaming: true,
      isThinking: true,
      attachedImages: [],
      suggestions: [],
    });

    // Clean up preview URLs
    if (storeImages.length > 0 && !images) {
      storeImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    }

    // 3. Build history for the API — include image references in content
    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.images?.length
        ? `${m.content}\n\n[Imagenes adjuntas: ${m.images.join(', ')}]`
        : m.content,
    }));

    // 4. Fase THINK (V8) — el placeholder del asistente ya está en el hilo
    let accumulated = '';
    const thinkMs = randomThinkDurationMs();
    let thinkDone = false;

    const flushAssistantToStore = () => {
      set((state) => {
        const existing = state.messages.find((m) => m.id === assistantId);
        if (existing) {
          return {
            messages: state.messages.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m,
            ),
          };
        }
        return {
          messages: [
            ...state.messages,
            {
              id: assistantId,
              role: 'assistant' as const,
              content: accumulated,
              timestamp: new Date(),
            },
          ],
        };
      });
    };

    if (activeThinkTimer) {
      clearTimeout(activeThinkTimer);
      activeThinkTimer = null;
    }
    activeThinkTimer = setTimeout(() => {
      activeThinkTimer = null;
      thinkDone = true;
      // No quitar "pensando" si aún no hay texto: evita pantalla vacía entre fin THINK y primer token
      if (accumulated.length > 0) {
        flushAssistantToStore();
        set({ isThinking: false });
      }
    }, thinkMs);

    try {
      // Read user's preferred provider from Zustand store
      const preferredProvider = useUIStore.getState().preferredAiProvider;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          // Contexto v5 — el servidor usa esto para cargar los datos correctos
          contextLevel,
          projectId,
          videoId: videoId ?? activeVideoCutId ?? undefined,
          sceneId: sceneId ?? undefined,
          contextClientHint: get().contextClientHint?.trim() || undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          preferredProvider: preferredProvider || undefined,
        }),
        signal: currentAbortController?.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }

      // Read which provider and agent is responding
      const respondingProvider = res.headers.get('X-AI-Provider');
      if (respondingProvider) {
        set({ activeProvider: respondingProvider });
      }
      const respondingAgent = res.headers.get('X-Active-Agent') as KiyokoActiveAgent | null;
      if (respondingAgent) {
        useAIStore.getState().setActiveAgent(respondingAgent);
      }

      // 5. Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line) continue;

          // Vercel AI SDK Data Stream Protocol: `<type>:<JSON-value>`
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === 'string') accumulated += text;
            } catch { /* ignore */ }
            if (thinkDone) {
              flushAssistantToStore();
              if (accumulated.length > 0) set({ isThinking: false });
            }
            continue;
          }
          if (line.startsWith('3:')) {
            // Error event
            try {
              const errorMsg = JSON.parse(line.slice(2));
              throw new Error(typeof errorMsg === 'string' ? errorMsg : 'AI error');
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== 'AI error') throw parseErr;
            }
            continue;
          }
          // Skip other events: f: (start), d: (finish), 2: (data), e: (stream error)
          if (/^[a-zA-Z0-9]+:/.test(line)) continue;

          // Legacy SSE format fallback: `data: {"text": "..."}` (old server format)
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload) as Record<string, unknown>;
            if (typeof parsed.text === 'string') {
              accumulated += parsed.text;
            }
            if (typeof parsed.content === 'string') {
              accumulated += parsed.content;
            }
          } catch {
            // Non-JSON lines — skip
          }

          if (thinkDone) {
            flushAssistantToStore();
            if (accumulated.length > 0) set({ isThinking: false });
          }
        }
      }

      // Handle non-SSE text/plain response
      if (!accumulated && res.headers.get('content-type')?.includes('text/plain')) {
        accumulated = decoder.decode();
      }

      // 6. Parse bloques especiales del mensaje final
      const parsed = parseAiMessage(accumulated);
      // Compatibilidad: convertir ActionPlanBlock al formato legacy AiActionPlan si es necesario
      const legacyPlan = parsed.actionPlan
        ? {
            summary_es: parsed.actionPlan.description,
            actions: parsed.actionPlan.actions as unknown as AiActionPlan['actions'],
            total_scenes_affected: 0,
            warnings: [],
          }
        : parseActionPlan(accumulated); // fallback al parser legacy

      // Final update to assistant message
      set((state) => {
        const updated = state.messages.filter((m) => m.id !== assistantId);
        return {
          messages: [
            ...updated,
            {
              id: assistantId,
              role: 'assistant' as const,
              content: accumulated,
              timestamp: new Date(),
              actionPlan: legacyPlan ?? undefined,
            },
          ],
          suggestions: parsed.suggestions,
          isThinking: false,
        };
      });

      // 7. Save conversation to DB
      await saveConversation(get, set, conversationId, projectId);
    } catch (err) {
      // Aborted by user — not an error
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (activeThinkTimer) {
          clearTimeout(activeThinkTimer);
          activeThinkTimer = null;
        }
        set({ isStreaming: false, activeProvider: null, isThinking: false });
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Error de conexion con Kiyoko AI';
      toast.error(errorMessage);

      if (activeThinkTimer) {
        clearTimeout(activeThinkTimer);
        activeThinkTimer = null;
      }
      set((state) => {
        const updated = state.messages.filter((m) => m.id !== assistantId);
        return {
          messages: [
            ...updated,
            {
              id: assistantId,
              role: 'assistant' as const,
              content: `Error: ${errorMessage}`,
              timestamp: new Date(),
            },
          ],
          isThinking: false,
        };
      });
    } finally {
      currentAbortController = null;
      if (activeThinkTimer) {
        clearTimeout(activeThinkTimer);
        activeThinkTimer = null;
      }
      set({ isStreaming: false, activeProvider: null, isThinking: false });
    }
  },

  // ---- Execute action plan -----------------------------------------------

  async executeActionPlan(messageId, plan) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Debes iniciar sesion para ejecutar acciones');
      return;
    }

    const { projectId, conversationId } = get();
    const requiresProject = plan.actions.some(
      (a) => !['create_project'].includes((a as { type: string }).type),
    );
    if (!projectId && requiresProject) {
      toast.error('No hay proyecto seleccionado');
      return;
    }

    // Mark as executing
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, isExecuting: true } : m,
      ),
    }));

    try {
      // Detect new ActionPlan format (Action[] has `table` + `data`, legacy has `target` + `changes`)
      const isNewFormat = plan.actions.length > 0 && 'table' in plan.actions[0];
      const { results, batchId } = isNewFormat
        ? await executeNewActionPlan(plan as unknown as ActionPlan, projectId, user.id, conversationId ?? undefined)
        : await execPlan(plan.actions, projectId ?? '', user.id);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      set((state: KiyokoChatState) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, executionResults: results as AiActionResult[], executedBatchId: batchId, isExecuting: false }
            : m,
        ),
        suggestions: [
          'Revisa los cambios aplicados',
          'Genera nuevos prompts de imagen para las escenas modificadas',
          'Analiza si hay inconsistencias tras los cambios',
        ],
      }) as Partial<KiyokoChatState>);

      if (failCount === 0) {
        toast.success(`${successCount === 1 ? 'Creado' : `${successCount} acciones ejecutadas`} correctamente`);
      } else {
        const firstError = (results as Array<{ success: boolean; error?: string }>)
          .find((r) => !r.success)?.error ?? 'Error desconocido';
        toast.error(`Error: ${firstError}`);
      }

      // Save conversation after execution
      const { conversationId: convId } = get();
      await saveConversation(get, set, convId, projectId);
    } catch (err) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, isExecuting: false } : m,
        ),
      }));
      toast.error(err instanceof Error ? err.message : 'Error al ejecutar el plan');
    }
  },

  // ---- Cancel action plan ------------------------------------------------

  cancelActionPlan(messageId) {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, actionPlan: undefined } : m,
      ),
    }));
  },

  // ---- Undo batch --------------------------------------------------------

  async undoBatch(batchId) {
    try {
      const { success, restoredCount } = await undoActionBatch(batchId);
      if (success) {
        toast.success(`${restoredCount} cambios deshechos`);
        set((state) => ({
          messages: state.messages.map((m) =>
            m.executedBatchId === batchId
              ? { ...m, executedBatchId: undefined, executionResults: undefined }
              : m,
          ),
        }));
      } else {
        toast.error('No se pudieron deshacer los cambios');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al deshacer cambios');
    }
  },

  // ---- Load conversations ------------------------------------------------

  async loadConversations() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, message_count')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (data) {
      set({ conversations: data as Conversation[] });
    }
  },

  // ---- Delete a conversation ---------------------------------------------

  async deleteConversation(id) {
    const supabase = createClient();
    await supabase.from('ai_conversations').delete().eq('id', id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      ...(state.conversationId === id
        ? { conversationId: null, messages: [], suggestions: [] }
        : {}),
    }));
  },

  // ---- Rename a conversation ---------------------------------------------

  async renameConversation(id, title) {
    const supabase = createClient();
    await supabase.from('ai_conversations').update({ title }).eq('id', id);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c,
      ),
    }));
  },

  // ---- Load a specific conversation --------------------------------------

  async loadConversation(convId) {
    const supabase = createClient();
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, messages')
      .eq('id', convId)
      .single();

    if (!data) {
      toast.error('Conversacion no encontrada');
      return;
    }

    const rawMessages = data.messages as unknown as Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      images?: string[];
      actionPlan?: AiActionPlan;
      executionResults?: AiActionResult[];
      executedBatchId?: string;
      creationCancelled?: { subtitle?: string };
      creationSuccess?: KiyokoMessage['creationSuccess'];
    }>;

    const restored: KiyokoMessage[] = (rawMessages ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
      images: m.images,
      actionPlan: m.actionPlan,
      executionResults: m.executionResults,
      executedBatchId: m.executedBatchId,
      creationCancelled: m.creationCancelled,
      creationSuccess: m.creationSuccess,
    }));

    set({ conversationId: convId, messages: restored, suggestions: [] });
  },

  // ---- Start new conversation --------------------------------------------

  startNewConversation() {
    set({ conversationId: null, messages: [], suggestions: [] });
  },

  // Persistir al BD también para “acciones instantáneas”
  // (smart commands / formularios) que no pasan por sendMessage().
  persistConversationNow: async () => {
    const state = get();
    await saveConversation(get, set, state.conversationId, state.projectId);
  },
}));

// ---------------------------------------------------------------------------
// Internal: persist conversation to Supabase
// ---------------------------------------------------------------------------

async function saveConversation(
  get: () => KiyokoChatState,
  set: (partial: Partial<KiyokoChatState> | ((state: KiyokoChatState) => Partial<KiyokoChatState>)) => void,
  existingConvId: string | null,
  projectId: string | null,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { messages } = get();
  if (messages.length === 0) return;

  const serialized = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp.toISOString(),
    images: m.images,
    actionPlan: m.actionPlan,
    executionResults: m.executionResults,
    executedBatchId: m.executedBatchId,
    creationCancelled: m.creationCancelled,
    creationSuccess: m.creationSuccess,
  }));

  const firstUser = messages.find((m) => m.role === 'user');
  const title = firstUser
    ? firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? '...' : '')
    : 'Nueva conversacion';

  if (existingConvId) {
    await supabase
      .from('ai_conversations')
      .update({
        messages: serialized as any,
        title,
        message_count: messages.length,
      })
      .eq('id', existingConvId);
  } else {
    const { data } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        project_id: projectId,
        title,
        messages: serialized as any,
        message_count: messages.length,
        conversation_type: 'chat',
      } as any)
      .select('id')
      .single();

    if (data) {
      set((state: KiyokoChatState) => ({
        conversationId: data.id,
        conversations: [
          {
            id: data.id,
            title,
            created_at: new Date().toISOString(),
            message_count: messages.length,
          },
          ...state.conversations,
        ],
      }));
    }
  }
}
