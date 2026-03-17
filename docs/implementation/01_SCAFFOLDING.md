# Fase 01 — Scaffolding y Dependencias

## Estado: EN PROGRESO

## Objetivo

Configurar la estructura base del proyecto: migrar a `src/`, instalar todas las dependencias, crear la estructura de carpetas completa, configurar alias de imports y archivos de configuración.

## Tareas

### 1.1 Migrar de `app/` a `src/app/`
- Mover `app/` → `src/app/`
- Actualizar `tsconfig.json` paths: `@/*` → `src/*`
- Verificar que `next dev` funciona

### 1.2 Instalar dependencias core
```bash
npm install @supabase/supabase-js @supabase/ssr zustand @tabler/icons-react
npm install framer-motion react-hook-form @hookform/resolvers zod
npm install sonner date-fns clsx tailwind-merge
```

### 1.3 Instalar dependencias IA (multi-provider)
```bash
npm install @anthropic-ai/sdk @google/generative-ai openai groq-sdk
```

### 1.4 Instalar dependencias UI/Editor
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-markdown remark-gfm shiki react-dropzone
```

### 1.5 Instalar dependencias export
```bash
npm install @react-pdf/renderer sharp
```

### 1.6 Crear estructura de carpetas
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── project/
│   ├── scenes/
│   ├── characters/
│   ├── backgrounds/
│   ├── analysis/
│   ├── arc/
│   ├── timeline/
│   ├── references/
│   ├── ai/
│   ├── exports/
│   └── admin/
├── lib/
│   ├── supabase/
│   ├── ai/
│   │   ├── providers/
│   │   ├── prompts/
│   │   └── schemas/
│   ├── export/
│   └── utils/
├── stores/
├── hooks/
├── types/
└── middleware.ts
```

### 1.7 Crear .env.example
Todos los campos de variables de entorno documentados.

### 1.8 Crear .claude/CLAUDE.md y skills
Instrucciones del proyecto para Claude Code.

## Criterios de Aceptación
- [ ] `npm run dev` funciona sin errores
- [ ] Todas las dependencias instaladas
- [ ] Estructura de carpetas completa creada
- [ ] Alias `@/*` funciona correctamente
- [ ] `.env.example` creado con todos los campos
