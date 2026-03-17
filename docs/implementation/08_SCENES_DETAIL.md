# Fase 08 — Escenas en Detalle

## Estado: PENDIENTE

## Objetivo

Implementar la vista completa de escenas: cards colapsables/expandibles, prompts con syntax highlight, upload de imágenes, filtros, drag & drop, y detalle individual.

## Tareas

### 8.1 SceneCard (colapsada)
- Número, título, tipo badge, duración, mini thumbnail
- Click para expandir

### 8.2 SceneCard (expandida)
- Imagen generada (grande) + imágenes de referencia (thumbnails)
- Mejoras con iconos → y +
- Prompt de imagen con syntax highlight (Shiki) + Copy + Editar + Mejorar IA
- Prompt de vídeo con syntax highlight + Copy
- Referencias necesarias (badges clickables)
- Tip de producción
- Metadata: cámara, movimiento, iluminación, mood, fase, estado
- Acciones: editar, eliminar, regenerar

### 8.3 Scene Detail (`/p/[slug]/scenes/[sceneId]`)
- Columna izquierda (60%): imagen grande, galería versiones, prompt editor Tiptap
- Columna derecha (40%): metadata, refs, mejoras, historial prompts
- Navegación prev/next

### 8.4 SceneGrid con filtros
- Filtrar por tipo (original, mejorada, nueva, relleno, vídeo)
- Filtrar por fase (gancho, desarrollo, clímax, cierre)
- Filtrar por fondo, personaje
- Vista: lista, grid, timeline

### 8.5 Drag & Drop
- Reordenar escenas con @dnd-kit
- Actualizar sort_order en DB

### 8.6 Componentes
- SceneCard, SceneCardExpanded, SceneDetail
- ScenePromptEditor (Tiptap), ScenePromptViewer (Shiki)
- SceneGrid, SceneFilters, SceneImageUpload
- SceneImageGallery, SceneReferenceTable
- SceneTimeline, SceneDragList, SceneCreateDialog
- SceneAiImproveButton

## Criterios de Aceptación
- [ ] Cards expand/collapse fluido
- [ ] Prompts con syntax highlight y copy funcional
- [ ] Upload de imágenes a Supabase Storage
- [ ] Filtros actualizan la vista
- [ ] DnD reordena y persiste
