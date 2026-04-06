'use client';

import { useEffect, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ProjectSettingsModal } from '@/components/project/ProjectSettingsModal';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { useRealtimeProject } from '@/hooks/useRealtimeProject';
import { useUIStore } from '@/stores/useUIStore';

function RealtimeSync() {
  const { project } = useProject();
  useRealtimeProject(project?.id);
  return null;
}

function ProjectSettingsRouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ shortId: string }>();
  const projectSettingsModalOpen = useUIStore((state) => state.projectSettingsModalOpen);
  const openProjectSettingsModal = useUIStore((state) => state.openProjectSettingsModal);

  const settingsSection = useMemo(() => {
    if (pathname.endsWith('/settings/ai')) return 'ia';
    if (pathname.endsWith('/settings')) return 'general';
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!settingsSection || projectSettingsModalOpen) return;
    openProjectSettingsModal(settingsSection);
  }, [openProjectSettingsModal, projectSettingsModalOpen, settingsSection]);

  useEffect(() => {
    if (!settingsSection || projectSettingsModalOpen) return;
    router.replace(`/project/${params.shortId}`, { scroll: false });
  }, [params.shortId, pathname, projectSettingsModalOpen, router, settingsSection]);

  return null;
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <RealtimeSync />
      <ProjectSettingsRouteSync />
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
      <ProjectSettingsModal />
    </ProjectProvider>
  );
}
