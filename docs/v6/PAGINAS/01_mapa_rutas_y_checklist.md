# Mapa de páginas (V6) — revisión UI/funcional paso a paso

Este documento sirve como “mapa” de qué páginas existen y cómo auditarlas para que V6 sea consistente (visual y funcional).

## 1) Rutas principales que hay que revisar
A partir del árbol de `src/app/**/page.tsx`:
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/new/page.tsx`
- `src/app/(dashboard)/project/[shortId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/chat/page.tsx`
- `src/app/(dashboard)/project/[shortId]/activity/page.tsx`
- `src/app/(dashboard)/project/[shortId]/publications/page.tsx`
- `src/app/(dashboard)/project/[shortId]/publications/new/page.tsx`
- `src/app/(dashboard)/project/[shortId]/publications/[pubShortId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/videos/page.tsx`
- `src/app/(dashboard)/project/[shortId]/tasks/page.tsx`
- `src/app/(dashboard)/project/[shortId]/tasks/time/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/templates/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/styles/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/characters/[charId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/backgrounds/[bgId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/analysis/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scenes/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/script/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/narration/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/export/page.tsx`
- `src/app/(dashboard)/project/[shortId]/video/[videoShortId]/derive/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/api-keys/page.tsx`
- `src/app/(dashboard)/settings/notifications/page.tsx`
- `src/app/(dashboard)/settings/subscription/page.tsx`
- `src/app/(dashboard)/project/[shortId]/settings/page.tsx`
- `src/app/(dashboard)/project/[shortId]/settings/ai/page.tsx`
- `src/app/(dashboard)/project/[shortId]/settings/sharing/page.tsx`
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/organizations/page.tsx`
- `src/app/(dashboard)/organizations/new/page.tsx`
- `src/app/(dashboard)/organizations/[orgId]/page.tsx`
- `src/app/(dashboard)/project/[shortId]/publications/profiles/page.tsx`
- `src/app/(dashboard)/project/[shortId]/publications/page.tsx`
- `src/app/(dashboard)/project/[shortId]/resources/loading.tsx` (loaders, a auditar)
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/pending/page.tsx`
- `src/app/(auth)/blocked/page.tsx`
- `src/app/share/[token]/page.tsx`
- `src/app/page.tsx`

## 2) Checklist V6 por página
Para cada página, verificar:
1. **Layout**:
   - consistencia de paddings/márgenes,
   - grid base + breakpoints,
   - responsividad (mobile/desktop).
2. **Componentes reutilizables**:
   - evitar duplicación (si existe UI ya, usarlo).
3. **Modales y menus**:
   - accesibilidad (focus trap, ESC cierra),
   - tamaños consistentes,
   - loading/empty states visuales.
4. **Flujo IA**:
   - cuándo se debe cargar el chat,
   - si se “persiste” o no (V6: no auto-restore),
   - si las acciones del chat aplican correctamente cambios en BD.
5. **Errores**:
   - estados de error con mensajes y recuperación.
6. **Logs/telemetría**:
   - endpoints usados registran `ai_usage_logs` cuando aplique.

## 3) Próximo paso (recomendado)
Revisar primero (más crítico para V6):
1. `chat`/panel chat (`KiyokoPanel`, `KiyokoChat`, `ChatInput`, `ChatHistorySidebar`)
2. páginas de `settings` y `api-keys`
3. flujos de video/scene donde ocurren planes y prompts

