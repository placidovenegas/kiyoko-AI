'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

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
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-surface-tertiary bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-tertiary px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs text-foreground-muted transition-colors hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" /> Marcar todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="mb-2 h-8 w-8 text-foreground-muted/20" />
                  <p className="text-sm text-foreground-muted">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 border-b border-surface-tertiary/50 px-4 py-3 transition-colors hover:bg-surface-secondary',
                      !notif.read && 'bg-brand-500/5',
                    )}
                  >
                    {/* Type indicator */}
                    <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', typeIcon[notif.type] || 'bg-gray-500/20 text-gray-500')}>
                      <Bell className="h-3 w-3" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs', notif.read ? 'text-foreground-secondary' : 'font-medium text-foreground')}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-foreground-muted">{formatTime(notif.created_at)}</span>
                      </div>
                      {notif.body && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground-muted">{notif.body}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => { markAsRead(notif.id); setOpen(false); }}
                            className="inline-flex items-center gap-0.5 text-[10px] text-brand-500 hover:underline"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> Ver
                          </Link>
                        )}
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notif.id)}
                            className="inline-flex items-center gap-0.5 text-[10px] text-foreground-muted hover:text-foreground"
                          >
                            <Check className="h-2.5 w-2.5" /> Leida
                          </button>
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
