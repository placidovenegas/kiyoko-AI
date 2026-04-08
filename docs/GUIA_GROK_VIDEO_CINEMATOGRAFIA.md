# 🎬 Guía Profesional de Dirección Cinematográfica para Grok Video
### v2.0 — Optimizada para Grok Imagine · Image-to-Video & Text-to-Video

---

## 📐 1. ESTRUCTURA DEL PROMPT (Plantilla Obligatoria)

Usa SIEMPRE esta estructura. Grok responde mucho mejor cuando el prompt está ordenado así:

```
[STYLE]: Pixar 3D animation, 8K, cinematic 16:9, 24fps.
[DURATION]: 10 seconds.
[CAMERA]: Close-up with Dolly In.
[LANGUAGE]: Spanish / Español.
[REFERENCES]: @[IMAGEN PERSONAJE 1] + @[IMAGEN PERSONAJE 2] (character sheets subidas)

[TIMELINE]:
[00:00-00:03]: [Acción inicial — quién (@[REF]) hace qué, cómo]
[00:03-00:07]: [Acción principal — el momento clave]
[00:07-00:10]: [Resolución — reacción, freeze, transición]

[ACTION DETAILS]: Descripción narrativa. Referencia personajes como @[IMAGEN X]. 
                   Añadir "match face exactly from uploaded reference" para caras.
[AUDIO]: Ambient sound only. NO music. NO narration.
[NEGATIVE]: No blurry faces, no extra limbs, no flickering lighting, no text or watermarks.
```

### ⚠️ Reglas de oro:
- **Menos es más** — Grok se confunde con prompts muy largos. Máximo 3-4 líneas por bloque de tiempo.
- **Un evento principal por segundo** — no metas 5 cosas pasando a la vez.
- **Si algo debe verse, ponlo en la IMAGEN base** — el vídeo solo anima lo que ya existe en la imagen.
- **El prompt de vídeo describe MOVIMIENTO** — no redescribas la escena que ya está en la imagen.

---

## 🎥 2. DICCIONARIO DE PLANOS

| Plano | Comando en prompt | Cuándo usarlo |
|-------|-------------------|---------------|
| Gran Plano General | `Extreme Wide Shot` | Establecer el lugar. Ciudades, paisajes, batallas masivas. |
| Plano General | `Long Shot` | Personaje de cuerpo entero en su entorno. Llegadas, caminatas. |
| Plano Americano | `Medium-Wide Shot` | De rodillas para arriba. Acción de cuerpo. Peleas. |
| Plano Medio | `Medium Shot` | De cintura para arriba. Diálogos, reacciones. |
| Primer Plano | `Close-up` | Rostro completo. Emociones, decisiones, miradas. |
| Primerísimo Plano | `Extreme Close-up` | Un ojo, una mano, un objeto. Detalle máximo. |
| Contrapicado | `Low Angle Shot / Worm's Eye View` | Desde abajo. Da poder y grandeza al sujeto. Para héroes y monstruos. |
| Picado | `High Angle Shot / Bird's Eye View` | Desde arriba. Hace al sujeto vulnerable o pequeño. |
| Cenital | `Top-Down / Overhead Shot` | Directamente desde arriba. Mapas de batalla, caos. |
| Over-the-shoulder | `Over-the-shoulder shot` | Detrás del hombro de alguien. Confrontaciones, diálogos. |
| Subjetivo (POV) | `POV shot / First-person view` | Lo que ve el personaje. Inmersión. |

---

## 🎬 3. MOVIMIENTOS DE CÁMARA

| Movimiento | Comando | Efecto |
|------------|---------|--------|
| Dolly In | `Camera slowly pushes in toward subject` | Acercamiento físico. Tensión, intimidad. |
| Dolly Out | `Camera pulls back from subject` | Revelación, alejamiento, soledad. |
| Pan | `Camera pans left/right` | Giro horizontal. Seguir acción, revelar escena. |
| Tilt Up/Down | `Camera tilts up/down` | Mirar arriba o abajo. Revelar altura, caída. |
| Tracking | `Camera tracks alongside the subject` | Seguir a alguien caminando/corriendo. |
| Orbit | `Camera orbits around the subject 180°/360°` | Girar alrededor. Épico, transformaciones, poder. |
| Crane Up | `Camera cranes up / ascending crane shot` | Subida épica. Revelaciones, finales. |
| Crane Down | `Camera descends from above` | Bajar al nivel de acción. Inmersión. |
| Whip Pan | `Camera whip pans to the right/left` | Giro brusco. Cambio de atención, acción rápida. |
| Shake | `Camera shakes violently from impact` | Impactos, explosiones, terremotos. |
| Estática | `Camera holds still / static shot` | Dejar que la acción ocurra en el frame. Calma, tensión. |
| Zoom | `Camera zooms in slowly` | Acercamiento óptico (no físico). Descubrimiento. |

