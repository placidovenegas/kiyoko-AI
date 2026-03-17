export interface Background {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string;
  location_type: 'interior' | 'exterior' | 'mixed';
  time_of_day: 'dawn' | 'morning' | 'day' | 'golden_hour' | 'evening' | 'night';
  prompt_snippet: string;
  reference_image_url: string | null;
  reference_image_path: string | null;
  available_angles: string[];
  used_in_scenes: string[];
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
