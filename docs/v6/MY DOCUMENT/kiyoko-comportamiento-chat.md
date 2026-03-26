# Kiyoko AI — Guía de comportamiento del chat

> Este documento define **cómo debe actuar la IA** en cada situación del chat. Es la referencia para que Claude Code (o cualquier LLM) sepa exactamente qué texto escribir, qué componente mostrar, y qué sugerencias ofrecer según el contexto.

---

## 1. Regla de oro: SIEMPRE texto primero, componente después

La IA **nunca** muestra un componente en seco. Siempre hay una frase introductoria que aparece con efecto typewriter **antes** de que el componente se renderice.

### Secuencia obligatoria

```
1. Usuario envía mensaje
2. THINK: dots pulsantes (800-1200ms)
3. STREAM: texto typewriter de la IA (la "frase intro")
4. Pausa (300ms)
5. COMPONENTE: se renderiza debajo del texto
6. SUGERENCIAS: aparecen debajo del componente (stagger 50ms entre cada una)
```

### Nunca hacer

- ❌ Mostrar componente sin texto previo
- ❌ Mostrar texto genérico como "Aquí tienes" — debe ser específico
- ❌ Mostrar componente mientras el texto aún está en streaming
- ❌ Mostrar sugerencias antes de que el componente termine de animar

---

## 2. Frases intro por tipo de acción

La frase intro debe sonar natural, como si un director creativo le hablara a un colega. Varía el texto para no repetir.

### 2.1 Crear entidades (abren dock)

| Acción | Frases posibles (rotar) |
|--------|------------------------|
| Crear personaje | "Perfecto, preparo el formulario de creación." / "Vamos a dar vida a ese personaje." / "Abro el editor, relleno lo que me has dicho." |
| Crear fondo | "Genial, abro el editor de locaciones." / "Vamos a diseñar esa locación." / "Preparo el formulario del fondo." |
| Crear video | "Configuro el nuevo video." / "Vamos a montar esta secuencia." / "Abro el editor de video." |
| Elije dirección | "Necesito que elijas una dirección para continuar." / "Antes de seguir, necesito tu opinión sobre el tono." |

### 2.2 Mostrar información (abren componente inline)

| Acción | Frases posibles |
|--------|----------------|
| Ver personaje (detalle) | "Aquí tienes toda la información de **{nombre}**:" / "Este es el perfil completo de **{nombre}**:" |
| Ver personajes (lista) | "Estos son los personajes del proyecto:" / "Aquí tienes el casting completo:" |
| Ver fondo (detalle) | "Estos son los detalles de **{nombre}**:" / "Aquí tienes la locación completa:" |
| Ver fondos (lista) | "Estas son las locaciones disponibles:" / "Fondos del proyecto:" |
| Resumen proyecto | "Este es el estado actual de **{nombre proyecto}**:" / "Resumen general del proyecto:" |
| Resumen video | "Estado actual del video:" / "Así va **{nombre video}**:" |
| Plan de escenas | "Este es el plan narrativo:" / "Estructura de escenas del video:" |
| Detalle escena | "Detalles de la escena **#{número}**:" / "Aquí tienes la escena **{nombre}**:" |
| Storyboard | "Storyboard visual del video:" / "Vista en cuadrícula de todas las escenas:" |
| Tareas | "Tareas del proyecto:" / "Tu backlog actual:" |

### 2.3 Generar con IA

| Acción | Frases posibles |
|--------|----------------|
| Prompt de imagen | "He generado el prompt visual para la escena:" / "Prompt listo, revísalo y edita lo que necesites:" |
| Regenerar prompt | "He regenerado el prompt con nuevos parámetros:" / "Nueva versión del prompt:" |
| Analizar pacing | "He analizado el ritmo de la escena a fondo:" / "Análisis completo con sugerencias:" |
| Mejorar con IA | "He encontrado estas oportunidades de mejora:" / "Sugerencias basadas en el análisis:" |
| Comparar cambios | "Aquí tienes la comparación antes/después:" / "Estos son los cambios aplicados:" |

### 2.4 Herramientas

