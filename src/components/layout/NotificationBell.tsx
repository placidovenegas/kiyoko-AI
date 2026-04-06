'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@heroui/react';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useInboxNotifications } from '@/hooks/useInboxNotifications';
import { cn } from '@/lib/utils/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useDashboard();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useInboxNotifications(user.id);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
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
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onPress={() => markAllAsRead.mutate()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" /> Marcar todas
                </Button>
              ) : null}
            </div>

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
                    <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', typeIcon[notif.type] || 'bg-muted text-muted-foreground')}>
                      <Bell className="h-3 w-3" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs', notif.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                      </div>
                      {notif.body ? <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{notif.body}</p> : null}
                      <div className="mt-1 flex items-center gap-2">
                        {notif.link ? (
                          <Link
                            href={notif.link}
                            onClick={() => {
                              markAsRead.mutate(notif.id);
                              setOpen(false);
                            }}
                            className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> Ver
                          </Link>
                        ) : null}
                        {!notif.read ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onPress={() => markAsRead.mutate(notif.id)}
                            className="h-auto px-1 py-0 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            <Check className="h-2.5 w-2.5" /> Leida
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
