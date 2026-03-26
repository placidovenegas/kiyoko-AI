# Implementación y mejoras — Interacción IA Kiyoko (según guión V2)

**Referencia:** `kiyoko-guion-interaccion-completo.md`  
**Audiencia:** producto, ingeniería frontend/backend, diseño de prompts  
**Versión:** 1.0 · marzo 2026

---

## 1. Resumen ejecutivo

El guión V2 define un **contrato de comportamiento** entre usuario e IA: contexto explícito, desambiguación obligatoria (nunca adivinar), flujos por entidad (personajes, fondos, vídeos, escenas, tareas, generación…), navegación cross-context y tono/formato (intro corta → componente → sugerencias).

Este documento traduce ese guión en **capas implementables**, identifica **brechas** respecto al estado típico de la app (contexto de chat, system prompt, bloques UI, acciones/DB) y propone un **roadmap por fases** con criterios de aceptación y riesgos.

**Principio rector:** la IA solo ejecuta acciones destructivas o costosas cuando el **contexto mínimo** (IDs + intención) está resuelto; si no, **pregunta con opciones concretas** (listas reales de proyectos, vídeos, escenas…), no texto genérico.

---

## 2. Lectura del guión: pilares operativos

| Pilar | Qué exige el guión | Implicación técnica |
|--------|-------------------|---------------------|
| **Context Object rico** | `ChatContext` con página, IDs, stats, APIs, listas de recursos | Unificar datos de sesión + servidor en un payload estable por mensaje |
| **Regla de oro** | No asumir; preguntar con datos reales | Desambiguación guiada + consultas a DB filtradas por `owner` / RLS |
| **Desambiguación** | Proyecto → vídeo → escena → entidad | Estado de conversación o slots; componentes `[OPTIONS]` / lista clickeable |
| **Cross-context** | “Estoy en X, quiero Y de Z” | Intención + `router.push` + recarga de contexto en el cliente |
| **Entidades** | CRUD + generación con tablas y logs | `ACTION_PLAN`, ejecutor, idempotencia, `activity_log` donde exista |
| **Tono y pipeline UI** | THINK → STREAM → pausa → componente → sugerencias | Alineado con comportamiento V8 del chat (fases ya documentadas en UX) |

---

## 3. Estado actual (referencia) vs objetivo del guión

### 3.1 Contexto de navegación

- **Hoy (típico):** `ContextLevel` (`dashboard` | `organization` | `project` | `video` | `scene`) + IDs en cliente; la ruta `POST /api/ai/chat` construye `systemPrompt` cargando datos según nivel.
- **Objetivo guión:** `ChatContext.page` más granular (`character`, `background`, `tasks`, `settings`, `exports`) y **stats** + **projectResources** + **apis** siempre que sea posible.

**Brecha:** hace falta **extender el modelo de contexto** (nuevas páginas y payloads) y **pasar al API** un JSON serializable equivalente al `ChatContext` del guión (o un subconjunto versionado).

**Mejora recomendada:** definir `ChatContextV2` en `types/` con campos opcionales; rellenar en el cliente desde stores + rutas + fetch ligero (stats) antes de enviar mensaje.

### 3.2 Desambiguación y memoria de slots

- **Hoy:** el modelo puede usar `[OPTIONS]` y texto; el guión exige **flujos multi-paso** con listas desde SQL (proyectos recientes, vídeos del proyecto, escenas sin prompt…).

**Brecha:** no basta con el prompt: hace falta **plantillas de intención** (detectar “crear escena” sin `videoId`) y **persistencia de slots** en la conversación (p. ej. “proyecto elegido” hasta completar la acción).

**Mejora:** capa “**dialog policy**” ligera (reglas + estado en `useKiyokoChat` o servidor) que marque `pending_disambiguation: { type, candidates[] }` para que la UI pueda mostrar tarjetas dedicadas si se desea.

### 3.3 Tareas, narración, análisis, export

- El guión describe **SQL y flujos completos** (tareas con filtros, “qué hago ahora”, narración, export con comprobaciones).

**Brecha:** depende de que las tablas y columnas existan en Supabase y de que el **executor de planes** soporte los `type`/`table` correspondientes.

