---
description: Zustand solo para estado de UI, nunca para datos del servidor
globs: ["src/stores/**/*.ts"]
---

Zustand es SOLO para estado de interfaz que NO viene del servidor:
- Tema (dark/light)
- Sidebar (open/collapsed)
- Chat panel (open/width/expanded)
- Vista de escenas (grid/list/timeline)
- Filtros del dashboard

NUNCA guardar datos del servidor en Zustand (proyectos, vídeos, escenas, personajes).
Esos datos van en TanStack Query (useQuery/useMutation).

Persistir solo preferencias de UI con `persist`:
```tsx
export const useUIStore = create(
  persist(store, {
    name: 'kiyoko-ui',
    partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
  })
);
```
