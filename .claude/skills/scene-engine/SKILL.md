---
name: scene-engine
description: Motor de escenas de Kiyoko AI. Usar cuando se trabaje con escenas, prompts de imagen/video, timeline, camara, o generacion de contenido audiovisual. Referencia completa en docs/v6/MY DOCUMENT/kiyoko-motor-escenas-spec.md
---

# Skill: Scene Engine — Motor de Escenas

## Referencia principal
Leer SIEMPRE antes de trabajar: `docs/v6/MY DOCUMENT/kiyoko-motor-escenas-spec.md`

## Tablas involucradas (19 tablas)

### Tablas de escena (el nucleo)
| Tabla | Relacion | Contenido |
|-------|----------|-----------|
| `scenes` | video → N escenas | Escena: titulo, descripcion, dialogo, notas, duracion, arc_phase |
| `scene_camera` | escena → 1 camara | Plano dominante + lighting + mood + reasoning |
| `scene_prompts` | escena → N prompts | image, video, narration, analysis (versionados) |
| `scene_video_clips` | escena → N clips | Clips base + extensiones (parent_clip_id encadena) |
| `scene_characters` | escena ↔ personajes | Que personajes, role_in_scene |
| `scene_backgrounds` | escena ↔ fondos | Que fondo, angle override, time_of_day override |
| `scene_media` | escena → N media | Resultados generados |
| `timeline_entries` | video → N entries | Segundo a segundo: que pasa, camera, audio, props |

### Tablas de recursos (alimentan prompts)
| Tabla | Campos clave para prompts |
|-------|--------------------------|
| `characters` | prompt_snippet, ai_prompt_description, visual_description, hair_description, signature_clothing, accessories |
| `backgrounds` | prompt_snippet, ai_prompt_description, location_type, time_of_day, available_angles |
| `style_presets` | prompt_prefix, prompt_suffix, negative_prompt, generator_config |
| `prompt_templates` | template_text, variables |

### Tablas de contexto (definen tono/estilo)
| Tabla | Campos clave |
|-------|-------------|
| `projects` | style (enum), ai_brief, global_prompt_rules, color_palette, custom_style_description |
| `videos` | platform, video_type, target_duration_seconds, description, aspect_ratio |
| `profiles` | creative_video_types, creative_platforms, creative_purpose |
| `project_ai_agents` | tone, creativity_level, video_style_context |
| `project_ai_settings` | image_provider, video_provider, video_base_duration_seconds, video_supports_extension |
| `narrative_arcs` | phase, start_second, end_second |

## Enums criticos

```
arc_phase:       hook | build | peak | close
camera_angle:    wide | medium | close_up | extreme_close_up | pov | low_angle | high_angle | birds_eye | dutch | over_shoulder
camera_movement: static | dolly_in | dolly_out | pan_left | pan_right | tilt_up | tilt_down | tracking | crane | handheld | orbit
scene_type:      original | improved | new | filler | video
scene_status:    draft | prompt_ready | generating | generated | approved | rejected
prompt_type:     image | video | narration | analysis
project_style:   pixar | realistic | anime | watercolor | flat_2d | cyberpunk | custom
video_type:      long | short | reel | story | ad | custom
target_platform: youtube | instagram_reels | tiktok | tv_commercial | web | custom
```

## Reglas de composicion de prompts

### Cadena de prioridad
1. `personaje.prompt_snippet` → SI EXISTE, usar TAL CUAL como base del personaje
2. `fondo.prompt_snippet` → SI EXISTE, usar TAL CUAL como base del setting
3. `style_preset.prompt_prefix` → va AL INICIO del prompt
4. `proyecto.style` → define el estilo base ("3D animated Pixar-style" etc.)
5. `style_preset.prompt_suffix` → va AL FINAL del prompt
6. `proyecto.global_prompt_rules` → reglas que SIEMPRE aplican
7. Camara, iluminacion, mood completan el prompt

### Que referencia de imagen subir
| Generando | Imagenes de referencia |
|-----------|----------------------|
| Key frame | Ref personaje(s) + ref fondo |
| Video base | Refs personajes + ref fondo + KEY FRAME generado |
| Video extension | Refs personajes + ref fondo + LAST FRAME del clip anterior |
| Transicion | Refs personajes + ultimo frame escena anterior + primer frame escena siguiente |

### Prompt SIEMPRE en ingles, estructura:
```
{style_preset.prompt_prefix}
{proyecto.style} scene, {escena.description}.
Character: {personaje.prompt_snippet}.
{personaje.hair_description}. {personaje.signature_clothing}.
Setting: {fondo.prompt_snippet}.
Camera: {camara.camera_angle} shot, {camara.camera_movement}.
Lighting: {camara.lighting}. Mood: {camara.mood}.
{video.aspect_ratio} aspect ratio.
{style_preset.prompt_suffix}
```

## Tipos de escena

### Escena simple (1 clip)
```
scene → 1 scene_video_clips (base) → N timeline_entries
```

### Escena extendida (N clips encadenados)
```
scene (metadata.is_extended = true)
  ├─ clip A (base, parent=null)
  │    └─ last_frame_url → input de clip B
  └─ clip B (extension, parent=clip_A)
       └─ last_frame_url → input de clip C (si hay)
```

### Transicion (escena filler)
```
scene (scene_type='filler', is_filler=true, metadata.is_transition=true)
  └─ clip (1-2s, con su propio prompt imagen+video)
```

## Multi-camara dentro de una escena

`scene_camera` = plano DOMINANTE (1:1).
Cada `timeline_entry.metadata` = camara de ESE segmento temporal:
```json
{
  "camera_angle": "close_up",
  "camera_movement": "dolly_in",
  "shot_type": "detail_insert"
}
```

## Arco narrativo

| Fase | % del video | Proposito |
|------|------------|-----------|
| hook | 5-10% | Captar atencion |
| build | 40-50% | Desarrollar historia |
| peak | 20-30% | Climax |
| close | 5-10% | Cierre |

Suma de duraciones de escenas = video.target_duration_seconds.
Cada escena tiene su arc_phase.

## Checklist antes de crear escenas

1. [ ] Video tiene `description` y `target_duration_seconds`
2. [ ] Proyecto tiene `style` definido
3. [ ] Hay al menos 1 personaje con `prompt_snippet` o `visual_description`
4. [ ] Hay al menos 1 fondo con `prompt_snippet` o `description`
5. [ ] Si el personaje tiene `reference_image_url` → usarla como ref
6. [ ] Si el fondo tiene `reference_image_url` → usarla como ref

## Checklist antes de generar prompts

1. [ ] Escena tiene `scene_characters` asignados
2. [ ] Escena tiene `scene_backgrounds` asignado
3. [ ] Escena tiene `scene_camera` configurada
4. [ ] Personajes asignados tienen `prompt_snippet` o `visual_description`
5. [ ] Fondo asignado tiene `prompt_snippet` o `description`
6. [ ] Si falta algo → avisar al usuario QUE falta antes de generar
