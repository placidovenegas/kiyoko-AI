# V6 — Documentación definitiva (índice)

Este índice resume la documentación V6 creada para tu repo y cómo usarla como guía “fuente de verdad”.

## Cómo leer V6
1. Empieza por `README.md` (contexto y convención).
2. Usa `IA/01_overview_arquitectura.md` para entender el flujo end-to-end.
3. Usa `IA/02_chat_contract.md` para el contrato de bloques (lo que el modelo debe emitir).
4. Usa `IA/03_action_system.md` para confirmación/ejecución/undo del `[ACTION_PLAN]`.
5. Usa `DB/04_tablas_canónicas_y_usos.md` para mapear BD ↔ pipeline (qué tabla es canon).
6. Usa `UX/*` para comportamiento del chat (persistencia, SSE, menús/modales).
7. Usa `CODE/03_matriz_residuos_y_eliminacion.md` para saber qué desactivar/eliminar sin residuos.
8. Usa `PAGINAS/*` para auditar “una a una” las páginas y dejar todo perfecto.

## Secciones
### Convención y alcance
- `README.md`

### IA (contratos y flujo)
- `IA/01_overview_arquitectura.md`
- `IA/02_chat_contract.md`
- `IA/03_action_system.md`
- `IA/04_multimodal_imagen_audio.md`
- `IA/05_prompt_quality.md`
- `IA/06_providers_router.md`
- `IA/07_endpoints_ai_persistencia.md`
- `IA/08_asistente_contextual_y_timeline.md`

### Base de datos (canon real)
- `DB/01_schema_resumen.md`
- `DB/04_tablas_canónicas_y_usos.md`
- `DB/02_map_action_types.md`
- `DB/03_integridad_undo_snapshots.md`
- `DB/05_chat_historial_y_undo.md`

### UX (chat, streaming, modales/menus)
- `UX/01_chat_persistencia.md`
- `UX/02_menus_modales_ajustes.md`
- `UX/03_streaming_sse_protocol.md`
- `UX/04_chat_layout_y_dimensiones.md`
- `UX/05_chat_componentes_y_interaccion.md`
- `UX/06_chat_referencia_visual_flujos_y_tema.md` — tema, colores, componentes y flujos (mockups / imágenes)
- `UX/08_prompt_stitch_chat_pagina_a_pagina.md` — prompt Stitch/Figma IA artboard por artboard + interacciones (enviar, crear, cancelar)
- `UX/09_chat_informe_componentes_y_siguiente_paso.md` — informe: CHOICES, OPTIONS, CREATE, streaming y referencia “siguiente paso”
- `UX/10_chat_catalogo_componentes_y_especificacion_cliente.md` — catálogo de componentes IA, especificación visual (refs.), Q&A por bloque y flujo post-creación unificado

### Residuos y limpieza segura
- `CODE/01_residuos_y_actualizaciones.md`
- `CODE/02_plan_implementacion_v6.md`
- `CODE/03_matriz_residuos_y_eliminacion.md`

### Páginas (auditoría UI/funcional)
- `PAGINAS/01_mapa_rutas_y_checklist.md`
- `PAGINAS/02_template_auditoria_pagina_v6.md`
- `PAGINAS/03_plan_revision_por_fases.md`

### (Opcional) plan de QA
- `QA/01_plan_pruebas_v6.md`

### MY DOCUMENT (especificaciones V7/V8 y prototipos)
- `MY DOCUMENT/kiyoko-v8-prompt-implementacion-chat.md` — **prompt maestro** para implementar el chat V8 (estados, BD, prioridades P0–P3)
- Ver también: `kiyoko-v8-especificacion-completa.md`, `kiyoko-comportamiento-chat.md`, `kiyoko-v7-ux-spec.md`, `kiyoko-chat-prototype.jsx`

