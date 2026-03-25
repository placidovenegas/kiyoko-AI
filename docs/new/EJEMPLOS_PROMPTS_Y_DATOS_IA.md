# Ejemplos de Como la IA Deberia Crear Prompts y Devolver Datos

## Objetivo

Este documento define ejemplos concretos de:

- como deberia escribir la IA los prompts
- como deberia estructurar los datos que devuelve
- que diferencias hay entre una salida floja y una salida buena

La idea es que esto sirva como referencia para:

- mejorar system prompts
- validar respuestas del modelo
- construir tests
- alinear el chat, las rutas API y la BD

## Regla general

La IA no deberia "improvisar" el formato.

Debe separar siempre:

1. texto de explicacion para el usuario
2. prompt creativo final
3. datos estructurados para guardar
4. action plan si hay cambios en BD

## Regla general para prompts

Un buen prompt no debe ser:

- demasiado corto
- ambiguo
- contradictorio
- una lista caotica de keywords

Un buen prompt debe contener:

- sujeto principal
- accion
- entorno
- composicion o camara
- iluminacion
- mood
- estilo visual
- restricciones importantes

## 1. Ejemplos de prompt de imagen

## Ejemplo malo

```text
chica en la playa estilo pixar bonita luz
```

Problemas:

- no dice que esta haciendo
- no fija plano ni composicion
- no fija hora o tipo de luz
- no usa contexto del personaje
- no usa contexto del fondo

## Ejemplo aceptable

```text
Pixar-style 3D animated render of a young blonde woman waking up in a hammock on a tropical beach, warm morning light, cinematic composition, soft smile, palm trees in background, high quality
```

## Ejemplo bueno

```text
Pixar-style 3D animated render, Laura, young woman with wavy blonde hair and a bright relaxed smile, slowly waking up in a woven hammock, stretching one arm upward, tropical beach with calm ocean and palm trees behind her, wide morning establishing shot, soft golden morning backlight, warm cinematic tones, gentle sea breeze moving fabric and hair, clean composition, shallow depth of field, polished character detail, cinematic, high quality
```

## Estructura recomendada

```text
[estilo visual], [personaje canon + rasgos], [accion exacta], [fondo canon], [tipo de plano], [iluminacion], [mood], [detalle cinematografico], [calidad]
```

## 2. Ejemplos de prompt de video

## Ejemplo malo

```text
la camara se mueve y ella se levanta
```

## Ejemplo bueno

```text
Starting from first frame: Laura slowly opens her eyes and stretches in the hammock, then shifts her weight forward as the fabric sways gently. Slow dolly-in camera movement with subtle handheld softness, 5 seconds, morning ocean breeze moving her hair and the hammock fabric, maintain warm golden morning lighting throughout, ambient beach motion only, calm cinematic mood.
```

## Estructura recomendada

```text
Starting from first frame: [accion principal], [movimiento de camara], [duracion], [elementos dinamicos], maintain [iluminacion] throughout, [sonido o restriccion], [mood].
```

## 3. Ejemplo de prompt construido correctamente desde datos

## Datos de entrada

### Proyecto

- style: `pixar`
- global_prompt_rules: `Siempre mantener tono cálido, cinematográfico y familiar`

### Personaje

- name: `Laura`
- prompt_snippet: `young woman, wavy blonde hair, bright smile, relaxed summer clothing`
- ai_prompt_description: `Young woman in her twenties with wavy blonde hair, soft expressive face, relaxed beachwear, warm approachable energy`

### Fondo

- name: `Playa amanecer`
- prompt_snippet: `tropical beach, golden morning light, calm ocean, soft horizon`

### Camara

- camera_angle: `wide`
- camera_movement: `dolly_in`
- lighting: `golden morning backlight`
- mood: `peaceful, hopeful`

## Prompt final esperado

```text
Pixar-style 3D animated render, young woman with wavy blonde hair, bright smile and relaxed summer clothing waking gently in a hammock, tropical beach with calm ocean and soft horizon, wide establishing shot, golden morning backlight, peaceful hopeful mood, warm family-friendly cinematic tone, subtle breeze in hair and fabric, clean composition, polished 3D character detail, cinematic, high quality
```

## 4. Ejemplos de datos estructurados para escenas

Esto encaja con `src/lib/ai/schemas/scene-output.ts`.

## Ejemplo flojo

```json
{
  "scene_number": "1",
  "title": "Playa",
  "description": "Una chica en la playa",
  "prompt_image": "girl on beach",
  "duration_seconds": 5
}
```

