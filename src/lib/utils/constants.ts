export const APP_NAME = 'Kiyoko AI';
export const APP_DESCRIPTION = 'Del brief al storyboard en minutos, no en días';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const PROJECT_STYLES = [
  { value: 'pixar', label: 'Pixar 3D' },
  { value: 'realistic', label: 'Realista' },
  { value: 'anime', label: 'Anime' },
  { value: 'watercolor', label: 'Acuarela' },
  { value: 'flat_2d', label: 'Flat 2D' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'custom', label: 'Personalizado' },
] as const;

export const TARGET_PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'tv_commercial', label: 'TV Commercial' },
  { value: 'web', label: 'Web' },
  { value: 'custom', label: 'Personalizado' },
] as const;

export const SCENE_TYPES = [
  { value: 'original', label: 'Original', color: 'var(--color-scene-original)' },
  { value: 'improved', label: 'Mejorada', color: 'var(--color-scene-improved)' },
  { value: 'new', label: 'Nueva', color: 'var(--color-scene-new)' },
  { value: 'filler', label: 'Relleno', color: 'var(--color-scene-filler)' },
  { value: 'video', label: 'Vídeo', color: 'var(--color-scene-video)' },
] as const;

export const ARC_PHASES = [
  { value: 'hook', label: 'Gancho', color: 'var(--color-phase-hook)' },
  { value: 'build', label: 'Desarrollo', color: 'var(--color-phase-build)' },
  { value: 'peak', label: 'Clímax', color: 'var(--color-phase-peak)' },
  { value: 'close', label: 'Cierre', color: 'var(--color-phase-close)' },
] as const;

export const CAMERA_ANGLES = [
  'wide', 'medium', 'close_up', 'extreme_close_up', 'pov',
  'low_angle', 'high_angle', 'birds_eye', 'dutch', 'over_shoulder',
] as const;

export const CAMERA_MOVEMENTS = [
  'static', 'dolly_in', 'dolly_out', 'pan_left', 'pan_right',
  'tilt_up', 'tilt_down', 'tracking', 'crane', 'handheld', 'orbit',
] as const;

export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'blocked', label: 'Bloqueado' },
] as const;
