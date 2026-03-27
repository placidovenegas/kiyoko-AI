# Auditoria de Stores, Cache y Recarga

Fecha: 2026-03-27
Alcance: analisis del proyecto completo para identificar que estado debe vivir en store, que datos deben quedar en cache y que piezas hoy estan duplicadas o mal repartidas.

Este documento no propone cambios aplicados. Es una guia de arquitectura para ordenar estado, cache y recarga.

## Resumen ejecutivo

Hoy la app mezcla 3 capas de estado:

1. React Query como cache de servidor.
2. Zustand como estado global.
3. Hooks y componentes con `useState` o lecturas directas a Supabase.

El problema principal no es que falte estado global. El problema principal es que hay datos de servidor viviendo a la vez en varios sitios:

- React Query
- stores de Zustand
- context providers
- hooks legacy con fetch directo
- estado local dentro de componentes grandes

Eso genera:

- recargas mas lentas o mas frecuentes de lo necesario
- invalidaciones inconsistentes
- riesgo de datos desincronizados
- mas llamadas repetidas a `supabase.auth.getUser()`
- realtime que no siempre actualiza el cache correcto

## Criterio recomendado

La regla que mejor encaja con este proyecto es:

- React Query = estado de servidor y cache de datos remotos.
- Zustand = estado de UI, preferencias persistidas y estado transitorio de flujo.
- Context = solo composicion para evitar prop drilling, nunca como fuente paralela de datos.
- `localStorage` manual = minimo y solo para UX muy puntual.

## Inventario actual

### Stores Zustand detectados

#### `src/stores/useUIStore.ts`

Responsabilidad actual:

- sidebar abierto/cerrado
- sidebar colapsado
- `currentOrgId`
- tema
- vista de escenas
- provider preferido
- estado de panel/chat
- modales de workspace/settings

Estado:

- util
- bien orientado a UI
- persistido en `kiyoko-ui`

Conclusion:

- debe quedarse
- es uno de los stores necesarios del proyecto
- hay que mantenerlo como store de UI, no como cache de datos de negocio

#### `src/stores/ai-store.ts`

Responsabilidad actual:

- apertura/cierre del panel Kiyoko
- modo del panel
- ancho
- agente activo
- provider mode
- `conversationId`
- `pendingPlan`
- `lastImageAnalysis`
- estado de creacion en curso

Estado:

- util
- mezcla UI con algo de estado de flujo
- persistencia parcial correcta para preferencias

Conclusion:

- debe quedarse
- es necesario para la shell del panel AI
- conviene seguir tratandolo como store de UI/flujo y no como cache de conversaciones

#### `src/stores/useAiProviderStore.ts`

Responsabilidad actual:

- provider activo de texto
- provider activo de imagen
- cuotas
- loading

Estado:

- pequeño
- se alimenta desde `useAiProvider()`
- no esta persistido

Conclusion:

- puede quedarse como store ligero si se quiere acceso global inmediato desde todo el panel AI
- tambien podria vivir en React Query sin problema
- no es critico como store permanente, pero si es razonable como store auxiliar

#### `src/stores/useActiveVideoStore.ts`

Responsabilidad actual:

- video activo
- lista simple de videos
- `refreshKey`

Estado:

- uso limitado
- detectado en `src/app/(dashboard)/project/[shortId]/videos/page.tsx`

Conclusion:

- no parece un store central imprescindible
- solo tiene sentido si se necesita seleccion global o refresco cruzado entre varias vistas del mismo dominio
- si no, se puede reemplazar por query keys e invalidaciones

#### `src/stores/useProjectStore.ts`

Responsabilidad actual:

- `project`
- `videos`
- `characters`
- `backgrounds`
- `stylePresets`
- `loading`
- `error`

Estado:

- duplica a React Query y a `ProjectContext`
- lo usa el hook legacy `src/hooks/useProject.ts`
- lo usa tambien `src/hooks/useRealtimeProject.ts`

Conclusion:

- no deberia ser store global de largo plazo
- guarda datos de servidor que ya tienen mejor sitio en React Query
- es uno de los principales focos de duplicidad

#### `src/stores/useAiChatStore.ts`

Responsabilidad actual:

- mensajes
- streaming
- texto actual de stream

Estado:

- no aparecio uso activo en el arbol buscado
- parece residuo o store antiguo

Conclusion:

- no parece necesario en la arquitectura actual
- hay que tratarlo como candidato claro a eliminar o archivar

#### `src/stores/useOrgStore.ts`

Responsabilidad actual:

- wrapper sobre `useUIStore` para `currentOrgId`

Estado:

- marcado de facto como compatibilidad

Conclusion:

- no debe crecer
- solo deberia desaparecer cuando se limpie el codigo legacy

## Contextos y providers actuales

### `src/contexts/ProjectContext.tsx`

Usa `useProjectQuery(shortId)` y expone:

- `project`
- `videos`
- `characters`
- `backgrounds`
- `stylePresets`
- `loading`
- `error`

Conclusion:

- esta bien como capa de composicion
- no deberia coexistir con `useProjectStore` para los mismos datos

### `src/contexts/VideoContext.tsx`

Usa `useVideoQuery(videoShortId)` y expone:

- `video`
- `scenes`
- `loading`
- `scenesLoading`
- `error`
- `refreshScenes()`

Conclusion:

- buen uso como contexto fino
- la fuente de verdad sigue siendo React Query

### `src/lib/query/provider.tsx` y `src/lib/query/client.ts`

Estado actual del cache:

- `staleTime`: 30s
- `gcTime`: 5 min
- `refetchOnWindowFocus`: `true`
- `refetchOnReconnect`: `false`
- sin persistencia del cache de React Query

Impacto:

- en recargas completas se pierde el cache
- el usuario vuelve a sentir varias cargas aunque acabe de visitar la misma pantalla

## Diagnostico por dominio

### 1. Auth y perfil

Archivo principal: `src/hooks/useAuth.ts`

Situacion actual:

- usa `useState`
- hace `supabase.auth.getUser()`
- luego consulta `profiles`
- se suscribe a `onAuthStateChange`

Problema:

- no aprovecha React Query como cache compartido
- varios sitios de la app vuelven a pedir usuario o perfil por separado

Conclusion:

- aqui no hace falta otro store grande
- hace falta una fuente central cacheada para `session`, `me` y `profile`

### 2. Organizaciones y workspace actual

Archivo principal: `src/hooks/useOrganizations.ts`

Situacion actual:

- usa React Query para lista de organizaciones
- persiste `currentOrgId` en `useUIStore`
- hace autoseleccion si el id guardado ya no existe

Esto esta bastante bien.

Conclusion:

- mantener React Query para lista y detalle de organizaciones
- mantener `currentOrgId` en `useUIStore`
- este es el mejor ejemplo actual de frontera correcta entre cache y store

### 3. Proyecto

Piezas implicadas:

- `src/hooks/queries/useProjectQuery.ts`
- `src/contexts/ProjectContext.tsx`
- `src/stores/useProjectStore.ts`
- `src/hooks/useProject.ts`
- `src/hooks/useRealtimeProject.ts`

Situacion actual:

- existe una via moderna con React Query
- existe una via legacy con Zustand + fetch directo
- realtime actualiza el store legacy, no el cache principal usado por el contexto

Problema:

- doble fuente de verdad
- la pantalla puede leer datos de una via mientras realtime actualiza otra

Conclusion:

- el store de proyecto no es necesario como store global
- el proyecto debe vivir en React Query
- el contexto solo debe leer del cache de queries

### 4. Video y escenas

Piezas implicadas:

- `src/hooks/queries/useVideoQuery.ts`
- `src/contexts/VideoContext.tsx`
- `src/stores/useActiveVideoStore.ts`
- `src/hooks/useRealtimeSync.ts`
- `src/hooks/use-realtime-updates.ts`

Situacion actual:

- la lectura principal va mejor encaminada que en proyecto
- pero hay invalidaciones realtime con keys crudas y no siempre alineadas

Problemas detectados:

- `queryKeys.videos.detail()` usa `['video', shortId]`
- algunas actualizaciones realtime hacen `setQueriesData({ queryKey: ['video'] })`
- `use-realtime-updates.ts` invalida keys como `['projects', projectId]` y `['scenes', 'video']` que no siempre coinciden con las keys reales

Conclusion:

- el problema aqui no es falta de store
- el problema es consistencia de query keys y estrategia de invalidacion

### 5. Favoritos

Archivo principal: `src/hooks/useFavorites.ts`

Situacion actual:

- crea un mini store Zustand dentro del propio hook
- carga favoritos una vez
- usa `supabase.auth.getUser()`
- mezcla optimistic update con refetch completo

Problema:

- es estado de servidor modelado como store local-global
- esta escondido dentro de un hook, no en `src/stores/`
- no se beneficia del modelo de invalidacion global de React Query

Conclusion:

- no necesita store propio
- encaja mejor como query cacheada y mutations

