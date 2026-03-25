---
name: refactor
description: Reorganizar y refactorizar componentes en carpetas por dominio. Eliminar duplicados, extraer componentes reutilizables, mejorar imports.
---

# Skill: Refactor & Organize

## Estructura de carpetas por dominio

```
src/components/
├── ui/                    # Primitivos UI (shadcn + custom)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   └── ...
│
├── layout/                # Estructura y navegación
│   ├── Sidebar.tsx
│   ├── sidebar/           # Sub-componentes del sidebar
│   ├── Breadcrumbs.tsx
│   ├── MobileNav.tsx
│   └── UserMenu.tsx
│
├── shared/                # Componentes genéricos reutilizables
│   ├── CommandMenu.tsx
│   ├── FavoriteButton.tsx
│   ├── LoadingScreen.tsx
│   ├── EmptyState.tsx
│   └── ConfirmDialog.tsx
│
├── auth/                  # Autenticación
│   ├── AuthCard.tsx
│   └── ...
│
├── project/               # Componentes de proyecto
│   ├── ProjectCard.tsx
│   ├── ProjectGrid.tsx
│   └── ProjectView.tsx
│
├── video/                 # Componentes de video
│   ├── VideoCard.tsx
│   ├── VideoGrid.tsx
│   └── VideoView.tsx
│
├── scene/                 # Escenas (edición)
│   ├── SceneCard.tsx
│   ├── PromptEditor.tsx
│   └── ...
│
├── ai-chat/               # Chat con Kiyoko
│   ├── ChatPanel.tsx
│   └── ...
│
├── narration/             # Narración y voces
├── timeline/              # Timeline y arcos
├── analysis/              # Análisis de video
├── exports/               # Exportación
├── tasks/                 # Gestión de tareas
├── characters/            # Personajes
├── backgrounds/           # Fondos
├── admin/                 # Panel admin
├── publications/          # Publicaciones
└── settings/              # Configuración
```

## Reglas de refactorización

### 1. Un componente = Un archivo
- Cada componente exportado tiene su propio archivo
- Archivos de más de 300 líneas → dividir en sub-componentes
- Crear `index.ts` en cada carpeta para re-exportar

### 2. Jerarquía de componentes
```
Page (Server Component)
  └── View (Client Component — container principal)
       ├── Header (título + acciones)
       ├── Filters/Tabs (navegación interna)
       ├── Content (grid, tabla, lista)
       │    └── Card/Row (item individual)
       └── Modals/Dialogs (crear, editar, eliminar)
```

### 3. Extraer componentes reutilizables

Si un patrón aparece 3+ veces → crear componente en `ui/` o `shared/`:
- Page headers con título + descripción + acciones → `PageHeader`
- Grids de cards con loading state → `CardGrid`
- Formularios modales → usar el patrón `Dialog` estándar
- Estados vacíos → `EmptyState` (ya existe en ui/)
- Confirmaciones → `ConfirmDialog` (ya existe en shared/)

### 4. Imports limpios

```tsx
// Orden de imports:
// 1. React/Next
import { useState } from 'react';
import Link from 'next/link';

// 2. Librerías externas
import { useQuery } from '@tanstack/react-query';

// 3. Componentes UI
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Componentes del dominio
import { VideoCard } from '@/components/video/VideoCard';

// 5. Hooks y utils
import { useProject } from '@/hooks/useProject';
import { queryKeys } from '@/lib/query/keys';

// 6. Types
import type { Video } from '@/types';
```

### 5. Eliminar dead code

- Componentes no importados en ningún lugar → eliminar
- Variables/funciones no usadas → eliminar
- Imports no usados → eliminar
- Props no usadas → eliminar
- Archivos vacíos o de placeholder → implementar o eliminar

## Proceso de refactorización

1. **Auditar**: `grep -rn` para encontrar el componente en todos los archivos
2. **Mover**: crear archivo en nueva ubicación, copiar contenido
3. **Actualizar imports**: buscar y reemplazar todas las importaciones
4. **Verificar**: `npx tsc --noEmit` para confirmar que no hay errores
5. **Limpiar**: eliminar archivo original si se movió

## Anti-patrones a eliminar

- `any` types → tipar correctamente con Database types
- `useState + useEffect + fetch` → migrar a `useQuery`
- Colores hardcoded → variables CSS
- Componentes god (500+ líneas) → dividir
- Props drilling (3+ niveles) → Context o composición
- Lógica de negocio en componentes → extraer a hooks o lib/
