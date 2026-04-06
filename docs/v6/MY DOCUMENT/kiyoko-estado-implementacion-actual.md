# Kiyoko AI — Estado de Implementacion y Siguiente Sesion

> Documento de seguimiento: que se ha hecho, que queda pendiente, y por donde continuar.
>
> Ultima actualizacion: 2026-03-30 | Build: LIMPIO (0 errores)

---

## Resumen rapido

```
Sesion completada:
  ✅ Persistencia unificada (tema, provider, org)
  ✅ DashboardBootstrap (modal de carga al entrar)
  ✅ 5 hooks TanStack Query nuevos (characters, scenes, backgrounds, tasks, videos)
  ✅ i18n con next-intl (ES + EN, 270+ strings)
  ✅ Radix UI eliminado (16 paquetes)
  ✅ shadcn wrappers reducidos (35 → 18)
  ✅ Build limpio

Pendiente para manana:
  🔲 Migrar 21 hooks restantes de useState+setLoading a useQuery
  🔲 Traducir paginas principales (dashboard, project overview, scenes)
  🔲 Implementar AiAssistBar + AiResultDrawer (IA contextual)
  🔲 Integrar Stack B (Qwen + Gemini + Voxtral)
  🔲 Limpiar stores obsoletos (useAiChatStore, useActiveVideoStore)
```

---

## 1. Lo que se IMPLEMENTO

### 1.1 Persistencia y Estado Global

| Cambio | Archivos | Estado |
|---|---|---|
| Tema unificado: una sola fuente `kiyoko-theme` | useUIStore.ts, Header.tsx, ThemeToggle.tsx, layout.tsx | ✅ |
| Provider preferido unificado (eliminado duplicado) | ChatInput.tsx, useKiyokoChat.ts | ✅ |
| useOrgStore eliminado (era alias deprecado) | stores/useOrgStore.ts | ✅ ELIMINADO |
| useProjectStore eliminado (redundante con Query) | stores/useProjectStore.ts | ✅ ELIMINADO |
| useProject.ts eliminado (anti-patron useState) | hooks/useProject.ts | ✅ ELIMINADO |

### 1.2 DashboardBootstrap Provider

| Archivo | Funcion |
|---|---|
| `src/providers/DashboardBootstrap.tsx` | Carga user + orgs con useQuery, muestra modal loading, expone `useDashboard()` |
| `src/app/(dashboard)/layout.tsx` | Envuelto con `<DashboardBootstrap>` |
| `src/components/layout/Header.tsx` | Usa `useDashboard()` en vez de fetch propio |
| `src/components/layout/sidebar/SidebarHeader.tsx` | Usa `useDashboard()` en vez de useAuth+useOrganizations separados |

### 1.3 Hooks TanStack Query Nuevos

| Hook | Archivo | Exports |
|---|---|---|
| useCharacters | `src/hooks/useCharacters.ts` | useCharacters, useCharacter, useCreateCharacter, useUpdateCharacter, useDeleteCharacter |
| useScenes | `src/hooks/useScenes.ts` | useScenes, useScene, useCreateScene, useUpdateScene, useDeleteScene, useReorderScenes |
| useBackgrounds | `src/hooks/useBackgrounds.ts` | useBackgrounds, useCreateBackground, useUpdateBackground, useDeleteBackground |
| useTasks | `src/hooks/useTasks.ts` | useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask |
| useVideos (migrado) | `src/hooks/useVideos.ts` | useVideos, useCreateVideo, useUpdateVideo, useDeleteVideo |
| useRealtimeProject (migrado) | `src/hooks/useRealtimeProject.ts` | Ahora invalida queries en vez de manipular store |

### 1.4 i18n con next-intl

| Archivo | Funcion |
|---|---|
| `src/i18n/config.ts` | Locales: es, en. Default: es |
| `src/i18n/request.ts` | Lee cookie NEXT_LOCALE, carga messages |
| `next.config.ts` | Plugin withNextIntl configurado |
| `src/app/layout.tsx` | NextIntlClientProvider envuelve la app |
| `messages/es.json` | 270+ strings en espanol |
| `messages/en.json` | 270+ strings en ingles |
| `src/hooks/useLocale.ts` | Hook useChangeLocale() para cambiar idioma via cookie |