| Acción | Frases posibles |
|--------|----------------|
| Cámara / plano | "Estos son los tipos de plano disponibles para la escena:" / "Elige el encuadre:" |
| Paleta de color | "Paleta de color del proyecto:" / "Estos son los colores principales:" |
| Música | "Audio y música del video:" / "Estas son las pistas disponibles:" |
| Exportar | "Iniciando el proceso de exportación:" / "Exportando el video, esto tardará unos segundos:" |
| Casting | "Casting por escena:" / "Asignaciones de personajes y fondos:" |
| Imágenes referencia | "Galería de referencias visuales:" / "Aquí puedes gestionar las imágenes de referencia:" |

---

## 3. Detección de contexto

La IA debe saber **dónde está el usuario** y adaptar todo: las sugerencias, el tono, y los componentes que ofrece.

### 3.1 Niveles de contexto

```
Dashboard (sin proyecto abierto)
  └── Proyecto (dentro de un proyecto)
       └── Video (dentro de un video del proyecto)
            └── Escena (dentro de una escena del video)
```

### 3.2 Cómo detectar el contexto

| Señal | Contexto |
|-------|----------|
| No hay proyecto activo | `dashboard` |
| Hay proyecto activo, no hay video seleccionado | `project` |
| Hay video seleccionado, no hay escena seleccionada | `video` |
| Hay escena seleccionada | `scene` |

### 3.3 Qué cambia según el contexto

| Aspecto | Dashboard | Proyecto | Video | Escena |
|---------|-----------|----------|-------|--------|
| Placeholder del input | "Escribe aquí (dashboard)..." | "Escribe aquí ({nombre proyecto})..." | "Escribe aquí ({nombre video})..." | "Escribe aquí (Escena #{n})..." |
| Acciones del popover `+` | Crear proyecto, personaje, fondo | Crear video/personaje/fondo, ver recursos, planificar | Escenas, generar, recursos del video | Editar escena, generar IA, análisis |
| Sugerencias post-acción | Genéricas del proyecto | Específicas del proyecto | Específicas del video | Específicas de la escena |
| Tono de la IA | Bienvenida, orientación | Productivo, organizado | Creativo, técnico | Detallista, preciso |

---

## 4. Sugerencias: cuándo y cuáles mostrar

### 4.1 Regla: siempre hay sugerencias

Después de **cada** respuesta de la IA que incluya un componente, deben aparecer 3-6 sugerencias de siguiente paso. Las sugerencias son botones clickables que envían el texto como si el usuario lo escribiera.

### 4.2 Sugerencias por componente y contexto

#### Después de CREAR personaje (dock → resultado)

```
Contexto: proyecto
  → "Ver personaje"           (abre CharDetail)
  → "Subir imagen referencia" (abre ImageRefBlock)
  → "Generar prompt visual"   (abre PromptPrev)
  → "Crear otro personaje"    (abre dock personaje)
  → "Ver todos los personajes" (abre CharList)
  → "Ver tareas"              (abre TaskBlock)

Contexto: video
  → "Ver personaje"
  → "Asignar a escena"
  → "Ver casting"
  → "Generar prompt"
  → "Plan de escenas"
```

#### Después de CREAR fondo

```
Contexto: proyecto
  → "Ver fondo"
  → "Subir imagen referencia"
  → "Generar prompt visual"
  → "Crear otro fondo"
  → "Ver todos los fondos"

Contexto: video
  → "Ver fondo"
  → "Asignar a escena"
  → "Ver casting"
  → "Paleta de colores"
```

#### Después de CREAR video

```
  → "Plan de escenas"
  → "Storyboard"
  → "Crear personaje"
  → "Casting"
  → "Ver tareas"
```

#### Después de CANCELAR creación

```
  → "Intentar de nuevo"       (reabre el mismo dock)
  → "Hacer otra cosa"         (genérico, limpia contexto)
  → "Ver tareas pendientes"
```

La frase de cancelación debe ser empática:
- "Creación cancelada. Puedes intentarlo cuando quieras."
- "Sin problema, he cancelado la creación. ¿En qué más te ayudo?"

#### Después de VER personaje (CharDetail)

