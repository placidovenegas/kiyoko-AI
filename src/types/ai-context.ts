// AI Context — detecta en qué parte de la app está el usuario
// y qué datos deben cargarse para el system prompt.

export type ContextLevel = 'dashboard' | 'organization' | 'project' | 'video' | 'scene';

export interface AiContext {
  level: ContextLevel;
  url: string;                  // URL completa actual (para restaurar navegación)

  orgId?: string;               // UUID org activa
  orgSlug?: string;

  projectId?: string;           // UUID (si level >= project)
  projectShortId?: string;      // short_id para URLs

  videoId?: string;             // UUID (si level >= video)
  videoShortId?: string;        // short_id para URLs

  sceneId?: string;             // UUID (si level = scene)
  sceneShortId?: string;
}

/**
 * Parsea la URL del router para obtener el contexto completo.
 * Llámalo en el cliente con `usePathname()` y los params resueltos.
 */
export function buildAiContext(pathname: string, params?: Record<string, string>): AiContext {
  const projectShortId = params?.shortId ?? extractSegment(pathname, 'project');
  const videoShortId   = params?.videoShortId ?? extractSegment(pathname, 'video');
  const sceneShortId   = params?.sceneShortId ?? extractSegment(pathname, 'scene');
  const orgId          = params?.orgId ?? extractSegment(pathname, 'organizations');

  let level: ContextLevel = 'dashboard';
  if (sceneShortId) level = 'scene';
  else if (videoShortId) level = 'video';
  else if (projectShortId) level = 'project';
  else if (orgId) level = 'organization';

  return {
    level,
    url: pathname,
    orgId,
    projectShortId,
    videoShortId,
    sceneShortId,
  };
}

function extractSegment(pathname: string, key: string): string | undefined {
  const regex = new RegExp(`/${key}/([^/]+)`);
  return pathname.match(regex)?.[1];
}
