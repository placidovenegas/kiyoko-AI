# Fase 03 — Base de Datos (Supabase)

## Estado: ✅ COMPLETADO

## Objetivo

Crear el schema completo de la base de datos en Supabase, aplicar RLS policies, crear Storage buckets y generar tipos TypeScript.

## Tareas

### 3.1 Migraciones SQL
- `00001_initial_schema.sql` — Extensiones, enums, todas las tablas (profiles, projects, characters, backgrounds, scenes, narrative_arcs, timeline_entries, project_issues, ai_conversations, exports, reference_maps, user_api_keys, ai_usage_logs)
- `00002_rls_policies.sql` — RLS en todas las tablas, funciones helper (is_admin, is_approved)
- `00003_storage_buckets.sql` — Buckets: project-assets, avatars, exports + policies
- `00004_seed_domenech.sql` — Proyecto demo completo

### 3.2 Triggers y Funciones
- `handle_new_user()` — Auto-crear perfil al registrarse
- `update_updated_at()` — Auto-actualizar timestamps
- `recalc_project_stats()` — Recalcular estadísticas del proyecto

### 3.3 Índices
- Todos los índices especificados en el schema

### 3.4 Vista SQL
- `ai_usage_monthly` — Resumen mensual de uso por usuario/provider

### 3.5 Generar tipos TypeScript
- `src/types/database.ts` generado con `supabase gen types`

## Tablas (13 total)
1. `profiles` — Usuarios
2. `projects` — Proyectos de storyboard
3. `characters` — Personajes
4. `backgrounds` — Fondos/localizaciones
5. `scenes` — Escenas (tabla principal)
6. `narrative_arcs` — Fases del arco narrativo
7. `timeline_entries` — Montaje segundo a segundo
8. `project_issues` — Diagnóstico/análisis
9. `ai_conversations` — Chat IA por proyecto
10. `exports` — Historial de exportaciones
11. `reference_maps` — Qué imagen subir en cada escena
12. `user_api_keys` — API keys de usuario (cifradas)
13. `ai_usage_logs` — Log de uso de IA

## Criterios de Aceptación
- [x] Todas las tablas creadas correctamente
- [x] RLS activo en todas las tablas
- [x] Policies verificadas
- [x] Storage buckets creados
- [ ] Tipos TypeScript generados con `supabase gen types` (se usan tipos manuales en src/types/)

## Notas de implementación
- 5 migraciones aplicadas: initial_schema, rls_policies, storage_buckets, seed_domenech, ai_usage_logs_insert_policy
- 13 tablas creadas con RLS
- 3 storage buckets: project-assets, avatars, exports
- Tipos TypeScript manuales en `src/types/` (project.ts, scene.ts, character.ts, background.ts, timeline.ts, ai.ts, export.ts, ai-actions.ts)

### Pendiente para fases futuras (v4/v5):
- [ ] ALTER TABLE characters ADD role_rules JSONB, ai_notes TEXT
- [ ] ALTER TABLE scenes ADD narration_text, narration_audio_url, narration_audio_duration_ms, music_suggestion, sfx_suggestion, music_intensity, image_versions JSONB
- [ ] ALTER TABLE projects ADD narration_mode, narration_config JSONB, narration_full_text, narration_full_audio_url, global_rules JSONB
- [ ] CREATE TABLE change_history (para historial con undo)
