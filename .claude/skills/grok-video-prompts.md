---
description: Guía de cinematografía para generar prompts de video optimizados para Grok Imagine. Usar cuando se generen prompts de video, se mejoren prompts existentes, o se trabaje con escenas y cámara.
---

# Guía de Prompts de Video para Grok Imagine

## Estructura OBLIGATORIA del prompt de video

Todo prompt de video DEBE seguir esta estructura:

```
[STYLE]: Pixar 3D animation, 8K, cinematic 16:9, 24fps.
[DURATION]: X seconds.
[CAMERA]: [Plano] with [Movimiento].
[LANGUAGE]: Spanish / Español.
[REFERENCES]: @[IMAGEN PERSONAJE] (character sheets)

[TIMELINE]:
[00:00-00:03]: [Acción inicial — quién hace qué]
[00:03-00:07]: [Acción principal — momento clave]
[00:07-00:10]: [Resolución — reacción, freeze]

[ACTION DETAILS]: Descripción narrativa con @[REF] para personajes.
[AUDIO]: Ambient/dialogue/silent. NO music unless specified.
[NEGATIVE]: No blurry faces, no extra limbs, no flickering, no text.
```

## Reglas de oro

1. **Menos es más** — Grok se confunde con prompts largos. Max 3-4 líneas por bloque de tiempo
2. **1 acción principal por cada 2-3 segundos** — no meter 5 cosas a la vez
3. **1 movimiento de cámara por bloque de 2-3 seg** — secuenciarlos, no mezclar
4. **El prompt de vídeo describe MOVIMIENTO** — no redescribir lo que ya está en la imagen
5. **Si algo debe verse, ponerlo en la IMAGEN base** — el vídeo solo anima

## Diccionario de planos

| Plano | Comando en prompt | Uso |
|-------|-------------------|-----|
| Gran Plano General | `Extreme Wide Shot` | Establecer lugar |
| Plano General | `Long Shot` | Personaje cuerpo entero en entorno |
| Plano Americano | `Medium-Wide Shot` | De rodillas arriba. Acción |
| Plano Medio | `Medium Shot` | Cintura arriba. Diálogos |
| Primer Plano | `Close-up` | Rostro. Emociones |
| Primerísimo Plano | `Extreme Close-up` | Un ojo, mano, objeto |
| Contrapicado | `Low Angle Shot` | Desde abajo. Poder, grandeza |
| Picado | `High Angle Shot` | Desde arriba. Vulnerabilidad |
| Cenital | `Top-Down / Overhead Shot` | Directamente arriba |
| Over-the-shoulder | `Over-the-shoulder shot` | Confrontaciones, diálogos |
| Subjetivo (POV) | `POV shot / First-person view` | Lo que ve el personaje |

## Movimientos de cámara

| Movimiento | Comando | Efecto |
|------------|---------|--------|
| Dolly In | `Camera slowly pushes in toward subject` | Tensión, intimidad |
| Dolly Out | `Camera pulls back from subject` | Revelación, soledad |
| Pan | `Camera pans left/right` | Seguir acción, revelar |
| Tilt Up/Down | `Camera tilts up/down` | Revelar altura, caída |
| Tracking | `Camera tracks alongside the subject` | Seguir caminando/corriendo |
| Orbit | `Camera orbits around the subject 180°/360°` | Épico, transformaciones |
| Crane Up | `Camera cranes up / ascending crane shot` | Subida épica |
| Whip Pan | `Camera whip pans to the right/left` | Cambio brusco de atención |
| Shake | `Camera shakes violently from impact` | Impactos, explosiones |
| Estática | `Camera holds still / static shot` | Calma, tensión |

## Audio

| Situación | Comando |
|-----------|---------|
| Solo ambiente | `Audio: Ambient sound only (wind, birds). NO music.` |
| Diálogo | `Audio: Clear dialogue in Spanish. No background music.` |
| Efectos | `Audio: SFX (explosions, metal). NO music.` |
| Silencio | `Audio: Complete silence.` |

**IMPORTANTE**: Si NO pones "No music", Grok AÑADE música genérica.

## Negative prompting (SIEMPRE al final)

```
[NEGATIVE]: No blurry faces, no extra limbs, no flickering lighting,
no text or watermarks, no morphing between frames.
```

Negatives específicos:
- Caras borrosas: `No blurry faces, no distorted facial features`
- Extremidades: `No extra limbs, no extra fingers`
- Texto: `No text, no watermarks, no logos`
- Expresiones: `No smiling faces during panic scenes`

## Character consistency

Para mantener personajes consistentes entre escenas:
1. Generar Character Sheet (imagen multi-vista en fondo verde)
2. Subir como referencia con cada prompt
3. Referenciar con `@[IMAGEN PERSONAJE]` en el prompt
4. Añadir `match face exactly from uploaded reference`

## Timing — Cuánto cabe por segundo

| Acción | Tiempo |
|--------|--------|
| Solo expresión facial | 1-2s |
| Movimiento simple (girarse) | 2-3s |
| Caminar/correr | 2-4s |
| Impacto/explosión | 1-2s |
| Transformación compleja | 4-6s |
| Pelea 2 personajes | 3-4s por intercambio |

## Extensiones de clip (continuidad)

```
[CONTINUING FROM PREVIOUS CLIP]
Pixar-quality 3D animation, cinematic 16:9, 8K, 24fps. Continue from last frame.
[Solo describe el MOVIMIENTO nuevo]
```

- NO redescribir la escena
- Subir SIEMPRE la character sheet
- Si cambia el plano: `Camera cuts to [new angle]`

## Estilos visuales

| Estilo | Prompt |
|--------|--------|
| Pixar/Disney | `Disney-Pixar 3D animation, 8K, subsurface scattering, expressive eyes, vibrant colors` |
| Anime | `Modern anime, Studio Mappa style, cel-shading, dynamic particles` |
| Sci-Fi | `Photorealistic sci-fi, 35mm lens, worn metal textures, anamorphic flares` |
| Cyberpunk | `Cyberpunk neon, high contrast, wet reflections, volumetric fog, teal-orange` |
| Cine real | `Cinematic realism, 35mm film, natural lighting, high texture detail` |

## Cómo aplicar esta guía al generar prompts

Cuando generes prompts de video en Kiyoko:
1. Usar SIEMPRE la estructura [STYLE] → [DURATION] → [CAMERA] → [TIMELINE] → [ACTION] → [AUDIO] → [NEGATIVE]
2. Traducir camera_angle y camera_movement del formulario a los comandos de Grok de esta guía
3. Incluir negative prompts automáticamente
4. Respetar la regla de 1 acción por 2-3 segundos
5. Incluir `[LANGUAGE]: Spanish` si hay diálogo
6. Incluir `NO music` a menos que el usuario lo pida
