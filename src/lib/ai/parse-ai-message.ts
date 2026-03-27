// ============================================================
// Parser de mensajes IA → bloques interactivos
// Detecta los bloques especiales que la IA inserta en su texto
// y los convierte en objetos tipados para renderizar en el chat.
// ============================================================

export type BlockType =
  | 'ACTION_PLAN'
  | 'PREVIEW'
  | 'SELECT'
  | 'OPTIONS'
  | 'DIFF'
  | 'PROMPT_PREVIEW'
  | 'SCENE_PLAN'
  | 'PROJECT_SUMMARY'
  | 'CREATE'
  | 'SCENE_DETAIL'
  | 'RESOURCE_LIST'
  | 'VIDEO_SUMMARY'
  | 'SUGGESTIONS';

export interface ParsedBlock {
  type: BlockType;
  subtype?: string;       // Para PREVIEW:scene → subtype = 'scene'
  data: unknown;          // JSON parseado o string si no es JSON válido
  raw: string;            // Contenido crudo del bloque (para debug)
}

export interface ParsedMessage {
  text: string;           // Texto markdown sin los bloques especiales
  blocks: ParsedBlock[];  // Bloques extraídos en orden de aparición
  suggestions: string[];  // Shortcuts: [SUGGESTIONS]...[/SUGGESTIONS]
  actionPlan: ActionPlanBlock | null;
}

// Tipos específicos de datos por bloque

export interface ActionPlanBlock {
  description: string;
  requires_confirmation: boolean;
  actions: ActionData[];
}

export interface ActionData {
  type: string;
  table: string | null;
  entity_id?: string;
  data: Record<string, unknown>;
}

export interface ScenePlanItem {
  scene_number: number;
  title: string;
  duration: number;
  arc_phase: 'hook' | 'build' | 'peak' | 'close' | string;
  description: string;
}

export interface DiffData {
  before: string;
  after: string;
}

export interface PromptPreviewData {
  text: string;
  version?: number;
  tags?: string[];
}

// ============================================================
// JSON repair — intenta corregir JSON malformado de LLMs
// ============================================================

