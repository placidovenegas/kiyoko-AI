# Kiyoko AI — Auditoria shadcn/Radix y Plan de Migracion a HeroUI v3

> Inventario completo de los 47 componentes UI, donde se usan,
> que primitiva usan, y como migrar cada uno a HeroUI v3.

**Fecha:** 2026-03-26

---

## 1. RESUMEN EJECUTIVO

| Dato | Valor |
|------|-------|
| Total componentes UI | 47 archivos en `src/components/ui/` |
| Archivos que importan UI | ~70 archivos |
| Primitivas Radix UI | 13 paquetes |
| Primitivas Base UI | 4 paquetes |
| Componentes custom (sin primitiva) | ~20 |
| Componentes sin usar (dead code) | 13 |
| Componente mas usado | `kiyoko-button` (28 archivos) |
| Segundo mas usado | `button` (22 archivos) |
| Mas complejo | `sidebar.tsx` (725 LOC, 25+ exports) |

---

## 2. INVENTARIO COMPLETO

### 2.1 Wrappers de Radix UI (13 componentes)

| Componente | Primitiva Radix | Archivos que lo usan | Dificultad migracion | HeroUI equivalente |
|------------|----------------|---------------------|---------------------|-------------------|
| `alert-dialog.tsx` | @radix-ui/react-alert-dialog | 1 (ComponentsShowcase) | Facil | `Modal` con variant danger |
| `avatar.tsx` | @radix-ui/react-avatar | 1 (SidebarUserFooter) | Facil | `Avatar` |
| `checkbox.tsx` | @radix-ui/react-checkbox | 0 (sin usar) | Eliminar | `Checkbox` |
| `dialog.tsx` | @radix-ui/react-dialog | 1 (SearchModal) | Facil | `Modal` |
| `dropdown-menu.tsx` | @radix-ui/react-dropdown-menu | 10 archivos | Media | `Dropdown` |
| `label.tsx` | @radix-ui/react-label | 0 (sin usar) | Eliminar | Integrado en Form |
| `popover.tsx` | @radix-ui/react-popover | 3 (ChatInput, Header, Sidebar) | Facil | `Popover` |
| `progress.tsx` | @radix-ui/react-progress | 1 (ComponentsShowcase) | Facil | `Progress` |
| `scroll-area.tsx` | @radix-ui/react-scroll-area | 0 (sin usar) | Eliminar | `ScrollShadow` |
| `select.tsx` | @radix-ui/react-select | 2 (SceneSelect, Settings) | Media | `Select` |
| `slider.tsx` | @radix-ui/react-slider | 2 (DurationInput, Showcase) | Facil | `Slider` |
| `switch.tsx` | @radix-ui/react-switch | 2 (Showcase, Settings) | Facil | `Switch` |
| `tabs.tsx` | @radix-ui/react-tabs | 2 (Script, Showcase) | Media | `Tabs` |

### 2.2 Wrappers de Base UI (4 componentes)

| Componente | Primitiva Base UI | Archivos | Dificultad | HeroUI equivalente |
|------------|------------------|----------|-----------|-------------------|
| `button.tsx` | @base-ui/react/button | 22 archivos | Media | `Button` |
| `collapsible.tsx` | @base-ui/react/collapsible | 1 (SidebarProjectNav) | Facil | `Accordion` |
| `separator.tsx` | @base-ui/react/separator | 3 archivos | Facil | `Divider` |
| `tooltip.tsx` | @base-ui/react/tooltip | 4 archivos | Facil | `Tooltip` |

### 2.3 Componentes custom con CVA (7 componentes)

| Componente | LOC | Archivos | Dificultad | HeroUI equivalente |
|------------|-----|----------|-----------|-------------------|
| `badge.tsx` | 98 | 1 (Showcase) | Facil | `Badge` / `Chip` |
| `chip.tsx` | 199 | 1 (Showcase) | Media | `Chip` |
| `input.tsx` | 173 | 4 archivos | Media | `Input` / `TextField` |
| `textarea.tsx` | ~50 | 4 archivos | Facil | `Textarea` |
| `skeleton.tsx` | 13 | 1 (Showcase) | Facil | `Skeleton` |
| `spinner.tsx` | 107 | 1 (Showcase) | Facil | `Spinner` |
| `status-badge.tsx` | 108 | 1 (Showcase) | Custom | `Badge` + config |

