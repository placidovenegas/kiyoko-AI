import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { ActivityLog, Project, Task } from '@/types';

type Client = SupabaseClient<Database>;

export interface DashboardTaskPreview {
  id: string;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
  dueDate: string | null;
  projectId: string;
}

export interface DashboardOverview {
  projects: Project[];
  pendingTasksCount: number;
  overdueTasksCount: number;
  tokensThisMonth: number;
  monthlyCostUsd: number;
  recentActivity: ActivityLog[];
  focusTasks: DashboardTaskPreview[];
}

function sortTasks(tasks: DashboardTaskPreview[]) {
  const priorityRank: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...tasks].sort((left, right) => {
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return (priorityRank[left.priority] ?? 99) - (priorityRank[right.priority] ?? 99);
  });
}

export async function fetchDashboardOverview(
  supabase: Client,
  params: { userId: string }
): Promise<DashboardOverview> {
  const projectsQuery = supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  const { data: projects, error: projectsError } = await projectsQuery;
  if (projectsError) {
    throw projectsError;
  }

  const safeProjects = (projects ?? []) as Project[];
  const projectIds = safeProjects.map((project) => project.id);

  if (projectIds.length === 0) {
    return {
      projects: [],
      pendingTasksCount: 0,
      overdueTasksCount: 0,
      tokensThisMonth: 0,
      monthlyCostUsd: 0,
      recentActivity: [],
      focusTasks: [],
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [tasksResult, usageResult, activityResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, project_id')
      .in('project_id', projectIds)
      .in('status', ['pending', 'in_progress']),
    supabase
      .from('ai_usage_logs')
      .select('input_tokens, output_tokens, estimated_cost_usd, project_id')
      .eq('user_id', params.userId)
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('activity_log')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  if (tasksResult.error) {
    throw tasksResult.error;
  }

  if (usageResult.error) {
    throw usageResult.error;
  }

  if (activityResult.error) {
    throw activityResult.error;
  }

  const now = Date.now();

  const taskRows = (tasksResult.data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    projectId: task.project_id,
  })) as DashboardTaskPreview[];

  const pendingTasksCount = taskRows.length;
  const overdueTasksCount = taskRows.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < now).length;
  const focusTasks = sortTasks(taskRows).slice(0, 5);

  const usageRows = (usageResult.data ?? []).filter((row) => !row.project_id || projectIds.includes(row.project_id));
  const tokensThisMonth = usageRows.reduce((sum, row) => sum + (row.input_tokens ?? 0) + (row.output_tokens ?? 0), 0);
  const monthlyCostUsd = usageRows.reduce((sum, row) => sum + (row.estimated_cost_usd ?? 0), 0);

  return {
    projects: safeProjects,
    pendingTasksCount,
    overdueTasksCount,
    tokensThisMonth,
    monthlyCostUsd,
    recentActivity: (activityResult.data ?? []) as ActivityLog[],
    focusTasks,
  };
}