### 💡 Tip clave:
Grok funciona mejor con **1 movimiento de cámara por bloque de 2-3 segundos**. Si pones "tracking + tilt + orbit" en 2 segundos, se confunde. Secuéncialos.

---

## 🔊 4. CONTROL DE AUDIO E IDIOMA

### Idioma de diálogos:
```
[LANGUAGE]: Spanish / Español.
```
Ponlo SIEMPRE. Sin esto Grok usa inglés por defecto.

### Capas de audio:

| Situación | Comando |
|-----------|---------|
| Solo ambiente | `Audio: Ambient sound only (wind, birds, footsteps). NO music. NO narration.` |
| Diálogo limpio | `Audio: Clear dialogue in Spanish. Mute background music.` |
| Efectos de impacto | `Audio: High-fidelity SFX (explosions, metal, glass). NO music.` |
| Silencio total | `Audio: Complete silence.` |
| Sin música (SIEMPRE en esta película) | `No music. No soundtrack.` |

### 💡 Tip:
- Si NO pones "No music", Grok AÑADE música genérica automáticamente.
- Especifica los sonidos que SÍ quieres: `Sound: footsteps on cobblestone, distant dog barking, wind.`
- Para diálogos: pon el texto entre comillas y di el idioma: `The man shouts in Spanish: "¡¡CORRED!!"`.

---

## 📎 5. IMÁGENES DE REFERENCIA DE PERSONAJES (Character Consistency)

Para que Grok NO invente rasgos y mantenga al personaje CONSISTENTE entre escenas, sube las character sheets y referencialas en el prompt.

### Cómo funciona:
1. **Genera primero la Character Sheet** del personaje (imagen con múltiples vistas sobre fondo verde)
2. **Sube la Character Sheet** como imagen de referencia junto con cada prompt de vídeo o imagen
3. **Referencia al personaje en el prompt** usando el formato `@[NOMBRE]`

### Formato de referencia en el prompt:

```
[ACTION DETAILS]: El protagonista @[IMAGEN AITOR ARMADURA] aterriza en la calle
con un impacto dorado. El monstruo @[IMAGEN COLMILLO] retrocede ante la luz.
```

O dentro del timeline:

```
[00:00-00:03]: Aitor (@[IMAGEN AITOR ARMADURA]) se levanta del cráter. 
               Colmillo (@[IMAGEN COLMILLO]) salta desde el tejado hacia él.
[00:03-00:06]: Aitor esquiva. Colmillo aterriza donde él estaba.
```

### Ventajas:
- **Grok "mira" la imagen subida** en vez de inventar un diseño genérico
- **El personaje mantiene la misma cara, armadura y colores** entre clips
- **Los monstruos no cambian de forma** entre escenas

### Qué subir en cada clip:

| Situación | Qué subir |
|-----------|-----------|
| Escena con Aitor de civil | Imagen base de la escena + Character Sheet Aitor fútbol + Fotos reales cara |
| Escena con Aitor armadura | Imagen base + Character Sheet Aitor armadura + Fotos reales cara |
| Escena de pelea vs Colmillo | Imagen base + CS Aitor armadura + CS Colmillo + Fotos cara |
| Escena de pelea vs Titán | Imagen base + CS Aitor armadura + CS Titán + Fotos cara |
| Escena de pelea vs Noctis | Imagen base + CS Aitor armadura + CS Noctis + Fotos cara |
| Escena con los 3 monstruos | Imagen base + CS Aitor + CS Colmillo + CS Titán + CS Noctis |

### 💡 Tips:
- **Sube las fotos reales de la cara** del personaje (frente + perfil) siempre que aparezca → Grok mantiene sus rasgos faciales
- **Añade "match face exactly from uploaded reference"** en el prompt para reforzarlo
- **Si un personaje sale mal** en un clip, regenera — a veces Grok necesita 2-3 intentos para captar bien la referencia
- **Para extensiones** ("Extend from Frame"), la última frame ya contiene al personaje, así que Grok lo mantiene mejor. Aun así, sube las character sheets por si acaso.

### Ejemplo completo con referencias:

```
[STYLE]: Pixar-quality 3D animation, 8K, cinematic 16:9, 24fps.
[DURATION]: 10 seconds.
[CAMERA]: Low Angle Shot with Orbit 180°.
[LANGUAGE]: Spanish / Español.

[TIMELINE]:
[00:00-00:03]: Aitor (@[IMAGEN AITOR ARMADURA]) se levanta del cráter. 
               Puño deja marca dorada en el suelo. Chispas doradas.
[00:03-00:06]: Cámara gira 180° mostrando la armadura. Detrás: 
               Colmillo (@[IMAGEN COLMILLO]) agazapado en un tejado.
               Titán (@[IMAGEN TITÁN]) avanzando al fondo.
               Noctis (@[IMAGEN NOCTIS]) flotando a la derecha.
[00:06-00:10]: Noctis señala a Aitor. Colmillo SALTA hacia él. 
               Aitor no retrocede. Aura dorada ESTALLA. FREEZE.

[ACTION DETAILS]: Calle de Motril destruida. Aitor es un niño de 11 años 
con armadura carmesí y dorada — match face exactly from uploaded reference photos.
[AUDIO]: Impact sounds, stone cracking, golden energy hum. NO music.
[NEGATIVE]: No blurry faces, no extra limbs, no flickering lighting, 
no text or watermarks.
```

---

## 🎨 6. ESTILOS VISUALES

| Estilo | Prompt clave |
|--------|-------------|
| **Pixar / Disney** (el nuestro) | `Disney-Pixar 3D animation, 8K, subsurface scattering, expressive eyes, vibrant colors, global illumination, cinematic 16:9.` |
| Anime moderno | `Modern high-end anime, Studio Mappa style, cel-shading, dynamic particles, cinematic lighting.` |
| Sci-Fi realista | `Photorealistic sci-fi, cinematic realism, 35mm lens, worn metal textures, anamorphic lens flares.` |
| Cyberpunk | `Cyberpunk neon aesthetic, high contrast, wet pavement reflections, volumetric fog, teal and orange.` |
| Realismo cine | `Cinematic realism, shot on 35mm film, natural lighting, high texture detail.` |

---

## ❌ 6. NEGATIVE PROMPTING (Siempre al final)

Añade SIEMPRE esto al final de cada prompt para evitar errores comunes de Grok:

```
[NEGATIVE]: No blurry faces, no extra limbs, no flickering lighting, no text or watermarks, no morphing between frames, no floating objects unless specified, no characters appearing or disappearing without reason.
```

### Negatives específicos por situación:

| Problema | Negative |
|----------|----------|
| Caras borrosas | `No blurry faces, no distorted facial features.` |
| Extremidades extra | `No extra limbs, no extra fingers, no body deformations.` |
| Parpadeo de luz | `No flickering lighting, no light inconsistency between frames.` |
| Texto basura | `No text, no watermarks, no logos, no letters on screen.` |
| Gente sonriendo cuando no debe | `No smiling faces during panic scenes. All faces show fear and terror.` |
| Efectos mágicos no deseados | `No magical beams, no laser effects, no glowing auras unless specified.` |
| Meteoritos que parecen rayos | `No energy beams, no lasers. Real burning rocks with fire and smoke trails only.` |

---

## 🔄 7. CONTINUIDAD ENTRE CLIPS

Para que los clips encadenen bien usando "Extend from Frame":

### Prompt de extensión:
```
[CONTINUING FROM PREVIOUS CLIP]
Pixar-quality 3D animation, cinematic 16:9, 8K, 24fps. Continue from last frame.
[Describe solo lo que cambia / se mueve a partir de aquí]
```

### Reglas de continuidad:
- **Sube siempre la misma character sheet** del personaje en cada clip para que no cambie de aspecto.
- **El prompt de extensión NO redescribe la escena** — solo describe el MOVIMIENTO nuevo.
- **Usa "Continue from last frame"** como primera frase para que Grok entienda que es una continuación.
- **Si la cámara cambia de plano**: di explícitamente `Camera cuts to [new angle]` — si no, Grok intenta un movimiento continuo que sale raro.

---

## ⏱️ 8. TIMING — Cuánto cabe en cada segundo

Grok puede procesar aproximadamente esta cantidad de acción por segundo:

| Tipo de acción | Tiempo que necesita |
|----------------|-------------------|
| Personaje quieto, solo expresión facial | 1-2 segundos |
| Un movimiento simple (girarse, levantar brazo) | 2-3 segundos |
| Caminar / correr en línea recta | 2-4 segundos |
| Un impacto / explosión | 1-2 segundos |
| Transformación compleja (armadura, poder) | 4-6 segundos |
| Pelea con 2 personajes | 3-4 segundos por intercambio de golpes |
| Multitud corriendo | 2-3 segundos |
| Flash/resplandor de luz | 0.5-1 segundo |

### 💡 Regla de oro:
**1 acción principal por cada 2-3 segundos.** Si metes 3 acciones en 2 segundos, Grok se salta alguna o las mezcla mal.

---

## 📋 9. CHECKLIST PRE-GENERACIÓN

