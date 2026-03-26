import { inferSkeletonVariantFromUserPrompt } from '@/lib/chat/infer-skeleton-from-user-prompt';

/** Preset de motion: panel anclado encima del input (Elije / creación). */
export const CHAT_DOCK_OVERLAY_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const CHAT_DOCK_OVERLAY_INITIAL = { opacity: 0, y: 10 };
export const CHAT_DOCK_OVERLAY_ANIMATE = { opacity: 1, y: 0 };
export const CHAT_DOCK_OVERLAY_EXIT = { opacity: 0, y: 8 };

/** Overlay flotante (preguntas): panel algo más estrecho y centrado. */
export const CHAT_DOCK_WIDTH_CLASS = 'w-[calc(100%-30px)]';

/** Dock de creación fusionado con el input: ancho completo del bloque. */
export const CHAT_CREATION_DOCK_CLASS = 'w-full';

/** Atenuación del área de mensajes mientras el dock de creación está abierto (V7: menos “lavado” que opacity-45). */
export const CHAT_THREAD_DIM_CLASS = 'opacity-[0.28]';

/** Etiqueta de la onda mientras la IA sigue escribiendo y aún no se muestra el formulario. */
export function creationFormIntroLabel(type: 'character' | 'background' | 'video' | 'project'): string {
  switch (type) {
    case 'character':
      return 'Montando el formulario de personaje…';
    case 'background':
      return 'Montando el formulario de fondo…';
    case 'video':
      return 'Montando el formulario de vídeo…';
    case 'project':
      return 'Montando el formulario de proyecto…';
    default:
      return 'Montando el formulario…';
  }
}

/** Pausa breve tras terminar el stream antes de montar el dock (transición suave). */
export const CREATION_FORM_HANDOFF_MS = 280;

/** Etiqueta de la onda mientras el stream sigue y aún no se muestran tarjetas/bloques interactivos. */
export function streamingComponentIntroLabel(
  blocks: { type: string; subtype?: string }[],
  opts?: {
    hasActionPlan?: boolean;
    hasWorkflowActions?: boolean;
    hasAudio?: boolean;
  },
): string {
  if (opts?.hasActionPlan && blocks.length === 0) return 'Organizando el plan de acciones…';
  if (opts?.hasWorkflowActions && blocks.length === 0) return 'Preparando acciones rápidas…';
  if (opts?.hasAudio && blocks.length === 0) return 'Generando el audio…';

  const create = blocks.find((b) => b.type === 'CREATE');
  if (create?.subtype) {
    const t = create.subtype as 'character' | 'background' | 'video' | 'project';
    if (t === 'character' || t === 'background' || t === 'video' || t === 'project') return creationFormIntroLabel(t);
  }

  const first = blocks[0]?.type;
  switch (first) {
    case 'PROJECT_SUMMARY':
      return 'Recopilando datos del proyecto…';
    case 'VIDEO_SUMMARY':
      return 'Recopilando datos del vídeo…';
    case 'RESOURCE_LIST':
      return 'Cargando la lista de recursos…';
    case 'SCENE_DETAIL':
      return 'Montando la ficha de escena…';
    case 'SCENE_PLAN':
      return 'Dibujando el plan de escenas…';
    case 'OPTIONS':
      return 'Preparando las opciones…';
    case 'PREVIEW':
      return 'Generando la vista previa…';
    case 'SELECT':
      return 'Preparando el selector…';
    case 'PROMPT_PREVIEW':
      return 'Preparando el prompt…';
    case 'DIFF':
      return 'Preparando la comparación…';
    case 'ACTION_PLAN':
      return 'Organizando el plan de acciones…';
    default:
      return 'Kiyoko está escribiendo…';
  }
}

/** Variante visual del skeleton mientras llega el bloque completo (stream o JSON). */
export type StreamingSkeletonVariant =
  | 'create-character'
  | 'create-background'
  | 'create-video'
  | 'create-project'
  | 'project-summary'
  | 'video-summary'
  | 'scene-detail'
  | 'resource-list'
  | 'scene-plan'
  | 'options'
  | 'choices'
  | 'prompt-preview'
  | 'select'
  | 'action-plan'
  | 'workflow'
  | 'audio'
  | 'generic';

function lastOpenAfterLastClose(content: string, open: string, close: string): boolean {
  const lo = content.lastIndexOf(open);
  const lc = content.lastIndexOf(close);
  return lo !== -1 && lo > lc;
}

