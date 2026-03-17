# 🧠 KIYOKO AI — Documento de Mejoras v4

## El Chat IA como Director Creativo Principal

### Para: Claude Code — Implementación sobre el proyecto existente

---

## RESUMEN EJECUTIVO

El cambio más importante de esta actualización es convertir el **Chat IA** en el centro de control de todo el storyboard. Ahora mismo el chat es una herramienta secundaria. Debe pasar a ser **el modo principal de trabajo**: el usuario habla con Kiyoko como hablaría con un director de cine, y Kiyoko ejecuta los cambios sobre las escenas, personajes, prompts y timeline automáticamente.

**Lo que el usuario debe poder hacer desde el chat:**
- "José es el jefe, no lava cabezas ni echa tintes. Quítalo de esas escenas"
- "Hay demasiadas escenas, reduce a 15 y ordénalas bien"
- "La escena 4 debería durar 8 segundos, no 5"
- "Quiero una escena nueva entre la 3 y la 4 donde Conchi peina a una clienta"
- "Pon todas las escenas en orden cronológico y ajusta los tiempos"
- "Genera los prompts que faltan en las escenas 7, 8 y 9"
- "Explícame qué pasa en cada escena del vídeo completo"

Y Kiyoko responde mostrando exactamente qué va a cambiar, pide confirmación, y ejecuta.

---

## 1. ARQUITECTURA DEL CHAT INTELIGENTE

### 1.1 El Chat como Panel Principal

El chat debe estar **siempre accesible** desde la página del storyboard como panel lateral redimensionable (ya existe `react-resizable-panels`). Cuando el usuario abre el storyboard, el chat está ahí a la derecha, listo para recibir instrucciones.

```
┌──────────────────────────────────────┬──────────────────────────┐
│                                      │  💬 KIYOKO AI            │
│  STORYBOARD                          │  ─────────────────────── │
│  (escenas, cards, vista completa)    │                          │
│                                      │  🤖 ¡Hola! Tu storyboard│
│  ┌─ Escena E1 ──────────────────┐   │  tiene 28 escenas y 75s. │
│  │ Logo Reveal · 5s · Intro     │   │  ¿En qué te ayudo?       │
│  │ Prompt: Pixar Studios 3D...  │   │                          │
│  └──────────────────────────────┘   │  Sugerencias rápidas:    │
│                                      │  [Revisar personajes]    │
│  ┌─ Escena E2 ──────────────────┐   │  [Reducir escenas]       │
│  │ Exterior · 5s · Presentación │   │  [Ordenar timeline]      │
│  └──────────────────────────────┘   │  [Explicar el vídeo]     │
│                                      │                          │
│  ...                                 │  ────────────────────────│
│                                      │  [📎] Escribe aquí... [→]│
└──────────────────────────────────────┴──────────────────────────┘
```

**Cambio clave**: El panel de chat NO es una página separada (`/chat`). Es un **panel lateral persistente** dentro de `/storyboard` que se puede expandir, contraer o redimensionar. Existe junto a las escenas, no en otra pestaña.

### 1.2 Sistema de Acciones del Chat (Action System)

Cuando la IA detecta que el usuario quiere hacer un cambio, NO lo hace directamente. Primero **muestra un plan de acción** y pide confirmación.

```typescript
// src/types/ai-actions.ts

/**
 * Cada acción que la IA propone es un objeto tipado.
 * La IA genera un array de acciones, se muestran al usuario,
 * y solo se ejecutan tras confirmación.
 */

type AiActionType =
  | 'update_scene'           // Modificar campos de una escena
  | 'delete_scene'           // Eliminar escena
  | 'create_scene'           // Crear escena nueva
  | 'reorder_scenes'         // Cambiar el orden
  | 'update_character'       // Modificar personaje
  | 'remove_character_from_scene'  // Quitar personaje de escena
  | 'add_character_to_scene'       // Añadir personaje a escena
  | 'update_prompt'          // Regenerar prompt de una escena
  | 'update_timeline'        // Cambiar timing
  | 'batch_update'           // Actualización masiva
  | 'merge_scenes'           // Fusionar dos escenas en una
  | 'split_scene'            // Dividir una escena en dos
  | 'explain'                // Solo explicar, sin cambios

interface AiAction {
  id: string;
  type: AiActionType;
  target: {
    sceneId?: string;
    sceneNumber?: string;
    characterId?: string;
    characterName?: string;
  };
  description_es: string;     // Lo que el usuario ve: "Quitar a José de la escena E7D (Lavado de cabeza)"
  changes: {
    field: string;            // 'prompt_image' | 'prompt_video' | 'description' | 'character_ids' | etc
    oldValue: any;            // Valor actual
    newValue: any;            // Valor nuevo propuesto
  }[];
  reason: string;             // Por qué se hace este cambio
  requiresNewPrompt: boolean; // Si hay que regenerar los prompts después
  priority: number;           // Orden de ejecución
}

interface AiActionPlan {
  summary_es: string;         // "Voy a modificar 6 escenas donde José hacía tareas manuales"
  actions: AiAction[];
  total_scenes_affected: number;
  estimated_time: string;     // "~30 segundos"
  warnings: string[];         // "La escena E7D se quedará sin personaje principal"
}
```

### 1.3 Flujo de Conversación con Acciones