**Mejora:** inventario de capacidades del `action-executor` frente al guión; priorizar **“qué hago ahora”** y **CRUD tareas** como primer bloque de valor (consultas de solo lectura + inserts acotados).

### 3.4 Navegación por lenguaje natural

- El guión mapea frases → rutas (`/p/{slug}/...`).

**Brecha:** las rutas reales del proyecto pueden usar `shortId` (`/project/[shortId]/...`) y no el prefijo `/p/`.

**Mejora:** tabla única **“frase → pathname”** en código (`lib/chat/navigation-intents.ts`) alineada con `next.config` y rutas actuales; tests de regresión al cambiar routing.

---

## 4. Arquitectura objetivo (implementación)

### 4.1 Contrato cliente → API

1. **Body enriquecido** (además de `messages`):
   - `context: ChatContextV2` (page, ids, stats, flags de API).
   - `conversationState?` (slots de desambiguación, última intención detectada) — opcional en primera iteración.
2. **Validación:** rechazar o degradar con mensaje claro si falta `projectId` cuando `page` lo requiere.

### 4.2 System prompt por capas

| Capa | Contenido |
|------|-----------|
| **Base** | Identidad, idioma, límites de longitud |
| **Contexto** | Resumen estructurado del `ChatContextV2` (números reales) |
| **Política** | “Nunca adivinar”; cómo usar `[OPTIONS]`; cuándo pedir proyecto/vídeo/escena |
| **Agente** | Router / project assistant / escenas (ya existente en parte) |
| **Formato** | Bloques permitidos: `[CREATE:*]`, `[PROJECT_SUMMARY]`, `[ACTION_PLAN]`, `[SUGGESTIONS]` |

### 4.3 UI: secuencia obligatoria (guión §8.4)

Garantizar en producto:

1. Fase **THINK** (onda + skeleton contextual).
2. **STREAM** del texto breve.
3. **Pausa** corta antes de montar bloques pesados.
4. **Componente** (tarjeta, lista, formulario dock).
5. **Sugerencias** (lista vertical con chevrón, coherente con diseño actual).

Los desvíos (mostrar componente sin intro) deben considerarse **bugs de UX**, no optimizaciones.

### 4.4 Datos: consultas reutilizables

Extraer del guión las **consultas canónicas** (proyectos del usuario, vídeos por proyecto, escenas por vídeo, tareas abiertas…) hacia módulos:

- `lib/ai/queries/chat-context-queries.ts` (servidor, con RLS).
- Respuestas en forma de **DTOs** listos para inyectar en el prompt y para `[OPTIONS]`.

Esto evita duplicar SQL en el prompt como texto libre y facilita testear.

---

## 5. Roadmap por fases

### Fase 0 — Fundaciones (1–2 iteraciones)

**Objetivo:** un solo flujo de desambiguación “de verdad” medible de punta a punta.

| Entrega | Descripción | Criterio de aceptación |
|---------|-------------|------------------------|
| **Context V2 mínimo** | Extender payload: `page`, ids, `stats` básicos (conteos) | El system prompt muestra números reales en una respuesta de prueba |
| **Proyecto faltante** | Usuario en dashboard pide crear recurso que requiere proyecto | La IA lista proyectos reales o “crear proyecto”; no inventa nombres |
| **Opciones con datos** | `[OPTIONS]` alimentadas desde query, no solo texto genérico | Tres opciones = tres filas reales de BD (o menos si no hay datos) |
| **Rutas** | Mapeo frase → `router.push` acorde a rutas Next actuales | Navegación correcta en al menos 3 intents |

**Riesgo:** sobrecargar el prompt; **mitigación:** stats resumidos (máx. N líneas).

### Fase 1 — Desambiguación vertical completa (proyecto → vídeo → escena)

**Objetivo:** replicar §2 y §5.2 del guión para la acción más frecuente (p. ej. generar prompt de imagen / abrir escena).

| Entrega | Descripción |
|---------|-------------|
| Cadena de preguntas | Estado de slots en conversación o metadata del mensaje |
| Listas contextuales | Escenas **sin prompt** marcadas como en el guión |
| Navegación post-selección | Tras elegir escena, push a timeline/detalle y contexto `scene` |

