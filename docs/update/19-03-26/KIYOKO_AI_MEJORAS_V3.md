# KIYOKO AI — Análisis Profesional y Propuesta de Mejoras v3.0

**Sistema Multi-Video · Gestión de Tareas · IA Everywhere · Rediseño de Pantallas**

**Fecha:** Marzo 2026  
**Preparado para:** Plácido Venegas / Equipo Kiyoko AI  
**Versión:** 3.0

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Diagnóstico del Estado Actual](#2-diagnóstico-del-estado-actual)
3. [Propuesta: Sistema Multi-Video](#3-propuesta-sistema-multi-video)
   - 3.1–3.9 (Modelo de datos, RLS, funciones SQL, migración, realtime, archivos)
4. [Flujos de Usuario Detallados](#4-flujos-de-usuario-detallados)
5. [Diseño de Nuevas Páginas](#5-diseño-de-nuevas-páginas)
6. [Integración con la IA](#6-integración-con-la-ia)
7. [Mejoras Adicionales Propuestas](#7-mejoras-adicionales-propuestas)
   - 7.1–7.11 (Store, change history, preview, calendario, performance, API routes, UX)
8. [Plan de Implementación](#8-plan-de-implementación) (5 fases, 10 semanas)
9. [Checklist de Compatibilidad](#9-checklist-de-compatibilidad)
10. [Glosario de Términos](#10-glosario-de-términos)
11. [Sistema de Gestión de Tareas](#11-sistema-de-gestión-de-tareas)
    - 11.1 Concepto y modelo de datos
    - 11.2 Tablero Kanban con drag & drop
    - 11.3 Vistas: tablero, lista, calendario
    - 11.4 Tareas manuales vs generadas por IA
    - 11.5 Integración con videos y escenas
    - 11.6 API routes y realtime
12. [Rediseño de Pantallas — Análisis y Consolidación](#12-rediseño-de-pantallas)
    - 12.1 Diagnóstico de pantallas actuales
    - 12.2 Pantallas a fusionar
    - 12.3 Pantallas a eliminar
    - 12.4 Nueva navegación propuesta
    - 12.5 Rediseño del Storyboard
13. [IA Everywhere — Creación Manual + IA en Cada Punto](#13-ia-everywhere)
    - 13.1 Mapa completo de puntos de integración de IA
    - 13.2 Mejoras al motor de IA actual
    - 13.3 IA proactiva y sugerencias contextuales
    - 13.4 Nuevos tools de IA para tareas
    - 13.5 IA en el storyboard (inline)
    - 13.6 IA para generación de imagen y video
14. [Hacer Todo Funcional — Roadmap de Funcionalidad Completa](#14-hacer-todo-funcional)
    - 14.1 Funcionalidades pendientes detectadas
    - 14.2 Storyboard 100% funcional
    - 14.3 Generación de imágenes integrada
    - 14.4 Generación de video integrada
    - 14.5 Pipeline completo: prompt → imagen → video
    - 14.6 Plan de implementación ampliado (fases 6-8)

---

## 1. Resumen Ejecutivo

Este documento presenta un análisis profesional completo de Kiyoko AI y una propuesta integral para transformar la plataforma en 4 ejes principales:

1. **Sistema Multi-Video** (secciones 3-5) — Proyecto = Carpeta con Videos dentro. Escenas copiables entre videos.
2. **Gestión de Tareas** (sección 11) — Tablero Kanban con drag & drop, vistas por día y calendario, creación manual + IA.
3. **Rediseño de Pantallas** (sección 12) — Reducir de 11 páginas a 6. Fusionar Personajes+Fondos, eliminar páginas redundantes, integrar Arco/Timeline/Escenas dentro del Storyboard.
4. **IA Everywhere** (secciones 13-14) — IA de 3 niveles (un click, chat, proactiva). Botones [🤖] inline en cada campo. Pipeline completo de generación de imagen y video.

> **Concepto clave:** Proyecto = Carpeta. Videos = Producciones independientes dentro de esa carpeta. Las escenas pertenecen a videos concretos pero pueden copiarse/reutilizarse entre ellos. Cada paso del proceso tiene creación manual + IA. Todo es funcional, nada es decorativo.

El documento se organiza en tres bloques principales:

1. **Diagnóstico del estado actual** — Qué funciona bien y qué necesita mejora.
2. **Propuesta del sistema multi-video** — Arquitectura, modelo de datos, flujos de usuario y UX.
3. **Plan de implementación** — Fases, prioridades y dependencias técnicas.

---

## 2. Diagnóstico del Estado Actual

### 2.1 Fortalezas del Sistema

El análisis de la documentación revela una plataforma sólida con varias decisiones arquitectónicas acertadas:

- **Sistema de chat IA con action plans:** El flujo de aprobación antes de ejecutar cambios en la BD es una decisión excelente. El sistema de undo por batch es robusto y profesional.
- **Cadena de fallback de providers:** 8 proveedores con cooldown automático y fallback transparente garantiza alta disponibilidad sin intervención del usuario.
- **Modelo de datos exhaustivo:** La tabla `scenes` con 47 campos cubre todos los aspectos de producción profesional: cámara, iluminación, mood, narración, versionado.
- **Cifrado de API keys:** AES-256-GCM para las keys de usuario es la mejor práctica de la industria.
- **System prompt contextual:** Inyectar todos los datos del proyecto en el contexto de la IA permite respuestas muy precisas y acciones sobre datos reales.

### 2.2 Áreas de Mejora Detectadas

| Prioridad | Problema | Descripción | Estado |
|-----------|----------|-------------|--------|
| **ALTA** | Storyboard sin tiempo real | El storyboard no usa `useRealtimeProject`. Cuando la IA modifica escenas, el usuario debe recargar la página. Esto rompe la experiencia de trabajo con el chat. | Pendiente |
| **ALTA** | Sistema multi-video incompleto | Las tablas `video_cuts` y `video_cut_scenes` existen pero no hay UI para gestionarlos. El selector de chips en el chat es el único punto de contacto. | Pendiente |
| **MEDIA** | Regenerar timeline no implementado | El botón existe en la UI pero no tiene funcionalidad. El timeline debería regenerarse automáticamente al modificar escenas. | Pendiente |
| **MEDIA** | System prompt sin contexto de video | El system prompt no incluye información del video cut activo, lo que limita la precisión de la IA al trabajar con múltiples videos. | Pendiente |
| **MEDIA** | Sin copiar/pegar escenas entre videos | No existe mecanismo para reutilizar escenas entre video cuts. Es la funcionalidad más solicitada para el flujo multi-video. | Pendiente |
| **BAJA** | Filtros de escenas no persistidos | Los filtros se pierden al recargar. Deberían guardarse en la URL (query params) para poder compartir vistas filtradas. | Pendiente |
| **BAJA** | Sin previsualización de video | No hay forma de previsualizar cómo quedaría el video final con las escenas en orden. | Pendiente |

---

## 3. Propuesta: Sistema Multi-Video

### 3.1 Modelo Conceptual

La propuesta transforma la jerarquía del sistema de una estructura plana a una estructura anidada:

> ❌ **ANTES:** Proyecto → Escenas (todas juntas, `video_cut_id` opcional)

> ✅ **DESPUÉS:** Proyecto (carpeta) → Videos (producciones) → Escenas (pertenecen a un video, copiables entre videos)

#### Jerarquía propuesta

**Proyecto** = Carpeta del cliente/campaña. Contiene los recursos compartidos:

- Personajes (compartidos entre todos los videos del proyecto)
- Fondos/Localizaciones (compartidos entre todos los videos)
- Descripción general, brief, paleta de colores, estilo visual
- Reglas globales de la IA

**Video** = Producción individual dentro del proyecto. Tiene:

- Nombre, descripción, duración objetivo, plataforma destino
- Su propio conjunto de escenas (ordenadas independientemente)
- Su propio arco narrativo y timeline
- Fecha de entrega/publicación programada
- Estado independiente (borrador, en progreso, aprobado, publicado)

```
PROYECTO (Domenech Peluquerías)
├── 👥 Personajes: José, Conchi, Nerea, Raúl     ← COMPARTIDOS
├── 🏠 Fondos: Salón interior, Exterior           ← COMPARTIDOS
├── 🎨 Estilo: Pixar, paleta cálida               ← COMPARTIDO
│
├── 🎬 VIDEO: "Spot YouTube" (75s, 16:9)
│   ├── Escena 1: Hook - José recibiendo cliente
│   ├── Escena 2: Build - Transformación
│   ├── Escena 3: Peak - Resultado final
│   └── Escena 4: Close - Logo + CTA
│
├── 🎬 VIDEO: "Reel Instagram semana 12" (30s, 9:16)
│   ├── Escena 1: ← COPIADA de Spot YouTube E1 (recortada a 5s)
│   ├── Escena 2: ← COPIADA de Spot YouTube E3 (recortada a 8s)
│   └── Escena 3: Nueva - CTA adaptado a Instagram
│
├── 🎬 VIDEO: "TikTok Hook peluquería" (15s, 9:16)
│   ├── Escena 1: Nueva - Gancho viral
│   └── Escena 2: ← REFERENCIA a Spot YouTube E3 (misma escena)
│
└── 🎬 VIDEO: "Story Reveal" (5s, 9:16)
    └── Escena 1: ← COPIADA de Reel Instagram E2 (recortada a 5s)
```

### 3.2 Modelo de Datos Ampliado

Se propone evolucionar la tabla `video_cuts` existente y añadir campos nuevos.

#### Tabla: `videos` (evolución de `video_cuts`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador único del video |
| `project_id` | UUID FK | Referencia al proyecto padre |
| `title` | VARCHAR(255) | Nombre descriptivo: "Spot YouTube Semana 12" |
| `description` | TEXT | Descripción/brief específico del video |
| `slug` | VARCHAR(100) | URL-friendly, único dentro del proyecto |
| `target_duration_seconds` | INTEGER | Duración objetivo del video |
| `target_platform` | ENUM | youtube, instagram_reels, tiktok, tv, web, custom |
| `aspect_ratio` | VARCHAR(10) | 16:9, 9:16, 1:1, 4:5 |
| `status` | ENUM | draft, in_progress, review, approved, published, archived |
| `scheduled_date` | TIMESTAMP | Fecha programada de publicación |
| `scheduled_label` | VARCHAR(100) | "Semana que viene", "Semana peluquería" |
| `is_primary` | BOOLEAN | Si es el video principal del proyecto |
| `sort_order` | INTEGER | Orden en la lista de videos |
| `thumbnail_url` | TEXT | Miniatura del video |
| `completion_percentage` | INTEGER | Porcentaje completado (0-100) |
| `total_scenes` | INTEGER | Contador de escenas en este video |
| `estimated_duration` | INTEGER | Duración estimada calculada |
| `created_at / updated_at` | TIMESTAMP | Metadatos temporales |

#### SQL de migración

```sql
-- Renombrar y ampliar video_cuts → videos
ALTER TABLE video_cuts RENAME TO videos;

ALTER TABLE videos
  ADD COLUMN slug VARCHAR(100),
  ADD COLUMN description TEXT,
  ADD COLUMN aspect_ratio VARCHAR(10) DEFAULT '16:9',
  ADD COLUMN status VARCHAR(20) DEFAULT 'draft',
  ADD COLUMN scheduled_date TIMESTAMPTZ,
  ADD COLUMN scheduled_label VARCHAR(100),
  ADD COLUMN completion_percentage INTEGER DEFAULT 0,
  ADD COLUMN total_scenes INTEGER DEFAULT 0,
  ADD COLUMN estimated_duration INTEGER DEFAULT 0,
  ADD COLUMN thumbnail_url TEXT;

-- Índices
CREATE UNIQUE INDEX idx_videos_project_slug ON videos(project_id, slug);
CREATE INDEX idx_videos_scheduled ON videos(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_videos_status ON videos(project_id, status);
```

#### Tabla: `video_scenes` (evolución de `video_cut_scenes`)

Esta tabla es la **pieza clave** para el sistema de copiar/reutilizar escenas:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador único de la relación |
| `video_id` | UUID FK | Video al que pertenece esta instancia |
| `scene_id` | UUID FK | Escena original referenciada |
| `sort_order` | INTEGER | Posición de la escena dentro de este video |
| `is_copy` | BOOLEAN | `true` si fue copiada de otro video (referencia) |
| `source_video_id` | UUID FK NULL | Video de origen si es copia |
| `copy_type` | ENUM | `duplicate`, `reference`, `trimmed` |
| `override_duration` | INTEGER NULL | Duración personalizada (null = usar original) |
| `override_start_time` | FLOAT NULL | Tiempo de inicio dentro de este video |
| `override_end_time` | FLOAT NULL | Tiempo de fin dentro de este video |
| `trim_start` | FLOAT NULL | Segundo donde empieza el recorte (escena más corta) |
| `trim_end` | FLOAT NULL | Segundo donde termina el recorte |
| `notes` | TEXT | Notas específicas de esta escena en este video |
| `created_at` | TIMESTAMP | Cuándo se añadió al video |

```sql
-- Renombrar y ampliar
ALTER TABLE video_cut_scenes RENAME TO video_scenes;

ALTER TABLE video_scenes
  ADD COLUMN is_copy BOOLEAN DEFAULT false,
  ADD COLUMN source_video_id UUID REFERENCES videos(id),
  ADD COLUMN copy_type VARCHAR(20) DEFAULT 'duplicate',
  ADD COLUMN override_duration INTEGER,
  ADD COLUMN override_start_time FLOAT,
  ADD COLUMN override_end_time FLOAT,
  ADD COLUMN trim_start FLOAT,
  ADD COLUMN trim_end FLOAT,
  ADD COLUMN notes TEXT;

-- Índices
CREATE INDEX idx_video_scenes_video ON video_scenes(video_id, sort_order);
CREATE INDEX idx_video_scenes_source ON video_scenes(source_video_id) WHERE source_video_id IS NOT NULL;
```

#### Tabla: `video_narrative_arcs`

Cada video tiene su propio arco narrativo independiente del proyecto:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `video_id` | UUID FK | Video al que pertenece |
| `arc_number` | INTEGER | Orden del arco |
| `phase` | ENUM | hook, build, peak, close |
| `title` | VARCHAR(255) | Título del arco |
| `description` | TEXT | Descripción |
| `start_second` | INTEGER | Segundo de inicio |
| `end_second` | INTEGER | Segundo de fin |
| `scene_numbers` | TEXT[] | Escenas de este video incluidas en esta fase |

#### Tabla: `video_timeline_entries`

Timeline específico por video:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `video_id` | UUID FK | Video al que pertenece |
| `scene_id` | UUID FK | Escena relacionada |
| `title` | VARCHAR(255) | Título de la entrada |
| `description` | TEXT | Descripción |
| `start_time` | FLOAT | Tiempo de inicio |
| `end_time` | FLOAT | Tiempo de fin |
| `duration` | FLOAT | Duración |
| `arc_phase` | ENUM | Fase del arco narrativo |
| `timeline_version` | VARCHAR(10) | full, 30s, 15s |

### 3.3 Diagrama de Relaciones Actualizado

```
projects (1) ←── (N) videos
projects (1) ←── (N) characters          ← COMPARTIDOS
projects (1) ←── (N) backgrounds         ← COMPARTIDOS
projects (1) ←── (N) scenes              ← POOL GLOBAL

videos (1) ←── (N) video_scenes          ← RELACIÓN ESCENA↔VIDEO
videos (1) ←── (N) video_narrative_arcs  ← ARCO POR VIDEO
videos (1) ←── (N) video_timeline_entries ← TIMELINE POR VIDEO

scenes (1) ←── (N) video_scenes          ← UNA ESCENA PUEDE ESTAR EN N VIDEOS

video_scenes ──→ scene_id (FK scenes)
video_scenes ──→ video_id (FK videos)
video_scenes ──→ source_video_id (FK videos, NULL)  ← DE DÓNDE SE COPIÓ
```

### 3.4 Nuevos Enums de Base de Datos

```sql
-- Nuevo enum para estado de video (más granular que project_status)
CREATE TYPE video_status AS ENUM (
  'draft',        -- Recién creado, sin contenido
  'planning',     -- Definiendo estructura/escenas
  'in_progress',  -- Trabajando en contenido
  'review',       -- Pendiente de aprobación
  'approved',     -- Aprobado por el director/cliente
  'published',    -- Ya publicado en la plataforma
  'archived'      -- Archivado (no se muestra por defecto)
);

-- Enum para tipo de copia de escena
CREATE TYPE scene_copy_type AS ENUM (
  'original',     -- Escena creada directamente en este video
  'duplicate',    -- Copia completa independiente
  'reference',    -- Enlace a la escena original (comparten datos)
  'trimmed'       -- Copia con recorte temporal
);

-- Enum para aspect ratio (en vez de VARCHAR libre)
CREATE TYPE video_aspect_ratio AS ENUM (
  '16:9',   -- YouTube, TV, Web horizontal
  '9:16',   -- Reels, TikTok, Stories
  '1:1',    -- Feed Instagram, Facebook
  '4:5',    -- Feed Instagram vertical
  '4:3',    -- Presentaciones clásicas
  '21:9'    -- Cinematográfico ultrawide
);
```

### 3.5 Row Level Security (RLS) Policies

Políticas de seguridad para las nuevas tablas, siguiendo el patrón existente del sistema:

```sql
-- ═══ VIDEOS ═══
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- El owner del proyecto puede hacer CRUD en sus videos
CREATE POLICY "videos_select_own" ON videos FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "videos_insert_own" ON videos FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "videos_update_own" ON videos FOR UPDATE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

CREATE POLICY "videos_delete_own" ON videos FOR DELETE
  USING (project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  ));

-- Admin puede todo
CREATE POLICY "videos_admin_all" ON videos FOR ALL
  USING (is_admin());

-- Editor puede SELECT y UPDATE (no crear ni borrar videos)
CREATE POLICY "videos_editor_read" ON videos FOR SELECT
  USING (is_approved());
CREATE POLICY "videos_editor_update" ON videos FOR UPDATE
  USING (is_approved());

-- ═══ VIDEO_SCENES ═══
ALTER TABLE video_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_scenes_select_own" ON video_scenes FOR SELECT
  USING (video_id IN (
    SELECT v.id FROM videos v
    JOIN projects p ON p.id = v.project_id
    WHERE p.owner_id = auth.uid()
  ));

CREATE POLICY "video_scenes_insert_own" ON video_scenes FOR INSERT
  WITH CHECK (video_id IN (
    SELECT v.id FROM videos v
    JOIN projects p ON p.id = v.project_id
    WHERE p.owner_id = auth.uid()
  ));

CREATE POLICY "video_scenes_update_own" ON video_scenes FOR UPDATE
  USING (video_id IN (
    SELECT v.id FROM videos v
    JOIN projects p ON p.id = v.project_id
    WHERE p.owner_id = auth.uid()
  ));

CREATE POLICY "video_scenes_delete_own" ON video_scenes FOR DELETE
  USING (video_id IN (
    SELECT v.id FROM videos v
    JOIN projects p ON p.id = v.project_id
    WHERE p.owner_id = auth.uid()
  ));

CREATE POLICY "video_scenes_admin_all" ON video_scenes FOR ALL
  USING (is_admin());

-- Mismas políticas para video_narrative_arcs y video_timeline_entries
-- (mismo patrón: JOIN video → project → owner_id = auth.uid())
```

### 3.6 Funciones Helper de Supabase

Funciones SQL reutilizables para lógica de negocio compleja:

```sql
-- Calcular duración estimada de un video sumando sus escenas
CREATE OR REPLACE FUNCTION calculate_video_duration(p_video_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN vs.override_duration IS NOT NULL THEN vs.override_duration
      WHEN vs.copy_type = 'trimmed' AND vs.trim_start IS NOT NULL AND vs.trim_end IS NOT NULL
        THEN CEIL(vs.trim_end - vs.trim_start)::INTEGER
      ELSE s.duration_seconds
    END
  ), 0)::INTEGER
  FROM video_scenes vs
  JOIN scenes s ON s.id = vs.scene_id
  WHERE vs.video_id = p_video_id;
$$ LANGUAGE sql STABLE;

-- Calcular porcentaje de completado de un video
CREATE OR REPLACE FUNCTION calculate_video_completion(p_video_id UUID)
RETURNS INTEGER AS $$
  SELECT CASE
    WHEN COUNT(*) = 0 THEN 0
    ELSE (COUNT(*) FILTER (WHERE s.status IN ('generated', 'approved')) * 100 / COUNT(*))::INTEGER
  END
  FROM video_scenes vs
  JOIN scenes s ON s.id = vs.scene_id
  WHERE vs.video_id = p_video_id;
$$ LANGUAGE sql STABLE;

-- Actualizar stats del video (llamar después de cada mutación)
CREATE OR REPLACE FUNCTION update_video_stats(p_video_id UUID)
RETURNS VOID AS $$
  UPDATE videos SET
    total_scenes = (SELECT COUNT(*) FROM video_scenes WHERE video_id = p_video_id),
    estimated_duration = calculate_video_duration(p_video_id),
    completion_percentage = calculate_video_completion(p_video_id),
    updated_at = NOW()
  WHERE id = p_video_id;
$$ LANGUAGE sql VOLATILE;

-- Trigger: auto-actualizar stats cuando cambian video_scenes
CREATE OR REPLACE FUNCTION trigger_update_video_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_video_stats(OLD.video_id);
    RETURN OLD;
  ELSE
    PERFORM update_video_stats(NEW.video_id);
    IF TG_OP = 'UPDATE' AND OLD.video_id != NEW.video_id THEN
      PERFORM update_video_stats(OLD.video_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_scenes_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON video_scenes
  FOR EACH ROW EXECUTE FUNCTION trigger_update_video_stats();

-- Función para copiar escenas entre videos (operación atómica)
CREATE OR REPLACE FUNCTION copy_scenes_to_video(
  p_scene_ids UUID[],
  p_target_video_id UUID,
  p_source_video_id UUID,
  p_copy_type scene_copy_type DEFAULT 'duplicate',
  p_trim_start FLOAT DEFAULT NULL,
  p_trim_end FLOAT DEFAULT NULL
) RETURNS SETOF video_scenes AS $$
DECLARE
  v_scene_id UUID;
  v_new_scene_id UUID;
  v_max_order INTEGER;
  v_result video_scenes;
BEGIN
  SELECT COALESCE(MAX(sort_order), 0) INTO v_max_order
  FROM video_scenes WHERE video_id = p_target_video_id;

  FOREACH v_scene_id IN ARRAY p_scene_ids LOOP
    v_max_order := v_max_order + 1;

    IF p_copy_type = 'duplicate' THEN
      -- Crear una copia física de la escena en la tabla scenes
      INSERT INTO scenes (
        project_id, title, description, scene_type, arc_phase,
        duration_seconds, prompt_image, prompt_video, camera_angle,
        camera_movement, lighting, mood, background_id, character_ids,
        status, sort_order
      )
      SELECT
        project_id, title || ' (copia)', description, scene_type, arc_phase,
        duration_seconds, prompt_image, prompt_video, camera_angle,
        camera_movement, lighting, mood, background_id, character_ids,
        'draft', v_max_order
      FROM scenes WHERE id = v_scene_id
      RETURNING id INTO v_new_scene_id;

      INSERT INTO video_scenes (video_id, scene_id, sort_order, is_copy, source_video_id, copy_type)
      VALUES (p_target_video_id, v_new_scene_id, v_max_order, true, p_source_video_id, 'duplicate')
      RETURNING * INTO v_result;

    ELSIF p_copy_type = 'reference' THEN
      -- Solo crear la relación, sin duplicar la escena
      INSERT INTO video_scenes (video_id, scene_id, sort_order, is_copy, source_video_id, copy_type)
      VALUES (p_target_video_id, v_scene_id, v_max_order, true, p_source_video_id, 'reference')
      RETURNING * INTO v_result;

    ELSIF p_copy_type = 'trimmed' THEN
      -- Referencia con recorte temporal
      INSERT INTO video_scenes (
        video_id, scene_id, sort_order, is_copy, source_video_id,
        copy_type, trim_start, trim_end, override_duration
      )
      VALUES (
        p_target_video_id, v_scene_id, v_max_order, true, p_source_video_id,
        'trimmed', p_trim_start, p_trim_end,
        CEIL(p_trim_end - p_trim_start)::INTEGER
      )
      RETURNING * INTO v_result;
    END IF;

    RETURN NEXT v_result;
  END LOOP;

  PERFORM update_video_stats(p_target_video_id);
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Obtener todas las apariciones de una escena en diferentes videos
CREATE OR REPLACE FUNCTION get_scene_appearances(p_scene_id UUID)
RETURNS TABLE(
  video_id UUID,
  video_title VARCHAR,
  copy_type scene_copy_type,
  sort_order INTEGER,
  trim_start FLOAT,
  trim_end FLOAT
) AS $$
  SELECT v.id, v.title, vs.copy_type, vs.sort_order, vs.trim_start, vs.trim_end
  FROM video_scenes vs
  JOIN videos v ON v.id = vs.video_id
  WHERE vs.scene_id = p_scene_id
  ORDER BY v.sort_order;
$$ LANGUAGE sql STABLE;
```

### 3.7 Migración de Datos Existentes

Script completo para convertir los datos actuales al nuevo modelo sin perder nada:

```sql
-- ═══ MIGRACIÓN COMPLETA: video_cuts → videos ═══
-- Ejecutar en una transacción

BEGIN;

-- Paso 1: Renombrar tablas
ALTER TABLE video_cuts RENAME TO videos;
ALTER TABLE video_cut_scenes RENAME TO video_scenes;

-- Paso 2: Añadir nuevos campos a videos
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10) DEFAULT '16:9',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_label VARCHAR(100),
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_scenes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Paso 3: Añadir nuevos campos a video_scenes
ALTER TABLE video_scenes
  ADD COLUMN IF NOT EXISTS is_copy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_video_id UUID REFERENCES videos(id),
  ADD COLUMN IF NOT EXISTS copy_type VARCHAR(20) DEFAULT 'original',
  ADD COLUMN IF NOT EXISTS override_duration INTEGER,
  ADD COLUMN IF NOT EXISTS override_start_time FLOAT,
  ADD COLUMN IF NOT EXISTS override_end_time FLOAT,
  ADD COLUMN IF NOT EXISTS trim_start FLOAT,
  ADD COLUMN IF NOT EXISTS trim_end FLOAT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Paso 4: Generar slugs para videos existentes
UPDATE videos
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
)) || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE slug IS NULL;

-- Paso 5: Asignar status basado en el proyecto padre
UPDATE videos v
SET status = CASE
  WHEN p.status = 'completed' THEN 'approved'
  WHEN p.status = 'in_progress' THEN 'in_progress'
  ELSE 'draft'
END
FROM projects p
WHERE v.project_id = p.id AND v.status = 'draft';

-- Paso 6: Escenas con video_cut_id → crear video_scenes si no existen
INSERT INTO video_scenes (video_id, scene_id, sort_order, is_copy, copy_type)
SELECT s.video_cut_id, s.id, s.sort_order, false, 'original'
FROM scenes s
WHERE s.video_cut_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM video_scenes vs WHERE vs.scene_id = s.id AND vs.video_id = s.video_cut_id
  );

-- Paso 7: Escenas SIN video → asignar al video principal
INSERT INTO video_scenes (video_id, scene_id, sort_order, is_copy, copy_type)
SELECT
  (SELECT v.id FROM videos v WHERE v.project_id = s.project_id AND v.is_primary = true LIMIT 1),
  s.id, s.sort_order, false, 'original'
FROM scenes s
WHERE s.video_cut_id IS NULL
  AND EXISTS (SELECT 1 FROM videos v WHERE v.project_id = s.project_id AND v.is_primary = true)
  AND NOT EXISTS (SELECT 1 FROM video_scenes vs WHERE vs.scene_id = s.id);

-- Paso 8: Proyectos sin video → crear video principal automático
INSERT INTO videos (project_id, title, slug, is_primary, target_duration_seconds, target_platform, status)
SELECT
  p.id, 'Video Principal',
  'principal-' || SUBSTRING(p.id::TEXT, 1, 8),
  true, p.target_duration_seconds, p.target_platform::TEXT, p.status::TEXT
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM videos v WHERE v.project_id = p.id);

-- Paso 9: Crear índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_project_slug ON videos(project_id, slug);
CREATE INDEX IF NOT EXISTS idx_videos_scheduled ON videos(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(project_id, status);
CREATE INDEX IF NOT EXISTS idx_video_scenes_video ON video_scenes(video_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_video_scenes_source ON video_scenes(source_video_id) WHERE source_video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_scenes_scene ON video_scenes(scene_id);

-- Paso 10: Actualizar stats de todos los videos
DO $$
DECLARE v_id UUID;
BEGIN
  FOR v_id IN SELECT id FROM videos LOOP
    PERFORM update_video_stats(v_id);
  END LOOP;
END $$;

COMMIT;
```

### 3.8 Supabase Realtime para Nuevas Tablas

Extender el sistema de suscripciones en tiempo real:

```typescript
// hooks/useRealtimeVideo.ts
// Suscripción a cambios de un video específico (escenas, arco, timeline)
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useVideoStore } from '@/stores/useVideoStore';

export function useRealtimeVideo(videoId: string | null) {
  const { updateVideoScene, addVideoScene, removeVideoScene, updateVideo } = useVideoStore();

  useEffect(() => {
    if (!videoId) return;

    const channel = supabase
      .channel(`video-${videoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_scenes',
        filter: `video_id=eq.${videoId}`,
      }, (payload) => {
        switch (payload.eventType) {
          case 'INSERT': addVideoScene(payload.new); break;
          case 'UPDATE': updateVideoScene(payload.new.id, payload.new); break;
          case 'DELETE': removeVideoScene(payload.old.id); break;
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'videos',
        filter: `id=eq.${videoId}`,
      }, (payload) => {
        updateVideo(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [videoId]);
}
```

```typescript
// hooks/useRealtimeProjectVideos.ts
// Escucha cambios en la lista de videos del proyecto
export function useRealtimeProjectVideos(projectId: string | null) {
  const { addVideo, removeVideo, updateVideoInList } = useVideoStore();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-videos-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'videos',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        switch (payload.eventType) {
          case 'INSERT': addVideo(payload.new); break;
          case 'UPDATE': updateVideoInList(payload.new.id, payload.new); break;
          case 'DELETE': removeVideo(payload.old.id); break;
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);
}
```

### 3.9 Estructura de Archivos Nuevos

```
src/
├── app/
│   └── project/
│       └── [slug]/
│           └── videos/
│               ├── page.tsx                    ← Hub de videos (grid)
│               └── [videoSlug]/
│                   ├── page.tsx                ← Overview del video
│                   ├── storyboard/page.tsx     ← Storyboard filtrado por video
│                   ├── scenes/page.tsx         ← Lista de escenas del video
│                   ├── arc/page.tsx            ← Arco narrativo del video
│                   └── timeline/page.tsx       ← Timeline del video
│
├── components/
│   └── videos/
│       ├── VideoCard.tsx                       ← Card de video en el grid
│       ├── VideoGrid.tsx                       ← Grid/Lista de videos
│       ├── VideoCreateModal.tsx                ← Modal wizard para crear video
│       ├── VideoOverview.tsx                   ← Dashboard del video individual
│       ├── VideoCalendar.tsx                   ← Vista calendario mensual
│       ├── VideoStatusBadge.tsx                ← Badge de estado con color
│       ├── VideoPlatformBadge.tsx              ← Badge de plataforma con icono
│       ├── VideoPreviewPlayer.tsx              ← Previsualizador slideshow
│       ├── VideoCompare.tsx                    ← Comparador lado a lado
│       ├── SceneCopyModal.tsx                  ← Modal para copiar escenas
│       ├── SceneCopyGrid.tsx                   ← Grid de escenas seleccionables
│       ├── SceneTrimSlider.tsx                 ← Slider de recorte temporal
│       ├── SceneSourceBadge.tsx                ← Badge "Copiada de [Video X]"
│       └── SceneAppearancesPopover.tsx         ← Popover "Aparece en N videos"
│
├── stores/
│   └── useVideoStore.ts                       ← Zustand store completo
│
├── hooks/
│   ├── useRealtimeVideo.ts
│   └── useRealtimeProjectVideos.ts
│
└── api/
    └── videos/
        ├── route.ts                           ← GET lista, POST crear
        ├── [id]/
        │   ├── route.ts                       ← GET, PATCH, DELETE
        │   ├── scenes/
        │   │   ├── route.ts                   ← GET, POST
        │   │   ├── copy/route.ts              ← POST copiar escenas
        │   │   └── reorder/route.ts           ← PATCH reordenar
        │   └── export/[format]/route.ts       ← GET exportar
        └── calendar/route.ts                  ← GET calendario
```

---

## 4. Flujos de Usuario Detallados

### 4.1 Crear un Nuevo Video dentro de un Proyecto

Cuando el usuario entra en un proyecto y quiere crear un nuevo video:

1. **Navegar a `/project/[slug]/videos`** — Nueva página que muestra todos los videos del proyecto como cards.
2. **Click en "+ Nuevo Video"** — Abre un modal/wizard rápido.
3. **Rellenar datos básicos:** Título (ej: "Spot peluquería semana 12"), plataforma, duración objetivo, fecha programada (opcional), aspect ratio.
4. **Elegir cómo empezar:**
   - a) Vacío (sin escenas)
   - b) Copiar estructura de otro video
   - c) Generar con IA a partir de brief
5. **Se crea el video** y se navega a su storyboard específico.

### 4.2 Copiar Escenas entre Videos (Flujo Clave)

Este es el flujo más importante de la propuesta. Cuando el usuario añade una escena a un video:

> **Flujo:** Usuario está en Video B → Click "+ Añadir Escena" → Modal pregunta: "¿Quieres crear una escena nueva o copiar de otro video?" → Si elige copiar: se muestra lista de videos del proyecto → Selecciona Video A → Ve las escenas de Video A con thumbnails → Selecciona una o varias → Las escenas se copian al Video B.

#### Opciones al copiar una escena

| Tipo de Copia | Comportamiento |
|---------------|----------------|
| **Copia completa (duplicado)** | Se crea una nueva fila en `scenes` con los mismos datos. Es independiente del original. Los cambios en uno no afectan al otro. Ideal para adaptar la escena a otro formato/duración. |
| **Referencia (enlace)** | Se crea una entrada en `video_scenes` con `is_copy=true` apuntando a la escena original. Comparten imagen, prompt, descripción. Si se edita la original, la referencia también cambia. Ideal para reutilizar sin duplicar. |
| **Copia recortada** | Se copia la escena pero con `trim_start`/`trim_end` para acortarla. Por ejemplo, de una escena de 10s, solo usar los segundos 3 a 7. Ideal para versiones cortas (TikTok, Stories). |

#### Diagrama del flujo de copia

```
┌──────────────────────────────────────────────────┐
│  Modal: + Añadir Escena                          │
├──────────────────────────────────────────────────┤
│                                                   │
│  [Tab: Crear Nueva]  [Tab: Copiar de otro video] │
│                                                   │
│  ┌─ Seleccionar video origen ──────────────────┐ │
│  │  ▼ Spot YouTube 75s (12 escenas)            │ │
│  │    Reel Instagram 30s (5 escenas)           │ │
│  │    TikTok Hook 15s (3 escenas)              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Escenas de "Spot YouTube 75s":                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │ E1 │ │ E2 │ │ E3 │ │ E4 │                    │
│  │ ☑  │ │ ☐  │ │ ☑  │ │ ☐  │                    │
│  │Hook│ │Buil│ │Peak│ │Clos│                     │
│  └────┘ └────┘ └────┘ └────┘                    │
│                                                   │
│  Tipo: ○ Duplicado  ○ Referencia  ● Recortada    │
│                                                   │
│  Recorte: [====|========|====]  3s → 7s          │
│                                                   │
│  [ Copiar 2 escenas al video actual ]            │
└──────────────────────────────────────────────────┘
```

### 4.3 Duplicar un Video Completo

Flujo para crear una copia exacta de un video (útil para adaptar a otra plataforma):

1. En la card del video → menú contextual → **"Duplicar video"**
2. Modal de confirmación con opciones:
   - **Título del nuevo video** (pre-relleno: "Copia de [título original]")
   - **Plataforma destino** (puede cambiar, ej: de YouTube a TikTok)
   - **Aspect ratio** (se sugiere automáticamente según plataforma)
   - **¿Copiar escenas como duplicados o referencias?**
3. Se crea el video con todas sus `video_scenes` clonadas
4. Si se eligió otra plataforma, la IA puede sugerir ajustes de duración automáticamente

```
Flujo interno:
1. INSERT INTO videos (copia de todos los campos excepto id, slug, title)
2. Para cada video_scene del original:
   a) Si duplicado → copy_scenes_to_video() con copy_type='duplicate'
   b) Si referencia → copy_scenes_to_video() con copy_type='reference'
3. Copiar video_narrative_arcs del video original
4. Copiar video_timeline_entries del video original
5. update_video_stats() para el nuevo video
```

### 4.4 Eliminar un Video

Flujo con protección contra pérdida de datos:

1. Menú contextual → **"Eliminar video"**
2. Modal de confirmación muestra:
   - Nombre del video a eliminar
   - Número de escenas que pertenecen SOLO a este video (se perderían)
   - Número de escenas compartidas con otros videos (NO se pierden)
   - Número de escenas referenciadas desde otros videos (se romperían referencias)
3. Opciones:
   - **"Eliminar video y escenas exclusivas"** → borra video + video_scenes + scenes sin más referencias
   - **"Eliminar solo el video"** → borra video + video_scenes, pero conserva todas las scenes en el pool
   - **"Cancelar"**
4. Si hay escenas referenciadas desde otros videos → aviso: "3 escenas son referenciadas por 'Reel Instagram'. Las referencias se convertirán en duplicados."

```sql
-- Lógica de eliminación segura
CREATE OR REPLACE FUNCTION delete_video_safe(
  p_video_id UUID,
  p_delete_exclusive_scenes BOOLEAN DEFAULT false
) RETURNS JSON AS $$
DECLARE
  v_exclusive_scenes UUID[];
  v_shared_scenes UUID[];
  v_referenced_from UUID[];
  v_result JSON;
BEGIN
  -- Escenas que SOLO están en este video
  SELECT ARRAY_AGG(vs.scene_id) INTO v_exclusive_scenes
  FROM video_scenes vs
  WHERE vs.video_id = p_video_id
    AND NOT EXISTS (
      SELECT 1 FROM video_scenes vs2
      WHERE vs2.scene_id = vs.scene_id AND vs2.video_id != p_video_id
    );

  -- Escenas compartidas con otros videos
  SELECT ARRAY_AGG(DISTINCT vs.scene_id) INTO v_shared_scenes
  FROM video_scenes vs
  WHERE vs.video_id = p_video_id
    AND EXISTS (
      SELECT 1 FROM video_scenes vs2
      WHERE vs2.scene_id = vs.scene_id AND vs2.video_id != p_video_id
    );

  -- Escenas de este video referenciadas como source en otros
  SELECT ARRAY_AGG(DISTINCT vs2.video_id) INTO v_referenced_from
  FROM video_scenes vs2
  WHERE vs2.source_video_id = p_video_id AND vs2.video_id != p_video_id;

  -- Convertir referencias rotas en duplicados
  UPDATE video_scenes SET
    source_video_id = NULL,
    copy_type = 'duplicate',
    is_copy = false
  WHERE source_video_id = p_video_id AND video_id != p_video_id;

  -- Eliminar video_scenes de este video
  DELETE FROM video_scenes WHERE video_id = p_video_id;
  DELETE FROM video_narrative_arcs WHERE video_id = p_video_id;
  DELETE FROM video_timeline_entries WHERE video_id = p_video_id;

  -- Eliminar escenas exclusivas si se pidió
  IF p_delete_exclusive_scenes AND v_exclusive_scenes IS NOT NULL THEN
    DELETE FROM scenes WHERE id = ANY(v_exclusive_scenes);
  END IF;

  -- Eliminar el video
  DELETE FROM videos WHERE id = p_video_id;

  v_result := json_build_object(
    'deleted_video', p_video_id,
    'exclusive_scenes_deleted', CASE WHEN p_delete_exclusive_scenes THEN COALESCE(array_length(v_exclusive_scenes, 1), 0) ELSE 0 END,
    'shared_scenes_preserved', COALESCE(array_length(v_shared_scenes, 1), 0),
    'broken_references_fixed', COALESCE(array_length(v_referenced_from, 1), 0)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 4.5 Programar Videos con Fechas

Cada video puede tener una fecha programada y una etiqueta descriptiva:

- **`scheduled_date`:** `2026-03-25T10:00:00Z` (fecha real para ordenar y filtrar)
- **`scheduled_label`:** "Semana que viene", "Video peluquería marzo", "Campaña primavera" (texto libre para el usuario)

En la página `/project/[slug]/videos`, los videos se pueden ordenar por fecha programada, mostrando un calendario o línea temporal de publicaciones.

### 4.6 Navegación Actualizada

La sidebar del proyecto cambia para reflejar la nueva jerarquía:

```
PROYECTO
├── Overview (dashboard general)
├── 🎬 Videos ← NUEVA PÁGINA CENTRAL
│   ├── Spot YouTube 75s
│   ├── Reel Instagram 30s
│   └── TikTok Hook 15s
├── 👥 Personajes (compartidos)
├── 🏠 Fondos (compartidos)
├── 💬 Chat IA
├── 📊 Diagnóstico
├── 📦 Exportar
└── ⚙️ Ajustes
```

Al hacer click en un video de la sidebar se abre su contexto específico con sub-páginas propias:

```
VIDEO: "Spot YouTube 75s"
├── Storyboard       ← Escenas SOLO de este video
├── Arco Narrativo   ← Arco de ESTE video
├── Timeline         ← Timeline de ESTE video
├── Escenas          ← Lista detallada de ESTE video
└── Diagnóstico      ← Análisis de ESTE video
```

---

## 5. Diseño de Nuevas Páginas

### 5.1 Página `/project/[slug]/videos` — Hub de Videos

Esta es la nueva página central dentro de cada proyecto. Muestra todos los videos como cards en un grid.

#### Card de Video

- Thumbnail (primera escena con imagen generada, o gradiente fallback)
- Título del video en negrita
- Badge de plataforma (YouTube, Instagram, TikTok, etc.)
- Duración: "45s / 75s objetivo" con barra de progreso
- Escenas: "12 escenas" con iconos de estado
- Fecha programada: "25 Mar 2026" o "Sin programar"
- Estado: badge de color (borrador, en progreso, aprobado, publicado)
- Menú contextual: Duplicar video, Renombrar, Archivar, Eliminar

#### Acciones Globales

- Botón **"+ Nuevo Video"** (prominente, esquina superior derecha)
- Filtros: por estado, por plataforma
- Ordenar: por fecha programada, por fecha de creación, por progreso
- Vista: Grid (cards) o Lista (tabla compacta)
- Vista calendario: ver los videos programados en formato mensual

#### Mockup conceptual

```
┌─────────────────────────────────────────────────────────────────┐
│  🎬 Videos del Proyecto              [Filtros ▼] [+ Nuevo Video]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌────────────┐ │ │
│  │ │  Thumbnail   │ │  │ │  Thumbnail   │ │  │ │ Thumbnail  │ │ │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └────────────┘ │ │
│  │ Spot YouTube     │  │ Reel Instagram   │  │ TikTok Hook    │ │
│  │ 🟢 En progreso   │  │ 🟡 Borrador      │  │ ⚪ Sin empezar │ │
│  │ 75s · 16:9       │  │ 30s · 9:16       │  │ 15s · 9:16     │ │
│  │ 12 escenas       │  │ 5 escenas        │  │ 0 escenas      │ │
│  │ ████████░░ 80%   │  │ ███░░░░░░░ 30%   │  │ ░░░░░░░░░░ 0% │ │
│  │ 📅 25 Mar 2026   │  │ 📅 28 Mar 2026   │  │ Sin programar  │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Página `/project/[slug]/videos/[videoSlug]` — Video Individual

Al entrar en un video específico, se muestra un sub-dashboard con:

- Hero con título del video, plataforma, aspect ratio, duración
- Stats cards: escenas, duración actual vs objetivo, % completado
- Quick actions: Ir al storyboard, Añadir escenas, Ver timeline
- Grid de escenas en miniatura (preview rápido)
- Acceso a Arco Narrativo y Timeline del video

### 5.3 Modal de Copiar Escenas

Cuando el usuario pulsa "+ Añadir Escena" en un video, aparece un modal con dos tabs:

**Tab 1: Crear Nueva**
- Formulario rápido: título, descripción, duración
- Opción de generar con IA (como el flujo actual)

**Tab 2: Copiar de Otro Video**
- Selector de video origen (dropdown con todos los videos del proyecto)
- Grid de escenas del video seleccionado con thumbnails y checkbox
- Selección múltiple (shift+click para rango)
- Tipo de copia: Duplicado completo / Referencia / Recortada
- Si se elige Recortada: slider para definir `trim_start` y `trim_end`
- Botón "Copiar N escenas al video actual"

---

## 6. Integración con la IA

### 6.1 Contexto del Video Activo en el System Prompt

Cuando el usuario está trabajando dentro de un video específico, el system prompt debe incluir una nueva sección:

```
═══ VIDEO ACTIVO ═══
Título: "Reel Instagram semana 12"
ID: uuid-del-video
Plataforma: instagram_reels
Aspect ratio: 9:16
Duración objetivo: 30s
Duración estimada: 24s
Fecha programada: 28 Mar 2026
Estado: borrador
Escenas: 5 (2 copiadas de "Spot YouTube", 3 propias)

═══ ESCENAS DEL VIDEO (5) ═══
[Solo las escenas de ESTE video, no todas las del proyecto]

═══ ARCO NARRATIVO DEL VIDEO ═══
[Arco específico de este video]

═══ OTROS VIDEOS DEL PROYECTO (3) ═══
- "Spot YouTube" (75s, 12 escenas, 80% completado)
- "TikTok Hook" (15s, 0 escenas, sin empezar)
- "Story Reveal" (5s, 1 escena, borrador)
[Para que la IA sepa de dónde puede sugerir copiar escenas]
```

### 6.2 Nuevos Tools de IA (Vercel AI SDK)

| Tool | Parámetros | Descripción |
|------|-----------|-------------|
| `copySceneToVideo` | `sceneId, targetVideoId, copyType, trimStart?, trimEnd?` | Copiar una o varias escenas de un video a otro, con opción de duplicado, referencia o recortada. |
| `createVideo` | `title, platform, duration, aspectRatio, scheduledDate?, scheduledLabel?` | Crear un nuevo video dentro del proyecto con parámetros básicos. |
| `reorderVideoScenes` | `videoId, sceneOrder[{videoSceneId, newSortOrder}]` | Reorganizar el orden de las escenas dentro de un video específico. |
| `trimSceneForVideo` | `videoSceneId, trimStart, trimEnd` | Ajustar `trim_start`/`trim_end` de una escena copiada para hacerla más corta. |
| `generateVideoFromBrief` | `brief, platform, duration, reuseFromVideoId?` | Generar un video completo con escenas a partir de un brief, reutilizando escenas existentes cuando sea posible. |
| `syncSceneReference` | `sceneId` | Actualizar todas las referencias de una escena original cuando se modifica. |
| `suggestScenesToReuse` | `targetVideoId, brief?` | Analizar los videos existentes y sugerir qué escenas podrían reutilizarse en un nuevo video. |
| `updateVideo` | `videoId, changes{}, reason` | Actualizar campos de un video (título, fecha, estado, etc.). |
| `deleteVideo` | `videoId, reason` | Eliminar un video (con confirmación de qué pasa con sus escenas). |

### 6.3 Ejemplo de Interacción con la IA

> **Usuario:** "Voy a crear el video para la peluquería de la semana que viene. Quiero usar las 3 primeras escenas del spot de YouTube pero más cortas, y añadir 2 escenas nuevas para el cierre."

> **Kiyoko IA:** Analiza el proyecto, identifica las escenas E1-E3 del spot YouTube, propone copiarlas con recorte (de 8s a 4s cada una), sugiere 2 escenas nuevas de cierre adaptadas a Instagram Reels (9:16), y genera un action plan con 5 acciones para aprobación.

```json
{
  "type": "action_plan",
  "summary_es": "Crear video 'Reel Peluquería Semana 13' con 3 escenas copiadas del Spot YouTube (recortadas) + 2 escenas nuevas de cierre",
  "actions": [
    {
      "id": "uuid-1",
      "type": "create_video",
      "description_es": "Crear video 'Reel Peluquería Semana 13' para Instagram Reels",
      "changes": {
        "title": "Reel Peluquería Semana 13",
        "platform": "instagram_reels",
        "target_duration": 30,
        "aspect_ratio": "9:16",
        "scheduled_label": "Semana que viene"
      }
    },
    {
      "id": "uuid-2",
      "type": "copy_scene_to_video",
      "description_es": "Copiar E1 (Hook - José recibiendo) recortada de 8s a 4s",
      "source": { "sceneId": "uuid-e1", "videoTitle": "Spot YouTube" },
      "target": { "videoTitle": "Reel Peluquería Semana 13" },
      "copyType": "trimmed",
      "trimStart": 0,
      "trimEnd": 4
    },
    {
      "id": "uuid-3",
      "type": "copy_scene_to_video",
      "description_es": "Copiar E2 (Build - Transformación) recortada de 10s a 5s",
      "source": { "sceneId": "uuid-e2" },
      "copyType": "trimmed",
      "trimStart": 2,
      "trimEnd": 7
    },
    {
      "id": "uuid-4",
      "type": "copy_scene_to_video",
      "description_es": "Copiar E3 (Peak - Resultado) recortada de 8s a 4s",
      "source": { "sceneId": "uuid-e3" },
      "copyType": "trimmed",
      "trimStart": 1,
      "trimEnd": 5
    },
    {
      "id": "uuid-5",
      "type": "create_scene",
      "description_es": "Crear escena nueva: CTA vertical con logo y enlace",
      "changes": {
        "title": "CTA Instagram",
        "description": "Pantalla final con logo Domenech, enlace a reservas y texto 'Pide tu cita'",
        "duration_seconds": 5,
        "arc_phase": "close",
        "camera_angle": "medium"
      }
    }
  ],
  "total_scenes_affected": 5,
  "warnings": [
    "Las escenas copiadas mantendrán el formato 16:9 original. Considerar regenerar prompts de imagen en formato 9:16 para Instagram."
  ]
}
```

### 6.4 Reglas Actualizadas del System Prompt

Añadir estas reglas a las 12 existentes:

```
13. Cuando trabajes dentro de un video específico, opera SOLO sobre las escenas de ese video.
14. Al copiar escenas, siempre indica el video de origen y el tipo de copia (duplicado/referencia/recortada).
15. Si detectas que una escena podría reutilizarse de otro video, sugérelo antes de crear una nueva.
16. Al crear un video nuevo, sugiere un scheduled_label descriptivo basado en el contexto.
17. Las tablas modificables ahora incluyen: videos, video_scenes, video_narrative_arcs, video_timeline_entries.
```

---

## 7. Mejoras Adicionales Propuestas

### 7.1 Mejoras Técnicas Prioritarias

| Mejora | Prioridad | Detalle |
|--------|-----------|---------|
| Activar Realtime en Storyboard | **ALTA** | Conectar `useRealtimeProject` en la página de storyboard para que los cambios de la IA se reflejen sin recargar. Es crítico para la experiencia de trabajo con el chat. |
| Filtros en URL (query params) | **MEDIA** | Guardar `sceneTypeFilter`, `arcPhaseFilter` y `searchQuery` en la URL. Permite compartir vistas filtradas y no perder estado al navegar. |
| Regeneración automática de timeline | **MEDIA** | Cuando se añaden/eliminan/reordenan escenas, recalcular automáticamente el timeline. Disparar vía trigger de Supabase o post-mutation. |
| Previsualización de secuencia | **MEDIA** | Un reproductor básico que muestra las imágenes generadas en secuencia con la duración de cada escena. Tipo slideshow temporizado. |
| Exportación por video | **MEDIA** | Añadir la opción de exportar un video específico (no todo el proyecto). El PDF/HTML solo incluiría las escenas de ese video. |
| Drag & drop para reordenar escenas | **BAJA** | En el storyboard, permitir arrastrar escenas para cambiar su orden. Actualmente requiere edición manual de `sort_order`. |
| Notificaciones de fecha programada | **BAJA** | Alerta visual cuando un video se acerca a su fecha programada y no está completado. |

### 7.2 Zustand Store Completo para Videos

```typescript
// stores/useVideoStore.ts
import { create } from 'zustand';

interface Video {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  description: string | null;
  target_duration_seconds: number;
  target_platform: string;
  aspect_ratio: string;
  status: string;
  scheduled_date: string | null;
  scheduled_label: string | null;
  is_primary: boolean;
  sort_order: number;
  thumbnail_url: string | null;
  completion_percentage: number;
  total_scenes: number;
  estimated_duration: number;
  created_at: string;
  updated_at: string;
}

interface VideoScene {
  id: string;
  video_id: string;
  scene_id: string;
  sort_order: number;
  is_copy: boolean;
  source_video_id: string | null;
  copy_type: 'original' | 'duplicate' | 'reference' | 'trimmed';
  override_duration: number | null;
  trim_start: number | null;
  trim_end: number | null;
  notes: string | null;
  // Joined data (cargado con la escena)
  scene?: Scene;
  source_video_title?: string;
}

interface VideoStore {
  // Estado
  videos: Video[];
  activeVideoId: string | null;
  activeVideoSlug: string | null;
  videoScenes: VideoScene[];
  loading: boolean;
  error: string | null;

  // Acciones - Videos
  setVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;
  updateVideoInList: (id: string, changes: Partial<Video>) => void;
  removeVideo: (id: string) => void;
  setActiveVideo: (id: string | null, slug?: string | null) => void;
  updateVideo: (video: Partial<Video>) => void;

  // Acciones - VideoScenes
  setVideoScenes: (scenes: VideoScene[]) => void;
  addVideoScene: (scene: VideoScene) => void;
  updateVideoScene: (id: string, changes: Partial<VideoScene>) => void;
  removeVideoScene: (id: string) => void;
  reorderVideoScenes: (orderedIds: string[]) => void;

  // Acciones - Carga
  fetchVideos: (projectId: string) => Promise<void>;
  fetchVideoScenes: (videoId: string) => Promise<void>;
  fetchVideoWithScenes: (videoSlug: string, projectId: string) => Promise<void>;

  // Computed
  getActiveVideo: () => Video | null;
  getVideoById: (id: string) => Video | undefined;
  getScenesForVideo: (videoId: string) => VideoScene[];
  getSceneAppearances: (sceneId: string) => { videoId: string; videoTitle: string; copyType: string }[];

  // Reset
  reset: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [],
  activeVideoId: null,
  activeVideoSlug: null,
  videoScenes: [],
  loading: false,
  error: null,

  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((s) => ({ videos: [...s.videos, video] })),
  updateVideoInList: (id, changes) => set((s) => ({
    videos: s.videos.map((v) => v.id === id ? { ...v, ...changes } : v),
  })),
  removeVideo: (id) => set((s) => ({
    videos: s.videos.filter((v) => v.id !== id),
    activeVideoId: s.activeVideoId === id ? null : s.activeVideoId,
  })),
  setActiveVideo: (id, slug) => set({ activeVideoId: id, activeVideoSlug: slug ?? null }),
  updateVideo: (video) => set((s) => ({
    videos: s.videos.map((v) => v.id === video.id ? { ...v, ...video } : v),
  })),

  setVideoScenes: (scenes) => set({ videoScenes: scenes }),
  addVideoScene: (scene) => set((s) => ({
    videoScenes: [...s.videoScenes, scene].sort((a, b) => a.sort_order - b.sort_order),
  })),
  updateVideoScene: (id, changes) => set((s) => ({
    videoScenes: s.videoScenes.map((vs) => vs.id === id ? { ...vs, ...changes } : vs),
  })),
  removeVideoScene: (id) => set((s) => ({
    videoScenes: s.videoScenes.filter((vs) => vs.id !== id),
  })),
  reorderVideoScenes: (orderedIds) => set((s) => ({
    videoScenes: orderedIds.map((id, index) => {
      const scene = s.videoScenes.find((vs) => vs.id === id);
      return scene ? { ...scene, sort_order: index + 1 } : scene!;
    }),
  })),

  fetchVideos: async (projectId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    if (error) set({ error: error.message, loading: false });
    else set({ videos: data ?? [], loading: false });
  },

  fetchVideoScenes: async (videoId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('video_scenes')
      .select(`
        *,
        scene:scenes(*),
        source_video:videos!video_scenes_source_video_id_fkey(title)
      `)
      .eq('video_id', videoId)
      .order('sort_order');
    if (error) set({ error: error.message, loading: false });
    else set({
      videoScenes: (data ?? []).map((vs) => ({
        ...vs,
        source_video_title: vs.source_video?.title ?? null,
      })),
      loading: false,
    });
  },

  fetchVideoWithScenes: async (videoSlug, projectId) => {
    set({ loading: true });
    const { data: video } = await supabase
      .from('videos')
      .select('*')
      .eq('project_id', projectId)
      .eq('slug', videoSlug)
      .single();
    if (video) {
      set({ activeVideoId: video.id, activeVideoSlug: video.slug });
      await get().fetchVideoScenes(video.id);
    }
    set({ loading: false });
  },

  getActiveVideo: () => {
    const { videos, activeVideoId } = get();
    return videos.find((v) => v.id === activeVideoId) ?? null;
  },
  getVideoById: (id) => get().videos.find((v) => v.id === id),
  getScenesForVideo: (videoId) => get().videoScenes.filter((vs) => vs.video_id === videoId),
  getSceneAppearances: (sceneId) => {
    const { videoScenes, videos } = get();
    return videoScenes
      .filter((vs) => vs.scene_id === sceneId)
      .map((vs) => ({
        videoId: vs.video_id,
        videoTitle: videos.find((v) => v.id === vs.video_id)?.title ?? 'Desconocido',
        copyType: vs.copy_type,
      }));
  },

  reset: () => set({
    videos: [], activeVideoId: null, activeVideoSlug: null,
    videoScenes: [], loading: false, error: null,
  }),
}));
```

### 7.3 Actualización del Change History para Videos

El sistema de undo existente debe adaptarse para soportar las nuevas acciones:

```typescript
// Nuevos tipos de cambio en change_history
type ChangeAction =
  | 'create_video'
  | 'update_video'
  | 'delete_video'
  | 'add_scene_to_video'
  | 'remove_scene_from_video'
  | 'copy_scene_to_video'
  | 'reorder_video_scenes'
  | 'trim_scene_in_video'
  // + los existentes: update_scene, create_scene, delete_scene, etc.
```

```sql
-- Ejemplo de registro de cambio para copiar escena
INSERT INTO change_history (
  project_id, batch_id, entity_type, entity_id,
  action, field_name, old_value, new_value, description
) VALUES (
  'project-uuid', 'batch-uuid', 'video_scene', 'new-vs-uuid',
  'copy_scene_to_video', NULL, NULL,
  '{"video_id":"target-uuid","scene_id":"scene-uuid","copy_type":"trimmed","trim_start":2,"trim_end":7}',
  'Copiar escena E1 al video Reel Instagram (recortada 2s-7s)'
);
```

La función `undoBatch` debe extenderse para revertir:

- **copy_scene_to_video** → eliminar `video_scene` + eliminar `scene` si fue duplicado
- **create_video** → `delete_video_safe()`
- **add_scene_to_video** → eliminar `video_scene`
- **remove_scene_from_video** → re-insertar `video_scene`
- **reorder_video_scenes** → restaurar `sort_order` originales
- **trim_scene_in_video** → restaurar `trim_start`/`trim_end`/`override_duration` originales

### 7.4 Previsualizador de Video (Slideshow Player)

Componente para previsualizar cómo quedará el video final:

```typescript
// components/videos/VideoPreviewPlayer.tsx
// Concepto funcional
interface PreviewPlayerProps {
  videoId: string;
  videoScenes: VideoScene[];
}

// Funcionalidades:
// - Muestra las imágenes generadas de cada escena en secuencia
// - Respeta la duración de cada escena (trim si aplica)
// - Barra de progreso inferior con segmentos por escena
// - Controles: Play/Pause, Anterior, Siguiente, velocidad (0.5x, 1x, 2x)
// - Indicador de escena actual: "E3/12 - Hook: José recibiendo (4s)"
// - Badge de origen si es copiada: "Copiada de Spot YouTube"
// - Placeholder animado si la escena no tiene imagen generada
// - Aspect ratio del contenedor se ajusta al del video (16:9, 9:16, etc.)
// - Fullscreen toggle
// - Duración total: "12s / 30s objetivo"
```

```
┌────────────────────────────────────┐
│                                     │
│       [Imagen de la escena]        │
│                                     │
│       E3/12 · Hook · 4s            │
│       "José recibiendo cliente"     │
│       📋 Copiada de Spot YouTube    │
│                                     │
├────────────────────────────────────┤
│ [██████|████|██|░░░░░░░░░]  12/30s │
│  E1     E2   E3  E4...             │
├────────────────────────────────────┤
│  [◀]  [▶ Play]  [▶]   [1x▼] [⛶]  │
└────────────────────────────────────┘
```

### 7.5 Vista Calendario de Publicaciones

Componente calendario para planificar publicaciones:

```
┌─────────────────────────────────────────────────────────┐
│  📅 Calendario de Publicaciones          [◀ Mar 2026 ▶] │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │     │     │     │  1  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  2  │  3  │  4  │  5  │  6  │  7  │  8  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │
│     │     │     │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │
│     │     │ ┌─┐ │     │     │ ┌─┐ │     │
│     │     │ │Y│ │     │     │ │I│ │     │
│     │     │ └─┘ │     │     │ └─┘ │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 30  │ 31  │     │     │     │     │     │
│ ┌─┐ │     │     │     │     │     │     │
│ │T│ │     │     │     │     │     │     │
│ └─┘ │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Y = Spot YouTube (25 Mar) 🟢 Aprobado
I = Reel Instagram (28 Mar) 🟡 En progreso
T = TikTok Hook (30 Mar) 🔴 Sin empezar
```

- Click en un video del calendario → navega a su overview
- Drag & drop para mover fechas programadas
- Badges de color según estado del video
- Vista por proyecto (un calendario) o global (todos los proyectos)

### 7.6 Páginas Actualizadas del Sistema Existente

#### Overview del Proyecto (`/project/[slug]`) — Cambios

Añadir una nueva sección de videos al overview existente:

```
┌──────────────────────────────────────────────────────┐
│  Stats Cards (existentes + nuevas)                    │
│  [Escenas: 45]  [Personajes: 4]  [Fondos: 3]        │
│  [Videos: 4]    [Próx. publicación: 25 Mar]          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  🎬 Videos del Proyecto                   [Ver todos] │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Spot YT    │ │ Reel IG    │ │ TikTok     │       │
│  │ 🟢 80%     │ │ 🟡 30%     │ │ 🔴 0%      │       │
│  │ 📅 25 Mar  │ │ 📅 28 Mar  │ │ Sin fecha  │       │
│  └────────────┘ └────────────┘ └────────────┘       │
│                                                       │
│  [Actividad reciente]  [Info del proyecto]            │
└──────────────────────────────────────────────────────┘
```

#### Dashboard Global (`/dashboard`) — Cambios

Las cards de proyecto en el dashboard muestran info de videos:

- Número de videos en el proyecto
- Próxima fecha de publicación
- Progreso del video más cercano a su fecha
- Mini-badges de plataformas usadas (iconos de YouTube, IG, TikTok)

#### Command Menu (`⌘K`) — Nuevas Acciones

```
Nuevos resultados en el Command Menu:
- "Ir a Spot YouTube" → navega al video
- "Crear nuevo video en Domenech" → abre wizard
- "Copiar escenas al Reel Instagram" → abre modal de copia
- "Ver calendario de publicaciones" → navega al calendario
- Búsqueda filtra también por títulos de video
```

#### Quick Actions del Chat — Actualizadas

Añadir nuevas quick actions al panel de chat:

| # | Acción | Icono | Qué prompt envía |
|---|--------|-------|-----------------|
| 9 | Crear video | 🎬 | "Quiero crear un nuevo video para este proyecto. Pregúntame sobre la plataforma, duración y contenido." |
| 10 | Reutilizar escenas | 🔄 | "Analiza los videos existentes y sugiere qué escenas podría reutilizar para crear un nuevo video corto." |
| 11 | Estado de videos | 📊 | "Dame un resumen de todos los videos del proyecto: estado, progreso, fechas programadas y qué falta por completar." |
| 12 | Adaptar a plataforma | 📱 | "Quiero adaptar el video principal a otra plataforma. Sugiere qué escenas copiar, cuáles recortar y qué cambiar." |

### 7.7 Edge Cases y Manejo de Errores

#### Escenas referenciadas que se eliminan

Cuando se elimina una escena original que tiene referencias en otros videos:

```
Escenario: E3 del Spot YouTube está referenciada en Reel Instagram y TikTok Hook.
El usuario quiere borrar E3 del Spot YouTube.

Opciones mostradas al usuario:
1. "Convertir referencias en duplicados" → las escenas de Reel e IG se convierten
   en copias independientes antes de borrar la original
2. "Eliminar de todos los videos" → se eliminan las video_scenes de todos los videos
3. "Cancelar" → no hacer nada

Nunca se permite dejar una video_scene apuntando a una scene que no existe.
```

#### Video sin escenas

```
Estado vacío en la página de video:
- Icono grande de película
- Texto: "Este video no tiene escenas todavía"
- 3 botones:
  - "Crear primera escena" → formulario rápido
  - "Copiar escenas de otro video" → modal de copia
  - "Generar con IA" → prompt en el chat
```

#### Proyecto sin videos (migración)

```
Si el usuario accede a /project/[slug]/videos y no hay videos:
- Se muestra un estado vacío con onboarding
- Botón "Crear tu primer video" crea el video principal automáticamente
  con todas las escenas existentes del proyecto
- Esto es la migración lazy: solo se crea cuando el usuario accede
```

#### Concurrencia: dos usuarios editando el mismo video

```
Supabase Realtime resuelve esto:
- Si usuario A reordena escenas mientras usuario B está viendo el storyboard,
  el storyboard de B se actualiza en tiempo real
- Si ambos intentan editar la misma escena, last-write-wins (como el resto del sistema)
- El change_history registra quién hizo cada cambio
```

#### Límite de escenas por video

```
Recomendación: no más de 100 escenas por video (rendimiento del storyboard).
Si se intenta copiar más de 50 escenas de golpe:
- Modal de advertencia: "Vas a copiar 67 escenas. Esto puede tardar unos segundos."
- Ejecución en background con barra de progreso
- Usar la función SQL copy_scenes_to_video() que es transaccional
```

### 7.8 Consideraciones de Performance

#### Carga de datos

```
Problema: Al cargar un proyecto, ahora hay más datos (videos + video_scenes).
Solución: Carga progresiva.

1. Al entrar al proyecto → cargar solo projects + videos (lista ligera)
2. Al entrar a un video → cargar video_scenes + scenes JOIN (solo de ese video)
3. Al abrir storyboard → cargar scenes completas (47 campos, solo del video activo)
4. Personajes y fondos → cargar al nivel de proyecto (compartidos)
```

#### Índices clave

```sql
-- Los más críticos para rendimiento
CREATE INDEX idx_video_scenes_video_order ON video_scenes(video_id, sort_order);
CREATE INDEX idx_video_scenes_scene ON video_scenes(scene_id);  -- Para get_scene_appearances
CREATE INDEX idx_videos_project ON videos(project_id, sort_order);
CREATE INDEX idx_videos_scheduled ON videos(scheduled_date) WHERE scheduled_date IS NOT NULL;
```

#### System prompt optimizado

```
Problema: Con múltiples videos, el system prompt podría crecer demasiado.
Solución:
- Si hay video activo → solo incluir escenas de ese video (no todas las del proyecto)
- Incluir resumen ligero de otros videos (título, plataforma, nº escenas)
- No incluir escenas completas de otros videos (solo referencia para copias)
- Estimación: de ~4000 tokens (actual) a ~3000 tokens (optimizado por video)
```

### 7.9 Nuevos Stores de Zustand (Resumen)

| Store | Datos | Persistido | Dónde |
|-------|-------|-----------|-------|
| `useVideoStore` | `videos[]`, `activeVideoId`, `activeVideoSlug`, `videoScenes[]`, `loading`, `error` | No (se recarga del servidor) | Memoria |
| `useKiyokoChat` (actualizado) | Añadir `activeVideoId` en vez de `activeVideoCutId` | No | Memoria |
| `useUIStore` (actualizado) | Añadir `videosView` (grid/list/calendar) | Sí | localStorage |

### 7.10 Nuevas API Routes (Completas)

| Método | Ruta | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/projects/[id]/videos` | — | `{ videos: Video[] }` |
| POST | `/api/projects/[id]/videos` | `{ title, platform, duration, aspectRatio, scheduledDate?, scheduledLabel? }` | `{ video: Video }` |
| GET | `/api/videos/[id]` | — | `{ video: Video, scenes: VideoScene[] }` |
| PATCH | `/api/videos/[id]` | `{ changes: Partial<Video> }` | `{ video: Video }` |
| DELETE | `/api/videos/[id]` | `{ deleteExclusiveScenes?: boolean }` | `{ result: DeleteResult }` |
| GET | `/api/videos/[id]/scenes` | — | `{ scenes: VideoScene[] }` |
| POST | `/api/videos/[id]/scenes` | `{ sceneId?, title?, description?, duration? }` | `{ videoScene: VideoScene }` |
| POST | `/api/videos/[id]/scenes/copy` | `{ sceneIds: UUID[], sourceVideoId, copyType, trimStart?, trimEnd? }` | `{ copiedScenes: VideoScene[] }` |
| PATCH | `/api/videos/[id]/scenes/reorder` | `{ orderedSceneIds: UUID[] }` | `{ success: boolean }` |
| DELETE | `/api/videos/[id]/scenes/[vsId]` | — | `{ success: boolean }` |
| GET | `/api/videos/[id]/export/[format]` | — | Archivo (HTML/JSON/MD/PDF) |
| POST | `/api/videos/[id]/duplicate` | `{ title, platform?, copyType }` | `{ video: Video }` |
| GET | `/api/projects/[id]/calendar` | `{ month?, year? }` | `{ videos: VideoCalendarItem[] }` |
| GET | `/api/scenes/[id]/appearances` | — | `{ appearances: Appearance[] }` |

### 7.11 Mejoras de Experiencia de Usuario

- **Vista calendario de videos:** Un calendario mensual donde los videos programados aparecen como bloques. Permite planificar contenido a nivel semanal/mensual.
- **Dashboard de progreso multi-video:** En el overview del proyecto, mostrar una tabla con todos los videos, su estado, % completado y próxima fecha.
- **Comparador de videos:** Ver dos videos lado a lado para comparar escenas compartidas y cómo se adaptan a diferentes plataformas.
- **Plantillas de video:** Guardar un video como plantilla para reutilizar su estructura (sin contenido) en futuros proyectos.
- **Historial de escena:** Ver en qué videos aparece una escena (original + copias/referencias). Útil para saber el impacto de editar una escena.
- **Indicador de escenas compartidas:** En el storyboard, badge visual que indica "Esta escena aparece en 3 videos" con link a cada uno.
- **Bulk operations:** Seleccionar múltiples escenas y moverlas/copiarlas a otro video de golpe.
- **Atajos de teclado:** `Ctrl+Shift+V` para crear nuevo video, `Ctrl+Shift+C` para copiar escenas, `Space` para play/pause en el preview.
- **Toast de éxito con enlace:** Al crear un video o copiar escenas, mostrar toast con enlace directo al resultado: "✅ 3 escenas copiadas al Reel Instagram → [Ir al video]"

---

## 8. Plan de Implementación

### Fase 1 — Fundamentos de Base de Datos (Semana 1-2)

Establecer la base de datos y las correcciones críticas:

1. **Crear enums nuevos** (`video_status`, `scene_copy_type`, `video_aspect_ratio`)
2. **Migrar `video_cuts` → `videos`** con ALTER TABLE + nuevos campos
3. **Migrar `video_cut_scenes` → `video_scenes`** con campos de copia y recorte
4. **Crear tablas** `video_narrative_arcs` y `video_timeline_entries`
5. **Crear funciones SQL:** `calculate_video_duration`, `calculate_video_completion`, `update_video_stats`, `copy_scenes_to_video`, `delete_video_safe`, `get_scene_appearances`
6. **Crear trigger** `video_scenes_stats_trigger` para auto-actualizar stats
7. **Ejecutar migración de datos** existentes (script completo de la sección 3.7)
8. **Crear RLS policies** para todas las tablas nuevas
9. **Crear índices** de rendimiento
10. **Activar `useRealtimeProject` en el storyboard** (corrección crítica que no requiere la nueva BD)

**Entregable:** Base de datos migrada, datos existentes preservados, storyboard con realtime activo.

**Test de aceptación:**
- [x] Todos los proyectos existentes tienen al menos 1 video (principal)
- [x] Todas las escenas existentes están vinculadas a un video via `video_scenes`
- [x] `update_video_stats` calcula correctamente para todos los videos
- [x] RLS permite CRUD a owners y bloquea a otros usuarios
- [x] El storyboard se actualiza en tiempo real cuando la IA modifica escenas

### Fase 2 — Página de Videos y Navegación (Semana 3-4)

1. **Crear `useVideoStore`** (store completo de Zustand)
2. **Crear hooks** `useRealtimeVideo` y `useRealtimeProjectVideos`
3. **Crear página `/project/[slug]/videos`** con grid de VideoCards
4. **Crear componentes:** `VideoCard`, `VideoGrid`, `VideoStatusBadge`, `VideoPlatformBadge`
5. **Crear `VideoCreateModal`** (wizard de 3 pasos: datos → plataforma → cómo empezar)
6. **Crear página `/project/[slug]/videos/[videoSlug]`** (overview del video)
7. **Actualizar sidebar** del proyecto con jerarquía Videos → sub-páginas
8. **Crear sub-páginas del video:** storyboard, scenes, arc, timeline (refactorizar las existentes para filtrar por `video_id`)
9. **Actualizar `⌘K` Command Menu** con búsqueda de videos
10. **Actualizar Overview del proyecto** con sección de videos

**Entregable:** Navegación funcional, crear videos, ver videos, navegar entre videos.

**Test de aceptación:**
- [x] Crear video nuevo desde el modal
- [x] Ver lista de videos del proyecto con stats correctos
- [x] Navegar a un video y ver su storyboard filtrado
- [x] Sidebar muestra los videos y sus sub-páginas
- [x] Realtime: crear video desde otro tab aparece automáticamente

### Fase 3 — Copiar/Reutilizar Escenas (Semana 5-6)

1. **Crear `SceneCopyModal`** con tabs (Nueva / Copiar de otro video)
2. **Crear `SceneCopyGrid`** (grid de escenas seleccionables con thumbnails)
3. **Implementar copia completa** (llamar a `copy_scenes_to_video` con type=duplicate)
4. **Implementar copia por referencia** (type=reference)
5. **Crear `SceneTrimSlider`** (slider visual para definir trim_start/trim_end)
6. **Implementar copia recortada** (type=trimmed con slider)
7. **Crear `SceneSourceBadge`** (badge "Copiada de [Video X]" en escenas)
8. **Crear `SceneAppearancesPopover`** (popover "Aparece en 3 videos" con links)
9. **Implementar selección múltiple** (shift+click, ctrl+click, select all)
10. **Crear API routes:** `/scenes/copy`, `/scenes/reorder`
11. **Implementar duplicar video completo** (modal + API `/videos/[id]/duplicate`)
12. **Implementar eliminar video** (modal de confirmación con `delete_video_safe`)

**Entregable:** Sistema completo de copiar/pegar escenas entre videos.

**Test de aceptación:**
- [x] Copiar 1 escena como duplicado → escena independiente en video destino
- [x] Copiar 1 escena como referencia → editar original actualiza la referencia
- [x] Copiar escena recortada → duración calculada correctamente
- [x] Copiar 10 escenas de golpe → todas aparecen en orden
- [x] Badge de origen visible en escenas copiadas
- [x] Popover de apariciones muestra todos los videos donde está la escena
- [x] Eliminar escena referenciada → modal de confirmación con opciones

### Fase 4 — IA Multi-Video (Semana 7-8)

1. **Actualizar system prompt** con contexto del video activo (sección 6.1)
2. **Implementar tool `copySceneToVideo`** (Vercel AI SDK + Zod schema)
3. **Implementar tool `createVideo`**
4. **Implementar tool `trimSceneForVideo`**
5. **Implementar tool `suggestScenesToReuse`** (la IA analiza y propone)
6. **Implementar tool `updateVideo`** y `deleteVideo`
7. **Actualizar selector de video en el chat** (usar tabla `videos` en vez de `video_cuts`)
8. **Actualizar `ActionPlanCard`** para renderizar acciones de video (nuevo tipo de cards)
9. **Extender `executeActionPlan`** para ejecutar las nuevas acciones
10. **Extender `undoBatch`** para revertir acciones de video
11. **Añadir quick actions 9-12** al chat
12. **Añadir reglas 13-17** al system prompt
13. **Implementar exportación por video individual** (4 formatos)

**Entregable:** La IA puede crear videos, copiar escenas, sugerir reutilización, y ejecutar todo via action plans con undo.

**Test de aceptación:**
- [x] "Crea un video para TikTok" → la IA crea el video via action plan
- [x] "Copia las 3 primeras escenas del Spot al Reel" → action plan correcto
- [x] "Sugiere qué escenas reutilizar" → la IA analiza y propone
- [x] Undo funciona para todas las nuevas acciones
- [x] Exportar solo un video genera archivo correcto (no todo el proyecto)

### Fase 5 — Pulido y Extras (Semana 9-10)

1. **Crear `VideoCalendar`** (vista calendario mensual de publicaciones)
2. **Crear `VideoPreviewPlayer`** (previsualizador slideshow)
3. **Implementar drag & drop** de escenas en storyboard (`@dnd-kit/core`)
4. **Crear `VideoCompare`** (comparador lado a lado)
5. **Implementar plantillas de video** (guardar/cargar estructura)
6. **Implementar notificaciones** de fechas programadas (banner en overview)
7. **Persistir filtros en URL** (query params para escenas)
8. **Atajos de teclado** (`Ctrl+Shift+V`, `Ctrl+Shift+C`, `Space`)
9. **Regeneración automática de timeline** (trigger post-mutación)
10. **Testing E2E** de flujos críticos

**Entregable:** Experiencia completa y pulida.

> **Nota:** Las fases son incrementales. Al completar la Fase 2, el sistema ya es funcional con videos independientes. La Fase 3 añade el valor diferencial de copiar/reutilizar escenas. Las Fases 4 y 5 son mejoras de productividad y experiencia.

---

## 9. Checklist de Compatibilidad

Verificar que todas las funcionalidades existentes siguen funcionando después de la migración:

### Base de datos
- [ ] Crear proyecto nuevo → se crea video principal automáticamente
- [ ] Wizard de 5 pasos (/new) → escenas se vinculan al video principal
- [ ] Todas las queries existentes que usan `scenes.video_cut_id` siguen funcionando
- [ ] Change history registra cambios correctamente
- [ ] Exports incluyen datos de video cuando se exporta proyecto completo

### Chat IA
- [ ] Chat sin video seleccionado → funciona como antes (contexto de proyecto)
- [ ] Chat con video seleccionado → contexto filtrado por video
- [ ] Action plans existentes (update_scene, create_scene, etc.) → siguen funcionando
- [ ] Undo de action plans existentes → sigue funcionando
- [ ] Sugerencias del chat → incluyen opciones de video cuando hay múltiples

### UI
- [ ] Storyboard → filtra por video activo (o muestra todas si no hay selección)
- [ ] Scenes → compatible con filtros existentes + filtro por video
- [ ] Personajes → sin cambios (compartidos a nivel de proyecto)
- [ ] Fondos → sin cambios (compartidos a nivel de proyecto)
- [ ] Timeline → funciona por video o por proyecto
- [ ] Arco narrativo → funciona por video o por proyecto
- [ ] Exportación → funciona para proyecto completo Y para video individual

### Rendimiento
- [ ] Carga de proyecto con 5 videos y 50 escenas → < 2 segundos
- [ ] Copiar 20 escenas entre videos → < 3 segundos
- [ ] Storyboard con realtime activo → sin lag perceptible
- [ ] System prompt con contexto de video → < 5000 tokens

---

## 10. Glosario de Términos

| Término | Definición en Kiyoko AI |
|---------|------------------------|
| **Proyecto** | Carpeta contenedora de una campaña/cliente. Agrupa videos, personajes, fondos y configuración compartida. |
| **Video** | Producción individual dentro de un proyecto. Tiene su propia duración, plataforma, escenas y timeline. |
| **Escena** | Unidad atómica de contenido visual. Tiene imagen, prompt, descripción, cámara, duración. Puede aparecer en múltiples videos. |
| **Video Scene** | Relación entre una escena y un video. Define el orden, tipo de copia y recorte temporal. |
| **Duplicado** | Copia independiente de una escena. Los cambios en una no afectan a la otra. |
| **Referencia** | Enlace a una escena original. Comparten todos los datos. Si se edita la original, la referencia se actualiza. |
| **Recortada (Trimmed)** | Referencia con `trim_start` y `trim_end` que define un sub-rango temporal de la escena. |
| **Video Principal** | El primer video de un proyecto, creado automáticamente. Contiene todas las escenas originales. |
| **Scheduled Date** | Fecha programada de publicación de un video. |
| **Action Plan** | Plan de cambios generado por la IA que requiere aprobación del usuario antes de ejecutarse. |
| **Batch ID** | Identificador único de un grupo de cambios ejecutados juntos. Permite deshacer en bloque. |
| **Tarea** | Unidad de trabajo asignable a un día, vinculable a un video o escena. Tiene estado (pendiente, en proceso, completada). |
| **Kanban** | Tablero visual con columnas de estado por las que se arrastran las tareas. |

---

## 11. Sistema de Gestión de Tareas

### 11.1 Concepto

El sistema de tareas convierte Kiyoko AI de una herramienta de storyboard en una **herramienta completa de producción**. Cada paso del proceso creativo (escribir guion, generar prompts, crear imágenes, revisar con cliente, publicar) se convierte en una tarea rastreable.

> **Principio fundamental:** Toda tarea se puede crear manualmente O generarla la IA. La IA puede analizar el proyecto y generar un plan de tareas completo, o el usuario puede crear tareas una a una.

```
PROYECTO "Domenech Peluquerías"
├── 🎬 Video: "Spot YouTube"
│   └── 📋 Tareas:
│       ├── ☑ Escribir guion (completada)
│       ├── 🔄 Generar prompts de imagen (en proceso)
│       ├── ○ Generar imágenes con Midjourney (pendiente)
│       ├── ○ Revisión con cliente (pendiente)
│       └── ○ Exportar storyboard final (pendiente)
│
├── 🎬 Video: "Reel Instagram"
│   └── 📋 Tareas:
│       ├── ○ Copiar escenas del Spot YouTube (pendiente)
│       └── ○ Adaptar CTA a formato vertical (pendiente)
│
└── 📋 Tareas generales del proyecto:
    ├── ☑ Definir personajes (completada)
    ├── 🔄 Definir fondos (en proceso)
    └── ○ Reunión de kick-off con cliente (pendiente, 📅 21 Mar)
```

### 11.2 Modelo de Datos

#### Tabla: `tasks`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador único |
| `project_id` | UUID FK | Proyecto al que pertenece |
| `video_id` | UUID FK NULL | Video al que está vinculada (null = tarea general) |
| `scene_id` | UUID FK NULL | Escena específica (null = tarea de video/proyecto) |
| `title` | VARCHAR(255) | Título de la tarea |
| `description` | TEXT | Descripción detallada |
| `status` | ENUM | `pending`, `in_progress`, `in_review`, `completed`, `blocked` |
| `priority` | ENUM | `low`, `medium`, `high`, `urgent` |
| `category` | ENUM | `script`, `prompt`, `image_gen`, `video_gen`, `review`, `export`, `meeting`, `other` |
| `assigned_to` | UUID FK NULL | Usuario asignado (para equipos) |
| `due_date` | DATE NULL | Fecha límite |
| `scheduled_date` | DATE NULL | Fecha programada (para el calendario diario) |
| `completed_at` | TIMESTAMPTZ NULL | Cuándo se completó |
| `sort_order` | INTEGER | Orden dentro de su columna de estado |
| `created_by` | ENUM | `manual`, `ai` — Quién creó la tarea |
| `ai_generated_batch` | UUID NULL | Si la IA generó un lote de tareas, agrupa por batch |
| `depends_on` | UUID[] | IDs de tareas que deben completarse antes |
| `metadata` | JSONB | Datos extra (prompt generado, referencia a action_plan, etc.) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

```sql
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_category AS ENUM ('script', 'prompt', 'image_gen', 'video_gen', 'review', 'export', 'meeting', 'other');
CREATE TYPE task_creator AS ENUM ('manual', 'ai');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  category task_category NOT NULL DEFAULT 'other',
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_by task_creator DEFAULT 'manual',
  ai_generated_batch UUID,
  depends_on UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_video ON tasks(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_owner" ON tasks FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));
CREATE POLICY "tasks_admin" ON tasks FOR ALL USING (is_admin());

-- Trigger auto-completar
CREATE OR REPLACE FUNCTION trigger_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_change
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION trigger_task_completed();
```

### 11.3 Tablero Kanban con Drag & Drop

Página: `/project/[slug]/tasks`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 Tareas                                    [+ Nueva Tarea] [🤖 Generar IA]│
│  Vista: [■ Tablero] [≡ Lista] [📅 Calendario]    Filtro: [Todos ▼] [Video ▼]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📥 Pendiente (5)     🔄 En Proceso (3)    👁 En Revisión (1)   ✅ Hecho (8)│
│  ┌───────────────┐   ┌───────────────┐    ┌───────────────┐   ┌──────────┐ │
│  │ 🔴 Generar    │   │ 🟡 Escribir   │    │ 🟢 Revisar    │   │ ☑ Definir│ │
│  │ imágenes E1-5 │   │ prompts video │    │ storyboard    │   │ persona- │ │
│  │ 🎬 Spot YT    │   │ 🎬 Spot YT    │    │ con cliente   │   │ jes      │ │
│  │ 📅 22 Mar     │   │ 📅 20 Mar     │    │ 📅 24 Mar     │   │ ✓ 18 Mar │ │
│  │ ··· ≡         │   │ ··· ≡         │    │ ··· ≡         │   │          │ │
│  └───────────────┘   └───────────────┘    └───────────────┘   └──────────┘ │
│  ┌───────────────┐   ┌───────────────┐                        ┌──────────┐ │
│  │ 🟡 Adaptar    │   │ 🟡 Copiar     │                        │ ☑ Brief  │ │
│  │ CTA vertical  │   │ escenas a     │                        │ inicial  │ │
│  │ 🎬 Reel IG    │   │ Reel IG       │                        │ ✓ 17 Mar │ │
│  │ 📅 25 Mar     │   │ 🎬 Reel IG    │                        └──────────┘ │
│  └───────────────┘   └───────────────┘                                      │
│                                                                              │
│  ← Arrastrar tarjetas entre columnas para cambiar estado →                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Implementación técnica del drag & drop:**

```typescript
// Usar @dnd-kit/core + @dnd-kit/sortable
// Cada columna es un SortableContext
// Al soltar una tarjeta en otra columna:
//   1. Actualizar status de la tarea
//   2. Actualizar sort_order de todas las tareas en la columna destino
//   3. Optimistic update en Zustand (instantáneo)
//   4. Persistir en Supabase (background)
//   5. Si falla → revertir estado local + toast de error
```

### 11.4 Vista Lista (por día)

```
┌──────────────────────────────────────────────────────────────────┐
│  📅 Hoy — Miércoles 19 Mar 2026                                 │
├──────────────────────────────────────────────────────────────────┤
│  ☐  🔴 Generar prompts para E1-E5        🎬 Spot YT     Prompt  │
│  ☐  🟡 Revisar descripciones personajes  General        Script  │
│  ☑  🟢 Subir imágenes de referencia      🎬 Spot YT     Image   │
├──────────────────────────────────────────────────────────────────┤
│  📅 Mañana — Jueves 20 Mar 2026                                 │
├──────────────────────────────────────────────────────────────────┤
│  ☐  🔴 Generar imágenes E1-E5            🎬 Spot YT     ImgGen  │
│  ☐  🟡 Copiar escenas al Reel            🎬 Reel IG     Other   │
├──────────────────────────────────────────────────────────────────┤
│  📅 Viernes 21 Mar 2026                                         │
├──────────────────────────────────────────────────────────────────┤
│  ☐  🟡 Reunión kick-off con cliente      General        Meeting │
│  ☐  🟡 Exportar storyboard para reunión  🎬 Spot YT     Export  │
└──────────────────────────────────────────────────────────────────┘
```

- Click en checkbox → marca como completada (con animación)
- Drag & drop vertical para reordenar prioridad dentro del día
- Drag & drop entre días para reprogramar
- Click en tarea → panel lateral con detalle completo

### 11.5 Vista Calendario de Tareas

Integrado con el calendario de publicación de videos (sección 7.5):

```
┌───────────────────────────────────────────────────────┐
│  📅 Marzo 2026                              [◀ ▶]    │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │
│     │     │     │ 3📋 │ 2📋 │ 2📋 │     │
│     │     │     │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │
│ 1📋 │ 1📋 │ 🎬  │     │     │ 🎬  │     │
│     │     │ YT  │     │     │ IG  │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

🎬 = Publicación de video programada
📋 = Número de tareas del día
```

### 11.6 Creación de Tareas: Manual vs IA

#### Manual: Modal de nueva tarea

```
┌──────────────────────────────────────────────┐
│  + Nueva Tarea                               │
├──────────────────────────────────────────────┤
│  Título: [____________________________]      │
│  Descripción: [____________________]         │
│  Categoría: [Prompt ▼]                       │
│  Prioridad: ○ Baja ● Media ○ Alta ○ Urgente │
│  Vincular a: [Video ▼] [Escena ▼]           │
│  Fecha: [📅 22 Mar 2026]                     │
│  Asignar a: [Plácido ▼]                     │
│                                              │
│           [Cancelar]  [Crear Tarea]          │
└──────────────────────────────────────────────┘
```

#### IA: Generar plan de tareas completo

El usuario puede decir en el chat:

> "Genera un plan de tareas para completar el Spot YouTube esta semana"

La IA analiza el estado del proyecto y genera:

```json
{
  "type": "action_plan",
  "summary_es": "Plan de 8 tareas para completar Spot YouTube antes del 25 Mar",
  "actions": [
    {
      "type": "create_task",
      "title": "Completar prompts de imagen para E1-E5",
      "category": "prompt",
      "video_id": "uuid-spot-yt",
      "priority": "high",
      "scheduled_date": "2026-03-20",
      "depends_on": []
    },
    {
      "type": "create_task",
      "title": "Generar imágenes con Midjourney para E1-E5",
      "category": "image_gen",
      "video_id": "uuid-spot-yt",
      "priority": "high",
      "scheduled_date": "2026-03-21",
      "depends_on": ["task-prompts"]
    },
    {
      "type": "create_task",
      "title": "Revisar imágenes generadas y pedir ajustes",
      "category": "review",
      "scheduled_date": "2026-03-22",
      "depends_on": ["task-images"]
    }
  ]
}
```

El usuario aprueba con el ActionPlanCard existente → las tareas se crean en batch.

### 11.7 IA Tools para Tareas

| Tool | Parámetros | Descripción |
|------|-----------|-------------|
| `createTask` | `title, category, priority, videoId?, sceneId?, scheduledDate?, dependsOn?` | Crear una tarea |
| `updateTask` | `taskId, changes{}, reason` | Actualizar una tarea |
| `completeTask` | `taskId, reason` | Marcar como completada |
| `generateTaskPlan` | `videoId?, scope, deadline?` | Generar plan de tareas automático |
| `analyzeTaskProgress` | `projectId` | Analizar progreso y sugerir ajustes |

### 11.8 Realtime y Notificaciones

```typescript
// Hook para realtime de tareas
export function useRealtimeTasks(projectId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        // Actualizar store de Zustand en tiempo real
        // Útil para equipos: ver cuando un compañero completa una tarea
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [projectId]);
}
```

**Notificaciones de tareas:**
- Tarea vence hoy → banner amarillo en el dashboard
- Tarea vencida → banner rojo
- Tarea con dependencia completada → toast "Ya puedes empezar: Generar imágenes"
- Video se acerca a su fecha de publicación con tareas pendientes → alerta

### 11.9 API Routes de Tareas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/projects/[id]/tasks` | Listar tareas (filtros: status, video, date) |
| POST | `/api/projects/[id]/tasks` | Crear tarea |
| PATCH | `/api/tasks/[id]` | Actualizar tarea (status, orden, datos) |
| DELETE | `/api/tasks/[id]` | Eliminar tarea |
| PATCH | `/api/tasks/reorder` | Reordenar tareas (batch de sort_order) |
| POST | `/api/projects/[id]/tasks/generate` | IA genera plan de tareas |
| GET | `/api/projects/[id]/tasks/calendar` | Tareas agrupadas por día |

---

## 12. Rediseño de Pantallas — Análisis y Consolidación

### 12.1 Diagnóstico de la Navegación Actual (11 páginas)

Análisis de cada página basado en la captura del sistema real:

```
ACTUAL (11 páginas en la sidebar):
├── Overview          → Útil pero infrautilizado
├── Storyboard        → PÁGINA PRINCIPAL, necesita mejoras
├── Diagnóstico       → Poco útil como página separada
├── Arco Narrativo    → Información que debería estar EN el storyboard
├── Escenas           → DUPLICA el storyboard con distinto formato
├── Personajes        → Necesaria pero separada de Fondos sin razón
├── Fondos            → Necesaria pero separada de Personajes sin razón
├── Timeline          → Debería estar vinculado al storyboard
├── Referencias       → Casi nadie la usa, datos disponibles en escenas
├── Chat IA           → Mejor como panel lateral que como página
├── Exportar          → Necesaria pero se usa 1 vez
└── Ajustes           → Necesaria
```

### 12.2 Evaluación: Qué Fusionar, Qué Eliminar, Qué Mantener

| Página Actual | Veredicto | Razón |
|---------------|-----------|-------|
| **Overview** | ✅ MANTENER + MEJORAR | Convertir en dashboard real con stats de videos, tareas y calendario |
| **Storyboard** | ✅ MANTENER + REDISEÑAR | Es la página principal. Integrar timeline, arco narrativo y filtros avanzados directamente aquí |
| **Diagnóstico** | ❌ FUSIONAR → Overview | El análisis IA debería ser un panel/sección del Overview, no una página completa |
| **Arco Narrativo** | ❌ FUSIONAR → Storyboard | La barra de fases (hook/build/peak/close) debe ser un componente visual DENTRO del storyboard, no una página separada |
| **Escenas** | ❌ FUSIONAR → Storyboard | El storyboard expandido YA muestra los mismos datos. Eliminar como página separada, mejorando el modo expandido del storyboard |
| **Personajes** | 🔀 FUSIONAR con Fondos | Crear una página "Recursos" que tenga tabs: Personajes / Fondos / Referencias |
| **Fondos** | 🔀 FUSIONAR con Personajes | Misma página, tab diferente |
| **Timeline** | ❌ FUSIONAR → Storyboard | El timeline debería ser un modo de vista del storyboard (vista horizontal temporal) |
| **Referencias** | ❌ FUSIONAR → Recursos | Datos de referencia como tab dentro de la página de Recursos |
| **Chat IA** | 🔀 SOLO PANEL LATERAL | No necesita página propia. El panel lateral + modo expandido es suficiente |
| **Exportar** | ✅ MANTENER | Necesaria pero mover a menú contextual rápido |
| **Ajustes** | ✅ MANTENER | Necesaria |

### 12.3 Nueva Navegación Propuesta (6 páginas vs 11 actuales)

```
NUEVA NAVEGACIÓN (reducido de 11 a 6+1):
PROYECTO
├── 📊 Overview              ← Dashboard + Diagnóstico IA fusionados
├── 🎬 Videos                ← NUEVO: Hub de videos (sección 5)
├── 🎨 Storyboard            ← Storyboard + Arco + Timeline + Escenas fusionados
├── 👥 Recursos              ← Personajes + Fondos + Referencias fusionados
├── 📋 Tareas                ← NUEVO: Kanban de tareas (sección 11)
├── 📦 Exportar              ← Mantener (o mover a menú contextual)
└── ⚙️ Ajustes              ← Mantener

PANEL LATERAL (siempre disponible):
└── 💬 Chat IA               ← Panel lateral, no página
```

**Beneficios:**
- De 11 clicks a 6: menos fricción para encontrar cosas
- Información relacionada junta: no saltar entre Arco/Timeline/Escenas/Storyboard
- Más espacio para contenido, menos navegación
- Nuevas funcionalidades (Videos, Tareas) sin saturar la sidebar

### 12.4 Rediseño del Overview (`/project/[slug]`)

El Overview actual es básico. Propuesta para convertirlo en un **dashboard de producción completo**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Domenech Peluquerías                    🟢 En progreso    [⚙️ Ajustes] │
│  Pixar · YouTube · 75s objetivo                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │📹 4      │ │🎬 28     │ │👥 4      │ │📋 12     │ │⏱ 2m09s  │      │
│  │Videos    │ │Escenas   │ │Person.   │ │Tareas    │ │/ 1m15s   │      │
│  │2 activos │ │18 listos │ │completos │ │5 hoy     │ │168%      │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                          │
│  ┌─── 🎬 Videos ────────────────────────────────────────── [Ver todos] ─┐│
│  │ Spot YouTube     🟢 80%  📅 25 Mar                                   ││
│  │ Reel Instagram   🟡 30%  📅 28 Mar                                   ││
│  │ TikTok Hook      🔴 0%   Sin fecha                                   ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─── 📋 Tareas de Hoy ────────────────────────────────── [Ver todas] ─┐│
│  │ ☐ 🔴 Generar prompts E1-E5          Spot YT                         ││
│  │ ☐ 🟡 Revisar descripciones          General                         ││
│  │ ☑ 🟢 Subir imágenes referencia      Spot YT                         ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─── 🤖 Diagnóstico IA ─────────────────────── [Regenerar análisis] ──┐│
│  │ ✅ 3 Fortalezas  ⚠️ 4 Advertencias  💡 2 Sugerencias                ││
│  │                                                                       ││
│  │ ⚠️ Duración excede objetivo en 54s — considerar eliminar 3 escenas  ││
│  │ ⚠️ 10 escenas sin prompt de imagen — pendiente de generar           ││
│  │ 💡 José aparece en 24/28 escenas — considerar reducir               ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─── 📅 Calendario Semana ──────────────────────────────────────────── ┐│
│  │ Lun 17  │ Mar 18  │ Mié 19  │ Jue 20  │ Vie 21  │ Sáb 22  │ Dom 23││
│  │         │         │ 3 📋    │ 2 📋    │ 2 📋    │         │       ││
│  │         │         │         │         │ 🎬 YT   │         │       ││
│  └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### 12.5 Rediseño del Storyboard (La Página Principal)

El storyboard actual (visible en la captura) es funcional pero necesita integrar todo lo que ahora son páginas separadas.

#### Problema actual (visible en la captura)

- La barra superior muestra "28 escenas · 2m9s / 1m15s objetivo 168%" pero no se puede hacer nada con eso
- Los filtros de tipo (Todas, Orig, Mej, Nuevas, Relleno, Video) y fase (Gancho, Desarrollo, Clímax, Cierre) existen pero no interactúan
- Cada escena expandida muestra MUCHA información (descripción, personajes, fondo, cámara, prompt imagen, prompt video, referencia) — es abrumador
- No hay vista de timeline integrada
- No hay forma de ver el arco narrativo sobre las escenas

#### Propuesta: Storyboard con 4 Modos de Vista

```
┌──────────────────────────────────────────────────────────────────────┐
│  Storyboard · Spot YouTube 75s           [Compacto] [Expandido]     │
│  28 escenas · 2m09s / 1m15s ⚠️           [Timeline] [Arco]         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BARRA DE ARCO NARRATIVO (siempre visible, proporcional):           │
│  [████ HOOK 15s ████|████████ BUILD 35s ████████|██ PEAK 15s ██|CL] │
│  ← Las escenas de abajo se colorean según la fase →                 │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
```

**Modo 1: Compacto** (similar al actual, mejorado)
```
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ img │ │ img │ │ img │ │ img │ │ img │ │ img │ │ img │        │
│  │ E1  │ │ E2  │ │ E3  │ │ E4  │ │ E5  │ │ E6  │ │ E7  │        │
│  │ 3s  │ │ 6s  │ │ 5s  │ │ 4s  │ │ 8s  │ │ 3s  │ │ 5s  │        │
│  │🔴   │ │🟠   │ │🟠   │ │🟢   │ │🟢   │ │🔵   │ │🔵   │        │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│  Hook     Build    Build    Peak    Peak    Close   Close          │
```

**Modo 2: Expandido** (detalle completo inline, NO página separada)
- Click en escena → se expande in-place con TODOS los campos editables
- Edición inline directa (no navegar a /scenes)

**Modo 3: Timeline** (vista horizontal temporal)
```
│  0s        15s       30s       45s       60s       75s              │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┤              │
│  │  E1 3s  │ E2 6s   │E3│ E4  │  E5 8s  │E6│ E7   │              │
│  │ Cold    │ Logo    │  │Salon│  Transf  │  │ CTA  │              │
│  │ Open    │ Reveal  │  │     │          │  │      │              │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┤              │
│  │  HOOK   │       BUILD       │   PEAK  │  CLOSE  │              │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘              │
```

**Modo 4: Arco** (vista de fases con escenas agrupadas)
```
│  ┌── HOOK (15s) ──────┐ ┌── BUILD (35s) ──────────┐               │
│  │ E1 · Cold Open  3s │ │ E3 · Salón Interior  5s │               │
│  │ E2 · Logo       6s │ │ E4 · Corte José      4s │               │
│  │ E28· Gancho     6s │ │ E5 · Transformación  8s │               │
│  └────────────────────┘ │ E6 · Resultado       3s │               │
│                          └─────────────────────────┘               │
│  ┌── PEAK (15s) ──────┐ ┌── CLOSE (10s) ─────────┐               │
│  │ E7 · Reveal     5s │ │ E9 · CTA            4s │               │
│  │ E8 · Reacción   5s │ │ E10· Logo final     3s │               │
│  │ ...              5s │ │ E11· Info contacto  3s │               │
│  └────────────────────┘ └─────────────────────────┘               │
```

#### Acciones del Storyboard Mejorado

- **Drag & drop** para reordenar escenas (con animación)
- **Click derecho / menú contextual** en escena: Editar, Duplicar, Copiar a otro video, Mover de fase, Generar imagen, Generar prompt con IA, Eliminar
- **Insertar escena entre dos existentes** (botón "+" entre cards)
- **Selección múltiple** (shift+click) para operaciones bulk: mover fase, eliminar, copiar a video
- **Barra de arco narrativo** siempre visible arriba como referencia visual
- **Indicador de duración** acumulada en tiempo real al reordenar
- **Badge de estado** por escena: draft (gris), prompt_ready (azul), generating (amarillo pulsante), generated (verde), approved (verde check), rejected (rojo)

### 12.6 Página de Recursos (`/project/[slug]/resources`)

Fusión de Personajes + Fondos + Referencias en una sola página con tabs:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Recursos del Proyecto                            [+ Nuevo] [🤖 IA] │
│  [👥 Personajes (4)]  [🏠 Fondos (3)]  [🔗 Referencias]            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Tab Personajes:                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  [avatar] │ │  [avatar] │ │  [avatar] │ │  [avatar] │               │
│  │ José      │ │ Conchi    │ │ Nerea     │ │ Raúl      │               │
│  │ Dueño     │ │ Colorista │ │ Estilista │ │ Barbero   │               │
│  │ 24 escenas│ │ 8 escenas │ │ 12 escenas│ │ 6 escenas │               │
│  │ [Editar]  │ │ [Editar]  │ │ [Editar]  │ │ [Editar]  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  Tab Fondos:                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│  │  [image]  │ │  [image]  │ │  [image]  │                            │
│  │ Salón Int.│ │ Exterior  │ │ Recepción │                            │
│  │ Interior  │ │ Exterior  │ │ Interior  │                            │
│  │ Día       │ │ H. Dorada │ │ Mañana    │                            │
│  │ 18 escenas│ │ 6 escenas │ │ 4 escenas │                            │
│  └──────────┘ └──────────┘ └──────────┘                            │
│                                                                      │
│  Tab Referencias:                                                    │
│  Tabla cruzada: Escena ↔ Personaje ↔ Fondo (datos actuales de       │
│  reference_maps pero renderizado como tabla interactiva)             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 13. IA Everywhere — Creación Manual + IA en Cada Punto

### 13.1 Principio: Dual Mode en Todo

> **Regla de diseño:** En CADA punto donde el usuario puede crear o editar contenido, debe haber dos opciones visibles: **botón manual** y **botón IA**. La IA nunca reemplaza el control manual; lo complementa.

Patrón visual consistente en toda la app:

```
[+ Nuevo]  [🤖 Generar con IA]
    ↓              ↓
 Formulario    Prompt libre →
  manual       IA propone →
               Usuario aprueba
```

### 13.2 Mapa Completo de Puntos de Integración IA

| Punto en la App | Creación Manual | Creación con IA | Estado Actual | Acción |
|-----------------|----------------|-----------------|---------------|--------|
| **Crear proyecto** | Formulario de 5 campos | Wizard de 5 pasos con IA (ya existe) | ✅ Funcional | Mantener |
| **Crear video** | Modal con título, plataforma, duración | "Crea un video para TikTok basado en el Spot" | 🔴 No existe | Implementar |
| **Crear escena** | Formulario: título, desc, duración, fase | "Genera 3 escenas de cierre para Instagram" | 🟡 Parcial (solo chat) | Añadir botón IA inline |
| **Editar escena** | Campos editables inline | "Mejora la descripción de E3" en el panel lateral | 🟡 Solo via chat | Añadir IA inline en cada campo |
| **Generar prompt imagen** | Escribir manualmente el prompt | "Genera prompt profesional para E3 estilo Pixar" | 🟡 Solo IA Sidebar | Integrar en la card de escena |
| **Generar prompt video** | Escribir manualmente | "Genera prompt de video para E3 con movimiento dolly" | 🟡 Solo IA Sidebar | Integrar en la card de escena |
| **Generar imagen** | Upload manual (drag & drop) | Click "Generar imagen" → API de imagen → resultado | 🔴 Solo upload | Implementar generación |
| **Generar video** | Upload manual | Click "Generar video" → API de video → resultado | 🔴 No existe | Implementar generación |
| **Crear personaje** | Formulario manual | "Analiza el brief y crea los personajes" | ✅ En wizard | Añadir botón IA en /resources |
| **Crear fondo** | Formulario manual | "Sugiere fondos para una peluquería estilo Pixar" | ✅ En wizard | Añadir botón IA en /resources |
| **Crear tarea** | Modal con campos | "Genera plan de tareas para esta semana" | 🔴 No existe | Implementar (sección 11) |
| **Reordenar escenas** | Drag & drop | "Reordena las escenas para mejor flujo narrativo" | 🔴 No drag&drop | Implementar ambos |
| **Analizar proyecto** | N/A (siempre es IA) | Botón "Analizar" → diagnóstico completo | ✅ Funcional | Mover al Overview |
| **Exportar** | Seleccionar formato y exportar | "Exporta el storyboard del Spot en PDF" | ✅ Funcional | Añadir comando de voz |
| **Arco narrativo** | Editar fases manualmente | "Reorganiza el arco para un hook más impactante" | 🟡 Solo vista | Integrar en storyboard |

### 13.3 IA Inline en el Storyboard (Nuevo Patrón)

En vez de depender solo del chat lateral, cada escena en el storyboard tiene **botones de IA contextuales**:

```
┌────────────────────────────────────────────────────┐
│ #1 Cold Open Tijeras                    Nuevo 3s   │
│ Apertura en frío: primer plano extremo...          │
│                                                     │
│ PROMPT IMAGEN                            [🤖] [📋] │
│ ┌──────────────────────────────────────────────┐   │
│ │ Pixar Studios 3D animated render, extreme... │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ PROMPT VIDEO                             [🤖] [📋] │
│ ┌──────────────────────────────────────────────┐   │
│ │ SILENT SCENE. NO DIALOGUE...                 │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ IMAGEN GENERADA                                     │
│ ┌──────────────┐                                   │
│ │  [thumbnail]  │  [🤖 Generar]  [📤 Upload]       │
│ │  o drop aquí  │  [🔄 Regenerar] [✏️ Editar prompt]│
│ └──────────────┘                                   │
│                                                     │
│ [✏️ Editar]  [🗑 Eliminar]  [📋 Copiar a video]    │
└────────────────────────────────────────────────────┘

[🤖] = Botón que genera/mejora con IA (un click, sin abrir chat)
[📋] = Copiar al portapapeles
```

**Flujo del botón [🤖] en Prompt Imagen:**
1. Click → la IA lee la escena (título, descripción, personajes, fondo, estilo del proyecto)
2. Genera un prompt profesional en inglés optimizado para Midjourney/DALL-E
3. Lo inserta directamente en el campo prompt_image
4. El usuario puede editar o aceptar

**Flujo del botón [🤖 Generar] en Imagen:**
1. Click → toma el prompt_image de la escena
2. Lo envía al provider de imagen configurado (Midjourney, DALL-E, Stable Diffusion)
3. Muestra un spinner con "Generando imagen..."
4. Al completar → muestra la imagen generada con opciones: Aceptar, Regenerar, Editar prompt
5. Si acepta → sube la imagen a Supabase Storage y actualiza `generated_image_url`

### 13.4 Mejoras al Motor de IA Actual

#### Problema: El chat es el único canal de IA

Actualmente, toda la potencia de la IA está encapsulada en el chat. El usuario tiene que:
1. Abrir el panel de chat
2. Escribir qué quiere
3. Esperar la respuesta
4. Aprobar el action plan
5. Verificar los cambios

Esto es potente pero lento. Propuesta: **IA de 3 niveles**:

| Nivel | Nombre | Cómo funciona | Ejemplo |
|-------|--------|--------------|---------|
| **Nivel 1: IA de un click** | Quick AI | Botones [🤖] en la UI que ejecutan una acción predefinida sin chat | "Generar prompt para esta escena" |
| **Nivel 2: IA conversacional** | Chat Kiyoko | El chat actual con action plans y aprobación | "Reorganiza las escenas del hook" |
| **Nivel 3: IA proactiva** | Auto-suggest | La IA detecta problemas/oportunidades y sugiere acciones sin que el usuario pregunte | "⚠️ La escena E5 no tiene prompt. ¿Generar?" |

#### Nivel 3: IA Proactiva — Sugerencias Contextuales

```
┌──────────────────────────────────────────────────────────┐
│ 💡 Sugerencias de Kiyoko                     [Ocultar]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ⚠️ 10 escenas sin prompt de imagen                      │
│    [Generar todos los prompts]  [Ignorar]                │
│                                                          │
│ 💡 La duración (2m09s) excede el objetivo (1m15s) en 54s│
│    [Sugerir escenas a eliminar]  [Ajustar objetivo]      │
│                                                          │
│ 🔄 Has completado 3 tareas hoy. Siguiente:              │
│    "Generar imágenes para E1-E5"                         │
│    [Empezar tarea]  [Posponer]                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Estas sugerencias aparecen como un banner colapsable en la parte superior del storyboard/overview. Se calculan al cargar la página analizando:
- Escenas sin prompts
- Duración vs objetivo
- Tareas pendientes para hoy
- Escenas sin imagen generada
- Personajes sin descripción visual completa
- Videos cerca de su fecha de publicación con bajo % de completado

#### API Route para sugerencias proactivas

```typescript
// /api/ai/suggestions
// GET - Calcula sugerencias sin usar LLM (reglas determinísticas, rápido)
export async function GET(req: Request) {
  const suggestions = [];

  // Escenas sin prompt
  const scenesWithoutPrompt = scenes.filter(s => !s.prompt_image);
  if (scenesWithoutPrompt.length > 0) {
    suggestions.push({
      type: 'warning',
      title: `${scenesWithoutPrompt.length} escenas sin prompt de imagen`,
      actions: [
        { label: 'Generar todos', action: 'generate_prompts_batch', sceneIds: scenesWithoutPrompt.map(s => s.id) },
        { label: 'Ignorar', action: 'dismiss' }
      ]
    });
  }

  // Duración excede objetivo
  if (project.estimated_duration > project.target_duration * 1.1) {
    const excess = project.estimated_duration - project.target_duration;
    suggestions.push({
      type: 'warning',
      title: `Duración excede objetivo en ${excess}s`,
      actions: [
        { label: 'Sugerir recortes', action: 'suggest_cuts' },
        { label: 'Ajustar objetivo', action: 'update_target' }
      ]
    });
  }

  // Tareas de hoy
  const todayTasks = tasks.filter(t => t.scheduled_date === today && t.status !== 'completed');
  if (todayTasks.length > 0) {
    suggestions.push({
      type: 'info',
      title: `${todayTasks.length} tareas pendientes para hoy`,
      actions: [{ label: 'Ver tareas', action: 'navigate_tasks' }]
    });
  }

  return suggestions;
}
```

### 13.5 Generación de Imagen Integrada

#### Pipeline: Escena → Prompt → Imagen

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. ESCENA   │ →  │  2. PROMPT   │ →  │ 3. GENERAR   │ →  │ 4. GUARDAR   │
│  Descripción │    │  IA genera   │    │  API imagen  │    │  Storage +   │
│  + contexto  │    │  prompt pro  │    │  (Midjourney, │    │  Actualizar  │
│  del proyecto│    │  en inglés   │    │  DALL-E, SD)  │    │  escena      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Providers de imagen soportados (configurables como los de texto):**

| Provider | Modelo | Calidad | Velocidad | Coste |
|----------|--------|---------|-----------|-------|
| DALL-E 3 | dalle-3 | Alta | ~15s | $0.04/img |
| Midjourney | v6.1 | Muy alta | ~30s | $0.05/img |
| Stable Diffusion | SDXL | Media-Alta | ~5s | $0.002/img |
| Flux | flux-1.1-pro | Alta | ~10s | $0.04/img |
| Leonardo AI | Phoenix | Alta | ~8s | $0.01/img |

**Flujo en la UI:**

```
En el storyboard, escena E1:
1. Usuario click [🤖 Generar Imagen]
2. Si no hay prompt_image → primero genera prompt con IA (2s)
3. Muestra preview del prompt con opción de editar
4. Click [Generar] → spinner "Generando con DALL-E 3..."
5. Imagen aparece con opciones:
   [✅ Aceptar] → sube a Storage, actualiza escena
   [🔄 Regenerar] → nueva imagen con mismo prompt
   [✏️ Editar prompt y regenerar]
   [📐 Variaciones] → 3 variantes del mismo prompt
6. Se guarda en scenes.generated_image_url + image_versions (JSONB histórico)
```

### 13.6 Generación de Video Integrada

#### Pipeline: Imagen → Prompt Video → Video

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. IMAGEN    │ →  │ 2. PROMPT    │ →  │ 3. GENERAR   │ →  │ 4. GUARDAR   │
│  generada    │    │  VIDEO IA    │    │  API video   │    │  Storage +   │
│  de la escena│    │  genera      │    │  (Runway,    │    │  Actualizar  │
│              │    │  movimiento  │    │  Pika, Kling)│    │  escena      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Providers de video:**

| Provider | Modelo | Duración | Velocidad | Coste |
|----------|--------|----------|-----------|-------|
| Runway | Gen-3 Alpha | 5-10s | ~60s | $0.05/s |
| Kling | v1.5 | 5s | ~120s | $0.03/s |
| Pika | v2.0 | 3-5s | ~30s | $0.04/s |
| Minimax | Hailuo | 5s | ~90s | $0.02/s |

---

## 14. Hacer Todo Funcional — Roadmap Completo

### 14.1 Funcionalidades No Funcionales Detectadas

Análisis basado en la documentación y la captura de pantalla:

| Funcionalidad | Estado en la captura | Problema | Solución |
|---------------|---------------------|----------|----------|
| **Regenerar timeline** | Botón existe, no hace nada | Pendiente de implementar | Trigger automático + botón manual |
| **Drag & drop escenas** | No existe | Solo reordenar via IA | Implementar con @dnd-kit |
| **Generar imagen** | Solo upload manual | La API `/api/ai/generate-image` existe pero no está conectada en la UI del storyboard | Conectar botón [🤖 Generar] |
| **Generar video** | No existe | No hay pipeline de imagen→video | Implementar pipeline completo |
| **Storyboard realtime** | No se actualiza con cambios de IA | useRealtimeProject no conectado | Activar hook |
| **Multi-video UI** | Solo selector de chips en chat | No hay página de gestión | Implementar (sección 5) |
| **Edición inline storyboard** | Parcial | Solo algunos campos son editables | Hacer TODOS los campos editables |
| **Insertar escena entre existentes** | Botón existe | UI confusa, no claro dónde se inserta | Botón "+" visible entre cada card |
| **Filtros combinados** | Existen | No persisten al navegar | Guardar en URL params |
| **Selección múltiple** | Botón "Seleccionar" existe | No conectado a acciones bulk | Implementar toolbar de selección |
| **Historial de cambios** | Botón existe | Panel básico | Mejorar con diff visual |
| **Referencias cruzadas** | Página existe | Poco útil como está | Fusionar en Recursos |
| **Command Menu ⌘K** | Existe | No busca videos ni tareas | Ampliar con nuevas entidades |

### 14.2 Pipeline Completo de Producción

El objetivo final: el usuario puede ir desde una idea hasta un video publicable sin salir de Kiyoko AI.

```
PIPELINE COMPLETO:

1. BRIEF → [IA genera proyecto]
   └── Proyecto con título, estilo, plataforma

2. PERSONAJES + FONDOS → [IA + Manual]
   └── Recursos creativos definidos

3. VIDEOS → [Manual + IA]
   └── Estructura de videos por plataforma

4. ESCENAS → [IA genera estructura + Manual ajusta]
   └── Escenas con descripción, fase, duración, cámara

5. PROMPTS → [IA genera + Manual refina]
   └── Prompt imagen + Prompt video por escena

6. IMÁGENES → [IA genera con provider de imagen]
   └── Imagen generada por escena

7. VIDEOS → [IA genera con provider de video]
   └── Video generado por escena

8. REVISIÓN → [Manual + IA diagnóstica]
   └── Feedback, ajustes, regeneración

9. EXPORTAR → [Automático]
   └── Storyboard PDF/HTML para cliente

10. PUBLICAR → [Manual con fecha programada]
    └── Video marcado como publicado, tareas cerradas
```

Cada paso tiene:
- Indicador de estado visual (completado/en proceso/pendiente)
- Opción manual y opción IA
- Trazabilidad en tareas
- Posibilidad de retroceder y regenerar

### 14.3 Plan de Implementación Ampliado (Fases 6-8)

Estas fases se añaden después de las 5 existentes (sección 8):

#### Fase 6 — Sistema de Tareas (Semana 11-12)

1. Crear tabla `tasks` con enums y triggers
2. Crear Kanban con drag & drop (`@dnd-kit`)
3. Crear vistas: tablero, lista diaria, calendario
4. Modal de creación manual de tareas
5. Tools de IA para tareas: `createTask`, `generateTaskPlan`
6. Integrar calendario de tareas con calendario de videos
7. Realtime para tareas
8. Sugerencias proactivas basadas en tareas del día

#### Fase 7 — Consolidación de Pantallas (Semana 13-14)

1. Fusionar Personajes + Fondos + Referencias → `/resources` con tabs
2. Fusionar Diagnóstico → panel en Overview
3. Fusionar Arco Narrativo → barra visual en Storyboard
4. Fusionar Timeline → modo de vista en Storyboard
5. Eliminar página Escenas (redundante con Storyboard expandido)
6. Eliminar página Chat IA (mantener solo como panel lateral)
7. Actualizar sidebar con 6 items en vez de 11
8. Rediseñar Overview como dashboard de producción
9. Implementar los 4 modos del storyboard (compacto, expandido, timeline, arco)
10. Implementar drag & drop en storyboard

#### Fase 8 — IA Everywhere + Pipeline Completo (Semana 15-17)

1. Botones [🤖] inline en cada campo del storyboard
2. IA de un click para generar prompts (sin chat)
3. Integración con providers de imagen (DALL-E 3, Flux, etc.)
4. Botón "Generar Imagen" en cada escena con pipeline completo
5. Integración con providers de video (Runway, Kling)
6. Botón "Generar Video" en cada escena
7. Barra de sugerencias proactivas (IA Nivel 3)
8. Pipeline completo: brief → escenas → prompts → imágenes → videos
9. Selección múltiple + operaciones bulk en storyboard
10. Command Menu ampliado con videos, tareas, recursos

### 14.4 Resumen Visual del Roadmap Completo

```
Semana  1-2   ████ Fase 1: Base de datos multi-video
Semana  3-4   ████ Fase 2: Página de videos + navegación
Semana  5-6   ████ Fase 3: Copiar/reutilizar escenas
Semana  7-8   ████ Fase 4: IA multi-video
Semana  9-10  ████ Fase 5: Pulido + extras
Semana 11-12  ████ Fase 6: Sistema de tareas (Kanban)
Semana 13-14  ████ Fase 7: Consolidación de pantallas (11→6)
Semana 15-17  ██████ Fase 8: IA Everywhere + Pipeline completo
              ──────────────────────────────────────────────
              0    2    4    6    8   10   12   14   16   18 semanas

RESULTADO FINAL:
├── 6 páginas (vs 11 actuales) — más simple
├── Gestión de tareas completa con Kanban
├── IA de 3 niveles (click, chat, proactiva)
├── Pipeline imagen + video integrado
├── Todo editable inline en el storyboard
├── Multi-video con copiar/pegar escenas
├── Calendario unificado (tareas + videos)
└── 100% funcional — de idea a video publicable
```

---

*Documento generado para Kiyoko AI · Marzo 2026*  
*Equipo de desarrollo · Plácido Venegas*  
*Versión 3.0 — Última actualización: 19 Marzo 2026*