```
USUARIO: "José es el jefe, no lava cabezas. Quítalo de esas escenas"

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Entendido. He revisado las 28 escenas y José aparece en 10.  │
│                                                                  │
│ En 3 de ellas, José hace tareas manuales que no corresponden     │
│ a un jefe:                                                       │
│                                                                  │
│ ┌─ PLAN DE CAMBIOS ──────────────────────────────────────────┐   │
│ │                                                            │   │
│ │ ❌ Escena E6 — "Equipo en plena acción"                    │   │
│ │    José usa plancha de pelo en el centro                   │   │
│ │    → CAMBIO: José supervisa de pie al fondo con los brazos │   │
│ │    cruzados, asintiendo con orgullo. Ya no toca herramientas│  │
│ │    → Se regenerará prompt imagen + vídeo                   │   │
│ │                                                            │   │
│ │ ❌ Escena E7D — "José y el lavado de cabeza"               │   │
│ │    José masajea el cuero cabelludo de la clienta           │   │
│ │    → CAMBIO: Sustituir a José por Conchi. Conchi hace el   │   │
│ │    lavado con su secador rose gold al lado. José no aparece│   │
│ │    → Se regenerará prompt imagen + vídeo                   │   │
│ │                                                            │   │
│ │ ❌ Escena V6 — "Vídeo del equipo trabajando"               │   │
│ │    José pasa plancha de pelo en el espejo central          │   │
│ │    → CAMBIO: José entra en plano, observa el trabajo del   │   │
│ │    equipo, da una palmada en el hombro a Raúl y sale       │   │
│ │    → Se regenerará prompt vídeo                            │   │
│ │                                                            │   │
│ │ ✅ Escena E3 — "Presentación del equipo" → OK, José solo   │   │
│ │    posa con el equipo. No cambia.                          │   │
│ │ ✅ Escena E5 — "Celebración" → OK, José aplaude.           │   │
│ │    No cambia.                                              │   │
│ │ ✅ Escena E8 — "José habla a cámara" → OK, es su escena    │   │
│ │    principal. No cambia.                                   │   │
│ │ ✅ Escena E9 — "Cierre épico" → OK, José saluda. No cambia.│   │
│ │ ✅ Escena N5 — "José asesorando" → OK, asesora al cliente. │   │
│ │    Esto sí es tarea de jefe. No cambia.                    │   │
│ │ ✅ Escena N8 — "José cortando pelo femenino"               │   │
│ │    ⚠️ ¿José corta pelo o no? Si es el jefe, ¿esto lo hace? │   │
│ │    → PREGUNTA: ¿Quieres que quite a José de esta también?  │   │
│ │                                                            │   │
│ │ RESUMEN: 3 escenas modificadas, 1 pregunta pendiente       │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [✅ Aplicar los 3 cambios]  [✏️ Modificar plan]  [❌ Cancelar]   │
│                                                                  │
│ Sobre la escena N8 (José cortando pelo), ¿lo quito también      │
│ o José sí corta pelo como maestro?                               │
└──────────────────────────────────────────────────────────────────┘

USUARIO: "Sí, José corta pelo. Es maestro peluquero. Solo no hace 
          tareas de lavado, tintes ni permanentes"

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Perfecto. Entonces la regla queda así:                        │
│                                                                  │
│ JOSÉ — Director y maestro peluquero:                             │
│ ✅ Cortar pelo (hombre y mujer) — es maestro                     │
│ ✅ Asesorar clientes sobre prótesis                               │
│ ✅ Hablar a cámara como portavoz                                  │
│ ✅ Supervisar al equipo                                           │
│ ❌ Lavar cabezas — tarea de asistente                             │
│ ❌ Aplicar tintes — tarea de Conchi                                │
│ ❌ Hacer permanentes — tarea de Nerea                              │
│ ❌ Perfilar barbas — tarea de Raúl                                 │
│                                                                  │
│ ¿Guardo esta regla para el personaje? Así la usaré en futuras   │
│ generaciones de escenas.                                         │
│                                                                  │
│ [✅ Sí, guardar regla]  [✏️ Ajustar]                              │
└──────────────────────────────────────────────────────────────────┘

(Tras confirmar, Kiyoko ejecuta los 3 cambios uno a uno,
regenera los prompts afectados, y muestra el progreso)

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 ✅ Listo. He actualizado 3 escenas:                           │
│                                                                  │
│ ✅ E6 — José ahora supervisa en vez de planchar               ← click para ver │
│ ✅ E7D — Conchi hace el lavado (José eliminado)               ← click para ver │
│ ✅ V6 — José observa y felicita al equipo                     ← click para ver │
│                                                                  │
│ He regenerado 5 prompts (3 de imagen + 2 de vídeo).             │
│ La regla de José se ha guardado en su ficha de personaje.       │
│                                                                  │
│ ¿Quieres revisar los nuevos prompts o seguimos con otra cosa?   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.4 Tipos de Comandos que el Chat Debe Entender

El system prompt del chat debe estar entrenado para detectar estas categorías de instrucción:

```
CATEGORÍA 1: CAMBIOS DE PERSONAJE
─────────────────────────────────
"José no hace X" → Buscar escenas donde José hace X, proponer cambios
"Quita a Nerea de las escenas de barbería" → Buscar y proponer
"Conchi debería aparecer más" → Analizar presencia, sugerir escenas
"Añade a Raúl en la escena 5" → Proponer cómo encajarlo

CATEGORÍA 2: GESTIÓN DE ESCENAS
────────────────────────────────
"Hay muchas escenas, reduce a 15" → Proponer fusiones y eliminaciones
"Necesito más escenas de prótesis" → Generar nuevas
"La escena 4 y la 5 son muy parecidas, fúsionalas" → Merge propuesto
"Pon una transición entre la 3 y la 4" → Crear plano detalle
"Quiero una escena donde se vea el exterior al atardecer" → Crear nueva

CATEGORÍA 3: DURACIÓN Y TIMING
───────────────────────────────
"La escena 4 debería durar 8 segundos" → Actualizar duración
"El vídeo total debe ser de 60 segundos" → Recalcular duraciones
"Las escenas de servicio van muy rápido, dales más tiempo" → Batch update
"Ordena las escenas cronológicamente" → Reordenar por arco narrativo

CATEGORÍA 4: PROMPTS
────────────────────
"Genera los prompts que faltan" → Detectar escenas sin prompt, generar
"Mejora el prompt de la escena 7" → Regenerar prompt
"Todos los prompts deben incluir 'golden hour lighting'" → Batch update
"Los prompts de vídeo deben empezar con SILENT SCENE" → Batch update

CATEGORÍA 5: EXPLICACIONES
──────────────────────────
"Explícame el vídeo completo" → Narrar cada escena en español
"¿Qué pasa en la escena 4A?" → Describir la escena en detalle
"¿En qué escenas aparece Nerea?" → Listar con descripción
"¿Cuánto dura el bloque de prótesis?" → Calcular y explicar
"Dame un resumen de 3 líneas del vídeo" → Sinopsis

CATEGORÍA 6: ORDENACIÓN
────────────────────────
"Ordena las escenas para que el vídeo tenga sentido" → Proponer nuevo orden
"Mueve la escena 7 después de la 3" → Reordenar
"El gancho debería ser más corto" → Proponer reordenación del arco
"Pon las escenas de prótesis juntas" → Agrupar por temática
```

---

## 2. DESCRIPCIÓN EN ESPAÑOL + PROMPTS EN INGLÉS

### 2.1 Cada Escena Tiene Dos Capas de Texto

Actualmente las escenas tienen `description` (español) y `prompt_image` / `prompt_video` (inglés). Pero la descripción en español es a menudo genérica o está vacía. Debe ser **obligatoria y rica**.

**Regla**: Cada vez que la IA genera o modifica una escena, SIEMPRE genera:

1. **`description`** (español) — Lo que el director le diría al equipo: "En esta escena vemos a Nerea de cerca aplicando pegamento en el cuero cabelludo del cliente. La cámara está a la altura de sus manos. Se nota la precisión profesional. El cliente tiene expresión de esperanza. Dura 6 segundos."

2. **`prompt_image`** (inglés) — El prompt técnico para Grok/DALL-E/Midjourney.

3. **`prompt_video`** (inglés) — El prompt técnico para el generador de vídeo.

### 2.2 Cómo se Muestra en la Scene Card

```
┌─ ESCENA E4A ── Mejorada 🟠 ── Pegamento ── 6s ────────────────┐
│                                                                 │
│  🖼️ [Imagen generada]                                          │
│                                                                 │
│  📝 QUÉ PASA EN ESTA ESCENA:                                   │
│  ───────────────────────────                                    │
│  Nerea aplica pegamento especial en el cuero cabelludo del      │
│  cliente con precisión milimétrica. Con la mano izquierda       │
│  sujeta la prótesis doblada hacia atrás, dejando ver la base    │
│  de encaje. Con la derecha aplica una línea fina de adhesivo    │
│  desde la sien hasta la sien. El cliente está inmóvil,          │
│  esperanzado. La cámara está muy cerca de las manos.            │
│  Solo se oye el silencio del salón.                             │
│                                                                 │
│  👥 Personajes: [NE Nerea] [Cliente]                            │
│  🏠 Fondo: REF-PELUCAS (Sala de prótesis)                      │
│  📹 Close medium · Static · Warm professional light · Emotional │
│  🔊 Silente — Solo ambiente del salón                           │
│  ⏱️ 6 segundos                                                  │
│                                                                 │
│  ── PROMPT DE IMAGEN (EN) ──────────────────── [📋 Copiar] ──  │
│  ```                                                            │
│  Pixar Studios 3D animated render, interior of Domenech         │
│  hair salon prosthesis consultation area. Close and intimate    │
│  medium shot. A kind-faced woman with dark hair in a neat       │
│  low bun, beige textured overshirt jacket...                    │
│  ```                                                            │
│                                                                 │
│  ── PROMPT DE VÍDEO (EN) ───────────────────── [📋 Copiar] ──  │
│  ```                                                            │
│  SILENT SCENE. NO DIALOGUE. NO LIP MOVEMENT AT ANY POINT.      │
│  Starting with Nerea standing before the bald man...            │
│  ```                                                            │
│                                                                 │
│  [✨ Mejorar con IA] [✏️ Editar] [🗑️ Eliminar]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cambio visual**: La sección "QUÉ PASA EN ESTA ESCENA" es lo primero que se lee, ANTES de los prompts. Está escrita como si fuera un guión técnico en español, fácil de entender para alguien que no sabe inglés.

