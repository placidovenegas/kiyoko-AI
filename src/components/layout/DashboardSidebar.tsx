'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Building2, Settings, Key, Users, Star } from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { SidebarOrgHeader } from './SidebarOrgHeader';
import { SidebarUserFooter } from './SidebarUserFooter';

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data?.role === 'admin') setIsAdmin(true); });
    });
  }, []);

  return (
    <>
      <SidebarOrgHeader />

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Proyectos" render={<Link href="/dashboard" />}>
                <LayoutDashboard /><span>Proyectos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/new'} tooltip="Nuevo Proyecto" render={<Link href="/new" />}>
                <PlusCircle /><span>Nuevo Proyecto</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/organizations')} tooltip="Organizaciones" render={<Link href="/organizations" />}>
                <Building2 /><span>Organizaciones</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Favorites */}
        <SidebarGroup>
          <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
          <SidebarMenu>
            {favorites.length === 0 && (
              <div className="px-2 py-3 text-xs text-sidebar-foreground/30">
                No hay favoritos
              </div>
            )}
            {favorites.map((fav) => (
              <SidebarMenuItem key={fav.id}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(`/project/${fav.slug}`)}
                  tooltip={fav.title}
                  render={<Link href={`/project/${fav.slug}`} />}
                >
                  <span>{fav.title}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  onClick={() => toggleFavorite(fav.id)}
                  title="Quitar de favoritos"
                >
                  <Star className="size-4 text-amber-500 hover:text-amber-500/60" fill="currentColor" />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname.startsWith('/admin')} tooltip="Usuarios" render={<Link href="/admin/users" />}>
                  <Users /><span>Usuarios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/settings'} tooltip="Ajustes" render={<Link href="/settings" />}>
                <Settings /><span>Ajustes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/settings/api-keys'} tooltip="API Keys" render={<Link href="/settings/api-keys" />}>
                <Key /><span>API Keys</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarUserFooter />
    </>
  );
}
