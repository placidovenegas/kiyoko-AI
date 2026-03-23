# CUESTIONARIO KIYOKO AI — Analisis Completo para Plan de Implementacion

**Objetivo:** Responder TODAS estas preguntas para crear el plan de implementacion definitivo.
**Formato:** Responde debajo de cada pregunta. Se sincero y detallado.

---

## BLOQUE 1: VISION Y MODELO DE NEGOCIO

### 1.1 Quien usa Kiyoko AI?
- Quien es el usuario principal? (freelance, agencia, productora, creador de contenido, empresa)
- Nivel tecnico del usuario? (sabe editar video, no sabe nada, termino medio)
- Cuantos usuarios tendra el equipo tipico? (1 persona, 2-5, mas?)
- El usuario final es quien paga o hay un "cliente" que recibe el resultado?

### 1.2 Modelo de negocio
- Sera freemium (gratis + planes de pago)?
- Que limites tiene el plan gratuito? (proyectos, videos, escenas, IA)
- Cuantos planes de pago? Que precios orientativos?
- Cobramos por uso (creditos de IA) o por suscripcion plana?
- Hay plan para agencias/empresas con multiples usuarios?

### 1.3 Colaboracion
- Pueden dos personas editar el mismo proyecto a la vez?
- Que roles hay? (propietario, editor, viewer, cliente)
- El "cliente" (quien recibe el video) puede ver y aprobar el storyboard?
- Hay sistema de comentarios en escenas? Aprobacion por escena?
- El cliente puede ver el video final sin tener cuenta?

### 1.4 Compartir
- Se puede compartir un proyecto con link publico (sin login)?
- Se puede compartir solo el storyboard? Solo el video final? Ambos?
- Hay link de preview para cliente con password?
- Se puede exportar como PDF/HTML para enviar por email?

---

## BLOQUE 2: ESTRUCTURA DEL PROYECTO

### 2.1 Jerarquia
```
PREGUNTA: Confirma esta jerarquia:

Proyecto (carpeta del cliente/campana)
├── Recursos compartidos (personajes, fondos)
├── Video 1 "Spot YouTube 75s"
│   ├── Escenas del video 1
│   ├── Arco narrativo del video 1
│   └── Timeline del video 1
├── Video 2 "Reel Instagram 30s"
│   ├── Escenas (algunas copiadas del video 1)
│   └── ...
├── Video 3 "TikTok 15s"
└── ...
```
- Es correcto? Algo falta?
- Cada video tiene su propia duracion objetivo, plataforma y aspect ratio?
- Las escenas PERTENECEN a un video o son compartidas entre videos?
- Si copio una escena del video 1 al video 2, que pasa si edito la original?
  - a) Se actualiza en ambos (referencia)
  - b) Son independientes (copia)
  - c) El usuario elige que tipo de copia

### 2.2 Videos dentro de un proyecto
- Cuantos videos puede tener un proyecto? (limite?)
- Cada video tiene su propia fecha de publicacion programada?
- Los videos tienen estados? (borrador, en progreso, revision, aprobado, publicado)
- Se puede duplicar un video completo para adaptarlo a otra plataforma?
- Hay vista calendario para ver cuando se publica cada video?

### 2.3 Escenas
- Una escena puede existir sin pertenecer a ningun video (pool global)?
- Se pueden reordenar escenas con drag & drop?
- Se puede dividir una escena en dos? Fusionar dos en una?
- Las escenas tienen versionado (historico de cambios)?

---

## BLOQUE 3: COMO SE CREA EL CONTENIDO (antes de esta herramienta)

### 3.1 Flujo actual sin Kiyoko
- Como creas los videos hoy? (describe el proceso paso a paso)
- Que herramientas usas actualmente? (Premiere, After Effects, Canva, CapCut...)
- Cuanto tiempo tardas en crear un video de 60s?
- Quien escribe el guion? Tu o el cliente?
- Quien genera las imagenes? Con que herramientas? (Midjourney, DALL-E, Flux...)
- Quien genera los videos animados? (Runway, Kling, Pika...)
- Donde guardas los assets? (Drive, Dropbox, carpetas locales)

### 3.2 Flujo ideal con Kiyoko
- Como deberia ser el proceso con Kiyoko? (paso a paso ideal)
- Quieres poder hacer TODO dentro de Kiyoko o algunas cosas fuera?
- Que es lo mas tedioso que quieres automatizar?
- Que es lo que NUNCA debe hacer la IA sin tu aprobacion?

---

## BLOQUE 4: INTELIGENCIA ARTIFICIAL

### 4.1 Generacion de texto (guion, narracion, prompts)
- La IA escribe el guion completo o solo ayuda?
- La narracion (voz en off) va en el prompt del video directamente?
  - Es decir: cuando generas un video con Runway/Kling, le pasas el texto de lo que se dice?
  - O la narracion es un audio separado que se superpone despues?
- Los prompts de imagen/video SIEMPRE en ingles?
- Quieres que la IA traduzca automaticamente la narracion al ingles para el prompt?
- El usuario puede escribir en espanol y la IA genera el prompt en ingles?

### 4.2 Generacion de imagenes
- Que providers de imagen quieres soportar? (DALL-E, Midjourney, Flux, Leonardo, SD)
- El usuario sube imagenes propias o solo genera con IA?
- Quieres poder editar imagenes (crop, ajustes, inpainting)?
- Hay un estilo visual por proyecto (Pixar, realista, anime...)?
- Consistencia de personajes entre escenas: como se resuelve?

