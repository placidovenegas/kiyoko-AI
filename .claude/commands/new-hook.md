---
description: Crear un hook de TanStack Query (useQuery para lectura o useMutation para escritura) con optimistic updates.
argument-hint: [nombre del hook, ej: useVideos, useUpdateScene, useDeleteCharacter]
allowed-tools: Read, Write
agent: frontend-architect
---

## Tarea

Crear el hook `$ARGUMENTS` en `src/hooks/` siguiendo los patrones de TanStack Query del proyecto.

## Pasos

1. Determinar si es lectura (useQuery), creación (useMutation), actualización (useMutation con optimistic) o eliminación (useMutation con optimistic).
2. Usar la plantilla correspondiente de la skill `create-hook`.
3. Usar query keys de `src/lib/query/keys.ts`. Si no existe la key, añadirla.
4. Si la query function no existe en `src/lib/queries/`, crearla.
5. Tipar con los tipos de `src/types/database.types.ts`.
