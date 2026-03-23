# Kiyoko AI — Schema v4: Tablas Adicionales

> Este documento complementa el rediseño v3. Aquí se definen las tablas NUEVAS que no existían en v3.

---

## Cambio global: `short_id` en todas las entidades con ruta

Todas las tablas que aparecen en URLs usan `short_id` (nanoid 12 chars) en vez de slug para las rutas.

```sql
-- Se añade a: projects, videos, scenes (y cualquier entidad con ruta)
short_id  TEXT NOT NULL UNIQUE  -- nanoid 12 chars, ej: "pDm3nKqR8xWz"
```

**Generación en el frontend:**
```typescript
import { nanoid } from 'nanoid';
const shortId = nanoid(12); // "xK4mQ9bRzTp2"
```

**Rutas resultantes:**
```
/project/pDm3nKqR8xWz
/project/pDm3nKqR8xWz/video/vYt90sDm3nKq
/project/pDm3nKqR8xWz/video/vYt90sDm3nKq/scene/sC1n7qRxWz4m
```

El `slug` se mantiene para SEO y display, pero la ruta usa `short_id`.

---

## Nuevas Tablas

### `project_ai_agents`

Define cómo actúa la IA en el proyecto. Es el system prompt + parámetros de comportamiento. Se genera automáticamente según el tipo de proyecto pero el usuario lo puede modificar.

```
id                  uuid PK
project_id          uuid FK→projects NOT NULL
name                text NOT NULL       — "Director Pixar — Domenech"
system_prompt       text NOT NULL       — System prompt completo que se envía en cada
                                        — conversación del proyecto.
                                        — Incluye: rol, estilo, personajes, reglas, tono.

-- Parámetros ajustables en UI
tone                text DEFAULT 'professional'
                                        — warm_professional | serious | comedic |
                                        — dramatic | casual | educational
creativity_level    numeric(3,2) DEFAULT 0.7
                                        — 0.0 = muy conservador, 1.0 = muy creativo
                                        — Mapea a temperature en la API
language            text DEFAULT 'es'   — Idioma principal del agente

-- Contexto según tipo de video
video_style_context text                — pixar_3d_animation | realistic_live_action |
                                        — anime_2d | watercolor_artistic | cyberpunk_neon |
                                        — flat_2d_motion_graphics
                                        — Se autogenera al crear proyecto según el estilo

-- Estado
is_default          boolean DEFAULT true — Agente por defecto del proyecto
                                        — (futuro: múltiples agentes)

created_at          timestamptz
updated_at          timestamptz
```

**Cómo funciona:**

1. El usuario crea un proyecto y elige estilo "Pixar"
2. La app genera automáticamente un system prompt de director de animación Pixar
3. El usuario puede verlo y editarlo en `/project/[id]/settings/ai`
4. Un desplegable de "tipo de director" genera prompts base diferentes:
   - Pixar 3D → "Eres un director de animación 3D estilo Pixar Studios..."
   - Realista → "Eres un director de fotografía cinematográfica..."
   - Anime → "Eres un director de animación japonesa estilo Studio Ghibli..."
   - Comedia → "Eres un director de comedia visual con timing cómico..."
   - Anuncio → "Eres un director creativo de publicidad audiovisual..."
5. El usuario ajusta tono (serio/cómico/dramático) y creatividad (slider 0-1)
6. Cada conversación IA del proyecto envía este system prompt como contexto

### `character_images`

Múltiples imágenes por personaje: diferentes ángulos, avatar, full body. El usuario sube o la IA genera.

```
id                  uuid PK
character_id        uuid FK→characters NOT NULL
image_type          text NOT NULL       — avatar | front | side_left | side_right |
                                        — back | three_quarter | full_body |
                                        — waist_up | detail | custom
angle_description   text                — "De frente, sonriendo" / "Perfil izquierdo con herramientas"

-- Archivo
file_url            text
file_path           text                — Path en Supabase Storage
thumbnail_url       text                — Miniatura 100x100 para la UI

-- Generación
source              text DEFAULT 'uploaded'  — uploaded | ai_generated
prompt_used         text                — Si fue generada por IA, el prompt usado
generator           text                — grok_aurora | dall-e-3 | etc.

-- Estado
is_primary          boolean DEFAULT false — Si es la imagen principal del personaje
                                         — (la que se muestra en el avatar del storyboard)
sort_order          integer DEFAULT 0
created_at          timestamptz
```

**Tipos de imagen recomendados por la app:**
- `avatar` — Cara o busto para identificar rápidamente en el storyboard (obligatorio)
- `front` — De frente, cuerpo completo o medio plano
- `side_left` / `side_right` — Perfil
- `back` — De espaldas
- `three_quarter` — Tres cuartos (la más útil para prompts)
- `full_body` — Cuerpo entero de pie
- `waist_up` — Medio plano de cintura para arriba
- `detail` — Detalle (manos con herramientas, tatuajes, accesorios)
- `custom` — Cualquier otra imagen de referencia

**Para fondos:** La misma lógica aplica. Se puede crear `background_images` con tipos similares (panoramic, detail, entrance, aerial, etc.) si se necesita.