**Componentes traducidos:**
- Header.tsx (buscar, feedback, tema, perfil, api keys, admin, cerrar sesion)
- SidebarNavFixed.tsx (buscar, inicio, tareas)
- SidebarProjectNav.tsx (vista general, tareas, publicaciones, videos, recursos, personajes, fondos, estilos, ajustes, IA)
- SidebarHeader.tsx (ajustes, invitar, anadir org, descargar, cerrar sesion)
- SidebarProjects.tsx (proyectos, sin proyectos, nuevo proyecto)
- DashboardBootstrap.tsx (cargando perfil, cargando org, preparando workspace)
- PreferenciasSection.tsx (selector de idioma FUNCIONAL con cookie)

### 1.5 Eliminacion de shadcn y Radix UI

**Paquetes Radix eliminados (16):**
```
@radix-ui/react-alert-dialog, react-avatar, react-checkbox,
react-dialog, react-dropdown-menu, react-label, react-popover,
react-progress, react-scroll-area, react-select, react-separator,
react-slider, react-slot, react-switch, react-tabs, react-tooltip
```

**Wrappers UI eliminados (17 archivos):**
```
alert-dialog, badge, chip, chat-bubble, chat-input, chat-panel,
collapsible, dialog, kiyoko-button, multi-select, progress,
PromptBlock, select, spinner, StatusBadge, switch, tag-input
```

**Migrados de Radix a nativo:**
- dropdown-menu.tsx → implementacion propia con React state + portal
- SearchModal.tsx → de @radix-ui/react-dialog a createPortal nativo

**ComponentsShowcase.tsx eliminado** (pagina de demo, solo usaba componentes borrados)

### 1.6 Fixes de tipos HeroUI v3

| Archivo | Fix |
|---|---|
| `src/types/heroui-overrides.d.ts` | Extensiones de 12+ interfaces de HeroUI + react-aria-components |
| `src/components/ui/button.tsx` | isDisabled alias, tamano "icon", icon size class |
| `src/components/ui/switch.tsx` | Ref type: HTMLInputElement → HTMLLabelElement |
| `src/components/ui/progress.tsx` | Color mapping primary/secondary → accent |
| `src/components/ui/slider.tsx` | Agregado formatValue prop |
| 3 pages | DropdownItem startContent/color/endContent → children inline |

---

## 2. Lo que queda PENDIENTE

### 2.1 ALTA prioridad — Hooks con anti-patron (21 archivos)

Estos hooks usan `useState + useEffect + setLoading` en vez de `useQuery`:

```
src/hooks/useAdmin.ts
src/hooks/useAiAgent.ts
src/hooks/useAiProvider.ts
src/hooks/useAiSettings.ts
src/hooks/useAiUsage.ts
src/hooks/useAnnotations.ts
src/hooks/useApiKeys.ts
src/hooks/useAuth.ts              ← especial (auth, no data fetching normal)
src/hooks/usePromptTemplates.ts
src/hooks/usePublications.ts
src/hooks/useSceneCamera.ts
src/hooks/useSceneMedia.ts
src/hooks/useScenePrompts.ts
src/hooks/useSceneShares.ts
src/hooks/useSceneVideoClips.ts
src/hooks/useSocialProfiles.ts
src/hooks/useStylePresets.ts
src/hooks/useTimeEntries.ts
src/hooks/useVideoAnalysis.ts
src/hooks/useVideoNarration.ts
```

**Patron a aplicar en cada uno:**
```typescript
// ANTES (anti-patron):
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { fetch().then(setData).finally(() => setLoading(false)); }, []);

// DESPUES (correcto):
const { data, isLoading } = useQuery({
  queryKey: queryKeys.dominio.byEntity(entityId),
  queryFn: () => fetchFromSupabase(supabase, entityId),
  enabled: !!entityId,
});
```

**Nota:** `useAuth.ts` es especial — maneja auth state changes, no data fetching normal. Se puede dejar como esta o convertir a un contexto como ya hicimos con DashboardBootstrap.

### 2.2 ALTA prioridad — Traducir paginas principales

Las paginas tienen strings hardcoded en espanol. Las mas criticas:

```
src/app/(dashboard)/dashboard/page.tsx          ← "Buenos dias", stats labels, filtros
src/app/(dashboard)/project/[shortId]/page.tsx   ← overview del proyecto
src/app/(dashboard)/project/[shortId]/videos/page.tsx
src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx
src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx
src/app/(dashboard)/project/[shortId]/tasks/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scenes/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/narration/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/analysis/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/export/page.tsx
```

**Patron:** Agregar `const t = useTranslations()` y reemplazar strings hardcoded por `t('key')`.

### 2.3 MEDIA prioridad — IA contextual (componentes nuevos)

Segun el documento `kiyoko-diseno-paginas-ia.md`, faltan estos componentes:

```
src/components/ai/AiAssistBar.tsx        ← Barra de asistencia contextual por pagina
src/components/ai/AiResultDrawer.tsx     ← Drawer de resultados IA (form, text, suggestions, plan)
src/components/ai/AiFieldAssist.tsx      ← Boton [✦] junto a campos de formulario
src/components/ai/AiActionPanel.tsx      ← Panel lateral sticky (detalle de escena)
src/components/ai/AiInlineToolbar.tsx    ← Toolbar flotante (editor de guion)
```

**Estos dependen de:**
- Stack B integrado (Qwen + Gemini + Voxtral)
- Endpoints API nuevos

### 2.4 MEDIA prioridad — Integrar Stack B

Segun `guia-director-creativo-stackB.md`, faltan estos endpoints:

```
/api/ai/generate-storyboard    → Qwen Flash: genera proyecto/escenas desde brief
/api/ai/analyze-scenes          → Gemini Flash: analiza imagenes subidas
/api/ai/insert-scenes           → Qwen Plus: inserta escenas entre existentes
/api/ai/get-advice              → Qwen Plus: analisis y consejos creativos
/api/ai/edit-scene              → Qwen Flash: edita/regenera 1 escena
/api/ai/generate-script         → Qwen Flash: genera guion de narracion
```

**Variables de entorno necesarias:**
```env
GEMINI_API_KEY=...        # Google AI Studio (vision)
OPENROUTER_API_KEY=...    # Qwen via OpenRouter (cerebro)
MISTRAL_API_KEY=...       # Voxtral TTS (voz)
```

### 2.5 BAJA prioridad — Limpieza de stores

| Store | Accion | Razon |
|---|---|---|
| useAiChatStore | Eliminar cuando se elimine el chat global | Se reemplaza por IA contextual |
| useActiveVideoStore | Evaluar si es necesario | Podria ser un simple useQuery |
| ai-store | Simplificar cuando se elimine KiyokoPanel | Solo necesita preferencias de IA |

### 2.6 BAJA prioridad — Optimistic updates

Agregar optimistic updates a las mutaciones mas usadas:
- Toggle favorito (parcialmente hecho)
- Cambio de status en escena (draft → approved)
- Reordenar escenas (drag & drop)
- Mover tareas entre columnas kanban
- Eliminar items (hide inmediato, rollback si error)

### 2.7 BAJA prioridad — Migrar sidebar.tsx de base-ui

El sidebar.tsx aun depende de:
- `@base-ui/react` (merge-props, use-render, collapsible)
- Stubs locales de sheet, skeleton, tooltip

Migrarlo completamente a HeroUI requerira reescribir el compound component (Sidebar, SidebarMenu, SidebarMenuItem, etc.)

---

## 3. Archivos de referencia

| Documento | Contenido |
|---|---|
| `docs/v6/MY DOCUMENT/kiyoko-ia-contextual-por-pagina.md` | Analisis pagina x pagina de como la IA puede ayudar, con modelos y endpoints |
| `docs/v6/MY DOCUMENT/kiyoko-diseno-paginas-ia.md` | Diseno visual por pagina con AiAssistBar, drawers, wireframes ASCII |
| `docs/v6/MY DOCUMENT/guia-director-creativo-stackB.md` | Stack B completo: Gemini + Qwen + Voxtral, codigo, costes |
| `docs/v6/MY DOCUMENT/kiyoko-persistencia-providers-estado.md` | Auditoria de persistencia, providers, estado global, plan de correccion |
| `docs/v6/MY DOCUMENT/kiyoko-motor-escenas-spec.md` | Spec del motor de escenas (19 tablas, prompt composition) |
| `docs/v6/MY DOCUMENT/kiyoko-v8-especificacion-completa.md` | Spec V8: tablas, componentes, flujos |
| `docs/v6/MY DOCUMENT/kiyoko-implementacion-completa.md` | Arquitectura general de paginas |

