'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchInboxNotifications } from '@/lib/queries/notifications';
import type { Notification } from '@/types';

export function useInboxNotifications(userId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const inboxKey = queryKeys.notifications.inbox(userId ?? 'anonymous');

  const query = useQuery({
    queryKey: inboxKey,
    queryFn: () => fetchInboxNotifications(supabase, userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: inboxKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inboxKey, queryClient, supabase, userId]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: inboxKey });
      const previous = queryClient.getQueryData<Notification[]>(inboxKey);
      queryClient.setQueryData<Notification[]>(
        inboxKey,
        (current) => current?.map((item) => (item.id === id ? { ...item, read: true } : item)) ?? [],
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(inboxKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unreadIds = (query.data ?? []).filter((item) => !item.read).map((item) => item.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: inboxKey });
      const previous = queryClient.getQueryData<Notification[]>(inboxKey);
      queryClient.setQueryData<Notification[]>(
        inboxKey,
        (current) => current?.map((item) => ({ ...item, read: true })) ?? [],
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(inboxKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
    },
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const actionableCount = notifications.filter((item) => Boolean(item.link)).length;
  const todayCount = notifications.filter((item) => {
    if (!item.created_at) return false;
    const createdAt = new Date(item.created_at);
    const now = new Date();
    return createdAt.toDateString() === now.toDateString();
  }).length;

  return {
    ...query,
    inboxKey,
    notifications,
    unreadCount,
    actionableCount,
    todayCount,
    markAsRead,
    markAllAsRead,
  };
}