'use client';

import { MOOD_OPTIONS } from '@/lib/constants/scene-options';
import { SceneSelect } from './SceneSelect';

interface MoodSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MoodSelect({ value, onChange, disabled, className }: MoodSelectProps) {
  return (
    <SceneSelect
      label="Mood"
      options={MOOD_OPTIONS}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar mood..."
      disabled={disabled}
      className={className}
      aria-label="Estado de animo de la escena"
    />
  );
}