Problemas:

- incompleto
- no usa enumeraciones esperadas
- no define arco
- no define camara
- prompt demasiado pobre

## Ejemplo bueno

```json
{
  "scene_number": "E1",
  "title": "Despertar frente al mar",
  "scene_type": "original",
  "category": "opening",
  "arc_phase": "hook",
  "description": "Laura despierta suavemente en una hamaca frente al mar al amanecer, transmitiendo calma y promesa de un nuevo comienzo.",
  "director_notes": "Abrir con una imagen emocionalmente limpia y muy legible. Debe sentirse aspiracional y cálida.",
  "prompt_image": "Pixar-style 3D animated render, young woman with wavy blonde hair and a bright relaxed smile waking gently in a hammock, tropical beach with calm ocean and soft horizon, wide establishing shot, golden morning backlight, peaceful hopeful mood, subtle breeze moving hair and fabric, cinematic, high quality",
  "prompt_video": "Starting from first frame: Laura slowly opens her eyes, stretches in the hammock and lets out a soft relaxed breath while the hammock sways gently. Slow dolly-in camera movement, 5 seconds, warm ocean breeze moving hair and fabric, maintain golden morning backlight throughout, ambient beach atmosphere only, peaceful hopeful cinematic mood.",
  "prompt_additions": "Evitar elementos urbanos o crowd. Mantener la atención en Laura y el amanecer.",
  "improvements": [
    {
      "type": "add",
      "text": "Se reforzó la legibilidad emocional del primer plano narrativo."
    }
  ],
  "duration_seconds": 5,
  "camera_angle": "wide",
  "camera_movement": "dolly_in",
  "camera_notes": "Movimiento suave, nada agresivo.",
  "lighting": "golden morning backlight",
  "mood": "peaceful, hopeful",
  "music_notes": "Pads suaves y orgánicos, entrada muy ligera.",
  "sound_notes": "Brisa, mar suave, sin voz.",
  "required_references": [
    "Laura",
    "Playa amanecer"
  ],
  "reference_tip": "Tomar el personaje y el fondo directamente de sus versiones canon."
}
```

## 5. Ejemplos de datos estructurados para personajes

Esto encaja con `src/lib/ai/schemas/character-output.ts`.

## Ejemplo bueno

```json
{
  "characters": [
    {
      "name": "Laura",
      "initials": "LA",
      "role": "protagonista",
      "description": "Es una joven que transmite autenticidad, calma y energia positiva.",
      "visual_description": "Mujer joven de rasgos suaves, pelo rubio ondulado, mirada luminosa y presencia relajada.",
      "prompt_snippet": "young woman, wavy blonde hair, bright smile, relaxed summer clothing",
      "personality": "cercana, optimista, serena",
      "signature_clothing": "camisa ligera de lino color crema y shorts de verano",
      "hair_description": "wavy blonde hair, shoulder length, soft natural texture",
      "accessories": [
        "delicate bracelet"
      ],
      "signature_tools": [],
      "color_accent": "#F4C77D"
    }
  ],
  "consistency_rules": [
    "Laura siempre debe mantener el pelo rubio ondulado y una energia visual calida.",
    "Evitar cambios fuertes de vestuario salvo que la historia lo exija.",
    "Su expresion base debe sentirse natural y luminosa, no agresiva."
  ]
}
```

## 6. Ejemplos de datos estructurados para proyecto

Esto encaja con `src/lib/ai/schemas/project-output.ts`.

```json
{
  "title": "Despierta Tu Mejor Version",
  "description": "Campaña audiovisual cálida y aspiracional centrada en una transformación emocional y visual en un entorno luminoso y mediterráneo.",
  "client_name": "Marca Demo",
  "style": "pixar",
  "target_platform": "instagram_reels",
  "target_duration_seconds": 30,
  "color_palette": {
    "primary": "#F4C77D",
    "secondary": "#6EC6C1",
    "accent": "#FF8C6B",
    "dark": "#1F2430",
    "light": "#FFF7EE"
  },
  "tags": [
    "warm",
    "aspirational",
    "coastal",
    "emotional",
    "family-friendly"
  ]
}
```

## 7. Ejemplos de timeline

Esto encaja con `src/lib/ai/schemas/timeline-output.ts`.

