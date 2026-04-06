'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Home, Inbox, CheckSquare, Sparkles } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';

const NAV_ITEMS = [
  { id: 'search', label: 'Buscar', icon: Search, href: null, shortcut: '⌘K' },
  { id: 'home', label: 'Inicio', icon: Home, href: '/dashboard' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, href: '/dashboard/notifications', badge: true },
  { id: 'tasks', label: 'Tareas', icon: CheckSquare, href: '/dashboard/tasks' },
  { id: 'kiyoko', label: 'Kiyoko IA', icon: Sparkles, href: null },
];

export function SidebarNavFixed() {
  const pathname = usePathname();
  const toggleChat = useUIStore((s) => s.toggleChat);
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  function handleSearch() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  }

  return (
    <div className={isCollapsed ? 'px-2 py-1.5' : 'px-1.5 py-1.5'}>
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.id === 'kiyoko' ? chatPanelOpen :
            item.href ? (item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)) :
            false;

          const handleClick = item.id === 'search' ? handleSearch
            : item.id === 'kiyoko' ? toggleChat
            : undefined;

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
              {!isCollapsed && item.badge && (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  3
                </span>
              )}
              {!isCollapsed && item.shortcut && (
                <span className="ml-auto text-[10px] text-sidebar-foreground/30">{item.shortcut}</span>
              )}
            </>
          );

          const element = item.href ? (
            <Link href={item.href} className={cls}>{content}</Link>
          ) : (
            <button type="button" onClick={handleClick} className={cls}>{content}</button>
          );

          return (
            <li key={item.id}>
              {isCollapsed ? (
                <Tooltip>
                  <Tooltip.Trigger>{element}</Tooltip.Trigger>
                  <Tooltip.Content placement="right">{item.label}</Tooltip.Content>
                </Tooltip>
              ) : element}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
