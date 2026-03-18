# Kiyoko AI — Plan de Implementación General

## Resumen del Proyecto

**Kiyoko AI** es un Storyboard Production Studio web fullstack que permite crear storyboards profesionales asistidos por IA. Incluye un wizard conversacional, sistema multi-IA con fallback, gestión de escenas/personajes/fondos, timeline de montaje, exportación multi-formato, y un proyecto demo precargado (Domenech Peluquerías).

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router, RSC)
- **Lenguaje**: TypeScript 5 (strict)
- **Estilos**: Tailwind CSS v4 (@theme en CSS, sin config.ts)
- **Estado**: Zustand 5
- **DB/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **IA**: Vercel AI SDK (`ai` + `@ai-sdk/react`) — Multi-provider (Grok, DeepSeek, Gemini, Mistral, Groq, Claude, OpenAI, Stability AI)
- **Animaciones**: Framer Motion 11
- **Formularios**: React Hook Form + Zod
- **Editor**: Tiptap 2
- **DnD**: @dnd-kit
- **Iconos**: @tabler/icons-react + Lucide React
- **TTS**: Web Speech API + Google Cloud TTS

## Estado General del Proyecto

```
COMPLETADAS:    9 fases (01-07, 09, 11)
PARCIALES:      3 fases (08, 10, 12)
PENDIENTES:     7 fases (13-19) — nuevas funcionalidades v4/v5/v6/v7 + migración AI SDK
```

## Fases de Implementación

### Fases Base (v1 — Implementación inicial)

| Fase | Nombre | Doc | Estado |
|------|--------|-----|--------|
| 00 | Plan General | `00_PLAN_GENERAL.md` | Este documento |
| 01 | Scaffolding y Dependencias | `01_SCAFFOLDING.md` | ✅ Completado |
| 02 | Tema y Componentes UI Base | `02_THEME_UI_COMPONENTS.md` | ✅ Completado |
| 03 | Base de Datos | `03_DATABASE.md` | ✅ Completado |
| 04 | Auth y Roles | `04_AUTH_ROLES.md` | ✅ Completado |
| 05 | Sistema Multi-IA | `05_MULTI_AI_SYSTEM.md` | ✅ Completado (base) |
| 06 | CRUD de Proyectos | `06_CRUD_PROJECTS.md` | ✅ Completado |
| 07 | Pestañas del Proyecto | `07_PROJECT_TABS.md` | ✅ Completado (base) |
| 08 | Escenas en Detalle | `08_SCENES_DETAIL.md` | ⚠️ Parcial |
| 09 | Integración IA Completa | `09_AI_INTEGRATION.md` | ✅ Completado (base) |
| 10 | Exportaciones | `10_EXPORTS.md` | ✅ Completado (base) |
| 11 | Seed Demo Domenech | `11_SEED_DEMO.md` | ✅ Completado |
| 12 | Pulido Final | `12_POLISH.md` | ⚠️ Parcial |

### Fases Nuevas (v4/v5/v6/v7 — Mejoras y nuevas funcionalidades)

| Fase | Nombre | Doc | Estado | Origen |
|------|--------|-----|--------|--------|
| 13 | Chat IA como Director Creativo | `13_CHAT_DIRECTOR.md` | ⚠️ Parcial | v4 |
| 14 | Nuevos Providers IA | `14_NUEVOS_PROVIDERS.md` | Pendiente | v7 |
| 15 | Sistema de Narración y Voces | `15_NARRACION_VOCES.md` | ⚠️ Parcial | v5 |
| 16 | Traducción Multi-idioma | `16_TRADUCCION.md` | Pendiente | v5 |
| 17 | UI/UX Storyboard v3 | `17_UI_STORYBOARD_V3.md` | Pendiente | v6 |
| 18 | Producción y Calidad | `18_PRODUCCION_CALIDAD.md` | Pendiente | v5+v6 |
| 19 | Migración a Vercel AI SDK | `19_VERCEL_AI_SDK.md` | Pendiente | Análisis técnico |
| 20 | Reestructuración Core | `20_RESTRUCTURACION_CORE.md` | ✅ Completado | URLs, Nav, Favs, Orgs, Auth, Realtime |

## Resumen de lo Implementado (v1)

### Páginas (27+)
- Auth: login, register, pending, blocked, forgot-password
- Dashboard: grid de proyectos, nuevo proyecto
- Proyecto: overview, analysis, arc, scenes, scenes/[id], characters, backgrounds, timeline, references, chat, exports, settings, storyboard
- Admin: resumen, users
- Settings: api-keys

### API Routes (17)
- AI: generate-project, generate-scenes, generate-image, generate-characters, generate-arc, generate-timeline, generate-voice, improve-prompt, analyze-project, chat, providers/status
- Export: html, json, markdown, pdf
- Admin: users, users/[userId]
- User: api-keys (CRUD + test), usage

### Componentes (40+)
- UI: 30+ componentes base (shadcn/radix)
- Layout: Sidebar, Header, Breadcrumbs, ChatPanel, MobileNav, ThemeToggle, UserMenu
- Project: ProjectCard, ProjectGrid, SceneSelectionBar
- Storyboard: ChatStoryboard, HistoryPanel
- Shared: CommandMenu

