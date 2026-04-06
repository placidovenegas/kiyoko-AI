import { redirect } from 'next/navigation';

export default async function TaskAliasPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  redirect(`/dashboard/tasks/${taskId}`);
}