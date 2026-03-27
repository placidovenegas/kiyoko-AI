// ============================================================
// Intent Detection — Clasifica el mensaje del usuario para
// elegir el agente especializado correcto.
// Versión V2: 30+ intenciones (vs 4 de la V1).
// Soporta español e inglés.
// ============================================================

export type Intent =
  // ---------- Creación ----------
  | 'create_character'
  | 'create_background'
  | 'create_video'
  | 'create_scene'
  | 'create_task'
  | 'create_project'
  // ---------- Lectura / detalle ----------
  | 'view_character'
  | 'view_background'
  | 'view_scene'
  | 'view_video'
  | 'view_project'
  | 'list_characters'
  | 'list_backgrounds'
  | 'list_scenes'
  | 'list_tasks'
  // ---------- Edición ----------
  | 'edit_character'
  | 'edit_background'
  | 'edit_scene'
  | 'edit_video'
  | 'edit_project'
  // ---------- Eliminación ----------
  | 'delete_entity'
  // ---------- Generación IA ----------
  | 'generate_prompt'
  | 'generate_narration'
  | 'generate_ideas'
  // ---------- Análisis ----------
  | 'analyze_video'
  | 'analyze_scene'
  | 'scene_readiness'
  | 'next_steps'
  // ---------- Cámara ----------
  | 'configure_camera'
  // ---------- Navegación ----------
  | 'navigate_to'
  // ---------- Estilos ----------
  | 'view_styles'
  // ---------- Actividad ----------
  | 'view_activity'
  // ---------- General ----------
  | 'general';

// ---- Helpers ----

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

interface IntentRule {
  intent: Intent;
  pattern: RegExp;
}