### Hooks (16)
useAdmin, useAiChat, useAiGenerate, useAiProvider, useAiUsage, useApiKeys, useAuth, useBackgrounds, useCharacters, useDebounce, useExport, useImageUpload, useIssues, useProject, useScenes, useTimeline

### Stores (5)
useAiChatStore, useAiProviderStore, useFilterStore, useProjectStore, useUIStore

### Base de Datos
- 13 tablas con RLS
- 5 migraciones SQL
- 3 Storage buckets

## Resumen de lo Pendiente (v4-v7)

### Prioridad CRÍTICA
1. **Fase 19** — Migración a Vercel AI SDK: elimina ~500 líneas, streaming robusto, Zod validación, tools nativos
2. **Fase 13** — Chat como director creativo: action system con tools nativos (depende de Fase 19), panel en storyboard
3. **Fase 17** — UI Storyboard v3: cards horizontales, hover actions, header con duración
4. **Fase 14** — Nuevos providers: solo instalar @ai-sdk/xai, @ai-sdk/deepseek, @ai-sdk/mistral (trivial con Fase 19)

### Prioridad ALTA
4. **Fase 15** — Narración y voces: TTS gratis, narración por escena, player
5. **Fase 08** — Completar escenas: DnD, filtros avanzados, Tiptap editor, Shiki highlight

### Prioridad MEDIA
6. **Fase 12** — Pulido: responsive completo, animaciones Framer Motion, SEO
7. **Fase 18** — Producción: templates, shot list, checklist, música, duplicar proyecto
8. **Fase 16** — Traducción: Chrome Translator API, fallback IA

### Migraciones DB Pendientes
```sql
-- Fase 13: Chat Director
ALTER TABLE characters ADD role_rules JSONB DEFAULT '[]';
ALTER TABLE characters ADD ai_notes TEXT DEFAULT '';
ALTER TABLE projects ADD global_rules JSONB DEFAULT '[]';
CREATE TABLE change_history (...);

-- Fase 15: Narración
ALTER TABLE scenes ADD narration_text TEXT DEFAULT '';
ALTER TABLE scenes ADD narration_audio_url TEXT;
ALTER TABLE scenes ADD narration_audio_duration_ms INTEGER;
ALTER TABLE projects ADD narration_mode TEXT DEFAULT 'none';
ALTER TABLE projects ADD narration_config JSONB DEFAULT '{}';
ALTER TABLE projects ADD narration_full_text TEXT DEFAULT '';
ALTER TABLE projects ADD narration_full_audio_url TEXT;

-- Fase 18: Producción
ALTER TABLE scenes ADD music_suggestion TEXT DEFAULT '';
ALTER TABLE scenes ADD sfx_suggestion TEXT DEFAULT '';
ALTER TABLE scenes ADD music_intensity INTEGER DEFAULT 5;
ALTER TABLE scenes ADD image_versions JSONB DEFAULT '[]';
```

## Orden de Implementación Recomendado (Sprints)

### Sprint 1 — Migración AI SDK (fundamento para todo lo demás)
1. **19.1-19.2** Instalar AI SDK + crear nuevo router
2. **19.3** Migrar API routes de generación (generateText + Output.object)
3. **19.4** Migrar chat a streamText + useChat
4. **19.7-19.8** Eliminar providers legacy + activar Zod schemas
5. **14.1-14.3** Añadir nuevos providers (@ai-sdk/xai, deepseek, mistral) — trivial con AI SDK

### Sprint 2 — Impacto visual inmediato
6. **17.1** Scene cards compactas horizontales
7. **13.3** Chat como panel del storyboard
8. **17.4** Header mejorado con barra de duración
9. **17.12** Reglas de tamaño de imágenes

### Sprint 3 — Chat inteligente con tools
10. **19.6** Tool definitions para action system
11. **13.2** UI de plan de acciones en chat
12. **13.4** Contexto completo del proyecto en chat
13. **13.5** Reglas de personajes
14. **13.7** Resumen automático del storyboard

### Sprint 4 — Narración
12. **15.1** DB fields para narración
13. **15.2** Narración por escena + generación IA
14. **15.4** TTS con Web Speech API (gratis)
15. **15.10** Estimador de duración de texto

### Sprint 5 — Polish UI
16. **17.2** Acciones hover en thumbnails
17. **17.5** Overview mejorado
18. **17.9** Timeline visual
19. **17.13** Indicadores de estado por borde
20. **08** Completar escenas (DnD, filtros, Tiptap)

### Sprint 6 — Producción
21. **18.4** Checklist de producción
22. **18.8** Templates de proyecto
23. **18.5** Shot list export
24. **18.9** Duplicar proyecto
25. **12** Completar pulido (responsive, animaciones, SEO)

### Sprint 7 — Premium
26. **15.3** Narración continua
27. **16** Traducción multi-idioma
28. **18.2** Música y SFX
29. **18.7** Exportación mejorada
30. **18.11** Color script / mood board

## Reglas del Proyecto

- TypeScript estricto (no `any`)
- Tailwind v4: estilos en CSS con @theme, NO tailwind.config.ts
- Componentes: function components + hooks
- Imports con alias `@/*` → `src/*`
- Supabase: SIEMPRE RLS, nunca bypass desde cliente
- IA: SIEMPRE pasar por el AI Router
- Cada fase actualiza la doc correspondiente en `/docs`
