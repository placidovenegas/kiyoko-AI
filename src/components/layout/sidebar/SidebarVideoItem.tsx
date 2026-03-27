'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Film, MoreHorizontal, ExternalLink, Copy, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Video {
  id: string;
  short_id: string;
  title: string;
  platform: string | null;
  status: string;
}

export function SidebarVideoItem({ video, projectShortId }: { video: Video; projectShortId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const href = `/project/${projectShortId}/video/${video.short_id}`;
  const isActive = pathname.startsWith(href);

  return (
    <li className="group/video relative">
      <Link
        href={href}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Film className="h-3 w-3 shrink-0 text-sidebar-foreground/45" />
        <span className="truncate group-hover/video:pr-7">{video.title}</span>
      </Link>

      {/* Hover menu */}
      <div className="absolute right-1 top-0 bottom-0 flex items-center opacity-0 group-hover/video:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center size-5 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={href}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir vídeo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Renombrar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-400 focus:text-red-400">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
