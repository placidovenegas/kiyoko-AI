'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';

const PROJECT_TABS = [
  { id: 'overview', label: 'Overview', href: '' },
  { id: 'storyboard', label: 'Storyboard', href: '/storyboard' },
  { id: 'analysis', label: 'Diagnostico', href: '/analysis' },
  { id: 'arc', label: 'Arco', href: '/arc' },
  { id: 'scenes', label: 'Escenas', href: '/scenes' },
  { id: 'characters', label: 'Personajes', href: '/characters' },
  { id: 'backgrounds', label: 'Fondos', href: '/backgrounds' },
  { id: 'timeline', label: 'Timeline', href: '/timeline' },
  { id: 'references', label: 'Referencias', href: '/references' },
  { id: 'chat', label: 'Chat IA', href: '/chat' },
  { id: 'exports', label: 'Exportar', href: '/exports' },
] as const;

function ProjectHeader() {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;
  const basePath = `/p/${slug}`;
  const { project, loading } = useProject();

  function isActive(tabHref: string) {
    if (tabHref === '') return pathname === basePath;
    return pathname.startsWith(`${basePath}${tabHref}`);
  }

  return (
    <div >
      {/* Project header */}
      <div className="mb-6 flex items-center justify-between ">
        <div className="pl-4 pt-4">
          {loading ? (
            <>
              <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-secondary" />
              <div className="mt-1.5 h-4 w-32 animate-pulse rounded bg-surface-secondary" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">
                {project?.title ?? slug}
              </h1>
              <p className="text-sm text-foreground-muted">
                {project?.client_name || 'Proyecto de storyboard'}
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`${basePath}/settings`}
            className="rounded-lg border border-surface-tertiary px-3 py-2 text-sm text-foreground-secondary transition hover:bg-surface-secondary"
          >
            Ajustes
          </Link>
          <Link
            href={`${basePath}/exports`}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            Exportar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className=" flex gap-1 overflow-x-auto border-b border-surface-tertiary">
        {PROJECT_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`${basePath}${tab.href}`}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition',
              isActive(tab.href)
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <ProjectHeader />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </ProjectProvider>
  );
}
