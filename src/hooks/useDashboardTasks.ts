'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { fetchWorkspaceVideos } from '@/lib/queries/videos';
import { createWorkspaceTask, fetchWorkspaceTasks, type CreateWorkspaceTaskInput, type DashboardTask } from '@/lib/queries/tasks';
import type { Project, TaskStatus, Video } from '@/types';

interface UpdateDashboardTaskStatusInput {
  taskId: string;
  projectId: string;
  status: TaskStatus;
}

export function useDashboardTasks(userId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const dashboardKey = queryKeys.tasks.dashboard(userId ?? 'anonymous');

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.workspace(),
    queryFn: () => fetchWorkspaceProjects(supabase),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const tasksQuery = useQuery({
    queryKey: dashboardKey,
    queryFn: async () => {
      const projectIds = (projectsQuery.data ?? []).map((project) => project.id);
      return fetchWorkspaceTasks(supabase, projectIds);
    },
    enabled: !!userId && projectsQuery.isSuccess,
    staleTime: 60_000,
  });

  const videosQuery = useQuery({
    queryKey: queryKeys.videos.workspace(),
    queryFn: async () => {
      const projectIds = (projectsQuery.data ?? []).map((project) => project.id);
      return fetchWorkspaceVideos(supabase, projectIds);
    },
    enabled: !!userId && projectsQuery.isSuccess,
    staleTime: 60_000,
  });

  const createTask = useMutation({
    mutationFn: (input: CreateWorkspaceTaskInput) => createWorkspaceTask(supabase, input),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: dashboardKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(task.project_id) });
      toast.success('Tarea creada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'No se pudo crear la tarea');
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: UpdateDashboardTaskStatusInput) => {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      const { error } = await supabase
        .from('tasks')
        .update({ status, completed_at: completedAt })
        .eq('id', taskId);

      if (error) throw error;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: dashboardKey });
      const previous = queryClient.getQueryData<DashboardTask[]>(dashboardKey);
      queryClient.setQueryData<DashboardTask[]>(
        dashboardKey,
        (current) => current?.map((task) => (
          task.id === taskId
            ? { ...task, status, completed_at: status === 'completed' ? new Date().toISOString() : null }
            : task
        )) ?? [],
      );
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dashboardKey, context.previous);
      }
      toast.error(error.message || 'No se pudo actualizar la tarea');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: dashboardKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(variables.projectId) });
    },
  });

  return {
    projects: (projectsQuery.data ?? []) as Project[],
    videos: (videosQuery.data ?? []) as Video[],
    tasks: tasksQuery.data ?? [],
    projectsQuery,
    tasksQuery,
    videosQuery,
    createTask,
    updateTaskStatus,
  };
}