```json
{
  "version": "short_30s",
  "total_duration_seconds": 30,
  "entries": [
    {
      "scene_number": "E1",
      "title": "Despertar frente al mar",
      "description": "Laura despierta en la hamaca mientras entra la luz del amanecer.",
      "start_time": "00:00",
      "end_time": "00:05",
      "duration_seconds": 5,
      "arc_phase": "hook",
      "music_notes": "Entrada suave y cálida",
      "transition": "fade_in"
    },
    {
      "scene_number": "E2",
      "title": "Primer impulso",
      "description": "Laura se incorpora y mira el horizonte con una energía renovada.",
      "start_time": "00:05",
      "end_time": "00:12",
      "duration_seconds": 7,
      "arc_phase": "build",
      "music_notes": "Crecimiento emocional progresivo",
      "transition": "cut"
    },
    {
      "scene_number": "E3",
      "title": "Momento de plenitud",
      "description": "La protagonista avanza segura mientras el entorno vibra con luz y movimiento.",
      "start_time": "00:12",
      "end_time": "00:24",
      "duration_seconds": 12,
      "arc_phase": "peak",
      "music_notes": "Climax emotivo con texturas brillantes",
      "transition": "cut"
    },
    {
      "scene_number": "E4",
      "title": "Cierre de marca",
      "description": "La energia emocional se recoge en un cierre limpio y memorable.",
      "start_time": "00:24",
      "end_time": "00:30",
      "duration_seconds": 6,
      "arc_phase": "close",
      "music_notes": "Resolucion suave y elegante",
      "transition": "fade_out"
    }
  ],
  "director_notes": "Mantener claridad emocional y ritmo ascendente. No sobrecargar el cierre."
}
```

## 8. Ejemplos de analisis de video

Esto encaja con `src/lib/ai/schemas/analysis-output.ts`.

```json
{
  "metrics": {
    "total_scenes": 4,
    "estimated_duration": 30,
    "total_characters": 1,
    "total_backgrounds": 1
  },
  "strengths": [
    {
      "title": "Apertura visual clara",
      "description": "La primera escena presenta a la protagonista y el universo visual con mucha legibilidad emocional.",
      "category": "narrative"
    },
    {
      "title": "Buen uso de la luz",
      "description": "La iluminación mantiene coherencia cálida a lo largo del video.",
      "category": "visual"
    }
  ],
  "warnings": [
    {
      "title": "Poco contraste entre build y peak",
      "description": "La fase media y el clímax podrían diferenciarse más en energía visual y movimiento.",
      "category": "pacing",
      "priority": 2
    }
  ],
  "suggestions": [
    {
      "title": "Aumentar dinamismo en el clímax",
      "description": "Subir ligeramente el movimiento de cámara y la acción en la escena peak ayudaría a sentir más progresión.",
      "category": "cinematography"
    }
  ],
  "overall_score": 84,
  "summary": "El video tiene una base emocional y visual sólida, pero puede ganar fuerza si separa mejor las fases narrativas medias y altas."
}
```

## 9. Ejemplos de action plan bien hecho

Esto encaja con `src/types/ai-actions.ts`.

## Crear escenas

```json
{
  "description": "Crear 2 escenas nuevas para abrir el video con un hook emocional y una fase build clara",
  "requires_confirmation": true,
  "actions": [
    {
      "type": "create_scene",
      "table": "scenes",
      "data": {
        "title": "Despertar frente al mar",
        "video_id": "VIDEO_UUID_REAL",
        "project_id": "PROJECT_UUID_REAL",
        "scene_number": "E1",
        "sort_order": 1,
        "duration_seconds": 5,
        "arc_phase": "hook",
        "scene_type": "original",
        "status": "draft",
        "description": "Laura despierta suavemente en una hamaca frente al mar."
      }
    },
    {
      "type": "assign_character",
      "table": "scene_characters",
      "data": {
        "scene_id": "__NEW_SCENE_1_ID__",
        "character_id": "CHARACTER_UUID_REAL",
        "role_in_scene": "protagonista",
        "sort_order": 1
      }
    },
    {
      "type": "assign_background",
      "table": "scene_backgrounds",
      "data": {
        "scene_id": "__NEW_SCENE_1_ID__",
        "background_id": "BACKGROUND_UUID_REAL",
        "is_primary": true,
        "time_of_day": "morning",
        "angle": "wide"
      }
    }
  ]
}
```

## Crear prompts

