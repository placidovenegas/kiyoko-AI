export interface BackgroundFormData {
  name: string;
  location_type: 'interior' | 'exterior' | 'mixto';
  time_of_day: 'amanecer' | 'dia' | 'atardecer' | 'noche';
  description: string;
  available_angles: string[];
}

export const LOCATION_TYPES = [
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'mixto', label: 'Mixto' },
] as const;

export const TIME_OF_DAY = [
  { value: 'amanecer', label: 'Amanecer' },
  { value: 'dia', label: 'Día' },
  { value: 'atardecer', label: 'Atardecer' },
  { value: 'noche', label: 'Noche' },
] as const;

export const CAMERA_ANGLES = [
  { value: 'wide', label: 'General (wide)' },
  { value: 'medium', label: 'Medio (medium)' },
  { value: 'close_up', label: 'Primer plano (close up)' },
  { value: 'birds_eye', label: 'Cenital (bird\'s eye)' },
  { value: 'low_angle', label: 'Contrapicado (low angle)' },
] as const;

export const DEFAULT_BACKGROUND: BackgroundFormData = {
  name: '',
  location_type: 'interior',
  time_of_day: 'dia',
  description: '',
  available_angles: ['wide', 'medium'],
};
