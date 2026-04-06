import type { Character } from '@/types';
import type { Json } from '@/types/database.types';

interface CharacterRules {
  always?: string[];
  never?: string[];
}

interface CharacterVisualAnalysis {
  age_range?: string;
  body_type?: string;
  facial_features?: string;
  hair?: string;
  clothing?: string;
  accessories?: string[];
  expression?: string;
  skin_tone?: string | null;
  distinctive_features?: string[];
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function parseRules(value: Character['rules']): CharacterRules {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { always: [], never: [] };
  }

  const source = value as Record<string, unknown>;
  return {
    always: normalizeStringArray(source.always),
    never: normalizeStringArray(source.never),
  };
}

function parseVisualAnalysis(value: Json | null): CharacterVisualAnalysis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  return {
    age_range: normalizeText(source.age_range),
    body_type: normalizeText(source.body_type),
    facial_features: normalizeText(source.facial_features),
    hair: normalizeText(source.hair),
    clothing: normalizeText(source.clothing),
    accessories: normalizeStringArray(source.accessories),
    expression: normalizeText(source.expression),
    skin_tone: normalizeText(source.skin_tone) || null,
    distinctive_features: normalizeStringArray(source.distinctive_features),
  };
}

function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.,;:\s]+$/g, '').trim();
}

function joinList(values: string[]) {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function extractPhrase(sourceText: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = sourceText.match(pattern);
    if (match?.[1]) {
      return match[1].trim().toLowerCase();
    }
    if (match?.[0]) {
      return match[0].trim().toLowerCase();
    }
  }

  return '';
}

function buildSubjectDescriptor(character: Character, analysis: CharacterVisualAnalysis | null) {
  const sourceText = [
    character.visual_description,
    character.ai_prompt_description,
    character.description,
    character.personality,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();

  const explicitSubject = extractPhrase(sourceText, [
    /(young man)/i,
    /(young woman)/i,
    /(teenage boy)/i,
    /(teenage girl)/i,
    /(adult man)/i,
    /(adult woman)/i,
    /\b(man)\b/i,
    /\b(woman)\b/i,
    /\b(boy)\b/i,
    /\b(girl)\b/i,
  ]);

  const ageRange = trimTrailingPunctuation(analysis?.age_range ?? '');

  if (explicitSubject) {
    return ageRange && !explicitSubject.includes(ageRange.toLowerCase())
      ? `${ageRange} ${explicitSubject}`
      : explicitSubject;
  }

  if (ageRange) {
    return ageRange;
  }

  return 'character';
}

function buildAppearanceSentence(character: Character, analysis: CharacterVisualAnalysis | null) {
  const sourceText = [
    character.visual_description,
    character.ai_prompt_description,
    character.description,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();

  const subject = buildSubjectDescriptor(character, analysis);
  const hair = trimTrailingPunctuation(analysis?.hair || character.hair_description || '');
  const face = trimTrailingPunctuation(analysis?.facial_features || extractPhrase(sourceText, [/((?:slight|light|soft|trimmed) stubble beard)/i]));
  const eyes = trimTrailingPunctuation(extractPhrase(sourceText, [/((?:blue|brown|green|hazel|gray|grey|amber) eyes)/i]));
  const expression = trimTrailingPunctuation(analysis?.expression || extractPhrase(sourceText, [/((?:friendly|warm|gentle|confident|soft) smile)/i, /((?:friendly|warm|gentle|confident|soft) expression)/i]));
  const clothing = trimTrailingPunctuation(analysis?.clothing || character.signature_clothing || '');
  const build = trimTrailingPunctuation(analysis?.body_type || extractPhrase(sourceText, [/((?:medium|lean|slim|athletic|stocky)[\w\s-]* build)/i, /((?:athletic|lean|slender|stocky) build)/i]));

  const accessoryValues = [
    ...normalizeStringArray(character.accessories),
    ...normalizeStringArray(analysis?.accessories),
  ].map((item) => trimTrailingPunctuation(item));

  const accessories = Array.from(new Set(accessoryValues.filter(Boolean)));
  const detailParts = [
    hair ? `with ${hair}` : '',
    face,
    eyes,
    expression,
    clothing ? `wearing ${clothing}` : '',
    accessories.length > 0 ? `with ${joinList(accessories)}` : 'no visible extra accessories',
    build,
  ].filter(Boolean);

  const base = detailParts.length > 0
    ? `A ${subject} ${detailParts.join(', ')}`
    : `A ${subject}`;

  const distinctives = normalizeStringArray(analysis?.distinctive_features)
    .map((item) => trimTrailingPunctuation(item))
    .filter(Boolean);

  return `${sentenceCase(trimTrailingPunctuation(base))}${distinctives.length > 0 ? `, with ${joinList(distinctives)}` : ''}.`;
}

function buildGuardrailSentence(character: Character) {
  const rules = parseRules(character.rules);
  const always = rules.always?.filter(Boolean) ?? [];
  const never = rules.never?.filter(Boolean) ?? [];

  if (always.length === 0 && never.length === 0) {
    return '';
  }

  const clauses = [
    always.length > 0 ? `Always maintain ${joinList(always)}` : '',
    never.length > 0 ? `Avoid ${joinList(never)}` : '',
  ].filter(Boolean);

  return `${clauses.join('. ')}.`;
}

export function buildCharacterTurnaroundPrompt(character: Character) {
  const analysis = parseVisualAnalysis(character.ai_visual_analysis);
  const appearance = buildAppearanceSentence(character, analysis);
  const guardrails = buildGuardrailSentence(character);
  const outfitFocus = trimTrailingPunctuation(analysis?.clothing || character.signature_clothing || 'outfit');

  return [
    '3D animated Pixar-style character reference sheet, multiple views on a solid bright green chroma key background.',
    appearance,
    'The sheet shows 6 panels arranged in a 2x3 grid: top-left full body front view standing straight with arms at sides, top-center full body side profile view with hand in pocket, top-right extreme close-up of face showing facial features and expression detail, bottom-left full body back view, bottom-center full body 3/4 angle view with hand in pocket and friendly smile, bottom-right close-up portrait from chest up showing ' + outfitFocus + ' detail and smile.',
    'All poses on identical solid green screen background. Consistent lighting across all panels, soft even studio lighting, no shadows on background.',
    'Ultra detailed, professional character turnaround sheet, Pixar 3D render, clean layout.',
    guardrails,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}