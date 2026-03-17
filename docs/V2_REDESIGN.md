# Kiyoko AI v2.0 — Rediseño Profesional

## Referencia Visual
Inspiración: Supabase Dashboard — paneles redimensionables, diseño limpio, dark/light mode profesional, chat accesible globalmente.

---

## 1. SISTEMA DE DISEÑO

### 1.1 Migración a shadcn/ui
- Reemplazar TODOS los componentes UI custom por shadcn/ui
- Estructura: `src/components/ui/` con shadcn components
- Beneficios: consistencia, accesibilidad, dark mode nativo, profesional

### 1.2 Nuevo esquema de colores (minimalista)
```css
/* Colores principales — NO naranja, más neutro y profesional */
--color-primary: #3ECF8E;      /* Verde Supabase-like (o elegir) */
--color-primary-foreground: #FFFFFF;
--color-secondary: #6366F1;    /* Índigo para acentos */

/* Surfaces */
--color-background: #FFFFFF;    /* Light */
--color-background-dark: #1C1C1C; /* Dark */
--color-card: #F8F9FA;
--color-card-dark: #232323;
--color-border: #E5E7EB;
--color-border-dark: #2E2E2E;

/* Text */
--color-foreground: #111827;
--color-muted: #6B7280;
```

### 1.3 Tipografía
- Font: Inter (ya instalada)
- Mono: JetBrains Mono (prompts)
- Tamaños consistentes con shadcn defaults

---

## 2. LAYOUT GLOBAL

### 2.1 Paneles redimensionables
- Sidebar izquierdo: redimensionable (200px-400px), colapsable
- Contenido central: flex grow
- Panel derecho (chat/inspector): redimensionable (0px-600px), colapsable
- Usar `react-resizable-panels` para los splits
- Persistir tamaños en localStorage

### 2.2 Chat Global (como SQL Editor de Supabase)
- Panel inferior o lateral derecho accesible desde CUALQUIER página
- Icono de chat en la barra superior (siempre visible)
- Click → abre panel de chat redimensionable
- Expandir → chat a pantalla completa
- El chat tiene contexto del proyecto activo
- Puede señalar escenas específicas: "@E4A mejorar iluminación"
- Historial de conversaciones guardado en DB
- Minimizable a una barra inferior

### 2.3 Header profesional
- Logo + Breadcrumbs
- Centro: barra de búsqueda global (Cmd+K)
- Derecha: AI provider pill, notificaciones, tema, avatar
- Glassmorphism sutil

### 2.4 Sidebar izquierdo
- Logo compacto
- Navegación principal con iconos + texto
- Proyectos recientes (colapsable)
- Sección admin (condicional)
- Redimensionable arrastrando el borde derecho

---

## 3. STORYBOARD v2

### 3.1 Fixes visuales
- ELIMINAR borde rojo izquierdo (usar indicador más sutil)
- ELIMINAR labels duplicados "PROMPT IMAGEN"
- Fix duración que tapa botón editar
- Diseño más limpio con más espacio blanco

### 3.2 Scene cards rediseñadas
```
┌─ #1 N1 · Cold open tijeras ──── Nueva │ Gancho │ 3s ─┐
│                                                        │
│ [Imagen 16:9]        DESCRIPCIÓN                       │
│                      Apertura en frío: primer plano... │
│                                                        │
│                      👥 Sin personajes  ＋ Añadir      │
│                      🏠 Sin fondo  ＋ Añadir           │
│                      🎥 extreme_close_up · static      │
│                      💡 dramatic side lighting          │
│                      🔇 Silente                         │
│                                                        │
│ ┌─ PROMPT IMAGEN ────────── [Copiar] [✨ IA] [✏️] ──┐ │
│ │ Pixar Studios 3D animated render, extreme...       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌─ PROMPT VÍDEO ─────────── [Copiar] [✨ IA] [✏️] ──┐ │
│ │ SILENT SCENE. Extreme close-up...                  │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 3.3 Indicador de estado del prompt
- Si el estilo del proyecto cambia y el prompt no se ha actualizado:
  - Badge "⚠️ Desactualizado" junto al prompt
  - Botón "Actualizar al estilo actual"
- Tracking: guardar `style_version` en cada escena

---

## 4. HISTORIAL Y VERSIONES

### 4.1 Nueva tabla: `change_history`
```sql
CREATE TABLE public.change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  entity_type TEXT NOT NULL,  -- 'scene' | 'character' | 'background' | 'project'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,        -- 'create' | 'update' | 'delete'
  field_name TEXT,             -- campo específico modificado
  old_value TEXT,              -- valor anterior (JSON serialized)
  new_value TEXT,              -- valor nuevo
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 UI de historial
- Panel/pestaña "Historial" en cada proyecto
- Timeline de cambios con: quién, qué, cuándo
- Botón "Restaurar" en cada entrada
- Filtrar por tipo de entidad

