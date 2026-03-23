---
description: Crear una nueva página completa con page.tsx, loading.tsx, error.tsx y componente principal.
argument-hint: [ruta relativa, ej: project/[shortId]/publications]
allowed-tools: Read, Write
agent: frontend-architect
---

## Tarea

Crear una nueva página en `src/app/(dashboard)/$ARGUMENTS/` siguiendo las convenciones del proyecto.

## Pasos

1. Leer `docs/new_implementacion/app_architecture_v4.md` para saber qué debe contener la página.
2. Crear `page.tsx` como Server Component async con prefetch TanStack Query.
3. Crear `loading.tsx` con skeleton apropiado.
4. Crear `error.tsx` con retry button.
5. Si la ruta necesita contexto compartido (layout con Provider), crear `layout.tsx`.
6. Crear el componente Client principal en `src/components/`.
7. Añadir query key a `src/lib/query/keys.ts` si es necesaria.
