'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';

export interface AiConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  context_entity_type: string | null;
  context_entity_id: string | null;
  video_id: string | null;
  conversation_type: string | null;
  completed: boolean;
}

interface UseAiConversationsOptions {
  projectId?: string;
  videoId?: string;
  contextType?: string; // 'dashboard' | 'project' | 'video' | 'scene'
  enabled?: boolean;
}

/**
 * List AI conversations filtered by context.
 * Dashboard shows all user conversations without a project.
 * Project shows project conversations without a video.
 * Video/Scene shows video conversations.
 */
export function useAiConversations({
  projectId,
  videoId,
  contextType,
  enabled = true,
}: UseAiConversationsOptions) {
  const supabase = createClient();

  return useQuery({
    queryKey: videoId
      ? queryKeys.conversations.byVideo(videoId)
      : projectId
        ? queryKeys.conversations.byProject(projectId)
        : queryKeys.conversations.byContext('dashboard', 'all'),
    queryFn: async (): Promise<AiConversationSummary[]> => {
      let query = supabase
        .from('ai_conversations')
        .select('id, title, created_at, updated_at, message_count, context_entity_type, context_entity_id, video_id, conversation_type, completed')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (videoId) {
        query = query.eq('video_id', videoId);
      } else if (projectId) {
        query = query.eq('project_id', projectId).is('video_id', null);
      } else {
        // Dashboard — conversations not tied to any project
        query = query.is('project_id', null);
      }

      if (contextType) {
        query = query.eq('context_entity_type', contextType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AiConversationSummary[];
    },
    enabled: enabled,
    staleTime: 30_000,
  });
}

/**
 * Load a single conversation with its full messages array.
 */
export function useAiConversation(conversationId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, title, messages, message_count, created_at, updated_at, video_id, project_id')
        .eq('id', conversationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}

/**
 * Delete a conversation and invalidate the list.
 */
export function useDeleteConversation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

/**
 * Rename a conversation.
 */
export function useRenameConversation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