---

## 5. CONFIGURACIÓN DEL PROYECTO

### 5.1 Settings del proyecto mejorados
- **General**: título, cliente, descripción, tags
- **Estilo visual**: selector con preview (Pixar, Realista, etc.)
  - Al cambiar, marcar TODOS los prompts como "desactualizado"
  - Opción: "Actualizar todos los prompts al nuevo estilo"
- **Audio global**: configuración por defecto para nuevas escenas
  - Silente / Ambiente / Música / Diálogos / Voz en off
- **Plataforma**: YouTube, Instagram, TikTok + aspect ratios
- **Generadores**: qué IA usar para texto, imágenes
- **Colores del proyecto**: paleta editable (para exports)
- **Exportación**: configuración por defecto

---

## 6. COMPONENTES (shadcn/ui)

### Migrar de custom a shadcn:
- Button, Input, Textarea, Select → shadcn
- Dialog, AlertDialog, Sheet → shadcn
- Tabs, Dropdown, Tooltip → shadcn
- Badge, Avatar, Skeleton → shadcn
- Switch, Slider, Progress → shadcn
- Separator, ScrollArea → shadcn
- Command (Cmd+K search) → shadcn
- Resizable panels → shadcn
- Toast → sonner (ya instalado)

### Mantener custom:
- PromptBlock (code block + copy)
- SceneCard (storyboard específico)
- CopyButton (ya funcional)
- ImageUpload/Preview

### Estructura de carpetas:
```
src/components/
├── ui/                    # shadcn components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/                # Layout components
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── chat-panel.tsx     # NEW: chat global
├── project/               # Project-specific
├── storyboard/            # NEW: storyboard components
│   ├── scene-card.tsx
│   ├── scene-editor.tsx
│   ├── prompt-block.tsx
│   ├── ai-sidebar.tsx
│   └── insert-scene.tsx
└── shared/                # Shared utilities
    ├── resizable-layout.tsx
    ├── command-menu.tsx    # Cmd+K
    └── history-panel.tsx
```

---

## 7. BASE DE DATOS — Cambios

### Nuevas tablas:
- `change_history` — historial de cambios
- `chat_sessions` — sesiones de chat (reemplaza ai_conversations simplificado)

### Modificar tablas existentes:
- `scenes` → añadir `style_version TEXT` para tracking de estilo
- `projects` → añadir `style_version INTEGER DEFAULT 1` (incrementa al cambiar estilo)

---

## 8. ORDEN DE IMPLEMENTACIÓN

### Fase 1: Base (shadcn + layout)
1. Instalar shadcn/ui
2. Configurar tema (colores nuevos, dark/light)
3. Generar componentes shadcn base
4. Crear layout con paneles redimensionables
5. Chat global panel

### Fase 2: Storyboard v2
6. Rediseñar scene cards (sin borde rojo, sin duplicados)
7. Editor inline mejorado
8. Indicador "prompt desactualizado"
9. Inserción de escenas mejorada

### Fase 3: Historial + Config
10. Tabla change_history
11. UI de historial
12. Settings del proyecto mejorados
13. Tracking de estilo version

### Fase 4: Polish
14. Cmd+K búsqueda global
15. Responsive final
16. Animaciones suaves
17. Loading states con skeletons shadcn

---

## 9. COLORES PROPUESTOS (elegir)

### Opción A: Verde profesional (estilo Supabase)
- Primary: #3ECF8E (verde)
- Accent: #6366F1 (índigo)

### Opción B: Azul moderno
- Primary: #3B82F6 (azul)
- Accent: #8B5CF6 (violeta)

### Opción C: Neutral elegante
- Primary: #8B5CF6 (violeta)
- Accent: #EC4899 (rosa)

### Opción D: Turquesa minimal
- Primary: #06B6D4 (cyan)
- Accent: #3B82F6 (azul)

**Nota**: Los colores se definen en CSS variables para cambiarlos fácilmente en toda la app.
