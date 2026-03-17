# Fase 07 — Pestañas del Proyecto

## Estado: PENDIENTE

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
- [ ] Todas las pestañas renderizando datos
- [ ] Navegación entre pestañas fluida
- [ ] Interactividad en cada pestaña
