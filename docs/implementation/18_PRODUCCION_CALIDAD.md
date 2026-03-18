# Fase 18 — Producción y Calidad

## Estado: PENDIENTE

## Origen: docs/update/KIYOKO_MEJORAS_v5_FINAL.md + KIYOKO_MEJORAS_v6_UI.md

## Objetivo

Funcionalidades avanzadas de producción: calidad de prompts, exportaciones mejoradas, templates, música/SFX, aspect ratio preview, checklist de producción, shot list, duplicar proyecto, y color script.

## Tareas

### 18.1 Gestión de Calidad de Prompts
- [ ] Indicador de calidad por prompt (completitud, detalle, consistencia)
- [ ] Warning si prompt es muy corto (< 50 chars)
- [ ] Badge "Desactualizado" si el estilo del proyecto cambió

### 18.2 Música y Sonido — Sugerencias por Escena
- [ ] ALTER TABLE scenes ADD music_suggestion TEXT DEFAULT ''
- [ ] ALTER TABLE scenes ADD sfx_suggestion TEXT DEFAULT ''
- [ ] ALTER TABLE scenes ADD music_intensity INTEGER DEFAULT 5
- [ ] IA genera sugerencias de música/SFX por escena
- [ ] Crear `src/components/production/MusicSuggestions.tsx`

### 18.3 Vista Previa Multi-Formato (Aspect Ratio)
- [ ] Preview para 16:9, 9:16, 1:1, 4:5
- [ ] Crear `src/components/production/AspectRatioPreview.tsx`
- [ ] Selector de formato en storyboard

### 18.4 Checklist de Producción
- [ ] Checklist por escena: descripción ✅, prompts ✅, personajes ✅, fondo ✅, duración ✅, imagen ❌, narración ❌, audio ❌, música ❌
- [ ] Progreso automático calculado
- [ ] Crear `src/components/production/ProductionChecklist.tsx`

### 18.5 Shot List Export (para rodaje real)
- [ ] Export profesional en PDF y Markdown
- [ ] Campos: número, tipo plano, duración, cámara, movimiento, iluminación, personajes, notas
- [ ] Crear `src/lib/export/generate-shot-list.ts`
- [ ] Crear `/api/export/shot-list/route.ts`
- [ ] Crear `src/components/production/ShotListExport.tsx`

### 18.6 Storyboard Imprimible (Print Layout)
- [ ] PDF con 3 escenas por fila, 6 por página
- [ ] Thumbnail + título + duración + narración + notas de cámara
- [ ] Crear `src/lib/export/generate-print-pdf.ts`
- [ ] Crear `/api/export/print-storyboard/route.ts`

### 18.7 Exportación Mejorada
- [ ] Export HTML incluye narración y audio embebido
- [ ] Export PDF con layout de storyboard profesional (thumbnail + info + prompt)
- [ ] Export video script (guión completo para producción)

### 18.8 Templates de Proyecto
- [ ] Template "Anuncio 30s" — 8-10 escenas, ritmo rápido
- [ ] Template "Anuncio 60s" — 15-20 escenas, estructura completa
- [ ] Template "Vídeo corporativo" — 20-30 escenas, tono formal
- [ ] Template "Social media reel" — 5-8 escenas, vertical 9:16
- [ ] Crear `src/components/production/ProjectTemplates.tsx`
- [ ] Selector de templates en /new (wizard)

### 18.9 Duplicar Proyecto
- [ ] Clonar proyecto con todas las escenas, personajes, fondos
- [ ] Sin imágenes/audio generados (solo datos)
- [ ] Botón en settings del proyecto

### 18.10 Historial de Versiones de Imagen
- [ ] ALTER TABLE scenes ADD image_versions JSONB DEFAULT '[]'
- [ ] Galería de versiones en detalle de escena
- [ ] Seleccionar versión activa
- [ ] Comparación antes/después

### 18.11 Color Script / Mood Board Automático
- [ ] IA genera paleta de colores y mood por escena
- [ ] Diagrama de progresión visual del vídeo completo
- [ ] Crear `src/components/production/ColorScript.tsx`

## Criterios de Aceptación
- [ ] Indicador de calidad visible en cada prompt
- [ ] Checklist de producción funcional por escena
- [ ] Shot list exportable en PDF/MD
- [ ] Al menos 2 templates funcionales en el wizard
- [ ] Duplicar proyecto funcional
- [ ] Sugerencias de música por escena
