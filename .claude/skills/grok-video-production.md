---
description: Manual profesional para crear videos con Grok Video. Usar cuando se generen escenas, prompts de video, o se planifique la estructura de clips. Reglas de produccion para clips principales (10s) y extensiones (6s).
---

# Manual de Produccion para Grok Video

## Tipos de clips

### Clip principal (10 segundos)
- Siempre requiere una imagen base nueva
- Se usa cuando: nueva escena, cambio de plano/angulo, cambio de ubicacion, nueva accion importante
- Necesita: [STYLE], [DURATION], [CAMERA], [REFERENCES], [CONSISTENCY], [TIMELINE], [AUDIO], [NEGATIVE]

### Extension (6 segundos)
- Siempre usa [CONTINUING FROM PREVIOUS CLIP]
- Se sube el ultimo frame del clip anterior
- Se usa cuando: la camara continua, la accion es continuacion directa, no hay cambio de plano
- Maximo 1 extension por imagen base. Nunca dos extensiones seguidas.

## Estructura para 60 segundos
4-6 clips principales (10s) + 4-6 extensiones (6s) = 60-72 segundos

## Bloque de consistencia (OBLIGATORIO en todos los prompts)
```
[CONSISTENCY - CRITICAL]:
- Exact same characters from reference images.
- [Nombre]: [descripcion fisica completa: edad, pelo, ropa, accesorios]
- Mantener exactamente la misma cara, proporciones, ropa, iluminacion, sombras.
- No face drift. No body morphing. No cambios de ropa. No cambios de proporciones.
```

## Plantilla clip principal (10s)
```
[STYLE]: {estilo del proyecto}, 8K, cinematic 16:9, 24fps, highly detailed.
[DURATION]: 10 seconds.
[CAMERA]: {plano inicial} (0:00-0:03) → {movimiento} (0:03-0:07) → {plano final} (0:07-0:10).
[REFERENCES]: @[IMAGEN_PERSONAJE1] + @[IMAGEN_PERSONAJE2] + @[IMAGEN_FONDO]
[CONSISTENCY - CRITICAL]: {bloque de consistencia}
[TIMELINE]:
[00:00-0:03]: {accion 1 con personajes por nombre}
[00:03-0:07]: {accion 2 con interaccion}
[00:07-0:10]: {accion 3 + FREEZE}
[AUDIO]: {config audio}. NO music (a menos que se indique).
[NEGATIVE]: No face drift, no sudden position changes, no abrupt camera cuts, no text on screen.
```

## Plantilla extension (6s)
```
[CONTINUING FROM PREVIOUS CLIP]
[STYLE]: {mismo estilo}, 8K, cinematic 16:9, 24fps.
[DURATION]: 6 seconds.
[CAMERA]: Direct continuation of the previous camera movement.
[REFERENCES]: Same as previous clip.
[CONSISTENCY - CRITICAL]: Same as previous clip.
[TIMELINE]:
[00:00-0:03]: Direct continuation of the last second of the previous clip.
[00:03-0:06]: {nueva accion + FREEZE}
[AUDIO]: Continuacion natural del audio anterior.
```

## Reglas de generacion de escenas
1. Para un video de N segundos, calcular: clips = ceil(N / 16) (10s + 6s por par)
2. Alternar: clip principal (10s) → extension (6s) → clip principal (10s) → ...
3. Nunca dos extensiones seguidas
4. Cada clip principal = nueva escena con nueva imagen base
5. Cada extension = continuacion de la escena anterior (scene_type: 'extension')
6. El timeline de cada escena debe nombrar personajes por nombre
7. FREEZE al final de cada bloque de timeline
8. Bloque de consistencia incluido en cada prompt con prompt_snippet de cada personaje
