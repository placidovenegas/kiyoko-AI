# Kiyoko AI — Plan de Implementación v4+v5+v6

## Fuentes: KIYOKO_MEJORAS_v4_FINAL.md, v5_FINAL.md, v6_UI.md

---

## FASE 1: Chat IA como Director Creativo (v4)
**Prioridad: CRÍTICA — Cambia toda la experiencia de uso**

### 1.1 Sistema de Acciones (Action System)
- [ ] Crear `src/types/ai-actions.ts` — tipos AiAction, AiActionPlan, AiActionType
- [ ] Crear `src/lib/ai/action-executor.ts` — ejecuta acciones en Supabase (update_scene, delete_scene, create_scene, reorder_scenes, update_character, update_prompt, batch_update, merge_scenes, split_scene)
- [ ] Crear `src/lib/ai/action-parser.ts` — parsea respuesta de IA a array de AiAction
- [ ] Actualizar system prompt del chat para que devuelva AiActionPlan en JSON cuando detecte instrucciones de cambio

### 1.2 UI de Plan de Acciones en el Chat
- [ ] Crear componente `ActionPlanCard` — muestra plan con:
  - Summary
  - Lista de acciones con ❌/✅ marcando cambios vs sin cambios
  - Botones [Aplicar todos] [Modificar plan] [Cancelar]
  - Warnings si hay escenas afectadas
- [ ] Crear componente `ActionResultCard` — muestra resultado tras ejecutar:
  - ✅ Escena X modificada (click para ver)
  - Prompts regenerados
  - Progreso de ejecución

### 1.3 Chat como Panel del Storyboard
- [ ] Mover el chat del panel lateral global AL storyboard directamente
- [ ] Integrar `react-resizable-panels` para split storyboard|chat dentro de la página storyboard
- [ ] El chat tiene contexto completo: escenas, personajes, fondos, reglas de personajes
- [ ] Quick actions: [Revisar personajes] [Reducir escenas] [Ordenar timeline] [Explicar el vídeo]

### 1.4 Reglas de Personajes
- [ ] Añadir campo `rules JSONB` en tabla `characters` (ALTER TABLE)
- [ ] El chat guarda reglas cuando el usuario las define ("José no lava cabezas")
- [ ] Las reglas se inyectan en el system prompt al generar/mejorar prompts

### 1.5 Resumen del Storyboard
- [ ] Al abrir el chat, Kiyoko muestra resumen automático:
  - "Tu storyboard tiene X escenas, Xs de duración (objetivo: Ys)"
  - "Escenas sin imagen: X, sin prompt: Y"
  - "Personajes: José, Conchi, Nerea, Raúl"

---

## FASE 2: Narración y Voces (v5)

### 2.1 Base de Datos — Nuevos campos
- [ ] ALTER TABLE scenes ADD narration_text TEXT, narration_audio_url TEXT, narration_audio_duration_ms INT
- [ ] ALTER TABLE projects ADD narration_mode TEXT, narration_config JSONB, narration_full_text TEXT, narration_full_audio_url TEXT

### 2.2 Narración por Escena
- [ ] Añadir sección "NARRACIÓN" en cada scene card del storyboard
- [ ] Texto editable con estimación de duración (~2.5 palabras/segundo)
- [ ] Warning si el texto excede la duración de la escena
- [ ] Botón [Generar con IA] que genera narración complementaria (no descriptiva)
- [ ] Botón [Generar voz] que usa TTS

### 2.3 Narración Continua
- [ ] Config en proyecto: modo (por escena / continua / sin narración)
- [ ] Editor de guión completo para modo continuo
- [ ] IA genera guión fluido que cubre todas las escenas
- [ ] Timestamps automáticos por escena

### 2.4 TTS (Text-to-Speech)
- [ ] **Web Speech API** como default (gratis, funciona en navegador)
  - Crear `src/lib/tts/web-speech.ts`
  - Selector de voces del navegador
  - Preview en tiempo real
- [ ] **Google Cloud TTS** como fallback (ya tenemos API key)
  - Actualizar `/api/ai/generate-voice` para soportar ambos
- [ ] Selector de voz, velocidad, idioma en config narración
- [ ] Player de audio embebido en cada scene card

### 2.5 System Prompt de Narración
- [ ] Crear `src/lib/ai/prompts/system-narration-generator.ts`
- [ ] Reglas: complementar imagen no repetir, respetar duración, tono configurable