---

## 4. Estado de archivos clave

### src/components/ui/ (18 archivos — de 35 originales)

```
✅ button.tsx         → HeroUI wrapper con variantes custom (30 imports)
✅ sidebar.tsx         → Custom base-ui (12 imports)
✅ dropdown-menu.tsx   → Nativo sin Radix (9 imports)
✅ popover.tsx         → HeroUI wrapper (8 imports)
✅ logo.tsx            → Custom SVG (7 imports)
✅ input.tsx           → Custom CVA (4 imports)
✅ separator.tsx       → HeroUI Divider (3 imports)
✅ tabs.tsx            → HeroUI wrapper (2 imports)
✅ slider.tsx          → HeroUI wrapper (2 imports)
✅ toast.tsx           → Sonner wrapper (2 imports)
✅ kiyoko-select.tsx   → Custom select (2 imports)
⚪ skeleton.tsx        → Minimal stub para sidebar (1 import)
⚪ tooltip.tsx         → Stubs para sidebar (1 import)
⚪ sheet.tsx           → Stub para sidebar mobile (1 import)
⚪ textarea.tsx        → HeroUI wrapper (1 import)
⚪ avatar.tsx          → HeroUI wrapper (1 import)
⚪ input-group.tsx     → Custom (1 import)
⚪ CopyButton.tsx      → Custom (1 import)
```

### src/stores/ (5 archivos — de 7 originales)

```
✅ useUIStore.ts         → Tema, sidebar, org, chat, modals (PRINCIPAL)
✅ ai-store.ts           → Panel IA, modo, ancho, agente activo
⚪ useAiChatStore.ts     → Mensajes chat (ELIMINAR con chat global)
⚪ useAiProviderStore.ts → Providers activos (transient)
⚪ useActiveVideoStore.ts → Video activo (EVALUAR)
```

### src/hooks/ — Nuevos vs Anti-patron

```
✅ NUEVO: useCharacters.ts    (useQuery + mutations)
✅ NUEVO: useScenes.ts         (useQuery + mutations)
✅ NUEVO: useBackgrounds.ts    (useQuery + mutations)
✅ NUEVO: useTasks.ts          (useQuery + mutations)
✅ MIGRADO: useVideos.ts       (useQuery + mutations)
✅ MIGRADO: useRealtimeProject.ts (invalida queries)
✅ NUEVO: useLocale.ts         (cambiar idioma)

🔲 ANTI-PATRON: 21 hooks con useState+setLoading (ver seccion 2.1)
```

### Paquetes

```
✅ next-intl            → Instalado y configurado
✅ @radix-ui/*          → 16 paquetes ELIMINADOS
✅ Build limpio         → 0 errores de tipo
```

---

## 5. Plan sugerido para manana

### Bloque 1 (1-2h): Migrar hooks restantes
Tomar los 21 hooks con anti-patron y migrarlos a useQuery. Son mecanicos — mismo patron repetido.

### Bloque 2 (1h): Traducir paginas principales
Dashboard page y project overview son las mas visibles. Agregar `useTranslations()` y reemplazar strings.

### Bloque 3 (2-3h): Componentes IA contextuales
Crear AiAssistBar y AiResultDrawer. Integrarlos en la pagina de escenas como prueba piloto.

### Bloque 4 (1-2h): Stack B endpoints
Crear los clientes de Qwen (OpenRouter), Gemini (vision) y Voxtral (TTS). Crear al menos `/api/ai/generate-storyboard`.

### Bloque 5 (30min): Limpieza final
Eliminar useAiChatStore si ya no se usa. Evaluar useActiveVideoStore.

---

## 6. Comandos utiles

```bash
# Build
npx next build

# Dev
npm run dev

# Verificar errores de tipo
npx tsc --noEmit

# Buscar anti-patrones
grep -rn "setLoading" src/hooks/ --include="*.ts"

# Buscar strings sin traducir
grep -rn "\"[A-Z][a-z].*\"" src/components/layout/ --include="*.tsx" | grep -v "import\|from\|className"

# Buscar imports de Radix (deberia ser 0)
grep -r "@radix-ui" src/ --include="*.tsx"

# Contar traducciones
cat messages/es.json | grep -c ":"
```