function variantFromBlock(b: { type: string; subtype?: string }): StreamingSkeletonVariant {
  switch (b.type) {
    case 'CREATE':
      if (b.subtype === 'character') return 'create-character';
      if (b.subtype === 'background') return 'create-background';
      if (b.subtype === 'video') return 'create-video';
      if (b.subtype === 'project') return 'create-project';
      return 'generic';
    case 'PROJECT_SUMMARY':
      return 'project-summary';
    case 'VIDEO_SUMMARY':
      return 'video-summary';
    case 'RESOURCE_LIST':
      return 'resource-list';
    case 'SCENE_DETAIL':
      return 'scene-detail';
    case 'SCENE_PLAN':
      return 'scene-plan';
    case 'OPTIONS':
      return 'options';
    case 'PROMPT_PREVIEW':
      return 'prompt-preview';
    case 'SELECT':
      return 'select';
    case 'ACTION_PLAN':
      return 'action-plan';
    case 'PREVIEW':
      return 'generic';
    default:
      return 'generic';
  }
}

/** Stream incompleto: ya se ve el nombre del bloque aunque falte JSON o cierre. */
function inferSkeletonFromPartialTags(c: string): StreamingSkeletonVariant | null {
  const createMatches = [...c.matchAll(/\[CREATE:([a-z_]*)/gi)];
  const lastCreate = createMatches[createMatches.length - 1];
  if (lastCreate) {
    const prefix = lastCreate[1].toLowerCase();
    if (prefix && 'character'.startsWith(prefix)) return 'create-character';
    if (prefix && 'background'.startsWith(prefix)) return 'create-background';
    if (prefix && 'video'.startsWith(prefix)) return 'create-video';
    if (prefix && 'project'.startsWith(prefix)) return 'create-project';
  }
  if (/\[PROJECT_SUMMARY\b/i.test(c) && !/\[\/PROJECT_SUMMARY\]/i.test(c)) return 'project-summary';
  if (/\[VIDEO_SUMMARY\b/i.test(c) && !/\[\/VIDEO_SUMMARY\]/i.test(c)) return 'video-summary';
  if (/\[RESOURCE_LIST\b/i.test(c) && !/\[\/RESOURCE_LIST\]/i.test(c)) return 'resource-list';
  if (/\[SCENE_DETAIL\b/i.test(c) && !/\[\/SCENE_DETAIL\]/i.test(c)) return 'scene-detail';
  if (/\[SCENE_PLAN\b/i.test(c) && !/\[\/SCENE_PLAN\]/i.test(c)) return 'scene-plan';
  if (/\[OPTIONS\b/i.test(c) && !/\[\/OPTIONS\]/i.test(c)) return 'options';
  if (/\[PROMPT_PREVIEW/i.test(c) && !/\[\/PROMPT_PREVIEW\]/i.test(c)) return 'prompt-preview';
  if (/\[ACTION_PLAN\b/i.test(c) && !/\[\/ACTION_PLAN\]/i.test(c)) return 'action-plan';
  return null;
}

/**
 * Elige qué skeleton mostrar: bloques ya parseados, buffer parcial, o último mensaje del usuario.
 */
export function streamingSkeletonVariant(
  rawContent: string,
  blocks: { type: string; subtype?: string }[],
  opts: {
    hasChoices: boolean;
    hasActionPlan: boolean;
    hasWorkflowActions: boolean;
    hasAudio: boolean;
  },
  /** Último mensaje del usuario: fallback si el buffer aún no delata el bloque. */
  userPromptHint?: string | null,
): StreamingSkeletonVariant {
  if (blocks.length > 0) return variantFromBlock(blocks[0]);
  if (opts.hasChoices) return 'choices';
  if (opts.hasActionPlan) return 'action-plan';
  if (opts.hasWorkflowActions) return 'workflow';
  if (opts.hasAudio) return 'audio';

  const c = rawContent;
  if (lastOpenAfterLastClose(c, '[CREATE:character]', '[/CREATE]')) return 'create-character';
  if (lastOpenAfterLastClose(c, '[CREATE:background]', '[/CREATE]')) return 'create-background';
  if (lastOpenAfterLastClose(c, '[CREATE:video]', '[/CREATE]')) return 'create-video';
  if (lastOpenAfterLastClose(c, '[CREATE:project]', '[/CREATE]')) return 'create-project';
  if (lastOpenAfterLastClose(c, '[PROJECT_SUMMARY]', '[/PROJECT_SUMMARY]')) return 'project-summary';
  if (lastOpenAfterLastClose(c, '[VIDEO_SUMMARY]', '[/VIDEO_SUMMARY]')) return 'video-summary';
  if (lastOpenAfterLastClose(c, '[RESOURCE_LIST]', '[/RESOURCE_LIST]')) return 'resource-list';
  if (lastOpenAfterLastClose(c, '[SCENE_DETAIL]', '[/SCENE_DETAIL]')) return 'scene-detail';
  if (lastOpenAfterLastClose(c, '[SCENE_PLAN]', '[/SCENE_PLAN]')) return 'scene-plan';
  if (lastOpenAfterLastClose(c, '[OPTIONS]', '[/OPTIONS]')) return 'options';
  if (lastOpenAfterLastClose(c, '[PROMPT_PREVIEW', '[/PROMPT_PREVIEW]')) return 'prompt-preview';

  const partial = inferSkeletonFromPartialTags(c);
  if (partial) return partial;

  if (userPromptHint) {
    const fromUser = inferSkeletonVariantFromUserPrompt(userPromptHint);
    if (fromUser !== 'generic') return fromUser;
  }

  return 'generic';
}

/** Ancho máximo del compositor (formularios de creación + barra de input), centrado. */
export const CHAT_COMPOSER_MAX_WIDTH_CLASS = 'max-w-[768px] mx-auto w-full';

// ---------------------------------------------------------------------------
// Superficie alineada con la caja principal de `ChatInput` (bg-muted/60)
// ---------------------------------------------------------------------------

/** Misma base visual que el rectángulo del input (barra de chat). */
export const CHAT_INPUT_SURFACE_CLASS = 'bg-muted/60';

/**
 * Un solo “compositor”: mismo borde redondeado que el input solo, con el formulario
 * como extensión superior (sin segundo marco alrededor).
 */
export const CHAT_COMPOSER_UNIFIED_SHELL_CLASS =
  'rounded-xl border border-border/80 flex flex-col overflow-hidden shadow-sm ' + CHAT_INPUT_SURFACE_CLASS;

/** @deprecated usar CHAT_COMPOSER_UNIFIED_SHELL_CLASS */
export const CHAT_CREATION_FUSED_SHELL_CLASS = CHAT_COMPOSER_UNIFIED_SHELL_CLASS;

/** Campos dentro del dock: ligero relieve sobre la misma superficie que el input. */
export const CHAT_DOCK_FIELD_CLASS =
  'w-full rounded-lg border border-border/70 bg-background/55 dark:bg-background/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15';

export const CHAT_DOCK_FIELD_COMPACT_CLASS =
  'w-full rounded-lg border border-border/70 bg-background/55 dark:bg-background/20 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15';

export const CHAT_DOCK_TEXTAREA_CLASS =
  'w-full rounded-lg border border-border/70 bg-background/55 dark:bg-background/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15';

/** Textarea tipo prompt (EN): cuerpo monoespaciado, placeholder sans. */
export const CHAT_DOCK_TEXTAREA_MONO_CLASS = `${CHAT_DOCK_TEXTAREA_CLASS} font-mono placeholder:font-sans`;

/** Panel desplegable (rol, etc.): mismo lenguaje visual que popovers del chat. */
export const CHAT_DOCK_DROPDOWN_PANEL_CLASS =
  'absolute z-30 mt-1 left-0 right-0 rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md shadow-lg ring-1 ring-black/6 dark:ring-white/8 py-1 overflow-hidden';

export const CHAT_DOCK_DROPDOWN_ITEM_CLASS =
  'w-full text-left px-3 py-2 text-xs capitalize transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none';

/** Cabecera del formulario: integrada en la misma superficie (sin “caja” extra). */
export const CHAT_DOCK_SECTION_HEADER_CLASS =
  'flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20';

/** Pie de acciones: separador fino, misma familia que el compositor. */
export const CHAT_DOCK_FOOTER_BAR_CLASS =
  'flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border/40 bg-muted/15';

// ---------------------------------------------------------------------------
// Bloques de elección (☐) en el chat: texto de la IA + “editor” de opciones
// ---------------------------------------------------------------------------

/** Texto de la IA antes de las casillas: permanece visible en el hilo como mensaje propio. */
export const CHAT_CHOICE_INTRO_PANEL_CLASS =
  'rounded-xl border border-border/70 bg-muted/35 dark:bg-muted/20 px-3.5 py-3 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]';

/** Ayuda breve debajo del texto (si el mensaje no lo dice ya). */
export const CHOICE_SELECTION_HINT_ES = 'Selecciona una o varias opciones.';

/** Evita duplicar la ayuda si el markdown ya pide elegir/seleccionar. */
export function choiceMarkdownImpliesSelectionHint(markdown: string): boolean {
  const t = markdown.toLowerCase();
  return /\b(elige|elija|selecciona|seleccione|opciones|una o varias|una o más|marca)\b/i.test(t);
}
