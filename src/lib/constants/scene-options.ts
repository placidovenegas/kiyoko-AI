import {
  VolumeX,
  TreePalm,
  Music,
  MessageCircle,
  Mic,
  Video,
  Move,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Lightbulb,
  Lamp,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// ─── Camera Angles ──────────────────────────────────────────
export const CAMERA_ANGLE_OPTIONS = [
  { value: 'wide', label: 'Wide', description: 'Plano general, muestra todo el entorno' },
  { value: 'medium', label: 'Medium', description: 'Plano medio, de cintura hacia arriba' },
  { value: 'close_up', label: 'Close Up', description: 'Primer plano, solo rostro o detalle' },
  { value: 'extreme_close_up', label: 'Extreme Close Up', description: 'Macro, detalle extremo (ojos, manos, objeto)' },
  { value: 'pov', label: 'POV', description: 'Vista subjetiva, lo que ve el personaje' },
  { value: 'low_angle', label: 'Low Angle', description: 'Contrapicado, camara desde abajo (da poder)' },
  { value: 'high_angle', label: 'High Angle', description: 'Picado, camara desde arriba (da vulnerabilidad)' },
  { value: 'birds_eye', label: "Bird's Eye", description: 'Vista cenital, directamente desde arriba' },
  { value: 'dutch', label: 'Dutch', description: 'Angulo inclinado, genera tension o inestabilidad' },
  { value: 'over_shoulder', label: 'Over Shoulder', description: 'Por encima del hombro de un personaje' },
] as const;

// ─── Camera Movements ───────────────────────────────────────
export const CAMERA_MOVEMENT_OPTIONS = [
  { value: 'static', label: 'Static', description: 'Camara fija, sin movimiento' },
  { value: 'dolly_in', label: 'Dolly In', description: 'Acercamiento fisico hacia el sujeto' },
  { value: 'dolly_out', label: 'Dolly Out', description: 'Alejamiento fisico del sujeto' },
  { value: 'pan_left', label: 'Pan Left', description: 'Giro horizontal hacia la izquierda' },
  { value: 'pan_right', label: 'Pan Right', description: 'Giro horizontal hacia la derecha' },
  { value: 'tilt_up', label: 'Tilt Up', description: 'Giro vertical hacia arriba' },
  { value: 'tilt_down', label: 'Tilt Down', description: 'Giro vertical hacia abajo' },
  { value: 'tracking', label: 'Tracking', description: 'Sigue al sujeto lateralmente' },
  { value: 'crane', label: 'Crane', description: 'Movimiento ascendente/descendente con grua' },
  { value: 'handheld', label: 'Handheld', description: 'Camara en mano, movimiento organico' },
  { value: 'orbit', label: 'Orbit', description: 'Gira alrededor del sujeto en circulo' },
] as const;

// ─── Lighting Options ───────────────────────────────────────
export const LIGHTING_OPTIONS = [
  { value: 'natural_daylight', label: 'Luz natural', description: 'Luz del dia, suave y uniforme' },
  { value: 'golden_hour', label: 'Golden Hour', description: 'Luz dorada calida del amanecer/atardecer' },
  { value: 'blue_hour', label: 'Blue Hour', description: 'Luz azulada del crepusculo' },
  { value: 'dramatic_side', label: 'Dramatic Side', description: 'Iluminacion lateral con sombras fuertes' },
  { value: 'soft_diffused', label: 'Soft Diffused', description: 'Luz suave y difusa, sin sombras duras' },
  { value: 'backlit', label: 'Backlit', description: 'Contraluz, siluetas y bordes luminosos' },
  { value: 'warm_interior', label: 'Warm Interior', description: 'Luz calida de interior (lamparas, velas)' },
  { value: 'cool_fluorescent', label: 'Cool Fluorescent', description: 'Luz fria de fluorescentes, estilo clinico' },
  { value: 'neon_glow', label: 'Neon Glow', description: 'Luz neon colorida, ambiente urbano/nocturno' },
  { value: 'rim_light', label: 'Rim Light', description: 'Borde luminoso alrededor del sujeto' },
  { value: 'low_key', label: 'Low Key', description: 'Mayormente oscuro con puntos de luz (misterio)' },
  { value: 'high_key', label: 'High Key', description: 'Muy iluminado, pocas sombras (limpio, alegre)' },
  { value: 'candlelight', label: 'Candlelight', description: 'Luz de velas, calida y parpadeante' },
  { value: 'overcast', label: 'Overcast', description: 'Cielo nublado, luz uniforme sin sombras' },
] as const;

// ─── Mood Options ───────────────────────────────────────────
export const MOOD_OPTIONS = [
  { value: 'mysterious', label: 'Mysterious', description: 'Enigmatico, oscuro, intrigante' },
  { value: 'energetic', label: 'Energetic', description: 'Dinamico, vibrante, con ritmo' },
  { value: 'calm', label: 'Calm', description: 'Tranquilo, sereno, relajado' },
  { value: 'dramatic', label: 'Dramatic', description: 'Intenso, emotivo, impactante' },
  { value: 'romantic', label: 'Romantic', description: 'Suave, intimo, emotivo' },
  { value: 'tense', label: 'Tense', description: 'Tension, suspense, inquietud' },
  { value: 'joyful', label: 'Joyful', description: 'Alegre, luminoso, celebracion' },
  { value: 'melancholic', label: 'Melancholic', description: 'Nostalgico, melancolico, triste' },
  { value: 'epic', label: 'Epic', description: 'Grandioso, heroico, monumental' },
  { value: 'intimate', label: 'Intimate', description: 'Cercano, personal, delicado' },
  { value: 'professional', label: 'Professional', description: 'Corporativo, confiable, serio' },
  { value: 'playful', label: 'Playful', description: 'Divertido, ligero, creativo' },
] as const;

// ─── Audio Flags (Multi-select) ─────────────────────────────
export interface AudioFlag {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  soundNotesPrefix: string;
}

export const AUDIO_FLAGS: AudioFlag[] = [
  {
    key: 'silent',
    label: 'Silencio total',
    description: 'Sin ningun sonido, escena completamente muda',
    icon: VolumeX,
    soundNotesPrefix: 'SILENT SCENE. NO DIALOGUE. NO SOUND.',
  },
  {
    key: 'ambient',
    label: 'Sonido ambiente',
    description: 'Sonidos del entorno (calle, naturaleza, salon)',
    icon: TreePalm,
    soundNotesPrefix: 'AMBIENT SOUND.',
  },
  {
    key: 'music',
    label: 'Musica de fondo',
    description: 'Musica instrumental o soundtrack',
    icon: Music,
    soundNotesPrefix: 'BACKGROUND MUSIC.',
  },
  {
    key: 'dialogue',
    label: 'Dialogos',
    description: 'Los personajes hablan en camara',
    icon: MessageCircle,
    soundNotesPrefix: 'DIALOGUE SCENE.',
  },
  {
    key: 'voiceover',
    label: 'Voz en off',
    description: 'Narrador externo, personajes no hablan en camara',
    icon: Mic,
    soundNotesPrefix: 'VOICEOVER NARRATION. Characters do not speak on camera.',
  },
];

// ─── Scene Type Options ─────────────────────────────────────
export const SCENE_TYPE_OPTIONS = [
  { value: 'original', label: 'Original' },
  { value: 'new', label: 'Nueva' },
  { value: 'filler', label: 'Relleno' },
  { value: 'video', label: 'Video' },
] as const;

export const SCENE_TYPE_COLORS: Record<string, string> = {
  original: '#6B7280',
  improved: '#F59E0B',
  new: '#3B82F6',
  filler: '#8B5CF6',
  video: '#EC4899',
};

export const SCENE_TYPE_LABELS: Record<string, string> = {
  original: 'Original',
  improved: 'Mejorada',
  new: 'Nueva',
  filler: 'Relleno',
  video: 'Video',
};

export const ARC_PHASE_COLORS: Record<string, string> = {
  hook: '#EF4444',
  build: '#F59E0B',
  peak: '#10B981',
  close: '#3B82F6',
};

export const ARC_PHASE_LABELS: Record<string, string> = {
  hook: 'Gancho',
  build: 'Desarrollo',
  peak: 'Climax',
  close: 'Cierre',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-gray-400',
  prompt_ready: 'bg-yellow-400',
  generating: 'bg-purple-400 animate-pulse',
  generated: 'bg-green-400',
  approved: 'bg-blue-500',
  rejected: 'bg-red-400',
};

// ─── Helpers ────────────────────────────────────────────────

/** Parse active audio flags from sound_notes + music_notes */
export function parseAudioFlags(soundNotes: string, musicNotes: string): string[] {
  const sn = (soundNotes || '').toUpperCase();
  const flags: string[] = [];

  if (sn.includes('SILENT') && sn.includes('NO SOUND')) return ['silent'];

  if (sn.includes('AMBIENT')) flags.push('ambient');
  if (sn.includes('MUSIC') || musicNotes) flags.push('music');
  if (sn.includes('DIALOGUE')) flags.push('dialogue');
  if (sn.includes('VOICEOVER') || sn.includes('NARRATION')) flags.push('voiceover');

  if (flags.length === 0 && (sn.includes('SILENT') || sn.includes('NO DIALOGUE'))) {
    return ['silent'];
  }

  return flags.length > 0 ? flags : ['silent'];
}

/** Build sound_notes and music_notes from selected audio flags */
export function buildAudioNotes(
  flags: string[],
  customMusic?: string,
  customAmbient?: string,
): { sound_notes: string; music_notes: string } {
  if (flags.includes('silent')) {
    return { sound_notes: 'SILENT SCENE. NO DIALOGUE. NO SOUND.', music_notes: '' };
  }

  const parts: string[] = [];
  let musicNotes = '';

  if (flags.includes('ambient')) {
    parts.push(customAmbient ? `AMBIENT SOUND: ${customAmbient}` : 'AMBIENT SOUND.');
  }
  if (flags.includes('dialogue')) {
    parts.push('DIALOGUE SCENE.');
  }
  if (flags.includes('voiceover')) {
    parts.push('VOICEOVER NARRATION. Characters do not speak on camera.');
  }
  if (flags.includes('music')) {
    musicNotes = customMusic || 'Background music.';
  }

  return {
    sound_notes: parts.join(' ') || 'NO DIALOGUE.',
    music_notes: musicNotes,
  };
}

/** Estimate text duration for narration */
export function estimateTextDuration(text: string, lang: string = 'es'): {
  durationSeconds: number;
  wordCount: number;
  fitsInSeconds: (seconds: number) => boolean;
  maxWordsForSeconds: (seconds: number) => number;
} {
  const WORDS_PER_MINUTE: Record<string, number> = {
    es: 150,
    en: 160,
    fr: 145,
    de: 130,
    it: 155,
  };

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = WORDS_PER_MINUTE[lang] || 150;
  const durationSeconds = (words / wpm) * 60;

  return {
    durationSeconds: Math.round(durationSeconds * 10) / 10,
    wordCount: words,
    fitsInSeconds: (s: number) => durationSeconds <= s,
    maxWordsForSeconds: (s: number) => Math.floor((s * wpm) / 60),
  };
}
