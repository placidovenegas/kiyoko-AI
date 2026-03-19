/**
 * Narration styles with ElevenLabs voice parameters.
 * Each style defines both the AI text generation prompt AND the voice synthesis config.
 */

export interface NarrationStyle {
  id: string;
  label: string;
  description: string;
  promptInstruction: string;
  elevenLabs: {
    stability: number;
    similarityBoost: number;
    style: number;
    speed?: number;
  };
}

export const NARRATION_STYLES: NarrationStyle[] = [
  {
    id: 'documentary',
    label: 'Documental',
    description: 'Voz seria, informativa, ritmo pausado',
    promptInstruction: 'Narra como un documental de National Geographic. Tono serio, informativo, con pausas para dar peso a las palabras. Frases cortas y contundentes.',
    elevenLabs: { stability: 0.7, similarityBoost: 0.8, style: 0.3 },
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    description: 'Voz exagerada, divertida, expresiva',
    promptInstruction: 'Narra con energia de dibujo animado. Exagera las emociones, usa exclamaciones, se jugeton y divertido.',
    elevenLabs: { stability: 0.3, similarityBoost: 0.7, style: 0.8 },
  },
  {
    id: 'pixar',
    label: 'Pixar',
    description: 'Calido, emotivo, con asombro',
    promptInstruction: 'Narra como un trailer de Pixar. Calido, emotivo, con momentos de asombro. Haz que el oyente sienta nostalgia y esperanza. Palabras sencillas pero profundas.',
    elevenLabs: { stability: 0.5, similarityBoost: 0.8, style: 0.6 },
  },
  {
    id: 'epic',
    label: 'Epico',
    description: 'Dramatico, con impacto',
    promptInstruction: 'Narra como un trailer de pelicula epica. Voz profunda, dramatica, con pausas largas y enfasis en palabras clave. Genera tension y expectativa.',
    elevenLabs: { stability: 0.6, similarityBoost: 0.9, style: 0.5 },
  },
  {
    id: 'asmr',
    label: 'ASMR',
    description: 'Suave, intimo, susurro',
    promptInstruction: 'Narra en un susurro intimo. Muy suave, como si hablaras al oido. Sin prisa, cada palabra con cuidado y delicadeza.',
    elevenLabs: { stability: 0.8, similarityBoost: 0.9, style: 0.2, speed: 0.8 },
  },
  {
    id: 'commercial',
    label: 'Comercial',
    description: 'Energetico, motivador, rapido',
    promptInstruction: 'Narra como un anuncio de TV. Energetico, positivo, con llamadas a la accion claras. Ritmo rapido y motivador.',
    elevenLabs: { stability: 0.5, similarityBoost: 0.7, style: 0.7, speed: 1.15 },
  },
  {
    id: 'kids',
    label: 'Infantil',
    description: 'Dulce, simple, clara',
    promptInstruction: 'Narra para ninos de 6 anos. Vocabulario simple, tono dulce, con asombro en cada frase. Frases muy cortas.',
    elevenLabs: { stability: 0.4, similarityBoost: 0.7, style: 0.6, speed: 0.9 },
  },
  {
    id: 'thriller',
    label: 'Misterioso',
    description: 'Tenso, suspense, oscuro',
    promptInstruction: 'Narra como un thriller. Voz baja, tensa, con pausas que generan suspense. Algo oscuro acecha detras de cada frase.',
    elevenLabs: { stability: 0.6, similarityBoost: 0.8, style: 0.4, speed: 0.9 },
  },
  {
    id: 'custom',
    label: 'Personalizado',
    description: 'Define tu propio estilo',
    promptInstruction: '',
    elevenLabs: { stability: 0.5, similarityBoost: 0.75, style: 0.5 },
  },
];

export const DEFAULT_STYLE = 'pixar';

export function getStyleById(id: string): NarrationStyle {
  return NARRATION_STYLES.find((s) => s.id === id) || NARRATION_STYLES[0];
}
