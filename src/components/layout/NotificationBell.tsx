'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const NOTIFICATIONS_KEY = ['notifications'] as const;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const supabase = createClient();

  // ---- Fetch with useQuery ----
  const { data: notifications = [] } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return (data as Notification[]) ?? [];
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ---- Realtime subscription ----
  useEffect(() => {
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, qc]);

  // ---- Mutations ----
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev = qc.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
        old?.map((n) => n.id === id ? { ...n, read: true } : n) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIFICATIONS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev = qc.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
        old?.map((n) => ({ ...n, read: true })) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIFICATIONS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  // ---- Helpers ----
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d`;
  };

  const typeIcon: Record<string, string> = {
    task_due: 'bg-amber-500/20 text-amber-500',
    video_scheduled: 'bg-blue-500/20 text-blue-500',
    ai_completed: 'bg-purple-500/20 text-purple-500',
    scene_updated: 'bg-green-500/20 text-green-500',
    export_ready: 'bg-cyan-500/20 text-cyan-500',
    comment_mention: 'bg-pink-500/20 text-pink-500',
    share_invite: 'bg-indigo-500/20 text-indigo-500',
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        isIconOnly
        onPress={() => setOpen(!open)}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        className="relative size-8"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onPress={() => markAllReadMutation.mutate()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" /> Marcar todas
                </Button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-accent/50',
                      !notif.read && 'bg-primary/5',
                    )}
                  >
                    {/* Type indicator */}
                    <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', typeIcon[notif.type] || 'bg-muted text-muted-foreground')}>
                      <Bell className="h-3 w-3" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs', notif.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                      </div>
                      {notif.body && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{notif.body}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => { markAsReadMutation.mutate(notif.id); setOpen(false); }}
                            className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> Ver
                          </Link>
                        )}
                        {!notif.read && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onPress={() => markAsReadMutation.mutate(notif.id)}
                            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground h-auto py-0 px-1"
                          >
                            <Check className="h-2.5 w-2.5" /> Leida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
