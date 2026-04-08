# Kiyoko AI — Plan de Mejora del Chat IA

> El chat es el corazón de la app. Debe ser perfecto, natural, y útil.
> Este documento detalla EXACTAMENTE qué mejorar y cómo.

---

## Estado actual

### Lo que funciona bien
- ✅ 10 agentes especializados con routing inteligente
- ✅ 12+ tipos de bloques interactivos (ACTION_PLAN, SCENE_PLAN, PROMPT_PREVIEW, etc.)
- ✅ Sistema de ejecución de acciones con undo
- ✅ Creation cards para personajes, fondos, videos, proyectos
- ✅ Streaming de mensajes con Vercel AI SDK
- ✅ Contexto de navegación (proyecto, video, escena)
- ✅ Sugerencias follow-up con animación staggered
- ✅ Panel redimensionable (sidebar, floating, fullscreen)
- ✅ Historial de conversaciones en DB

### Lo que falta o es mejorable

| Problema | Impacto | Prioridad |
|----------|---------|-----------|
| **No hay mensaje de bienvenida contextual** | El usuario no sabe qué puede hacer | CRÍTICA |
| **No detecta cambio de escena** | Si pulso en otra escena, el chat no se entera | CRÍTICA |
| **Sin animación de entrada en mensajes** | Los mensajes aparecen de golpe | ALTA |
| **Sin typing dots** | No hay indicador visual de "pensando" antes de escribir | ALTA |
| **Widgets sin animación** | ACTION_PLAN aparece de golpe, no desliza | ALTA |
| **Sin opciones al abrir por escena** | Debería mostrar: "¿Qué quieres hacer con esta escena?" | ALTA |
| **Context strip invisible** | Está dentro de un popover, no siempre visible | MEDIA |
| **Sin skeleton de carga** | Al abrir no hay loader | MEDIA |
| **Prompts no formateados** | PROMPT_PREVIEW es texto plano | MEDIA |

---

## Mejoras detalladas

### 1. Mensaje de bienvenida contextual (CRÍTICA)

**Problema:** Al abrir el chat, muestra un empty state genérico con quick actions.

**Solución:** Cuando el chat se abre desde un contexto específico, mostrar un mensaje de bienvenida personalizado:

#### Desde Dashboard:
```
✨ Kiyoko AI — Tu directora creativa

¿En qué puedo ayudarte hoy?

[Crear nuevo proyecto]  [Resumen del workspace]
[Revisar tareas]        [Ideas para contenido]
```

#### Desde Video (storyboard):
```
✨ Estás en "Presentación Domenech — YouTube 90s"
   16 escenas · 90s · Creando prompts

¿Qué necesitas?

[Generar escenas]         [Mejorar todos los prompts]
[Analizar el storyboard]  [Generar narración]
```

#### Desde Escena (botón "Chat IA"):
```
✨ Escena #1 "Cold open: tijeras ASMR"
   5s · hook · extreme_close_up · static

📷 Prompt imagen: Pixar 3D animation style...
🎥 Prompt video: Starting from the still frame...

¿Qué quieres hacer?

[Mejorar prompts]     [Cambiar cámara]
[Extender escena]     [Regenerar todo]
```

**Implementación:**
- Modificar `KiyokoEmptyState.tsx` para mostrar datos reales de la escena
- Cuando `contextLevel === 'scene'` y hay `sceneDetail`, mostrar los prompts actuales
- Quick actions dinámicas según el estado de la escena (con/sin prompts)

---

### 2. Detección de cambio de contexto (CRÍTICA)

**Problema:** Si el usuario tiene el chat abierto y pulsa en otra escena en el sidebar, el chat no se actualiza.

**Solución:** Detectar cambios de `sceneId` y mostrar un mensaje de transición:

```
── Has cambiado a escena #3 "Fachada exterior — dolly-in" ──

6s · build · low_angle · dolly_in
📷 Prompt: Pixar 3D animation style, modern hair salon...
🎵 Música: sí · SFX: sí

¿Qué quieres hacer con esta escena?

[Mejorar prompts]  [Cambiar cámara]  [Ver desglose temporal]
```

**Implementación:**
```typescript
// En KiyokoChat.tsx o useKiyokoChat.ts
const prevSceneId = useRef(sceneId);

useEffect(() => {
  if (sceneId && sceneId !== prevSceneId.current) {
    prevSceneId.current = sceneId;
    // Insertar mensaje del sistema indicando cambio de contexto
    addSystemMessage({
      type: 'context_change',
      content: `Has cambiado a escena #${sceneNumber} "${sceneTitle}"`,
      sceneDetail: currentSceneDetail,
    });
  }
}, [sceneId]);
```

---

### 3. Animaciones de mensajes (ALTA)

**Problema:** Los mensajes aparecen de golpe, sin transición.

**Solución:** Cada mensaje nuevo entra con fade-in + slide-up:

```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <ChatMessage ... />
</motion.div>
```

**Para widgets/bloques:** Entrada con spring más marcada:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>
  <ActionPlanCard ... />
</motion.div>
```

---

### 4. Typing indicator (ALTA)

**Problema:** No hay indicador visual de "pensando" antes de que el texto empiece a llegar.

**Solución:** Mostrar 3 dots pulsantes (como WhatsApp/iMessage) durante la fase "think":

```tsx
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
```

Mostrar ANTES del primer token de texto. Reemplazar cuando empieza el stream.

---

