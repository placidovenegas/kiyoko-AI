import type { StreamingSkeletonVariant } from '@/components/chat/chatDockOverlay';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Antes de que exista bloque parseable, infiere el skeleton esperado desde el último mensaje del usuario.
 */
export function inferSkeletonVariantFromUserPrompt(
  text: string | null | undefined,
): StreamingSkeletonVariant {
  if (!text?.trim()) return 'generic';
  const t = norm(text);

  if (/(crear|nuevo|new)\s*(un\s*)?(proyecto|project)\b/.test(t)) return 'create-project';
  if (/(crear|nuevo)\s*(un\s*)?(video|v[ií]deo)\b/.test(t)) return 'create-video';
  if (/(crear|nuevo|a[nñ]adir)\s*(un\s*)?(personaje|character)\b/.test(t)) return 'create-character';
  if (/(crear|nuevo|a[nñ]adir)\s*(un\s*)?(fondo|background|locaci[oó]n)\b/.test(t)) return 'create-background';
  if (/(resumen|estado)\s*(del\s*)?(proyecto|project)\b/.test(t) || /\bestado\s+del\s+proyecto\b/.test(t)) {
    return 'project-summary';
  }
  if (/(resumen|estado)\s*(del\s*)?(video|v[ií]deo)\b/.test(t)) return 'video-summary';
  if (/muestra.*(personajes|characters)\b/.test(t) || /lista\s+de\s+personajes\b/.test(t)) {
    return 'resource-list';
  }
  if (/muestra.*(fondos|backgrounds)\b/.test(t) || /lista\s+de\s+fondos\b/.test(t)) {
    return 'resource-list';
  }
  if (/(detalle|muestra|ver)\s+(la\s*)?(escena|scene)\b/.test(t) || /\bscene\s+detail\b/.test(t)) {
    return 'scene-detail';
  }
  if (/(plan\s+de\s+escenas|timeline|scene\s*plan)\b/.test(t)) return 'scene-plan';
  if (/\bopciones\b/.test(t) && /(elegir|elige|escoge)\b/.test(t)) return 'options';
  if (/\bdiff\b/.test(t) || /comparar\s+cambios/.test(t)) return 'prompt-preview';

  return 'generic';
}
