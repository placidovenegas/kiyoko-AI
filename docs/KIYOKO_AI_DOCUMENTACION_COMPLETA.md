# Kiyoko AI — Documentacion Tecnica y Funcional Completa

**Fecha:** 18 marzo 2026
**Version:** 1.0 (estado actual del sistema)
**Stack tecnologico:** Next.js 16.1 · Supabase (PostgreSQL 17) · Tailwind CSS v4 · Vercel AI SDK 6 · Zustand · TypeScript estricto

---

## Indice

1. [Que es Kiyoko AI](#1-que-es-kiyoko-ai)
2. [Mapa completo de paginas](#2-mapa-completo-de-paginas)
3. [Sistema de navegacion](#3-sistema-de-navegacion)
4. [Chat IA — El cerebro del sistema](#4-chat-ia--el-cerebro-del-sistema)
5. [Sistema de proveedores de IA](#5-sistema-de-proveedores-de-ia)
6. [Acciones de la IA sobre la base de datos](#6-acciones-de-la-ia-sobre-la-base-de-datos)
7. [Edicion manual de contenido](#7-edicion-manual-de-contenido)
8. [Base de datos completa](#8-base-de-datos-completa)
9. [Gestion de estado (Zustand)](#9-gestion-de-estado-zustand)
10. [Tiempo real (Realtime)](#10-tiempo-real-realtime)
11. [API Routes](#11-api-routes)
12. [Renderizado de mensajes del chat](#12-renderizado-de-mensajes-del-chat)
13. [Sistema multi-video](#13-sistema-multi-video)
14. [Seguridad y autenticacion](#14-seguridad-y-autenticacion)
15. [Exportacion](#15-exportacion)

---

## 1. Que es Kiyoko AI

Kiyoko AI es una plataforma de produccion de storyboards y videos publicitarios con inteligencia artificial integrada. Permite a un equipo creativo:

- Crear proyectos de video con asistente IA paso a paso
- Gestionar escenas, personajes, fondos, arcos narrativos y timelines
- Usar un chat IA que analiza y **modifica directamente** la base de datos del proyecto
- Generar multiples versiones de video (YouTube, Instagram, TikTok) desde el mismo material
- Exportar en 4 formatos (HTML, JSON, Markdown, PDF)
- Conectar con 8 proveedores de IA diferentes con fallback automatico

El sistema esta disenado para que un director creativo pueda decirle a la IA "quita a Jose de las escenas donde no deberia estar" y la IA analice todas las escenas, proponga un plan de cambios, y lo ejecute tras aprobacion del usuario — con posibilidad de deshacer.

---

## 2. Mapa Completo de Paginas

### 2.1 Paginas Globales

#### `/dashboard` — Panel de Proyectos
- **Que muestra:** Grid de todos los proyectos del usuario con cards que incluyen titulo, cliente, estilo, estado, barra de progreso y thumbnail
- **Barra de stats:** Proyectos totales, escenas totales, proyectos activos
- **Filtros:** Por estado (Todos, En progreso, Completados, Archivados)
- **Busqueda:** Por titulo o nombre de cliente (tiempo real)
- **Ordenacion:** Recientes, Nombre A-Z, Mas progreso
- **Acciones:** Click en proyecto navega a su overview, boton "Nuevo Proyecto"

#### `/new` — Asistente de Creacion (Wizard IA de 5 pasos)
1. **Brief:** El usuario describe el proyecto en texto libre. La IA extrae titulo, descripcion, cliente
2. **Estilo visual:** Seleccion entre Pixar, Realistic, Anime, Watercolor, Flat 2D, Cyberpunk, Custom
3. **Duracion:** Slider de 15s a 180s (incrementos de 5s). Seleccion de plataforma (YouTube, Instagram Reels, TikTok, TV, Web)
4. **Personajes:** Descripcion libre. La IA parsea nombres, roles, descripciones visuales y personalidades
5. **Localizaciones:** Descripcion libre. La IA parsea fondos con tipo (interior/exterior), hora del dia, y descripciones

Al completar: crea el proyecto + personajes + fondos en Supabase y navega a `/project/{slug}`

#### `/organizations` — Gestion de Organizaciones
- Lista de organizaciones (personal/team) con busqueda
- Contador de proyectos por org
- Cambiar org activa, crear nueva

#### `/settings` — Perfil de Usuario
- Campos editables: nombre completo, email, idioma (ES/EN), tema (System/Light/Dark), avatar
- Avatar subido a Supabase Storage

#### `/settings/api-keys` — Gestion de Proveedores de IA
- **Banner de estado del servidor:** Muestra que providers estan activos globalmente con dots verde/amarillo
- **Lista de 8 providers de texto** con estado por cada uno:
  - Dot verde: activo (key del servidor o del usuario)
  - Dot amarillo pulsante: en cooldown con timer "vuelve en 45s"
  - Dot gris: sin API key
  - Badge "GRATIS" o "PREMIUM"
- **Formulario para anadir key:** Input password con toggle ver/ocultar, boton "Probar" (verifica validez), boton "Guardar" (cifra AES-256)
- **Links directos** a la consola de cada provider para obtener key gratis
- **Nota de seguridad:** Las keys se cifran con AES-256-GCM antes de guardar

### 2.2 Paginas de Proyecto

#### `/project/[slug]` — Overview del Proyecto
- **Hero:** Cover image (o gradiente fallback), titulo, cliente, estado, estilo, plataforma
- **4 cards de stats:** Escenas (% completadas), Personajes, Fondos, Duracion (actual vs objetivo)
- **Quick actions:** "Ir al Storyboard" (primario), "Chat IA", "Exportar"
- **Grid 2 columnas:** Info del proyecto (cliente, estilo, generador, estado, barra progreso) + Actividad reciente (5 escenas mas recientes con thumbnails)

#### `/project/[slug]/storyboard` — Storyboard Visual (pagina principal de trabajo)
- **Vista de cards:** Cada escena como card con imagen/placeholder, numero, titulo, tipo, duracion
- **2 modos de vista:** Collapsed (compact grid) y Expanded (detalle completo)
- **Filtros combinados:** Por tipo (original/improved/new/filler/video) Y por fase (hook/build/peak/close)
- **Busqueda:** Por titulo o scene_number
- **Edicion inline:** Click en card → expande con todos los campos editables
- **IA Sidebar:** Panel lateral para mejorar/reescribir prompts de imagen con IA
- **Insertar escenas:** Menu para insertar entre escenas existentes (manual o generado por IA)
- **Panel de historial:** Ver cambios recientes del proyecto
- **Chat IA integrado:** Panel derecho redimensionable

#### `/project/[slug]/scenes` — Lista Detallada de Escenas
- **Cards expandibles:** Click para expandir con todos los campos:
  - Imagen generada (upload drag & drop, eliminar, re-subir a Supabase Storage path `{projectId}/generated/images/{sceneId}.{ext}`)
  - Referencias requeridas
  - Descripcion narrativa completa
  - Prompt de imagen (bloque codigo con boton "Copiar")
  - Prompt de video (bloque codigo con boton "Copiar")
  - Lista de mejoras con badges de tipo
  - Detalles tecnicos: angulo de camara, movimiento, iluminacion, mood
- **Filtros:** Tipo de escena + Fase del arco (funcionan combinados)
- **Status badges:** draft, prompt_ready, generating, generated, approved, rejected

#### `/project/[slug]/characters` — Personajes
- **Cards por personaje:** Nombre, rol, descripcion (editables inline)
- **Imagen de referencia:** Upload con overlay de crop para posicionar avatar
- **Prompt snippet:** Texto copiable para usar en generacion de imagenes
- **Edicion inline:** Click en campo → input focused automaticamente

#### `/project/[slug]/backgrounds` — Fondos/Localizaciones
- **Cards por fondo:** Nombre, descripcion, tipo (Interior/Exterior/Mixto), hora (Amanecer/Manana/Dia/Hora Dorada/Atardecer/Noche)
- **Imagen de referencia:** Upload/eliminar
- **Prompt snippet:** Texto copiable

#### `/project/[slug]/arc` — Arco Narrativo
- **Barra temporal proporcional:** Visualiza las 4 fases con ancho proporcional a su duracion
- **4 cards de fase:** Hook (rojo), Build (naranja), Peak (verde), Close (azul)
- Cada card: titulo, descripcion, rango temporal (start_second → end_second), escenas incluidas (scene_numbers[])

#### `/project/[slug]/timeline` — Timeline/Secuencia
- **Tabs de version:** Full, 30s, 15s (filtra `timeline_entries` por `timeline_version`)
- **Lista de entradas:** Titulo, descripcion, start_time, end_time, duracion, fase del arco, color
- **Duracion total calculada** por version
- **Boton "Regenerar timeline IA"** (pendiente de implementar)

#### `/project/[slug]/analysis` — Diagnostico IA
- Analisis completo del proyecto via IA
- Resultados en 3 categorias: Fortalezas (verde), Advertencias (amarillo), Sugerencias (azul)
- Almacenados en tabla `project_issues`

#### `/project/[slug]/exports` — Exportacion
- **4 formatos:** HTML (storyboard interactivo), JSON (datos estructurados), Markdown (documento texto), PDF (para imprimir)
- **Historial:** Lista de exports previos con timestamp, formato, tamano de archivo, link de descarga
- **Versionado:** Campo `version` integer auto-incrementado

#### `/project/[slug]/references` — Mapas de Referencia
- Relaciones cruzadas escena ↔ personaje ↔ fondo
- Tabla `reference_maps` con prioridad y notas

#### `/project/[slug]/settings` — Ajustes del Proyecto
- Metadatos editables del proyecto

---

## 3. Sistema de Navegacion

### 3.1 Sidebar Principal (fuera de proyecto)

```
PLATAFORMA
├── Proyectos (/dashboard)         — Grid de todos los proyectos
├── Nuevo Proyecto (/new)          — Wizard de creacion con IA
└── Organizaciones (/organizations) — Gestionar orgs

FAVORITOS
└── [Lista dinamica de proyectos favoritos con estrella]

ADMIN (solo si role = admin)
└── Usuarios (/admin/users)        — Gestionar usuarios del sistema

CUENTA
├── Ajustes (/settings)            — Perfil personal
└── API Keys (/settings/api-keys)  — Gestionar proveedores de IA

FOOTER
└── [Avatar] Nombre del usuario    — Info de la cuenta
```

### 3.2 Sidebar de Proyecto (dentro de /project/[slug])

```
PROYECTO
├── Overview        — Dashboard del proyecto
├── Storyboard      — Vista visual principal
├── Diagnostico     — Analisis IA
├── Arco Narrativo  — Estructura de 4 fases
├── Escenas         — Lista detallada editable
├── Personajes      — Cards de personajes
├── Fondos          — Cards de localizaciones
├── Timeline        — Secuencia temporal
├── Referencias     — Mapas cruzados
├── Chat IA         — Chat a pantalla completa
├── Exportar        — 4 formatos de export
└── Ajustes         — Config del proyecto
```

### 3.3 Header (barra superior, presente en todas las paginas)

De izquierda a derecha:

| Elemento | Tipo | Funcion |
|----------|------|---------|
| ← Volver / Sidebar toggle | Boton | Navegar atras o toggle sidebar |
| Org Switcher | Dropdown con busqueda | Cambiar organizacion activa. Lista filtrable, check en actual, crear nueva |
| / | Separador visual | — |
| Project Switcher | Dropdown con busqueda | Cambiar proyecto. Lista de 20 mas recientes filtrable, check en actual, crear nuevo |
| ★ Favorito | Toggle | Anadir/quitar proyecto de favoritos (solo visible dentro de un proyecto) |
| Feedback | Boton | Abre dialogo para enviar issue/idea |
| Search ⌘K | Boton | Abre Command Menu global (busqueda de proyectos, paginas, acciones) |
| IA Provider | Dropdown | Lista de 8 providers con: dot de estado (verde/amarillo/gris), nombre, modelo, badge (Tu key/Gratis/Premium), timer de cooldown, check en seleccionado |
| Tema ☀/🌙 | Toggle | Cambia entre light/dark mode (persiste en localStorage) |
| Chat 💬 | Toggle | Abre/cierra el panel de chat IA lateral |
| User | Dropdown | Avatar, nombre, email, rol (Admin/Editor/Viewer), links a Perfil, API Keys, Panel Admin, Cerrar sesion |

---

## 4. Chat IA — El Cerebro del Sistema

### 4.1 Donde aparece y como se abre

El chat tiene **3 modos** de visualizacion:

| Modo | Como se activa | Comportamiento |
|------|---------------|----------------|
| **Cerrado** | Estado por defecto | Solo el boton 💬 en el header |
| **Panel lateral** | Click en 💬 del header | Panel derecho, ancho inicial 560px, redimensionable de 400px a 1200px con drag handle. Height = 100% del area debajo del header. Position fixed — no se mueve con scroll |
| **Expandido** | Click en ▢ (maximize) dentro del panel | Ocupa TODO el area de contenido. El main content se oculta (no navega a otra pagina). Sidebar de historial aparece a la izquierda (260px) |

### 4.2 Estructura visual del chat

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│ 🤖 Kiyoko AI — [Nombre del proyecto]                     │
│              [📋 Historial] [+ Nuevo] [▢ Expand] [✕]     │
├─────────────────────────────────────────────────────────┤
│ VIDEO CUT SELECTOR (si hay multiples videos)             │
│ [🎬] [★ Spot YouTube 75s] [Reel 30s] [TikTok 15s]       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ESTADO VACIO (si no hay mensajes):                       │
│   [Icono grande de Kiyoko]                               │
│   "Kiyoko AI — Tu directora creativa"                    │
│   [Grid 2x2 de 8 Quick Actions]                          │
│                                                          │
│ MENSAJES (scroll independiente):                         │
│                                                          │
│ Usuario: "Revisa los personajes"              19:30      │
│                                                          │
│ 🤖 Kiyoko:                                               │
│   [Markdown renderizado: tablas, listas, code blocks]    │
│   [ActionPlanCard si hay plan de cambios]                │
│                                                          │
│ SUGERENCIAS (tras cada respuesta):                       │
│ [✨ chip 1] [✨ chip 2] [✨ chip 3]                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ STREAMING INDICATOR (cuando responde):                   │
│ ••• Groq respondiendo...                    [Detener]    │
├─────────────────────────────────────────────────────────┤
│ INPUT                                                    │
│ [ Preguntale a Kiyoko sobre "Domenech"...          ] [▶] │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Quick Actions — 8 acciones rapidas predefinidas

| # | Accion | Icono | Que prompt envia |
|---|--------|-------|-----------------|
| 1 | Revisar personajes | 👥 | "Revisa los personajes y dime si hay inconsistencias o mejoras posibles. Analiza sus descripciones visuales, reglas y apariciones." |
| 2 | Reducir escenas | ✂ | "Analiza todas las escenas y sugiere cuales eliminar, fusionar o acortar. Justifica cada sugerencia." |
| 3 | Ordenar timeline | 🕐 | "Revisa el orden de las escenas, los arcos narrativos y el timeline. Sugiere mejoras en la estructura." |
| 4 | Explicar proyecto | 📖 | "Explicame el proyecto completo: la historia, las escenas, los personajes, los fondos y el flujo narrativo." |
| 5 | Generar prompts | ✨ | "Genera prompts de imagen profesionales en ingles para todas las escenas que no tengan prompt. Incluye estilo, composicion y detalles." |
| 6 | Estado de la DB | 🗃 | "Dame un resumen del estado actual de la base de datos: cuantas escenas, personajes, fondos, problemas detectados y que falta por completar." |
| 7 | Mejorar paleta | 🎨 | "Analiza la paleta de colores del proyecto y sugiere mejoras basadas en el estilo visual y la plataforma objetivo." |
| 8 | Revisar issues | 📄 | "Revisa los problemas detectados en el proyecto (project_issues) y dame un plan para resolverlos." |

### 4.4 Flujo completo de un mensaje

```
1. Usuario escribe mensaje (o usa Quick Action)
   ↓
2. useKiyokoChat.sendMessage() se ejecuta
   ├── Lee preferredProvider de localStorage
   ├── Lee activeVideoCutId del store
   ├── Agrega mensaje del usuario al state
   ├── Crea AbortController (para poder cancelar)
   └── Hace fetch POST a /api/ai/chat con:
       { messages, projectId, preferredProvider, videoCutId }
   ↓
3. API Route /api/ai/chat (servidor):
   ├── Verifica auth (Supabase JWT)
   ├── Si hay projectId, carga EN PARALELO:
   │   ├── projects (metadatos)
   │   ├── scenes (28+ escenas con 47 campos cada una)
   │   ├── characters (4 con descripcion visual completa)
   │   ├── backgrounds (3 con tipo, hora, prompt)
   │   ├── narrative_arcs (6 fases)
   │   ├── timeline_entries (15 entradas)
   │   ├── project_issues (9 problemas)
   │   └── change_history (ultimos 30 cambios)
   ├── Construye system prompt (~3000-5000 tokens) con TODOS los datos
   ├── Si hay preferredProvider, lo mueve al frente de la cadena
   ├── Si preferredProvider no esta en servidor, busca key del usuario en DB y la descifra
   ├── Intenta cada provider en orden:
   │   ├── streamText() con maxRetries: 0
   │   ├── Lee primer chunk para verificar que funciona
   │   ├── Si falla → marca provider en cooldown → siguiente
   │   └── Si funciona → stream SSE al cliente
   └── Header X-AI-Provider: "groq" (indica que provider respondio)
   ↓
4. Cliente recibe SSE stream:
   ├── Lee header X-AI-Provider → muestra "Groq respondiendo..."
   ├── Parsea cada chunk: data: {"text": "..."}
   ├── Actualiza el mensaje del asistente en tiempo real (character by character)
   ├── Al finalizar:
   │   ├── Parsea JSON action_plan si existe (regex en ```json...```)
   │   ├── Parsea [SUGERENCIAS]...[/SUGERENCIAS] si existe
   │   └── Guarda conversacion en ai_conversations (INSERT o UPDATE)
   └── Muestra sugerencias como chips clickeables
   ↓
5. Si hay ActionPlan → renderiza ActionPlanCard:
   ├── Resumen del plan + numero de escenas afectadas
   ├── Lista de acciones con icono, target, campo viejo → nuevo
   ├── Warnings en amarillo
   ├── Botones: [Guardar cambios] [Modificar] [Cancelar]
   ↓
6. Usuario pulsa "Guardar cambios":
   ├── executeActionPlan() ejecuta cada accion en secuencia:
   │   ├── UPDATE/INSERT/DELETE en Supabase
   │   ├── Verifica con .select('id') que el cambio se aplico
   │   └── Retorna success/error por accion
   ├── Muestra resultado: "4/4 cambios aplicados" o errores
   └── Boton [Deshacer] aparece con el batchId
   ↓
7. Si usuario pulsa "Deshacer":
   └── undoBatch(batchId) revierte todos los cambios del batch
       en orden inverso usando change_history
```

### 4.5 Cancelacion y re-envio

| Situacion | Comportamiento |
|-----------|---------------|
| **Pulsar "Detener"** | AbortController.abort() → streaming para → respuesta parcial se mantiene |
| **Escribir nuevo mensaje mientras responde** | Al pulsar Enter: cancela el stream actual + envia el nuevo mensaje |
| **Provider falla** | Se intenta el siguiente automaticamente (el usuario no nota nada) |

### 4.6 Persistencia del chat

| Dato | Donde se guarda | Duracion |
|------|----------------|----------|
| Mensajes de la conversacion | `ai_conversations.messages` (JSONB) en Supabase | Permanente |
| Titulo de la conversacion | `ai_conversations.title` (primeros 80 chars del primer mensaje) | Permanente |
| Action plans ejecutados | Dentro del JSONB de mensajes (campo `executionResults`, `executedBatchId`) | Permanente |
| Conversacion activa (id) | Zustand store `conversationId` (memoria) | Sesion |
| Historial de conversaciones | Zustand store `conversations[]` (memoria, max 50) | Sesion (se recarga del server) |
| Provider seleccionado | `localStorage('kiyoko-ai-provider')` | Permanente (navegador) |
| Video cut activo | Zustand store `activeVideoCutId` (memoria) | Sesion |

**Al cambiar de proyecto:**
1. Se limpian mensajes, conversationId, suggestions, activeProvider
2. Se recargan conversaciones Y video cuts del nuevo proyecto en paralelo
3. Se auto-selecciona el video cut primario

---

## 5. Sistema de Proveedores de IA

### 5.1 Proveedores disponibles

| # | Provider | Modelo | Gratis | Contexto | Velocidad | Env Key | Obtener key |
|---|----------|--------|--------|----------|-----------|---------|-------------|
| 1 | **Groq** | LLaMA 3.3 70B | Si, ilimitado | 128K | ~300 tok/s | `GROQ_API_KEY` | console.groq.com/keys |
| 2 | **Mistral** | Mistral Large | Si, 1B tokens/mes | 128K | ~100 tok/s | `MISTRAL_API_KEY` | console.mistral.ai |
| 3 | **Gemini** | Gemini 2.0 Flash | Si, cuota limitada | 1M | ~150 tok/s | `GOOGLE_AI_API_KEY` | aistudio.google.com |
| 4 | **Cerebras** | LLaMA 3.1 8B | Si | 8K | ~2000 tok/s | `CEREBRAS_API_KEY` | cloud.cerebras.ai |
| 5 | **Grok** | Grok 3 Fast | Requiere creditos | 131K | ~200 tok/s | `XAI_API_KEY` | console.x.ai |
| 6 | **DeepSeek** | DeepSeek V3 | $0.14/M tokens | 128K | ~100 tok/s | `DEEPSEEK_API_KEY` | platform.deepseek.com |
| 7 | **Claude** | Sonnet 4 | $3/$15 M tokens | 200K | ~80 tok/s | `ANTHROPIC_API_KEY` | console.anthropic.com |
| 8 | **OpenAI** | GPT-4o Mini | $0.15/$0.60 M | 128K | ~100 tok/s | `OPENAI_API_KEY` | platform.openai.com |

### 5.2 Cadena de fallback

```
Groq → Mistral → Gemini → Cerebras → Grok → DeepSeek → Claude → OpenAI
```

Si el primer provider falla (cuota, error, timeout), automaticamente intenta el siguiente. El usuario solo ve "Groq respondiendo..." cambiar a "Mistral respondiendo...".

### 5.3 Tres fuentes de API keys

1. **Servidor (.env.local):** Keys del admin, disponibles para todos los usuarios
2. **Usuario (DB):** Keys propias guardadas en `/settings/api-keys`, cifradas AES-256
3. **Seleccion manual:** El usuario elige provider en el dropdown del Header

**Prioridad:** Si el usuario selecciona un provider → se intenta primero. Si no tiene key del servidor, se busca en la DB del usuario. Si tampoco hay → sigue con la cadena de fallback.

### 5.4 Sistema de cooldown

| Tipo de error | Tiempo de cooldown | Ejemplo |
|---------------|-------------------|---------|
| Rate limit (429) | Parseado del header `retry-after` + 5s buffer | Gemini: 45s |
| Auth/Billing (401/402/403) | 24 horas | Grok sin creditos, DeepSeek saldo 0 |
| Error generico | 3 minutos | Timeout, error de red |

Los cooldowns se almacenan en `globalThis` (sobreviven hot-reloads de Next.js en desarrollo). La UI del Header muestra "Cuota agotada · vuelve en 45s" con dot amarillo pulsante.

### 5.5 Contexto que recibe la IA

Cuando el usuario envia un mensaje dentro de un proyecto, el system prompt incluye **todos los datos del proyecto**:

```
═══ PROYECTO ═══
Titulo, descripcion, estilo, plataforma, duracion objetivo/estimada,
estado, % completado, paleta de colores, modo narracion, brief, reglas globales

═══ ESCENAS (28) ═══
Por cada escena: numero, titulo, ID, tipo, fase, duracion, estado,
descripcion (150 chars), personajes asignados, fondo,
camara (angulo/movimiento), iluminacion, mood,
si tiene prompt imagen/video, narracion, notas del director

═══ PERSONAJES (4) ═══
Por cada uno: nombre, ID, rol, color, descripcion, descripcion visual,
personalidad, ropa, pelo, reglas, en que escenas aparece

═══ FONDOS (3) ═══
Por cada uno: codigo, nombre, ID, tipo, hora, descripcion

═══ ARCOS NARRATIVOS (6) ═══
Numero, fase, titulo, segundo inicio-fin, escenas incluidas

═══ TIMELINE (15 entradas) ═══
Inicio-fin, titulo, duracion, fase

═══ PROBLEMAS DETECTADOS (9) ═══
Tipo, resuelto/pendiente, titulo, descripcion

═══ CAMBIOS RECIENTES (ultimos 30) ═══
Fecha, accion, entidad, descripcion

═══ 12 REGLAS DE COMPORTAMIENTO ═══
1. Siempre en espanol
2. Usar IDs reales de las entidades
3. Analisis exhaustivo
4. Siempre terminar con [SUGERENCIAS]
5. Mostrar action_plan JSON antes de ejecutar cambios
6. Tablas modificables: scenes, characters, backgrounds, narrative_arcs, timeline_entries, project_issues
7. Nunca ejecutar sin aprobacion
8. Detectar inconsistencias proactivamente
9. Analizar imagenes subidas
10. Formatear con Markdown
11. Ser concisa pero completa
12. Si no requiere cambios, responder normalmente
```

---

## 6. Acciones de la IA Sobre la Base de Datos

### 6.1 Tools disponibles (Vercel AI SDK)

La IA tiene acceso a estos tools definidos con schemas Zod:

| Tool | Parametros | Que hace |
|------|-----------|---------|
| `updateScene` | sceneId, changes{}, reason | Actualiza campos de una escena |
| `createScene` | title, description, sceneNumber, duration, type, promptImage?, promptVideo? | Crea escena nueva |
| `deleteScene` | sceneId, reason | Elimina una escena |
| `reorderScenes` | sceneOrder[{sceneId, newSortOrder}] | Reordena escenas |
| `createCharacter` | name, role?, description?, visualDescription?, personality?, clothing?, hair?, color? | Crea personaje |
| `updateCharacter` | characterId, changes{}, reason | Actualiza personaje |
| `deleteCharacter` | characterId, reason | Elimina personaje |
| `removeCharacterFromScene` | sceneId, characterId, reason | Quita personaje de escena |
| `addCharacterToScene` | sceneId, characterId | Anade personaje a escena |
| `createBackground` | name, code, description?, locationType?, timeOfDay?, promptSnippet? | Crea fondo |
| `updateBackground` | backgroundId, changes{}, reason | Actualiza fondo |
| `explainStoryboard` | format (summary/detailed/timeline) | Genera explicacion (sin cambios DB) |

### 6.2 Action Plan — Flujo de aprobacion

La IA **nunca** ejecuta cambios directamente. Siempre genera un plan JSON:

```json
{
  "type": "action_plan",
  "summary_es": "Ajustar escenas donde Jose aparece...",
  "actions": [
    {
      "id": "uuid",
      "type": "update_scene",
      "target": { "sceneId": "uuid", "sceneNumber": "E3" },
      "description_es": "Actualizar descripcion de E3",
      "changes": [
        { "field": "description", "oldValue": "texto viejo", "newValue": "texto nuevo" }
      ],
      "reason": "Jose debe liderar, no trabajar",
      "priority": 1
    }
  ],
  "total_scenes_affected": 4,
  "warnings": ["Revisar coherencia en escenas grupales"]
}
```

El componente `ActionPlanCard` renderiza esto visualmente con botones Guardar/Modificar/Cancelar.

### 6.3 Ejecucion y verificacion

Cada accion del plan se ejecuta individualmente con verificacion:

1. `supabase.from('scenes').update(changes).eq('id', sceneId).select('id').maybeSingle()`
2. Si `data` es null → la actualizacion no se aplico (error RLS o ID inexistente)
3. Se retorna `success: true/false` con mensaje de error descriptivo
4. El usuario ve "4/4 cambios aplicados" o "3/4 — 1 fallo: Escena no encontrada"

### 6.4 Sistema de Undo

Cada batch de acciones genera un `batchId` (UUID). Los cambios se registran en `change_history`:

- **UPDATE:** Se guarda campo, valor viejo, valor nuevo
- **DELETE:** Se guarda el registro completo como JSON en `old_value`
- **INSERT:** Se guarda el ID del nuevo registro

Al pulsar "Deshacer":
1. Se leen todas las entradas de `change_history` con ese `batch_id`
2. Se procesan en orden inverso (LIFO)
3. DELETEs se restauran (re-insert), INSERTs se eliminan, UPDATEs se revierten
4. Se elimina el batch de `change_history`
5. Se recalculan stats del proyecto

---

## 7. Edicion Manual de Contenido

### 7.1 Escenas (pagina /scenes)

| Campo | Tipo de edicion | Almacenamiento |
|-------|----------------|----------------|
| Imagen generada | Drag & drop o click → upload a Storage | `generated_image_url`, `generated_image_path` en `scenes` |
| Titulo | Inline text edit | `scenes.title` |
| Descripcion | Inline textarea | `scenes.description` |
| Prompt imagen | Bloque codigo (solo lectura + copiar) | `scenes.prompt_image` |
| Prompt video | Bloque codigo (solo lectura + copiar) | `scenes.prompt_video` |
| Tipo | Dropdown (original/improved/new/filler/video) | `scenes.scene_type` |
| Fase | Dropdown (hook/build/peak/close) | `scenes.arc_phase` |
| Duracion | Input numerico | `scenes.duration_seconds` |
| Camara | Seleccion de angulo + movimiento | `scenes.camera_angle`, `camera_movement` |

### 7.2 Personajes (pagina /characters)

| Campo | Tipo de edicion |
|-------|----------------|
| Nombre | Inline text input |
| Rol | Inline text input |
| Descripcion | Textarea |
| Imagen referencia | Upload + crop overlay para avatar |
| Prompt snippet | Texto editable |

### 7.3 Fondos (pagina /backgrounds)

| Campo | Tipo de edicion |
|-------|----------------|
| Nombre | Texto |
| Descripcion | Textarea |
| Tipo localizacion | Interior/Exterior |
| Hora del dia | Dropdown (6 opciones) |
| Imagen referencia | Upload/eliminar |
| Prompt snippet | Solo lectura + copiar |

---

## 8. Base de Datos Completa

### 8.1 Diagrama de relaciones

```
profiles (1) ←── (N) organizations via organization_members
profiles (1) ←── (N) projects via owner_id
profiles (1) ←── (N) user_api_keys
profiles (1) ←── (N) ai_usage_logs
profiles (1) ←── (N) feedback

projects (1) ←── (N) scenes
projects (1) ←── (N) characters
projects (1) ←── (N) backgrounds
projects (1) ←── (N) narrative_arcs
projects (1) ←── (N) timeline_entries
projects (1) ←── (N) project_issues
projects (1) ←── (N) ai_conversations
projects (1) ←── (N) change_history
projects (1) ←── (N) exports
projects (1) ←── (N) reference_maps
projects (1) ←── (N) video_cuts

video_cuts (1) ←── (N) video_cut_scenes
video_cuts (1) ←── (N) scenes (via scenes.video_cut_id)

scenes (1) ←── (N) timeline_entries
scenes (1) ←── (N) reference_maps
backgrounds (1) ←── (N) scenes (via scenes.background_id)
```

### 8.2 Tablas con campos clave

#### `scenes` — 47 campos (tabla mas compleja)

```
Identidad: id, project_id, video_cut_id, scene_number, title, scene_type, category
Narrativa: arc_phase, description, director_notes
Prompts: prompt_image, prompt_video, prompt_additions, improvements (JSONB)
Tiempo: duration_seconds, start_time, end_time, sort_order
Referencias: background_id, character_ids (UUID[]), required_references (text[])
Camara: camera_angle (10 opciones), camera_movement (11 opciones), camera_notes
Ambiente: lighting, mood, music_notes, sound_notes, music_suggestion, sfx_suggestion, music_intensity
Narracion: narration_text, narration_audio_url, narration_audio_duration_ms
Media: generated_image_url, generated_image_path, generated_image_thumbnail_url, generated_video_url, generated_video_path
Versionado: image_versions (JSONB), prompt_history (JSONB), style_version
Estado: status (6 valores enum), reference_tip
Meta: metadata (JSONB), notes, created_at, updated_at
```

#### `characters` — 23 campos

```
Identidad: id, project_id, name, initials, role, sort_order
Visual: description, visual_description, prompt_snippet, color_accent
Personalidad: personality, signature_clothing, hair_description, accessories[], signature_tools[]
Referencias: reference_image_url, reference_image_path, appears_in_scenes[]
Reglas IA: rules (JSONB), role_rules (JSONB), ai_notes
Meta: metadata (JSONB), created_at, updated_at
```

#### `projects` — 36 campos

```
Identidad: id, owner_id, organization_id, title, slug, description, client_name, client_logo_url
Estilo: style (7 enum), custom_style_description, color_palette (JSONB), style_version
Config: target_duration_seconds, target_platform (6 enum), status (5 enum), tags[]
IA: ai_brief, ai_analysis (JSONB), image_generator, image_generator_config (JSONB), video_generator, video_generator_config (JSONB), global_rules (JSONB)
Narracion: narration_mode, narration_config (JSONB), narration_full_text, narration_full_audio_url
Stats: total_scenes, total_characters, total_backgrounds, estimated_duration_seconds, completion_percentage
Media: thumbnail_url, cover_image_url, is_demo
Meta: created_at, updated_at
```

### 8.3 Enums de la base de datos

| Enum | Valores |
|------|---------|
| `user_role` | admin, editor, viewer, pending, blocked |
| `org_type` | personal, team |
| `org_role` | owner, admin, member |
| `project_style` | pixar, realistic, anime, watercolor, flat_2d, cyberpunk, custom |
| `project_status` | draft, in_progress, review, completed, archived |
| `target_platform` | youtube, instagram_reels, tiktok, tv_commercial, web, custom |
| `scene_type` | original, improved, new, filler, video |
| `scene_status` | draft, prompt_ready, generating, generated, approved, rejected |
| `arc_phase` | hook, build, peak, close |
| `camera_angle` | wide, medium, close_up, extreme_close_up, pov, low_angle, high_angle, birds_eye, dutch, over_shoulder |
| `camera_movement` | static, dolly_in, dolly_out, pan_left, pan_right, tilt_up, tilt_down, tracking, crane, handheld, orbit |
| `export_format` | html, json, markdown, pdf |
| `issue_type` | strength, warning, suggestion |

---

## 9. Gestion de Estado (Zustand)

### 9.1 Stores y que almacenan

| Store | Datos | Persistido | Donde |
|-------|-------|-----------|-------|
| **useKiyokoChat** | messages[], isStreaming, conversationId, projectId, conversations[], isExpanded, suggestions[], activeProvider, videoCuts[], activeVideoCutId | **No** (se recarga del servidor al montar) | Memoria |
| **useProjectStore** | currentProject, scenes[], characters[], backgrounds[], loading, error | **No** | Memoria |
| **useUIStore** | sidebarCollapsed, theme, scenesView, preferredAiProvider | **Si** | `localStorage('kiyoko-ui')` |
| **useAiProviderStore** | activeTextProvider, activeImageProvider, quotas{}, loading | **No** | Memoria |
| **useFilterStore** | sceneTypeFilter, arcPhaseFilter, backgroundFilter, characterFilter, searchQuery | **No** | Memoria |
| **useOrgStore** | currentOrgId | **Si** | `localStorage` |

### 9.2 Que es persistente vs temporal

| Dato | Tipo | Se pierde al recargar? |
|------|------|----------------------|
| Tema (light/dark) | localStorage | No |
| Provider preferido | localStorage | No |
| Sidebar collapsed | localStorage | No |
| Org seleccionada | localStorage | No |
| Mensajes del chat | Supabase DB | No |
| Historial de chats | Supabase DB | No |
| Escenas/personajes | Supabase DB | No |
| Mensajes en memoria | Zustand (RAM) | Si (se recarga de DB) |
| Streaming state | Zustand (RAM) | Si |
| Filtros de escenas | Zustand (RAM) | Si |
| Video cut activo | Zustand (RAM) | Si (se auto-selecciona primario) |
| Provider cooldowns | globalThis (servidor) | Si en produccion, No en dev (hot-reload) |

---

## 10. Tiempo Real (Realtime)

### 10.1 Estado actual

Existe un hook `useRealtimeProject(projectId)` que suscribe a cambios en 3 tablas via **Supabase Realtime** (WebSockets):

| Tabla | Eventos | Accion al recibir |
|-------|---------|-------------------|
| `scenes` | INSERT, UPDATE, DELETE | Actualiza `useProjectStore.scenes[]` |
| `characters` | INSERT, UPDATE, DELETE | Actualiza `useProjectStore.characters[]` |
| `backgrounds` | INSERT, UPDATE, DELETE | Actualiza `useProjectStore.backgrounds[]` |

**Filtro:** Solo cambios del proyecto actual (`project_id=eq.{projectId}`)

### 10.2 Limitacion actual

El **storyboard NO usa este hook** — usa `fetchAll()` manual tras mutaciones. Esto significa:
- Si la IA modifica escenas via el chat, el storyboard **no se actualiza en tiempo real**
- El usuario debe recargar la pagina para ver cambios hechos por la IA
- **Solucion pendiente:** Activar `useRealtimeProject` en el storyboard

### 10.3 Que SI es tiempo real

- La **respuesta del chat** se streama token a token (SSE)
- El **indicador de provider** se actualiza al recibir el primer chunk
- Las **conversaciones** se guardan en DB tras cada respuesta

---

## 11. API Routes

### 11.1 Chat y IA

| Metodo | Ruta | Request | Response |
|--------|------|---------|----------|
| POST | `/api/ai/chat` | `{ messages[], projectId?, preferredProvider?, videoCutId? }` | SSE stream + header `X-AI-Provider` |
| GET | `/api/ai/providers/status` | — | `{ providers[], activeTextProvider }` con status/cooldown/retry |
| POST | `/api/ai/generate-image` | `{ sceneId, prompt }` | `{ imageUrl }` |
| POST | `/api/ai/generate-project` | `{ brief, style, platform }` | Proyecto completo generado |
| POST | `/api/ai/generate-scenes` | `{ projectId, count }` | Escenas generadas |
| POST | `/api/ai/improve-prompt` | `{ prompt, style }` | Prompt mejorado |
| POST | `/api/ai/analyze-project` | `{ projectId }` | Analisis con issues |

### 11.2 Gestion de API Keys

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/user/api-keys` | Lista keys del usuario (solo hints, nunca la key completa) |
| POST | `/api/user/api-keys` | Anadir key: valida provider, cifra AES-256, guarda en DB |
| DELETE | `/api/user/api-keys/[id]` | Eliminar key |
| POST | `/api/user/api-keys/test` | Probar validez haciendo request de prueba al provider |

### 11.3 Exportacion

| Formato | Ruta | Que genera |
|---------|------|-----------|
| HTML | `/api/export/html` | Storyboard interactivo para navegador |
| JSON | `/api/export/json` | Datos estructurados (proyecto + escenas + personajes + fondos + arcos + timeline + issues) |
| Markdown | `/api/export/markdown` | Documento formateado con tablas |
| PDF | `/api/export/pdf` | Documento para imprimir |

### 11.4 Admin

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/admin/users` | Lista todos los usuarios (solo admin) |
| GET | `/api/admin/users/[id]` | Detalle de usuario |
| PATCH | `/api/admin/users/[id]` | Cambiar rol, estado, etc. |

---

## 12. Renderizado de Mensajes del Chat

### 12.1 Tecnologia

- **react-markdown** con plugin **remark-gfm** (GitHub Flavored Markdown)
- Componentes custom para cada elemento HTML
- `useMemo` para evitar re-parseos innecesarios

### 12.2 Elementos renderizados

| Elemento Markdown | Renderizado |
|-------------------|-------------|
| `# Heading 1` | text-base, font-bold, border-bottom |
| `## Heading 2` | text-sm, font-bold |
| `**bold**` | font-semibold, text-foreground |
| `*italic*` | italic, text-foreground/80 |
| Parrafos | text-[13px], leading-relaxed |
| Listas (ul/ol) | list-disc/decimal, pl-4 |
| `> blockquote` | border-l-2 primary/30, italic |
| `` `inline code` `` | bg-accent, text-primary, font-mono |
| Code blocks | Fondo oscuro, boton copiar, label de lenguaje |
| Links | text-primary, hover:underline, target=_blank |
| Tablas GFM | Scroll horizontal, zebra striping, hover, headers uppercase, dark/light CSS |
| Colores hex en tabla | Detecta `#RRGGBB` → muestra circulo de color + codigo |
| `---` separador | border-border/50 |

### 12.3 Estilos de tabla (CSS en globals.css)

Las tablas tienen estilos CSS dedicados que respetan dark/light mode:
- `.chat-table-wrap`: overflow-x auto, scrollbar fina personalizada
- `.chat-table thead`: fondo `surface-secondary` (light) o `surface-dark-tertiary` (dark)
- `.chat-table th`: uppercase, tracking-wider, font-weight 600
- `.chat-table td`: max-width 280px (wrap en celdas largas), vertical-align top
- Zebra: filas pares con fondo sutil diferente en dark/light
- Hover: fondo tertiary al pasar raton
- Responsive: en movil, fuente y padding reducidos

---

## 13. Sistema Multi-Video

### 13.1 Estado actual

- **Tablas creadas:** `video_cuts` y `video_cut_scenes` en la DB
- **Campo `scenes.video_cut_id`:** Permite escenas exclusivas de un video cut
- **Selector en chat:** Barra de chips para seleccionar video cut activo
- **Video "Principal"** creado automaticamente para proyectos existentes
- **`videoCutId` se envia al API** con cada mensaje del chat

### 13.2 Concepto

```
PROYECTO (Domenech Peluquerias)
├── Personajes: Jose, Conchi, Nerea, Raul  ← COMPARTIDOS
├── Fondos: Salon interior, Exterior       ← COMPARTIDOS
│
├── VIDEO: "Spot YouTube" (75s, 16:9)      ← Escenas propias
├── VIDEO: "Reel Instagram" (30s, 9:16)    ← Puede copiar escenas de otros
├── VIDEO: "TikTok Hook" (15s, 9:16)      ← Puede tener escenas exclusivas
└── VIDEO: "Story Reveal" (5s, 9:16)       ← Puede tener escenas exclusivas
```

### 13.3 Pendiente de implementar

- Pagina `/project/[slug]/videos` para gestionar video cuts
- Copiar escenas entre videos
- Storyboard filtrado por video cut
- System prompt con contexto del video activo

---

## 14. Seguridad y Autenticacion

| Capa | Tecnologia | Detalle |
|------|-----------|---------|
| **Auth** | Supabase Auth (JWT) | Login con email/password, callback con magic link |
| **RLS** | PostgreSQL Row Level Security | Todas las tablas. Politicas: owner puede CRUD sus datos, admin todo |
| **Roles** | Enum `user_role` | admin (acceso total), editor (puede editar), viewer (solo lectura), pending (esperando aprobacion), blocked |
| **Cifrado de keys** | AES-256-GCM | API keys de usuario cifradas antes de guardar en DB |
| **Secret** | `ENCRYPTION_SECRET` | Clave de 64 chars hex en .env.local |
| **Funciones helper** | `is_admin()`, `is_approved()` | Usadas en politicas RLS |

---

## 15. Exportacion

### 15.1 Formatos disponibles

| Formato | Contenido | Uso |
|---------|-----------|-----|
| **HTML** | Storyboard interactivo con imagenes, navegacion entre escenas | Presentacion a cliente en navegador |
| **JSON** | Datos estructurados: proyecto + escenas + personajes + fondos + arcos + timeline + issues | Integracion con otros sistemas |
| **Markdown** | Documento formateado con tablas y descripciones | Documentacion interna |
| **PDF** | Documento con imagenes y layout para imprimir | Entrega fisica al cliente |

### 15.2 Datos exportados

Cada export incluye:
- Metadatos del proyecto (titulo, estilo, plataforma, duracion)
- Todas las escenas con prompts y detalles tecnicos
- Todos los personajes con descripciones visuales
- Todos los fondos con tipo y hora
- Arcos narrativos con tiempos
- Timeline completo
- Issues detectados

### 15.3 Versionado

Cada export incrementa el campo `version` (integer). El historial muestra todas las exports previas con formato, tamano, fecha y link de descarga.

---

*Documento generado para Kiyoko AI · 18 marzo 2026*
*Equipo de desarrollo · Placido Venegas*
