export interface SceneFormData {
  title: string;
  description: string;
  arc_phase: 'hook' | 'build' | 'peak' | 'close';
  duration_seconds: number;
  scene_type: 'original' | 'improved' | 'new' | 'filler';
  dialogue: string;
}

export const ARC_PHASES = [
  { value: 'hook', label: 'Hook', color: 'bg-blue-500' },
  { value: 'build', label: 'Build', color: 'bg-amber-500' },
  { value: 'peak', label: 'Peak', color: 'bg-red-500' },
  { value: 'close', label: 'Close', color: 'bg-emerald-500' },
] as const;

export const SCENE_TYPES = [
  { value: 'original', label: 'Original' },
  { value: 'improved', label: 'Mejorada' },
  { value: 'new', label: 'Nueva' },
  { value: 'filler', label: 'Transición' },
] as const;

export const DEFAULT_SCENE: SceneFormData = {
  title: '',
  description: '',
  arc_phase: 'build',
  duration_seconds: 5,
  scene_type: 'original',
  dialogue: '',
};
