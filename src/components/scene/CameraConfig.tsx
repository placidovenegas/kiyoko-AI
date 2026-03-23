'use client';
import type { SceneCamera } from '@/types';

const CAMERA_ANGLES = [
  { value: 'wide', label: 'Wide' },
  { value: 'medium', label: 'Medium' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'extreme_close_up', label: 'Extreme Close-up' },
  { value: 'pov', label: 'POV' },
  { value: 'low_angle', label: 'Low Angle' },
  { value: 'high_angle', label: 'High Angle' },
  { value: 'birds_eye', label: "Bird's Eye" },
  { value: 'dutch', label: 'Dutch' },
  { value: 'over_shoulder', label: 'Over Shoulder' },
];

const CAMERA_MOVEMENTS = [
  { value: 'static', label: 'Static' },
  { value: 'dolly_in', label: 'Dolly In' },
  { value: 'dolly_out', label: 'Dolly Out' },
  { value: 'pan_left', label: 'Pan Left' },
  { value: 'pan_right', label: 'Pan Right' },
  { value: 'tilt_up', label: 'Tilt Up' },
  { value: 'tilt_down', label: 'Tilt Down' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'crane', label: 'Crane' },
  { value: 'handheld', label: 'Handheld' },
  { value: 'orbit', label: 'Orbit' },
];

interface CameraConfigProps {
  camera: SceneCamera | null;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
}

export function CameraConfig({ camera, onChange, disabled }: CameraConfigProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            \u00c1ngulo
          </label>
          <select
            value={camera?.camera_angle ?? 'medium'}
            onChange={(e) => onChange('camera_angle', e.target.value)}
            disabled={disabled}
            className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {CAMERA_ANGLES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Movimiento
          </label>
          <select
            value={camera?.camera_movement ?? 'static'}
            onChange={(e) => onChange('camera_movement', e.target.value)}
            disabled={disabled}
            className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {CAMERA_MOVEMENTS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Iluminaci\u00f3n
        </label>
        <input
          value={camera?.lighting ?? ''}
          onChange={(e) => onChange('lighting', e.target.value)}
          disabled={disabled}
          placeholder="Ej: Warm amber lighting, soft fill"
          className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Mood
        </label>
        <input
          value={camera?.mood ?? ''}
          onChange={(e) => onChange('mood', e.target.value)}
          disabled={disabled}
          placeholder="Ej: Dramatic, intimate, energetic"
          className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Notas de c\u00e1mara
        </label>
        <textarea
          value={camera?.camera_notes ?? ''}
          onChange={(e) => onChange('camera_notes', e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="Notas adicionales sobre el plano..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none resize-none"
        />
      </div>
      {camera?.ai_reasoning && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-[11px] font-medium text-primary mb-1">
            Razonamiento IA
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {camera.ai_reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
