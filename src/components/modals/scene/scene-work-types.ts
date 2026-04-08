import type { Database } from '@/types/database.types';

export type CameraAngle = Database['public']['Enums']['camera_angle'];
export type CameraMovement = Database['public']['Enums']['camera_movement'];

export interface SceneForm {
  title: string;
  description: string;
  arcPhase: string;
  duration: number;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  dialogue: string;
  music: boolean;
  dialogue_audio: boolean;
  sfx: boolean;
  voiceover: boolean;
  characterIds: string[];
  backgroundIds: string[];
}

export interface SuggestionData {
  title: string;
  description: string;
  arcPhase: string;
  duration: number;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  characterIds: string[];
  backgroundIds: string[];
}

export interface IaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestion?: SuggestionData;
}

export interface CharacterRef {
  id: string;
  name: string;
  initials: string | null;
  color_accent: string | null;
  reference_image_url: string | null;
}

export interface BackgroundRef {
  id: string;
  name: string;
  reference_image_url: string | null;
  location_type: string | null;
}

export interface SceneCharacterWithChar {
  scene_id: string;
  character_id: string;
  role_in_scene: string | null;
  character: CharacterRef;
}

export interface SceneBackgroundWithBg {
  scene_id: string;
  background_id: string;
  is_primary: boolean | null;
  background: BackgroundRef;
}

export const PHASES = [
  { value: 'hook', label: 'Hook', color: 'bg-red-500' },
  { value: 'build', label: 'Build', color: 'bg-amber-500' },
  { value: 'peak', label: 'Peak', color: 'bg-emerald-500' },
  { value: 'close', label: 'Close', color: 'bg-blue-500' },
] as const;

export const ANGLES: { value: CameraAngle; label: string }[] = [
  { value: 'wide', label: 'General' }, { value: 'medium', label: 'Medio' },
  { value: 'close_up', label: 'Primer plano' }, { value: 'extreme_close_up', label: 'Extreme CU' },
  { value: 'pov', label: 'POV' }, { value: 'low_angle', label: 'Contrapicado' },
  { value: 'high_angle', label: 'Picado' }, { value: 'birds_eye', label: 'Cenital' },
  { value: 'dutch', label: 'Dutch' }, { value: 'over_shoulder', label: 'Over shoulder' },
];

export const MOVEMENTS: { value: CameraMovement; label: string }[] = [
  { value: 'static', label: 'Estática' }, { value: 'dolly_in', label: 'Dolly in' },
  { value: 'dolly_out', label: 'Dolly out' }, { value: 'pan_left', label: 'Pan izq' },
  { value: 'pan_right', label: 'Pan der' }, { value: 'tilt_up', label: 'Tilt up' },
  { value: 'tilt_down', label: 'Tilt down' }, { value: 'tracking', label: 'Tracking' },
  { value: 'crane', label: 'Grúa' }, { value: 'handheld', label: 'Handheld' },
  { value: 'orbit', label: 'Órbita' },
];

export const DEFAULT_FORM: SceneForm = {
  title: '', description: '', arcPhase: 'build', duration: 5,
  cameraAngle: 'medium', cameraMovement: 'static', dialogue: '',
  music: false, dialogue_audio: false, sfx: false, voiceover: false,
  characterIds: [], backgroundIds: [],
};
