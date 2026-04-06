'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Inbox as InboxIcon, Search, Zap } from 'lucide-react';
import { Button } from '@heroui/react';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useInboxNotifications } from '@/hooks/useInboxNotifications';
import { cn } from '@/lib/utils/cn';

type InboxFilter = 'all' | 'unread' | 'actionable';

const typeTone: Record<string, string> = {
  task_due: 'bg-amber-500/12 text-amber-500',
  video_scheduled: 'bg-sky-500/12 text-sky-500',
  ai_completed: 'bg-violet-500/12 text-violet-500',
  scene_updated: 'bg-emerald-500/12 text-emerald-500',
  export_ready: 'bg-cyan-500/12 text-cyan-500',
  comment_mention: 'bg-pink-500/12 text-pink-500',
  share_invite: 'bg-indigo-500/12 text-indigo-500',
};

function formatRelativeTime(value: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function InboxView() {
  const { user } = useDashboard();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const {
    notifications,
    unreadCount,
    actionableCount,
    todayCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useInboxNotifications(user.id);

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch = normalizedSearch.length === 0
        || notification.title.toLowerCase().includes(normalizedSearch)
        || notification.body?.toLowerCase().includes(normalizedSearch)
        || notification.type.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;
      if (filter === 'unread') return !notification.read;
      if (filter === 'actionable') return Boolean(notification.link);
      return true;
    });
  }, [filter, notifications, search]);

  return (
    <div className="space-y-6 px-3 py-4 lg:px-5">
      <section className="overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <InboxIcon className="size-3.5 text-primary" />
              Inbox
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Centro de notificaciones</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground lg:text-base">
              Revisa actividad reciente, avisos operativos y accesos directos a los elementos que requieren atención.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sin leer</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{unreadCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Accionables</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{actionableCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Hoy</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{todayCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Totales</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{notifications.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Las notificaciones nuevas aparecen aquí en tiempo real.</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 md:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar aviso, tipo o texto..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'unread', label: 'Sin leer' },
                { key: 'actionable', label: 'Con accion' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key as InboxFilter)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                    filter === option.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              className="kiyoko-panel-secondary-button"
              onPress={() => markAllAsRead.mutate()}
              isDisabled={unreadCount === 0 || markAllAsRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-border bg-background/70" />
            ))
          ) : error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger-foreground">
              No se pudo cargar la bandeja de entrada.
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
              <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-foreground">No hay resultados en esta vista</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Ajusta los filtros o espera nueva actividad del workspace para volver a llenar esta bandeja.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'rounded-2xl border p-4 transition-colors',
                  notification.read ? 'border-border bg-background/70' : 'border-primary/20 bg-primary/6'
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', typeTone[notification.type] || 'bg-muted text-muted-foreground')}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                        {!notification.read ? (
                          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                            Nuevo
                          </span>
                        ) : null}
                      </div>
                      {notification.body ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.body}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1">
                          <Zap className="h-3 w-3" />
                          {notification.type}
                        </span>
                        <span className="rounded-full border border-border bg-card px-2 py-1">{formatRelativeTime(notification.created_at)}</span>
                        {notification.link ? <span className="rounded-full border border-border bg-card px-2 py-1">Con acceso directo</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {notification.link ? (
                      <Link href={notification.link} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </Link>
                    ) : null}
                    {!notification.read ? (
                      <Button
                        variant="secondary"
                        className="kiyoko-panel-secondary-button"
                        onPress={() => markAsRead.mutate(notification.id)}
                        isDisabled={markAsRead.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Marcar leída
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}