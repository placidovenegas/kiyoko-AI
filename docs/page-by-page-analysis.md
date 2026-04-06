# Kiyoko AI — Análisis Página por Página

> Análisis detallado de cada página: qué muestra, cómo se ve la IA, toasts, y cómo mejorarla.
> Abril 2026

---

## Índice
1. [Dashboard](#1-dashboard)
2. [Proyecto Overview](#2-proyecto-overview)
3. [Video Overview (Storyboard)](#3-video-overview)
4. [Scene Detail](#4-scene-detail)
5. [Timeline](#5-timeline)
6. [Narración](#6-narración)
7. [Análisis](#7-análisis)
8. [Exportar](#8-exportar)
9. [Compartir](#9-compartir)
10. [Personajes Lista](#10-personajes-lista)
11. [Personaje Detalle](#11-personaje-detalle)
12. [Fondos](#12-fondos)
13. [Fondo Detalle](#13-fondo-detalle)
14. [Estilos Visuales](#14-estilos-visuales)
15. [Templates](#15-templates)
16. [Publicaciones](#16-publicaciones)
17. [Tareas](#17-tareas)
18. [Settings Modal](#18-settings-modal)
19. [Landing Page](#19-landing-page)
20. [Chat IA (KiyokoChat)](#20-chat-ia)
21. [Toasts](#21-sistema-de-toasts)
22. [Search Modal](#22-search-modal)
23. [Notificaciones](#23-notificaciones)

---

## 1. Dashboard

**URL:** `/dashboard`

**Qué muestra:**
- Saludo personalizado ("Buenas tardes, Desarrollador")
- 4 stat cards compactos (Proyectos, Tareas, Tokens, En progreso)
- Búsqueda + filtros (Todos/En progreso/Completados/Archivados/Favoritos)
- Grid de ProjectCards
- Sidebar: Asistente IA (3 acciones), Resumen workspace (4 mini-stats), Cola de foco

**IA en esta página:**
- Asistente IA con 3 acciones: Resumen operativo, Detectar bloqueos, Priorizar
- Al pulsar, se abre modal con resultado (no llama API real, usa datos locales)
- ❌ No hay generación real — los resultados son calculados localmente

**Toasts:**
- ✅ `toast.success('Proyecto creado')` al crear proyecto
- ✅ `toast.success('Proyecto eliminado')` al eliminar
- ✅ `toast.success('Proyecto duplicado')` al duplicar

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| IA real en asistente | Llamar a `/api/ai/chat` con contexto del dashboard | ALTA |
| Acciones del asistente | Los resultados deben poder ejecutar acciones ("Crear tarea X") | MEDIA |
| Progreso global | Barra de progreso: "3 de 16 escenas con prompts" | MEDIA |
| Atajos de teclado | "N" para nuevo proyecto, "T" para nueva tarea | BAJA |

---

## 2. Proyecto Overview

**URL:** `/project/[shortId]`

**Qué muestra:**
- Header: cover thumbnail + título + status badge + Ajustes
- 4 stats: Videos, Escenas, Personajes, Fondos
- Producción en curso: lista de videos con estado
- Preparación IA: checklist 4/4 (briefing, reglas, presets, personajes)
- Acciones rápidas: Tareas, Recursos, Asistente IA, Config IA

**IA en esta página:**
- Checklist "Preparación para IA" muestra si el proyecto está listo
- Botón "Asistente IA" → abre chat sidebar
- ❌ No hay acciones IA directas en esta página

**Toasts:**
- ✅ Al cambiar status de video
- ✅ Al eliminar/duplicar video

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| "Generar todo con IA" | Botón que genera escenas + prompts para todos los videos | ALTA |
| Progreso visual | % completado por video (cuántas escenas tienen prompts) | ALTA |
| IA inline | "Sugerir mejoras" en el checklist de preparación IA | MEDIA |
| Cover upload | Subir cover image del proyecto desde esta página | MEDIA |

---

## 3. Video Overview (Storyboard)

**URL:** `/project/[shortId]/video/[videoShortId]`

**Qué muestra:**
- Header: título, plataforma, duración, aspect ratio, status
- 4 stats: Escenas, Aprobadas, Duración objetivo, Duración actual
- Arco narrativo (barra de colores)
- 3 tabs: Storyboard / Compacto / Timeline
- Storyboard: cards horizontales con toda la info de cada escena
- Quick links: Timeline, Narración, Análisis, Exportar

**IA en esta página:**
- ✅ "Generar prompts" por escena (llama API real)
- ✅ "Generar todos los prompts" (batch, llama API secuencialmente)
- ✅ "Chat IA" por escena (abre sidebar con contexto)
- ❌ "Auto-planificar" no implementado

**Toasts:**
- ✅ `toast.success('Prompts generados')` al generar
- ✅ `toast.error('Error al generar')` en error
- ✅ `toast.success('Prompt copiado')` al copiar
- ✅ `toast.success('Todos los prompts copiados')` en bulk copy
- ✅ `toast.success('Chat IA abierto para escena #N')` al abrir chat

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| Auto-planificar | "Generar escenas con IA" desde el brief del proyecto | ALTA |
| Drag-and-drop | Reordenar escenas arrastrando | ALTA |
| Progreso visual | Indicador de qué escenas tienen prompt vs cuáles no | ALTA |
| Bulk status change | Cambiar estado de múltiples escenas a la vez | MEDIA |
| Filtros | Filtrar escenas por fase (hook/build/peak/close) | MEDIA |
| Toast loading | `toast.loading('Generando prompts...')` con progreso | MEDIA |

---

## 4. Scene Detail

**URL:** `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]`

**Qué muestra:**
- Top bar: ← Escenas, #N título, status badge, ← → navegación
- Izquierda: Descripción, Cámara, Audio config, Personajes, Fondos, Notas
- Derecha: Prompt imagen (editable), Preview imagen, Prompt video (editable), Clips, Diálogo, Timeline entry

**IA en esta página:**
- ✅ "Generar con IA" para prompts (llama API)
- ✅ Loading spinner mientras genera
- ❌ "Mejorar prompt" no conectado
- ❌ No se puede hablar con IA sobre esta escena específica (el botón "Chat IA" está en el storyboard, no aquí)
- ❌ No se pueden añadir personajes/fondos (solo se muestra "+ Añadir" como texto)

**Toasts:**
- ✅ `toast.success('Prompts generados')` al generar
- ✅ `toast.success('Prompt copiado')` al copiar
- ✅ `toast.success('Ambos prompts copiados')` al copiar ambos
- ✅ `toast.success('Escena actualizada')` al guardar cambios
- ✅ `toast.success('Cámara actualizada')` al cambiar cámara

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Selector personajes** | Dropdown con todos los personajes del proyecto para añadir | CRÍTICO |
| **Selector fondos** | Dropdown con todos los fondos del proyecto para añadir | CRÍTICO |
| **Chat IA aquí** | Botón "Chat sobre esta escena" que abra sidebar con contexto completo | ALTA |
| **Subir imagen** | Drag&drop para subir imagen generada | ALTA |
| **Subir clip** | Drag&drop para subir video clip generado | ALTA |
| **Mejorar prompt** | Botón que llame a `/api/ai/improve-prompt` | ALTA |
| **Múltiples opciones** | Al generar, mostrar 2-3 opciones y elegir | ALTA |
| **Editar timeline entry** | Textarea para editar el desglose segundo a segundo | MEDIA |
| **Duplicar escena** | Botón rápido para duplicar esta escena | MEDIA |
| **Preview side-by-side** | Prompt vs imagen generada lado a lado | MEDIA |
| **Toast loading** | `toast.loading('Generando...')` con spinner mientras la IA trabaja | MEDIA |

---

## 5. Timeline

**URL:** `/project/[shortId]/video/[videoShortId]/timeline`

**Qué muestra:**
- Leyenda de fases del arco (Hook, Build, Peak, Close, CTA)
- Barra horizontal con escenas proporcionales por duración
- Lista de escenas con tiempos (0:00-0:05, 0:05-0:10, etc.)

**IA en esta página:**
- ❌ No hay IA — es solo visualización

**Toasts:** Ninguno

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Generar arco con IA** | Botón "Generar arco narrativo" → llama `/api/ai/generate-arc` | ALTA |
| **Editar arcos** | Click en arco para cambiar fase, duración | MEDIA |
| **Generar timeline entries** | "Generar desglose temporal" → `/api/ai/generate-timeline` | ALTA |
| **Click en escena** | Al hacer click en barra → abrir scene detail | MEDIA |
| **Drag resize** | Arrastrar bordes de escenas para cambiar duración | BAJA |

---

## 6. Narración

**URL:** `/project/[shortId]/video/[videoShortId]/narration`

**Qué muestra:**
- Toggle: Por escenas / Continuo
- Voz: nombre, proveedor, velocidad slider, estilo
- Texto narración: textarea editable + word count
- Audio: player con play/pause/seek + download MP3

**IA en esta página:**
- ✅ "Generar con IA" para texto narración (llama API)
- ✅ "Generar audio TTS" (llama API con ElevenLabs)
- ❌ Cambiar voz no funciona (botón stub)
- ❌ Voxtral TTS no conectado (provider creado pero no integrado)
- ❌ Modo continuo no conecta con API de generación

**Toasts:**
- ✅ `toast.success('Narración guardada')` al guardar
- ✅ `toast.success('Audio generado')` al generar TTS
- ✅ `toast.error('Error al generar')` en errores

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Selector de voz** | Modal con lista de voces disponibles, preview audio | ALTA |
| **Voxtral TTS** | Integrar como opción de TTS ($0.016/1K chars) | ALTA |
| **Clonar voz** | Subir audio de referencia → generar con esa voz | MEDIA |
| **Sync check** | Verificar que duración narración = duración escena | MEDIA |
| **Preview por escena** | Generar audio escena por escena, no solo todo | MEDIA |
| **Subir video → narración** | Subir video → IA genera texto narración en off | MEDIA |

---

## 7. Análisis

**URL:** `/project/[shortId]/video/[videoShortId]/analysis`

**Qué muestra:**
- Score gauge (82/100)
- Resumen del video
- Stats: fortalezas, debilidades, sugerencias
- Cards por categoría con escenas afectadas
- Botón "Re-analizar"

**IA en esta página:**
- ✅ "Re-analizar" llama API
- ✅ "Aplicar" sugerencia llama API
- ❌ Los resultados del análisis son estáticos (de la DB, no en tiempo real)

**Toasts:**
- ✅ `toast.success('Análisis completado')` al analizar
- ✅ `toast.success('Sugerencia aplicada')` al aplicar
- ✅ `toast.error(...)` en errores

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Auto-análisis** | Analizar automáticamente cuando todas las escenas tienen prompts | MEDIA |
| **Análisis por escena** | Score individual por escena (no solo video completo) | MEDIA |
| **IA explicativa** | Click en sugerencia → IA explica por qué y cómo mejorar | BAJA |
| **Comparación** | Antes/después de aplicar sugerencia | BAJA |

---

## 8. Exportar

**URL:** `/project/[shortId]/video/[videoShortId]/export`

**Qué muestra:**
- Copiar Prompts (botón grande + E1-E16 individuales)
- Formatos: JSON ✅, Markdown ✅, HTML ✅
- Próximamente: PDF ❌, MP3 ❌, ZIP ❌

**IA en esta página:**
- ❌ No hay IA directa

**Toasts:**
- ✅ `toast.success('Prompts copiados')` al copiar
- ✅ `toast.success('Archivo descargado')` al exportar

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **PDF export** | Storyboard visual con imágenes y prompts | ALTA |
| **MP3 export** | Concatenar narración de todas las escenas | MEDIA |
| **ZIP completo** | Todo junto: JSON + MD + HTML + imágenes + audio | MEDIA |
| **Formato Grok** | Exportar prompts optimizados para Grok/Flow | ALTA |
| **Preview** | Ver preview del export antes de descargar | BAJA |

---

## 9. Compartir

**URL:** `/project/[shortId]/video/[videoShortId]/share`

**Qué muestra:**
- Lista de links compartidos
- Crear nuevo link (token, password, anotaciones)
- Copiar link, eliminar link
- View count por link

**IA:** ❌ No hay IA

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Preview compartido** | Ver cómo se ve la página pública | MEDIA |
| **Anotaciones** | Sistema de comentarios en escenas compartidas | BAJA |

---

## 10. Personajes Lista

**URL:** `/project/[shortId]/resources/characters`

**Qué muestra:**
- 3 metric cards (Elenco, Con referencia, Listos para escena)
- Tabla: Avatar, Nombre, Rol, Referencia, Prompt, Escenas, Imágenes
- Botones: "Copiar todos los prompts" + "Nuevo personaje"

**IA en esta página:**
- ❌ No hay generación IA desde esta página
- ✅ Copiar prompts funciona

**Toasts:**
- ✅ `toast.success('Prompt copiado')` al copiar
- ✅ `toast.success('Todos los prompts copiados')` al copiar todos
- ✅ `toast.success('Personaje eliminado')` al eliminar

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Generar con IA** | "Describe un personaje" → IA genera nombre, descripción, prompt | ALTA |
| **Bulk generate** | Generar prompt snippets para todos sin prompt | MEDIA |
| **Search/filter** | Buscar personajes por nombre o rol | MEDIA |
| **Drag reorder** | Reordenar personajes arrastrando | BAJA |

---

## 11. Personaje Detalle

**URL:** `/project/[shortId]/resources/characters/[charId]`

**Qué muestra:**
- Header: avatar 64px + nombre + rol badge
- Izquierda: info básica, prompt snippet editable, AI prompt, turnaround prompt
- Derecha: galería de imágenes, reglas de consistencia, escenas donde aparece

**IA en esta página:**
- ✅ "Generar con IA" para prompt snippet
- ✅ "Copiar" prompt
- ❌ Turnaround generator no conectado
- ❌ No se puede generar imagen de referencia desde aquí

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Upload reference image** | Drag&drop para subir imagen de referencia | ALTA |
| **Generar turnaround** | Botón que genera las 6 vistas del personaje | MEDIA |
| **Análisis de consistencia** | IA compara imagen en diferentes escenas | BAJA |

---

## 12-15. Fondos, Estilos, Templates

Similar a Personajes. Falta:
- Upload de imágenes de referencia
- Generación IA de prompt snippets
- Bulk copy prompts

---

## 16. Publicaciones

**URL:** `/project/[shortId]/publications`

**Qué muestra:**
- Grid de cards: plataforma, título, status, hashtags, fecha, tipo

**IA:** ❌ No hay IA

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Preview mockup** | Ver cómo se ve el post en Instagram/TikTok/YouTube | ALTA |
| **IA captions** | Generar caption + hashtags optimizados por plataforma | ALTA |
| **Calendario** | Vista calendario real (no solo lista) | MEDIA |
| **Análisis IA** | "¿Cómo mejorar este post?" | MEDIA |

---

## 17. Tareas

**URL:** `/project/[shortId]/tasks`

**Qué muestra:**
- Lista de tareas con priority dots, categorías, fechas, status
- "Nueva tarea" botón

**IA:** ❌ No hay IA directa (la IA puede crear tareas desde el chat)

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Auto-crear tareas** | IA analiza proyecto y sugiere tareas pendientes | MEDIA |
| **Checklist template** | Checklist estándar de producción (pre-prod, prod, post-prod) | MEDIA |

---

## 18. Settings Modal

**Qué muestra:**
- Perfil, Preferencias, Notificaciones, Seguridad
- Proveedores IA (API keys)
- Suscripción

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Test de API key** | Al guardar API key, testear que funcione | ALTA |
| **Provider status** | Mostrar qué proveedores están activos/caídos | MEDIA |
| **Usage dashboard** | Gráfico de uso de tokens por día/semana | BAJA |

---

## 19. Landing Page

**Qué muestra:**
- Hero con título, CTA, features
- Pricing, testimonials

**Cómo mejorar:**
| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Demo interactivo** | Storyboard de ejemplo que el visitante pueda explorar | MEDIA |
| **Video showcase** | Video de 30s mostrando el flujo de la app | MEDIA |

---

## 20. Chat IA (KiyokoChat)

**Cómo funciona:**
- Panel lateral derecho, redimensionable
- 10 agentes especializados
- Detecta intents del mensaje del usuario
- Puede crear/editar cualquier entidad
- Historial de conversaciones guardado en DB

**Cómo se integra por página:**

| Página | Contexto enviado | Agente activo | Acciones disponibles |
|--------|-----------------|---------------|---------------------|
| Dashboard | Stats generales | router | Crear proyecto, listar |
| Proyecto | Project ID, videos, personajes | project | Crear video/personaje/fondo, editar proyecto |
| Video | Video ID, escenas, arcos | editor | Crear/editar escenas, generar prompts |
| Escena (storyboard) | Scene ID, prompts, cámara | scenes | Editar escena, mejorar prompt |
| Personajes | Character list | characters | Crear/editar personaje |
| Fondos | Background list | backgrounds | Crear/editar fondo |

**Cómo mejorar:**

| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Contexto completo de escena** | Al abrir chat desde escena, enviar: prompt actual, cámara, audio config, personajes, fondo | CRÍTICO |
| **Acciones directas** | "Cambia ángulo a cenital" → ejecuta sin pedir confirmación | ALTA |
| **Sugerencias contextuales** | Al abrir, mostrar 3 chips: "Mejorar prompt", "Cambiar cámara", "Añadir personaje" | ALTA |
| **Resultado visual** | Cuando genera prompt, mostrarlo con botón "Copiar" y "Aplicar" | ALTA |
| **Historial por escena** | Conversaciones vinculadas a scene_id | MEDIA |
| **Modo rápido** | Chat inline en Scene Detail (no sidebar separado) | MEDIA |
| **Multi-idioma** | Responder en el idioma del usuario | BAJA |

---

## 21. Sistema de Toasts

**Implementación actual:**
- Librería: Sonner v2
- Posición: `bottom-center`
- Estilo: glassmorphism (`bg-card/95 backdrop-blur-xl`)
- Variantes: success, error, warning, info, loading, ai, upload

**Uso actual:**

| Variante | Dónde se usa | Ejemplo |
|----------|-------------|---------|
| `toast.success()` | 25+ lugares | "Proyecto creado", "Prompt copiado" |
| `toast.error()` | 15+ lugares | "Error al guardar", "No tienes permiso" |
| `toast.loading()` | 3 lugares | Al generar prompts |
| `toast.warning()` | 0 lugares | No se usa |
| `toast.info()` | 0 lugares | No se usa |
| `toast.ai()` | 0 lugares | Creado pero no implementado |
| `toast.upload()` | 0 lugares | Creado pero no implementado |

**Cómo mejorar:**

| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Toast de IA** | Usar `toast.ai('Kiyoko está pensando...')` cuando la IA trabaja | ALTA |
| **Toast con progreso** | `toast.loading('Generando 3/16...')` para batch operations | ALTA |
| **Toast de upload** | `toast.upload('Subiendo imagen...')` con barra de progreso | MEDIA |
| **Toast con acción** | `toast.success('Prompt generado', { action: { label: 'Copiar', onClick } })` | MEDIA |
| **Toast warning** | Usar para: "Escena sin personajes", "Prompt muy corto" | MEDIA |
| **Duración** | Toasts de success: 3s, error: 5s, loading: hasta completar | BAJA |

---

## 22. Search Modal (Cmd+K)

**Cómo funciona:**
- Búsqueda client-side en items recientes (localStorage)
- Filtros: Todo, Proyectos, Videos, Escenas
- Navegación rápida: Dashboard, Publicaciones, Tareas, Ajustes
- Preview panel derecho con metadata

**Cómo mejorar:**

| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Server-side search** | Buscar en Supabase (full-text en títulos y descripciones) | ALTA |
| **Buscar en prompts** | Poder buscar dentro del texto de los prompts | MEDIA |
| **Buscar personajes** | Añadir personajes y fondos a los resultados | MEDIA |
| **Acciones rápidas** | "Crear proyecto", "Nueva escena" directamente desde el search | BAJA |

---

## 23. Notificaciones

**Cómo funciona:**
- Bell icon en header con unread count
- Popover con lista de notificaciones
- Realtime via Supabase channels
- Mark as read / mark all

**Cómo mejorar:**

| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Notificaciones automáticas** | "Prompts generados para escena #3" cuando la IA termina | ALTA |
| **Notificaciones de estado** | "Video 'Presentación' tiene todas las escenas listas" | MEDIA |
| **Email notifications** | Resumen semanal por email | BAJA |

---

## Resumen de prioridades

### CRÍTICO (hacer primero)
1. Selector de personajes/fondos en Scene Detail
2. Chat contextual completo (enviar toda la info de la escena)

### ALTA (hacer pronto)
3. Conectar 7 APIs al frontend (botones que llamen las APIs)
4. Subir imágenes/clips en Scene Detail
5. Auto-planificar escenas con IA
6. Toast de IA + toast con progreso
7. Preview mockup de publicaciones
8. PDF export

### MEDIA (siguiente sprint)
9. Voxtral TTS
10. Drag-and-drop para reordenar escenas
11. Server-side search
12. Notificaciones automáticas
13. Múltiples opciones de prompts
14. Análisis de imagen → mejora prompt video

### BAJA (futuro)
15. Drag resize en timeline
16. Email notifications
17. Demo interactivo en landing
18. Multi-idioma en chat

---

*Generado por Claude Code — Abril 2026*
