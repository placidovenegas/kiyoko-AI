# Fase 16 — Traducción Multi-idioma

## Estado: PENDIENTE

## Origen: docs/update/KIYOKO_MEJORAS_v5_FINAL.md

## Objetivo

Implementar traducción de narraciones y prompts usando Chrome Translator API (gratis, en navegador) con fallback a IA, y botón de traducción inline en prompts.

## Tareas

### 16.1 Chrome Translator API
- [ ] Crear `src/lib/translation/chrome-translator.ts`
- [ ] Detectar si `window.Translator` está disponible
- [ ] Crear traductor con sourceLanguage/targetLanguage
- [ ] Fallback a API route si Chrome Translator no disponible

### 16.2 Fallback de Traducción
- [ ] Crear `src/lib/translation/fallback-translator.ts`
- [ ] Usa IA (Gemini/Groq) vía AI Router para traducir
- [ ] Crear `/api/translate/route.ts`

### 16.3 Traducción de Narración
- [ ] Botón "Traducir a..." en config narración
- [ ] IA traduce manteniendo timing y tono
- [ ] Guardar traducciones como variantes (campo narration_translations JSONB en scenes)
- [ ] Dropdown para cambiar entre idiomas

### 16.4 Traducción de Prompts
- [ ] Los prompts siempre se mantienen en inglés (ya implementado)
- [ ] Botón "Ver en español" que muestra traducción de referencia
- [ ] Badge "TRADUCCIÓN — solo informativa" para que no se confunda con el prompt real
- [ ] No afecta al prompt real, solo visual

### 16.5 Componentes
- [ ] `TranslateButton.tsx` — Botón inline en cada prompt
- [ ] `TranslationPreview.tsx` — Card con traducción + badge informativo
- [ ] `TranslateChatInput.tsx` — Traducción bidireccional en el chat

## Criterios de Aceptación
- [ ] Chrome Translator API funcional cuando disponible
- [ ] Fallback a IA cuando no hay Translator
- [ ] Traducción visual de prompts (sin modificar el original)
- [ ] Traducción de narración con variantes guardadas
