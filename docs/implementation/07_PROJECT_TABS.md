# Fase 07 — Pestañas del Proyecto

## Estado: ✅ COMPLETADO (base — pendiente mejoras v4/v6)

## Objetivo

Implementar las 10 pestañas del proyecto individual: diagnóstico, arco narrativo, escenas, personajes, fondos, timeline, referencias, chat IA, exportar, y settings.

## Pestañas

### 7.1 Diagnóstico (`/p/[slug]/analysis`)
- Métricas: escenas, duración, fondos, personajes
- Puntuaciones por áreas (strengths, warnings, suggestions)
- Botón "Marcar como resuelto" y "Generar solución con IA"
- Botón "Regenerar análisis"

### 7.2 Arco Narrativo (`/p/[slug]/arc`)
- Barra visual proporcional al tiempo con colores por fase
- Cards por fase con descripción y escenas asociadas
- Escenas clickables

### 7.3 Escenas (`/p/[slug]/scenes`)
- Ver Fase 08 para detalle completo

### 7.4 Personajes (`/p/[slug]/characters`)
- Grid de CharacterCards con imagen de referencia
- Initials badge, rol, descripción visual
- Prompt snippet copiable
- "Aparece en" escenas (badges clickables)
- Crear/editar/eliminar personajes

### 7.5 Fondos (`/p/[slug]/backgrounds`)
- Grid similar a personajes
- Código, nombre, tipo, hora del día
- Prompt snippet copiable
- "Usado en" escenas

### 7.6 Timeline (`/p/[slug]/timeline`)
- Lista cronológica con tiempos
- Color por fase del arco
- Drag & drop para reordenar
- Tabs: Completa, 30s, 15s
- Notas de dirección

### 7.7 Referencias (`/p/[slug]/references`)
- Tabla grande: escena vs imágenes de referencia necesarias
- Checkmarks de qué subir
- Tips de producción
- Instrucciones de uso con Grok Aurora

### 7.8 Chat IA (`/p/[slug]/chat`)
- Chat con contexto del proyecto
- Streaming de respuestas
- Sugerencias rápidas
- Adjuntar escenas/personajes

### 7.9 Exportar (`/p/[slug]/exports`)
- Ver Fase 10

### 7.10 Settings (`/p/[slug]/settings`)
- Ver Fase 06

## Criterios de Aceptación
- [x] Todas las pestañas renderizando datos
- [x] Navegación entre pestañas fluida
- [x] Interactividad en cada pestaña

## Notas de implementación
### Páginas implementadas (todas las 10 pestañas):
- /p/[slug]/analysis — Diagnóstico con IA
- /p/[slug]/arc — Arco narrativo visual
- /p/[slug]/scenes — Lista de escenas
- /p/[slug]/scenes/[sceneId] — Detalle de escena
- /p/[slug]/characters — Grid de personajes
- /p/[slug]/backgrounds — Grid de fondos
- /p/[slug]/timeline — Timeline cronológico
- /p/[slug]/references — Tabla de referencias
- /p/[slug]/chat — Chat IA por proyecto
- /p/[slug]/exports — Panel de exportación
- /p/[slug]/settings — Configuración
- /p/[slug]/storyboard — Vista de storyboard (con loading.tsx)

### Pendiente → ver Fases 13, 17:
- [ ] Chat como panel lateral del storyboard (no pestaña separada) — Fase 13
- [ ] Diagnóstico con issues vinculados a escenas + "Arreglar con IA" — Fase 17
- [ ] Timeline visual con barra proporcional y drag & drop — Fase 17
- [ ] Personajes con reglas editables — Fase 13
- [ ] Fondos con generación IA — Fase 17