### 2.4 Componentes de compatibilidad (2)

| Componente | Que hace | Archivos | Nota |
|------------|----------|----------|------|
| `kiyoko-button.tsx` | Shim sobre Button | 28 archivos | EL MAS USADO — migrar a HeroUI Button directo |
| `kiyoko-select.tsx` | Dropdown custom con Framer | 2 archivos | Reemplazar con HeroUI Select |

### 2.5 Componentes complejos/compuestos (8)

| Componente | LOC | Dependencias | Archivos | Dificultad | Nota |
|------------|-----|-------------|----------|-----------|------|
| `sidebar.tsx` | 725 | Base UI + Context | 13 archivos | MUY ALTA | Sistema completo de sidebar con 25+ exports |
| `chat-panel.tsx` | 505 | Custom | 1 | ALTA | Chat UI completo |
| `chat-bubble.tsx` | 219 | Custom | 1 | Media | Mensajes del chat |
| `chat-input.tsx` | 199 | Custom | 1 | Media | Input del chat |
| `command.tsx` | 147 | cmdk lib | 0 (sin usar) | Eliminar | Reemplazar si se necesita |
| `multi-select.tsx` | 296 | Custom | 1 | ALTA | Custom con busqueda |
| `tag-input.tsx` | 192 | Custom | 1 | Media | Custom tags |
| `input-group.tsx` | 158 | Custom CVA | 1 | Media | Inputs agrupados |

### 2.6 Componentes de dominio (sin migrar, custom)

| Componente | LOC | Uso | Migrar? |
|------------|-----|-----|---------|
| `logo.tsx` | 61 | 5 archivos | NO — SVG custom de Kiyoko |
| `toast.tsx` | 88 | 2 archivos (layout) | NO — Sonner wrapper, funciona bien |
| `PromptBlock.tsx` | 50 | 1 | NO — custom de dominio |
| `CopyButton.tsx` | 53 | 1 | NO — custom utility |
| `EmptyState.tsx` | 43 | 0 (sin usar) | Eliminar o usar HeroUI Card |
| `Card.tsx` | 39 | 0 (sin usar) | Eliminar — usar HeroUI Card |
| `ColorPicker.tsx` | 49 | 0 (sin usar) | Eliminar |

### 2.7 Componentes de imagen (custom, mantener)

| Componente | LOC | Uso | Migrar? |
|------------|-----|-----|---------|
| `ImageUpload.tsx` | 141 | 0 | Mantener (logica custom) |
| `ImagePreview.tsx` | 67 | 0 | Mantener |
| `ImageCropOverlay.tsx` | 142 | 0 | Mantener |
| `avatar-upload.tsx` | 130 | 0 | Mantener (Supabase upload) |

---

## 3. DEAD CODE — COMPONENTES SIN USAR (13)

Estos se pueden **eliminar directamente** antes de migrar:

| Componente | Razon |
|------------|-------|
| `checkbox.tsx` | 0 imports |
| `command.tsx` | 0 imports |
| `label.tsx` | 0 imports |
| `scroll-area.tsx` | 0 imports |
| `resizable.tsx` | 0 imports |
| `sheet.tsx` | 0 imports |
| `Card.tsx` | 0 imports |
| `ColorPicker.tsx` | 0 imports |
| `EmptyState.tsx` | 0 imports |
| `ImageCropOverlay.tsx` | 0 imports |
| `ImagePreview.tsx` | 0 imports |
| `ImageUpload.tsx` | 0 imports |
| `avatar-upload.tsx` | 0 imports |

---

## 4. TOP 10 COMPONENTES MAS USADOS

| # | Componente | Archivos | Tipo |
|---|-----------|----------|------|
| 1 | `kiyoko-button` (KButton) | 28 | Shim → Button |
| 2 | `button` (Button) | 22 | Base UI wrapper |
| 3 | `sidebar` | 13 | Custom system |
| 4 | `dropdown-menu` | 10 | Radix UI |
| 5 | `logo` | 5 | Custom SVG |
| 6 | `input` | 4 | Custom CVA |
| 7 | `textarea` | 4 | Custom wrapper |
| 8 | `tooltip` | 4 | Base UI wrapper |
| 9 | `popover` | 3 | Radix UI |
| 10 | `separator` | 3 | Base UI wrapper |