```
Contexto: proyecto
  → "Editar personaje"
  → "Regenerar prompt"
  → "Subir imagen referencia"
  → "Ver en qué escenas aparece"
  → "Ver todos los personajes"

Contexto: escena
  → "Cambiar personaje de la escena"
  → "Regenerar prompt"
  → "Ver fondo de la escena"
  → "Analizar pacing"
```

#### Después de VER lista de personajes (CharList)

```
  → "Ver detalle de {primer personaje sin prompt}"
  → "Crear nuevo personaje"
  → "Ver fondos"
  → "Ver casting"
```

#### Después de VER fondo (BgDetail)

```
  → "Regenerar prompt"
  → "Subir imagen referencia"
  → "Ver paleta de colores"
  → "Ver todos los fondos"
  → "Asignar a escena"
```

#### Después de VER lista de fondos (BgList)

```
  → "Ver detalle de {primer fondo}"
  → "Crear nuevo fondo"
  → "Ver personajes"
  → "Ver storyboard"
```

#### Después de PLAN DE ESCENAS

```
  → "Ver storyboard"
  → "Detalle de escena #1"
  → "Generar prompts"
  → "Casting"
  → "Añadir escena"
```

#### Después de STORYBOARD

```
  → "Ver escena {primera sin imagen}"
  → "Generar prompt para escena sin imagen"
  → "Plan de escenas"
  → "Exportar video"
```

#### Después de ANÁLISIS DE PACING

```
  → "Aplicar todas las sugerencias"
  → "Comparar cambios"
  → "Ver plan de escenas"
  → "Ver detalle de la escena"
```

#### Después de PROMPT GENERADO

```
  → "Regenerar prompt"
  → "Copiar prompt"
  → "Asignar cámara"
  → "Ver imágenes de referencia"
  → "Siguiente escena"
```

#### Después de TAREAS

```
  → "Crear nueva tarea"
  → "Ver resumen del proyecto"
  → "Plan de escenas"
  → "Storyboard"
```

#### Después de EXPORTAR

```
  → "Descargar MP4"
  → "Copiar link"
  → "Ver resumen del proyecto"
  → "Crear nuevo video"
```

#### Después de CASTING

```
  → "Editar asignación de escena #{n}"
  → "Crear nuevo personaje"
  → "Plan de escenas"
  → "Storyboard"
```

#### Después de PALETA DE COLORES

```
  → "Generar nueva paleta con IA"
  → "Exportar CSS"
  → "Ver fondos"
  → "Storyboard"
```

#### Después de MÚSICA

```
  → "Generar música con IA"
  → "Subir audio propio"
  → "Analizar pacing"
  → "Exportar video"
```

#### Después de CÁMARA

```
  → "Aplicar a la escena"
  → "Generar prompt con este plano"
  → "Ver detalle de la escena"
  → "Siguiente escena"
```

#### Después de IMÁGENES DE REFERENCIA

```
  → "Generar imágenes con IA"
  → "Subir desde galería"
  → "Ver detalle de la escena"
  → "Generar prompt"
```

---

## 5. Flujo completo paso a paso (para implementar)

### 5.1 Flujo MOSTRAR componente

```
USUARIO: "Muéstrame los personajes"

1. Añadir burbuja de usuario al chat: "Muéstrame los personajes"
2. Estado → THINK
3. Mostrar dots pulsantes (800ms)
4. Estado → STREAM
5. Typewriter: "Estos son los personajes del proyecto:"
6. Al terminar typewriter → pausa 300ms → Estado → IDLE
7. Renderizar <CharList/> debajo del texto con animación blockIn
8. Las filas del componente aparecen con stagger (50ms entre cada fila)
9. Después del componente, mostrar sugerencias con stagger (50ms entre cada una):
   - "Ver detalle de Kai" (es el que no tiene prompt)
   - "Crear nuevo personaje"
   - "Ver fondos"
   - "Ver casting"
```

### 5.2 Flujo CREAR con dock

