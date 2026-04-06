import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { Task, TaskInsert } from '@/types';
import { createTaskSortOrder } from '@/lib/tasks/workspace';

type Client = SupabaseClient<Database>;

export type DashboardTask = Pick<
  Task,
  'id' | 'title' | 'description' | 'status' | 'priority' | 'category' | 'due_date' | 'project_id' | 'video_id' | 'created_at' | 'completed_at'
>;

export interface TaskWorkspaceRecord extends Pick<
  Task,
  'id' | 'title' | 'description' | 'status' | 'priority' | 'category' | 'due_date' | 'scheduled_date' | 'project_id' | 'video_id' | 'metadata' | 'created_at' | 'updated_at' | 'completed_at'
> {
  project: {
    id: string;
    title: string;
    short_id: string;
  } | null;
  video: {
    id: string;
    title: string;
    short_id: string;
  } | null;
}

export async function fetchWorkspaceTasks(supabase: Client, projectIds: string[]) {
  if (projectIds.length === 0) return [] as DashboardTask[];

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, category, due_date, project_id, video_id, created_at, completed_at')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DashboardTask[];
}

export interface CreateWorkspaceTaskInput {
  project_id: string;
  video_id?: string | null;
  title: string;
  description?: string;
  category: TaskInsert['category'];
  priority: TaskInsert['priority'];
  due_date?: string;
  created_by?: string | null;
  metadata?: TaskInsert['metadata'];
}

export async function createWorkspaceTask(supabase: Client, input: CreateWorkspaceTaskInput) {
  const payload: TaskInsert = {
    project_id: input.project_id,
    video_id: input.video_id ?? null,
    title: input.title.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    category: input.category,
    priority: input.priority,
    due_date: input.due_date || null,
    scheduled_date: input.due_date || null,
    status: 'pending',
    created_by: input.created_by ?? null,
    sort_order: createTaskSortOrder(),
    metadata: input.metadata ?? null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('id, title, description, status, priority, category, due_date, project_id, video_id, created_at, completed_at')
    .single();

  if (error) throw new Error(`Error al crear tarea: ${error.message} (${error.code})`);
  if (!data) throw new Error('No se recibio la tarea creada');
  return data as DashboardTask;
}

export async function fetchTaskWorkspace(supabase: Client, taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      category,
      due_date,
      scheduled_date,
      project_id,
      video_id,
      metadata,
      created_at,
      updated_at,
      completed_at,
      project:projects!tasks_project_id_fkey(id, title, short_id),
      video:videos!tasks_video_id_fkey(id, title, short_id)
    `)
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data as unknown as TaskWorkspaceRecord;
}

export interface UpdateTaskWorkspaceInput {
  project_id: string;
  video_id: string | null;
  title: string;
  description: string;
  category: TaskInsert['category'];
  priority: TaskInsert['priority'];
  status: TaskInsert['status'];
  due_date: string | null;
  metadata: TaskInsert['metadata'];
}

export async function updateTaskWorkspace(supabase: Client, taskId: string, input: UpdateTaskWorkspaceInput) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      project_id: input.project_id,
      video_id: input.video_id,
      title: input.title.trim(),
      description: input.description.trim() ? input.description.trim() : null,
      category: input.category,
      priority: input.priority,
      status: input.status,
      due_date: input.due_date,
      scheduled_date: input.due_date,
      metadata: input.metadata,
    })
    .eq('id', taskId)
    .select(`
      id,
      title,
      description,
      status,
      priority,
      category,
      due_date,
      scheduled_date,
      project_id,
      video_id,
      metadata,
      created_at,
      updated_at,
      completed_at,
      project:projects!tasks_project_id_fkey(id, title, short_id),
      video:videos!tasks_video_id_fkey(id, title, short_id)
    `)
    .single();

  if (error) throw error;
  return data as unknown as TaskWorkspaceRecord;
}