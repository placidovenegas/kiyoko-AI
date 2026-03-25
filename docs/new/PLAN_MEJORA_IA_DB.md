# Plan de Mejora del Sistema de IA Basado en la Base de Datos Actual

## Objetivo

Este documento describe como mejoraria el sistema de IA de Kiyoko apoyandome en las tablas reales de `src/types/database.types.ts`.

La idea no es solo "mejorar prompts", sino construir un sistema mas consistente, medible y capaz de generar mejores resultados en:

- planificacion de proyectos
- creacion de videos
- generacion de escenas
- consistencia de personajes y fondos
- generacion de prompts de imagen y video
- narracion y voz
- analisis de calidad
- ejecucion segura de cambios desde el chat

## Diagnostico resumido

Ahora mismo el proyecto ya tiene piezas potentes, pero estan repartidas entre varios flujos y convenciones:

- hay varias capas de IA conviviendo
- no todas las rutas usan la misma estrategia de modelos
- el chat mezcla conversacion, planificacion, UI estructurada y generacion creativa
- parte del sistema usa tablas nuevas como `scene_prompts`, pero otras partes siguen leyendo o escribiendo campos legacy
- hay poca trazabilidad real de calidad de salida
- falta una capa de evaluacion continua

Mi enfoque seria unificar la arquitectura alrededor de la base de datos actual y convertir la BD en la fuente de verdad del contexto creativo.

## Principios de mejora

1. Una sola fuente de verdad por tipo de dato.
2. Un solo router de modelos por tarea.
3. Contexto pequeno, relevante y estructurado.
4. El chat no debe improvisar formatos; debe producir acciones y salidas tipadas.
5. Todo lo importante debe ser medible con tablas de logs, versiones y analisis.
6. La calidad visual depende mas de personajes, fondos y reglas globales bien definidos que de un prompt "magico".

## Arquitectura objetivo

Separaria el sistema en 6 capas:

1. `Context Builder`
   Construye el contexto minimo necesario desde BD para cada tarea.

2. `Task Router`
   Decide si la tarea es:
   - chat general
   - planificacion de escenas
   - escritura de prompts
   - vision
   - narracion
   - analisis
   - generacion de imagen/video

3. `Model Router`
   Elige modelo por tarea, no por orden fijo global.

4. `Structured Generation`
   Siempre que se pueda, usar salida estructurada real y no parsing fragil de texto.

5. `Persistence Layer`
   Guarda resultados versionados en tablas correctas.

6. `Quality Loop`
   Mide uso, errores, fallbacks, calidad estimada, analisis y capacidad de rollback.

## Tablas clave y como las usaria mejor

### 1. `projects`

Tabla base del contexto creativo global.

Campos clave:

- `title`
- `description`
- `ai_brief`
- `style`
- `custom_style_description`
- `color_palette`
- `global_prompt_rules`
- `tags`
- `metadata`

Como la mejoraria:

- trataria `ai_brief` como brief maestro de negocio y narrativa
- trataria `global_prompt_rules` como reglas permanentes de generacion
- moveria a `metadata` configuraciones auxiliares no criticas, pero no la logica principal
- haria que toda generacion de escenas, prompts, narracion y analisis parta de este registro

Que rellenaria mejor:

- brief creativo limpio
- estilo visual bien definido
- reglas globales de consistencia
- tono de marca
- restricciones de plataforma

### 2. `project_ai_agents`

Esta tabla debe ser la capa de personalidad y comportamiento del asistente por proyecto.

Campos clave:

- `system_prompt`
- `tone`
- `creativity_level`
- `language`
- `video_style_context`
- `is_default`

Como la mejoraria:

- no usaria `system_prompt` como reemplazo total del prompt base
- lo usaria como capa de personalizacion sobre un sistema base estable
- separaria claramente:
  - identidad del asistente
  - tono
  - nivel creativo
  - preferencias de salida

Que rellenaria mejor:

- instrucciones de marca
- tono deseado
- nivel de riesgo creativo
- contexto de estilo de video

### 3. `project_ai_settings`

Esta tabla deberia ser el centro de orquestacion tecnica por proyecto.

Campos clave:

- `image_provider`
- `video_provider`
- `tts_provider`
- `vision_provider`
- `vision_model`
- `image_provider_config`
- `video_provider_config`
- `tts_provider_config`
- `video_base_duration_seconds`
- `video_alt_duration_seconds`
- `video_extension_duration_seconds`

Como la mejoraria:

- la convertiria en el punto unico de configuracion por modalidad
- evitaria decisiones dispersas en rutas sueltas
- cada task resolveria primero esta tabla y luego el fallback general

