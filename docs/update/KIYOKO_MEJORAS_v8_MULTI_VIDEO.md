# KIYOKO AI — Mejoras v8: Sistema Multi-Video por Proyecto

## Estado: FASE 1 IMPLEMENTADA (DB + selector en chat)

---

## Concepto

Un **proyecto** es el contenedor principal (ej: "Domenech Peluquerias"). Dentro del proyecto:
- **Personajes y fondos** son compartidos (pertenecen al proyecto)
- **Video cuts** son como "sub-proyectos" — cada uno tiene sus propias escenas, orden, duracion
- Las escenas pueden **copiarse entre video cuts** o existir solo en uno

```
PROYECTO: Domenech Peluquerias
├── Personajes: Jose, Conchi, Nerea, Raul (COMPARTIDOS)
├── Fondos: Salon interior, Exterior (COMPARTIDOS)
│
├── VIDEO: "Spot Completo YouTube" (75s, 16:9)
│   ├── Escena: E1 Entrada salon (5s)
│   ├── Escena: E2 Interior (5s)
│   ├── Escena: E3 Equipo completo (5s)
│   ├── ... (28 escenas propias)
│   └── Escena: R3 Tagline (3s)
│
├── VIDEO: "Reel Protesis Capilares" (30s, 9:16)
│   ├── Escena: [COPIA de E4A] con duracion 6s (en vez de 5s)
│   ├── Escena: [COPIA de E4B] con duracion 5s
│   ├── Escena: IG1 Intro vertical (nueva, exclusiva)
│   ├── Escena: IG2 CTA Instagram (nueva, exclusiva)
│   └── Escena: [COPIA de N7] con duracion 8s
│
├── VIDEO: "TikTok Hook" (15s, 9:16)
│   ├── Escena: TK1 Hook rapido (nueva, exclusiva)
│   ├── Escena: [COPIA de N7] con duracion 5s
│   └── Escena: TK2 CTA TikTok (nueva, exclusiva)
│
└── VIDEO: "Story Reveal" (5s, 9:16)
    ├── Escena: [COPIA de N7] con duracion 3s
    └── Escena: ST1 Logo animado (nueva, exclusiva)
```

### Principios clave:
1. **Personajes y fondos = del proyecto** (compartidos entre todos los videos)
2. **Escenas = del video cut** (cada video tiene sus propias escenas)
3. **Copiar escenas**: puedes copiar una escena de un video a otro (crea una copia independiente)
4. **Escenas exclusivas**: cada video puede tener escenas que no existen en ningun otro
5. **Todo funcional**: cada video cut se comporta como un mini-proyecto para el storyboard

---

## Modelo de Datos (IMPLEMENTADO)

### Tabla `video_cuts` (ya creada)

```sql
video_cuts (
  id, project_id, name, slug, description,
  platform, aspect_ratio,
  target_duration_seconds, actual_duration_seconds,
  status, is_primary, color, icon, notes,
  sort_order, created_at, updated_at
)
```

### Campo `video_cut_id` en `scenes` (ya creado)

```sql
scenes.video_cut_id uuid REFERENCES video_cuts(id)
-- null = escena legacy (del video principal)
-- uuid = escena pertenece a ese video cut especificamente
```

### Tabla `video_cut_scenes` (ya creada, para override de duracion/orden)

Se usa cuando quieres que la MISMA escena aparezca en otro video con diferente duracion.
Pero el modelo principal es que **cada video tiene sus propias escenas** via `scenes.video_cut_id`.

---

## Flujo de Copiar Escena entre Videos

```
1. Usuario esta en "Reel Instagram"
2. Abre panel "Importar escena"
3. Ve las escenas de "Spot Completo YouTube"
4. Selecciona E4A (Nerea aplica protesis)
5. Click "Copiar al Reel"
6. Se crea NUEVA escena en scenes con:
   - Todos los campos copiados de E4A
   - video_cut_id = id del Reel
   - scene_number = "IG-E4A" (prefijo del video)
   - duration_seconds = puede ajustar
   - generated_image_url = misma imagen (no regenera)
7. La escena original en YouTube NO se modifica
```

### API para copiar:

```typescript
// POST /api/project/[slug]/scenes/copy
{
  sourceSceneId: "uuid",      // escena a copiar
  targetVideoCutId: "uuid",   // video destino
  overrides: {                 // campos opcionales a cambiar
    duration_seconds: 6,
    scene_number: "IG-E4A"
  }
}
```

---

## Como funciona en el Chat

### Selector de video en el chat (IMPLEMENTADO)

Debajo del header del chat aparece una barra con chips para cada video:

```
[🎬] [★ Spot YouTube 75s] [Reel Instagram 30s] [TikTok 15s] [Story 5s]
```

El chip activo determina:
- Que escenas ve la IA en el contexto
- Donde se crean/modifican las escenas cuando la IA ejecuta acciones
- Que timeline/duracion se optimiza

### System prompt con video cut activo

```
VIDEO ACTIVO: "Reel Instagram" (30s, 9:16, Instagram Reels)

ESCENAS DE ESTE VIDEO (5):
  IG-E4A "Nerea aplica protesis" [ID: xxx] — 6s — ...
  IG-E4B "Resultado final" [ID: xxx] — 5s — ...
  IG1 "Intro vertical" [ID: xxx] — 3s — exclusiva
  ...

ESCENAS DE OTROS VIDEOS (disponibles para copiar):
  [Spot YouTube] E1 "Entrada salon" — 5s
  [Spot YouTube] E3 "Equipo completo" — 5s
  ...
```

La IA puede:
- Modificar escenas del video activo
- Sugerir copiar escenas de otros videos
- Crear escenas exclusivas para este video
- Ajustar duraciones para alcanzar el objetivo

---

## Fases de Implementacion

| Fase | Estado | Descripcion |
|------|--------|-------------|
| 1. DB: tablas video_cuts + campo scenes.video_cut_id | HECHO | Migracion aplicada |
| 2. Chat: selector de video cut | HECHO | Chips en el header del chat |
| 3. Chat: videoCutId en el store y API | HECHO | Se envia al backend |
| 4. Pagina /project/[slug]/videos | PENDIENTE | Lista y gestion de videos |
| 5. Storyboard filtrado por video cut | PENDIENTE | Selector + filtro de escenas |
| 6. API copiar escena entre videos | PENDIENTE | Endpoint + UI |
| 7. System prompt con contexto de video | PENDIENTE | Escenas del video activo |
| 8. IA: nuevos action types (create_video, copy_scene) | PENDIENTE | Tools del chat |

---

*Kiyoko AI — Mejoras v8 · Multi-Video · 18 marzo 2026*
