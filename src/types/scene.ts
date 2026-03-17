export type SceneType = 'original' | 'improved' | 'new' | 'filler' | 'video';
export type SceneStatus = 'draft' | 'prompt_ready' | 'generating' | 'generated' | 'approved' | 'rejected';
export type ArcPhase = 'hook' | 'build' | 'peak' | 'close';
export type CameraAngle = 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'pov' | 'low_angle' | 'high_angle' | 'birds_eye' | 'dutch' | 'over_shoulder';
export type CameraMovement = 'static' | 'dolly_in' | 'dolly_out' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'tracking' | 'crane' | 'handheld' | 'orbit';

export interface SceneImprovement {
  type: 'improve' | 'add';
  text: string;
}

export interface PromptHistoryEntry {
  version: number;
  prompt: string;
  timestamp: string;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: string;
  title: string;
  scene_type: SceneType;
  category: string;
  arc_phase: ArcPhase;
  description: string;
  director_notes: string;
  prompt_image: string;
  prompt_video: string;
  prompt_additions: string;
  improvements: SceneImprovement[];
  duration_seconds: number;
  start_time: string;
  end_time: string;
  background_id: string | null;
  character_ids: string[];
  required_references: string[];
  reference_tip: string;
  camera_angle: CameraAngle;
  camera_movement: CameraMovement;
  camera_notes: string;
  lighting: string;
  mood: string;
  music_notes: string;
  sound_notes: string;
  status: SceneStatus;
  generated_image_url: string | null;
  generated_image_path: string | null;
  generated_image_thumbnail_url: string | null;
  generated_video_url: string | null;
  generated_video_path: string | null;
  prompt_history: PromptHistoryEntry[];
  sort_order: number;
  notes: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
