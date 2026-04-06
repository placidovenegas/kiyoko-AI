import type { Metadata } from 'next';
import { TaskWorkspacePage } from '@/components/tasks/TaskWorkspacePage';

export const metadata: Metadata = {
  title: 'Nueva tarea | Kiyoko AI',
};

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; videoId?: string }>;
}) {
  const params = await searchParams;

  return <TaskWorkspacePage initialProjectId={params.projectId ?? ''} initialVideoId={params.videoId ?? ''} />;
}
