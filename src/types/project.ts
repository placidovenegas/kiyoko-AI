export type ProjectStyle = 'pixar' | 'realistic' | 'anime' | 'watercolor' | 'flat_2d' | 'cyberpunk' | 'custom';
export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';
export type TargetPlatform = 'youtube' | 'instagram_reels' | 'tiktok' | 'tv_commercial' | 'web' | 'custom';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  client_name: string;
  client_logo_url: string | null;
  style: ProjectStyle;
  custom_style_description: string | null;
  status: ProjectStatus;
  target_duration_seconds: number;
  target_platform: TargetPlatform;
  color_palette: ColorPalette;
  ai_brief: string;
  ai_analysis: Record<string, unknown>;
  image_generator: string;
  image_generator_config: Record<string, unknown>;
  video_generator: string;
  video_generator_config: Record<string, unknown>;
  tags: string[];
  is_demo: boolean;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  total_scenes: number;
  total_characters: number;
  total_backgrounds: number;
  estimated_duration_seconds: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  title: string;
  description?: string;
  client_name?: string;
  style: ProjectStyle;
  target_platform: TargetPlatform;
  target_duration_seconds?: number;
}