```json
{
  "description": "Crear prompts de imagen y video para la escena E1",
  "requires_confirmation": true,
  "actions": [
    {
      "type": "create_prompt",
      "table": "scene_prompts",
      "data": {
        "scene_id": "SCENE_UUID_REAL",
        "prompt_type": "image",
        "prompt_text": "Pixar-style 3D animated render, young woman with wavy blonde hair waking gently in a hammock on a tropical beach, wide shot, golden morning backlight, calm ocean, peaceful hopeful mood, cinematic, high quality"
      }
    },
    {
      "type": "create_prompt",
      "table": "scene_prompts",
      "data": {
        "scene_id": "SCENE_UUID_REAL",
        "prompt_type": "video",
        "prompt_text": "Starting from first frame: Laura slowly opens her eyes and stretches in the hammock as the fabric sways gently. Slow dolly-in, 5 seconds, warm ocean breeze moving hair and fabric, maintain golden morning backlight throughout, ambient beach atmosphere only, peaceful cinematic mood."
      }
    }
  ]
}
```

## 10. Ejemplo de bloque visual para el chat

Si el chat quiere mostrar al usuario una vista previa antes de guardar, deberia devolver algo asi:

```text
Te propongo este prompt para la escena E1:

[PROMPT_PREVIEW]
{
  "scene_number": "E1",
  "scene_title": "Despertar frente al mar",
  "prompt_type": "image",
  "prompt_en": "Pixar-style 3D animated render, young woman with wavy blonde hair waking gently in a hammock on a tropical beach, wide shot, golden morning backlight, calm ocean, peaceful hopeful mood, cinematic, high quality",
  "description_local": "Plano general cálido de Laura despertando en la playa con luz de amanecer.",
  "tags": ["wide", "morning", "peaceful", "laura", "beach"]
}
[/PROMPT_PREVIEW]
```

## 11. Plantillas reutilizables de prompt

## Plantilla de prompt de imagen

```text
[STYLE], [CHARACTER_CANON], [ACTION], [BACKGROUND_CANON], [SHOT_TYPE], [LIGHTING], [MOOD], [DYNAMIC_DETAILS], cinematic, high quality
```

## Plantilla de prompt de video

```text
Starting from first frame: [ACTION_OVER_TIME]. [CAMERA_MOVEMENT], [DURATION] seconds, [DYNAMIC_ELEMENTS], maintain [LIGHTING] throughout, [SOUND_RULE], [MOOD].
```

## Plantilla de prompt de personaje

```text
[age/gender/readability], [hair], [face], [signature_clothing], [signature_tools], [energy], [style fit]
```

## Plantilla de prompt de fondo

```text
[location type], [time of day], [lighting], [materials], [atmosphere], [key objects], [angle options], [style fit]
```

## 12. Reglas de validacion recomendadas

Antes de aceptar un prompt o una salida estructurada, yo validaria esto:

### Prompt de imagen

- contiene personaje o sujeto principal
- contiene accion
- contiene fondo
- contiene luz
- contiene estilo
- no contradice escena o referencias

### Prompt de video

- empieza por `Starting from first frame:`
- describe movimiento real
- indica duracion
- mantiene coherencia con prompt de imagen

### Datos de escena

- `scene_type` valido
- `arc_phase` valido
- `duration_seconds` positivo
- `prompt_image` no vacio
- `scene_number` consistente

### Action plan

- usa UUID reales o placeholders permitidos
- no inventa IDs
- `table` y `type` cuadran
- `requires_confirmation` es `true`

## 13. Malas practicas que evitaria

- prompts de 5 palabras
- prompts solo con keywords sueltas
- JSON incompleto
- mezclar texto bonito con datos mal estructurados
- cambiar estilo visual entre escenas sin justificacion
- ignorar `prompt_snippet` y `ai_prompt_description`
- crear prompts sin personajes o fondos asignados

## 14. Mi recomendacion practica

Si quieres que la IA produzca resultados mejores, yo le pediria siempre este flujo:

1. leer contexto real de proyecto, video, personajes, fondos y escena
2. decidir la tarea exacta
3. producir primero salida estructurada
4. construir el prompt final a partir de datos canonicos
5. mostrar preview
6. solo despues generar action plan o persistir

## Resumen

La mejor salida de IA no es la mas larga, sino la mas consistente.

Lo ideal es que la IA:

- piense con datos estructurados
- escriba prompts usando canon visual
- devuelva JSON valido
- separe preview de persistencia
- mantenga coherencia entre proyecto, escena, prompt y resultado

Si quieres, el siguiente paso puede ser que te cree un segundo documento con:

- "plantillas maestras" de system prompt
- validadores por tipo de salida
- ejemplos reales por cada tabla que quieras rellenar
