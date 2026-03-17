# Fase 12 — Pulido Final

## Estado: PENDIENTE

## Objetivo

Responsive design completo, dark mode, animaciones, loading states, error handling, SEO y meta tags.

## Tareas

### 12.1 Responsive Design
- Mobile-first en todos los componentes
- Sidebar colapsable en mobile
- Grid adaptativos (1-2-3 columnas)
- Touch-friendly en móvil

### 12.2 Dark Mode
- Toggle Light/Dark/System
- ThemeToggle en sidebar
- Todas las superficies respetan el tema
- Persistencia en preferences del usuario

### 12.3 Animaciones (Framer Motion)
- Page transitions entre rutas
- Layout animations en cards
- AnimatePresence en modals y drawers
- Expand/collapse suave en SceneCards
- Entrada escalonada en grids

### 12.4 Loading States
- Skeleton loaders en todas las páginas
- Loading.tsx en cada route group
- Suspense boundaries correctos
- Optimistic updates donde aplique

### 12.5 Error Handling
- Error.tsx boundary global
- Toast notifications (Sonner)
- Mensajes de error amigables
- Retry logic en llamadas IA

### 12.6 Empty States
- Ilustraciones cuando no hay datos
- CTAs para crear contenido
- Proyecto sin escenas, sin personajes, etc.

### 12.7 SEO y Meta
- Metadata en layout.tsx
- Open Graph image
- Favicon y manifest
- Title dinámico por página

### 12.8 Performance
- Next.js Image optimization
- Lazy loading de imágenes
- Code splitting por ruta
- Prefetch de rutas probables

## Criterios de Aceptación
- [ ] App usable en mobile
- [ ] Dark mode sin glitches
- [ ] Animaciones suaves (60fps)
- [ ] No hay estados de loading sin feedback
- [ ] SEO correcto en cada página