### 2.3 System Prompt Actualizado para Generación de Escenas

```typescript
// Añadir a src/lib/ai/prompts/system-scene-generator.ts

const SCENE_GENERATION_RULES = `
REGLA CRÍTICA DE IDIOMAS:
- El campo "description" SIEMPRE en ESPAÑOL
  → Escribe como un director describiendo la escena a su equipo
  → Incluye: qué se ve, qué hacen los personajes, qué siente el espectador
  → Incluye la duración y el tipo de cámara en lenguaje natural
  → Ejemplo: "Vemos a Nerea de cerca. Sus manos aplican pegamento con 
    precisión quirúrgica sobre el cuero cabelludo del cliente. La prótesis 
    está doblada hacia atrás. El cliente no se mueve. Hay silencio total. 
    La cámara está a la altura de sus manos. 6 segundos."

- Los campos "prompt_image" y "prompt_video" SIEMPRE en INGLÉS
  → Formato técnico para generadores de IA
  → Empiezan con el estilo: "Pixar Studios 3D animated render"
  → Incluyen composición de cámara, iluminación, posición de personajes
  → Los de vídeo empiezan con regla de audio según el tipo de escena

REGLA DE DURACIÓN:
- Cada escena DEBE tener una duración explícita en segundos
- La duración debe ser coherente con lo que pasa:
  → Logo/título: 3-5 segundos
  → Establecimiento/exterior: 4-6 segundos
  → Presentación grupo: 6-8 segundos
  → Acción simple (corte, peinado): 4-6 segundos
  → Acción compleja (prótesis, transformación): 8-12 segundos
  → Momento emotivo (POV espejo, celebración): 5-8 segundos
  → CTA/cierre: 5-8 segundos
  → Plano detalle/transición: 2-4 segundos
`;
```

---

## 3. GESTIÓN INTELIGENTE DE ESCENAS DESDE EL CHAT

### 3.1 Reducir Escenas

Cuando el usuario dice "hay muchas escenas, reduce a 15":

```
KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Ahora tienes 28 escenas con una duración total de ~85s.      │
│ Para reducir a 15 escenas necesito eliminar 13.                 │
│                                                                  │
│ Mi propuesta es mantener las escenas ESENCIALES y fusionar       │
│ o eliminar las redundantes:                                      │
│                                                                  │
│ ── ESCENAS QUE SE MANTIENEN (15) ────────────────────────────── │
│                                                                  │
│  1. N1 — Cold open tijeras (3s) ← GANCHO                       │
│  2. E1 — Logo reveal (5s)                                       │
│  3. E2 — Exterior establecimiento (5s)                          │
│  4. E3 — Equipo completo (6s)                                   │
│  5. E6 — Equipo trabajando [FUSIÓN de E6+E7+E7B] (6s)          │
│  6. N8 — José corte femenino (4s)                               │
│  7. N9 — Raúl close-up tijeras (3s)                             │
│  8. R4 — Título "¿Pérdida de cabello?" (3s)                    │
│  9. N6 — Beauty shot prótesis (4s)                              │
│ 10. E4A+4B — Prótesis masculina [FUSIÓN] (8s)                  │
│ 11. N7 — POV espejo cliente (5s)                                │
│ 12. N4 — Prótesis femenina Conchi (5s)                          │
│ 13. E5 — Celebración equipo (6s)                                │
│ 14. E8 — José habla a cámara (5s)                               │
│ 15. E9 — Cierre épico todos (7s)                                │
│                                                                  │
│ DURACIÓN TOTAL: ~73 segundos ✅                                  │
│                                                                  │
│ ── ESCENAS QUE SE ELIMINAN (13) ─────────────────────────────── │
│                                                                  │
│ ❌ E7 (Raúl barba) — cubierto por E6 fusionada                  │
│ ❌ E7B (Conchi tinte) — cubierto por E6 fusionada               │
│ ❌ E7C (Nerea permanente) — cubierto por E6 fusionada           │
│ ❌ E7D (José lavado) — eliminada por regla de personaje         │
│ ❌ N2 (Ángulo inverso) — transición no esencial                 │
│ ❌ N3 (Cliente saliendo) — no esencial                          │
│ ❌ N5 (José asesorando) — ya se muestra en E4A                  │
│ ❌ N10 (Ángulo aéreo) — no esencial                             │
│ ❌ N11 (POV espejo corte) — redundante con N7                   │
│ ❌ N12 (Raúl abre salón) — no esencial                          │
│ ❌ R1 (Paneo estilismo vacío) — no esencial                     │
│ ❌ R2 (Close-ups pelucas) — cubierto por N6                     │
│ ❌ R3 (Entrada al salón) — no esencial                          │
│                                                                  │
│ ── FUSIONES ─────────────────────────────────────────────────── │
│                                                                  │
│ 🔀 E6+E7+E7B → Nueva "Montaje servicios" (6s)                  │
│    Corte rápido: Conchi tinte → Raúl barba → Nerea permanente  │
│    (José supervisa al fondo)                                     │
│                                                                  │
│ 🔀 E4A+E4B → "Prótesis completa" (8s)                           │
│    Pegamento + colocación en una sola escena más larga          │
│                                                                  │
│ [✅ Aplicar este plan]  [✏️ Ajustar]  [❌ Cancelar]              │
│                                                                  │
│ ¿Quieres cambiar algo antes de que lo aplique?                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Explicar el Vídeo Completo

Cuando el usuario dice "explícame el vídeo completo":

```
KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Aquí tienes el vídeo completo explicado escena a escena:     │
│                                                                  │
│ 🔴 GANCHO (0:00 — 0:08)                                         │
│ ─────────────────────────                                        │
│ El vídeo arranca en NEGRO. Se oye un único sonido: unas tijeras │
│ cortando. La cámara revela unas manos expertas sujetando las    │
│ tijeras contra un fondo borroso. 3 segundos de misterio puro.   │
│ Después, un mechón dorado vuela por la pantalla y forma la      │
│ palabra "DOMENECH". Entra la música. 5 segundos más.            │
│                                                                  │
│ 🟠 PRESENTACIÓN (0:08 — 0:20)                                   │
│ ──────────────────────────────                                   │
│ La cámara está a ras de suelo mirando hacia arriba. Vemos la    │
│ fachada de Domenech bañada en luz dorada de atardecer. La       │
│ cámara sube lentamente. 5 segundos. Corte: los 4 miembros del  │
│ equipo posan juntos frente a los espejos redondos. Cada uno     │
│ tiene su herramienta: Conchi el secador, Raúl las tijeras,      │
│ Nerea el peine. José va delante, con las manos vacías: el jefe  │
│ no necesita herramientas. 7 segundos.                           │
│                                                                  │
│ 🟠 SERVICIOS (0:20 — 0:33)                                      │
│ ───────────────────────────                                      │
│ Montaje rápido: Conchi aplica tinte con brocha, Raúl perfila    │
│ una barba con maquinilla, Nerea enrolla rulos de permanente.    │
│ José supervisa al fondo asintiendo. 6 segundos de ritmo alto.   │
│ Después, José de cerca cortando el pelo a una mujer con tijeras │
│ de maestro. El pelo cae en cámara lenta. 4 segundos. Cierra el │
│ bloque con un close-up de las tijeras de Raúl cortando: metal   │
│ brillante, precisión hipnótica. 3 segundos.                     │
│                                                                  │
│ (continúa...)                                                    │
│                                                                  │
│ [📄 Ver completo]  [📋 Copiar como texto]  [📤 Exportar a MD]   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Ordenar y Asignar Duraciones