### Fase 2 — Tareas y “¿qué hago ahora?”

**Objetivo:** §4.2–4.5: lectura con filtros, comando agregado de priorización.

| Entrega | Descripción |
|---------|-------------|
| Consultas de tareas | Por proyecto, vídeo, escena, prioridad, fechas |
| Respuesta estructurada | Bloque dedicado o markdown con numeración fija (1️⃣ 2️⃣ 3️⃣) + sugerencias |
| Escritura | Crear/editar/completar tarea vía `ACTION_PLAN` + confirmación |

**Dependencia:** modelo de datos `tasks` y políticas RLS alineadas.

### Fase 3 — Ideación en dashboard (§3)

**Objetivo:** flujo “ideas para un video” con ramas A/B y creación proyectada de proyecto + vídeo.

| Entrega | Descripción |
|---------|-------------|
| Árbol de diálogo | Pasos explícitos; no mezclar ramas |
| Acción atómica | Transacción lógica: proyecto + vídeo + opcional arco narrativo |
| Post-creación | Sugerencias: planificar escenas, crear personaje, ir al proyecto |

### Fase 4 — Generación, APIs y banners

**Objetivo:** §6.6–6.7: comprobar providers antes de generar; mensajes de error accionables.

| Entrega | Descripción |
|---------|-------------|
| Preflight | Leer `project_ai_settings` / keys; si falta → bloque UI + enlace a API keys |
| Post-generación | Inserts en tablas de media + logs de uso |

### Fase 5 — Entidades avanzadas y colaboración

Narración, análisis de vídeo, shares, anotaciones, export — según prioridad de negocio y existencia de tablas.

---

## 6. Alineación con el modelo de datos

El guión cita tablas (`scene_camera`, `scene_annotations`, `style_presets`, etc.). Antes de implementar cada flujo:

1. **Verificar** en migraciones Supabase que la tabla y columnas existen.
2. Si el código actual usa **JSON en `scenes`** para cámara en lugar de tabla dedicada, **documentar la fuente de verdad** y ajustar el guión o el schema (decisión de arquitectura).

Recomendación: mantener una **matriz “flujo del guión ↔ tabla real”** en `docs/v6/DB/` actualizada cuando cambie el esquema.

---

## 7. Mejoras transversales (producto + IA)

1. **Telemetría:** eventos `disambiguation_started`, `slot_filled`, `action_confirmed`, `navigate_from_chat` para medir fricción.
2. **Tests de prompt:** casos fijos (fixtures de `ChatContextV2`) esperando presencia de `[OPTIONS]` o preguntas con nombres reales.
3. **Fallback de incomprensión** (§2.5, §8.2): siempre 3–4 sugerencias **contextuales** por `page`, no genéricas globales.
4. **Errores** (§8.3): plantilla única con `{acción}`, `{error}`, `{causa}`, chips “Reintentar” / “Configuración”.
5. **Proactividad** (§7): job o hook al cargar proyecto que calcule “quick wins” y los inyecte como **hint** opcional en el system prompt (no spam en cada mensaje).

---

## 8. Entregables documentales sugeridos

| Documento | Propósito |
|-----------|-----------|
| `ChatContextV2` OpenAPI o TypeScript compartido | Contrato único cliente/servidor |
| Matriz intents ↔ rutas ↔ permisos | Evitar navegación rota |
| Catálogo SQL aprobado para el asistente | Seguridad y rendimiento |
| Guía de redacción para prompts de sistema | Mantener tono §8 |

---

## 9. Conclusión

El guión V2 es **implementable por capas**: primero **contexto + desambiguación con datos reales**, luego **tareas y comandos de prioridad**, después **ideación y generación con preflight de APIs**. La condición de éxito es que la IA **nunca confunda inferencia con certeza**: cuando falte un ID, el producto debe ofrecer **elección explícita** alineada con las consultas del guión, y la UI debe respetar la secuencia **THINK → STREAM → componente → sugerencias** para mantener coherencia con la experiencia profesional definida en UX.

---

*Documento generado para acompañar `kiyoko-guion-interaccion-completo.md`. Actualizar al cerrar cada fase del roadmap.*