---

## 5. DEPENDENCIAS A ELIMINAR TRAS MIGRACION

```
@radix-ui/react-alert-dialog
@radix-ui/react-avatar
@radix-ui/react-checkbox
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-label
@radix-ui/react-popover
@radix-ui/react-progress
@radix-ui/react-scroll-area
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-slider
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-tabs
@radix-ui/react-tooltip
shadcn
class-variance-authority  (HeroUI usa tailwind-variants)
```

Dependencias que se MANTIENEN:
```
@base-ui/react  (sidebar lo usa, migrar despues)
framer-motion   (animaciones custom, migrar a CSS gradualmente)
sonner          (toasts, funciona bien)
cmdk            (si se necesita command palette, sino eliminar)
lucide-react    (iconos, compatible con HeroUI)
```

---

## 6. MAPEO shadcn → HeroUI v3

| shadcn/Radix | HeroUI v3 | API cambio |
|-------------|-----------|-----------|
| `<Button variant="ghost">` | `<Button variant="ghost">` | Casi identico |
| `<Dialog>` | `<Modal>` | Compound: `Modal.Header`, `Modal.Body`, `Modal.Footer` |
| `<AlertDialog>` | `<Modal>` con variant | Mismo que Modal + `isDismissable={false}` |
| `<DropdownMenu>` | `<Dropdown>` | Compound: `Dropdown.Trigger`, `Dropdown.Menu`, `Dropdown.Item` |
| `<Popover>` | `<Popover>` | Compound: `Popover.Trigger`, `Popover.Content` |
| `<Select>` | `<Select>` | Compound: `Select.Trigger`, `Select.Content`, `Select.Item` |
| `<Tabs>` | `<Tabs>` | Compound: `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` |
| `<Checkbox>` | `<Checkbox>` | Directo |
| `<Switch>` | `<Switch>` | Directo |
| `<Slider>` | `<Slider>` | Directo |
| `<Progress>` | `<Progress>` | Directo |
| `<Avatar>` | `<Avatar>` | Directo |
| `<Badge>` | `<Badge>` o `<Chip>` | Directo |
| `<Input>` | `<Input>` o `<TextField>` | `<TextField>` incluye label+error |
| `<Textarea>` | `<Textarea>` | Directo |
| `<Skeleton>` | `<Skeleton>` | Directo |
| `<Spinner>` | `<Spinner>` | Directo |
| `<Separator>` | `<Divider>` | Renombrar |
| `<Tooltip>` | `<Tooltip>` | Directo |
| `<ScrollArea>` | `<ScrollShadow>` | API diferente |
| `<Collapsible>` | `<Accordion>` | API diferente |
| `<Sheet>` | `<Drawer>` | API diferente |
| `cn()` | `cn()` compatible | Mantener utility |
| `cva()` | `tv()` (tailwind-variants) | Cambio de API |

---

## 7. PLAN DE MIGRACION POR FASES

### Fase 0: Preparacion (1 hora)
- [ ] Instalar `@heroui/react`, `@heroui/styles`, `tailwind-variants`
- [ ] Añadir `@import "@heroui/styles"` a globals.css
- [ ] Eliminar 13 componentes dead code
- [ ] Verificar build

### Fase 1: Componentes simples (2-3 horas)
Migrar los que tienen 1:1 directo con HeroUI y poco uso:
- [ ] `avatar.tsx` → HeroUI Avatar (1 archivo)
- [ ] `checkbox.tsx` → eliminar (0 uso)
- [ ] `progress.tsx` → HeroUI Progress (1 archivo)
- [ ] `slider.tsx` → HeroUI Slider (2 archivos)
- [ ] `switch.tsx` → HeroUI Switch (2 archivos)
- [ ] `skeleton.tsx` → HeroUI Skeleton (1 archivo)
- [ ] `spinner.tsx` → HeroUI Spinner (1 archivo)
- [ ] `separator.tsx` → HeroUI Divider (3 archivos)
- [ ] `tooltip.tsx` → HeroUI Tooltip (4 archivos)
- [ ] `collapsible.tsx` → HeroUI Accordion (1 archivo)

