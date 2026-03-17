'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconStethoscope,
  IconTimeline,
  IconScript,
  IconUsersGroup,
  IconPhoto,
  IconClock,
  IconBookmarks,
  IconMessageChatbot,
  IconFileExport,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils/cn';

interface ProjectTab {
  label: string;
  segment: string;
  icon: React.ReactNode;
}

const PROJECT_TABS: ProjectTab[] = [
  { label: 'Overview', segment: '', icon: <IconLayoutDashboard className="size-4" /> },
  { label: 'Diagn\u00f3stico', segment: 'diagnosis', icon: <IconStethoscope className="size-4" /> },
  { label: 'Arco', segment: 'arc', icon: <IconTimeline className="size-4" /> },
  { label: 'Escenas', segment: 'scenes', icon: <IconScript className="size-4" /> },
  { label: 'Personajes', segment: 'characters', icon: <IconUsersGroup className="size-4" /> },
  { label: 'Fondos', segment: 'backgrounds', icon: <IconPhoto className="size-4" /> },
  { label: 'Timeline', segment: 'timeline', icon: <IconClock className="size-4" /> },
  { label: 'Referencias', segment: 'references', icon: <IconBookmarks className="size-4" /> },
  { label: 'Chat IA', segment: 'chat', icon: <IconMessageChatbot className="size-4" /> },
  { label: 'Exportar', segment: 'export', icon: <IconFileExport className="size-4" /> },
];

interface SidebarProjectNavProps {
  projectId: string;
  projectName?: string;
  collapsed?: boolean;
}

export function SidebarProjectNav({
  projectId,
  projectName,
  collapsed = false,
}: SidebarProjectNavProps) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <div>
      {!collapsed && projectName && (
        <p
          className="px-5 mb-2 text-xs font-semibold text-foreground-muted truncate uppercase tracking-wider"
          title={projectName}
        >
          {projectName}
        </p>
      )}

      <ul className="space-y-0.5 px-3">
        {PROJECT_TABS.map((tab) => {
          const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
          const isActive = tab.segment
            ? pathname.startsWith(href)
            : pathname === basePath;

          return (
            <li key={tab.segment || 'overview'}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-brand-500/15 text-brand-600 font-medium'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-surface-tertiary',
                )}
                title={collapsed ? tab.label : undefined}
              >
                <span className="shrink-0">{tab.icon}</span>
                {!collapsed && <span>{tab.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