Que rellenaria mejor:

- proveedor preferido por modalidad
- configuracion por proveedor
- duraciones estandar de generacion
- flags de soporte para extensiones de video

### 4. `style_presets`

Aqui esta una de las mayores oportunidades de mejora real de calidad.

Campos clave:

- `prompt_prefix`
- `prompt_suffix`
- `negative_prompt`
- `color_palette`
- `reference_image_url`
- `style_type`
- `generator`
- `generator_config`
- `is_default`

Como la mejoraria:

- convertiria `style_presets` en la capa visual canonica
- el prompt generator no deberia inventar estilo desde cero si ya existe preset
- el preset deberia inyectarse siempre en prompts de imagen y video
- usaria `negative_prompt` de forma consistente en generacion de imagen

Que rellenaria mejor:

- prefijo de estilo estable
- sufijo de calidad y render
- negativo visual por estilo
- referencia visual del proyecto
- configuracion especifica por generador

### 5. `videos`

Tabla de unidad narrativa de ejecucion.

Campos clave:

- `project_id`
- `title`
- `description`
- `platform`
- `video_type`
- `target_duration_seconds`
- `aspect_ratio`
- `style_preset_id`
- `metadata`

Como la mejoraria:

- toda planificacion de escenas deberia ser por video, nunca solo por proyecto
- usaria `style_preset_id` como enlace obligatorio al look visual
- guardaria en `metadata` solo detalles auxiliares como configuracion temporal o parametros de UI

Que rellenaria mejor:

- objetivo del video
- duracion real objetivo
- plataforma exacta
- preset visual asociado

### 6. `characters`

Esta tabla es critica para consistencia visual.

Campos clave:

- `name`
- `role`
- `description`
- `visual_description`
- `prompt_snippet`
- `ai_prompt_description`
- `ai_visual_analysis`
- `hair_description`
- `signature_clothing`
- `signature_tools`
- `personality`
- `rules`
- `reference_image_url`

Como la mejoraria:

- trataria `prompt_snippet` como resumen corto reutilizable
- trataria `ai_prompt_description` como descripcion larga optimizada para generadores
- trataria `rules` como canon del personaje
- alimentaria estas columnas desde vision + edicion humana

Que rellenaria mejor:

- rasgos permanentes
- ropa y accesorios identitarios
- herramientas o props recurrentes
- reglas de consistencia
- referencias visuales buenas

### 7. `backgrounds`

Equivalente visual de personajes para entornos.

Campos clave:

- `name`
- `code`
- `description`
- `location_type`
- `time_of_day`
- `available_angles`
- `prompt_snippet`
- `ai_prompt_description`
- `ai_visual_analysis`
- `reference_image_url`

Como la mejoraria:

- haria que cada fondo tenga version "canon"
- usaria `available_angles` de verdad para condicionar camara y prompts
- alimentaria `ai_prompt_description` desde vision para recreacion consistente

Que rellenaria mejor:

- tipo de localizacion
- hora del dia
- angulos disponibles
- atmósfera y materiales
- referencias visuales limpias

### 8. `scene_characters`, `scene_backgrounds`, `scene_camera`

Estas tres tablas deberian ser la verdad de composicion de una escena.

Como la mejoraria:

- construiria prompts a partir de estas tablas, no solo de texto libre
- el modelo deberia recibir:
  - personajes asignados
  - fondo principal
  - angulo
  - hora del dia
  - camara
  - mood
  - lighting
- `scene_camera.ai_reasoning` puede guardar por que se eligio esa camara

Esto permitiria mejores prompts porque la escena deja de ser solo descripcion y pasa a ser una estructura cinematografica.

### 9. `scene_prompts`

Esta tabla debe ser la fuente de verdad de prompts versionados.

Campos clave:

- `scene_id`
- `prompt_type`
- `prompt_text`
- `generator`
- `generation_config`
- `result_url`
- `version`
- `is_current`
- `status`

Como la mejoraria:

- usaria `scene_prompts` como fuente oficial y dejaria de depender de columnas legacy en `scenes`
- guardaria `generator` y `generation_config` siempre
- diferenciaria claramente:
  - prompt de imagen
  - prompt de video
  - prompt de narracion si aplica

Que rellenaria mejor:

- prompt exacto enviado
- modelo/proveedor usado
- configuracion de generacion
- estado real del prompt
- URL del resultado si existe

### 10. `scene_media`

Aqui iria el resultado visual generado y versionado.

Campos clave:

- `scene_id`
- `media_type`
- `file_url`
- `file_path`
- `thumbnail_url`
- `prompt_used`
- `generator`
- `generation_config`
- `version`
- `is_current`
- `status`

Como la mejoraria:

- toda imagen o video generado deberia crear una fila aqui
- `prompt_used` deberia venir del prompt exacto en `scene_prompts`
- `generation_config` deberia recoger seed, modelo, tamaño, guidance o lo que aplique

Esto es clave para reproducibilidad y analisis.

### 11. `video_narrations`

Tabla correcta para narracion final por video.

Campos clave:

- `video_id`
- `narration_text`
- `provider`
- `source`
- `voice_id`
- `voice_name`
- `speed`
- `audio_url`
- `audio_duration_ms`
- `version`
- `is_current`
- `status`

Como la mejoraria:

- separaria claramente generacion de texto y sintesis de voz
- el texto de narracion deberia generarse con control de tiempo por video
- la voz deberia actualizar la misma version o crear una nueva segun estrategia definida

Que rellenaria mejor:

- texto final validado
- proveedor TTS
- voz usada
- audio resultante
- duracion real

### 12. `narrative_arcs` y `timeline_entries`

Estas tablas son clave para calidad narrativa.

Como la mejoraria:

- la IA deberia usar `narrative_arcs` como estructura de alto nivel
- `timeline_entries` deberia reflejar tiempos reales por video
- escenas, arco y timeline deben cuadrar entre si

Uso recomendado:

- primero generar o validar arco
- luego generar escenas
- luego construir timeline desde escenas
- luego auditar duraciones contra `target_duration_seconds`

### 13. `video_analysis`

Esta tabla deberia ser el centro del bucle de mejora.

Campos clave:

- `overall_score`
- `summary`
- `strengths`
- `weaknesses`
- `suggestions`
- `analysis_model`
- `version`
- `is_current`

Como la mejoraria:

- la usaria tras cada gran cambio de escenas o prompts
- calcularia analisis por video y compararia versiones
- enlazaria sugerencias con acciones recomendadas

Esto serviria para pasar de "generar" a "iterar con criterio".

### 14. `ai_usage_logs`

Esta tabla hoy es util, pero puede dar mucho mas valor.

Campos clave:

- `provider`
- `model`
- `task`
- `input_tokens`
- `output_tokens`
- `response_time_ms`
- `success`
- `was_fallback`
- `fallback_reason`
- `original_provider`
- `error_message`

Como la mejoraria:

- definiria taxonomia fija de `task`
- guardaria claramente proveedor original y proveedor final
- usaria esta tabla para ranking real de modelos por tarea

Con esto podria responder preguntas como:

- que modelo da mejor resultado para prompts
- cual falla menos en vision
- cual es mas rapido para chat
- cual merece ser preferido por proyecto

### 15. `entity_snapshots`

Tabla esencial para seguridad operativa.

Como la mejoraria:

- el undo debe reconstruirse bien sobre esta tabla
- debe poder restaurar por batch o por conversacion
- no solo escenas: tambien prompts, camara, asignaciones y narracion

Esto no mejora calidad directamente, pero si permite automatizar mas sin miedo.

### 16. `user_api_keys`

Como la mejoraria:

- no elegiria la primera key activa
- elegiria la mejor key disponible segun tarea
- validaria la key por proveedor y capacidad
- mantendria una resolucion por prioridad:
  - clave del usuario para la tarea adecuada
  - config del proyecto
  - fallback del sistema

## Mejoras funcionales por area

## A. Chat IA

### Problema actual

El chat mezcla demasiadas responsabilidades.

### Mejora

- usar un clasificador de intencion mejor
- separar:
  - chat general
  - plan de acciones
  - generacion creativa
- reducir contexto
- usar herramientas estructuradas reales

### Apoyo en tablas

- `projects`
- `videos`
- `characters`
- `backgrounds`
- `scene_*`
- `project_ai_agents`
- `project_ai_settings`

## B. Generacion de escenas

### Problema actual

La calidad depende demasiado del prompt largo del agente.

### Mejora

- generar escenas con estructura intermedia
- validar que cuadran con:
  - `target_duration_seconds`
  - `narrative_arcs`
  - `timeline_entries`
  - recursos disponibles

### Apoyo en tablas

- `videos`
- `narrative_arcs`
- `timeline_entries`
- `characters`
- `backgrounds`
- `scene_characters`
- `scene_backgrounds`

## C. Generacion de prompts

### Problema actual

