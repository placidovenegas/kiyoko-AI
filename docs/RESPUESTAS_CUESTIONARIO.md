# RESPUESTAS AL CUESTIONARIO — Kiyoko AI

**Fecha:** 19 Marzo 2026
**Respondido por:** Placido Venegas

---

## BLOQUE 1: VISION Y NEGOCIO

- **Usuario principal:** Todos — freelances, agencias, productoras. La app debe servir para todos.
- **Nivel tecnico:** Mixto — habra usuarios sin experiencia y expertos. La app se adapta.
- **Equipo:** Ambos — algunos trabajan solos, otros en equipo (2-5 personas).
- **Quien paga:** El usuario paga y usa. (De momento no hay flujo de "cliente externo" que aprueba).
- **Modelo de negocio:** Freemium + creditos. Plan gratis limitado + planes de pago + creditos extra para IA.
- **Colaboracion:** Si, en tiempo real (tipo Google Docs). Dos personas ven cambios del otro en vivo.
- **Compartir:** Todas las opciones: link publico, con password, y entre usuarios registrados.

## BLOQUE 2: ESTRUCTURA

- **Jerarquia:** Proyecto > Videos > Escenas. Confirmado.
- **Copiar escenas:** Siempre duplicado independiente. Editar una no afecta a la otra.
- **Videos por proyecto:** Segun plan (gratis 1-2, Pro 10, Business ilimitado).
- **Calendario:** La fecha de publicacion va ligada a TAREAS. Se crea una tarea "subir video" con fecha y aviso.

## BLOQUE 3: FLUJO ACTUAL

- **Proceso actual:** Brief > IA lo genera todo. Le da un brief a ChatGPT/Claude, genera guion y prompts, los pasa a los generadores externos.
- **Imagenes:** Usa Flow de Google (Imagen 3 via Gemini/AI Studio).
- **Video:** Usa Grok o Gemini para generar video.
- **Editor:** Quiere poder editar en Kiyoko (tipo CapCut) PERO tambien poder editar fuera si quiere. Exportar clips para usar en otro editor.

## BLOQUE 4: IA Y NARRACION

### DECISION CLAVE — Dos tipos de narracion:

**Tipo A: Dialogos en camara**
- El texto de lo que dicen los personajes va DENTRO del prompt del video.
- Si el usuario marca "dialogos" en una escena, escribe el dialogo en espanol.
- Al generar/guardar, la IA lo traduce y lo mete en el prompt del video (ingles).
- Asi Runway/Kling genera el video con los personajes "hablando".

**Tipo B: Voz en off (narracion)**
- Se genera el guion completo de narracion (texto que lee un narrador externo).
- Se genera audio con ElevenLabs.
- El audio se superpone al video en el editor.
- NO va en el prompt del video.

### Prompts doble idioma:
- Prompt de imagen/video: SIEMPRE en ingles (para los generadores).
- Descripcion en espanol: la IA genera tambien una descripcion en el idioma del usuario para que entienda que dice el prompt.

### Musica: Ambas opciones — subir propia o generar con IA.

## BLOQUE 5: STORYBOARD

### Vistas:
1. **Compacto (lista)** — lista vertical con thumbnails
2. **Timeline (proporcional)** — barra horizontal con duracion real
   - ENCIMA del timeline: marcadores del arco narrativo (gancho, presentacion, etc.) con lineas que muestran de donde a donde llega cada fase
   - Poder añadir escenas desde el timeline
   - Poder redimensionar/mover escenas en el timeline
3. **Grid (cuadricula)** — thumbnails grandes para ver imagenes
4. ~~Arco narrativo como vista separada~~ — ELIMINADO, se integra en el timeline

## BLOQUE 6: EDITOR DE VIDEO

- **Prioridad:** Importante pero no urgente.
- **Funcionalidad:** Completo tipo CapCut:
  - Timeline multi-pista (video, audio narracion, audio musica)
  - Cortar/trimear clips
  - Transiciones (fade, dissolve, slide)
  - Separar audio de video
  - Quitar/añadir audios
  - Cambiar velocidad de escenas
  - Texto overlay / titulos
  - Exportar como MP4

## BLOQUE 7: PRIORIDADES

1. **Multi-video funcional** (Proyecto > Videos > Escenas, copiar entre videos)
2. **Storyboard con vistas** (compacto, timeline con arco, grid)
3. **Generacion de prompts con IA** (que se puedan copiar y llevar a generadores externos)
4. MVP = "Poder crear escenas, que la IA genere los prompts, y copiarlos para generar fuera"

**Deadline:** Lo antes posible.

---

## RESUMEN DE DECISIONES CLAVE

| Decision | Resultado |
|----------|-----------|
| Jerarquia | Proyecto > Videos > Escenas |
| Copiar escenas | Siempre duplicado independiente |
| Narracion tipo A | Dialogos en camara = texto va en prompt de video |
| Narracion tipo B | Voz en off = audio separado con ElevenLabs |
| Prompts | Siempre ingles + descripcion en idioma del usuario |
| Editor | Tipo CapCut, importante pero no urgente |
| Arco narrativo | Se integra en timeline, no es vista separada |
| Colaboracion | Tiempo real |
| Modelo | Freemium + creditos |
| MVP | Crear escenas > IA genera prompts > copiar para usar fuera |
| IA | Proactiva: chat + botones inline + sugerencias automaticas |
| Control IA | Configurable: el usuario elige si pide aprobacion o actua directo |
| Historial | Todo: actividad + versiones + IA + undo completo |

---

## BLOQUE EXTRA: IA

- **Donde esta la IA:** Proactiva. Chat lateral + botones inline + sugiere sin que lo pidas.
- **Control:** Configurable en ajustes (pedir aprobacion vs actuar directo).
- **Historial:** Todo junto — timeline + versiones + IA + undo completo.

## ESTADO DE LA BASE DE DATOS

31 tablas. scenes tiene 55 columnas. video_cuts (legacy) tiene 2 registros.
**Campos que FALTAN en scenes:** `description_es`, `dialogue_text`.
**Tabla que MIGRAR:** `video_cuts` > `videos`, `video_cut_scenes` > `video_scenes`.
