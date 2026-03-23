# ARQUITECTURA V2 — Separación Proyecto / Video

**Fecha:** 19 Marzo 2026
**Decisión:** Opción B — Sub-páginas por video con URL propia

---

## ESTRUCTURA DE RUTAS

```
/dashboard                              ← Lista de proyectos (filtrada por org)
/project/{slug}                         ← NIVEL PROYECTO
/project/{slug}/videos                  ← Grid de videos (click → entra en video)
/project/{slug}/resources               ← Personajes + Fondos (compartidos)
/project/{slug}/tasks                   ← Tareas del proyecto
/project/{slug}/settings                ← Ajustes del proyecto

/project/{slug}/video/{videoSlug}                ← NIVEL VIDEO
/project/{slug}/video/{videoSlug}/storyboard     ← Storyboard del video
/project/{slug}/video/{videoSlug}/script         ← Guion / Narración del video
/project/{slug}/video/{videoSlug}/narration      ← Voz / Audio del video
/project/{slug}/video/{videoSlug}/export         ← Exportar el video
```

## SIDEBAR ADAPTATIVO

### Cuando estás en NIVEL PROYECTO (`/project/{slug}/*` sin video):

```
SIDEBAR:
─────────────────────
[Logo] Kiyoko AI
  Dashboard
─────────────────────
PROYECTO
  📊 Overview
  📹 Videos          ← click en video → navega al nivel video
  💼 Recursos
  ✅ Tareas
  ⚙️ Ajustes
─────────────────────
  💬 Chat IA
─────────────────────
FAVORITOS
  ...
```

### Cuando estás en NIVEL VIDEO (`/project/{slug}/video/{videoSlug}/*`):

```
SIDEBAR:
─────────────────────
[Logo] Kiyoko AI
  Dashboard
─────────────────────
← Volver a proyecto    ← Link a /project/{slug}
─────────────────────
VIDEO: Spot YouTube     ← nombre del video + info
  YouTube · 60s · 16:9
─────────────────────
  🎬 Storyboard
  📝 Guion
  🎙️ Narración
  📦 Exportar
─────────────────────
  💬 Chat IA
─────────────────────
OTROS VIDEOS            ← links rápidos a otros videos
  Reel Instagram
  TikTok 15s
```

## FLUJO DE NAVEGACIÓN

```
Dashboard → Click proyecto → Overview del proyecto
  → Click "Videos" → Grid de videos
    → Click "Spot YouTube" → /project/slug/video/spot-youtube/storyboard
      → Sidebar cambia a nivel video
      → Storyboard muestra solo escenas de este video
      → "Volver a proyecto" → /project/slug

  → Click "Recursos" → Personajes/Fondos (sin video, nivel proyecto)
  → Click "Tareas" → Kanban (sin video, nivel proyecto)
```

## DATOS POR NIVEL

### Nivel Proyecto (compartido entre videos)
| Dato | Tabla | Dónde se ve |
|------|-------|-------------|
| Info proyecto | projects | Overview, Settings |
| Videos | video_cuts | Videos page |
| Personajes | characters | Recursos |
| Fondos | backgrounds | Recursos |
| Tareas | tasks | Tareas |

### Nivel Video (específico del video)
| Dato | Tabla | Dónde se ve |
|------|-------|-------------|
| Escenas del video | scenes via video_cut_scenes | Storyboard |
| Arco narrativo | narrative_arcs (filtrado) | Storyboard |
| Narración texto | scenes.narration_text | Guion |
| Audio TTS | scenes.narration_audio_url | Narración |
| Exportar | scenes + video info | Exportar |

### Cómo se obtienen las escenas de un video:
```sql
SELECT s.*
FROM scenes s
JOIN video_cut_scenes vcs ON vcs.scene_id = s.id
WHERE vcs.video_cut_id = '{video_uuid}'
ORDER BY vcs.sort_order;
```

## CONTEXT: VideoContext

Nuevo context similar a ProjectContext:

```typescript
// /project/[slug]/video/[videoSlug]/layout.tsx
const VideoContext = createContext<{
  video: VideoCut | null;
  loading: boolean;
  scenes: Scene[];      // escenas ya filtradas por este video
  refreshScenes: () => void;
}>();

function useVideo() {
  return useContext(VideoContext);
}
```

- Se resuelve con: `video_cuts.eq('slug', videoSlug).single()`
- Las escenas se cargan via JOIN con `video_cut_scenes`
- Los hijos (storyboard, script, etc.) usan `useVideo()` en vez del store

## VENTAJAS DE ESTA ARQUITECTURA

1. **URL = verdad** — No hay store global, la URL dice en qué video estás
2. **Links directos** — Puedes compartir `/project/x/video/y/storyboard`
3. **Layout propio** — El nivel video puede tener su propio layout con el nombre del video
4. **Separación clara** — Recursos y Tareas son del proyecto, Storyboard es del video
5. **Back button funciona** — Navegador atrás = volver al proyecto
6. **SSR friendly** — Los params vienen de la URL, no de un store client-side

## IMPLEMENTACIÓN (ORDEN)

1. Crear estructura de carpetas `/project/[slug]/video/[videoSlug]/`
2. Crear `VideoContext` + `VideoProvider` en el layout del video
3. Crear sidebar adaptativo (detecta si estás en video o proyecto)
4. Mover storyboard a nivel video
5. Mover guion/narración a nivel video
6. Crear página de exportar a nivel video
7. Actualizar Overview del proyecto (quitar storyboard del sidebar nivel proyecto)
8. Actualizar la page Videos para que las cards sean links a `/video/{slug}/storyboard`
9. Limpiar: quitar useActiveVideoStore, quitar video selector del header

---

*Decisión tomada el 19 Marzo 2026 — Kiyoko AI*
