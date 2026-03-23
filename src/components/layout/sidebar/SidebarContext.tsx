'use client';

import { usePathname } from 'next/navigation';

type SidebarLevel = 'dashboard' | 'project' | 'video';

interface SidebarContextValue {
  level: SidebarLevel;
  projectShortId: string | null;
  videoShortId: string | null;
}

export function useSidebarContext(): SidebarContextValue {
  const pathname = usePathname();

  // /project/[shortId]/video/[videoShortId]/*
  const videoMatch = pathname.match(/\/project\/([^/]+)\/video\/([^/]+)/);
  if (videoMatch) {
    return { level: 'video', projectShortId: videoMatch[1], videoShortId: videoMatch[2] };
  }

  // /project/[shortId]/*
  const projectMatch = pathname.match(/\/project\/([^/]+)/);
  if (projectMatch) {
    return { level: 'project', projectShortId: projectMatch[1], videoShortId: null };
  }

  // /dashboard, /new, /settings, /admin, etc.
  return { level: 'dashboard', projectShortId: null, videoShortId: null };
}