### 6. Chat y conversaciones AI

Piezas implicadas:

- `src/stores/ai-store.ts`
- `src/hooks/useKiyokoChat.ts`
- `src/hooks/queries/use-ai-conversations.ts`
- `src/components/chat/KiyokoChat.tsx`

Situacion actual:

- `useAIStore` gobierna shell/UI del panel
- `useKiyokoChat` mantiene gran parte del estado conversacional y persiste a Supabase
- en paralelo existen hooks React Query para conversaciones
- ademas hay `localStorage` manual para `kiyoko-last-conversation-id`, `kiyoko-history-width` y provider preferido

Problema:

- hay dos paradigmas activos para conversaciones:
  - store/hook grande con persistencia manual
  - query hooks con cache e invalidacion

Conclusion:

- el store necesario aqui es `useAIStore` para UI del panel
- las conversaciones, listas y detalle deberian tener una unica fuente de verdad
- ahora mismo estan partidos entre store, query cache y `localStorage`

## Stores que si son necesarios

Estos son los stores que tienen sentido real en la arquitectura objetivo:

### 1. `useUIStore`

Debe conservar:

- sidebar
- modales
- tema
- preferencias de layout
- `currentOrgId`
- paneles abiertos/cerrados

### 2. `useAIStore`

Debe conservar:

- shell del panel AI
- modo y tamaño
- agente activo
- estado transitorio de ejecucion
- `pendingPlan`

### 3. `useAiProviderStore` (opcional)

Mantenerlo solo si se quiere:

- acceso global inmediato a provider activo y cuotas
- evitar prop drilling dentro del ecosistema AI

Si no, puede pasar a React Query.

### 4. `useActiveVideoStore` (muy opcional)

Solo si realmente hay:

- seleccion de video compartida entre varias vistas no hermanas
- necesidad de refresco global sin depender de query invalidation

Si no, sobra.

## Stores que no deberian ser stores de negocio

### `useProjectStore`

No recomendado como store permanente.

Motivo:

- es server state
- duplica a React Query
- complica realtime

### `useAiChatStore`

No aparece como pieza central activa.

Motivo:

- parece legado
- se solapa con `useKiyokoChat`

### `useOrgStore`

No debe crecer.

Motivo:

- solo es compatibilidad alrededor de `useUIStore`

## Estado que deberia moverse a cache de servidor, no a store

No hace falta crear stores nuevos para estas piezas. Hace falta centralizarlas en React Query:

- sesion actual
- perfil del usuario
- organizaciones del usuario
- detalle del proyecto
- videos por proyecto
- escenas por video
- characters por proyecto
- backgrounds por proyecto
- style presets por proyecto
- favoritos del usuario
- conversaciones AI
- plan/suscripcion/usage
- settings de AI por proyecto

## Huecos reales de arquitectura

### 1. Falta un bootstrap global de workspace

Hoy varias pantallas vuelven a resolver por separado:

- usuario
- perfil
- organizaciones
- org activa
- plan
- providers

Seria mejor pensar este bloque como bootstrap cacheado de la app.

No significa un store grande nuevo. Significa definir queries base compartidas.

### 2. Query keys inconsistentes

Hay mezcla de:

- `queryKeys.*`
- arrays hardcodeados como `['organizations']`
- keys sueltas como `['project-resources', projectId]`
- invalidaciones broad como `['video']` o `['conversation']`

Esto hace que parte del cache no se invalide bien y otra parte se invalide demasiado.

### 3. Realtime conectado a la capa equivocada

`useRealtimeProject.ts` actualiza `useProjectStore`, pero la UI principal de proyecto ya esta entrando por `ProjectContext` + React Query.

Eso deja un circuito partido.

### 4. Demasiadas lecturas repetidas de `supabase.auth.getUser()`

Se repiten en:

- `useAuth`
- `useFavorites`
- `useOrganizations`
- `useKiyokoChat`
- multiples paginas y hooks de settings

Eso no requiere store adicional, requiere una capa compartida de sesion/perfil.

## Estrategia recomendada de cache y recarga

### Nivel 1. Cache de sesion y bootstrap

Crear una estrategia comun para:

- `auth.session`
- `auth.profile`
- `workspace.organizations`
- `workspace.currentOrg`

Persistencia recomendada:

- sesion: gestionada por Supabase
- `currentOrgId`: Zustand persistido
- profile y organizations: React Query

### Nivel 2. Cache por dominio

Mantener en React Query:

- dashboard
- proyectos
- videos
- escenas
- recursos
- favoritos
- conversaciones
- settings

