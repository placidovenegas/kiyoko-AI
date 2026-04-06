export interface VideoFormData {
  title: string;
  platform: 'youtube' | 'instagram_reels' | 'tiktok' | 'tv_commercial' | 'web' | 'custom';
  target_duration_seconds: number;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:5';
  description: string;
}

export const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', ratio: '16:9' },
  { value: 'instagram_reels', label: 'Instagram Reels', ratio: '9:16' },
  { value: 'tiktok', label: 'TikTok', ratio: '9:16' },
  { value: 'tv_commercial', label: 'TV / Anuncio', ratio: '16:9' },
  { value: 'web', label: 'Web', ratio: '16:9' },
  { value: 'custom', label: 'Otro', ratio: '16:9' },
] as const;

export const DURATIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
] as const;

export const DEFAULT_VIDEO: VideoFormData = {
  title: '',
  platform: 'youtube',
  target_duration_seconds: 60,
  aspect_ratio: '16:9',
  description: '',
};
