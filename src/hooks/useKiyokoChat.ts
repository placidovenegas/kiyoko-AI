import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { executeActionPlan as execPlan, undoBatch as undoActionBatch } from '@/lib/ai/action-executor';
import type { AiActionPlan, AiActionResult } from '@/types/ai-actions';
import { toast } from 'sonner';

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
  actionPlan?: AiActionPlan;
  executionResults?: AiActionResult[];
  executedBatchId?: string;
  isExecuting?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface VideoCut {
  id: string;
  name: string;
  slug: string;
  platform: string;
  target_duration_seconds: number;
  is_primary: boolean;
  status: string;
  color: string;
}

interface KiyokoChatState {
  // State
  messages: KiyokoMessage[];
  isStreaming: boolean;
  conversationId: string | null;
  projectId: string | null;
  projectSlug: string | null;
  conversations: Conversation[];
  isExpanded: boolean;
  attachedImages: ImageAttachment[];
  suggestions: string[];
  activeProvider: string | null;
  videoCuts: VideoCut[];
  activeVideoCutId: string | null; // which video cut we're working on

  // Methods
  setProject: (id: string | null, slug: string | null) => void;
  sendMessage: (text: string, images?: ImageAttachment[]) => Promise<void>;
  stopStreaming: () => void;
  executeActionPlan: (messageId: string, plan: AiActionPlan) => Promise<void>;
  cancelActionPlan: (messageId: string) => void;
  undoBatch: (batchId: string) => Promise<void>;
  loadConversation: (convId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  startNewConversation: () => void;
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

async function uploadImage(file: File, projectId: string | null): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'png';
  const path = `${projectId || 'general'}/${generateId()}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { contentType: file.type });

  if (error) {
    console.error('Upload error:', error);
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

export const useKiyokoChat = create<KiyokoChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
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

  // ---- Video cuts ---------------------------------------------------------

  setActiveVideoCut(cutId) {
    set({ activeVideoCutId: cutId });
  },

  async loadVideoCuts() {
    const { projectId } = get();
    if (!projectId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from('video_cuts')
      .select('id, name, slug, platform, target_duration_seconds, is_primary, status, color')
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
      if (id) {
        const supabase = createClient();
        // Load conversations + video cuts in parallel
        Promise.all([
          supabase
            .from('ai_conversations')
            .select('id, title, created_at, message_count')
            .eq('project_id', id)
            .order('updated_at', { ascending: false })
            .limit(50),
          supabase
            .from('video_cuts')
            .select('id, name, slug, platform, target_duration_seconds, is_primary, status, color')
            .eq('project_id', id)
            .order('sort_order', { ascending: true }),
        ]).then(([convsRes, cutsRes]) => {
          const convs = (convsRes.data ?? []) as Conversation[];
          const cuts = (cutsRes.data ?? []) as VideoCut[];
          const primary = cuts.find((c) => c.is_primary);
          set({
            conversations: convs,
            videoCuts: cuts,
            activeVideoCutId: primary?.id ?? cuts[0]?.id ?? null,
          });
        });
      }
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
    set({ isStreaming: false, activeProvider: null });
  },

  // ---- Send message (SSE streaming) -------------------------------------

  async sendMessage(text, images) {
    // Cancel any in-flight request
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const { messages, projectId, conversationId, attachedImages: storeImages, activeVideoCutId } = get();
    const imagesToUpload = images || storeImages;

    // 1. Upload images if any
    let imageUrls: string[] = [];
    if (imagesToUpload.length > 0) {
      const uploadPromises = imagesToUpload.map((img) => uploadImage(img.file, projectId));
      const results = await Promise.all(uploadPromises);
      imageUrls = results.filter((url): url is string => url !== null);
    }

    // 2. Add user message
    const userMessage: KiyokoMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      images: imageUrls.length > 0 ? imageUrls : undefined,
    };
    set({
      messages: [...messages, userMessage],
      isStreaming: true,
      attachedImages: [],
      suggestions: [],
    });

    // Clean up preview URLs
    if (storeImages.length > 0 && !images) {
      storeImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    }

    // 3. Build history for the API
    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 4. Prepare assistant message placeholder
    const assistantId = generateId();
    let accumulated = '';

    try {
      // Read user's preferred provider from localStorage (set by Header dropdown)
      const preferredProvider = typeof window !== 'undefined'
        ? localStorage.getItem('kiyoko-ai-provider')
        : null;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          projectId,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          preferredProvider: preferredProvider || undefined,
          videoCutId: activeVideoCutId || undefined,
        }),
        signal: currentAbortController?.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }

      // Read which provider is responding
      const respondingProvider = res.headers.get('X-AI-Provider');
      if (respondingProvider) {
        set({ activeProvider: respondingProvider });
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
            // Non-JSON lines (AI SDK metadata) — skip
          }

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
                },
              ],
            };
          });
        }
      }

      // Handle non-SSE text/plain response
      if (!accumulated && res.headers.get('content-type')?.includes('text/plain')) {
        accumulated = decoder.decode();
      }

      // 6. Parse action plan and suggestions from final response
      const actionPlan = parseActionPlan(accumulated);
      const suggestions = parseSuggestions(accumulated);

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
              actionPlan: actionPlan ?? undefined,
            },
          ],
          suggestions,
        };
      });

      // 7. Save conversation to DB
      await saveConversation(get, set, conversationId, projectId);
    } catch (err) {
      // Aborted by user — not an error
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Keep the partial response as-is
        set({ isStreaming: false, activeProvider: null });
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Error de conexion con Kiyoko AI';
      toast.error(errorMessage);

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
        };
      });
    } finally {
      currentAbortController = null;
      set({ isStreaming: false, activeProvider: null });
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

    const { projectId } = get();
    if (!projectId) {
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
      const { results, batchId } = await execPlan(plan.actions, projectId, user.id);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, executionResults: results, executedBatchId: batchId, isExecuting: false }
            : m,
        ),
        suggestions: [
          'Revisa los cambios aplicados',
          'Genera nuevos prompts de imagen para las escenas modificadas',
          'Analiza si hay inconsistencias tras los cambios',
        ],
      }));

      if (failCount === 0) {
        toast.success(`${successCount} acciones ejecutadas correctamente`);
      } else {
        toast.warning(`${successCount} ejecutadas, ${failCount} fallaron`);
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
    const { projectId } = get();
    if (!projectId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, message_count')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (data) {
      set({ conversations: data as Conversation[] });
    }
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

    const rawMessages = data.messages as Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      images?: string[];
      actionPlan?: AiActionPlan;
      executionResults?: AiActionResult[];
      executedBatchId?: string;
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
    }));

    set({ conversationId: convId, messages: restored, suggestions: [] });
  },

  // ---- Start new conversation --------------------------------------------

  startNewConversation() {
    set({ conversationId: null, messages: [], suggestions: [] });
  },
}));

// ---------------------------------------------------------------------------
// Internal: persist conversation to Supabase
// ---------------------------------------------------------------------------

async function saveConversation(
  get: () => KiyokoChatState,
  set: (partial: Partial<KiyokoChatState>) => void,
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
  }));

  const firstUser = messages.find((m) => m.role === 'user');
  const title = firstUser
    ? firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? '...' : '')
    : 'Nueva conversacion';

  if (existingConvId) {
    await supabase
      .from('ai_conversations')
      .update({
        messages: serialized,
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
        messages: serialized,
        message_count: messages.length,
        conversation_type: 'chat',
      })
      .select('id')
      .single();

    if (data) {
      set({ conversationId: data.id });
    }
  }
}