Cuando el usuario dice "ordena las escenas y pon los tiempos":

```
KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 He analizado las 15 escenas y propongo este orden con        │
│ duraciones optimizadas para un vídeo de 73 segundos:            │
│                                                                  │
│ #  │ Escena │ Título                      │  Antes │ Ahora │    │
│ ───┼────────┼─────────────────────────────┼────────┼───────┤    │
│  1 │ N1     │ Cold open tijeras           │   3s   │  3s   │    │
│  2 │ E1     │ Logo reveal                 │   5s   │  5s   │    │
│  3 │ E2     │ Exterior establecimiento    │   5s   │  4s ⬇│    │
│  4 │ E3     │ Equipo completo             │   8s   │  6s ⬇│    │
│  5 │ E6     │ Montaje servicios           │   —    │  6s 🆕│    │
│  6 │ N8     │ José corte femenino         │   6s   │  4s ⬇│    │
│  7 │ N9     │ Raúl close-up tijeras       │   4s   │  3s ⬇│    │
│  8 │ R4     │ "¿Pérdida de cabello?"      │   3s   │  3s   │    │
│  9 │ N6     │ Beauty shot prótesis        │   4s   │  4s   │    │
│ 10 │ E4     │ Prótesis masculina completa │   —    │  8s 🆕│    │
│ 11 │ N7     │ POV espejo cliente          │   6s   │  5s ⬇│    │
│ 12 │ N4     │ Prótesis femenina           │   8s   │  5s ⬇│    │
│ 13 │ E5     │ Celebración equipo          │   8s   │  6s ⬇│    │
│ 14 │ E8     │ José habla a cámara         │   6s   │  5s ⬇│    │
│ 15 │ E9     │ Cierre épico               │  10s   │  6s ⬇│    │
│ ───┼────────┼─────────────────────────────┼────────┼───────┤    │
│    │        │ TOTAL                        │  ~85s  │  73s  │    │
│                                                                  │
│ CAMBIOS:                                                         │
│ ⬇ = Duración reducida (he comprimido escenas menos importantes)  │
│ 🆕 = Escena fusionada (nueva duración)                           │
│                                                                  │
│ RITMO:                                                           │
│ • Gancho: 8s (11%) — impacto rápido ✅                           │
│ • Presentación: 10s (14%) — eficiente ✅                         │
│ • Servicios: 13s (18%) — montaje ágil ✅                         │
│ • Prótesis: 22s (30%) — el corazón del vídeo ✅                  │
│ • Cierre: 17s (23%) — emotivo y memorable ✅                     │
│ • Tiempo restante para transiciones: 3s                          │
│                                                                  │
│ [✅ Aplicar orden y duraciones]  [✏️ Ajustar]                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. SYSTEM PROMPT DEL CHAT MEJORADO

```typescript
// src/lib/ai/prompts/system-chat-assistant.ts

export const SYSTEM_CHAT_ASSISTANT = `
Eres KIYOKO, el director creativo de IA de un estudio de storyboard profesional.

CONTEXTO: Tienes acceso completo al proyecto del usuario incluyendo todas las 
escenas (con prompts, personajes, fondos, duraciones, orden), personajes 
(con fichas, reglas, herramientas), fondos (con descripciones), arco narrativo 
y timeline.

TU ROL:
Eres como un director de cine experimentado trabajando codo a codo con el 
productor (el usuario). Entiendes de narrativa, composición visual, ritmo de 
montaje, y producción publicitaria. El usuario te da instrucciones y tú 
ejecutas los cambios de forma inteligente.

REGLAS DE COMPORTAMIENTO:

1. SIEMPRE MUESTRA UN PLAN ANTES DE ACTUAR
   - Cuando el usuario pide un cambio, NUNCA lo hagas directamente
   - Primero explica QUÉ vas a cambiar, POR QUÉ, y muestra las escenas afectadas
   - Pide confirmación antes de ejecutar
   - Si hay ambigüedad, PREGUNTA antes de proponer

2. RESPONDE SIEMPRE EN ESPAÑOL
   - Toda la conversación es en español
   - Las descripciones de escenas son en español
   - Solo los prompts de imagen y vídeo van en inglés

3. CUANDO MODIFIQUES ESCENAS:
   - Muestra la escena afectada con su número (E4A, N7, etc.)
   - Explica el cambio concreto: "Antes: José lava. Ahora: Conchi lava"
   - Indica si hay que regenerar prompts
   - Si quitas un personaje, di quién lo reemplaza (o si la escena queda vacía)

4. CUANDO GENERES PROMPTS:
   - prompt_image y prompt_video → SIEMPRE EN INGLÉS
   - description → SIEMPRE EN ESPAÑOL, como un guión técnico
   - Incluye SIEMPRE la duración recomendada en segundos
   - Los prompts de imagen empiezan con el estilo del proyecto
   - Los prompts de vídeo empiezan con la regla de audio

5. CUANDO ORDENES ESCENAS:
   - Muestra una tabla con: posición, número, título, duración antes/después
   - Calcula el total y muestra el desglose por bloques del arco
   - Si la duración total no cuadra con el objetivo, propón ajustes

6. REGLAS DE PERSONAJES:
   - Cada personaje tiene reglas sobre qué puede y qué no puede hacer
   - Consulta estas reglas antes de generar escenas
   - Si el usuario establece una nueva regla, guárdala en la ficha

7. DURACIONES:
   - Cada escena DEBE tener duración explícita
   - Logo/título: 3-5s | Exterior: 4-6s | Grupo: 6-8s
   - Acción simple: 4-6s | Acción compleja: 8-12s
   - Momento emotivo: 5-8s | CTA/cierre: 5-8s | Detalle: 2-4s

8. FORMATO DE RESPUESTA:
   - Usa bloques visuales claros con encabezados
   - Para planes de cambios, usa ✅ (se mantiene) y ❌ (se modifica/elimina)
   - Para tablas de escenas, usa formato de tabla
   - Los bloques de plan tienen botones: [Aplicar] [Ajustar] [Cancelar]
   - Cuando muestres un resumen de escena, incluye el número, título y duración

FORMATO JSON PARA ACCIONES:
Cuando propongas cambios, incluye al final un bloque JSON oculto con las 
acciones estructuradas para que el frontend las pueda ejecutar:

\`\`\`json:actions
{
  "type": "action_plan",
  "actions": [
    {
      "type": "update_scene",
      "sceneNumber": "E6",
      "changes": {
        "description": "nuevo texto en español...",
        "prompt_image": "new english prompt...",
        "prompt_video": "new english video prompt...",
        "character_ids": ["id-conchi", "id-raul", "id-nerea"],
        "duration_seconds": 6
      }
    }
  ]
}
\`\`\`
`;
```

---

## 5. IMPLEMENTACIÓN TÉCNICA

### 5.1 Nuevos Componentes Necesarios

```
src/components/
├── ai/
│   ├── ChatPanel.tsx               # Panel lateral del chat (ya existe, MEJORAR)
│   ├── ChatActionPlan.tsx          # ★ NUEVO: Renderiza el plan de acciones
│   ├── ChatActionItem.tsx          # ★ NUEVO: Cada acción individual en el plan
│   ├── ChatScenePreview.tsx        # ★ NUEVO: Preview de escena afectada
│   ├── ChatConfirmBar.tsx          # ★ NUEVO: Barra [Aplicar] [Ajustar] [Cancelar]
│   ├── ChatSceneTable.tsx          # ★ NUEVO: Tabla de escenas ordenadas
│   ├── ChatNarrativeView.tsx       # ★ NUEVO: Vista narrativa del vídeo completo
│   └── ChatProgressIndicator.tsx   # ★ NUEVO: Progreso al aplicar cambios
```

### 5.2 Nueva API Route para Ejecutar Acciones

```typescript
// src/app/api/ai/execute-actions/route.ts