### 5. Widget opciones estilo Claude (ALTA)

**Problema:** Las opciones se muestran como texto plano o botones simples.

**Solución:** Crear widgets interactivos estilo Claude/ChatGPT:

#### Widget de pregunta con opciones:
```
┌──────────────────────────────────────────────┐
│  ¿Qué ángulo de cámara prefieres?            │
│                                               │
│  ○ Cinematográfico (low_angle + crane)        │
│    Da poder y grandeza al sujeto              │
│                                               │
│  ○ Íntimo (close_up + static)                 │
│    Conecta emocionalmente                     │
│                                               │
│  ○ Dinámico (medium + tracking)                │
│    Energía y movimiento                       │
│                                               │
│  [Aplicar selección]                          │
└──────────────────────────────────────────────┘
```

#### Widget de comparación antes/después:
```
┌──────────────────────────────────────────────┐
│  Cambios en escena #3                         │
│                                               │
│  ANTES              →  DESPUÉS                │
│  wide shot             close_up               │
│  dolly_in              crane                  │
│  Música: sí            Música: no             │
│                                               │
│  [Aplicar]  [Descartar]  [Modificar]          │
└──────────────────────────────────────────────┘
```

#### Widget de escena (preview):
```
┌──────────────────────────────────────────────┐
│  #3  Fachada exterior — dolly-in    build 6s │
│                                               │
│  📝 Cámara avanza hacia la entrada del salón  │
│  📷 low_angle · dolly_in                      │
│  🎵 Música: sí · SFX: sí                      │
│  👤 Sin personajes asignados                  │
│                                               │
│  [Ver prompts] [Editar] [Copiar]              │
└──────────────────────────────────────────────┘
```

---

### 6. Context strip siempre visible (MEDIA)

**Problema:** El contexto actual está oculto en un popover.

**Solución:** Mostrar una barra fina debajo del header:

```
┌───────────────────────────────────────────┐
│  📍 Escena #1 · Cold open · 5s · hook     │
└───────────────────────────────────────────┘
```

Click para expandir el detalle completo. Cambia automáticamente al navegar.

---

### 7. Quick actions por contexto (ALTA)

Los chips de acción rápida deben cambiar según el contexto actual:

#### Sin escena activa (nivel video):
```
[Generar todas las escenas]  [Analizar storyboard]
[Copiar todos los prompts]   [Generar narración]
```

#### Con escena activa:
```
[Mejorar prompts]     [Cambiar cámara]
[Extender escena]     [Añadir personaje]
[Regenerar todo]      [Generar timeline]
```

#### Escena sin prompts:
```
[Generar prompts]     [Describir la escena]
[Sugerir cámara]      [Asignar personaje]
```

#### Escena con prompts:
```
[Mejorar prompt imagen]  [Mejorar prompt video]
[Copiar ambos prompts]   [Extender escena]
```

---

### 8. Respuestas con formato markdown mejorado (MEDIA)

El chat ya renderiza markdown pero debe mejorar:

- **Negritas** → `font-semibold text-foreground` (más visible)
- **Bullets** → con dot de color primary, no plain text
- **Código/prompts** → fondo `bg-muted` con botón copiar
- **Emojis de sección** → tamaño mayor, como headers
- **Separadores** → línea fina entre secciones

---

### 9. Prompt preview mejorado (MEDIA)

Cuando la IA muestra un prompt preview:

```
┌──────────────────────────────────────────────┐
│  PROMPT IMAGEN  v2                    [IMG]   │
│ ┌────────────────────────────────────────┐   │
│ │ Highly detailed Pixar-style 3D        │   │
│ │ animated scene, cinematic 16:9, 8K.   │   │
│ │ Wide shot grass football field...     │   │
│ └────────────────────────────────────────┘   │
│  [Actualizar] [Copiar] [Descartar]           │
│                                               │
│  PROMPT VIDEO  v2                     [VID]   │
│ ┌────────────────────────────────────────┐   │
│ │ 10-second Pixar-quality 3D animation. │   │
│ │ Start from uploaded image. Single...  │   │
│ └────────────────────────────────────────┘   │
│  [Actualizar] [Copiar] [Descartar]           │
└──────────────────────────────────────────────┘
```

Cada prompt con:
- Badge de tipo (IMG/VID) con color
- Versión (v1, v2, v3...)
- Texto en monospace con fondo oscuro
- Botones: Actualizar (guarda en DB) | Copiar (clipboard) | Descartar

---

## Plan de implementación

### Fase 1: Welcome + Context Change (2-3 días)
1. Mensaje de bienvenida contextual en `KiyokoEmptyState.tsx`
2. Detección de cambio de escena en `useKiyokoChat.ts`
3. Quick actions dinámicas por contexto

### Fase 2: Animaciones (1-2 días)
4. Fade-in en mensajes nuevos
5. Typing dots antes del stream
6. Spring animation en widgets/bloques
7. Context strip visible debajo del header

### Fase 3: Widgets mejorados (2-3 días)
8. Widget de opciones estilo Claude (radio buttons)
9. Widget de comparación antes/después
10. Widget de escena (preview card)
11. Prompt preview con botones Actualizar/Copiar/Descartar

### Fase 4: Polish (1-2 días)
12. Markdown rendering mejorado
13. Skeleton de carga al abrir
14. Transición suave entre modos (sidebar/floating/fullscreen)
15. Mobile responsiveness

---

*Generado por Claude Code — Abril 2026*
