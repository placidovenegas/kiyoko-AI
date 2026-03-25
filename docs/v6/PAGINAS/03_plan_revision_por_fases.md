# Revisión de páginas V6 — plan por fases (sin huecos)

Este documento define el orden recomendado para auditar páginas “una a una” y convertir mejoras en entregables medibles.

## Entregable por página
Para cada página, registra:
- `OK` / `Needs changes`
- lista de problemas (UI/UX/IA/errores/telemetría)
- propuesta de cambio (y prioridad: P0/P1/P2)
- archivos a tocar

Usa la plantilla `PAGINAS/02_template_auditoria_pagina_v6.md`.

## Fase 1 (P0, crítica: chat y estados)
1. `src/components/kiyoko/KiyokoPanel.tsx`
2. `src/components/chat/KiyokoChat.tsx`
3. `src/components/chat/ChatInput.tsx`
4. `src/components/chat/ChatHistorySidebar` (si aplica)
5. `src/components/chat/ChatMessage.tsx` (bloques + action plan)

Objetivo:
- asegurar consistencia de persistencia,
- streaming sin parpadeos,
- confirmación/ejecución correcta.

## Fase 2 (P0, configuración y modales)
1. `settings`:
   - `src/app/(dashboard)/settings/page.tsx`
   - `settings/api-keys`
2. componentes de modales/overlays:
   - `SearchModal`
   - confirmaciones destructivas (AlertDialog)

Objetivo:
- evitar reset de inputs,
- tamaños consistentes,
- cierre por `ESC`/X correcto.

## Fase 3 (P1, flujos de video/scene)
1. páginas donde IA crea/actualiza:
   - `video/.../scenes/page.tsx`
   - `video/.../scene/[sceneShortId]/page.tsx`
   - `video/.../analysis/page.tsx`
   - `video/.../narration/page.tsx`

Objetivo:
- que los planes `[ACTION_PLAN]` apliquen cambios en tablas canónicas,
- y que el UI refleje `is_current`/`version` correctamente.

## Fase 4 (P2, polish total)
1. consistencia visual:
   - spacing,
   - radios,
   - tipografía,
   - estados vacío/loading.
2. duplicación:
   - componentes repetidos,
   - estilos divergentes.

