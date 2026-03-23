'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import {
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction,
} from '@/components/ui/sidebar';

export function SidebarFavorites() {
  const pathname = usePathname();
  const { favorites, toggleFavorite } = useFavorites();

  if (favorites.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {favorites.map((fav) => (
            <SidebarMenuItem key={fav.id}>
              <SidebarMenuButton
                render={<Link href={`/project/${fav.slug}`} />}
                isActive={pathname.startsWith(`/project/${fav.slug}`)}
                tooltip={fav.title}
              >
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                <span className="truncate">{fav.title}</span>
              </SidebarMenuButton>
              <SidebarMenuAction onClick={() => toggleFavorite(fav.id)} showOnHover>
                <Star className="h-4 w-4" />
              </SidebarMenuAction>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
