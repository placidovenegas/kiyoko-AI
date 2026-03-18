# Fase 15 — Sistema de Narración y Voces

## Estado: ⚠️ PARCIAL (API route TTS existe, resto pendiente)

## Origen: docs/update/KIYOKO_MEJORAS_v5_FINAL.md

## Objetivo

Implementar sistema de narración por escena y continua, generación de voz con múltiples proveedores TTS (Web Speech API gratis + Google Cloud + premium), y reproductor de audio embebido.

## Lo que ya existe

### Implementado:
- `/api/ai/generate-voice/route.ts` — TTS con Google Cloud (GET voces, POST generar audio)
- `src/lib/ai/prompts/system-narration-generator.ts` — System prompt para narración
- Google Cloud TTS API integrada

## Tareas Pendientes

### 15.1 Base de Datos — Nuevos campos
- [ ] ALTER TABLE scenes ADD narration_text TEXT DEFAULT ''
- [ ] ALTER TABLE scenes ADD narration_audio_url TEXT
- [ ] ALTER TABLE scenes ADD narration_audio_duration_ms INTEGER
- [ ] ALTER TABLE projects ADD narration_mode TEXT DEFAULT 'none' — 'none' | 'per_scene' | 'continuous'
- [ ] ALTER TABLE projects ADD narration_config JSONB DEFAULT '{}'
- [ ] ALTER TABLE projects ADD narration_full_text TEXT DEFAULT ''
- [ ] ALTER TABLE projects ADD narration_full_audio_url TEXT

### 15.2 Narración por Escena
- [ ] Añadir sección "NARRACIÓN" en cada scene card del storyboard
- [ ] Texto editable con estimación de duración (~2.5 palabras/segundo español)
- [ ] Warning si el texto excede la duración de la escena
- [ ] Botón [Generar con IA] que genera narración complementaria
- [ ] Botón [Generar voz] que usa TTS

### 15.3 Narración Continua
- [ ] Config en proyecto: modo (por escena / continua / sin narración)
- [ ] Editor de guión completo para modo continuo
- [ ] IA genera guión fluido que cubre todas las escenas
- [ ] Timestamps automáticos por escena

### 15.4 TTS — Web Speech API (Default, Gratis)
- [ ] Crear `src/lib/tts/web-speech.ts`
- [ ] Totalmente gratis, funciona offline
- [ ] Selector de voces del navegador
- [ ] Preview en tiempo real
- [ ] Grabación del audio generado como Blob

### 15.5 TTS — Mejoras Google Cloud
- [ ] Actualizar `/api/ai/generate-voice` para soportar Web Speech y Google Cloud
- [ ] Selector WaveNet vs Standard en config
- [ ] 4M chars/mes gratis

### 15.6 TTS — Providers Premium (Opcional)
- [ ] ElevenLabs TTS (10K chars/mes gratis, muy alta calidad)
- [ ] OpenAI TTS ($15/1M chars)
- [ ] Crear `src/lib/tts/index.ts` — Factory con fallback chain

### 15.7 Selector de Voz en UI
- [ ] Crear `src/components/narration/VoiceSelector.tsx`
- [ ] Dropdown de providers (Web Speech / Google / ElevenLabs / OpenAI)
- [ ] Selector de voz, idioma, género
- [ ] Preview con botón de play
- [ ] Controles: velocidad (rate) y tono (pitch)

### 15.8 Player de Audio
- [ ] Crear `src/components/narration/NarrationPlayer.tsx`
- [ ] Player embebido en cada scene card
- [ ] Play/pause/seek
- [ ] Indicador de duración
- [ ] Descargar MP3

### 15.9 Componentes de Narración
- [ ] `NarrationConfig.tsx` — Panel de configuración (modo, idioma, tono, perspectiva)
- [ ] `NarrationPerScene.tsx` — Editor por escena con timing
- [ ] `NarrationFull.tsx` — Editor de guión completo
- [ ] `NarrationDownload.tsx` — Descargar audio individual y completo

### 15.10 Estimador de Duración de Texto
- [ ] Crear `src/lib/utils/text-duration.ts`
- [ ] ~150 palabras/minuto en español, ~160 en inglés
- [ ] Función: estimateTextDuration(text, lang) → { durationSeconds, wordCount, fitsInSeconds(s), maxWordsForSeconds(s) }

### 15.11 API Route para Narración IA
- [ ] Crear `/api/ai/generate-narration/route.ts`
- [ ] Genera narración para una escena o todas
- [ ] Usa system-narration-generator.ts
- [ ] Respeta duración de cada escena

## Criterios de Aceptación
- [ ] Narración editable en cada scene card
- [ ] Estimación de duración automática con warning
- [ ] TTS funcional con al menos Web Speech API
- [ ] Player de audio embebido en escenas
- [ ] Modo continuo con guión completo
- [ ] Descargar audio MP3 por escena y completo