// POST: Recibe un action_plan y lo ejecuta contra Supabase
// 1. Valida que las acciones son coherentes
// 2. Ejecuta en transacción (todo o nada)
// 3. Regenera prompts de escenas afectadas si es necesario
// 4. Recalcula stats del proyecto
// 5. Devuelve resumen de lo ejecutado

interface ExecuteActionsRequest {
  projectId: string;
  actions: AiAction[];
  regeneratePrompts: boolean; // Si debe regenerar prompts afectados
}

interface ExecuteActionsResponse {
  success: boolean;
  executed: number;
  failed: number;
  regeneratedPrompts: number;
  updatedScenes: string[];    // Scene numbers actualizados
  newDuration: number;        // Nueva duración total
  errors: string[];
}
```

### 5.3 Parser de Acciones desde la Respuesta de IA

```typescript
// src/lib/ai/action-parser.ts

/**
 * La IA devuelve texto conversacional + un bloque JSON oculto.
 * Este parser extrae las acciones del bloque JSON.
 */

export function parseAiResponse(content: string): {
  message: string;              // Texto para mostrar al usuario
  actionPlan: AiActionPlan | null;  // Acciones para ejecutar
} {
  const jsonMatch = content.match(/```json:actions\n([\s\S]*?)\n```/);
  
  if (jsonMatch) {
    const message = content.replace(/```json:actions[\s\S]*?```/, '').trim();
    const actionPlan = JSON.parse(jsonMatch[1]) as AiActionPlan;
    return { message, actionPlan };
  }
  
  return { message: content, actionPlan: null };
}
```

### 5.4 Reglas de Personaje (nuevo campo en DB)

Añadir a la tabla `characters`:

```sql
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS
  role_rules JSONB DEFAULT '[]';
-- Formato: [
--   {"can": true, "action": "Cortar pelo (hombre y mujer)", "note": "Es maestro peluquero"},
--   {"can": false, "action": "Lavar cabezas", "note": "Tarea de asistente"},
--   {"can": false, "action": "Aplicar tintes", "note": "Tarea de Conchi"}
-- ]

ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS
  ai_notes TEXT DEFAULT '';
-- Notas libres que la IA usa como contexto al generar escenas
-- Ejemplo: "José es el jefe. Nunca toca herramientas de lavado ni tinte.
--           Siempre va con blazer azul. Puede cortar pelo como maestro."
```

### 5.5 Contexto Completo del Proyecto para el Chat

Cada vez que el chat envía un mensaje, el backend debe construir un contexto completo:

```typescript
// src/lib/ai/build-project-context.ts

export async function buildProjectContext(projectId: string): Promise<string> {
  // Cargar todo el proyecto de Supabase
  const [project, scenes, characters, backgrounds, arcs, timeline] = await Promise.all([
    getProject(projectId),
    getScenes(projectId),
    getCharacters(projectId),
    getBackgrounds(projectId),
    getNarrativeArcs(projectId),
    getTimeline(projectId),
  ]);

  return `
PROYECTO: ${project.title}
CLIENTE: ${project.client_name}
ESTILO: ${project.style}
DURACIÓN OBJETIVO: ${project.target_duration_seconds}s
PLATAFORMA: ${project.target_platform}

PERSONAJES (${characters.length}):
${characters.map(c => `
- ${c.name} (${c.role})
  Ropa: ${c.signature_clothing}
  Herramientas: ${c.signature_tools?.join(', ')}
  Reglas: ${JSON.stringify(c.role_rules)}
  Notas IA: ${c.ai_notes}
  Prompt snippet: ${c.prompt_snippet}
  Aparece en: ${c.appears_in_scenes?.join(', ')}
`).join('')}

FONDOS (${backgrounds.length}):
${backgrounds.map(b => `
- ${b.code}: ${b.name} (${b.location_type}, ${b.time_of_day})
  Prompt snippet: ${b.prompt_snippet}
`).join('')}

ESCENAS (${scenes.length}) — Orden actual:
${scenes.sort((a, b) => a.sort_order - b.sort_order).map((s, i) => `
#${i + 1} | ${s.scene_number} | "${s.title}" | ${s.duration_seconds}s | ${s.arc_phase}
  Tipo: ${s.scene_type} | Estado: ${s.status}
  Descripción: ${s.description}
  Personajes: ${s.character_ids?.length || 0}
  Fondo: ${s.background_id || 'ninguno'}
  Tiene prompt imagen: ${s.prompt_image ? 'SÍ' : 'NO'}
  Tiene prompt vídeo: ${s.prompt_video ? 'SÍ' : 'NO'}
`).join('')}

ARCO NARRATIVO:
${arcs.map(a => `${a.phase}: ${a.title} (${a.start_second}s-${a.end_second}s)`).join('\n')}

DURACIÓN ACTUAL: ${scenes.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)}s
  `.trim();
}
```

---

## 6. DURACIONES — SISTEMA COMPLETO

### 6.1 Cada Escena DEBE Tener Duración

En el formulario de creación/edición de escena, la duración es **obligatoria**. Se muestra como un campo destacado con presets:

```
⏱️ DURACIÓN DE LA ESCENA
┌─────────────────────────────────────────────────────────────────┐
│  Presets: [2s] [3s] [4s] [5s] [6s] [8s] [10s] [12s] [Custom]  │
│                                                                 │
│  ┌───────────────┐                                              │
│  │    ◀ 6s ▶     │  ← input numérico con flechas               │
│  └───────────────┘                                              │
│                                                                 │
│  💡 Recomendado para este tipo de escena: 4-6s                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Indicador de Duración Total en el Storyboard