El sistema tiene buenas reglas, pero puede ser demasiado rigido y a veces opera sin usar todo el contexto estructurado.

### Mejora

- construir prompts desde datos, no solo desde texto
- usar:
  - `style_presets`
  - `characters.prompt_snippet`
  - `characters.ai_prompt_description`
  - `backgrounds.prompt_snippet`
  - `backgrounds.ai_prompt_description`
  - `scene_camera`
  - `scene_backgrounds`
- guardar siempre resultado en `scene_prompts`

## D. Vision y consistencia

### Problema actual

El analisis visual existe, pero no parece estar aprovechado como canon duro.

### Mejora

- convertir `ai_visual_analysis` en fuente real para consistencia
- regenerar `ai_prompt_description` cuando cambie una referencia
- usar referencias para comparar futuras generaciones

### Apoyo en tablas

- `characters`
- `backgrounds`
- `scene_media`
- `video_analysis`

## E. Narracion

### Problema actual

La narracion esta bastante separada del resto del pipeline creativo.

### Mejora

- generar narracion desde escenas ya validadas
- ajustar duracion por video real
- versionar texto y audio con disciplina

### Apoyo en tablas

- `videos`
- `scene_prompts`
- `video_narrations`

## F. Analisis y mejora continua

### Problema actual

No hay una capa fuerte de evaluacion continua.

### Mejora

- usar `video_analysis` como auditor automatico
- crear casos de prueba reales
- medir resultados en `ai_usage_logs`

## Plan por fases

## Fase 0. Saneamiento del sistema actual

- unificar acceso a modelos
- corregir rutas que usan columnas legacy incorrectas
- definir tablas fuente de verdad por modalidad
- asegurar que todo lo generado se guarda en tablas correctas

## Fase 1. Context Builder

- crear una capa unica de construccion de contexto
- contexto por nivel:
  - proyecto
  - video
  - escena
- incluir solo datos relevantes

## Fase 2. Router por tarea

- clasificacion mejor de intencion
- asignacion de modelo por tarea
- prioridad basada en:
  - calidad
  - coste
  - velocidad
  - disponibilidad

## Fase 3. Generacion estructurada

- acciones tipadas
- prompts tipados
- validacion antes de persistencia
- menos parsing de bloques fragiles

## Fase 4. Bucle de calidad

- analisis automatico post-generacion
- scoring por video
- metricas en `ai_usage_logs`
- comparativa entre versiones

## Fase 5. Sistema de evaluacion

- dataset de pruebas reales
- comparacion de modelos por tarea
- test de consistencia de personajes
- test de coherencia de duracion
- test de calidad narrativa

## Orden exacto en que lo haria

1. Unificar modelo/router y corregir uso de esquema real.
2. Declarar tablas fuente de verdad:
   - prompts -> `scene_prompts`
   - media -> `scene_media`
   - narracion -> `video_narrations`
   - analisis -> `video_analysis`
3. Crear `Context Builder` unico para proyecto, video y escena.
4. Rehacer seleccion de tarea y modelo.
5. Rehacer generacion de prompts apoyada en `style_presets`, personajes, fondos y camara.
6. Rehacer narracion para que use escenas validadas.
7. Activar bucle de analisis y scoring.
8. Rehacer undo con `entity_snapshots`.
9. Montar evaluaciones y comparativas.

## Resultado esperado

Si se hace asi, el sistema deberia mejorar en:

- mayor consistencia visual entre escenas
- mejores prompts de imagen y video
- menos respuestas ambiguas del chat
- mejor encaje entre escenas, duracion y arco narrativo
- mas trazabilidad de que modelo funciona mejor
- mas seguridad al ejecutar cambios
- mas capacidad de iterar sin romper cosas

## Resumen final

Mi propuesta no es solo "afinar prompts", sino reorganizar el sistema alrededor de tus tablas reales para que:

- la BD sea el canon creativo
- la IA trabaje con contexto limpio y estructurado
- cada tarea use el modelo adecuado
- todo quede versionado, medido y analizable

La tabla mas importante para calidad final no es una sola, sino la combinacion de:

- `projects`
- `style_presets`
- `characters`
- `backgrounds`
- `scene_camera`
- `scene_characters`
- `scene_backgrounds`
- `scene_prompts`
- `scene_media`
- `video_narrations`
- `video_analysis`
- `ai_usage_logs`

Si estas bien con este enfoque, el siguiente paso ideal seria hacer un segundo documento mas tecnico con:

- arquitectura propuesta por modulos
- flujo de datos completo
- migraciones o limpiezas recomendadas
- orden exacto de implementacion en codigo
