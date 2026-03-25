# Plan de pruebas manuales (V6)

Este plan sirve para garantizar que “V6 está perfecto” antes de eliminar residuos o consolidar contratos.

## 0) Reglas del plan
1. Probar en 3 niveles de contexto:
   - `dashboard`
   - `project`
   - `video/scene`
2. Probar con:
   - sin adjuntos,
   - con imágenes adjuntas,
   - con planes `[ACTION_PLAN]`.
3. Verificar que el chat:
   - no auto-restaura mensajes al entrar,
   - solo carga al seleccionar historial.

## 1) Contrato de IA (bloques)
1. Pedir un prompt de creación (p.ej. “crear una escena”).
   - Esperado: aparece `[ACTION_PLAN]...[/ACTION_PLAN]` con JSON válido.
2. Pedir opciones:
   - Esperado: aparece `[OPTIONS]...[/OPTIONS]` o tags equivalentes y la UI responde.
3. Validar renderer:
   - Esperado: `parse-ai-message` parsea y renderiza las tarjetas.

## 2) Ejecución y persistencia
1. Confirmar un plan y verificar:
   - cambios aparecen en BD (mirar tablas canon),
   - la conversación se guarda en `ai_conversations`.
2. Probar `Cancel`:
   - Esperado: se oculta el plan del mensaje, sin ejecutar.
3. Probar `Undo`:
   - Esperado: se restaura estado (si el executor/undo está completo).

## 3) Streaming
1. Verificar que mientras el mensaje se escribe:
   - el chat actualiza burbuja incremental,
   - y luego renderiza bloques sin parpadeos.
2. Verificar fallback legacy (solo para seguridad):
   - pedir una tarea y confirmar que el parser legacy no rompe.

## 4) Proveedores
1. Forzar error de proveedor:
   - Esperado: fallback chain intenta otros modelos y registra `ai_usage_logs`.
2. Verificar header:
   - Esperado: `X-AI-Provider` y `X-Active-Agent` se reflejan en UI.

## 5) UI/Modales
1. Abrir/cerrar:
   - `SearchModal`, `Settings` overlays, y confirmaciones.
2. Accesibilidad:
   - `ESC` cierra cuando aplica,
   - foco vuelve al elemento anterior.