En el header del storyboard, siempre visible:

```
┌────────────────────────────────────────────────────────────────┐
│  28 escenas  │  ⏱️ 73s / 75s objetivo  │  4 personajes │ 3 fondos│
│              │  ████████████████████░░  │               │        │
│              │  97% del target ✅       │               │        │
└────────────────────────────────────────────────────────────────┘
```

Si la duración total supera el objetivo → warning ámbar
Si la duración total es menor al 80% del objetivo → warning azul

### 6.3 La IA Respeta y Propone Duraciones

Cada vez que la IA genera, fusiona, divide o elimina escenas, recalcula la duración total y muestra el impacto:

```
Duración antes: 85s (10s sobre el objetivo de 75s)
Duración después: 73s (2s bajo el objetivo) ✅
```

---

## 7. DECISIONES CONFIRMADAS

| Pregunta | Decisión |
|----------|----------|
| Generar imágenes | **AMBOS**: Generar directo con Gemini/DALL-E + copiar prompt. La IA pregunta antes de generar. |
| Crear personajes desde chat | **SÍ**: Incluso subiendo foto → la IA genera ficha + prompt de character sheet |
| Historial con deshacer | **SÍ**: Cada cambio se guarda, se puede revertir |
| Timeline automático | **SÍ**: Al reordenar/cambiar escenas, el timeline se regenera solo |
| Notificaciones push | **SÍ**: Cuando la IA termina operaciones largas |
| Colaboración multiusuario | **NO por ahora**: Se implementará más adelante |
| Comandos globales en chat | **SÍ**: "Que no hablen en ninguna escena" → actualiza TODAS |

---

## 8. SISTEMA DE IMÁGENES — GENERAR + SUSTITUIR + REGENERAR

### 8.1 Flujo Completo de Imagen por Escena

Cada escena tiene tres estados de imagen:

```
ESTADO 1: SIN IMAGEN
┌──────────────────────────────────────────────┐
│  🖼️  No hay imagen generada                  │
│                                              │
│  [🤖 Generar imagen con IA]                  │
│  [📋 Copiar prompt para Grok/DALL-E]         │
│  [📤 Subir imagen manualmente]               │
└──────────────────────────────────────────────┘

ESTADO 2: CON IMAGEN
┌──────────────────────────────────────────────┐
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │         🖼️ IMAGEN GENERADA              │  │
│  │         (click para ampliar)           │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [🔄 Regenerar con IA]  ← usa el prompt      │
│  [📤 Sustituir imagen]  ← subir otra          │
│  [📋 Copiar prompt]                           │
│  [🗑️ Eliminar imagen]                         │
│                                              │
│  Generada con: Gemini · Hace 2 horas         │
│  Versiones anteriores: [v1] [v2] [v3 actual] │
└──────────────────────────────────────────────┘
```

### 8.2 Flujo de Generación desde el Chat

Cuando la IA genera o actualiza un prompt de imagen, SIEMPRE pregunta:

```
KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 He actualizado el prompt de imagen de la escena E6.           │
│                                                                  │
│ Nuevo prompt:                                                    │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ Pixar Studios 3D animated render, interior of Domenech...  │   │
│ │ José stands in the background with arms crossed, watching  │   │
│ │ his team work with a proud approving nod...                │   │
│ └─────────────────────────────────────────────── [📋 Copiar]┘   │
│                                                                  │
│ ¿Quieres que genere la imagen ahora con este prompt?            │
│                                                                  │
│ [🖼️ Sí, generar imagen]  [📋 Solo copiar prompt]  [✏️ Editar]   │
└──────────────────────────────────────────────────────────────────┘
```

Si el usuario dice "Sí, generar":
```
KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Generando imagen para E6 con Gemini...                       │
│                                                                  │
│ ⏳ ████████████░░░░░░░░  60%                                     │
│                                                                  │
│ (30 segundos después)                                            │
│                                                                  │
│ 🤖 ✅ Imagen generada:                                           │
│                                                                  │
│ ┌────────────────────────────────────────┐                       │
│ │                                        │                       │
│ │         🖼️ [preview de la imagen]       │                       │
│ │                                        │                       │
│ └────────────────────────────────────────┘                       │
│                                                                  │
│ [✅ Aceptar y guardar en la escena]                               │
│ [🔄 No me gusta, regenerar otra]                                  │
│ [📤 Prefiero subir una mía]                                       │
│ [❌ Descartar]                                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 Historial de Versiones de Imagen

Cada escena guarda todas las versiones de imagen generada:

```sql
-- Añadir a la tabla scenes o crear tabla nueva
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  image_versions JSONB DEFAULT '[]';
-- Formato: [
--   {
--     "version": 1,
--     "url": "https://...",
--     "thumbnail_url": "https://...",
--     "prompt_used": "Pixar Studios 3D...",
--     "provider": "gemini",
--     "generated_at": "2026-03-17T10:30:00Z",
--     "is_current": false
--   },
--   {
--     "version": 2,
--     "url": "https://...",
--     "is_current": true
--   }
-- ]
```

En la UI, debajo de la imagen actual:
```
Versiones: [v1 🖼️] [v2 🖼️] [v3 🖼️ ← actual]  [📤 Subida manual]
```
Click en cualquier versión → preview → [Restaurar esta versión]

---

## 9. CREAR PERSONAJES DESDE EL CHAT CON FOTO

### 9.1 Flujo: Subir Foto → Generar Ficha Completa

```
USUARIO: (sube una foto de una persona real o un character sheet)
         "Este es el nuevo personaje, se llama María, es la recepcionista"

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 He analizado la imagen. Voy a generar la ficha del personaje │
│ con el estilo del proyecto (Pixar 3D).                          │
│                                                                  │
│ ┌─ FICHA DE PERSONAJE ──────────────────────────────────────┐   │
│ │                                                            │   │
│ │  👤 MARÍA                                                  │   │
│ │  Rol: Recepcionista                                        │   │
│ │  Iniciales: MA                                             │   │
│ │                                                            │   │
│ │  Descripción visual:                                       │   │
│ │  Mujer joven de unos 25 años, pelo castaño largo liso      │   │
│ │  hasta los hombros, sonrisa amable, lleva una blusa blanca │   │
│ │  con cuello de lazo y pantalón negro. Pendientes pequeños  │   │
│ │  de perla. Maquillaje natural y sutil.                     │   │
│ │                                                            │   │
│ │  Prompt snippet (EN):                                      │   │
│ │  ┌──────────────────────────────────────────────────────┐  │   │
│ │  │ a young woman with long straight brown hair to her   │  │   │
│ │  │ shoulders, warm friendly smile, wearing a white bow  │  │   │
│ │  │ blouse and black pants, small pearl earrings,        │  │   │
│ │  │ natural subtle makeup                                │  │   │
│ │  └──────────────────────────────────────────────── [📋] ┘  │   │
│ │                                                            │   │
│ │  Herramientas: teléfono, agenda, tablet                    │   │
│ │  Ropa: blusa blanca de lazo + pantalón negro               │   │
│ │  Color: #EC4899 (rosa)                                     │   │
│ │                                                            │   │
│ │  Reglas:                                                   │   │
│ │  ✅ Recibir clientes, hablar por teléfono, gestionar citas │   │
│ │  ❌ No toca pelo, no usa herramientas de peluquería         │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ¿Quieres que genere un CHARACTER SHEET en estilo Pixar con      │
│ varias vistas (frente, perfil, espalda) de María?               │
│                                                                  │
│ [✅ Sí, generar character sheet]                                  │
│ [✅ Guardar personaje tal cual]                                   │
│ [✏️ Modificar ficha antes de guardar]                             │
└──────────────────────────────────────────────────────────────────┘
```

Si el usuario dice "Sí, generar character sheet":

```
KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Generando character sheet de María en estilo Pixar...        │
│                                                                  │
│ Prompt que voy a usar:                                           │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ Pixar Studios 3D character sheet, clean white background.  │   │
│ │ Multiple views of the same character: front view, 3/4      │   │
│ │ view, side profile, and back view. A young woman with      │   │
│ │ long straight brown hair to her shoulders, warm friendly   │   │
│ │ smile, wearing a white bow blouse and black pants, small   │   │
│ │ pearl earrings. Professional receptionist look. Consistent │   │
│ │ character design across all views. Clean turnaround sheet  │   │
│ │ layout. Pixar 3D animation style, soft studio lighting.    │   │
│ └────────────────────────────────────────────────── [📋 Copy]┘   │
│                                                                  │
│ [🖼️ Generar ahora]  [📋 Solo copiar prompt]                      │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 Endpoint para Análisis de Imagen de Personaje