```
USUARIO: "Crea al personaje Luna, protagonista, misteriosa y valiente"

1. Burbuja usuario
2. THINK → dots (800ms)
3. STREAM → "Perfecto, voy a crear a Luna. Abro el formulario con los datos que me has dado."
4. Pausa 300ms
5. Estado → DOCK
6. Mensajes se atenúan (opacity 0.2)
7. Dock sube con animación dockIn:
   - Nombre: "Luna" (pre-rellenado)
   - Rol: "Protagonista" (pre-rellenado)
   - Personalidad: [Misteriosa] [Valiente] (chips pre-seleccionados)
   - Prompt visual: vacío (se genera después)
8. Input inferior: disabled, placeholder "Creando..."
9. Usuario revisa y pulsa "Crear personaje"
10. Estado → SAVE
11. Dock cambia a vista de progreso:
    - ✓ Validando datos
    - ⟳ Guardando en base de datos  (spinner)
    - · "Luna" creada
12. Al completar (1.8s total):
    - Estado → DONE
    - Dock se cierra
    - Mensajes vuelven a opacity 1
    - Aparece card de resultado con celebración:
      [L] Luna · character · ✓ Creado y guardado  🎉
    - Sugerencias (stagger):
      → "Ver personaje"
      → "Subir imagen referencia"
      → "Generar prompt visual"
      → "Ver todos los personajes"
      → "Ver tareas"
```

### 5.3 Flujo CANCELAR

```
(Dentro del dock de creación)

USUARIO: pulsa "Cancelar"

1. Dock se cierra inmediatamente
2. Mensajes vuelven a opacity 1
3. Aparece card de cancelación con animación slideLeft:
   [●] Creación cancelada
       Puedes intentarlo de nuevo.
4. NO hay sugerencias automáticas tras cancelar
5. Input vuelve a estado normal, usuario puede escribir lo que quiera
```

### 5.4 Flujo NAVEGAR (usuario pulsa sugerencia)

```
(Después de crear personaje, las sugerencias están visibles)

USUARIO: pulsa "Ver personaje"

1. Se añade burbuja de usuario: "Ver personaje"
2. THINK → dots (800ms)
3. STREAM → "Este es el perfil completo de Luna:"
4. Renderizar <CharDetail/> con stagger en filas
5. Nuevas sugerencias:
   → "Editar personaje"
   → "Regenerar prompt"
   → "Subir imagen referencia"
   → "Ver en qué escenas aparece"
```

---

## 6. Manejo de errores y casos especiales

### 6.1 Usuario pide algo que no existe

```
USUARIO: "Muéstrame el personaje Marcos"

IA: "No he encontrado ningún personaje llamado Marcos en este proyecto. 
     Los personajes disponibles son Juan, Luna y Kai."

Sugerencias:
  → "Ver personaje Juan"
  → "Ver personaje Luna"
  → "Crear personaje Marcos"
```

### 6.2 Usuario pide algo fuera de contexto

```
(Contexto: dashboard, sin proyecto abierto)
USUARIO: "Muéstrame las escenas"

IA: "Para ver escenas necesitas estar dentro de un video. 
     ¿Quieres abrir un proyecto primero?"

Sugerencias:
  → "Ver mis proyectos"
  → "Crear nuevo proyecto"
```

### 6.3 Usuario envía mensaje vacío o ambiguo

```
USUARIO: "hola"

IA: "¡Hola! Soy Kiyoko, tu asistente creativo. 
     ¿En qué te puedo ayudar hoy?"

Sugerencias (según contexto):
  Dashboard → "Crear proyecto", "Ver mis proyectos", "Tareas pendientes"
  Proyecto  → "Ver resumen", "Plan de escenas", "Crear personaje"
  Video     → "Ver storyboard", "Generar prompts", "Analizar pacing"
  Escena    → "Ver detalle", "Generar prompt", "Asignar cámara"
```

### 6.4 Usuario pide varias cosas a la vez

```
USUARIO: "Crea un personaje y un fondo"

IA: "Vamos paso a paso. Empiezo con el personaje y después seguimos con el fondo."

→ Abre dock de personaje
→ Después de crear, sugerencia: "Ahora crear el fondo"
```

---

## 7. Tono y personalidad de Kiyoko

### 7.1 Reglas de tono

