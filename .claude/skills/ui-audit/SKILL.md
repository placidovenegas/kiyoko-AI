---
name: ui-audit
description: Auditar componentes UI para consistencia visual, compliance con design system, accesibilidad y patrones Notion/Supabase. Usar cuando se quiera verificar calidad visual del proyecto.
---

# Skill: UI Audit

## Objetivo

Auditar componentes del proyecto para garantizar:
1. Consistencia visual con el design system (HeroUI palette + shadcn variables)
2. Uso correcto de variables CSS (no colores hardcoded)
3. Patrones de componentes Notion/Supabase (minimal, clean, espaciado)
4. Accesibilidad básica (aria-labels, keyboard nav, focus rings)
5. Organización de componentes en carpetas por dominio

## Checklist de auditoría

### 1. Colores — Solo variables CSS

```
PROHIBIDO: bg-[#0EA5A0], text-[#111113], border-[#1E1E22]
CORRECTO:  bg-primary, text-foreground, border-border
```

Buscar violaciones:
```bash
grep -rn "bg-\[#\|text-\[#\|border-\[#" src/components/ src/app/
```

### 2. Espaciado — Consistente y respirado (estilo Notion)

- Padding interno de cards: `p-4` o `p-6` (nunca p-2 o p-8)
- Gap entre elementos: `gap-3` o `gap-4`
- Margin entre secciones: `space-y-6` o `space-y-8`
- Headers de página: `mb-6` o `mb-8`

### 3. Tipografía — Jerarquía clara

- Títulos de página: `text-2xl font-semibold`
- Títulos de sección: `text-lg font-medium`
- Subtítulos: `text-sm font-medium text-muted-foreground`
- Body: `text-sm text-foreground`
- Caption/meta: `text-xs text-muted-foreground`

### 4. Componentes UI — Usar siempre los de `src/components/ui/`

Verificar que NO se crean componentes ad-hoc cuando ya existe uno en `/ui`:
- Button → `@/components/ui/button`
- Input → `@/components/ui/input`
- Card → `@/components/ui/card`
- Dialog → `@/components/ui/dialog`
- Select → `@/components/ui/select`
- Dropdown → `@/components/ui/dropdown-menu`
- Badge/Chip → `@/components/ui/badge` o `@/components/ui/chip`
- Skeleton → `@/components/ui/skeleton`
- Tabs → `@/components/ui/tabs`

### 5. Patrones de diseño Notion/Supabase

- **Cards**: borde sutil `border-border`, hover suave `hover:bg-accent`, sin sombras excesivas
- **Tables**: headers con `bg-muted`, rows con `hover:bg-accent`, separadores `divide-border`
- **Empty states**: icono + título + descripción + CTA, centrado verticalmente
- **Loading**: skeletons que replican la estructura final, nunca spinners solos
- **Dropdowns**: `DropdownMenu` de Radix, items con iconos alineados, separadores entre grupos
- **Sidebars**: collapsible, items con iconos + texto, active state con `bg-accent`
- **Modals**: máximo 480px ancho, padding `p-6`, footer con acciones alineadas a la derecha

### 6. Dark mode

- Verificar que TODOS los colores usan variables CSS (se adaptan automáticamente)
- No mezclar clases `dark:` manuales con el sistema de variables
- Verificar contraste suficiente en modo oscuro

### 7. Responsive

- Layout principal: sidebar + contenido con `flex`
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Mobile: sidebar colapsa, nav bottom o hamburger

### 8. Componentes no usados (dead code)

Detectar componentes que NO están importados en ningún otro archivo del proyecto.

**Proceso**:
1. Listar todos los `.tsx` en `src/components/`
2. Para cada archivo, extraer el nombre del export principal
3. Buscar si ese nombre aparece como import en algún otro archivo de `src/`
4. Si no se importa en ningún lugar → marcarlo como **UNUSED**

**Verificación rápida por componente**:
```bash
# Para cada componente, buscar si se importa en algún sitio
grep -rn "from.*ComponentName\|import.*ComponentName" src/ --include="*.tsx" --include="*.ts"
```

**Clasificación**:
- **Dead code seguro**: 0 imports en todo `src/` → se puede eliminar
- **Solo en showcase**: importado únicamente en `dev/ComponentsShowcase.tsx` → probablemente dead code
- **Solo en barrel**: importado solo desde un `index.ts` que a su vez no se importa → dead code transitivo

**Acciones recomendadas**:
- Componentes dead code seguro → eliminar archivo
- Componentes que se planean usar → mover a carpeta `src/components/_drafts/` temporalmente
- Tras eliminar, verificar build: `npx tsc --noEmit`

### 9. Componentes duplicados

Detectar componentes con funcionalidad similar o duplicada:
- Múltiples implementaciones de Button, Input, Card
- Componentes con nombres similares en diferentes carpetas
- Lógica repetida que debería extraerse a un componente compartido

```bash
# Buscar componentes con nombres similares
find src/components -name "*.tsx" | sort | uniq -d
# Buscar re-implementaciones de UI primitives
grep -rn "className.*rounded.*border.*bg-" src/components/ --include="*.tsx" -l
```

## Output esperado

Generar un reporte con:
- Total de violaciones de colores hardcoded
- Componentes que no usan los UI primitivos
- Componentes no usados (dead code) con tamaño total
- Componentes duplicados o con funcionalidad solapada
- Problemas de espaciado/tipografía
- Sugerencias de mejora priorizadas (critical > high > medium > low)