```typescript
// src/app/api/ai/analyze-character-image/route.ts

// POST: Recibe imagen + nombre + rol
// 1. Envía la imagen a Gemini Vision (o GPT-4o Vision) para análisis
// 2. Extrae: descripción física, ropa, accesorios, pelo, complexión
// 3. Genera prompt_snippet en inglés
// 4. Genera prompt de character sheet en el estilo del proyecto
// 5. Devuelve ficha completa

interface AnalyzeCharacterRequest {
  imageBase64: string;
  name: string;
  role: string;
  projectStyle: string;  // 'pixar' | 'realistic' | etc
}

interface AnalyzeCharacterResponse {
  description: string;          // Español
  visual_description: string;   // Español detallado
  prompt_snippet: string;       // Inglés
  character_sheet_prompt: string; // Inglés, para generar turnaround
  signature_clothing: string;
  hair_description: string;
  accessories: string[];
  suggested_tools: string[];
  suggested_color: string;      // Hex color
  suggested_rules: {
    can: boolean;
    action: string;
    note: string;
  }[];
}
```

---

## 10. COMANDOS GLOBALES — ACTUALIZAR TODAS LAS ESCENAS

### 10.1 Regla Global de Audio

```
USUARIO: "Los personajes no hablan en ninguna escena"

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Entendido. Voy a hacer que TODAS las escenas sean silentes.  │
│                                                                  │
│ Esto afecta a 28 escenas:                                        │
│                                                                  │
│ CAMBIOS EN CADA PROMPT DE VÍDEO:                                 │
│ → Añadir al inicio: "SILENT SCENE. NO DIALOGUE. NO SPEAKING.    │
│   NO LIP MOVEMENT AT ANY POINT."                                │
│ → Eliminar cualquier referencia a diálogos o habla              │
│ → Ajustar las descripciones: gestos y expresiones en vez de     │
│   palabras                                                       │
│                                                                  │
│ ESCENAS QUE YA ERAN SILENTES: 22 de 28 ✅ (no cambian)         │
│ ESCENAS QUE NECESITAN CAMBIO: 6                                  │
│                                                                  │
│ ❌ E8 — "José habla a cámara"                                    │
│    Antes: José speaks to camera with warm gestures               │
│    Ahora: José communicates entirely through warm confident      │
│    gestures and facial expressions — no words, no lip movement   │
│                                                                  │
│ ❌ V8 — Vídeo de José hablando                                   │
│    (mismo cambio: gestos en vez de habla)                        │
│                                                                  │
│ ❌ E3 — Equipo presentándose                                     │
│    Antes: characters smile and wave                              │
│    Ahora: (sin cambios, ya era silente pero faltaba el tag)     │
│    → Añadir "SILENT SCENE..." al inicio del prompt vídeo        │
│                                                                  │
│ (+ 3 escenas más con ajustes menores)                            │
│                                                                  │
│ También voy a guardar esta regla como REGLA GLOBAL del proyecto: │
│ "Todas las escenas son silentes. Ningún personaje habla."       │
│ Así las futuras escenas que genere también serán silentes.       │
│                                                                  │
│ [✅ Aplicar a las 6 escenas + guardar regla]                      │
│ [✏️ Ver las 6 escenas en detalle antes]                           │
│ [❌ Cancelar]                                                      │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Otros Comandos Globales que Debe Entender

```
"Cambia el estilo de todas las escenas a anime"
→ Recorre TODOS los prompts, sustituye "Pixar Studios 3D" por 
  "anime style, cel-shaded", ajusta iluminación y composición

"Pon golden hour en todas las escenas de exterior"
→ Busca escenas con fondo exterior, actualiza lighting en prompt

"Todas las escenas deben durar máximo 5 segundos"
→ Recorta duraciones, advierte cuáles pierden contenido

"Genera los prompts de vídeo que faltan"
→ Detecta escenas sin prompt_video, genera uno por uno, pregunta

"Añade sparkles dorados a todas las escenas del clímax"
→ Busca escenas con arc_phase='peak', añade "golden sparkle 
  particles float around" a cada prompt
```

### 10.3 Reglas Globales del Proyecto (nuevo campo en DB)

```sql
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  global_rules JSONB DEFAULT '[]';
-- Formato: [
--   {
--     "rule": "Todas las escenas son silentes",
--     "affects": "prompt_video",
--     "prefix": "SILENT SCENE. NO DIALOGUE. NO SPEAKING. NO LIP MOVEMENT AT ANY POINT.",
--     "created_at": "2026-03-17",
--     "created_by": "chat"
--   },
--   {
--     "rule": "José no hace tareas manuales excepto cortar pelo",
--     "affects": "character_rules",
--     "character": "José",
--     "created_at": "2026-03-17",
--     "created_by": "chat"  
--   }
-- ]
```

La IA consulta `global_rules` ANTES de generar cualquier escena nueva para asegurar coherencia.

---

## 11. HISTORIAL DE VERSIONES CON DESHACER

### 11.1 Cada Cambio se Registra

```sql
CREATE TABLE IF NOT EXISTS public.change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Qué se cambió
  entity_type TEXT NOT NULL,     -- 'scene' | 'character' | 'background' | 'project'
  entity_id UUID NOT NULL,       -- ID de la escena/personaje/etc
  
  -- Quién y cuándo
  changed_by TEXT NOT NULL,      -- 'user' | 'ai_chat' | 'ai_wizard' | 'ai_improve'
  action TEXT NOT NULL,          -- 'create' | 'update' | 'delete' | 'reorder' | 'merge'
  description_es TEXT NOT NULL,  -- "Kiyoko eliminó a José de la escena E7D"
  
  -- Snapshot de los datos ANTES del cambio
  previous_data JSONB NOT NULL,  -- Copia completa del registro antes
  new_data JSONB NOT NULL,       -- Copia completa del registro después
  
  -- Para agrupar cambios de una misma acción
  batch_id UUID,                 -- Mismo batch_id = misma operación
  batch_description TEXT,        -- "Actualizar 6 escenas por regla de José"
  
  -- Estado
  reverted BOOLEAN DEFAULT FALSE,
  reverted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_project ON public.change_history(project_id);
