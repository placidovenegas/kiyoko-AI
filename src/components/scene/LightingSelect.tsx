'use client';

import { LIGHTING_OPTIONS } from '@/lib/constants/scene-options';
import { SceneSelect } from './SceneSelect';

interface LightingSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function LightingSelect({ value, onChange, disabled, className }: LightingSelectProps) {
  return (
    <SceneSelect
      label="Iluminacion"
      options={LIGHTING_OPTIONS}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar iluminacion..."
      disabled={disabled}
      className={className}
      aria-label="Tipo de iluminacion de la escena"
    />
  );
}