---

## FASE 3: Traducción Multi-idioma (v5)

### 3.1 Traducción de Narración
- [ ] Botón "Traducir a..." en config narración
- [ ] IA traduce manteniendo timing y tono
- [ ] Guardar traducciones como variantes (narration_translations JSONB)

### 3.2 Traducción de Prompts
- [ ] Los prompts siempre en inglés (ya implementado)
- [ ] Botón "Ver en español" que muestra traducción de referencia
- [ ] No afecta al prompt real, solo visual

---

## FASE 4: UI/UX Storyboard v3 (v6)

### 4.1 Scene Cards Compactas Horizontales
- [ ] Redesignar card: thumbnail 120x68 a la izquierda, info a la derecha
- [ ] Cards colapsadas por defecto (solo título + badges + thumbnail)
- [ ] Click en ▼ expande: prompts, narración, mejoras, acciones
- [ ] Prompts colapsados: 3 líneas + "ver más"
- [ ] Así caben ~5-8 escenas en pantalla vs 1-2 ahora

### 4.2 Acciones en Thumbnail
- [ ] Hover en thumbnail: overlay con iconos
  - 🔄 Regenerar imagen con IA
  - 📤 Subir/sustituir imagen
  - ⬇️ Descargar
  - 🗑️ Eliminar
- [ ] Si no hay imagen: "📷 Generar o subir"

### 4.3 Header del Storyboard Mejorado
- [ ] Barra de duración: actual vs objetivo con % y warning si excede
- [ ] Vista Grid añadida (además de Completo y Compacto)
- [ ] Botón [↕️ Reordenar] que activa drag & drop

### 4.4 Overview Mejorado
- [ ] Hero compacto (120px si no hay cover, 200px si hay)
- [ ] Progreso desglosado: personajes ✅, fondos ✅, prompts ✅, imágenes ⬜, narraciones ⬜, aprobadas ⬜
- [ ] Thumbnails de últimas escenas en grid

### 4.5 Diagnóstico Mejorado
- [ ] Issues vinculados a escenas específicas (click para ir)
- [ ] Botón "Arreglar con IA" que ejecuta acción desde el chat
- [ ] Feedback al resolver (qué se hizo)

### 4.6 Personajes Mejorado
- [ ] Card horizontal compacta
- [ ] Badge "Aparece en X escenas" clickable
- [ ] Reglas del personaje visibles y editables
- [ ] Prompt snippet con preview de cómo se usa en escenas

### 4.7 Timeline Visual
- [ ] Barra horizontal proporcional al tiempo
- [ ] Cada escena como bloque coloreado por fase
- [ ] Hover muestra tooltip con info
- [ ] Click navega a la escena

---

## FASE 5: Producción y Calidad (v5+v6)

### 5.1 Gestión de Calidad de Prompts
- [ ] Indicador de calidad por prompt (completitud, detalle, consistencia)
- [ ] Warning si prompt es muy corto (< 50 chars)
- [ ] Badge "Desactualizado" si el estilo del proyecto cambió

### 5.2 Exportación Mejorada
- [ ] Export HTML incluye narración y audio embebido
- [ ] Export PDF con layout de storyboard profesional (thumbnail + info + prompt)
- [ ] Export video script (guión completo para producción)

### 5.3 Templates
- [ ] Template "Anuncio 30s"
- [ ] Template "Anuncio 60s"
- [ ] Template "Video corporativo"
- [ ] Template "Social media reel"

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Sprint 1 (Impacto inmediato)
1. **4.1** Scene cards compactas horizontales — mejora visual inmediata
2. **1.3** Chat como panel del storyboard — experiencia central
3. **1.1-1.2** Action system básico (update_scene, create, delete, reorder)

### Sprint 2 (Chat inteligente)
4. **1.4** Reglas de personajes
5. **1.5** Resumen automático del storyboard
6. **4.3** Header mejorado con duración vs objetivo

### Sprint 3 (Narración)
7. **2.1** DB fields para narración
8. **2.2** Narración por escena + generación IA
9. **2.4** TTS con Web Speech API

### Sprint 4 (Polish)
10. **4.4** Overview mejorado
11. **4.5** Diagnóstico con acciones
12. **4.2** Acciones en thumbnail
13. **5.1** Calidad de prompts

### Sprint 5 (Premium)
14. **2.3** Narración continua
15. **3.1** Traducción
16. **5.2-5.3** Exportación y templates
