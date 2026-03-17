# Kiyoko AI — Plan de Implementación General

## Resumen del Proyecto

**Kiyoko AI** es un Storyboard Production Studio web fullstack que permite crear storyboards profesionales asistidos por IA. Incluye un wizard conversacional, sistema multi-IA con fallback, gestión de escenas/personajes/fondos, timeline de montaje, exportación multi-formato, y un proyecto demo precargado (Domenech Peluquerías).

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router, RSC)
- **Lenguaje**: TypeScript 5 (strict)
- **Estilos**: Tailwind CSS v4 (@theme en CSS, sin config.ts)
- **Estado**: Zustand 5
- **DB/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **IA**: Multi-provider (Gemini, Claude, OpenAI, Groq, Stability AI)
- **Animaciones**: Framer Motion 11
- **Formularios**: React Hook Form + Zod
- **Editor**: Tiptap 2
- **DnD**: @dnd-kit
- **Iconos**: @tabler/icons-react

## Fases de Implementación

| Fase | Nombre | Doc | Descripción |
|------|--------|-----|-------------|
| 00 | Plan General | `00_PLAN_GENERAL.md` | Este documento |
| 01 | Scaffolding y Dependencias | `01_SCAFFOLDING.md` | Estructura de carpetas, deps, configs |
| 02 | Tema y Componentes UI Base | `02_THEME_UI_COMPONENTS.md` | Tailwind v4 theme, 20+ componentes base |
| 03 | Base de Datos | `03_DATABASE.md` | Schema SQL, RLS, Storage buckets, tipos TS |
| 04 | Auth y Roles | `04_AUTH_ROLES.md` | Login, registro, middleware, panel admin |
| 05 | Sistema Multi-IA | `05_MULTI_AI_SYSTEM.md` | Router, providers, API keys, cifrado |
| 06 | CRUD de Proyectos | `06_CRUD_PROJECTS.md` | Dashboard, overview, settings |
| 07 | Pestañas del Proyecto | `07_PROJECT_TABS.md` | 10 pestañas: análisis, arco, escenas, etc. |
| 08 | Escenas en Detalle | `08_SCENES_DETAIL.md` | Cards, prompts, imágenes, filtros, DnD |
| 09 | Integración IA Completa | `09_AI_INTEGRATION.md` | Wizard, chat, generación, streaming |
| 10 | Exportaciones | `10_EXPORTS.md` | HTML, JSON, Markdown, PDF |
| 11 | Seed Demo Domenech | `11_SEED_DEMO.md` | 28 escenas, personajes, datos completos |
| 12 | Pulido Final | `12_POLISH.md` | Responsive, dark mode, animaciones, SEO |

## Reglas del Proyecto

- TypeScript estricto (no `any`)
- Tailwind v4: estilos en CSS con @theme, NO tailwind.config.ts
- Componentes: function components + hooks
- Imports con alias `@/*` → `src/*`
- Supabase: SIEMPRE RLS, nunca bypass desde cliente
- IA: SIEMPRE pasar por el AI Router
- Cada fase actualiza la doc correspondiente en `/docs`