### Fase 2: Componentes core (4-6 horas)
Los mas usados, requieren actualizacion en muchos archivos:
- [ ] `button.tsx` → HeroUI Button (22 archivos)
- [ ] `kiyoko-button.tsx` → eliminar shim, usar HeroUI Button directo (28 archivos)
- [ ] `input.tsx` → HeroUI TextField/Input (4 archivos)
- [ ] `textarea.tsx` → HeroUI Textarea (4 archivos)
- [ ] `badge.tsx` → HeroUI Badge/Chip (1 archivo)
- [ ] `chip.tsx` → HeroUI Chip (1 archivo)

### Fase 3: Componentes interactivos (3-4 horas)
Popovers, modales, menus:
- [ ] `popover.tsx` → HeroUI Popover (3 archivos)
- [ ] `dialog.tsx` → HeroUI Modal (1 archivo)
- [ ] `alert-dialog.tsx` → HeroUI Modal variant (1 archivo)
- [ ] `dropdown-menu.tsx` → HeroUI Dropdown (10 archivos)
- [ ] `select.tsx` → HeroUI Select (2 archivos)
- [ ] `tabs.tsx` → HeroUI Tabs (2 archivos)

### Fase 4: Componentes complejos (6-8 horas)
Requieren reescritura parcial:
- [ ] `kiyoko-select.tsx` → HeroUI Select con search (2 archivos)
- [ ] `multi-select.tsx` → HeroUI Select con selectionMode="multiple" (1 archivo)
- [ ] `tag-input.tsx` → custom sobre HeroUI Chip + Input
- [ ] `input-group.tsx` → HeroUI Input con startContent/endContent
- [ ] `chat-bubble.tsx` → mantener custom, usar HeroUI Card internamente
- [ ] `chat-input.tsx` → mantener custom, usar HeroUI Textarea internamente
- [ ] `chat-panel.tsx` → mantener custom, usar HeroUI primitivas

### Fase 5: Sidebar (4-6 horas)
La mas compleja, migrar al final:
- [ ] `sidebar.tsx` → reescribir con HeroUI layout primitivas (13 archivos)

### Fase 6: Limpieza (1-2 horas)
- [ ] Eliminar dependencias Radix/shadcn de package.json
- [ ] Eliminar `class-variance-authority`
- [ ] Migrar `cva()` restantes a `tv()` (tailwind-variants)
- [ ] Verificar build completo
- [ ] Verificar visual en todas las paginas

---

## 8. CAMBIOS CLAVE DE API

### onClick → onPress
```tsx
// shadcn
<Button onClick={handleClick}>

// HeroUI v3
<Button onPress={handleClick}>
```

### Flat props → Compound components
```tsx
// shadcn dialog
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    content
  </DialogContent>
</Dialog>

// HeroUI v3 modal
<Modal>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Content>
    <Modal.Header>Title</Modal.Header>
    <Modal.Body>content</Modal.Body>
  </Modal.Content>
</Modal>
```

### cva() → tv()
```tsx
// shadcn (class-variance-authority)
const buttonVariants = cva('base-class', {
  variants: { size: { sm: 'h-8', md: 'h-10' } },
  defaultVariants: { size: 'md' },
});

// HeroUI (tailwind-variants)
const button = tv({
  base: 'base-class',
  variants: { size: { sm: 'h-8', md: 'h-10' } },
  defaultVariants: { size: 'md' },
});
```

---

## 9. ESTIMACION TOTAL

| Fase | Esfuerzo | Archivos tocados |
|------|----------|-----------------|
| Fase 0: Preparacion | 1h | 2 (package.json, globals.css) + eliminar 13 |
| Fase 1: Simples | 2-3h | ~15 |
| Fase 2: Core | 4-6h | ~60 (button es 50 archivos entre button + kiyoko-button) |
| Fase 3: Interactivos | 3-4h | ~20 |
| Fase 4: Complejos | 6-8h | ~10 |
| Fase 5: Sidebar | 4-6h | ~15 |
| Fase 6: Limpieza | 1-2h | package.json + verificacion |
| **TOTAL** | **~25-35h** | **~120 archivos** |

---

*Documento de auditoria para migracion shadcn → HeroUI v3*
