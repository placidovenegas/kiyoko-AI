'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Sparkles, Film, Share2, FileOutput, Inbox as InboxIcon } from 'lucide-react';
import { TextField, Input, Label } from '@heroui/react';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useInboxNotifications } from '@/hooks/useInboxNotifications';
import { cn } from '@/lib/utils/cn';

type InboxFilter = 'all' | 'unread' | 'actionable';

const TYPE_STYLES: Record<string, { bg: string; icon: typeof Bell }> = {
  ai_completed: { bg: 'bg-purple-500/15 text-purple-400', icon: Sparkles },
  scene_updated: { bg: 'bg-emerald-500/15 text-emerald-400', icon: Film },
  export_ready: { bg: 'bg-cyan-500/15 text-cyan-400', icon: FileOutput },
  share_invite: { bg: 'bg-indigo-500/15 text-indigo-400', icon: Share2 },
};

function formatTime(v: string | null): string {
  if (!v) return '';
  const m = Math.floor((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function InboxView() {
  const { user } = useDashboard();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useInboxNotifications(user.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      if (q && !n.title.toLowerCase().includes(q) && !n.body?.toLowerCase().includes(q)) return false;
      if (filter === 'unread') return !n.read;
      if (filter === 'actionable') return !!n.link;
      return true;
    });
  }, [filter, notifications, search]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notificaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'} · {notifications.length} totales
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => markAllAsRead.mutate()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <CheckCheck className="size-3.5" /> Marcar todas
          </button>
        )}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          {([
            { key: 'all', label: 'Todas' },
            { key: 'unread', label: 'Sin leer' },
            { key: 'actionable', label: 'Con accion' },
          ] as const).map((o) => (
            <button key={o.key} type="button" onClick={() => setFilter(o.key)}
              className={cn('rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                filter === o.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
              {o.label}
            </button>
          ))}
        </div>
        <TextField variant="secondary" value={search} onChange={setSearch} className="w-48">
          <Label className="sr-only">Buscar</Label>
          <Input placeholder="Buscar..." />
        </TextField>
      </div>

      {/* Notifications list */}
      <div className="space-y-1.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <InboxIcon className="size-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? 'Sin resultados' : 'Sin notificaciones'}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? 'Prueba con otro termino' : 'Las notificaciones nuevas aparecen aqui'}</p>
          </div>
        ) : (
          filtered.map((n) => {
            const style = TYPE_STYLES[n.type] ?? { bg: 'bg-muted text-muted-foreground', icon: Bell };
            const Icon = style.icon;
            return (
              <div key={n.id} className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-accent/30',
                n.read ? 'border-border bg-card' : 'border-primary/15 bg-primary/5',
              )}>
                <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0 mt-0.5', style.bg)}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn('text-sm', n.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-0.5">{formatTime(n.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground/40">{n.type.replace(/_/g, ' ')}</span>
                    {n.link && (
                      <Link href={n.link} onClick={() => markAsRead.mutate(n.id)}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <ExternalLink className="size-2.5" /> Abrir
                      </Link>
                    )}
                    {!n.read && (
                      <button type="button" onClick={() => markAsRead.mutate(n.id)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
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
  );
}
