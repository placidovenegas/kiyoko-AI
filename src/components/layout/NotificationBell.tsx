'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, ExternalLink, Sparkles, Film, Share2, FileOutput } from 'lucide-react';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useInboxNotifications } from '@/hooks/useInboxNotifications';
import { cn } from '@/lib/utils/cn';

const TYPE_STYLES: Record<string, { bg: string; icon: typeof Bell }> = {
  ai_completed: { bg: 'bg-purple-500/15 text-purple-400', icon: Sparkles },
  scene_updated: { bg: 'bg-emerald-500/15 text-emerald-400', icon: Film },
  export_ready: { bg: 'bg-cyan-500/15 text-cyan-400', icon: FileOutput },
  share_invite: { bg: 'bg-indigo-500/15 text-indigo-400', icon: Share2 },
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useDashboard();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useInboxNotifications(user.id);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        className="relative flex items-center justify-center size-7 rounded-lg bg-accent/50 border border-border/50 text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground transition-all">
        <Bell className="size-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-foreground">Notificaciones</p>
              {unreadCount > 0 && (
                <button type="button" onClick={() => markAllAsRead.mutate()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <CheckCheck className="size-3" /> Marcar todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Bell className="size-6 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] ?? { bg: 'bg-muted text-muted-foreground', icon: Bell };
                  const Icon = style.icon;
                  return (
                    <div key={n.id} className={cn(
                      'flex items-start gap-2.5 px-3.5 py-2.5 border-b border-border/30 hover:bg-accent/30 transition-colors',
                      !n.read && 'bg-primary/5',
                    )}>
                      <div className={cn('flex size-6 items-center justify-center rounded-lg shrink-0 mt-0.5', style.bg)}>
                        <Icon className="size-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-[11px] leading-tight', n.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground/50 shrink-0">{formatTime(n.created_at)}</span>
                        </div>
                        {n.body && <p className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5">{n.body}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {n.link && (
                            <Link href={n.link} onClick={() => { markAsRead.mutate(n.id); setOpen(false); }}
                              className="text-[9px] text-primary hover:underline flex items-center gap-0.5">
                              <ExternalLink className="size-2.5" /> Ver
                            </Link>
                          )}
                          {!n.read && (
                            <button type="button" onClick={() => markAsRead.mutate(n.id)}
                              className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                              <Check className="size-2.5" /> Leida
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
