# Fase 06 — CRUD de Proyectos

## Estado: PENDIENTE

## Objetivo

Implementar el dashboard con grid de proyectos, overview del proyecto individual, y settings del proyecto.

## Tareas

### 6.1 Dashboard (`/dashboard`)
- Grid de ProjectCards con thumbnails
- Filtros: estado, búsqueda por título/cliente
- Ordenar: fecha, nombre, progreso
- Botón "+ Nuevo Proyecto"
- Badge "DEMO" para proyecto precargado

### 6.2 Project Overview (`/p/[slug]`)
- Stats: escenas, personajes, fondos, duración
- Cover image grande
- Info del proyecto
- Grid de últimas escenas con thumbnails
- Actividad reciente

### 6.3 Project Settings (`/p/[slug]/settings`)
- Editar título, descripción, cliente, estilo, plataforma
- Cambiar cover image
- Paleta de colores
- Configuración de generadores IA

### 6.4 Componentes
- `ProjectCard.tsx` — Card con cover, stats, progreso
- `ProjectGrid.tsx` — Grid responsive
- `ProjectOverview.tsx` — Vista overview
- `ProjectSettings.tsx` — Formulario settings
- `ProjectStats.tsx` — Cards de estadísticas
- `ProjectTabs.tsx` — Navegación entre pestañas

### 6.5 Store y Hooks
- `useProjectStore.ts` — Estado del proyecto activo
- `useProject.ts` — CRUD de proyectos

## Criterios de Aceptación
- [ ] Dashboard muestra proyectos del usuario
- [ ] Filtros y búsqueda funcionan
- [ ] Overview muestra stats correctos
- [ ] Settings editable con validación
- [ ] Navegación entre pestañas funcional
