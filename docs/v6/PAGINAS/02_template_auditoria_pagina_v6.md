# Plantilla de auditoría por página (V6)

Usa esta plantilla para revisar cada página “archivo a archivo” sin dejar huecos.

## A) Datos de la página
- Ruta: `src/app/.../page.tsx`
- Tipo: dashboard / settings / resources / video / scene / auth
- Componentes principales (lista corta)

## B) Validación UI (visual)
1. Layout
   - grid base y breakpoints correctos
   - coherencia de spacing (paddings/margins)
   - tamaños y radios consistentes con el resto del sistema
2. Componentes reutilizados
   - checklist de duplicación: ¿usa `components/ui/*` y componentes del sistema?
3. Tabla/lists
   - encabezados y celdas legibles
   - estados vacío y loading visuales

## C) Validación UX (funcional)
1. Menús / modales
   - abre/cierra sin romper layout
   - `ESC` cierra (cuando aplica)
   - foco vuelve al elemento anterior (accesibilidad)
2. Persistencia de estado
   - si la página abre modales: no resetear input principal
   - si la página cambia de contexto (project/video/scene): reglas de chat aplican como V6
3. Navegación
   - rutas push correctas
   - scroll position (si aplica)

## D) Validación IA (si la página afecta IA)
1. ¿Esta página “dispara” o “asume” chat?
2. ¿Cómo se construye el contexto?
   - dashboard/project/video/scene según `KiyokoChat.tsx`
3. ¿Los cambios vienen desde `[ACTION_PLAN]`?
4. ¿El executor aplica acciones soportadas?

## E) Errores y telemetría
1. Estado de error:
   - mensaje claro para usuario
   - recuperación (retry / back)
2. Telemetría:
   - `ai_usage_logs` se registra cuando corresponde (chat/vision/generate-image)

## F) Resultado
- Veredicto: `OK` / `Needs changes`
- Lista de cambios propuestos (y prioridad)
- Archivos a tocar

