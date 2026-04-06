export interface CharacterFormData {
  name: string;
  role: 'protagonista' | 'secundario' | 'extra' | 'narrador';
  description: string;
  visual_description: string;
  personality: string;
  hair_description: string;
  signature_clothing: string;
  accessories: string;
  color_accent: string;
  prompt_snippet: string;
  ai_prompt_description: string;
}

export const CHARACTER_ROLES = [
  { value: 'protagonista', label: 'Protagonista' },
  { value: 'secundario', label: 'Secundario' },
  { value: 'extra', label: 'Extra' },
  { value: 'narrador', label: 'Narrador' },
] as const;

export const DEFAULT_CHARACTER: CharacterFormData = {
  name: '',
  role: 'protagonista',
  description: '',
  visual_description: '',
  personality: '',
  hair_description: '',
  signature_clothing: '',
  accessories: '',
  color_accent: '#6B7280',
  prompt_snippet: '',
  ai_prompt_description: '',
};