CREATE INDEX idx_history_entity ON public.change_history(entity_type, entity_id);
CREATE INDEX idx_history_batch ON public.change_history(batch_id);

-- RLS
ALTER TABLE public.change_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own history" ON public.change_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = change_history.project_id AND owner_id = auth.uid())
);
CREATE POLICY "Admin full access history" ON public.change_history FOR ALL USING (is_admin());
```

### 11.2 UI del Historial

En el header del storyboard, botón de historial:

```
[↩️ Deshacer]  [🕐 Historial]

Click en Historial → panel lateral:
┌─ HISTORIAL DE CAMBIOS ──────────────────────────────────┐
│                                                          │
│ 📅 Hoy                                                   │
│                                                          │
│ 🤖 15:32 — Kiyoko actualizó 3 escenas                   │
│    "Quitar a José de tareas manuales"                    │
│    Escenas: E6, E7D, V6                                  │
│    [↩️ Deshacer todo]  [👁️ Ver cambios]                   │
│                                                          │
│ 🤖 15:30 — Kiyoko guardó regla de personaje             │
│    "José no hace lavados, tintes ni permanentes"         │
│    [↩️ Deshacer]                                          │
│                                                          │
│ 👤 14:15 — Editaste la escena E4A                        │
│    Cambió: prompt_image, duration_seconds                │
│    [↩️ Deshacer]  [👁️ Ver diff]                           │
│                                                          │
│ 🤖 14:00 — Kiyoko creó el proyecto                       │
│    28 escenas, 4 personajes, 3 fondos                    │
│    (no se puede deshacer)                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 11.3 Deshacer

El botón [↩️ Deshacer] del header siempre deshace la **última operación completa** (todo el batch). Muestra confirmación:

```
"¿Deshacer 'Quitar a José de tareas manuales'? 
Se restaurarán 3 escenas a su estado anterior."
[Deshacer]  [Cancelar]
```

---

## 12. NOTIFICACIONES PUSH

### 12.1 Cuándo Notificar

```typescript
// Notificar cuando:
// - La IA termina de regenerar prompts (si son más de 3)
// - La IA termina de generar una imagen
// - La IA termina un análisis completo
// - Se completa un batch de cambios

// Implementación: 
// 1. Notification API del navegador (pedir permiso al primer uso)
// 2. Toast de Sonner como fallback si no hay permiso
// 3. Sonido sutil opcional

if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('Kiyoko AI', {
    body: '✅ He terminado de actualizar 6 escenas',
    icon: '/logo.svg',
    tag: 'kiyoko-action-complete'
  });
}
```

---

## 13. TIMELINE AUTOMÁTICO

### 13.1 Regla: Cada Cambio de Escenas → Recalcular Timeline

Cada vez que se ejecuta una de estas acciones, el timeline se regenera automáticamente:

- Crear escena nueva
- Eliminar escena
- Cambiar duración de una escena
- Reordenar escenas
- Fusionar o dividir escenas
- Cambiar arc_phase de una escena

```typescript
// src/lib/ai/auto-regenerate-timeline.ts

export async function regenerateTimeline(projectId: string) {
  const scenes = await getScenesSorted(projectId);
  
  let currentTime = 0;
  const entries: TimelineEntry[] = [];
  
  for (const scene of scenes) {
    const duration = scene.duration_seconds || 5;
    entries.push({
      scene_id: scene.id,
      title: `${scene.scene_number} · ${scene.title}`,
      description: scene.description?.substring(0, 100) || '',
      start_time: formatTime(currentTime),
      end_time: formatTime(currentTime + duration),
      duration_seconds: duration,
      arc_phase: scene.arc_phase || 'build',
      phase_color: PHASE_COLORS[scene.arc_phase || 'build'],
      sort_order: entries.length,
    });
    currentTime += duration;
  }
  
  // Borrar timeline anterior y guardar el nuevo
  await supabase.from('timeline_entries')
    .delete().eq('project_id', projectId);
  await supabase.from('timeline_entries')
    .insert(entries.map(e => ({ ...e, project_id: projectId })));
  
  // Actualizar duración total del proyecto
  await supabase.from('projects')
    .update({ estimated_duration_seconds: currentTime })
    .eq('id', projectId);
}
```

El timeline se regenera en segundo plano después de cada operación. Si el usuario está en la pestaña Timeline, ve la actualización en tiempo real (Supabase Realtime).

---

## 14. PRIORIDAD DE IMPLEMENTACIÓN ACTUALIZADA

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Chat como panel lateral en /storyboard | Medio | 🔴 Crítico |
| 2 | Action System (plan → confirmar → ejecutar) | Alto | 🔴 Crítico |
| 3 | System prompt mejorado con todas las reglas | Medio | 🔴 Crítico |
| 4 | Contexto completo del proyecto en cada mensaje | Medio | 🔴 Crítico |
| 5 | Descripción en español obligatoria en cada escena | Bajo | 🔴 Crítico |
| 6 | Ejecutar acciones contra Supabase (transaccional) | Alto | 🔴 Crítico |
| 7 | Regenerar prompts afectados automáticamente | Alto | 🔴 Crítico |
| 8 | Comandos globales ("no hablan", "estilo anime", etc) | Alto | 🔴 Crítico |
| 9 | Reglas de personaje (role_rules) + Reglas globales | Medio | 🟠 Alto |
| 10 | Duraciones obligatorias + indicador total + presets | Bajo | 🟠 Alto |
| 11 | Generar imagen desde chat (Gemini/DALL-E) + preview | Alto | 🟠 Alto |
| 12 | Sustituir/regenerar/versionar imágenes por escena | Alto | 🟠 Alto |
| 13 | Crear personaje desde foto en chat + character sheet | Alto | 🟠 Alto |
| 14 | Historial de cambios + deshacer (change_history) | Alto | 🟠 Alto |
| 15 | Timeline se regenera automático al cambiar escenas | Medio | 🟠 Alto |
| 16 | Reducir/fusionar escenas desde chat | Alto | 🟡 Medio |
| 17 | Ordenar escenas con tabla comparativa | Medio | 🟡 Medio |
| 18 | Explicar vídeo completo en narrativa española | Medio | 🟡 Medio |
| 19 | Notificaciones push del navegador | Bajo | 🟡 Medio |
| 20 | Export de narrativa completa en español | Bajo | 🟢 Nice-to-have |

---

*Kiyoko AI — Mejoras v4 · Chat como Director Creativo · 17 marzo 2026*
