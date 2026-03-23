// ============================================================
// Intent Detection — Clasifica el mensaje del usuario para
// elegir el agente especializado correcto.
// Basado en KIYOKO_DEFINITIVO sección 22
// Soporta español e inglés.
// ============================================================

export type Intent = 'create_scenes' | 'generate_prompts' | 'edit_scene' | 'general';

/**
 * Clasifica la intención del último mensaje del usuario.
 * Primera versión con regex; en el futuro puede ser un clasificador LLM.
 */
export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();

  // ---- Crear / planificar escenas (ES + EN) ----
  if (
    /crea.*escena|genera.*escena|planifica|plan de escenas|cu[aá]ntas escenas|empez.*escena|escenas para|necesito.*escenas|dise[ñn]a.*escena|prop[oó]n.*escena|arco narrativo|estructura.*video|create.*scene|plan.*scene|how many scenes|start.*scene|design.*scene|narrative arc|story arc|scene plan/i.test(lower)
  ) {
    return 'create_scenes';
  }

  // ---- Generar / mejorar prompts (ES + EN) ----
  if (
    /prompt|genera.*prompt|mejora.*prompt|first.?frame|imagen.*escena|video.*escena|genera.*imagen|genera.*video|prompt.*imagen|prompt.*video|generar los prompts|prompts que faltan|generate.*prompt|improve.*prompt|image.*scene|create.*prompt|write.*prompt|batch.*prompt/i.test(lower)
  ) {
    return 'generate_prompts';
  }

  // ---- Editar escenas existentes (ES + EN) ----
  if (
    /cambi.*escena|edit.*escena|modific.*escena|c[aá]mara|reorden|quit.*escena|asign.*personaje|asign.*fondo|elimin.*escena|borr.*escena|duraci[oó]n.*escena|mover.*escena|intercambi.*escena|cambia la escena|edita la escena|change.*scene|edit.*scene|modify.*scene|camera|reorder|assign.*character|assign.*background|delete.*scene|remove.*scene|duration.*scene|move.*scene|swap.*scene/i.test(lower)
  ) {
    return 'edit_scene';
  }

  return 'general';
}
