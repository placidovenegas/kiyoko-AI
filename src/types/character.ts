export interface Character {
  id: string;
  project_id: string;
  name: string;
  initials: string;
  role: string;
  description: string;
  visual_description: string;
  prompt_snippet: string;
  personality: string;
  signature_clothing: string;
  hair_description: string;
  accessories: string[];
  signature_tools: string[];
  color_accent: string;
  reference_image_url: string | null;
  reference_image_path: string | null;
  appears_in_scenes: string[];
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreateInput {
  project_id: string;
  name: string;
  initials?: string;
  role?: string;
  description?: string;
  visual_description?: string;
  prompt_snippet?: string;
  personality?: string;
  signature_clothing?: string;
  hair_description?: string;
}
