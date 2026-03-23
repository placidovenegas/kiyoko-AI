'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Home, CheckSquare, MessageCircle } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useUIStore } from '@/stores/useUIStore';

export function SidebarNavFixed() {
  const pathname = usePathname();
  const toggleChat = useUIStore((s) => s.toggleChat);
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen);

  function handleSearch() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSearch} tooltip="Buscar (⌘K)">
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              isActive={pathname === '/dashboard'}
              tooltip="Inicio"
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard/tasks" />}
              isActive={pathname.startsWith('/dashboard/tasks')}
              tooltip="Tareas"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Tareas</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleChat}
              isActive={chatPanelOpen}
              tooltip="Kiyoko IA"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Kiyoko IA</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
