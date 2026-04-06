'use client';

import { useParams } from 'next/navigation';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { useRealtimeProject } from '@/hooks/useRealtimeProject';
import { ProjectSettingsModal } from '@/components/project/ProjectSettingsModal';

function RealtimeSync() {
  const { project } = useProject();
  useRealtimeProject(project?.id);
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
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
      <ProjectSettingsModal />
    </ProjectProvider>
  );
}
