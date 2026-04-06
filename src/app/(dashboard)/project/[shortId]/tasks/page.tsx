'use client';

import { DashboardTasksView } from '@/components/dashboard/DashboardTasksView';
import { useProject } from '@/contexts/ProjectContext';

export default function ProjectTasksPage() {
  const { project, loading } = useProject();

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return <DashboardTasksView lockedProjectId={project.id} lockedProjectName={project.title} />;
}
