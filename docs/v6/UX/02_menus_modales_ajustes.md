# Menús, modales y ajustes UI (V6) — estándares para que “todo sea perfecto”

Este documento lista estándares V6 para que cualquier menú/modales del sistema sea consistente visual y funcionalmente.

## 0) Componentes reales del repo (para no inventar reglas)
En tu código existen (al menos) estos overlays:
- `src/components/ui/dialog.tsx` (Radix Dialog)
- `src/components/ui/alert-dialog.tsx` (Radix AlertDialog; confirmación peligrosa/irreversible)
- `src/components/ui/sheet.tsx` (side drawer; base-ui dialog)
- `src/components/layout/SearchModal.tsx` (búsqueda con `Dialog`)
- `src/components/settings/SettingsModal.tsx` (config de usuario; vive dentro del layout general)
- `src/components/shared/FeedbackDialog.tsx` (overlay “panel” propio con pasos)
- Menú/Popover del chat:
  - `src/components/chat/ChatInput.tsx` usa `Popover` para “Proveedor de IA”.

## 1) Accesibilidad mínima (obligatorio)
1. El modal/menu debe manejar:
   - foco inicial al abrir,
   - retorno del foco al cerrar,
   - cierre con `ESC`,
   - evitar que el usuario interactúe con el background (cuando aplica).
2. Navegación por teclado:
   - `Tab` recorre elementos con orden lógico,
   - Enter activa la opción confirmatoria.

## 2) Consistencia visual
1. Definir una única “escala” de componentes:
   - tamaños (sm/md/lg),
   - radios,
   - sombras,
   - border width y colores.
2. Animaciones:
   - misma duración y easing en todo el sistema,
   - no usar animaciones distintas por componente.

## 3) Consistencia funcional
1. Estados:
   - loading siempre muestra skeleton/spinner equivalente,
   - empty state siempre tiene CTA claro.
2. Confirmaciones:
   - cualquier acción irreversible desde IA requiere confirmación explícita (V6 ya lo fuerza vía `[ACTION_PLAN]`).
3. Persistencia:
   - la apertura/cierre de modales no debe resetear el chat ni borrar inputs (excepto “Clear conversation”).

4. Deep-linking (entrypoints por URL):
   - `src/app/(dashboard)/layout.tsx` abre `SettingsModal` cuando:
     - la ruta empieza por `/settings` (mapea a sección),
     - o existe el query param `?settings=open` (opcional `&section=api-keys|perfil|notificaciones|suscripcion|seguridad|...`).
   - si el modal se abrió por query param, al cerrarlo se elimina el flag `settings=open` del URL para que no vuelva a abrir al refrescar.

## 3.1) Regla de decisión (cuándo usar qué overlay)
1. Usa `Dialog` (`ui/dialog.tsx`) para:
   - flujos de selección o formularios “centrales”,
   - cuando el usuario necesita contexto y un flujo de pasos pequeño (1–2 pantallas).
2. Usa `AlertDialog` (`ui/alert-dialog.tsx`) para:
   - acciones destructivas: borrar, eliminar, desactivar claves, etc.
   - confirmaciones con lenguaje claro: “Entiendo que no se puede deshacer”.
3. Usa `Sheet` (`ui/sheet.tsx`) para:
   - paneles laterales (especialmente en móvil): detalles, edición rápida, filtros.
4. Usa `Popover` para:
   - controles compactos que no interrumpen el flujo (p.ej. selector de proveedor de IA en `ChatInput`).
5. Si ya existe un overlay propio (p.ej. `FeedbackDialog`):
   - conservar su estética,
   - pero alinear:
     - tamaño, radio, bordes,
     - animación (duración 200ms aprox),
     - cierre por `X` y overlay click.

## 4) Checklist para aplicar “archivo a archivo”
Para cada página donde existan menús/modales:
1. listar componentes que abren overlay,
2. verificar accesibilidad,
3. verificar estilos (clases Tailwind equivalentes),
4. verificar que eventos (onSelect/onConfirm/onClose) no disparan mutaciones no deseadas.

