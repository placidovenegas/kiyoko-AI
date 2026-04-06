# Kiyoko AI — Persistencia, Providers y Estado Global

> Auditoria completa del estado de la aplicacion: TanStack Query, Zustand stores,
> autenticacion, organizaciones, tema, idioma, modales, y todo lo que debe
> persistir para que la experiencia del usuario sea perfecta.
>
> Fecha: 2026-03-30 | Version: 1.0

---

## Indice

1. [Resumen ejecutivo: Que funciona y que no](#1-resumen-ejecutivo)
2. [TanStack Query — Estado actual](#2-tanstack-query-estado-actual)
3. [Hooks existentes vs hooks faltantes](#3-hooks-existentes-vs-faltantes)
4. [Anti-patrones encontrados y como corregirlos](#4-anti-patrones-y-correcciones)
5. [Zustand Stores — Auditoria completa](#5-zustand-stores)
6. [localStorage — Claves duplicadas y conflictos](#6-localstorage-conflictos)
7. [Autenticacion y flujo de login](#7-autenticacion)
8. [Organizaciones — Persistencia y switch](#8-organizaciones)
9. [Tema (dark/light) — Unificar fuentes](#9-tema)
10. [Idioma (i18n) — Estado y plan](#10-idioma)
11. [Settings Modal — Persistencia](#11-settings-modal)
12. [Preferencias del usuario — DB vs localStorage](#12-preferencias)
13. [Providers necesarios en el arbol de componentes](#13-providers)
14. [Plan de correccion por prioridad](#14-plan-de-correccion)

---

## 1. Resumen ejecutivo

### Lo que funciona bien

| Area | Estado | Nota |
|------|--------|------|
| TanStack Query client | OK | staleTime 60s, gcTime 24h, retry 1, persist a localStorage |
| Query keys organizados | OK | 18 dominios en `keys.ts` |
| DevTools integrados | OK | Bottom-left, cerrado por defecto |
| Persistencia cache queries | OK | localStorage key `kiyoko-query-cache`, TTL 24h |
| Middleware de auth | OK | JWT validation, role-based routing |
| Organizacion persiste | OK | `currentOrgId` en Zustand + localStorage |
| Cookie consent | OK | localStorage `kiyoko-cookies` |
| Error boundaries | OK | En todas las rutas principales |

### Lo que tiene problemas

| Area | Problema | Severidad |
|------|----------|-----------|
| Tema (dark/light) | **Guardado en 2 sitios distintos** (`kiyoko-ui` y `kiyoko-theme`) | CRITICO |
| Provider preferido | **Guardado en 2 sitios distintos** (`kiyoko-ui` y `kiyoko-preferred-provider`) | ALTO |
| useProject.ts | **Anti-patron**: useState + useEffect en vez de useQuery | ALTO |
| useVideos.ts | **Anti-patron**: useState + useCallback manual | ALTO |
| Hooks faltantes | No existen useCharacters, useScenes, useBackgrounds, useTasks standalone | ALTO |
| 44 pages con supabase directo | Pages hacen queries inline en vez de usar hooks | MEDIO |
| Idioma (i18n) | **No existe**. Todo hardcoded en espanol. Selector de idioma no funcional | MEDIO |
| Settings modal | Estado (open/section) no persiste en navegacion | BAJO |
| Optimistic updates | Casi ninguna mutacion tiene optimistic updates | BAJO |
| Notificaciones | Toggles no se guardan en DB | BAJO |

---

## 2. TanStack Query — Estado actual

### Configuracion del QueryClient

```
Archivo: src/lib/query/client.ts

defaultOptions:
  queries:
    staleTime:         60_000    (1 minuto — dato "fresco")
    gcTime:            86_400_000 (24 horas — retiene cache)
    retry:             1         (1 reintento)
    refetchOnWindowFocus: true
    refetchOnReconnect:  true

  mutations:
    retry:             0         (sin reintentos)
```

### Provider

```
Archivo: src/lib/query/provider.tsx

- Envuelve toda la app en src/app/layout.tsx (raiz)
- Persistencia: createSyncStoragePersister
  - Key: 'kiyoko-query-cache'
  - TTL: 24 horas
  - Buster: 'v1' (para invalidar cache entre versiones)
- ReactQueryDevtools incluido (bottom-left)
```

### Stats de uso

```
useQuery:     115 ocurrencias en 51 archivos
useMutation:   89 ocurrencias en 35 archivos
onError/onSuccess/onSettled: 108 ocurrencias en 46 archivos
```

### Stale times personalizados

| Hook | staleTime | Razon |
|------|-----------|-------|
| Default (todos) | 60s | Balance entre frescura y rendimiento |
| useAiConversations | 30s | Lista de chats cambia frecuentemente |
| useAiConversation | 10s | Mensajes en tiempo real |

### Lo que falta en Query

| Feature | Estado | Impacto |
|---------|--------|---------|
| Prefetching en hover/navegacion | NO implementado | UX: carga percibida mas lenta |
| QueryErrorResetBoundary | NO implementado | UX: recuperacion de errores |
| Optimistic updates | Minimo (solo favorites) | UX: mutaciones parecen lentas |
| Query cancellation | NO implementado | Rendimiento: queries huerfanas |

---

## 3. Hooks existentes vs faltantes

### Hooks que EXISTEN y funcionan bien

| Hook | Patron | Queries | Mutaciones |
|------|--------|---------|------------|
| useOrganizations | useQuery + useMutation | orgs, members | create, switch |
| useProjectQuery | useQuery (3 nested) | project, videos, resources | — |
| useVideoQuery | useQuery (3 nested) | video+scenes, analysis, narration | — |
| useAiConversations | useQuery | conversations list, detail | delete, rename |
| useFavorites | useQuery + useMutation | favorites list | add, remove |
| usePublications | useQuery + useMutation | publications list | create |
| useSocialProfiles | useQuery + useMutation | profiles list | create, delete |
| useTimeEntries | useQuery + useMutation | entries list | create, stop |
| useStylePresets | useQuery | presets list | — |
| usePromptTemplates | useQuery | templates list | — |
| useAiSettings | useQuery + useMutation | settings | update |
| useAiAgent | useQuery + useMutation | agent config | update |
| useSceneShares | useQuery + useMutation | shares list | create, delete |
| useAnnotations | useQuery + useMutation | annotations | create |
| useSceneCamera | useQuery + useMutation | camera config | update |
| useSceneMedia | useQuery | media list | — |
| useScenePrompts | useQuery | prompts list | — |
| useSceneVideoClips | useQuery | clips list | — |
| useVideoAnalysis | useQuery | analysis data | — |
| useVideoNarration | useQuery + useMutation | narration | update |
| useApiKeys | useQuery + useMutation | keys list | create, delete |
| useAdmin | useQuery + useMutation | users list | update role |

### Hooks con ANTI-PATRON (migrar a useQuery)

| Hook | Problema | Correccion |
|------|----------|------------|
| **useProject.ts** | useState + useEffect + setLoading + setError | Reescribir con useQuery. Ya existe useProjectQuery — posible duplicado |
| **useVideos.ts** | useState + useCallback + setLoading | Reescribir con useQuery. Ya existe useVideoQuery — posible duplicado |

### Hooks que FALTAN (crear)

| Hook necesario | Donde se usa | Que debe hacer |
|---|---|---|
| **useCharacters** | Characters page, scene detail, modals | `useQuery(queryKeys.characters.byProject(projectId))` + create/update/delete mutations |
| **useScenes** | Scenes page, video overview, storyboard | `useQuery(queryKeys.scenes.byVideo(videoId))` + create/update/delete/reorder mutations |
| **useBackgrounds** | Backgrounds page, scene detail, modals | `useQuery(queryKeys.backgrounds.byProject(projectId))` + create/update/delete mutations |
| **useTasks** | Tasks page | `useQuery(queryKeys.tasks.byProject(projectId))` + create/update/complete/delete mutations |
| **useNarrativeArcs** | Timeline, video overview, storyboard | `useQuery` para arcos narrativos + create/update |
| **useCreateVideo** | Video list, project overview | useMutation con invalidacion de videos.byProject |
| **useCreateScene** | Scenes page, AI generation | useMutation con invalidacion de scenes.byVideo |
| **useCreateCharacter** | Characters page, AI generation | useMutation con invalidacion de characters.byProject |
| **useCreateBackground** | Backgrounds page, AI generation | useMutation con invalidacion de backgrounds.byProject |
| **useCreateTask** | Tasks page, AI generation | useMutation con invalidacion de tasks.byProject |

### Estructura de cada hook nuevo (plantilla)

```typescript
// src/hooks/useCharacters.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Character = Database['public']['Tables']['characters']['Row'];
type CharacterInsert = Database['public']['Tables']['characters']['Insert'];

// ═══ QUERY ═══
export function useCharacters(projectId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.characters.byProject(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*, character_images(*)')
        .eq('project_id', projectId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// ═══ MUTATIONS ═══
export function useCreateCharacter(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CharacterInsert) => {
      const { data: character, error } = await supabase
        .from('characters')
        .insert({ ...data, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return character;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.characters.byProject(projectId),
      });
    },
  });
}

export function useUpdateCharacter(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Character> & { id: string }) => {
      const { error } = await supabase
        .from('characters')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.characters.byProject(projectId),
      });
    },
  });
}

export function useDeleteCharacter(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (characterId: string) => {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.characters.byProject(projectId),
      });
    },
  });
}
```

---

## 4. Anti-patrones y correcciones

### 4.1 Pages con Supabase directo (44 archivos)

**Problema:** Los page.tsx hacen queries directamente con `createClient()` + `supabase.from()` en vez de usar hooks dedicados.

**Ejemplo actual (MAL):**
```typescript
// page.tsx
const supabase = createClient();
const { data: characters } = useQuery({
  queryKey: ['characters', projectId],
  queryFn: async () => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId);
    return data;
  },
});
```

**Correccion (BIEN):**
```typescript
// page.tsx
const { data: characters, isLoading } = useCharacters(projectId);
```

**Archivos principales a migrar:**

| Archivo | Queries inline | Hook a usar |
|---|---|---|
| dashboard/page.tsx | projects, tasks, activity, ai_usage | useProjects, useTasks |
| project/[shortId]/page.tsx | videos, characters, backgrounds, activity | useProjectQuery (ya existe) |
| project/[shortId]/videos/page.tsx | videos | useVideos (migrar) |
| .../scenes/page.tsx | scenes | useScenes (crear) |
| .../storyboard/page.tsx | scenes + prompts + characters + backgrounds | useScenes + useCharacters |
| .../characters/page.tsx | characters + scene_characters | useCharacters (crear) |
| .../backgrounds/page.tsx | backgrounds + scene_backgrounds | useBackgrounds (crear) |
| .../tasks/page.tsx | tasks | useTasks (crear) |
| .../publications/page.tsx | publications | usePublications |
| .../narration/page.tsx | narrations | useVideoNarration |
| .../analysis/page.tsx | analysis | useVideoAnalysis |
| .../export/page.tsx | scenes + prompts + media | useScenes |

### 4.2 useState + useEffect para datos del servidor

**Archivos con anti-patron:**

| Archivo | Problema | Correccion |
|---|---|---|
| src/hooks/useProject.ts | useState + useEffect + setLoading | Eliminar. Usar useProjectQuery que ya existe |
| src/hooks/useVideos.ts | useState + useCallback + setLoading | Eliminar. Crear useVideos con useQuery |
| src/components/narration/VoiceSelector.tsx | fetch + setLoading + useEffect | Crear useVoices() hook con useQuery |
| src/components/settings/modal-settings/SeguridadSection.tsx | fetch + setLoading | Crear useTwoFactor() hook con useMutation |
| src/app/(auth)/login/page.tsx | setLoading manual | OK para auth (no es data fetching) |
| src/app/(auth)/register/page.tsx | setLoading manual | OK para auth (no es data fetching) |

### 4.3 Falta de optimistic updates

**Donde se necesitan:**

```typescript
// Ejemplo: toggle favorite (ya existe parcialmente)
useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (projectId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.projects.all });

    // Snapshot current
    const previous = queryClient.getQueryData(queryKeys.projects.all);

    // Optimistic update
    queryClient.setQueryData(queryKeys.projects.all, (old) =>
      old?.map(p => p.id === projectId
        ? { ...p, is_favorite: !p.is_favorite }
        : p
      )
    );

    return { previous };
  },
  onError: (err, vars, context) => {
    // Rollback
    queryClient.setQueryData(queryKeys.projects.all, context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  },
});
```

**Mutaciones prioritarias para optimistic updates:**
1. Toggle favorite (parcialmente hecho)
2. Update scene status (draft → approved)
3. Reorder scenes (drag & drop)
4. Update task status (kanban)
5. Delete items (hide immediately, rollback on error)

---

## 5. Zustand Stores

### Mapa completo de stores

| Store | localStorage Key | Persiste | Estado |
|---|---|---|---|
| **useUIStore** | `kiyoko-ui` | SI | sidebar, org, theme, views, chat |
| **useAIStore** | `kiyoko-ai-store` | SI | panel mode, width, aiMode |
| **useAiChatStore** | — | NO | messages, streaming (transient) |
| **useAiProviderStore** | — | NO | providers, quotas (transient) |
| **useProjectStore** | — | NO | project data (transient, redundante con Query) |
| **useActiveVideoStore** | — | NO | active video context (transient) |
| **useOrgStore** | — | NO | DEPRECADO: re-exporta useUIStore |

### useUIStore — Detalle de persistencia

```
PERSISTE (en localStorage 'kiyoko-ui'):
  sidebarOpen:          boolean     ← estado del sidebar
  sidebarCollapsed:     boolean     ← sidebar colapsado
  currentOrgId:         string|null ← organizacion activa
  theme:                string      ← ⚠️ CONFLICTO (ver seccion 9)
  scenesView:           string      ← vista de escenas (grid/list/timeline)
  preferredAiProvider:  string      ← ⚠️ CONFLICTO (ver seccion 6)
  chatPanelWidth:       number      ← ancho del chat
  chatPanelOpen:        boolean     ← chat abierto
  chatExpanded:         boolean     ← chat expandido

NO PERSISTE (transient):
  workspaceModalOpen:   boolean     ← correcto, no debe persistir
  settingsModalOpen:    boolean     ← correcto, no debe persistir
  settingsSection:      string      ← correcto, no debe persistir
```

### useAIStore — Detalle de persistencia

```
PERSISTE (en localStorage 'kiyoko-ai-store'):
  isOpen:       boolean     ← panel IA abierto
  mode:         string      ← minimized/sidebar/floating/fullscreen
  sidebarWidth: number      ← ancho (360-5000px, default 520)
  aiMode:       string      ← 'auto' o providerId especifico

NO PERSISTE (transient):
  activeAgent:       string      ← agente activo
  conversationId:    string|null ← conversacion actual
  pendingPlan:       object|null ← plan pendiente de confirmar
  lastImageAnalysis: object|null ← ultimo analisis de imagen
  isCreating:        boolean     ← creando entidad
  creatingLabel:     string|null ← label de creacion
```

### Stores a ELIMINAR o REFACTORIZAR

| Store | Accion | Razon |
|---|---|---|
| **useOrgStore** | ELIMINAR | Deprecado, solo re-exporta useUIStore |
| **useProjectStore** | ELIMINAR | Redundante con useProjectQuery (TanStack Query) |
| **useActiveVideoStore** | EVALUAR | Podria ser un simple hook con useQuery |
| **useAiChatStore** | ELIMINAR (fase 6) | Se elimina con el chat global |
| **useAIStore** | SIMPLIFICAR (fase 6) | Reducir a solo preferencias de IA |

---

## 6. localStorage — Claves duplicadas y conflictos

### Mapa completo de claves localStorage

| Clave | Quien la escribe | Que guarda | Problema |
|---|---|---|---|
| `kiyoko-ui` | Zustand (useUIStore) | sidebar, org, theme, views, chat, provider | — |
| `kiyoko-ai-store` | Zustand (useAIStore) | panel mode, width, aiMode | — |
| `kiyoko-query-cache` | TanStack Query Persister | Cache de queries (24h) | — |
| `kiyoko-theme` | Header.tsx, ThemeToggle.tsx (manual) | `'light'` / `'dark'` / `'system'` | **CONFLICTO con kiyoko-ui.theme** |
| `kiyoko-preferred-provider` | ChatInput.tsx (manual) | Provider ID string | **CONFLICTO con kiyoko-ui.preferredAiProvider** |
| `kiyoko-cookies` | CookieBanner.tsx (manual) | `'accepted'` / `'declined'` | OK (unico) |
| `kiyoko-search-recent` | SearchModal.tsx (manual) | JSON array de items recientes (max 20) | OK (unico) |
| `kiyoko-history-width` | KiyokoChat.tsx (manual) | Ancho del panel de historial | OK (unico) |
| `kiyoko-last-conversation-id` | KiyokoChat.tsx (manual) | ID de ultima conversacion | OK (unico) |

### CONFLICTO 1: Tema (CRITICO)

```
Fuente A: useUIStore → localStorage['kiyoko-ui'].theme
Fuente B: Header.tsx → localStorage['kiyoko-theme']
Fuente C: ThemeToggle.tsx → localStorage['kiyoko-theme']
Fuente D: layout.tsx inline script → lee localStorage['kiyoko-theme']

¿Cual es la fuente de verdad? NO ESTA CLARO.

El script inline del root layout lee 'kiyoko-theme' (para evitar flash).
Pero Zustand guarda en 'kiyoko-ui'.
Si el usuario cambia tema, se actualiza 'kiyoko-theme' pero 'kiyoko-ui'
puede tener un valor diferente.
```

**Solucion:**
1. Hacer que `useUIStore.setTheme()` TAMBIEN escriba en `kiyoko-theme`
2. O mejor: eliminar `kiyoko-theme` manual y hacer que el root layout script lea de `kiyoko-ui`
3. Opcion recomendada: **una sola fuente** → `kiyoko-theme` (por el script inline) y que Zustand la lea/escriba de ahi

### CONFLICTO 2: Provider preferido (ALTO)

```
Fuente A: useUIStore → localStorage['kiyoko-ui'].preferredAiProvider
Fuente B: ChatInput.tsx → localStorage['kiyoko-preferred-provider']

Solucion: Eliminar 'kiyoko-preferred-provider'.
Usar solo useUIStore.preferredAiProvider.
```

---

## 7. Autenticacion

### Flujo de login

```
1. Usuario → /login (email/password o Google OAuth)
2. supabase.auth.signInWithPassword() o signInWithOAuth()
3. OAuth → /auth/callback → intercambia codigo por sesion
4. Verifica profiles.role:
   - 'pending'  → /pending
   - 'blocked'  → /blocked
   - 'admin'/'editor'/'viewer' → /dashboard
```

### Middleware (src/proxy.ts)

```
Rutas publicas (sin auth):
  /login, /register, /forgot-password, /pending, /blocked
  /auth/callback, /terms, /privacy, /docs, /share, /

Rutas protegidas (requieren JWT valido):
  Todo lo demas → redirige a /login si no hay sesion

Rutas admin:
  /admin/* → solo role='admin', sino /dashboard

Rutas auth (ya logueado):
  /login, /register → redirige a /dashboard
```

### Estado actual: CORRECTO

- JWT se valida con `getClaims()` (signature validation)
- Cookies httpOnly para la sesion de Supabase
- Trigger de DB crea profile automaticamente al registrarse
- No hay race conditions conocidas en flujo normal

### Mejora sugerida

```
Agregar componente AuthGuard a nivel de layout (no solo middleware):

function AuthGuard({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  return children;
}
```

---

## 8. Organizaciones

### Flujo de persistencia

```
1. Usuario se loguea
2. useOrganizations() fetches orgs del usuario
3. Verifica si currentOrgId (de Zustand/localStorage) es valido
4. Si valido → usa ese
5. Si invalido → fallback:
   a. Org personal (org_type === 'personal')
   b. Primera org de la lista
6. Auto-actualiza store si cambio
```

### Switch de organizacion

```
1. Usuario click en org en sidebar popover
2. switchOrg(orgId) → setCurrentOrgId(orgId)
3. router.push('/dashboard')
4. Dashboard refetch con nuevo orgId
5. Sidebar se actualiza con proyectos del nuevo org
```

### Estado actual: CORRECTO

- `currentOrgId` persiste en localStorage via Zustand
- Se valida en cada carga contra orgs reales del usuario
- Fallback automatico si org eliminada
- Max 5 orgs por usuario

### Mejora sugerida

Agregar `lastOrgSwitchedAt` para mostrar "Estas en [Org]" tras switch.

---

## 9. Tema (dark/light)

### Estado actual: FRAGMENTADO

Hay **3 sistemas paralelos** que gestionan el tema:

```
Sistema 1: Zustand useUIStore
  - Estado: theme ('light'|'dark'|'system')
  - Persiste en: localStorage['kiyoko-ui'].theme
  - Accion: setTheme() → aplica data-theme al DOM

Sistema 2: Header.tsx (manual)
  - Estado: useState local
  - Persiste en: localStorage['kiyoko-theme']
  - Accion: toggleTheme() → aplica classList.toggle('dark')

Sistema 3: ThemeToggle.tsx (manual)
  - Estado: useState local
  - Persiste en: localStorage['kiyoko-theme']
  - Accion: applyTheme() → aplica classList y data-theme

Sistema 4: Root layout inline script
  - Lee: localStorage['kiyoko-theme']
  - Aplica: classList.add('dark') antes del paint
  - Critico para evitar flash de tema incorrecto
```

### Solucion unificada

```
1. FUENTE UNICA: localStorage['kiyoko-theme']
   (necesario para el inline script del root layout)

2. Zustand useUIStore.theme:
   - Getter: lee de localStorage['kiyoko-theme']
   - Setter: escribe en localStorage['kiyoko-theme'] + aplica al DOM

3. Header.tsx y ThemeToggle.tsx:
   - Solo llaman useUIStore.setTheme()
   - No tocan localStorage directamente

4. Root layout inline script:
   - Sigue leyendo localStorage['kiyoko-theme'] (sin cambios)

Resultado: UNA sola fuente de verdad, sin conflictos.
```

### Implementacion

```typescript
// useUIStore.ts — seccion de tema
setTheme: (theme: 'light' | 'dark' | 'system') => {
  set({ theme });

  // Fuente unica: localStorage['kiyoko-theme']
  if (typeof window !== 'undefined') {
    localStorage.setItem('kiyoko-theme', theme);
  }

  // Aplicar al DOM
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.setAttribute('data-theme', resolved);
},
```

---

## 10. Idioma (i18n)

### Estado actual: NO EXISTE

```
- No hay libreria de i18n (ni next-intl, ni react-i18next, ni i18next)
- No hay archivos de traduccion
- No hay configuracion de locales en next.config.ts
- TODO el texto de la UI esta hardcoded en espanol
- El selector de idioma en PreferenciasSection es puramente visual (no funciona)
- La tabla profiles tiene preferences.language pero no se usa para traducir
```

### Plan para i18n

**Fase 1 — Infraestructura (no bloquea):**
```
1. Instalar next-intl (o react-i18next)
2. Crear carpeta src/messages/
   - es.json (extraer strings actuales)
   - en.json (traducir)
3. Configurar middleware de locale
4. Crear hook useTranslation()
```

**Fase 2 — Migracion gradual:**
```
1. Empezar por las paginas mas usadas (dashboard, project, scenes)
2. Reemplazar strings hardcoded por t('key')
3. Mantener espanol como default
4. El idioma del usuario viene de profiles.preferences.language
```

**Fase 3 — IA multiidioma:**
```
1. El idioma del usuario afecta:
   - Interfaz (next-intl)
   - Respuestas de IA (Qwen Flash recibe idioma en system prompt)
   - Narracion TTS (Voxtral soporta 9 idiomas)
2. Los prompts de imagen/video SIEMPRE en ingles (independiente del idioma UI)
```

### Donde se guarda el idioma

```
Base de datos: profiles.preferences.language ('es'|'en'|'fr'|'pt')
localStorage:  No necesario (se lee de DB al login)
Cookie:        next-intl necesita cookie NEXT_LOCALE para SSR
```

---

## 11. Settings Modal

### Estado actual

```
Componente: src/components/settings/SettingsModal.tsx
Secciones: 9 (perfil, preferencias, notificaciones, seguridad,
           organizaciones, org-general, org-miembros, api-keys, suscripcion)

Estado controlado por:
  useUIStore.settingsModalOpen  (boolean)
  useUIStore.settingsSection    (string, default 'perfil')

Persistencia: NO (estas keys no estan en partialize)
  - Al navegar, el modal se cierra
  - Al recargar, el modal se cierra
  - La seccion se resetea a 'perfil'
```

### Esto es CORRECTO

Los modales no deben persistir entre recargas. Si el usuario navega, el modal se cierra. Esto es comportamiento esperado.

### Mejora opcional

Si el usuario navega a `/settings/api-keys`, el modal deberia abrirse en esa seccion:

```typescript
// src/app/(dashboard)/settings/api-keys/page.tsx
useEffect(() => {
  openSettingsModal('api-keys');
}, []);
```

Esto ya existe para `/settings` → abre en 'perfil'. Verificar que las sub-rutas hagan lo mismo.

---

## 12. Preferencias del usuario — DB vs localStorage

### Mapa de donde se guarda cada preferencia

| Preferencia | DB (profiles) | localStorage | Recomendacion |
|---|---|---|---|
| Tema (dark/light) | `preferences.theme` | `kiyoko-theme` | **localStorage** (para inline script anti-flash). Sync a DB al cambiar. |
| Idioma | `preferences.language` | — | **DB** (necesario para SSR con next-intl) |
| Estilo visual default | `preferences.default_style` | — | **DB** |
| Notificaciones in-app | `preferences.notifications` | — | **DB** |
| Sidebar colapsado | — | `kiyoko-ui` | **localStorage** (solo UI) |
| Vista de escenas | — | `kiyoko-ui` | **localStorage** (solo UI) |
| Org activa | — | `kiyoko-ui` | **localStorage** (validar contra DB) |
| Cookies consent | — | `kiyoko-cookies` | **localStorage** (legal) |
| Busquedas recientes | — | `kiyoko-search-recent` | **localStorage** (solo UX) |
| Provider IA preferido | — | `kiyoko-ui` | **localStorage** (solo UI) |
| Panel IA mode/width | — | `kiyoko-ai-store` | **localStorage** (solo UI) |

### Regla general

```
Si afecta al rendering del servidor (idioma, tema inicial) → DB + cookie
Si es solo preferencia de UI local → localStorage via Zustand
Si es dato del usuario que debe viajar entre dispositivos → DB
```

---

## 13. Providers necesarios en el arbol de componentes

### Arbol actual

```
<html>
  <body>
    <QueryProvider>              ← TanStack Query (raiz)
      {children}                 ← Todas las rutas
    </QueryProvider>
    <KiyokoToaster />            ← Toast notifications
  </body>
</html>
```

### Arbol necesario (completo)

```
<html lang={locale} suppressHydrationWarning>
  <head>
    <script>/* tema anti-flash */</script>
  </head>
  <body>
    <QueryProvider>              ← TanStack Query cache + devtools
      <AuthProvider>             ← ★ NUEVO: contexto de auth (user, session)
        <OrgProvider>            ← ★ NUEVO: contexto de org activa
          <ThemeProvider>        ← ★ NUEVO: unifica tema (una sola fuente)
            <LocaleProvider>     ← ★ NUEVO: i18n (cuando se implemente)
              {children}
            </LocaleProvider>
          </ThemeProvider>
        </OrgProvider>
      </AuthProvider>
    </QueryProvider>
    <KiyokoToaster />
  </body>
</html>
```

### Detalle de cada provider nuevo

#### AuthProvider

```typescript
// src/providers/AuthProvider.tsx
// Envuelve la app con contexto de autenticacion
// Expone: user, session, isLoading, signOut

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Internamente usa useQuery para el profile:
const { data: profile } = useQuery({
  queryKey: ['auth', 'profile'],
  queryFn: () => supabase.auth.getUser(),
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

#### OrgProvider

```typescript
// src/providers/OrgProvider.tsx
// Envuelve con contexto de organizacion activa
// Lee currentOrgId de useUIStore, valida contra DB

interface OrgContextValue {
  currentOrg: Organization | null;
  orgs: Organization[];
  switchOrg: (orgId: string) => void;
  isLoading: boolean;
}

// Ya existe logica en useOrganizations, solo extraer a provider
```

#### ThemeProvider

```typescript
// src/providers/ThemeProvider.tsx
// Unifica tema: una sola fuente (localStorage['kiyoko-theme'])
// Expone: theme, setTheme, resolvedTheme

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Lee de localStorage['kiyoko-theme'] al montar
// Escucha cambios de sistema (prefers-color-scheme)
// Aplica classList y data-theme al DOM
// Sincroniza a DB profiles.preferences.theme (async, no bloqueante)
```

---

## 14. Plan de correccion por prioridad

### P0 — Critico (hacer primero)

| # | Tarea | Archivos | Impacto |
|---|---|---|---|
| 1 | **Unificar tema**: una sola fuente `kiyoko-theme` | useUIStore.ts, Header.tsx, ThemeToggle.tsx | Elimina bug de temas desincronizados |
| 2 | **Eliminar `kiyoko-preferred-provider`**: usar solo useUIStore | ChatInput.tsx | Elimina duplicidad |
| 3 | **Eliminar useOrgStore**: ya es alias de useUIStore | useOrgStore.ts, imports | Elimina confusion |

### P1 — Alto (hooks faltantes)

| # | Tarea | Archivos | Impacto |
|---|---|---|---|
| 4 | **Crear useCharacters** (query + mutations) | hooks/useCharacters.ts | Centraliza 5+ pages |
| 5 | **Crear useScenes** (query + mutations) | hooks/useScenes.ts | Centraliza 6+ pages |
| 6 | **Crear useBackgrounds** (query + mutations) | hooks/useBackgrounds.ts | Centraliza 4+ pages |
| 7 | **Crear useTasks** (query + mutations) | hooks/useTasks.ts | Centraliza 2+ pages |
| 8 | **Eliminar useProject.ts** (anti-patron) | hooks/useProject.ts | Ya existe useProjectQuery |
| 9 | **Migrar useVideos.ts** a useQuery | hooks/useVideos.ts | Elimina anti-patron |

### P2 — Medio (migracion de pages)

| # | Tarea | Archivos | Impacto |
|---|---|---|---|
| 10 | Migrar dashboard/page.tsx a hooks | page.tsx | Limpieza |
| 11 | Migrar scenes/page.tsx a useScenes | page.tsx | Limpieza |
| 12 | Migrar characters/page.tsx a useCharacters | page.tsx | Limpieza |
| 13 | Migrar backgrounds/page.tsx a useBackgrounds | page.tsx | Limpieza |
| 14 | Migrar tasks/page.tsx a useTasks | page.tsx | Limpieza |
| 15 | Migrar storyboard/page.tsx a hooks | page.tsx | Limpieza |
| 16 | Migrar VoiceSelector.tsx a useVoices() | VoiceSelector.tsx | Elimina anti-patron |

### P3 — Bajo (mejoras de UX)

| # | Tarea | Archivos | Impacto |
|---|---|---|---|
| 17 | Agregar optimistic updates a favorites | useFavorites.ts | UX mas fluida |
| 18 | Agregar optimistic updates a task status | useTasks.ts | UX kanban |
| 19 | Agregar optimistic updates a scene reorder | useScenes.ts | UX drag & drop |
| 20 | Crear AuthProvider | providers/AuthProvider.tsx | Centraliza auth |
| 21 | Crear ThemeProvider | providers/ThemeProvider.tsx | Unifica tema |
| 22 | Agregar prefetching en hover | Links de navegacion | UX mas rapida |
| 23 | Agregar QueryErrorResetBoundary | Error boundaries | Mejor recuperacion |

### P4 — Futuro (i18n)

| # | Tarea | Archivos | Impacto |
|---|---|---|---|
| 24 | Instalar next-intl | package.json, next.config | Infraestructura |
| 25 | Extraer strings ES a messages/es.json | ~100 archivos | Base para traduccion |
| 26 | Crear messages/en.json | messages/ | Traduccion inglesa |
| 27 | Conectar idioma del perfil a next-intl | middleware, providers | Multi-idioma funcional |

---

## Apendice: Checklist de verificacion

Usar esta checklist despues de implementar las correcciones:

```
[ ] Tema: Cambiar light→dark→system. Recargar. ¿Persiste? ¿Sin flash?
[ ] Tema: Abrir en otra pestana. ¿Mismo tema?
[ ] Org: Cambiar org. Recargar. ¿Persiste la correcta?
[ ] Org: Eliminar org activa desde otra sesion. ¿Fallback funciona?
[ ] Sidebar: Colapsar. Navegar. Recargar. ¿Persiste?
[ ] Vista escenas: Cambiar a timeline. Navegar. Volver. ¿Persiste?
[ ] Favoritos: Toggle. ¿Cambio instantaneo (optimistic)?
[ ] Crear personaje: ¿Lista se actualiza al cerrar modal?
[ ] Crear escena: ¿Grid se actualiza al cerrar modal?
[ ] Crear video: ¿Navega al nuevo video?
[ ] Settings: Abrir. Cambiar seccion. Navegar. Volver a settings. ¿Empieza en perfil?
[ ] Login: Cerrar sesion. Recargar. ¿Redirige a /login?
[ ] Login: Iniciar sesion. ¿Org correcta? ¿Tema correcto? ¿Sidebar correcto?
[ ] Cache: Navegar entre paginas. ¿Datos cargados instantaneamente del cache?
[ ] DevTools: ¿Visibles en desarrollo? ¿Queries nombradas correctamente?
```
