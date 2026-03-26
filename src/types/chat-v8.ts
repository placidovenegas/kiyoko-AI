/**
 * Fases del chat alineadas con docs V8 (kiyoko-comportamiento-chat / prompt implementación).
 * La UI puede mapear THINK + STREAM sin exponer todo el enum al usuario.
 */
export type ChatPhaseV8 = 'idle' | 'think' | 'stream' | 'dock' | 'save' | 'done';

/** Duración mínima/máxima de la fase “pensando” antes de mostrar texto del asistente (ms). */
export const V8_THINK_MS_MIN = 800;
export const V8_THINK_MS_MAX = 1200;

/** Pausa recomendada tras terminar el texto antes de animar bloques (ms). */
export const V8_POST_STREAM_PAUSE_MS = 300;

/** Stagger entre chips de sugerencias (ms). */
export const V8_SUGGESTION_STAGGER_MS = 50;

export function randomThinkDurationMs(): number {
  return V8_THINK_MS_MIN + Math.floor(Math.random() * (V8_THINK_MS_MAX - V8_THINK_MS_MIN + 1));
}

/** Tras guardar en Supabase: ids para navegar a “Ver …” / siguiente paso. */
export type CreationSaveContext = {
  entityId?: string;
  videoShortId?: string;
  /** Tras crear un proyecto: `short_id` para `/project/[shortId]` */
  projectShortId?: string;
};

export type CreationDoneCallback = (message: string, ctx?: CreationSaveContext) => void;