- **Directo pero amable**: no usar excesivos "¡", no ser demasiado entusiasta
- **Profesional pero cercano**: como un director creativo que habla con su equipo
- **Conciso**: las frases intro deben ser de 1-2 líneas máximo
- **Nunca genérico**: siempre mencionar el nombre de la entidad, el número de escena, o el dato relevante
- **En español**: todo el UI y las respuestas en español, excepto prompts visuales que van en inglés

### 7.2 Variaciones de texto

Para no repetir siempre lo mismo, la IA debe rotar entre variaciones. Ejemplo para "Ver personajes":

```
Primera vez:  "Estos son los personajes del proyecto:"
Segunda vez:  "Aquí tienes el casting actual:"
Tercera vez:  "Personajes de Project Alpha:"
```

### 7.3 Personalización con datos

Siempre que sea posible, incluir datos reales en la frase:

- ❌ "Aquí tienes la información:"
- ✅ "Aquí tienes el perfil completo de **Juan** — protagonista, 22 años:"
- ❌ "Tareas del proyecto:"  
- ✅ "Tienes **3 tareas pendientes**, la más urgente es para el 26 de marzo:"

---

## 8. Popover del botón `+`

### 8.1 Cuándo aparece

- Al pulsar el botón `+` en la barra inferior del input
- Se cierra al pulsar fuera, al pulsar `+` de nuevo, o al seleccionar una opción

### 8.2 Estructura del popover

```
┌──────────────────────────────────┐
│ ● {Nombre contexto}  [badge]  ✕ │  Header con dot de color
├──────────────────────────────────┤
│ CREAR                            │  Categoría en uppercase 9px
│  [icon] Nuevo video      Desc   │  Items con icono + nombre + desc
│  [icon] Personaje        Desc   │
│  [icon] Fondo            Desc   │
│                                  │
│ VER                              │
│  [icon] Resumen          Desc   │
│  [icon] Ver Juan         Desc   │  ← botón directo a CharDetail
│  [icon] Ver Playa        Desc   │  ← botón directo a BgDetail
│  [icon] Personajes       Desc   │
│                                  │
│ PLANIFICAR                       │
│  [icon] Plan escenas     Desc   │
│  [icon] Storyboard       Desc   │
│  [icon] Casting          Desc   │
│  [icon] Exportar         Desc   │
└──────────────────────────────────┘
```

### 8.3 Contenido del popover según contexto

El popover **debe cambiar completamente** según el contexto. No es un menú fijo.

**Dashboard**: Crear (proyecto, personaje, fondo) + Ver (proyectos, personajes, fondos) + Herramientas (tareas, análisis)

**Proyecto**: Crear (video, personaje, fondo) + Ver (resumen, personajes con "Ver Juan", fondos con "Ver Playa", videos) + Planificar (plan escenas, storyboard, casting, tareas, paleta, exportar)

**Video**: Escenas (plan, detalle, storyboard) + Generar (prompt, cámara, pacing, diff) + Recursos (personajes con detalle, fondos con detalle, casting, música, imágenes ref, exportar)

**Escena**: Editar (detalle, ver personaje, ver fondo) + Generar IA (prompt, cámara, mejorar, imágenes ref) + Análisis (pacing, diff)

### 8.4 Los botones "Ver {nombre}" son directos

Cuando el popover muestra "Ver Juan" o "Ver Playa", al pulsar **no** debe abrir una lista — debe ir **directo** al componente de detalle (`CharDetail` o `BgDetail`). Esto es un atajo para no tener que pasar por la lista.

---

## 9. Mapeo comando → componente

Esta tabla es la referencia definitiva de qué texto del usuario (o qué sugerencia clicada) lleva a qué componente.