function repairJson(raw: string): string {
  let s = raw.trim();

  // Trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');

  // Unquoted keys: { key: → { "key":
  s = s.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');

  // Single quotes → double quotes (naive but helps)
  // Only replace if not already valid JSON
  try { JSON.parse(s); return s; } catch { /* continue */ }
  s = s.replace(/'/g, '"');

  // Missing closing bracket/brace
  const opens = (s.match(/[{[]/g) || []).length;
  const closes = (s.match(/[}\]]/g) || []).length;
  if (opens > closes) {
    for (let i = 0; i < opens - closes; i++) {
      // Determine if last open was { or [
      const lastOpen = s.lastIndexOf('{') > s.lastIndexOf('[') ? '}' : ']';
      s += lastOpen;
    }
  }

  return s;
}

function safeJsonParse(raw: string): unknown {
  const trimmed = raw.trim();
  // Try raw first
  try { return JSON.parse(trimmed); } catch { /* continue */ }
  // Try repaired
  try { return JSON.parse(repairJson(trimmed)); } catch { /* continue */ }
  // Return as string
  return trimmed;
}

// ============================================================
// Regex principal
// Soporta: [TIPO]...[/TIPO] y [TIPO:subtipo]...[/TIPO]
// ============================================================

const BLOCK_REGEX = /\[(ACTION_PLAN|PREVIEW(?::\w+)?|SELECT(?::\w+)?|OPTIONS|DIFF(?::\w+)?|PROMPT_PREVIEW(?::\w+)?|SCENE_PLAN|PROJECT_SUMMARY|CREATE(?::\w+)?|SCENE_DETAIL|RESOURCE_LIST|VIDEO_SUMMARY|SUGGESTIONS)\]([\s\S]*?)\[\/(?:ACTION_PLAN|PREVIEW(?::\w+)?|SELECT(?::\w+)?|OPTIONS|DIFF(?::\w+)?|PROMPT_PREVIEW(?::\w+)?|SCENE_PLAN|PROJECT_SUMMARY|CREATE(?::\w+)?|SCENE_DETAIL|RESOURCE_LIST|VIDEO_SUMMARY|SUGGESTIONS)\]/g;

// También parsea el formato legacy: ```json { "type": "action_plan" } ```
const LEGACY_ACTION_PLAN_REGEX = /```json\s*([\s\S]*?)```/g;

// Y sugerencias legacy: [SUGERENCIAS] ... [/SUGERENCIAS]
const LEGACY_SUGGESTIONS_REGEX = /\[SUGERENCIAS\]([\s\S]*?)\[\/SUGERENCIAS\]/;

/**
 * Parsea el contenido de un mensaje del asistente y extrae
 * todos los bloques especiales como objetos tipados.
 */
export function parseAiMessage(content: string): ParsedMessage {
  const blocks: ParsedBlock[] = [];
  let textContent = content;
  const suggestions: string[] = [];
  let actionPlan: ActionPlanBlock | null = null;

  // ---- 1. Extraer bloques con nuevo formato [TIPO:subtipo]...[/TIPO] ----
  const newFormatMatches: Array<{ fullMatch: string; blockType: string; blockContent: string }> = [];
  BLOCK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BLOCK_REGEX.exec(content)) !== null) {
    newFormatMatches.push({
      fullMatch: match[0],
      blockType: match[1],
      blockContent: match[2],
    });
  }

  for (const { fullMatch, blockType, blockContent } of newFormatMatches) {
    textContent = textContent.replace(fullMatch, '');

    const [baseType, subtype] = blockType.split(':') as [BlockType, string?];
    const trimmed = blockContent.trim();

    const parsed = safeJsonParse(trimmed);

    const block: ParsedBlock = { type: baseType, subtype, data: parsed, raw: trimmed };
    blocks.push(block);

    // Extraer action plan
    if (baseType === 'ACTION_PLAN' && typeof parsed === 'object' && parsed !== null) {
      actionPlan = parsed as ActionPlanBlock;
    }

    // Extraer sugerencias
    if (baseType === 'SUGGESTIONS') {
      if (Array.isArray(parsed)) {
        suggestions.push(...(parsed as string[]));
      } else if (typeof parsed === 'string') {
        suggestions.push(...parsed.split('\n').map((s) => s.trim()).filter(Boolean));
      }
    }
  }

  // ---- 2. Fallback: formato legacy ```json { "type": "action_plan" } ``` ----
  if (!actionPlan) {
    LEGACY_ACTION_PLAN_REGEX.lastIndex = 0;
    while ((match = LEGACY_ACTION_PLAN_REGEX.exec(textContent)) !== null) {
      const parsed = safeJsonParse(match[1].trim());
      if (typeof parsed === 'object' && parsed !== null) {
        const p = parsed as Record<string, unknown>;
        // Es un action_plan legacy si tiene "type": "action_plan" y "actions"
        if (p.type === 'action_plan' && Array.isArray(p.actions)) {
          actionPlan = {
            description: (p.summary_es as string) || '',
            requires_confirmation: true,
            actions: (p.actions as ActionData[]) || [],
          };
          textContent = textContent.replace(match[0], '');
          blocks.push({ type: 'ACTION_PLAN', data: actionPlan, raw: match[1] });
        }
      }
    }
  }

  // ---- 3. Fallback: sugerencias legacy [SUGERENCIAS] ... [/SUGERENCIAS] ----
  if (suggestions.length === 0) {
    const legacyMatch = textContent.match(LEGACY_SUGGESTIONS_REGEX);
    if (legacyMatch) {
      const items = legacyMatch[1]
        .split('\n')
        .map((s) => s.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      suggestions.push(...items);
      textContent = textContent.replace(legacyMatch[0], '');
    }
  }

  // ---- 4. Fallback: [OPTIONS] o [SUGGESTIONS] sin tag de cierre ----
  // LLMs a veces generan [OPTIONS]["a","b"] sin [/OPTIONS]
  const UNCLOSED_OPTIONS = /\[OPTIONS\]\s*(\[[\s\S]*?\])/g;
  const UNCLOSED_SUGGESTIONS = /\[SUGGESTIONS\]\s*(\[[\s\S]*?\])/g;
  const UNCLOSED_CREATE = /\[CREATE:(\w+)\]\s*(\{[\s\S]*?\})/g;

  if (!blocks.some((b) => b.type === 'OPTIONS')) {
    UNCLOSED_OPTIONS.lastIndex = 0;
    const optMatch = UNCLOSED_OPTIONS.exec(textContent);
    if (optMatch) {
      const parsed = safeJsonParse(optMatch[1]);
      if (Array.isArray(parsed)) {
        blocks.push({ type: 'OPTIONS', data: parsed, raw: optMatch[1] });
        textContent = textContent.replace(optMatch[0], '');
      }
    }
  }

  if (suggestions.length === 0) {
    UNCLOSED_SUGGESTIONS.lastIndex = 0;
    const sugMatch = UNCLOSED_SUGGESTIONS.exec(textContent);
    if (sugMatch) {
      const parsed = safeJsonParse(sugMatch[1]);
      if (Array.isArray(parsed)) {
        suggestions.push(...(parsed as string[]));
        textContent = textContent.replace(sugMatch[0], '');
      }
    }
  }

  if (!blocks.some((b) => b.type === 'CREATE')) {
    UNCLOSED_CREATE.lastIndex = 0;
    let createMatch: RegExpExecArray | null;
    while ((createMatch = UNCLOSED_CREATE.exec(textContent)) !== null) {
      const parsed = safeJsonParse(createMatch[2]);
      if (typeof parsed === 'object' && parsed !== null) {
        blocks.push({ type: 'CREATE', subtype: createMatch[1], data: parsed, raw: createMatch[2] });
        textContent = textContent.replace(createMatch[0], '');
      }
    }
  }

  // ---- 5. Limpiar texto residual ----
  textContent = textContent
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text: textContent, blocks, suggestions, actionPlan };
}

/**
 * Extrae solo las sugerencias de un mensaje (para casos simples).
 */
export function extractSuggestions(content: string): string[] {
  return parseAiMessage(content).suggestions;
}

/**
 * Extrae solo el action plan de un mensaje.
 */
export function extractActionPlan(content: string): ActionPlanBlock | null {
  return parseAiMessage(content).actionPlan;
}