### `entity_snapshots`

Snapshots de entidades antes de que la IA las modifique. Permite rollback granular (por escena) o batch (toda la conversación).

```
id                  uuid PK
entity_type         text NOT NULL       — scene | video | character | background
entity_id           uuid NOT NULL       — ID de la entidad
conversation_id     uuid FK→ai_conversations  — Conversación que provocó el cambio
action_type         text NOT NULL       — create | update | delete
snapshot_data       jsonb NOT NULL      — Estado COMPLETO de la entidad ANTES del cambio
                                        — (para create, es {} porque no existía)
                                        — (para update, es la fila completa anterior)
                                        — (para delete, es la fila eliminada)
restored            boolean DEFAULT false — Si se hizo rollback de este snapshot
restored_at         timestamptz
restored_by         uuid FK→profiles

user_id             uuid FK→profiles NOT NULL — Quién hizo el cambio original
project_id          uuid FK→projects NOT NULL
created_at          timestamptz DEFAULT now()
```

**Rollback por escena:** Buscar el último snapshot de `entity_type='scene'` y `entity_id=X`, restaurar `snapshot_data`.

**Rollback por conversación:** Buscar todos los snapshots con `conversation_id=X`, restaurar cada uno en orden inverso (último primero).

**Flujo:**
1. Usuario en el chat: "Cambia la escena 3, que no aparezca Raúl"
2. La IA guarda snapshot de escena 3 en `entity_snapshots`
3. La IA modifica la escena 3
4. Si el usuario dice "deshaz eso" → se restaura el snapshot
5. Si el usuario dice "deshaz toda la conversación" → se restauran todos los snapshots de esa conversación

### `social_profiles`

Perfiles de redes sociales del proyecto. Para gestionar publicaciones.

```
id                  uuid PK
project_id          uuid FK→projects NOT NULL
platform            text NOT NULL       — instagram | tiktok | youtube | facebook |
                                        — twitter | linkedin
account_name        text NOT NULL       — "Domenech Peluquerías"
account_handle      text                — "@domenech.peluquerias"
avatar_url          text                — Avatar del perfil
bio                 text                — Bio del perfil
followers_count     integer             — Para mostrar en la UI
profile_url         text                — URL directa al perfil
sort_order          integer DEFAULT 0
created_at          timestamptz
updated_at          timestamptz
UNIQUE(project_id, platform)            — Un perfil por plataforma por proyecto
```

### `publications`

Una publicación planificada para una red social. Puede contener imágenes, vídeos o carruseles.

```
id                  uuid PK
project_id          uuid FK→projects NOT NULL
social_profile_id   uuid FK→social_profiles NOT NULL — A qué perfil pertenece
short_id            text NOT NULL UNIQUE — nanoid 12 para la ruta

title               text NOT NULL       — "Transformación capilar — Antes/Después"
description         text                — Descripción interna (para el equipo, no se publica)
caption             text                — Texto que se publica en la red social
                                        — (con emojis, hashtags, menciones, etc.)

-- Tipo
publication_type    text NOT NULL       — image | video | carousel | reel | story
                                        — image: 1 imagen
                                        — video: 1 vídeo (puede venir de un video del proyecto)
                                        — carousel: 2-10 imágenes/vídeos
                                        — reel: vídeo vertical corto
                                        — story: contenido efímero

-- Estado
status              text DEFAULT 'draft' — draft | designing | ready | scheduled |
                                         — published | failed
scheduled_at        timestamptz         — Fecha/hora de publicación planificada
published_at        timestamptz         — Fecha/hora real de publicación
published_url       text                — URL del post publicado

-- Contenido
hashtags            text[]              — ["prótesiscapilar","domenech","transformación"]
prompt_style_notes  text                — Notas de estilo para la IA que genera las imágenes

-- Vínculo con video del proyecto
source_video_id     uuid FK→videos      — Si la publicación usa un video ya generado
source_scene_id     uuid FK→scenes      — Si la publicación usa una escena específica

-- Métricas (futuro)
likes_count         integer
comments_count      integer
shares_count        integer
views_count         integer

sort_order          integer DEFAULT 0
metadata            jsonb
created_at          timestamptz
updated_at          timestamptz
```

### `publication_items`

Items dentro de una publicación. Una publicación puede tener múltiples ítems (carrusel = varias imágenes, o una imagen + texto).

```
id                  uuid PK
publication_id      uuid FK→publications NOT NULL ON DELETE CASCADE
item_type           text NOT NULL       — image | video
sort_order          integer NOT NULL DEFAULT 1  — Orden en el carrusel

-- Contenido generado
file_url            text                — URL del archivo generado
file_path           text                — Path en Storage
thumbnail_url       text

-- Prompt de generación
prompt_text         text                — Prompt para generar esta imagen/vídeo
description_es      text                — Descripción en español de lo que se ve

-- Generación
generator           text                — grok_aurora | dall-e-3 | etc.
generation_config   jsonb
status              text DEFAULT 'pending' — pending | generating | ready | error

-- Versionado
version             integer DEFAULT 1
is_current          boolean DEFAULT true

metadata            jsonb
created_at          timestamptz
```

---

