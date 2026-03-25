---
name: design-system
description: Gestionar y aplicar el design system de Kiyoko AI. Estilo Notion + Supabase — minimal, limpio, funcional. Colores, tipografía, componentes, patrones de layout.
---

# Skill: Design System — Kiyoko AI

## Filosofía de diseño

**Referentes**: Notion (simplicidad, espaciado generoso, tipografía clara) + Supabase (dark mode elegante, sidebar funcional, tablas limpias).

**Principios**:
1. **Minimal**: menos es más. Sin decoración innecesaria.
2. **Funcional**: cada elemento tiene un propósito claro.
3. **Respirado**: espaciado generoso entre secciones (estilo Notion).
4. **Consistente**: mismos patrones en todo el app.
5. **Dark-first**: diseñar primero para dark mode, light como variante.

## Paleta de colores

### Variables CSS (globals.css)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--background` | `#ffffff` | `#191919` | Fondo principal |
| `--foreground` | `#111827` | `#ebebeb` | Texto principal |
| `--card` | `#f9f8f7` | `#202020` | Cards, navbar, headers |
| `--secondary` | `#f0efee` | `#282828` | Superficies secundarias |
| `--muted` | `#f0efee` | `#282828` | Fondos sutiles |
| `--muted-foreground` | `#6B7280` | `#71717a` | Texto secundario |
| `--border` | `#e8e7e5` | `#2e2e2e` | Bordes |
| `--primary` | `#006fee` | `#006fee` | Acciones, links, brand |
| `--destructive` | `#f31260` | `#f31260` | Errores, eliminar |
| `--sidebar` | `#f9f8f7` | `#202020` | Sidebar fondo |

### Colores semánticos HeroUI (para badges, chips, estados)

| Color | Valor | Uso |
|-------|-------|-----|
| `primary-500` | `#006FEE` | Acción principal, links |
| `secondary-500` | `#7828C8` | Tags, categorías |
| `success-500` | `#17C964` | Completado, activo |
| `warning-500` | `#F5A524` | En progreso, atención |
| `danger-500` | `#F31260` | Error, eliminar |

## Tipografía

```
Font family: Inter (sans), JetBrains Mono (mono)

Escala:
- Page title:    text-2xl font-semibold tracking-tight
- Section title: text-lg font-medium
- Subtitle:      text-sm font-medium text-muted-foreground
- Body:          text-sm text-foreground
- Caption:       text-xs text-muted-foreground
- Code:          font-mono text-xs
```

## Espaciado (estilo Notion)

```
Page padding:     p-6 lg:p-8
Section gap:      space-y-6 o space-y-8
Card padding:     p-4 o p-6
Card gap interno: space-y-3 o space-y-4
Grid gap:         gap-4 o gap-6
Header margin:    mb-6
```

## Patrones de componentes

### Page header (estilo Supabase)
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Action buttons */}
  </div>
</div>
```

### Card (estilo Notion)
```tsx
<div className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
  {/* Content */}
</div>
```

### Table (estilo Supabase)
```tsx
<div className="rounded-lg border border-border overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-muted">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {header}
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-accent/50 transition-colors">
        <td className="px-4 py-3">{cell}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Empty state (estilo Notion)
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <IconName className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium mb-1">{title}</h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
  <Button>{ctaText}</Button>
</div>
```

### Dropdown menu (estilo Notion)
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuItem>
      <Edit className="h-4 w-4 mr-2" /> Editar
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash className="h-4 w-4 mr-2" /> Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Sidebar navigation (estilo Supabase)
```tsx
<nav className="space-y-1 px-2">
  <SidebarItem href="/dashboard" icon={Home} active={isActive}>
    Dashboard
  </SidebarItem>
  <Collapsible>
    <CollapsibleTrigger className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-accent">
      <Folder className="h-4 w-4 mr-2" />
      <span className="flex-1 text-left">Proyectos</span>
      <ChevronDown className="h-4 w-4" />
    </CollapsibleTrigger>
    <CollapsibleContent className="pl-6 space-y-1">
      {/* Sub-items */}
    </CollapsibleContent>
  </Collapsible>
</nav>
```

### Modal/Dialog (estilo Notion)
```tsx
<Dialog>
  <DialogContent className="sm:max-w-[480px]">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* Form fields */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button onClick={onConfirm}>{confirmText}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Animaciones

- Transiciones: `transition-colors` o `transition-all duration-200`
- Hover en cards: `hover:bg-accent/50`
- Hover en botones: manejado por variantes del componente
- Skeleton loading: `animate-pulse` con `bg-muted`
- Aparición de contenido: `animate-in fade-in-0` (framer-motion solo para complejas)

## Reglas estrictas

1. NUNCA colores hardcoded. Siempre variables CSS.
2. NUNCA sombras excesivas. Máximo `shadow-sm` en cards. `shadow-md` solo en popovers.
3. NUNCA bordes gruesos. Siempre `border` (1px) con `border-border`.
4. NUNCA espaciado apretado. Mínimo `p-4` en cards, `gap-3` en grids.
5. NUNCA iconos sin texto en acciones principales. Solo en acciones secundarias (more menu).
6. SIEMPRE rounded corners: `rounded-md` para buttons, `rounded-lg` para cards.
7. SIEMPRE hover states en elementos interactivos.
8. SIEMPRE focus-visible para accesibilidad.
