# Fase 10 — Exportaciones

## Estado: ✅ COMPLETADO (base — pendiente mejoras v5)

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
- [x] Los 4 formatos generan correctamente (HTML, JSON, MD, PDF)
- [ ] Historial de exports guardado en DB (tabla exports existe pero no se usa completamente)
- [ ] Preview funcional
- [x] Descarga directa funcional

## Notas de implementación
### Implementado:
- /api/export/html — HTML autocontenido
- /api/export/json — JSON estructurado
- /api/export/markdown — Markdown con prompts
- /api/export/pdf — PDF con @react-pdf/renderer
- Generadores: generate-html.ts, generate-json.ts, generate-markdown.ts, generate-pdf.ts
- Hook: useExport.ts
- Página: /p/[slug]/exports

### Pendiente → ver Fase 18 (Producción):
- [ ] Componentes ExportPanel, ExportPreview, ExportHistory, ExportFormatCard
- [ ] Export HTML con narración y audio embebido
- [ ] Export PDF con layout storyboard profesional
- [ ] Export video script (guión de producción)
- [ ] Export shot list PDF/MD
- [ ] Storyboard imprimible (3 escenas por fila, 6 por página)
