'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MoreHorizontal, ExternalLink, Link2, Copy, Pencil, Star, Trash2, Share2, ChevronDown } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useFavorites } from '@/hooks/useFavorites';
import { useSidebar } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MAX_VISIBLE = 5;

function FavItemMenu({ fav, toggleFavorite }: { fav: { id: string; slug: string }; toggleFavorite: (id: string) => void }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-center size-6 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/project/${fav.slug}`}><ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir proyecto</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/project/${fav.slug}`); toast.success('Link copiado'); }}>
          <Link2 className="mr-2 h-3.5 w-3.5" /> Copiar link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/project/${fav.slug}/settings/sharing`)}>
          <Share2 className="mr-2 h-3.5 w-3.5" /> Compartir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem><Copy className="mr-2 h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
        <DropdownMenuItem><Pencil className="mr-2 h-3.5 w-3.5" /> Renombrar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggleFavorite(fav.id)}>
          <Star className="mr-2 h-3.5 w-3.5 fill-yellow-500 text-yellow-500" /> Quitar de favoritos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-400 focus:text-red-400"><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarFavorites() {
  const pathname = usePathname();
  const { favorites, toggleFavorite } = useFavorites();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [showAll, setShowAll] = useState(false);

  if (favorites.length === 0) return null;

  const visible = showAll ? favorites : favorites.slice(0, MAX_VISIBLE);
  const hasMore = favorites.length > MAX_VISIBLE;

  // ── Collapsed: star icon with popover ──
  if (isCollapsed) {
    return (
      <div className="px-2 py-0.5">
        <Popover>
          <Tooltip>
            <Tooltip.Trigger>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                >
                  <Star className="h-4 w-4" />
                </button>
              </PopoverTrigger>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">Favoritos</Tooltip.Content>
          </Tooltip>
          <PopoverContent side="right" align="start" sideOffset={8} className="w-56 p-1">
            <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">Favoritos</p>
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/project/${fav.slug}`}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 h-8 text-[13px] transition-colors',
                  pathname.startsWith(`/project/${fav.slug}`)
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-foreground/80 hover:bg-accent',
                )}
              >
                <span className="truncate">{fav.title}</span>
              </Link>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // ── Expanded: full list ──
  return (
    <div className="px-1.5 py-1">
      <div className="flex items-center px-2 h-7 mb-0.5">
        <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">Favoritos</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {visible.map((fav) => {
          const isActive = pathname.startsWith(`/project/${fav.slug}`);
          return (
            <li key={fav.id} className="group/fav relative">
              <Link
                href={`/project/${fav.slug}`}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 h-8 text-[13px] transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <span className="truncate group-hover/fav:pr-7">{fav.title}</span>
              </Link>
              <div className="absolute right-1 top-0 bottom-0 flex items-center opacity-0 group-hover/fav:opacity-100 transition-opacity z-10">
                <FavItemMenu fav={fav} toggleFavorite={toggleFavorite} />
              </div>
            </li>
          );
        })}
        {hasMore && (
          <li>
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="flex w-full items-center gap-2 rounded-md px-2 h-7 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform', showAll && 'rotate-180')} />
              <span>{showAll ? 'Ver menos' : `Ver ${favorites.length - MAX_VISIBLE} más`}</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