### Nivel 3. Persistencia UX

Persistir solo preferencias que mejoran la sensacion de continuidad:

- ancho de paneles
- estado abierto/cerrado
- tema
- `currentOrgId`
- ultimo contexto visible si tiene valor real para el usuario

### Nivel 4. Persistencia opcional del QueryClient

Para mejorar la recarga completa, este proyecto se beneficiaria de evaluar persistencia del cache de React Query para algunas keys.

Utilidad potencial:

- volver al dashboard y ver datos instantaneos mientras revalida
- reabrir proyecto/video sin pantalla vacia

Precauciones:

- no persistir todo indiscriminadamente
- filtrar queries sensibles o de vida muy corta

## Mapa recomendado de fuente de verdad

| Dominio | Fuente de verdad recomendada | Store global | Persistencia |
| --- | --- | --- | --- |
| Sesion | Supabase + React Query | No | Supabase |
| Perfil actual | React Query | No | No |
| Organizaciones | React Query | No | No |
| Org actual seleccionada | Zustand (`useUIStore`) | Si | Si |
| Sidebar / modales / tema | Zustand (`useUIStore`) | Si | Si |
| Panel AI shell | Zustand (`useAIStore`) | Si | Parcial |
| Conversaciones AI | React Query o un solo store/hook unificado, pero no ambos | Idealmente no | Segun estrategia final |
| Proyecto actual | React Query | No | No |
| Videos del proyecto | React Query | No | No |
| Escenas del video | React Query | No | No |
| Favoritos | React Query | No | Opcional |
| Provider status AI | React Query o store ligero | Opcional | No |
| Video activo compartido | Solo si de verdad cruza vistas | Opcional | No |

## Prioridad de consolidacion

### Prioridad alta

1. Unificar proyecto y video sobre React Query como unica fuente de verdad.
2. Sacar `useProjectStore` del flujo principal.
3. Corregir realtime para que invalide o actualice las query keys reales.
4. Crear capa comun para sesion/perfil y reducir llamadas repetidas a `auth.getUser()`.
5. Decidir una sola estrategia para conversaciones AI.

### Prioridad media

1. Migrar favoritos a React Query.
2. Estandarizar todas las query keys bajo `src/lib/query/keys.ts`.
3. Revisar donde tiene sentido persistir cache de queries entre recargas.

### Prioridad baja

1. Eliminar wrappers legacy como `useOrgStore`.
2. Retirar stores sin uso claro como `useAiChatStore`.
3. Simplificar `useActiveVideoStore` si deja de aportar valor real.

## Conclusiones finales

La app no necesita mas stores grandes. Necesita menos stores de datos y una separacion mas estricta entre UI state y server state.

### Stores que si merecen existir

- `useUIStore`
- `useAIStore`
- `useAiProviderStore` solo si se confirma que aporta valor transversal
- `useActiveVideoStore` solo si hay necesidad real de seleccion compartida

### Stores que no deberian sostener datos de negocio remotos

- `useProjectStore`
- `useAiChatStore`
- `useOrgStore` mas alla de compatibilidad

### La mejora real de recarga y cache vendra de

- consolidar server state en React Query
- usar una sola familia de query keys
- alinear realtime con ese cache
- evitar fetches duplicados de usuario/perfil
- persistir solo preferencias de UX y, si interesa, parte del cache de queries

## Archivos auditados como base de este documento

- `src/stores/ai-store.ts`
- `src/stores/useUIStore.ts`
- `src/stores/useProjectStore.ts`
- `src/stores/useActiveVideoStore.ts`
- `src/stores/useAiProviderStore.ts`
- `src/stores/useAiChatStore.ts`
- `src/stores/useOrgStore.ts`
- `src/contexts/ProjectContext.tsx`
- `src/contexts/VideoContext.tsx`
- `src/lib/query/client.ts`
- `src/lib/query/provider.tsx`
- `src/lib/query/keys.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/useOrganizations.ts`
- `src/hooks/useFavorites.ts`
- `src/hooks/useProject.ts`
- `src/hooks/useVideos.ts`
- `src/hooks/useRealtimeProject.ts`
- `src/hooks/useRealtimeSync.ts`
- `src/hooks/use-realtime-updates.ts`
- `src/hooks/queries/useProjectQuery.ts`
- `src/hooks/queries/useVideoQuery.ts`
- `src/hooks/queries/use-ai-conversations.ts`
- `src/hooks/useKiyokoChat.ts`
- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/project/[shortId]/layout.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/layout.tsx`
