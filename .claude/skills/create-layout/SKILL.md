---
name: create-layout
description: Crear patrones de layout reutilizables — dropdown menus, tablas renderizables, sidebars colapsables, modales, tabs, panels. Estilo Notion + Supabase.
---

# Skill: Create Layout Patterns

## Patrones disponibles

### 1. Dropdown Menu (Context Menu)

Para acciones sobre un item (editar, duplicar, eliminar):

```tsx
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Copy, Trash2 } from 'lucide-react';

interface ItemActionsMenuProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ItemActionsMenu({ onEdit, onDuplicate, onDelete }: ItemActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 2. Data Table (Renderable)

Tabla con sort, filtro, y acciones por fila:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Column<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T & string;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  data, columns, searchKey, actions, emptyMessage, onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = searchKey && search
    ? data.filter(item => String(item[searchKey]).toLowerCase().includes(search.toLowerCase()))
    : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortKey as keyof T]);
        const bv = String(b[sortKey as keyof T]);
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-3 w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(item => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-accent/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(item[col.key], item) : String(item[col.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {emptyMessage ?? 'No hay datos'}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Collapsible Sidebar Section

```tsx
'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SidebarSection({ title, icon, defaultOpen = true, children }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center w-full px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
        <ChevronRight className={`h-3 w-3 mr-1 transition-transform ${open ? 'rotate-90' : ''}`} />
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 px-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### 4. Tab Layout (estilo Supabase)

```tsx
'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  count?: number;
}

interface TabLayoutProps {
  tabs: TabItem[];
  defaultValue?: string;
}

export function TabLayout({ tabs, defaultValue }: TabLayoutProps) {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className="space-y-6">
      <TabsList className="bg-muted/50 border border-border">
        {tabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2 text-sm">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

### 5. Page Layout (estándar)

```tsx
interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
```

### 6. Card Grid con Loading

```tsx
import { Skeleton } from '@/components/ui/skeleton';

interface CardGridProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  renderCard: (item: T) => React.ReactNode;
  cols?: 2 | 3 | 4;
  skeletonCount?: number;
  emptyState?: React.ReactNode;
}

export function CardGrid<T extends { id: string }>({
  data, isLoading, renderCard, cols = 3, skeletonCount = 6, emptyState,
}: CardGridProps<T>) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={`grid ${gridCols[cols]} gap-4`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return emptyState ?? null;
  }

  return (
    <div className={`grid ${gridCols[cols]} gap-4`}>
      {data.map(item => (
        <div key={item.id}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
```

## Cuándo usar cada patrón

| Necesidad | Patrón |
|-----------|--------|
| Acciones sobre un item | DropdownMenu (#1) |
| Lista de datos con sort/filter | DataTable (#2) |
| Sección colapsable en sidebar | SidebarSection (#3) |
| Navegación entre vistas | TabLayout (#4) |
| Estructura de página | PageLayout (#5) |
| Grid de tarjetas | CardGrid (#6) |
