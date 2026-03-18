# Fase 02 — Tema Tailwind v4 + Componentes UI Base

## Estado: ✅ COMPLETADO (parcial — faltan algunos componentes)

## Objetivo

Configurar el tema visual completo de Kiyoko AI en Tailwind v4 (sin tailwind.config.ts) y crear todos los componentes UI base reutilizables.

## Tareas

### 2.1 Configurar `globals.css` con @theme
- Colores de marca (brand-50 a brand-900)
- Colores de superficie (light + dark)
- Colores de fases del arco (hook, build, peak, close)
- Colores de tipos de escena (original, improved, new, filler, video)
- Fonts: Inter + JetBrains Mono
- Border radius, sombras
- Dark mode overrides

### 2.2 Componentes UI Base (20+)
| Componente | Descripción |
|-----------|-------------|
| `Button.tsx` | Variantes: primary, secondary, ghost, danger, sizes |
| `Card.tsx` | Container con sombra y hover |
| `Badge.tsx` | Labels con colores dinámicos |
| `Input.tsx` | Input con label, error, iconos |
| `Textarea.tsx` | Textarea auto-resize |
| `Select.tsx` | Select nativo estilizado |
| `Dialog.tsx` | Modal con overlay |
| `AlertDialog.tsx` | Confirmación destructiva |
| `Tabs.tsx` | Tab navigation |
| `Tooltip.tsx` | Hover tooltip |
| `Avatar.tsx` | Imagen circular con fallback initials |
| `Skeleton.tsx` | Loading placeholder |
| `DropdownMenu.tsx` | Menú contextual |
| `Sheet.tsx` | Drawer lateral |
| `Switch.tsx` | Toggle on/off |
| `Slider.tsx` | Range slider |
| `Progress.tsx` | Barra de progreso |
| `ScrollArea.tsx` | Scroll personalizado |
| `Separator.tsx` | Línea divisoria |
| `EmptyState.tsx` | Placeholder sin datos |
| `CopyButton.tsx` | Copiar al clipboard |
| `ImageUpload.tsx` | Dropzone de imágenes |
| `ImagePreview.tsx` | Preview con lightbox |
| `PromptBlock.tsx` | Código con copy + highlight |
| `StatusBadge.tsx` | Badge de estado |
| `ColorPicker.tsx` | Selector de color |

### 2.3 Componentes Layout
| Componente | Descripción |
|-----------|-------------|
| `Sidebar.tsx` | Nav lateral 260px, colapsable |
| `SidebarNav.tsx` | Links de navegación |
| `SidebarProjectNav.tsx` | Nav del proyecto activo |
| `Header.tsx` | Header con breadcrumbs y acciones |
| `Breadcrumbs.tsx` | Migajas de pan |
| `MobileNav.tsx` | Hamburger + drawer |
| `ThemeToggle.tsx` | Light/Dark/System |
| `UserMenu.tsx` | Avatar + dropdown |

## Criterios de Aceptación
- [x] Theme completo en globals.css con todas las variables
- [x] Todos los componentes UI creados y tipados
- [x] Dark mode funcional con toggle
- [x] Componentes usan las variables del theme

## Notas de implementación
### Componentes UI implementados (30+):
Card, ColorPicker, CopyButton, EmptyState, ImageCropOverlay, ImagePreview, ImageUpload, PromptBlock, StatusBadge, alert-dialog, avatar, badge, button, checkbox, command, dialog, dropdown-menu, input, label, popover, progress, resizable, scroll-area, select, separator, sheet, skeleton, slider, switch, tabs, textarea, tooltip

### Componentes Layout implementados (8):
Breadcrumbs, ChatPanel, Header, MobileNav, Sidebar, SidebarNav, SidebarProjectNav, ThemeToggle, UserMenu

### Pendiente:
- [ ] Componente `Popover` (existe pero revisar funcionalidad completa)
- [ ] Componente `CommandMenu` (existe en shared/, verificar funcionalidad Cmd+K)
