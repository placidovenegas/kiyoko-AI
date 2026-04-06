import type { Metadata } from 'next';
import { TaskWorkspacePage } from '@/components/tasks/TaskWorkspacePage';

export const metadata: Metadata = {
  title: 'Tarea | Kiyoko AI',
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <TaskWorkspacePage taskId={taskId} />;
}
