export interface TaskFormData {
  title: string;
  description: string;
  category: 'script' | 'prompt' | 'image_gen' | 'video_gen' | 'review' | 'export' | 'meeting' | 'voiceover' | 'editing' | 'issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
}

export const TASK_CATEGORIES = [
  { value: 'script', label: 'Guión' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'image_gen', label: 'Generación imagen' },
  { value: 'video_gen', label: 'Generación vídeo' },
  { value: 'review', label: 'Revisión' },
  { value: 'export', label: 'Exportación' },
  { value: 'voiceover', label: 'Locución' },
  { value: 'editing', label: 'Edición' },
  { value: 'meeting', label: 'Reunión' },
  { value: 'issue', label: 'Incidencia' },
  { value: 'other', label: 'Otro' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'bg-zinc-400' },
  { value: 'medium', label: 'Media', color: 'bg-blue-400' },
  { value: 'high', label: 'Alta', color: 'bg-amber-400' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-400' },
] as const;

export const DEFAULT_TASK: TaskFormData = {
  title: '',
  description: '',
  category: 'other',
  priority: 'medium',
  due_date: '',
};
