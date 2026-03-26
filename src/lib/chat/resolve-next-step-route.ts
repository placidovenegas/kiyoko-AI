/**
 * Mapea etiquetas de "¿Siguiente paso?" a rutas reales del dashboard (V8).
 * Si no hay ruta conocida, devuelve null y el caller puede enviar el texto al chat.
 */

export type CreatedEntityKind = 'character' | 'background' | 'video' | 'project';

export interface ResolveNextStepParams {
  label: string;
  /** short_id del proyecto actual en contexto (segmento URL /project/[shortId]/...) */
  projectShortId: string | null | undefined;
  createdEntityKind?: CreatedEntityKind;
  /** UUID del recurso recién creado (personaje / fondo; vídeo usa short_id en la URL) */
  createdEntityId?: string;
  /** short_id del vídeo (ruta /video/[videoShortId]) */
  videoShortId?: string;
  /** Tras crear un proyecto: su short_id para ir a `/project/[shortId]` */
  createdProjectShortId?: string;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * @returns pathname relativo (para `router.push`) o null
 */
export function resolveNextStepRoute(p: ResolveNextStepParams): string | null {
  const l = norm(p.label);

  // Proyecto recién creado (p. ej. desde dashboard sin contexto de proyecto)
  const createdPs = p.createdProjectShortId?.trim();
  if (p.createdEntityKind === 'project' && createdPs) {
    if (l.includes('abrir proyecto') || l.includes('ver proyecto')) {
      return `/project/${createdPs}`;
    }
    if (l.includes('crear video') || l.includes('crear vídeo')) {
      return `/project/${createdPs}/videos`;
    }
    if (l.includes('añadir personaje')) {
      return `/project/${createdPs}/resources/characters`;
    }
    if (l.includes('tareas')) {
      return `/project/${createdPs}/tasks`;
    }
  }

  const slug = p.projectShortId?.trim();
  if (!slug) return null;

  const base = `/project/${slug}`;

  // Listados / secciones
  if (l.includes('personajes') && !l.includes('ver personaje')) return `${base}/resources/characters`;
  if (l.includes('fondos')) return `${base}/resources/backgrounds`;
  if (l.includes('tareas')) return `${base}/tasks`;
  if (l.includes('ajustes del proyecto') || l.includes('ajustes')) return `${base}/settings`;
  if (l.includes('volver al proyecto')) return `${base}`;
  if (l.includes('escenas') && p.createdEntityKind === 'video') return `${base}/videos`;

  // Vídeo creado: la ruta usa short_id, no UUID
  if (l.includes('ver video') && p.createdEntityKind === 'video') {
    const vs = p.videoShortId?.trim();
    if (vs) return `${base}/video/${vs}`;
    return `${base}/videos`;
  }

  // Detalle personaje / fondo (UUID en la URL)
  if (p.createdEntityId) {
    if (l.includes('ver personaje') && p.createdEntityKind === 'character') {
      return `${base}/resources/characters/${p.createdEntityId}`;
    }
    if (l.includes('ver fondo') && p.createdEntityKind === 'background') {
      return `${base}/resources/backgrounds/${p.createdEntityId}`;
    }
  }

  // Acciones que siguen siendo conversación / generación (mejor por chat)
  if (l.includes('subir imagen referencia') || l.includes('subir referencia')) return null;
  if (l.includes('regenerar prompt')) return null;

  return null;
}