Antes de darle a "Generar" en Grok, revisa:

- [ ] ¿He subido la imagen base correcta?
- [ ] ¿He subido las character sheets de TODOS los personajes que aparecen en este clip?
- [ ] ¿He subido las fotos reales de cara (frente + perfil) si aparece Aitor?
- [ ] ¿He referenciado a los personajes con @[IMAGEN X] en el prompt?
- [ ] ¿He puesto "match face exactly from uploaded reference" para las caras?
- [ ] ¿El prompt empieza con el estilo? (`Pixar-quality 3D animation, cinematic 16:9, 8K, 24fps.`)
- [ ] ¿He especificado la cámara? (`[CAMERA]: ...`)
- [ ] ¿He especificado el idioma? (`[LANGUAGE]: Spanish`)
- [ ] ¿He puesto "No music. No soundtrack."?
- [ ] ¿Hay máximo 1 acción principal por cada 2-3 segundos?
- [ ] ¿El prompt tiene negative prompting al final?
- [ ] ¿Los diálogos están en español entre comillas?
- [ ] ¿He descrito expresiones faciales explícitamente? (terror, alegría, etc.)

---

## 🎬 10. EJEMPLO COMPLETO — Escena de Pánico

```
[STYLE]: Pixar-quality 3D animation, cinematic 16:9, 8K, 24fps.
[DURATION]: 10 seconds.
[CAMERA]: Static Extreme Wide Shot from balcony → Tilt Up to sky (at 0:03) → Static (0:06-0:10).
[LANGUAGE]: Spanish / Español.

[TIMELINE]:
[00:00-00:03]: Calle tranquila de noche. La gente pasea. Un corgi ladra al cielo. Nadie le hace caso.
[00:03-00:05]: Cámara sube al cielo. Tres bolas de fuego reales (rocas ardiendo con estelas de fuego) caen desde distintos puntos del cielo.
[00:05-00:07]: Las bolas de fuego crecen y se acercan. Un adolescente señala y dice: "¡Mirad! ¡Estrellas fugaces!" Las caras pasan de sonrisas a TERROR al ver que se acercan.
[00:07-00:10]: Impactos. Flashes de luz. Onda expansiva. Cristales estallan. La gente corre hacia cámara con caras de PÁNICO ABSOLUTO — ojos abiertos, bocas gritando, cejas levantadas. Un hombre grita: "¡¡CORRED!!" FREEZE.

[ACTION DETAILS]: Calle de pueblo mediterráneo con bar de tapas, farmacia, frutería. Gente normal de noche. Los meteoritos son ROCAS ARDIENDO reales, no luces mágicas.
[AUDIO]: Street ambiance → corgi barking → teenager dialogue → woman fearful dialogue → explosions → screaming → man shouting → silence. NO music. All dialogue in Spanish.
[NEGATIVE]: No blurry faces, no extra limbs, no flickering lighting, no text or watermarks, no smiling faces during panic (0:07-0:10), no magical beams or lasers.
```

---

## 🔧 11. SOLUCIÓN DE PROBLEMAS COMUNES

| Problema | Causa | Solución |
|----------|-------|----------|
| Los meteoritos parecen rayos/lásers | Grok interpreta "fireball" como energía mágica | Añade: `Real burning rocks with fire and smoke trails. NOT magical lights, NOT beams, NOT lasers.` |
| La gente sonríe cuando debería estar asustada | Grok pone expresiones neutras por defecto | Añade: `TERRIFIED faces — wide eyes, open screaming mouths, raised eyebrows. NO smiling.` |
| Un efecto aparece EN la calle en vez de DETRÁS de los edificios | El prompt dice "flash" y Grok lo pone en primer plano | Cambia a: `reflected light on the building walls only — the impact is BEHIND the buildings, out of frame.` |
| El personaje cambia de aspecto entre clips | No se ha subido la character sheet | Sube SIEMPRE la character sheet como referencia en cada clip. |
| Demasiadas cosas pasan y Grok se salta algunas | Prompt sobrecargado | Máximo 1 acción principal por cada 2-3 segundos. Simplifica. |
| La cámara se mueve raro | Demasiados movimientos de cámara juntos | 1 movimiento de cámara por bloque de 2-3 seg. Secuéncialos. |
| Los diálogos salen en inglés | No se ha especificado idioma | Añade `[LANGUAGE]: Spanish` y pon diálogos: `says in Spanish: "¡texto!"` |
| Grok añade música que no quiero | No se ha negado explícitamente | Añade `No music. No soundtrack.` Y en audio: `NO music.` |

---

*Guía creada para el proyecto "Aitor — El Meteorito de Motril" · Optimizada para Grok Imagine Video · Abril 2026*
