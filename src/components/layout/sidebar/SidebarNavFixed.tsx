'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Home, Inbox, CheckSquare, Sparkles } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useSidebar } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { useTranslations } from 'next-intl';

export function SidebarNavFixed() {
  const pathname = usePathname();
  const toggleChat = useUIStore((s) => s.toggleChat);
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const t = useTranslations();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      return count ?? 0;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  function handleSearch() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  }

  const items = [
    { id: 'search', label: t('common.search'), icon: Search, href: null, shortcut: '⌘K', onClick: handleSearch },
    { id: 'home', label: t('nav.dashboard'), icon: Home, href: '/dashboard' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, href: '/dashboard/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'tasks', label: t('project.tasks'), icon: CheckSquare, href: '/dashboard/tasks' },
    { id: 'kiyoko', label: 'Kiyoko IA', icon: Sparkles, href: null, onClick: toggleChat },
  ];

  return (
    <div className={isCollapsed ? 'px-2 py-1' : 'px-1.5 py-1'}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = item.id === 'kiyoko' ? chatPanelOpen
            : item.href ? (item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href))
            : false;

          const cls = cn(
            'flex items-center rounded-md transition-colors cursor-pointer',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed ? 'justify-center size-8' : 'w-full gap-2.5 px-2 h-8 text-[13px]',
          );

          const content = (
            <>
              <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge != null && (
                <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {!isCollapsed && item.shortcut && !item.badge && (
                <span className="ml-auto text-[10px] text-sidebar-foreground/30">{item.shortcut}</span>
              )}
            </>
          );

          const el = item.href
            ? <Link href={item.href} className={cls}>{content}</Link>
            : <button type="button" onClick={item.onClick} className={cls}>{content}</button>;

          return (
            <li key={item.id}>
              {isCollapsed ? (
                <Tooltip><Tooltip.Trigger>{el}</Tooltip.Trigger><Tooltip.Content placement="right">{item.label}</Tooltip.Content></Tooltip>
              ) : el}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
