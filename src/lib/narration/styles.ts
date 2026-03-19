export type NarrationStyleId =
  | 'documentary' | 'cartoon' | 'pixar' | 'epic'
  | 'asmr' | 'commercial' | 'kids' | 'thriller' | 'custom';

export interface NarrationStyleConfig {
  id: NarrationStyleId;
  name: string;
  description: string;
  aiPrompt: string;
  elevenLabsSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
  };
}

export const NARRATION_STYLES: Record<NarrationStyleId, NarrationStyleConfig> = {
  documentary: {
    id: 'documentary',
    name: 'Narrador Documental',
    description: 'Voz seria, informativa, ritmo pausado. Como National Geographic.',
    aiPrompt: `Escribe la narracion como un documental profesional. Tono serio e informativo.
Usa frases cortas y contundentes. Incluye pausas dramaticas entre ideas importantes.
NO uses exclamaciones. Se objetivo y descriptivo. Vocabulario culto pero accesible.`,
    elevenLabsSettings: { stability: 0.7, similarity_boost: 0.8, style: 0.3, speed: 0.95 },
  },
  cartoon: {
    id: 'cartoon',
    name: 'Cartoon / Animacion',
    description: 'Voz exagerada, divertida, expresiva. Como un dibujo animado.',
    aiPrompt: `Escribe la narracion como un dibujo animado. Energia al maximo!
Exagera las emociones. Usa exclamaciones y onomatopeyas. Se jugeton y sorprendente.
Las frases deben ser cortas y punchy.`,
    elevenLabsSettings: { stability: 0.3, similarity_boost: 0.7, style: 0.8, speed: 1.1 },
  },
  pixar: {
    id: 'pixar',
    name: 'Pixar / Emotivo',
    description: 'Voz calida, con emocion contenida. Como un trailer de Pixar.',
    aiPrompt: `Escribe la narracion como un trailer de pelicula Pixar. Calido y emotivo.
Empieza con una frase gancho que genere curiosidad. Construye emocion gradualmente.
Usa metaforas sencillas pero poderosas. El tono debe evocar nostalgia y esperanza.
Las ultimas palabras deben ser memorables, como un eslogan.`,
    elevenLabsSettings: { stability: 0.5, similarity_boost: 0.8, style: 0.6, speed: 1.0 },
  },
  epic: {
    id: 'epic',
    name: 'Epico / Cinematico',
    description: 'Voz grave, dramatica. Como un trailer de pelicula de accion.',
    aiPrompt: `Escribe la narracion como un trailer de pelicula epica. Voz profunda y dramatica.
Frases cortas y contundentes con peso. Pausas largas entre frases para dar gravedad.
Usa palabras poderosas. Construye tension que explota al final.`,
    elevenLabsSettings: { stability: 0.6, similarity_boost: 0.9, style: 0.5, speed: 0.9 },
  },
  asmr: {
    id: 'asmr',
    name: 'ASMR / Susurro',
    description: 'Voz suave, intima, muy cercana. Como si hablaras al oido.',
    aiPrompt: `Escribe la narracion como un susurro intimo. Muy suave y personal.
Frases cortas y delicadas. Cada palabra debe sonar como un secreto compartido.
NO uses exclamaciones. Tono meditativo y tranquilo. Ritmo muy lento.`,
    elevenLabsSettings: { stability: 0.8, similarity_boost: 0.9, style: 0.2, speed: 0.8 },
  },
  commercial: {
    id: 'commercial',
    name: 'Comercial / Energetico',
    description: 'Voz fuerte, rapida, motivadora. Como un anuncio de TV.',
    aiPrompt: `Escribe la narracion como un anuncio de TV profesional. Energetico y positivo.
Empieza con un problema o pregunta. Presenta la solucion con entusiasmo.
Ritmo rapido y dinamico. Termina con una llamada a la accion clara.`,
    elevenLabsSettings: { stability: 0.5, similarity_boost: 0.7, style: 0.7, speed: 1.15 },
  },
  kids: {
    id: 'kids',
    name: 'Infantil',
    description: 'Voz dulce, simple, clara. Para publico infantil.',
    aiPrompt: `Escribe la narracion para ninos de 5-8 anos. Vocabulario simple y claro.
Tono dulce y lleno de asombro. Usa muchas preguntas. Frases muy cortas.`,
    elevenLabsSettings: { stability: 0.4, similarity_boost: 0.7, style: 0.6, speed: 0.9 },
  },
  thriller: {
    id: 'thriller',
    name: 'Misterioso / Thriller',
    description: 'Voz baja, tensa, con suspense. Algo oscuro acecha.',
    aiPrompt: `Escribe la narracion como un thriller. Voz baja y tensa.
Construye misterio con preguntas sin respuesta. Frases incompletas que dejan en suspenso.
El ritmo debe ser irregular: frases largas seguidas de una palabra sola.`,
    elevenLabsSettings: { stability: 0.6, similarity_boost: 0.8, style: 0.4, speed: 0.9 },
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Define tus propias instrucciones de estilo.',
    aiPrompt: '',
    elevenLabsSettings: { stability: 0.5, similarity_boost: 0.75, style: 0.5, speed: 1.0 },
  },
};

export function getStyle(id: string): NarrationStyleConfig {
  return NARRATION_STYLES[id as NarrationStyleId] || NARRATION_STYLES.pixar;
}
