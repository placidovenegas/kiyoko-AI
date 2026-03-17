# Kiyoko AI — Manual Completo del Proyecto

## Índice
1. [Visión General](#1-visión-general)
2. [Arquitectura Técnica](#2-arquitectura-técnica)
3. [Páginas y Funcionalidades](#3-páginas-y-funcionalidades)
4. [El Storyboard (Página Principal)](#4-el-storyboard)
5. [Sistema de IA](#5-sistema-de-ia)
6. [Base de Datos](#6-base-de-datos)
7. [Flujo de Trabajo del Usuario](#7-flujo-de-trabajo)
8. [Áreas de Mejora](#8-áreas-de-mejora)

---

## 1. Visión General

**Kiyoko AI** es un Storyboard Production Studio web que permite crear storyboards profesionales para producción de vídeo, asistidos por IA.

### ¿Qué hace?
- Crea storyboards completos con escenas, prompts para generadores de imagen/vídeo, personajes, fondos, arco narrativo y timeline
- La IA actúa como director creativo: pregunta, genera, mejora y analiza
- Exporta a HTML, JSON, Markdown y PDF
- Incluye un proyecto demo completo (Domenech Peluquerías, 28 escenas)

### Stack
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui (v2)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Groq (LLaMA 3.3 70B, gratis), Gemini (fallback), con soporte para Claude y OpenAI
- **Paneles**: react-resizable-panels para layout profesional

---

## 2. Arquitectura Técnica

### Estructura de carpetas
```
src/
├── app/
│   ├── (auth)/           # Páginas de autenticación
│   │   ├── login/        # Inicio de sesión
│   │   ├── register/     # Registro
│   │   ├── pending/      # Cuenta pendiente de aprobación
│   │   ├── blocked/      # Cuenta bloqueada
│   │   └── forgot-password/
│   ├── (dashboard)/      # Área autenticada
│   │   ├── dashboard/    # Lista de proyectos
│   │   ├── new/          # Wizard IA para crear proyecto
│   │   ├── admin/users/  # Gestión de usuarios (solo admin)
│   │   ├── settings/     # Perfil + API keys
│   │   └── p/[slug]/     # Proyecto individual
│   │       ├── storyboard/  # ★ PÁGINA PRINCIPAL
│   │       ├── analysis/    # Diagnóstico
│   │       ├── arc/         # Arco narrativo
│   │       ├── scenes/      # Lista de escenas
│   │       ├── characters/  # Personajes
│   │       ├── backgrounds/ # Fondos
│   │       ├── timeline/    # Montaje
│   │       ├── references/  # Mapa de referencias
│   │       ├── chat/        # Chat IA del proyecto
│   │       ├── exports/     # Exportar
│   │       └── settings/    # Config del proyecto
│   └── api/              # API Routes
│       ├── ai/           # Endpoints de IA
│       ├── user/         # API keys y uso
│       ├── export/       # Generadores de exportación
│       └── admin/        # Gestión de usuarios
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   ├── layout/           # Sidebar, Header, ChatPanel
│   ├── project/          # ProjectCard, SceneSelectionBar
│   └── shared/           # CommandMenu, etc.
├── lib/
│   ├── supabase/         # Clientes Supabase
│   ├── ai/               # Router IA, providers, prompts
│   └── utils/            # cn, slugify, crypto, format
├── stores/               # Zustand (UI, project, chat, filters)
├── hooks/                # Custom hooks
└── types/                # TypeScript types
```

### Base de datos (13 tablas + RLS)
- `profiles` — Usuarios con roles
- `projects` — Proyectos de storyboard
- `scenes` — Escenas (tabla principal, 40+ columnas)
- `characters` — Personajes con prompt snippets
- `backgrounds` — Fondos/localizaciones
- `narrative_arcs` — Fases del arco narrativo
- `timeline_entries` — Montaje segundo a segundo
- `project_issues` — Diagnóstico (fortalezas, warnings, sugerencias)
- `ai_conversations` — Historial de chat IA
- `exports` — Historial de exportaciones
- `reference_maps` — Qué imagen subir en cada escena
- `user_api_keys` — API keys de usuario (cifradas AES-256)
- `ai_usage_logs` — Tracking de uso de IA

---

## 3. Páginas y Funcionalidades

### 3.1 `/login` — Inicio de Sesión
- Email + password via Supabase Auth
- Redirección según rol (admin→dashboard, pending→pending, blocked→blocked)

### 3.2 `/register` — Registro
- Nombre, email, password
- Auto-crea perfil con rol `pending` (excepto ADMIN_EMAIL → `admin`)
- Redirige a `/pending` tras registro

### 3.3 `/pending` — Cuenta Pendiente
- Pantalla de espera
- Detecta automáticamente si el admin aprobó y redirige a dashboard
- Botón cerrar sesión funcional

### 3.4 `/dashboard` — Mis Proyectos
**Lo que se ve:**
- Stats rápidos: total proyectos, total escenas, proyectos activos
- Grid de ProjectCards con cover image + gradient overlay
- Filtros: Todos, En progreso, Completados, Archivados (con contadores)
- Búsqueda por título o cliente
- Ordenar: Recientes, Nombre A-Z, Más avanzados
- Badge DEMO en proyecto Domenech
- Cards con hover scale + shadow

**Acciones:**
- Click en card → navega al proyecto
- "+ Nuevo Proyecto" → wizard IA
- Buscar y filtrar

### 3.5 `/new` — Wizard IA (Crear Proyecto)
**Flujo conversacional en 5 pasos:**

| Paso | Kiyoko pregunta | El usuario responde |
|------|----------------|-------------------|
| 1. Brief | ¿De qué trata? ¿Cliente? ¿Objetivo? | Texto libre |
| 2. Estilo | Selecciona estilo visual + plataforma + duración | Cards de selección + slider |
| 3. Personajes | Describe cada personaje | Texto con nombre, aspecto, rol |
| 4. Localizaciones | Describe los escenarios | Texto con nombre, tipo, hora |
| 5. Crear | "Creando tu proyecto..." | Auto-redirect a /p/[slug] |

**Características:**
- Chat interface con avatar IA
- Quick action buttons (estilo, plataforma)
- Slider de duración (15-180s)
- Upload de fotos de referencia
- Modo fallback si IA no disponible
- Pregunta sobre audio: silente, música, diálogos, voz en off
- Link "Crear manualmente (sin IA)" al fondo
- Crea proyecto + personajes + fondos en Supabase automáticamente

### 3.6 `/p/[slug]` — Overview del Proyecto
**Lo que se ve:**
- Hero: cover image full-width con gradient, título y cliente superpuestos
- 4 stats cards con iconos: escenas, personajes, fondos, duración
- Quick actions: "Ir al Storyboard", "Chat IA", "Exportar"
- Últimas 6 escenas con thumbnails
- Info del proyecto: cliente, estilo, plataforma, generador, estado
- Progress bar de completado

### 3.7 `/p/[slug]/storyboard` — ★ EL STORYBOARD (Detalle abajo)

### 3.8 `/p/[slug]/analysis` — Diagnóstico
- 4 métricas: escenas, duración, fondos, personajes
- Issues agrupados: fortalezas (verde), advertencias (ámbar), sugerencias (azul)
- Cada issue: título, descripción, categoría badge
- Botón "Marcar como resuelto" en warnings/sugerencias
- "Regenerar análisis con IA" → llama al API, actualiza la DB

### 3.9 `/p/[slug]/arc` — Arco Narrativo
- Barra visual proporcional al tiempo con colores por fase
- 4 fases: Gancho (rojo), Desarrollo (ámbar), Clímax (verde), Cierre (azul)
- Cada fase: título, descripción, rango de tiempo, escenas vinculadas (clickables)

### 3.10 `/p/[slug]/scenes` — Lista de Escenas
- Filtros por tipo (Original, Mejorada, Nueva, Relleno, Vídeo) y fase
- Cards expandibles: click para ver prompts, mejoras, metadata
- Prompts con syntax highlight + Copy button
- Upload de imagen generada por escena
- "+ Nueva escena" y "Generar con IA" buttons

### 3.11 `/p/[slug]/characters` — Personajes
- Grid de cards con: imagen de referencia (upload), initials badge, nombre, rol
- Prompt snippet copiable en code block
- "Aparece en:" badges de escenas
- Upload de imagen → crop circular para avatar
- Edición inline: click en nombre/rol/snippet para editar

### 3.12 `/p/[slug]/backgrounds` — Fondos
- Similar a personajes pero para localizaciones
- Código, nombre, tipo (interior/exterior), hora del día
- Prompt snippet copiable
- Upload de imagen de referencia
- "Usado en:" badges de escenas

### 3.13 `/p/[slug]/timeline` — Montaje
- Versiones: Completa, 30s, 15s
- Entradas con: rango temporal, título, descripción, color de fase
- Total duración calculado
- "Regenerar timeline IA" button

### 3.14 `/p/[slug]/references` — Mapa de Referencias
- Tabla cruzada: escenas × personajes/fondos
- Checkmarks de qué referencia necesita cada escena
- Tips de producción por escena
- Instrucciones de uso con Grok Aurora

### 3.15 `/p/[slug]/chat` — Chat IA
- Chat conversacional con streaming
- IA tiene contexto completo del proyecto (escenas, personajes, fondos)
- Quick suggestions: "Mejorar una escena", "Añadir personaje", "Analizar narrativa"
- Mensajes con formato (AI a la izquierda, usuario a la derecha)

### 3.16 `/p/[slug]/exports` — Exportar
- 4 formatos: HTML (autocontenido), JSON (backup), Markdown (producción), PDF
- Download directo
- Historial de exportaciones

### 3.17 `/settings` — Perfil
- Avatar, nombre, email, idioma, tema

### 3.18 `/settings/api-keys` — Claves de IA
- Providers: Gemini (gratis), Groq (gratis), Claude (premium), OpenAI (premium)
- Añadir/eliminar API keys por provider
- Estado: activa/inactiva

### 3.19 `/admin/users` — Gestión de Usuarios (Admin)
- Lista de usuarios con rol, email, fecha registro
- Filtros: Todos, Pendientes, Editores, Bloqueados
- Acciones: Aprobar como Editor/Viewer, Bloquear, Cambiar rol

---

## 4. El Storyboard (★ Página Principal)

### Vista General
El storyboard es la página central donde se ve y edita TODO el proyecto. Cada escena se muestra como una card detallada con toda su información.

### Header del Storyboard
- Título del proyecto + cliente
- Stats: total escenas, duración total, personajes, fondos
- Botones: "Analizar storyboard completo", "Seleccionar escenas"
- Filtros: por tipo de escena, por fase del arco, búsqueda
- Toggle: vista Completa / Compacta

### Cada Scene Card (vista completa) muestra:
```
HEADER:
- Posición (#1, #2...) + Número de escena (N1, E1...)
- Título
- Badge tipo: Original (gris), Mejorada (ámbar), Nueva (azul), Relleno (violeta), Vídeo (rosa)
- Badge fase: Gancho (rojo), Desarrollo (ámbar), Clímax (verde), Cierre (azul)
- Duración (3s, 5s, 8s...)
- Estado: Borrador, Prompt listo, Generando, Generado, Aprobado
- Botón "Editar" → modo edición manual

CUERPO:
- Imagen generada (16:9) o placeholder con "Subir imagen"
- DESCRIPCIÓN: texto narrativo de la escena (en español)
- PERSONAJES: badges con initials coloreados, o "＋ Añadir" dropdown
- FONDO: nombre del fondo, o "＋ Añadir" dropdown
- Metadata grid:
  - 📹 Cámara: ángulo + movimiento
  - 💡 Iluminación
  - 🎭 Mood
- 🔊 AUDIO: badge (Silente/Ambiente/Música/Diálogos/Voz en off) + notas

PROMPTS:
- PROMPT IMAGEN: bloque de código monospace oscuro
  - [Copiar] → clipboard
  - [✨ Mejorar con IA] → abre sidebar IA
  - [✏️] → edición directa
  - Si vacío: [🤖 Generar prompt imagen] → genera con contexto
- PROMPT VÍDEO: mismo formato
  - Si vacío: [🤖 Generar prompt vídeo]

EXTRAS:
- Mejoras: lista de → mejoras y + adiciones
- Notas de dirección
- Tips de referencia
```

### Modo Edición Manual
Cuando pulsas "Editar" en una escena:
- Título → input editable
- Descripción → textarea
- Prompt imagen → textarea monospace oscuro
- Prompt vídeo → textarea monospace oscuro
- Duración → input numérico
- Cámara ángulo → dropdown (10 opciones)
- Cámara movimiento → dropdown (11 opciones)
- Iluminación → input texto
- Mood → input texto
- Notas dirección → textarea
- Audio → selector segmentado:
  - 🔇 Silente → auto-prepend "SILENT SCENE. NO DIALOGUE." al prompt vídeo
  - 🌊 Ambiente → "AMBIENT SOUND ONLY."
  - 🎵 Música → input para describir la música
  - 🗣️ Diálogos → input para describir quién habla
  - 🎙️ Voz en off → "VOICEOVER NARRATION."
- Botones: [Guardar] [Cancelar]

### Sidebar IA (Panel Derecho)
Cuando pulsas "✨ Mejorar con IA" en un prompt:
- Se abre un panel lateral derecho (400px) con slide-in
- Muestra el prompt actual
- Toggle: "Mejorar existente" vs "Reescribir completo"
- Input: "¿Qué quieres cambiar?"
- 8 sugerencias rápidas:
  - Más detalle de iluminación
  - Cambiar ángulo de cámara
  - Añadir más emoción
  - Hacer más cinematográfico
  - Añadir profundidad de campo
  - Incluir más detalles del personaje
  - Cambiar hora del día
  - Añadir efectos atmosféricos
- Genera la mejora via `/api/ai/improve-prompt`
- Vista diff: viejo (tachado rojo) vs nuevo (verde)
- Botones: [Aplicar cambio] [Copiar] [Cancelar]
- Contador de caracteres

### Insertar Escena Entre Dos
Entre cada par de escenas hay una línea con botón "+":
- Hover → línea se vuelve azul
- Click → popover con dos opciones:
  - **"📋 Plano detalle"**: IA analiza escena anterior y siguiente (personajes, fondos, cámara) y genera un plano detalle/transición automático
  - **"🎬 Nueva escena"**: mini formulario inline con título, descripción, tipo, duración → crea escena en blanco para editar
- Después de insertar, reordena y recarga

### Selección Múltiple
- Botón "Seleccionar escenas" activa modo selección
- Checkboxes aparecen en cada escena
- Barra flotante inferior con acciones:
  - **"Sustituir con IA"**: describe qué quieres → IA genera escenas de reemplazo analizando contexto (anterior, siguiente, personajes, fondos, estilo) → elimina viejas, inserta nuevas, reordena
  - **"Eliminar"**: confirmación → elimina y reordena
  - Contador: "3 escenas seleccionadas"
  - Botón limpiar selección

### Análisis Completo con IA
Botón "Analizar storyboard completo":
- Llama a `/api/ai/analyze-project` con TODO el contexto
- Modal con resultados:
  - Resumen ejecutivo
  - Puntuación general (barra 0-100)
  - Fortalezas (verde)
  - Advertencias (ámbar) con prioridad
  - Sugerencias (azul)
  - **Análisis escena por escena**: cada escena con:
    - Score /10
    - Estado: bueno (verde), necesita mejora (ámbar), crítico (rojo)
    - Calidad del prompt
    - Lista de mejoras concretas
    - Sugerencia de audio
    - Nota de pacing
  - Flujo narrativo: gancho, desarrollo, clímax, cierre
  - Análisis de audio: coherencia, música, diseño de sonido
- Botón "Exportar análisis" → descarga .md

### Vista Compacta
Toggle "Compacto": cada escena como una fila:
- Thumbnail mini + número + título + duración + badge tipo

---

## 5. Sistema de IA

### Providers configurados
| Provider | Tipo | Modelo | Gratis | Uso |
|----------|------|--------|--------|-----|
| **Groq** | Texto | LLaMA 3.3 70B | ✅ | Principal (rápido) |
| **Gemini** | Texto + Imágenes | gemini-2.0-flash | ✅* | Fallback |
| **Claude** | Texto | claude-sonnet-4 | ❌ | Premium (si key) |
| **OpenAI** | Texto + Imágenes | gpt-4o-mini + DALL-E 3 | ❌ | Premium (si key) |
| **Stability** | Imágenes | stable-diffusion-3 | ❌ | Premium (si key) |

*Gemini: quota puede agotarse, por eso Groq va primero.

### Cadena de Fallback
```
TEXTO: Groq → Gemini → Claude → OpenAI
Si Groq falla (rate limit) → intenta Gemini → intenta Claude → intenta OpenAI
Si todos fallan → error amigable
```

### API Routes de IA
| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/ai/chat` | POST | Chat conversacional con streaming |
| `/api/ai/improve-prompt` | POST | Mejorar o generar prompt |
| `/api/ai/analyze-project` | POST | Análisis completo escena por escena |
| `/api/ai/generate-scenes` | POST | Generar escena nueva |
| `/api/ai/generate-project` | POST | Generar proyecto desde brief |
| `/api/ai/generate-image` | POST | Generar imagen |
| `/api/ai/generate-timeline` | POST | Generar timeline |
| `/api/ai/generate-characters` | POST | Generar personajes |
| `/api/ai/generate-arc` | POST | Generar arco narrativo |
| `/api/ai/generate-voice` | GET/POST | Voces TTS disponibles / generar audio |
| `/api/ai/providers/status` | GET | Estado de providers |

### System Prompts
Los prompts del sistema definen cómo se comporta la IA:
- **Project Generator**: Director creativo, guía el wizard paso a paso. Pregunta sobre audio/diálogos.
- **Scene Generator**: Genera prompts técnicos. SIEMPRE en INGLÉS. Especifica estilo, cámara, iluminación, audio.
- **Scene Improver**: Mejora prompts existentes. Modo mejorar vs reescribir.
- **Analyzer**: Analiza ESCENA POR ESCENA. Score /10 por escena. Flujo narrativo + audio.
- **Chat Assistant**: Asistente con contexto completo del proyecto.
- **Timeline Generator**: Genera timeline con tiempos exactos.
- **Character Generator**: Genera fichas con prompt snippets en INGLÉS.

### Reglas de los Prompts
- prompt_image y prompt_video → SIEMPRE en INGLÉS
- Textos descriptivos (title, description, notes) → idioma del usuario
- Audio:
  - Silente → "SILENT SCENE. NO DIALOGUE. NO LIP MOVEMENT."
  - Ambiente → "AMBIENT SOUND ONLY. No speech."
  - Diálogos → "DIALOGUE SCENE."
  - Voz en off → "VOICEOVER NARRATION. Characters do not speak on camera."

---

## 6. Base de Datos

### 6.1 profiles — Usuarios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | FK a auth.users, se crea automáticamente al registrarse |
| email | TEXT (unique) | Email del usuario |
| full_name | TEXT | Nombre completo |
| avatar_url | TEXT | URL de la foto de perfil en Storage |
| role | ENUM | `admin` \| `editor` \| `viewer` \| `pending` \| `blocked` |
| bio | TEXT | Biografía del usuario |
| company | TEXT | Empresa |
| preferences | JSONB | `{theme, language, notifications, default_style}` |
| last_active_at | TIMESTAMPTZ | Última actividad |
| created_at / updated_at | TIMESTAMPTZ | Timestamps automáticos |

### 6.2 projects — Proyectos de Storyboard
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| owner_id | UUID (FK profiles) | Dueño del proyecto |
| title | TEXT | Título del proyecto |
| slug | TEXT (unique) | URL-friendly identifier |
| description | TEXT | Descripción/brief del proyecto |
| client_name | TEXT | Nombre del cliente |
| client_logo_url | TEXT | Logo del cliente |
| style | ENUM | `pixar` \| `realistic` \| `anime` \| `watercolor` \| `flat_2d` \| `cyberpunk` \| `custom` |
| custom_style_description | TEXT | Descripción si style=custom |
| status | ENUM | `draft` \| `in_progress` \| `review` \| `completed` \| `archived` |
| target_duration_seconds | INT | Duración objetivo en segundos |
| target_platform | ENUM | `youtube` \| `instagram_reels` \| `tiktok` \| `tv_commercial` \| `web` \| `custom` |
| color_palette | JSONB | `{primary, secondary, accent, dark, light}` |
| ai_brief | TEXT | Brief original dado a la IA |
| ai_analysis | JSONB | Snapshot del último análisis IA |
| image_generator | TEXT | Generador por defecto (grok_aurora, dalle, etc.) |
| video_generator | TEXT | Generador de vídeo por defecto |
| tags | TEXT[] | Etiquetas del proyecto |
| is_demo | BOOLEAN | TRUE para proyecto demo precargado |
| thumbnail_url | TEXT | Miniatura del proyecto |
| cover_image_url | TEXT | Imagen de cover |
| total_scenes | INT | Calculado automáticamente |
| total_characters | INT | Calculado automáticamente |
| total_backgrounds | INT | Calculado automáticamente |
| estimated_duration_seconds | NUMERIC | Suma de duración de escenas |
| completion_percentage | INT | % de escenas generadas/aprobadas |

### 6.3 scenes — Escenas (★ Tabla Principal)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador |
| project_id | UUID (FK projects) | Proyecto al que pertenece |
| scene_number | TEXT | Código: "E1", "N3", "R2", "V7" |
| title | TEXT | Título descriptivo de la escena |
| scene_type | ENUM | `original` \| `improved` \| `new` \| `filler` \| `video` |
| category | TEXT | intro, presentation, services, specialty, etc. |
| arc_phase | ENUM | `hook` \| `build` \| `peak` \| `close` |
| description | TEXT | Descripción narrativa (español) |
| director_notes | TEXT | Notas de dirección |
| **prompt_image** | TEXT | **Prompt para generar IMAGEN (siempre en INGLÉS)** |
| **prompt_video** | TEXT | **Prompt para generar VÍDEO (siempre en INGLÉS)** |
| prompt_additions | TEXT | Adiciones al prompt original |
| improvements | JSONB | Array: `[{type: "improve"\|"add", text: "..."}]` |
| duration_seconds | NUMERIC | Duración de la escena |
| start_time | TEXT | "0:00" en el timeline |
| end_time | TEXT | "0:05" en el timeline |
| background_id | UUID (FK backgrounds) | Fondo/localización |
| character_ids | UUID[] | IDs de personajes que aparecen |
| required_references | TEXT[] | Refs necesarias: "REF-EXT", "REF-JOSÉ" |
| reference_tip | TEXT | Consejo de qué subir al generador |
| camera_angle | ENUM | wide, medium, close_up, extreme_close_up, pov, low_angle, high_angle, birds_eye, dutch, over_shoulder |
| camera_movement | ENUM | static, dolly_in, dolly_out, pan_left, pan_right, tilt_up, tilt_down, tracking, crane, handheld, orbit |
| camera_notes | TEXT | Notas extra de cámara |
| lighting | TEXT | "golden hour", "warm amber studio" |
| mood | TEXT | "energetic", "emotional" |
| music_notes | TEXT | "Música emotiva, piano suave" |
| sound_notes | TEXT | "SILENT SCENE", "Solo sonido de tijeras" |
| status | ENUM | `draft` \| `prompt_ready` \| `generating` \| `generated` \| `approved` \| `rejected` |
| generated_image_url | TEXT | URL de imagen generada en Storage |
| generated_image_path | TEXT | Path en bucket storage |
| generated_image_thumbnail_url | TEXT | Miniatura |
| generated_video_url | TEXT | URL de vídeo generado |
| prompt_history | JSONB | Array: `[{version, prompt, timestamp}]` |
| sort_order | INT | **Orden de aparición en el vídeo** |
| notes | TEXT | Notas libres |
| metadata | JSONB | Datos extra flexibles |

### 6.4 characters — Personajes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador |
| project_id | UUID (FK) | Proyecto |
| name | TEXT | Nombre: "José" |
| initials | TEXT | "JO" (para badges) |
| role | TEXT | "Director · El jefe" |
| description | TEXT | Descripción narrativa |
| visual_description | TEXT | Descripción visual detallada |
| **prompt_snippet** | TEXT | **Fragmento EN INGLÉS para inyectar en prompts** |
| personality | TEXT | "Confiado, cálido, líder natural" |
| signature_clothing | TEXT | "blazer azul acero + camisa negra" |
| hair_description | TEXT | "pelo castaño rojizo peinado hacia atrás" |
| accessories | TEXT[] | ["collar plata", "pulseras"] |
| signature_tools | TEXT[] | ["tijeras", "secador rose gold"] |
| color_accent | TEXT | Color hex para UI: "#3B82F6" |
| reference_image_url | TEXT | Foto de referencia |
| appears_in_scenes | TEXT[] | ["E1", "E3", "E5"] |
| sort_order | INT | Orden de aparición |
| metadata | JSONB | Datos extra (ej: avatar_object_position) |

### 6.5 backgrounds — Fondos / Localizaciones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador |
| project_id | UUID (FK) | Proyecto |
| code | TEXT | "REF-EXT", "REF-PELUCAS" |
| name | TEXT | "Fachada exterior del salón" |
| description | TEXT | Descripción del lugar |
| location_type | TEXT | `interior` \| `exterior` \| `mixed` |
| time_of_day | TEXT | `dawn` \| `morning` \| `day` \| `golden_hour` \| `evening` \| `night` |
| **prompt_snippet** | TEXT | **Fragmento EN INGLÉS para inyectar en prompts** |
| reference_image_url | TEXT | Foto de referencia |
| available_angles | TEXT[] | ["frontal", "lateral", "aéreo"] |
| used_in_scenes | TEXT[] | ["E2", "E9"] |

### 6.6 narrative_arcs — Fases del Arco Narrativo
| Campo | Tipo | Descripción |
|-------|------|-------------|
| phase | TEXT | 'hook', 'presentation', 'services', etc. |
| phase_number | INT | Número de orden |
| title | TEXT | "Gancho" |
| description | TEXT | Qué pasa en esta fase |
| start_second / end_second | NUMERIC | Rango temporal |
| scene_numbers | TEXT[] | ["E1", "N1"] escenas en esta fase |
| color | TEXT | Color hex para la UI |

### 6.7 timeline_entries — Montaje Final
| Campo | Tipo | Descripción |
|-------|------|-------------|
| scene_id | UUID (FK scenes) | Escena asociada |
| title | TEXT | "N1 · Cold open tijeras" |
| description | TEXT | "Misterio. Sin música, solo sonido de tijeras" |
| start_time / end_time | TEXT | "0:00" / "0:03" |
| duration_seconds | NUMERIC | Duración del segmento |
| arc_phase | ENUM | Fase del arco |
| timeline_version | TEXT | `full` \| `short_30s` \| `short_15s` |

### 6.8 project_issues — Diagnóstico / Análisis
| Campo | Tipo | Descripción |
|-------|------|-------------|
| issue_type | ENUM | `strength` \| `warning` \| `suggestion` |
| title | TEXT | Título del issue |
| description | TEXT | Descripción detallada |
| category | TEXT | 'prompts', 'narrative', 'visual', 'pacing' |
| priority | INT | 0=baja, 1=media, 2=alta |
| resolved | BOOLEAN | Si se ha resuelto |
| resolution_notes | TEXT | Notas de resolución |

### 6.9 ai_conversations — Chat IA
| Campo | Tipo | Descripción |
|-------|------|-------------|
| messages | JSONB | Array: `[{id, role, content, timestamp, attachments}]` |
| wizard_step | TEXT | Paso del wizard si es creación |
| conversation_type | TEXT | `wizard` \| `chat` \| `improve` |
| title | TEXT | Título de la conversación |
| completed | BOOLEAN | Si se completó |

### 6.10 exports — Historial de Exportaciones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| format | ENUM | `html` \| `json` \| `markdown` \| `pdf` |
| file_url | TEXT | URL del archivo en Storage |
| file_size_bytes | INT | Tamaño |
| version | INT | Número de versión |

### 6.11 reference_maps — Qué Imagen Subir en Cada Escena
| Campo | Tipo | Descripción |
|-------|------|-------------|
| scene_id | UUID (FK) | Escena |
| background_id | UUID (FK) | Fondo de referencia |
| character_id | UUID (FK) | Personaje de referencia |
| reference_type | TEXT | 'background' \| 'character' |
| priority | INT | Orden de subida al generador |
| notes | TEXT | "Para que Grok replique la arquitectura" |

### 6.12 user_api_keys — API Keys de Usuario (Cifradas)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| provider | TEXT | 'claude' \| 'openai' \| 'gemini' \| 'groq' \| 'stability' |
| api_key_encrypted | TEXT | Cifrada con AES-256-GCM |
| api_key_hint | TEXT | "sk-ant-...****7x3F" |
| is_active | BOOLEAN | Si está activa |
| monthly_budget_usd | NUMERIC | Presupuesto mensual (NULL=sin límite) |
| monthly_spent_usd | NUMERIC | Gastado este mes |

### 6.13 ai_usage_logs — Log de Uso de IA
| Campo | Tipo | Descripción |
|-------|------|-------------|
| provider | TEXT | Qué provider se usó |
| model | TEXT | Qué modelo exacto |
| task | TEXT | 'text_generation' \| 'image_generation' \| 'chat' \| 'analysis' |
| input_tokens / output_tokens | INT | Tokens consumidos |
| estimated_cost_usd | NUMERIC | Coste estimado |
| was_fallback | BOOLEAN | Si hubo fallback |
| original_provider | TEXT | Provider que falló (si fallback) |
| response_time_ms | INT | Tiempo de respuesta |
| success | BOOLEAN | Si fue exitoso |

### Storage (Supabase)
3 buckets:
- **project-assets**: imágenes de referencia, generadas, covers (público, 50MB max)
- **avatars**: fotos de perfil (público, 5MB max)
- **exports**: archivos exportados (privado)

### RLS (Row Level Security)
- Todas las tablas tienen RLS activo
- Admin: acceso total a todo
- Owner: CRUD completo en sus propios proyectos y datos hijos
- Viewer: solo lectura de proyectos con is_demo=TRUE
- Pending/Blocked: sin acceso a datos

---

## 7. Flujo de Trabajo del Usuario

### Crear un proyecto nuevo
1. Click "+ Nuevo Proyecto" en dashboard
2. El wizard IA pregunta sobre el proyecto (brief, estilo, personajes, localizaciones)
3. Se crea el proyecto con los datos básicos
4. Navega al storyboard → empieza a generar escenas

### Trabajar en el storyboard
1. Ver todas las escenas ordenadas por vídeo
2. Cada escena tiene prompt imagen + prompt vídeo
3. Copiar prompts → pegarlos en el generador de IA (Grok, DALL-E, Midjourney)
4. Subir la imagen generada de vuelta
5. Mejorar prompts con IA si no son buenos
6. Insertar planos detalle entre escenas
7. Reorganizar escenas cambiando sort_order
8. Analizar el storyboard completo con IA

### Exportar
1. Ir a pestaña Exportar
2. Elegir formato (HTML, JSON, Markdown, PDF)
3. Descargar el archivo

---

## 8. Áreas de Mejora

### Storyboard (la prioridad)
- **Drag & drop** para reordenar escenas arrastrando
- **Preview en tiempo real** cuando editas un prompt (mock de cómo se vería)
- **Generación de imágenes inline** (no copiar/pegar, generar directo desde la app)
- **Versiones de storyboard** (guardar snapshots, restaurar)
- **Compartir** storyboard con enlace público de solo lectura
- **Timeline visual** integrado en el storyboard (barra proporcional con escenas)
- **Marcadores de estilo desactualizado** cuando cambias el estilo del proyecto
- **Batch operations** más potentes (actualizar audio de todas las escenas a la vez)

### Chat IA
- **Chat global** accesible desde cualquier página (panel redimensionable)
- **Referenciar escenas** con @E4A en el chat
- **Historial** de conversaciones persistido
- **Acciones desde el chat**: "genera escena nueva" → la crea directamente

### UI/UX
- **Cmd+K** búsqueda global (proyectos, escenas, acciones)
- **Atajos de teclado** (Ctrl+C copiar prompt, Ctrl+S guardar, Escape cancelar)
- **Notificaciones** cuando la IA termina de generar algo largo
- **Responsive** completo para tablet/móvil
- **Onboarding** para nuevos usuarios (tour guiado)

### Producción
- **Integración directa con Grok/DALL-E** (generar imagen sin salir de la app)
- **Side-by-side** antes/después de mejoras
- **Storyboard print-ready** (diseño optimizado para imprimir)
- **Colaboración** multiusuario en tiempo real (Supabase Realtime)

### Datos
- **Historial de cambios** con restaurar (change_history table)
- **Duplicar proyecto** completo
- **Templates** (publicidad 30s, cortometraje, social media)
- **Importar** desde JSON existente
