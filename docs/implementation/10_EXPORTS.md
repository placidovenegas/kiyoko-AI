# Fase 10 — Exportaciones

## Estado: PENDIENTE

## Objetivo

Implementar los 4 formatos de exportación: HTML autocontenido, JSON estructurado, Markdown con prompts, y PDF.

## Formatos

### 10.1 HTML (`/api/export/html`)
- Archivo HTML autocontenido con CSS inline
- Tabs: diagnóstico, arco, escenas, timeline
- Imágenes embebidas como base64 o URLs
- Responsive, usable offline

### 10.2 JSON (`/api/export/json`)
- Todo el proyecto en JSON estructurado
- Incluye: project, characters, backgrounds, scenes, arcs, timeline, issues
- Para backup o importación en otros sistemas

### 10.3 Markdown (`/api/export/markdown`)
- Documento MD con prompts en bloques de código
- Similar al archivo de producción original
- Secciones: resumen, personajes, fondos, escenas, timeline

### 10.4 PDF (`/api/export/pdf`)
- Generado con @react-pdf/renderer
- Documento formal de producción
- Incluye thumbnails de imágenes generadas

## Componentes
- `ExportPanel.tsx` — Panel con 4 formatos
- `ExportPreview.tsx` — Preview antes de descargar
- `ExportHistory.tsx` — Historial de exports
- `ExportFormatCard.tsx` — Card de cada formato

## Generadores (`src/lib/export/`)
- `generate-html.ts`
- `generate-json.ts`
- `generate-markdown.ts`
- `generate-pdf.ts`

## Criterios de Aceptación
- [ ] Los 4 formatos generan correctamente
- [ ] Historial de exports guardado en DB
- [ ] Preview funcional
- [ ] Descarga directa funcional