| Texto del usuario (contiene) | Componente | Frase intro |
|------------------------------|-----------|-------------|
| "crear personaje" | Dock: Character | "Preparo el formulario de creación." |
| "crear fondo" | Dock: Background | "Abro el editor de locaciones." |
| "crear video" | Dock: Video | "Configuro el nuevo video." |
| "elije" / "elige" | Dock: Elije | "Necesito tu decisión para continuar." |
| "ver personaje" / "detalle de {nombre}" | CharDetail | "Perfil completo de {nombre}:" |
| "personajes" / "casting completo" | CharList | "Personajes del proyecto:" |
| "ver fondo" / "detalle de {nombre}" | BgDetail | "Detalles de {nombre}:" |
| "fondos" / "locaciones" | BgList | "Fondos disponibles:" |
| "detalle escena" / "escena #" | SceneDetail | "Detalle de la escena #{n}:" |
| "plan" / "plan escenas" | ScenePlan | "Plan narrativo del video:" |
| "proyecto" / "resumen proyecto" | ProjectSum | "Estado de {nombre}:" |
| "resumen video" / "estado video" | VideoSum | "Así va {nombre}:" |
| "tareas" / "backlog" | TaskBlock | "Tareas pendientes:" |
| "storyboard" | Storyboard | "Storyboard visual:" |
| "prompt" / "prompt imagen" | PromptPrev | "Prompt generado:" |
| "regenerar" | PromptPrev | "Nueva versión del prompt:" |
| "analiza" / "pacing" / "mejorar" | Analysis | "Análisis de la escena:" |
| "compara" / "diff" / "cambios" | DiffBlock | "Comparación antes/después:" |
| "cámara" / "plano" | CameraBlock | "Tipos de plano:" |
| "paleta" / "colores" | PaletteBlock | "Paleta de color:" |
| "música" / "audio" | MusicBlock | "Música del video:" |
| "exportar" / "render" | ExportBlock | "Exportando..." |
| "casting" / "asignaciones" | CastingBlock | "Casting por escena:" |
| "imagen" / "referencia" / "galería" | ImageRefBlock | "Referencias visuales:" |
| "subir" / "upload" | ImageRefBlock | "Gestor de archivos:" |

---

## 10. Resumen visual de la máquina de estados

```
                    ┌─────────┐
           ┌───────→│  IDLE   │←──────────────────┐
           │        └────┬────┘                    │
           │             │ usuario envía mensaje    │
           │             ▼                          │
           │        ┌─────────┐                    │
           │        │  THINK  │  dots 800ms        │
           │        └────┬────┘                    │
           │             │                          │
           │             ▼                          │
           │        ┌─────────┐                    │
           │        │ STREAM  │  typewriter         │
           │        └────┬────┘                    │
           │             │                          │
           │      ┌──────┼──────┐                  │
           │      │             │                  │
           │      ▼             ▼                  │
           │ (sin dock)    ┌─────────┐             │
           │  → IDLE       │  DOCK   │             │
           │  + componente └────┬────┘             │
           │  + sugerencias     │                  │
           │              ┌─────┼─────┐            │
           │              │           │            │
           │         "Crear"     "Cancelar"        │
           │              │           │            │
           │              ▼           ▼            │
           │        ┌─────────┐  card cancelar     │
           │        │  SAVE   │  → IDLE ───────────┘
           │        └────┬────┘
           │             │ progress steps
           │             ▼
           │        ┌─────────┐
           │        │  DONE   │
           │        └────┬────┘
           │             │ card resultado
           │             │ + sugerencias
           └─────────────┘
```

---

## 11. Checklist para Claude Code

Cuando implementes una nueva acción o componente, verifica:

- [ ] ¿La IA dice algo **antes** de mostrar el componente?
- [ ] ¿La frase incluye **datos reales** (nombre, número, estado)?
- [ ] ¿Después del componente hay **sugerencias** relevantes al contexto?
- [ ] ¿Las sugerencias son **diferentes** según si estamos en dashboard/proyecto/video/escena?
- [ ] ¿Al hacer click en una sugerencia, se **envía como mensaje** del usuario y se repite todo el flujo (think → stream → componente)?
- [ ] ¿El popover del `+` muestra opciones **diferentes** según el contexto?
- [ ] ¿Los componentes tienen **animación stagger** en sus filas?
- [ ] ¿La cancelación muestra **card empática** y devuelve al estado IDLE?
- [ ] ¿El input tiene el **placeholder correcto** según el contexto?
- [ ] ¿El texto de la IA **varía** y no es siempre la misma frase?

---

*Documento de referencia v1. Actualizar cada vez que se añada un componente nuevo o cambie un flujo.*