// Reglas ordenadas de más específica a menos específica.
// La primera que matchea gana.
const RULES: IntentRule[] = [
  // ======== CREACIÓN ========

  // Crear personaje
  {
    intent: 'create_character',
    pattern: /\b(crea|crear|nuevo|nueva|a[nñ]ade?|a[nñ]adir|genera|dise[nñ]a|inventar?|necesito)\b.*\b(personaje|character|protagonista|antagonista|narrador|actor)\b/,
  },
  {
    intent: 'create_character',
    pattern: /\b(personaje|character)\b.*\b(nuevo|nueva|crear|crear)\b/,
  },

  // Crear fondo / locación
  {
    intent: 'create_background',
    pattern: /\b(crea|crear|nuevo|nueva|a[nñ]ade?|a[nñ]adir|genera|dise[nñ]a)\b.*\b(fondo|background|locacion|location|escenario|ambiente)\b/,
  },
  {
    intent: 'create_background',
    pattern: /\b(fondo|background|locacion)\b.*\b(nuevo|nueva|crear)\b/,
  },

  // Crear video
  {
    intent: 'create_video',
    pattern: /\b(crea|crear|nuevo|nueva|genera|montar|configurar?)\b.*\b(video|v[ií]deo|clip|corte|reel)\b/,
  },
  {
    intent: 'create_video',
    pattern: /\b(video|v[ií]deo)\b.*\b(nuevo|nueva|crear)\b/,
  },

  // Crear escena(s)
  {
    intent: 'create_scene',
    pattern: /\b(crea|crear|genera|planifica|dise[nñ]a|proponer?|propon|estructura|necesito)\b.*\b(escena|scene|storyboard)\b/,
  },
  {
    intent: 'create_scene',
    pattern: /\b(plan\s+de\s+escenas|scene\s*plan|cu[aá]ntas\s+escenas|arco\s+narrativo|narrative\s+arc|story\s+arc)\b/,
  },
  {
    intent: 'create_scene',
    pattern: /\b(escena|scene)s?\b.*\b(nueva|nuevo|crear|genera|planifica)\b/,
  },

  // Crear tarea
  {
    intent: 'create_task',
    pattern: /\b(crea|crear|nuevo|nueva|a[nñ]ade?|a[nñ]adir)\b.*\b(tarea|task|to-?do)\b/,
  },

  // Crear proyecto
  {
    intent: 'create_project',
    pattern: /\b(crea|crear|nuevo|nueva|inicia|empeza|start)\b.*\b(proyecto|project)\b/,
  },

  // ======== ELIMINACIÓN ========
  {
    intent: 'delete_entity',
    pattern: /\b(elimina|borrar?|borra|quita|remove|delete|drop)\b.*\b(personaje|character|fondo|background|escena|scene|video|v[ií]deo|tarea|task|proyecto|project)\b/,
  },

  // ======== GENERACIÓN IA ========

  // Generar prompts de imagen/video
  {
    intent: 'generate_prompt',
    pattern: /\b(genera|generar|crea|crear|escribe|escribir|mejorar?|mejora|regenera|reescribe)\b.*\b(prompt|prompts)\b/,
  },
  {
    intent: 'generate_prompt',
    pattern: /\b(prompt|prompts)\b.*\b(genera|generar|mejorar?|imagen|video|batch)\b/,
  },
  {
    intent: 'generate_prompt',
    pattern: /\b(first.?frame|imagen.*escena|video.*escena|genera.*imagen|genera.*video|prompt.*imagen|prompt.*video|batch\s*prompt)/,
  },

  // Generar narración / voiceover
  {
    intent: 'generate_narration',
    pattern: /\b(genera|generar|crea|crear|escribe|escribir|graba)\b.*\b(narracion|narration|voiceover|voz\s+en\s+off|locucion|audio\s+narr|texto\s+narracion)\b/,
  },
  {
    intent: 'generate_narration',
    pattern: /\b(narracion|narration|voiceover|locucion)\b/,
  },

  // Generar ideas
  {
    intent: 'generate_ideas',
    pattern: /\b(ideas?|suger|inspira|proponer?|propon|recomienda|brainstorm)\b.*\b(video|v[ií]deo|proyecto|project|contenido|content|creativ)\b/,
  },
  {
    intent: 'generate_ideas',
    pattern: /\b(dame|dime|necesito)\b.*\b(ideas?|sugerencia|inspiracion)\b/,
  },

  // ======== ANÁLISIS ========

  // Analizar video/escena
  {
    intent: 'analyze_video',
    pattern: /\b(analiza|analizar|evalua|evaluar|revisa|revisar|diagnostica)\b.*\b(video|v[ií]deo|pacing|ritmo)\b/,
  },
  {
    intent: 'analyze_scene',
    pattern: /\b(analiza|analizar|evalua|evaluar|revisa)\b.*\b(escena|scene)\b/,
  },

  // Scene readiness / qué falta
  {
    intent: 'scene_readiness',
    pattern: /\b(que\s+(le\s+)?falta|what.s?\s+missing|readiness|listo\s+para|preparad[oa]\s+para|checklist)\b/,
  },
  {
    intent: 'scene_readiness',
    pattern: /\b(estado|status)\b.*\b(escena|scene)\b/,
  },

  // Siguiente paso
  {
    intent: 'next_steps',
    pattern: /\b(siguiente\s+paso|next\s+step|que\s+(?:hago|sigue|toca)|what.s?\s+next|por\s+donde\s+sigo)\b/,
  },

  // ======== CÁMARA ========
  {
    intent: 'configure_camera',
    pattern: /\b(camara|c[aá]mara|camera|angulo|[aá]ngulo|plano|encuadre|movimiento\s+de\s+c[aá]mara|lighting|iluminaci[oó]n|mood)\b/,
  },

  // ======== LECTURA / VER ========

  // Ver detalle de personaje
  {
    intent: 'view_character',
    pattern: /\b(ver|muestra|muestrame|ensena|ense[nñ]ame|detalles?\s+de|show|info\s+de|ficha\s+de)\b.*\b(personaje|character)\b/,
  },

  // Ver detalle de fondo
  {
    intent: 'view_background',
    pattern: /\b(ver|muestra|muestrame|detalles?\s+de|show|info\s+de|ficha\s+de)\b.*\b(fondo|background|locacion|location)\b/,
  },

  // Ver detalle de escena
  {
    intent: 'view_scene',
    pattern: /\b(ver|muestra|muestrame|detalles?\s+de|show|info\s+de)\b.*\b(escena|scene)\b/,
  },
  {
    intent: 'view_scene',
    pattern: /\bescena\s*#?\d+\b/,
  },

  // Ver detalle de video
  {
    intent: 'view_video',
    pattern: /\b(ver|muestra|muestrame|detalles?\s+de|show|estado\s+del)\b.*\b(video|v[ií]deo)\b/,
  },

  // Ver resumen de proyecto
  {
    intent: 'view_project',
    pattern: /\b(ver|muestra|muestrame|resumen|estado|estado\s+del|show|overview|dashboard)\b.*\b(proyecto|project)\b/,
  },
  {
    intent: 'view_project',
    pattern: /\b(resumen\s+general|project\s+summary|estado\s+actual)\b/,
  },

  // ======== LISTAS ========

  // Listar personajes
  {
    intent: 'list_characters',
    pattern: /\b(muestra|muestrame|lista|listar?|ver|todos?\s+los|show|list)\b.*\b(personajes|characters|casting)\b/,
  },
  {
    intent: 'list_characters',
    pattern: /\b(personajes|characters)\b.*\b(del\s+proyecto|disponibles|que\s+tengo)\b/,
  },

  // Listar fondos
  {
    intent: 'list_backgrounds',
    pattern: /\b(muestra|muestrame|lista|listar?|ver|todos?\s+los|show|list)\b.*\b(fondos|backgrounds|locaciones|locations)\b/,
  },

  // Listar escenas
  {
    intent: 'list_scenes',
    pattern: /\b(muestra|muestrame|lista|listar?|ver|todas?\s+las|show|list)\b.*\b(escenas|scenes)\b/,
  },

  // Listar tareas
  {
    intent: 'list_tasks',
    pattern: /\b(muestra|muestrame|lista|listar?|ver|todas?\s+las|show|list)\b.*\b(tareas|tasks|to-?dos?|pendientes)\b/,
  },
  {
    intent: 'list_tasks',
    pattern: /\b(tareas|tasks|pendientes|backlog)\b.*\b(del\s+proyecto|abiertas?|pendientes?)\b/,
  },

  // ======== EDICIÓN ========

  // Editar personaje
  {
    intent: 'edit_character',
    pattern: /\b(edita|editar|modifica|modificar|cambia|cambiar|actualiza|actualizar|renombra)\b.*\b(personaje|character)\b/,
  },

  // Editar fondo
  {
    intent: 'edit_background',
    pattern: /\b(edita|editar|modifica|modificar|cambia|cambiar|actualiza)\b.*\b(fondo|background|locacion)\b/,
  },

  // Editar escena
  {
    intent: 'edit_scene',
    pattern: /\b(edita|editar|modifica|modificar|cambia|cambiar|actualiza|reorden|mover?|intercambi|asign)\b.*\b(escena|scene)\b/,
  },
  {
    intent: 'edit_scene',
    pattern: /\b(asignar?|asigna)\b.*\b(personaje|character|fondo|background)\b.*\b(escena|scene)\b/,
  },
  {
    intent: 'edit_scene',
    pattern: /\b(duraci[oó]n|duration)\b.*\b(escena|scene)\b/,
  },

  // Editar video
  {
    intent: 'edit_video',
    pattern: /\b(edita|editar|modifica|modificar|cambia|cambiar|actualiza)\b.*\b(video|v[ií]deo)\b/,
  },

  // Editar proyecto
  {
    intent: 'edit_project',
    pattern: /\b(edita|editar|modifica|modificar|cambia|cambiar|actualiza)\b.*\b(proyecto|project)\b/,
  },

  // ======== NAVEGACIÓN ========
  {
    intent: 'navigate_to',
    pattern: /\b(lleva|llevame|abre|abrir|ir\s+a|go\s+to|open|navega)\b.*\b(pagina|page|settings|ajustes|configuracion|dashboard)\b/,
  },

  // ======== ESTILOS ========
  {
    intent: 'view_styles',
    pattern: /\b(estilo|style|paleta|palette|preset|visual)\b.*\b(proyecto|project|actual|ver|show)\b/,
  },

  // ======== ACTIVIDAD ========
  {
    intent: 'view_activity',
    pattern: /\b(actividad|activity|historial|history|que\s+se\s+hizo|cambios?\s+recientes?|log)\b/,
  },
];

/**
 * Clasifica la intención del último mensaje del usuario.
 * Recorre las reglas en orden de prioridad. Primera que matchea gana.
 * Si ninguna matchea → 'general'.
 */
export function detectIntent(message: string): Intent {
  const lower = norm(message);

  for (const rule of RULES) {
    if (rule.pattern.test(lower)) {
      return rule.intent;
    }
  }

  return 'general';
}