### 4.3 Generacion de video
- Que providers de video? (Runway, Kling, Pika, Minimax, Luma)
- El video se genera a partir de una imagen + prompt?
- Cada escena genera un clip de 3-10 segundos?
- Despues hay que juntar los clips en un video final?
- El audio (narracion, musica) se anade al juntar los clips?

### 4.4 Narracion y voz
- DECISION CLAVE: La narracion (texto hablado) va:
  - a) Como audio separado (generado con ElevenLabs) que se superpone al video
  - b) Incluida en el prompt del video para que el personaje "hable"
  - c) Ambas opciones segun la escena (unas con voz en off, otras con dialogo)
- Si es audio separado, se genera POR ESCENA o como AUDIO COMPLETO del video?
- Si es por escena, cada clip de video tiene su audio sincronizado?
- Si es audio completo, como se sincroniza con los cortes de escena?

### 4.5 Musica y sonido
- Hay musica de fondo? Se genera con IA o se sube?
- Hay efectos de sonido? (ambiente, foley)
- La musica se gestiona por escena o por video completo?

---

## BLOQUE 5: EL STORYBOARD

### 5.1 Que informacion tiene cada escena?
```
Confirma o modifica esta lista:
- Titulo
- Descripcion (lo que pasa)
- Prompt de imagen (ingles)
- Prompt de video (ingles)
- Imagen generada
- Video generado
- Narracion/dialogo (texto que se dice)
- Duracion (segundos)
- Fase del arco (hook/build/peak/close)
- Tipo de escena (original/nueva/filler/video)
- Angulo de camara
- Movimiento de camara
- Iluminacion
- Mood
- Audio (silente/ambiente/musica/dialogo/voiceover)
- Personajes que aparecen
- Fondo/localizacion
- Notas del director
```

### 5.2 Vistas del storyboard
- Que vistas necesitas? (compacto, expandido, timeline, arco, grid)
- La vista timeline debe ser proporcional al tiempo real?
- La vista arco agrupa escenas por fase (hook/build/peak/close)?
- Quieres poder ver el video completo como slideshow?

### 5.3 Edicion
- Se puede editar todo inline en el storyboard o hay pagina de detalle?
- El chat de IA puede modificar escenas directamente?
- Quieres poder deshacer cambios (ctrl+z / historial)?
- Hay auto-guardado o boton de guardar?

---

## BLOQUE 6: EL EDITOR DE VIDEO (futuro)

### 6.1 Funcionalidad
- El editor junta los clips de video de cada escena en un video final?
- Se puede recortar/trimear clips?
- Se puede cambiar el orden de los clips?
- Se anade la narracion como pista de audio?
- Se anade musica de fondo como pista de audio?
- Se puede poner texto/titulos sobre el video?
- Se pueden hacer transiciones (fade, dissolve)?
- El editor es en el navegador o se exporta para editar fuera?

### 6.2 Export
- Formatos de export? (MP4, WebM, GIF)
- Resoluciones? (720p, 1080p, 4K)
- Aspect ratios? (16:9, 9:16, 1:1, 4:5)
- Se puede exportar solo el storyboard sin video? (PDF, HTML)
- Se puede exportar el guion como texto?

---

## BLOQUE 7: PAGINAS Y NAVEGACION

### 7.1 Que paginas necesita la app?
```
Confirma o modifica:
1. Dashboard (lista de proyectos)
2. Proyecto > Overview (resumen)
3. Proyecto > Videos (lista de videos del proyecto)
4. Proyecto > Video > Storyboard (escenas del video)
5. Proyecto > Video > Narracion (guion + audio)
6. Proyecto > Recursos (personajes + fondos)
7. Proyecto > Tareas (kanban)
8. Proyecto > Exportar
9. Proyecto > Ajustes
10. Proyecto > Video > Editor (futuro)
11. Settings global (API keys, perfil, billing)
12. Pricing (publica)
```

### 7.2 El chat de IA
- El chat es un panel lateral que se abre desde cualquier pagina?
- El chat puede modificar datos del proyecto (escenas, personajes)?
- El chat muestra "planes de accion" que el usuario aprueba antes de ejecutar?
- El chat deberia sugerir cosas proactivamente?

---

## BLOQUE 8: PRIORIDADES

### 8.1 Que es lo MAS IMPORTANTE ahora?
Ordena del 1 (mas urgente) al 10 (menos):
- [ ] Multi-video (proyecto con videos dentro)
- [ ] Storyboard mejorado (edicion, vistas, drag&drop)
- [ ] Generacion de imagenes integrada
- [ ] Generacion de video integrada
- [ ] Narracion / guion
- [ ] Editor de video en navegador
- [ ] Sistema de tareas (kanban)
- [ ] Colaboracion (compartir, roles, comentarios)
- [ ] Billing (planes de pago)
- [ ] Mejoras de UX (diseño, accesibilidad, mobile)

### 8.2 Que puedes hacer SIN Kiyoko hoy?
- Que partes del proceso ya haces fuera y no necesitas urgentemente?
- Que NO puedes hacer sin Kiyoko?

### 8.3 Deadline
- Hay fecha limite para tener algo funcional?
- Cual seria el "MVP minimo" que necesitas YA?

---

## INSTRUCCIONES

1. Responde TODAS las preguntas en este mismo archivo
2. Se lo mas detallado posible
3. Si no sabes algo, pon "NO SE — decidir despues"
4. Si algo no aplica, pon "NO APLICA"
5. Cuando termines, haremos el plan de implementacion basado en tus respuestas

---

*Cuestionario generado el 19 Marzo 2026 — Kiyoko AI*