## Bucket de Supabase Storage

```
kiyoko-storage/
├── projects/
│   └── {project_id}/
│       ├── cover/                  — Portada del proyecto
│       ├── client/                 — Logo del cliente
│       │
│       ├── characters/
│       │   └── {character_id}/
│       │       ├── reference/      — Imágenes de referencia subidas
│       │       ├── avatar/         — Avatar del personaje
│       │       ├── angles/         — Imágenes por ángulo (front, side, back...)
│       │       └── ai-generated/   — Imágenes generadas por IA
│       │
│       ├── backgrounds/
│       │   └── {background_id}/
│       │       ├── reference/      — Imágenes de referencia subidas
│       │       ├── angles/         — Diferentes ángulos del fondo
│       │       └── ai-generated/   — Fondos generados por IA
│       │
│       ├── styles/
│       │   └── {style_preset_id}/
│       │       └── reference/      — Imagen de referencia del estilo
│       │
│       ├── videos/
│       │   └── {video_id}/
│       │       ├── scenes/
│       │       │   └── {scene_id}/
│       │       │       ├── images/         — Imágenes generadas (scene_media)
│       │       │       ├── clips/          — Clips de video (scene_video_clips)
│       │       │       │   ├── base/       — Clip base
│       │       │       │   ├── ext-1/      — Extensión 1
│       │       │       │   ├── ext-2/      — Extensión 2
│       │       │       │   └── frames/     — Últimos frames para extensiones
│       │       │       └── thumbnails/     — Miniaturas
│       │       │
│       │       ├── narration/      — Audio de narración del video
│       │       │   └── v{version}/ — Versiones de narración
│       │       │
│       │       └── export/         — Exportaciones finales
│       │
│       ├── publications/
│       │   └── {publication_id}/
│       │       └── items/          — Imágenes/vídeos de publicaciones
│       │
│       └── social/
│           └── avatars/            — Avatares de perfiles de redes
│
├── users/
│   └── {user_id}/
│       ├── avatar/                 — Foto de perfil
│       └── feedback/               — Screenshots de feedback
│
└── shared/
    └── {share_token}/              — Archivos para escenas compartidas
```

---

## Resumen de Tablas v4 Completo

| # | Tabla | Estado | Propósito |
|---|-------|--------|-----------|
| 1 | profiles | v3 | Usuarios |
| 2 | organizations | v3 | Equipos |
| 3 | organization_members | v3 | Miembros |
| 4 | user_plans | v3 | Suscripciones |
| 5 | user_api_keys | v3 | API keys |
| 6 | projects | v3+short_id | Proyectos |
| 7 | project_ai_settings | v3 | Config generadores |
| 8 | **project_ai_agents** | **v4 NUEVO** | System prompt + parámetros IA |
| 9 | project_shares | v3 | Compartir proyecto |
| 10 | project_favorites | v3 | Favoritos |
| 11 | characters | v3 | Personajes |
| 12 | **character_images** | **v4 NUEVO** | Múltiples imágenes/ángulos por personaje |
| 13 | backgrounds | v3 | Fondos |
| 14 | style_presets | v3 | Estilos visuales |
| 15 | prompt_templates | v3 | Plantillas de prompts |
| 16 | videos | v3+short_id | Producciones |
| 17 | video_narrations | v3 | Narración completa |
| 18 | video_analysis | v3 | Análisis IA |
| 19 | video_derivations | v3 | Videos derivados |
| 20 | scenes | v3+short_id | Escenas |
| 21 | scene_camera | v3 | Config cámara |
| 22 | scene_media | v3 | Imágenes generadas |
| 23 | scene_video_clips | v3 | Clips + extensiones |
| 24 | scene_prompts | v3 | Historial prompts |
| 25 | scene_characters | v3 | N:N escena↔personaje |
| 26 | scene_backgrounds | v3 | N:N escena↔fondo |
| 27 | scene_shares | v3 | Compartir escenas |
| 28 | scene_annotations | v3 | Anotaciones externas |
| 29 | tasks | v3 | Tareas |
| 30 | time_entries | v3 | Tiempo trabajado |
| 31 | comments | v3 | Comentarios |
| 32 | narrative_arcs | v3 | Arco narrativo |
| 33 | timeline_entries | v3 | Línea de tiempo |
| 34 | ai_conversations | v3 | Chat IA |
| 35 | **entity_snapshots** | **v4 NUEVO** | Rollback de cambios IA |
| 36 | **social_profiles** | **v4 NUEVO** | Perfiles de redes sociales |
| 37 | **publications** | **v4 NUEVO** | Publicaciones planificadas |
| 38 | **publication_items** | **v4 NUEVO** | Items de publicaciones |
| 39 | realtime_updates | v3 | Cola tiempo real |
| 40 | activity_log | v3 | Auditoría |
| 41 | ai_usage_logs | v3 | Consumo IA |
| 42 | exports | v3 | Exportaciones |
| 43 | notifications | v3 | Alertas |
| 44 | billing_events | v3 | Pagos |
| 45 | usage_tracking | v3 | Límites |
| 46 | feedback | v3 | Bug reports |

**Total: 46 tablas**
