# Kiyoko AI — Plan de Renovación de la IA

> Basado en las decisiones del usuario. Documento definitivo.

---

## 1. Cambios en dónde aparece la IA

### Quitar
| Dónde | Qué quitar | Por qué |
|-------|-----------|---------|
| **Header** | Botón IA del navbar | Se accede por el botón flotante o integrado |
| **Dashboard** | Chat sidebar + 3 botones de asistente | Reemplazar por "Analizar workspace" real |
| **Settings** | Chat disponible | No aporta valor |
| **Tareas** | Chat disponible | Mejor crear con modal |
| **Exportar** | Chat disponible | Exportar es mecánico |
| **Compartir** | Chat disponible | Compartir es mecánico |

### Mantener
| Dónde | Cómo | Para qué |
|-------|------|----------|
| **Video Overview** | Integrado + flotante | Generar/editar escenas |
| **Scene Detail** | Integrado + flotante | Mejorar prompts, cambiar cámara |
| **Personajes** | Integrado + flotante | Generar personajes |
| **Fondos** | Integrado + flotante | Generar fondos |
| **Narración** | Integrado + flotante | Generar texto + audio |
| **Publicaciones** | Integrado + flotante | Captions, hashtags, calendario |
| **Análisis** | Botón "Analizar" | Score + sugerencias |
| **Timeline** | Botones "Generar arco/desglose" | Estructura narrativa |

### Nuevo
| Dónde | Qué | Detalle |
|-------|-----|---------|
| **Dashboard** | Botón "Analizar workspace" | Un solo botón que llama API real |
| **Publicaciones** | Organizador completo | Calendario, horarios, tipos de contenido |

---

## 2. Cómo funciona la generación de escenas

### Flujo actual (mock)
```
Usuario describe → genera todo de golpe → muestra cards
```

### Flujo nuevo (interactivo)
```
Usuario describe
  ↓
¿Quieres que genere todas las escenas sin preguntar,
o prefieres revisarlas una por una?

  [Generar todas]        [Una por una]
       ↓                       ↓
  Genera todas           Escena 1:
  de golpe               "Gancho visual — 3s"
  (como ahora)           Descripción de lo que pasa...
                         ¿Cambiar algo?
                         [OK, siguiente] [Cambiar]
                              ↓
                         Escena 2:
                         "Presentación — 7s"
                         ...
```

### Implementación
En SceneGeneratorModal, después de que la IA genera las escenas:

1. Mostrar pregunta: "¿Generar todas de golpe o revisar una por una?"
2. Si "todas" → comportamiento actual (mostrar todas en panel derecho)
3. Si "una por una" → mostrar solo la primera escena, con botones:
   - "OK, siguiente" → muestra la siguiente
   - "Cambiar" → abre input para pedir cambios
   - "Saltar al final" → muestra todas las restantes

---

## 3. Historial de chat por escena

### Estructura
```
Proyecto
├── Video 1
│   ├── Conversación: "Generación de escenas" (todas las escenas)
│   ├── Escena #1: historial de ediciones
│   ├── Escena #2: historial de ediciones
│   └── Escena #3: historial de ediciones
└── Video 2
    └── ...
```

### Implementación
En `ai_conversations` añadir:
- `scene_id` (nullable) — si la conversación es sobre una escena específica
- `conversation_type`: 'generation' | 'scene_edit' | 'general'

Al abrir chat desde una escena:
1. Buscar conversaciones existentes para esa escena
2. Cargar la más reciente
3. Mostrar historial previo

---

## 4. Dashboard — "Analizar workspace"

### Diseño
```
┌──────────────────────────────────────────────┐
│  [✨ Analizar workspace con IA]               │
│                                               │
│  (al pulsar, aparece card con resultado)      │
│                                               │
│  📊 Estado del workspace                      │
│  1 proyecto activo, 3 videos, 16 escenas     │
│  12 escenas con prompts (75%)                 │
│  2 tareas vencidas                            │
│                                               │
│  💡 Recomendaciones                            │
│  • Completar prompts de las 4 escenas faltantes│
│  • Revisar escena #8 (transición brusca)      │
│  • Generar narración para "Presentación..."   │
│                                               │
│  ⚡ Siguiente acción                           │
│  Ir a generar prompts para escenas 9-12       │
│  [Ir ahora →]                                 │
└──────────────────────────────────────────────┘
```

---

## 5. Publicaciones — Sistema completo

### Funcionalidades IA

| Feature | API | Descripción |
|---------|-----|-------------|
| **Generar caption** | `/api/ai/generate-publication-content` | Texto optimizado por plataforma |
| **Generar hashtags** | Mismo endpoint | 10-15 hashtags relevantes |
| **Sugerir tipo de contenido** | Nuevo endpoint | "Para tu peluquería, recomiendo: 3 reels/semana + 2 carruseles" |
| **Generar prompt de imagen** | Nuevo o reutilizar `/generate-scene-prompts` | "Genera una foto para Instagram mostrando..." |
| **Analizar perfil** | Nuevo endpoint | "Tu perfil de Instagram podría mejorar si..." |
| **Calendario inteligente** | Nuevo endpoint | "Mejor horario para publicar: martes 12:00, jueves 18:00" |

### Organizador de publicaciones

```
┌──────────────────────────────────────────────┐
│  📅 Calendario de publicaciones               │
│                                               │
│  Lunes 14    Martes 15    Miércoles 16       │
│  ─────────   ──────────   ──────────────     │
│              📷 Reel      📷 Carrusel        │
│              12:00        18:00              │
│              Instagram    Instagram          │
│                                               │
│  Jueves 17   Viernes 18                      │
│  ──────────  ──────────                      │
│  📹 Video    📷 Post                         │
│  YouTube     TikTok                          │
│  15:00       20:00                           │
│                                               │
│  [+ Nueva publicación]  [✨ Generar calendario]│
└──────────────────────────────────────────────┘
```

### Upload de imágenes para publicaciones
- Drag&drop en la publicación
- Se guardan en Supabase Storage
- Se muestran en el preview mockup
- Se organizan por fecha y plataforma

---

## 6. Cambios técnicos necesarios

### Sprint 1 — Quitar IA donde no aporta
1. Quitar botón IA del Header (todas las páginas)
2. Quitar chat sidebar de Dashboard, Settings, Tareas, Exportar, Compartir
3. Convertir asistente Dashboard en botón "Analizar" que llama API real
4. Mantener botón flotante solo en páginas de producción

### Sprint 2 — Mejorar generación de escenas
5. Añadir modo "una por una" al SceneGeneratorModal
6. La IA explica qué pasa en cada escena antes de crearla
7. Opción de velocidad: "todas de golpe" vs "revisar una por una"

### Sprint 3 — Historial por escena
8. Añadir `scene_id` y `conversation_type` a `ai_conversations`
9. Cargar historial al abrir chat en una escena
10. Mostrar historial previo

### Sprint 4 — Publicaciones completo
11. Calendario visual (grid por días)
12. Upload de imágenes para publicaciones
13. API para sugerir tipo de contenido
14. API para analizar perfil
15. API para calendario inteligente
16. Organizador: qué subir, cuándo, dónde

---

*Generado por Claude Code — Abril 2026*
