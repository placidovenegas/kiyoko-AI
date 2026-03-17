# Kiyoko AI — Plan de Mejoras y Mantenimiento

## Estado Actual (v0.1)

### Lo que funciona
- Auth completa (registro, login, roles, admin)
- Dashboard con proyectos reales
- Wizard conversacional con IA (Groq/Gemini)
- Storyboard completo con 28 escenas del demo Domenech
- Sidebar IA para mejorar prompts
- Generación de prompts faltantes
- Inserción de planos detalle entre escenas
- Selección múltiple + sustituir/eliminar escenas con IA
- Upload de imágenes (personajes, fondos, escenas, cover)
- Chat IA con contexto del proyecto
- Análisis/diagnóstico con IA
- Exportación (HTML, JSON, Markdown, PDF)
- 13 tablas con RLS en Supabase

### Proveedores de IA configurados
- **Groq** (LLaMA 3.3 70B) — texto, gratis, rápido (provider principal)
- **Gemini** (2.0 Flash) — texto + imágenes, gratis (fallback/cuota)

---

## Mejoras Prioritarias

### 1. Consistencia visual de prompts
- **Problema**: Algunos prompts se generan en español
- **Solución**: System prompts actualizados para forzar inglés en prompt_image/prompt_video
- **Estado**: ✅ Implementado

### 2. Audio y diálogos
- **Problema**: No se preguntaba si los personajes hablan
- **Solución**: Wizard pregunta sobre audio (silente, ambiente, diálogo, voz en off)
- **Estado**: ✅ Implementado en system prompts

### 3. Personajes y fondos por escena
- **Problema**: No se mostraba qué personajes/fondos aparecen en cada escena
- **Solución**: Resolver desde character_ids, background_id, y required_references
- **Estado**: ✅ Implementado + dropdowns para añadir

### 4. Orden de escenas
- **Problema**: Escenas desordenadas en el storyboard
- **Solución**: Ordenar siempre por sort_order (orden del vídeo)
- **Estado**: ✅ Implementado

### 5. Duración total
- **Problema**: Discrepancia entre duración mostrada y real
- **Solución**: Calcular sumando duration_seconds de todas las escenas
- **Estado**: ✅ Implementado

---

## Mejoras Futuras

### UI/UX
- [ ] Migrar componentes complejos a HeroUI (Dialog, Dropdown, Tabs, Select, Modal)
- [ ] Drag & drop para reordenar escenas en el storyboard
- [ ] Preview en tiempo real de cambios de prompt
- [ ] Dark mode completo verificado en todas las páginas
- [ ] Responsive design en móvil (sidebar colapsable)
- [ ] Atajos de teclado (Ctrl+C copiar prompt, Ctrl+S guardar)

### Storyboard
- [ ] Vista de timeline visual (barra proporcional con escenas)
- [ ] Comparación antes/después de mejoras de prompt
- [ ] Generación de imágenes directamente desde el storyboard
- [ ] Versiones de storyboard (guardar snapshots)
- [ ] Compartir storyboard con enlace público (solo lectura)

### IA
- [ ] Generación de imágenes con Gemini Imagen 3
- [ ] Streaming de respuestas visible en el sidebar IA
- [ ] Memoria de conversación entre sesiones
- [ ] Sugerencias automáticas al crear escenas
- [ ] Detección de inconsistencias entre escenas (personaje cambia de ropa)
- [ ] Generación de arco narrativo automático desde escenas

### Producción
- [ ] Integración con generadores de imagen (Grok, Midjourney, DALL-E)
- [ ] Copiar prompt + refs automáticamente al formato del generador
- [ ] Tracking de qué escenas ya tienen imagen generada
- [ ] Comparativa de resultados entre generadores

### Datos
- [ ] Versionado de escenas (historial de cambios)
- [ ] Undo/redo en ediciones
- [ ] Importar proyecto desde JSON
- [ ] Duplicar proyecto completo
- [ ] Templates de storyboard (publicidad, cortometraje, social media)

### Performance
- [ ] Lazy loading de imágenes en storyboard
- [ ] Paginación para proyectos con muchas escenas
- [ ] Cache de respuestas IA
- [ ] Optimistic updates en ediciones

---

## Arquitectura

### Stack actual
- Next.js 16 (App Router, RSC)
- TypeScript strict
- Tailwind CSS v4 (@theme)
- Zustand (stores)
- Supabase (PostgreSQL + Auth + Storage)
- Groq + Gemini (IA gratuita)

### Consideraciones para HeroUI
Si se migra a HeroUI:
- Reemplazar: Button, Input, Select, Dialog, Tabs, Dropdown, Switch, Slider, Progress
- Mantener custom: PromptBlock, CopyButton, ImageUpload, SceneCard, StoryboardCard
- HeroUI usa Tailwind v3 internamente — verificar compatibilidad con v4

### Base de datos
- 13 tablas con RLS completo
- Triggers automáticos (profile creation, updated_at)
- Vista ai_usage_monthly para tracking
- 3 Storage buckets (project-assets, avatars, exports)

---

## Reglas de Mantenimiento

1. **Prompts siempre en inglés**: prompt_image y prompt_video NUNCA en español
2. **RLS siempre activo**: Nunca bypass desde cliente
3. **IA vía Router**: Nunca llamar SDKs directamente, siempre por el router con fallback
4. **Sort order**: Las escenas SIEMPRE se muestran por sort_order
5. **Tipos estrictos**: No usar `any` en TypeScript
6. **Actualizar docs**: Cada cambio importante se documenta aquí
