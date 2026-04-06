# Kiyoko AI — Documento de Diseno Visual por Pagina

> Especificacion de diseno: como se ve cada pagina con IA contextual integrada.
> Layout, componentes, colores, espaciado, estados, interacciones.
>
> **Stack IA:** Gemini 2.5 Flash (ojos) + Qwen 3.5 via OpenRouter (cerebro) + Voxtral TTS (voz)
> Referencia tecnica: `docs/v6/MY DOCUMENT/guia-director-creativo-stackB.md`
>
> Fecha: 2026-03-30 | Version: 1.1

---

## Indice

1. [Sistema de Diseno Base](#1-sistema-de-diseno-base)
2. [Componentes IA Compartidos](#2-componentes-ia-compartidos)
3. [Dashboard](#3-dashboard)
4. [Nuevo Proyecto (Wizard)](#4-nuevo-proyecto-wizard)
5. [Overview del Proyecto](#5-overview-del-proyecto)
6. [Lista de Videos](#6-lista-de-videos)
7. [Overview del Video](#7-overview-del-video)
8. [Escenas (Board)](#8-escenas-board)
9. [Detalle de Escena](#9-detalle-de-escena)
10. [Storyboard](#10-storyboard)
11. [Timeline](#11-timeline)
12. [Guion / Script](#12-guion--script)
13. [Narracion / TTS](#13-narracion--tts)
14. [Analisis de Video](#14-analisis-de-video)
15. [Exportacion](#15-exportacion)
16. [Derivar Video](#16-derivar-video)
17. [Personajes](#17-personajes)
18. [Detalle de Personaje](#18-detalle-de-personaje)
19. [Fondos / Localizaciones](#19-fondos--localizaciones)
20. [Detalle de Fondo](#20-detalle-de-fondo)
21. [Recursos Hub](#21-recursos-hub)
22. [Tareas](#22-tareas)
23. [Publicaciones](#23-publicaciones)
24. [Nueva Publicacion](#24-nueva-publicacion)
25. [Configuracion del Proyecto](#25-configuracion-del-proyecto)
26. [Configuracion IA](#26-configuracion-ia)

---

## 1. Sistema de Diseno Base

### Tokens que se usan en todo el documento

```
Colores principales:
  --primary:           #006fee (azul)
  --primary/10:        bg-primary/10 (fondo suave azul)
  --secondary:         #7828c8 (purpura)
  --success:           #17c964 (verde)
  --warning:           #f5a524 (ambar)
  --danger:            #f31260 (rosa)

Superficies (light):
  --background:        #ffffff
  --card:              #f9f8f7
  --secondary-surface: #f0efee
  --border:            #e8e7e5
  --foreground:        #111827
  --muted-foreground:  #71717a

Superficies (dark):
  --background:        #191919
  --card:              #202020
  --secondary-surface: #282828
  --border:            #2e2e2e
  --foreground:        #ebebeb
  --muted-foreground:  #a1a1aa

Arcos narrativos:
  Hook:  #EF4444 (red-500)
  Build: #F59E0B (amber-500)
  Peak:  #10B981 (emerald-500)
  Close: #3B82F6 (blue-500)
```

### Tipografia

```
Titulos de pagina:   text-2xl font-semibold tracking-tight
Titulos de seccion:  text-lg font-medium
Subtitulos/labels:   text-sm font-medium text-muted-foreground
Body:                text-sm text-foreground
Caption:             text-xs text-muted-foreground
Micro:               text-[10px] / text-[11px] font-medium
```

### Espaciado consistente

```
Page padding:        p-6 lg:p-8
Section gap:         space-y-6
Card padding:        p-4 (compacto) o p-5/p-6 (normal)
Grid gap:            gap-3 (compacto) o gap-4 (normal)
Form spacing:        space-y-4
Form grid pairs:     grid grid-cols-2 gap-4
```

### Componentes base

```
Card:          rounded-xl border border-border bg-card p-4
               hover:border-primary/30 hover:shadow-md transition-all

Button primary: rounded-lg bg-primary px-4 h-9 text-sm text-white
Button ghost:   text-muted-foreground hover:text-foreground hover:bg-muted
Button outline: border border-border bg-transparent hover:bg-accent

Badge:          rounded-full px-2.5 py-0.5 text-[11px] font-medium
Chip:           rounded-full h-6 px-2 text-xs

Input:          h-10 rounded-lg border border-border bg-background
                px-3 text-sm focus:border-primary focus:outline-none

Textarea:       rounded-lg border border-border bg-background
                px-4 py-3 text-sm leading-relaxed resize-y

Empty state:    flex flex-col items-center justify-center py-20
                icon h-12 w-12 text-muted-foreground/30
                title text-base font-semibold
                desc text-sm text-muted-foreground max-w-xs text-center

Drawer (modal): placement="right", HeroUI Drawer
                Header + Body (scroll) + Footer (sticky buttons)
```

---

## 2. Componentes IA Compartidos

### 2.1 AiAssistBar — Barra de asistencia contextual

Se coloca debajo del header de cada pagina. Es el punto de entrada a la IA.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐                 │
│ │ ✦ Describe lo que necesitas...              │ ← input         │
│ └─────────────────────────────────────────────┘                 │
│ [Accion 1]  [Accion 2]  [Accion 3]  [Accion 4] ← quick actions │
└─────────────────────────────────────────────────────────────────┘
```

**Especificacion visual:**

```
Contenedor exterior:
  rounded-xl border border-border bg-card p-4
  mb-6

Input de texto:
  flex items-center gap-3
  h-10 w-full rounded-lg
  border border-border bg-background
  px-4 text-sm
  placeholder: "text-muted-foreground/60"
  focus: border-primary/50 ring-1 ring-primary/20

  Icono izquierdo: Sparkles (h-4 w-4 text-primary/60)
  Boton derecho:   ArrowUp (h-6 w-6 rounded-md bg-primary text-white)
                   solo visible cuando hay texto

Quick actions (debajo del input, mt-3):
  flex flex-wrap gap-2
  Cada boton:
    h-7 px-3 rounded-full
    text-xs font-medium
    bg-secondary/50 text-muted-foreground
    hover:bg-primary/10 hover:text-primary
    transition-colors
    Icono: h-3.5 w-3.5 mr-1.5
```

**Estados:**

```
Default:     Input vacio, quick actions visibles
Focused:     Input con border-primary, quick actions se mantienen
Loading:     Input disabled, spinner animado reemplaza icono send
             Quick actions ocultas
             Texto: "Generando..." en text-muted-foreground italic
Resultado:   Se abre AiResultDrawer (ver 2.2)
```

**Variacion compacta** (para uso dentro de modales):

```
Sin borde exterior, sin padding
Solo input + boton "Generar con IA"
h-9 en lugar de h-10

┌─────────────────────────────────────────────────┐
│ ✦ Describe tu personaje en una frase...    [IA] │
└─────────────────────────────────────────────────┘
```

---

### 2.2 AiResultDrawer — Panel de resultados IA

Drawer derecho que muestra el resultado de una accion IA. Mismo patron visual que los modales de creacion (ModalShell).

```
┌───────────────────────────────────────┐
│  ✦ Resultado                     [×]  │  ← Header
│───────────────────────────────────────│
│                                       │
│  [Contenido segun tipo de resultado]  │  ← Body (scroll)
│                                       │
│───────────────────────────────────────│
│  [Descartar]  [Editar]  [Aplicar ✓]  │  ← Footer (sticky)
└───────────────────────────────────────┘
```

**Especificacion visual:**

```
Drawer:
  placement="right"
  Ancho: w-[480px] (mismo que modales actuales)

Header:
  flex items-center gap-3 px-6 py-4 border-b border-border
  Icono: Sparkles (h-5 w-5 text-primary)
  Titulo: text-lg font-semibold
  Close: ghost button (X icon) ml-auto

Body:
  px-6 py-4 overflow-y-auto flex-1
  space-y-4

Footer:
  flex items-center justify-end gap-3
  px-6 py-4 border-t border-border bg-card

  Boton descartar: variant="ghost" size="sm"
  Boton editar:    variant="outline" size="sm" (opcional)
  Boton regenerar: variant="outline" size="sm" (RefreshCw icon)
  Boton aplicar:   variant="solid" color="primary" size="sm"
                   (Check icon + "Aplicar")
```

---

### 2.3 Tipos de contenido en AiResultDrawer

#### Tipo: Formulario pre-llenado (`form`)

Para crear personajes, fondos, videos, escenas. La IA genera los campos.

```
┌───────────────────────────────────────┐
│  ✦ Nuevo personaje              [×]   │
│───────────────────────────────────────│
│                                       │
│  Generado por IA ─ edita lo que       │  ← Chip flat primary
│  quieras antes de crear               │     text-xs
│                                       │
│  Nombre ─────────────────────────     │
│  [Detective Ramirez          ]        │  ← input pre-llenado
│                                       │
│  Rol ────────── Visual ──────────     │
│  [Protagonista ▼] [Hombre de 45..]   │  ← grid 2 cols
│                                       │
│  Descripcion ────────────────────     │
│  ┌───────────────────────────────┐    │
│  │ Veterano detective de homici- │    │  ← textarea pre-llenada
│  │ dios con 20 anos de exp...    │    │
│  └───────────────────────────────┘    │
│                                       │
│  Personalidad ───────────────────     │
│  ┌───────────────────────────────┐    │
│  │ Cinico pero con corazon de... │    │
│  └───────────────────────────────┘    │
│                                       │
│  Pelo ───────── Ropa ────────────     │
│  [Canoso, corto] [Gabardina beige]    │
│                                       │
│  Accesorios ─────────────────────     │
│  [Sombrero fedora, reloj de bolsi]    │
│                                       │
│  Color acento ───────────────────     │
│  [■ #8B7355  Beige envejecido   ]     │
│                                       │
│───────────────────────────────────────│
│          [Descartar] [Crear ✓]        │
└───────────────────────────────────────┘
```

**Diferencia visual con formulario manual:**
- Los campos pre-llenados tienen un borde sutil `border-primary/20`
- Un chip `✦ IA` junto al label del campo: `text-[10px] text-primary bg-primary/10 rounded px-1`
- El usuario puede editar cualquier campo libremente
- Footer dice "Crear" en vez de "Aplicar"

---

#### Tipo: Texto generado (`text`)

Para guiones, narraciones, captions, descripciones.

```
┌───────────────────────────────────────┐
│  ✦ Guion generado               [×]   │
│───────────────────────────────────────│
│                                       │
│  ┌───────────────────────────────┐    │
│  │ El sol se asoma tras las      │    │  ← textarea editable
│  │ montanas mientras la camara   │    │     min-h-[200px]
│  │ desciende lentamente hacia    │    │     font-mono (si es prompt)
│  │ la ciudad dormida...          │    │     text-sm leading-relaxed
│  │                               │    │
│  │ NARRADOR: "Cada manana trae   │    │
│  │ una nueva oportunidad..."     │    │
│  └───────────────────────────────┘    │
│                                       │
│  234 palabras · ~28s a 1.0x           │  ← stats
│  text-xs text-muted-foreground        │
│                                       │
│───────────────────────────────────────│
│  [Descartar] [Regenerar ↻] [Usar ✓]  │
└───────────────────────────────────────┘
```

---

#### Tipo: Lista de sugerencias (`suggestions`)

Para analisis, revisiones, mejoras.

```
┌───────────────────────────────────────┐
│  ✦ Sugerencias de mejora        [×]   │
│───────────────────────────────────────│
│                                       │
│  Se encontraron 4 mejoras             │
│                                       │
│  ┌─ ⚠ El hook es demasiado largo ──┐ │  ← card con borde
│  │ Escena 1 dura 8s, deberia ser   │ │     izquierdo amber
│  │ 3-5s para TikTok.               │ │     border-l-4
│  │ Escenas: [1]                     │ │     border-l-amber-500
│  │          [Aplicar automatico ✓]  │ │
│  └──────────────────────────────────┘ │
│                                       │
│  ┌─ ✓ Buena progresion narrativa ──┐ │  ← borde verde
│  │ El arco Build→Peak esta bien    │ │     border-l-emerald-500
│  │ construido.                     │ │
│  └──────────────────────────────────┘ │
│                                       │
│  ┌─ 💡 Falta transicion ───────────┐ │  ← borde azul
│  │ Entre escena 3 y 4 no hay       │ │     border-l-blue-500
│  │ conexion visual.                │ │
│  │          [Generar transicion]    │ │
│  └──────────────────────────────────┘ │
│                                       │
│───────────────────────────────────────│
│       [Cerrar] [Aplicar todas ✓]      │
└───────────────────────────────────────┘
```

---

#### Tipo: Opciones multiples (`options`)

Para elegir entre variantes generadas por la IA.

```
┌───────────────────────────────────────┐
│  ✦ Variantes de caption         [×]   │
│───────────────────────────────────────│
│                                       │
│  Elige la que mas te guste:           │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │ ○ Opcion A                      │ │  ← radio seleccion
│  │ "Corre mas lejos. Siente mas    │ │     rounded-lg border
│  │  rapido. Runner Pro."           │ │     p-3
│  │ #running #fitness #shoes        │ │     hover:border-primary/30
│  └──────────────────────────────────┘ │     selected:
│  ┌──────────────────────────────────┐ │       border-primary
│  │ ● Opcion B                  ← ✓ │ │       bg-primary/5
│  │ "No es solo un zapato. Es una   │ │
│  │  declaracion. #RunnerPro"       │ │
│  │ #sneakers #style #run           │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ ○ Opcion C                      │ │
│  │ "Tu proximo record personal     │ │
│  │  empieza aqui."                 │ │
│  │ #marathon #goals #runner        │ │
│  └──────────────────────────────────┘ │
│                                       │
│───────────────────────────────────────│
│    [Descartar] [Regenerar ↻] [Usar ✓] │
└───────────────────────────────────────┘
```

---

#### Tipo: Plan de acciones (`plan`)

Para operaciones masivas: generar escenas, asignar recursos, etc.

```
┌───────────────────────────────────────┐
│  ✦ Plan: Generar 6 escenas      [×]   │
│───────────────────────────────────────│
│                                       │
│  La IA creara lo siguiente:           │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │ 1. ● Hook — "Amanecer ciudad"   │ │  ← lista con dot
│  │    3s · Marco + Calle nocturna   │ │     de color por fase
│  │                                  │ │     text-xs muted para
│  │ 2. ● Build — "Preparacion"      │ │     detalles
│  │    5s · Marco + Apartamento      │ │
│  │                                  │ │
│  │ 3. ● Build — "Salida a correr"  │ │
│  │    5s · Marco + Parque           │ │
│  │                                  │ │
│  │ 4. ● Peak — "Sprint final"      │ │
│  │    4s · Marco + Calle comercial  │ │
│  │                                  │ │
│  │ 5. ● Peak — "Victoria"          │ │
│  │    3s · Marco + Meta             │ │
│  │                                  │ │
│  │ 6. ● Close — "Logo y CTA"       │ │
│  │    3s · Logo + Fondo gradient    │ │
│  └──────────────────────────────────┘ │
│                                       │
│  Total: 23s de 30s objetivo           │  ← warning si no cuadra
│  6 escenas · 1 personaje · 5 fondos   │
│                                       │
│───────────────────────────────────────│
│     [Descartar] [Editar] [Crear ✓]    │
└───────────────────────────────────────┘
```

---

### 2.4 AiFieldAssist — Boton de asistencia por campo

Boton pequeno junto a campos individuales en formularios. Genera contenido para ese campo especifico.

```
Nombre [___________________________] [✦]  ← boton cuadrado
                                           h-9 w-9 rounded-lg
                                           border border-border
                                           bg-card
                                           hover:bg-primary/10
                                           hover:border-primary/30
                                           Sparkles h-4 w-4
                                           text-muted-foreground
                                           hover:text-primary
```

**Estado loading:** Spinner reemplaza Sparkles, border-primary/30
**Estado completado:** Check verde fugaz (500ms), luego vuelve a Sparkles

---

## 3. Dashboard

**Ruta:** `/dashboard`

### Layout actual (se mantiene)

```
┌─────────────────────────────────────────────────────────┐
│ Buenos dias, [Nombre]                                   │
│ Gestiona tus proyectos y sigue tu progreso              │
├─────────────────────────────────────────────────────────┤
│ [Proyectos: 5] [Pendientes: 3] [En curso: 2] [Tokens]  │  ← stats grid
├─────────────────────────────────────────────────────────┤
│ ★ NUEVO: AiAssistBar                                    │
├─────────────────────────────────────────────────────────┤
│ Proyectos (5)                [Buscar] [+ Nuevo]         │
│ [Todos] [En curso] [Completados] [Archivados] [Favs]   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ Proyecto1 │ │ Proyecto2 │ │ Proyecto3 │                │
│ └──────────┘ └──────────┘ └──────────┘                 │
├─────────────────────────────────────────────────────────┤
│ Actividad reciente                                      │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ Describe tu idea para un nuevo proyecto...      │   │
│ └───────────────────────────────────────────────────┘   │
│ [Crear proyecto con IA]  [Resumen semanal]  [Ideas]     │
└─────────────────────────────────────────────────────────┘
```

**Quick actions:**
- `Wand2` Crear proyecto con IA → abre AiResultDrawer tipo `form` (proyecto)
- `BarChart3` Resumen semanal → abre AiResultDrawer tipo `text` (resumen)
- `Lightbulb` Ideas de contenido → abre AiResultDrawer tipo `options` (3 ideas)

**Interaccion:**
1. Usuario escribe "Quiero un anuncio de zapatillas deportivas estilo Pixar"
2. Loading state (1-3s)
3. Se abre AiResultDrawer con formulario pre-llenado del proyecto
4. Usuario revisa/edita campos → click "Crear"
5. Proyecto creado, redirige a `/project/[shortId]`

---

## 4. Nuevo Proyecto (Wizard)

**Ruta:** `/new`

### Cambio: De pagina a Modal

El wizard actual se convierte en un modal/drawer grande invocable desde el dashboard.

```
┌───────────────────────────────────────────────────────┐
│  Nuevo Proyecto                                  [×]   │
│───────────────────────────────────────────────────────│
│                                                       │
│  ┌───────────────────────────────────────────────┐    │
│  │ ✦ Describe tu proyecto en una frase...        │    │
│  └───────────────────────────────────────────────┘    │
│  [Generar todo con IA]                                │
│                                                       │
│  ── o completa manualmente ──                         │
│                                                       │
│  Titulo ─────────────────────────────────────         │
│  [                                          ]         │
│                                                       │
│  Descripcion ────────────────────────────────         │
│  ┌───────────────────────────────────────────┐        │
│  │                                           │        │
│  └───────────────────────────────────────────┘        │
│                                                       │
│  Estilo ──────────── Plataforma ─────────────         │
│  [Pixar 3D ▼]        [YouTube ▼]                      │
│                                                       │
│  Cliente ──────────── Tags ──────────────────         │
│  [                ]   [                      ]        │
│                                                       │
│  ── Primer video (opcional) ──                        │
│  ☑ Crear video automaticamente                        │
│  Duracion: [━━━━━━━━━━ 30s]                           │
│                                                       │
│───────────────────────────────────────────────────────│
│                 [Cancelar]  [Crear Proyecto]           │
└───────────────────────────────────────────────────────┘
```

**Flujo con IA:**
1. Usuario escribe "Anuncio de zapatillas Runner Pro, 30s para Instagram, estilo Pixar"
2. Click "Generar todo con IA"
3. Loading state en el input
4. TODOS los campos se rellenan automaticamente con borde `border-primary/20`
5. Chip `✦ IA` aparece junto a cada label rellenado
6. Usuario revisa, edita lo que quiera → "Crear Proyecto"

**Flujo manual:**
- Los campos se llenan a mano
- El boton `[✦]` junto a cada campo permite generar ese campo individual

---

## 5. Overview del Proyecto

**Ruta:** `/project/[shortId]`

### Layout completo

```
┌─────────────────────────────────────────────────────────┐
│ [Cover image hero h-48 rounded-xl con overlay]          │
├─────────────────────────────────────────────────────────┤
│ Proyecto: Titulo del Proyecto            [⚙ Settings]   │
│ Cliente: Nombre · Status: En progreso                    │
│ Estilo: Pixar 3D · Tags: [zapatillas] [deporte]         │
│ Descripcion truncada... [Ver mas]                        │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ [Videos: 3] [Escenas: 16] [Personajes: 6] [Fondos: 5]  │
│ [Tiempo: 2h 30m]                                        │
├─────────────────────────────────────────────────────────┤
│ Videos (3)                            [+ Nuevo video]    │
│ ┌─ Runner Pro — IG Reels — 3/8 escenas ── ████░░░░ ─┐  │
│ ├─ Making Of  — YouTube — 12/12 ────── ████████████ ─┤  │
│ └─ Teaser     — TikTok  — 0/4 ─────── ░░░░░░░░░░░░ ─┘  │
├─────────────────────────────────────────────────────────┤
│ Personajes (6)              Fondos (5)                   │
│ [👤👤👤👤 +2 mas]          [🏞🏞🏞 +2 mas]             │
├─────────────────────────────────────────────────────────┤
│ Actividad reciente                                       │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Overview

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que necesitas para este proyecto?              │   │
│ └───────────────────────────────────────────────────┘   │
│ [Crear video] [Anadir personaje] [Analizar proyecto]    │
│ [Generar escenas] [Sugerir siguiente paso]              │
└─────────────────────────────────────────────────────────┘
```

**Quick actions:**
- `Film` Crear video → AiResultDrawer tipo `form` (video)
- `Users` Anadir personaje → AiResultDrawer tipo `form` (personaje)
- `BarChart3` Analizar proyecto → AiResultDrawer tipo `suggestions`
- `Layers` Generar escenas → pide seleccionar video primero, luego `plan`
- `Compass` Siguiente paso → AiResultDrawer tipo `text` (recomendacion)

---

## 6. Lista de Videos

**Ruta:** `/project/[shortId]/videos`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Videos (3)                              [+ Nuevo video]  │
│ text-lg font-semibold           text-sm text-muted       │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📱 Runner Pro — Instagram Reels                      │ │
│ │    9:16 · 30s · 3/8 escenas · Borrador              │ │
│ │    ████░░░░░░░░                           [⋮]       │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📺 Making Of — YouTube                              │ │
│ │    16:9 · 3min · 12/12 escenas · Aprobado           │ │
│ │    ████████████████████████████            [⋮]       │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📱 Teaser — TikTok                                  │ │
│ │    9:16 · 15s · 0/4 escenas · Borrador              │ │
│ │    ░░░░░░░░░░░░░░░░░░░░░░░░              [⋮]       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Videos

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ Describe tu idea de video...                    │   │
│ └───────────────────────────────────────────────────┘   │
│ [Crear video con IA]  [Adaptar existente]  [Serie IA]   │
└─────────────────────────────────────────────────────────┘
```

### Modal mejorado: VideoCreateModal + IA

```
┌───────────────────────────────────────────────────┐
│  Nuevo Video                                 [×]   │
│───────────────────────────────────────────────────│
│                                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ ✦ Un anuncio dinamico de zapatillas...    │    │  ← input IA
│  └───────────────────────────────────────────┘    │
│  [Generar con IA]                                 │
│                                                   │
│  ── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ── separador
│                                                   │
│  Titulo *                                         │
│  [Zapatillas Runner Pro         ] [✦]             │  ← con AiFieldAssist
│                                                   │
│  Plataforma ─────── Duracion ────────             │
│  [Instagram Reels▼]  [30 segundos ▼]             │
│                                                   │
│  Relacion de aspecto                              │
│  9:16 (vertical)  ← auto por plataforma           │
│  text-xs muted                                    │
│                                                   │
│  Descripcion                                      │
│  ┌───────────────────────────────────────┐        │
│  │ Spot dinamico mostrando las nuevas... │ [✦]    │
│  │ Ayuda a la IA a generar mejor.        │        │
│  └───────────────────────────────────────┘        │
│                                                   │
│  ☐ Generar escenas automaticamente                │  ← NUEVO checkbox
│                                                   │
│───────────────────────────────────────────────────│
│              [Cancelar]  [Crear Video]            │
└───────────────────────────────────────────────────┘
```

**Styling de campo pre-llenado por IA:**
```
border-primary/20 bg-primary/5
Label tiene chip: ✦ IA (text-[10px] bg-primary/10 text-primary rounded px-1 ml-1)
```

---

## 7. Overview del Video

**Ruta:** `/project/[shortId]/video/[videoShortId]`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🎬 Runner Pro — Instagram Reels                         │
│    9:16 · 30s · Borrador                                │
├─────────────────────────────────────────────────────────┤
│ [Escenas: 8] [Aprobadas: 3] [Objetivo: 30s] [Actual: 23s]│
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ Arco narrativo                                           │
│ [██ Hook ██████ Build █████ Peak ████ Close]              │
├─────────────────────────────────────────────────────────┤
│ Escenas   [Storyboard] [Lista] [Tabla] [Timeline]       │
│           Filtro fase: [Todas ▼]  Status: [Todos ▼]     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                            │
│ │ S1 │ │ S2 │ │ S3 │ │ S4 │  ...                       │
│ └────┘ └────┘ └────┘ └────┘                            │
├─────────────────────────────────────────────────────────┤
│ Acciones rapidas                                         │
│ [Escenas] [Timeline] [Narracion] [Analisis] [Share] [Export]│
├─────────────────────────────────────────────────────────┤
│ Descripcion del video                                    │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Video

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que necesitas para este video?                 │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar escenas] [Generar prompts] [Completar arco]    │
│ [Equilibrar tiempos] [Asignar personajes] [Revisar]     │
└─────────────────────────────────────────────────────────┘
```

**Interacciones clave:**
- "Generar escenas" → AiResultDrawer tipo `plan` con 6-8 escenas propuestas
- "Generar prompts" → AiResultDrawer tipo `plan` con prompts para cada escena
- "Revisar" → AiResultDrawer tipo `suggestions` con analisis del video

---

## 8. Escenas (Board)

**Ruta:** `/project/[shortId]/video/[videoShortId]/scenes`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Escenas (8)                                              │
│ 8 escenas · 23s total · objetivo 30s                     │
│                     [Grid] [Lista] [Timeline] [+ Nueva]  │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ Vista Grid:                                              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │  1  │ │  2  │ │  3  │ │  4  │ │  5  │               │
│ │ 3s  │ │ 5s  │ │ 4s  │ │ 3s  │ │ 5s  │               │
│ │Hook │ │Build│ │Build│ │Peak │ │Peak │               │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘               │
│ ┌─────┐ ┌─────┐ ┌─────┐                                │
│ │  6  │ │  7  │ │  8  │                                │
│ │ 2s  │ │ 3s  │ │ 3s  │                                │
│ │Close│ │Close│ │Close│                                │
│ └─────┘ └─────┘ └─────┘                                │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Escenas

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ Describe una escena o lo que necesitas...       │   │
│ └───────────────────────────────────────────────────┘   │
│ [Auto-planificar] [Generar prompts ×8] [Mejorar todas]  │
│ [Reordenar IA] [Detectar duplicados]                    │
└─────────────────────────────────────────────────────────┘
```

### SceneCard con acciones IA

Cada SceneCard en el grid muestra un menu de acciones al hover:

```
┌──────────────────────────┐
│ [1] Hook           3s    │  ← badge numero + fase + duracion
│ ┌──────────────────────┐ │
│ │                      │ │  ← thumbnail o placeholder
│ │    [Film icon]       │ │     aspect-video bg-muted
│ │                      │ │
│ │  [IMG] [VID]         │ │  ← badges si tiene prompts
│ └──────────────────────┘ │
│ Amanecer en la ciudad    │  ← titulo (line-clamp-1)
│ "Cada manana..."         │  ← dialogo (line-clamp-1, italic)
│ 👤 Marco · 🏞 Calle     │  ← personajes + fondo
│ ● Borrador          [⋮] │  ← status dot + dropdown
│                          │
│ Dropdown menu:           │
│ ┌──────────────────────┐ │
│ │ 👁 Ver detalle       │ │
│ │ ✏️ Editar            │ │
│ │ ── ── ── ── ── ── ──│ │
│ │ ✦ Mejorar con IA     │ │  ← ACCION IA
│ │ ✦ Generar prompt     │ │  ← ACCION IA
│ │ ✦ Sugerir camara     │ │  ← ACCION IA
│ │ ── ── ── ── ── ── ──│ │
│ │ 📋 Duplicar          │ │
│ │ 🗑 Eliminar          │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

**Styling de acciones IA en dropdown:**
```
Grupo IA separado por Separator
Cada item IA tiene:
  Sparkles icon (h-4 w-4 text-primary)
  text-sm
  hover:bg-primary/5
```

### Modal mejorado: SceneCreateModal + IA

```
┌───────────────────────────────────────────────────┐
│  Nueva Escena (#9)                           [×]   │
│───────────────────────────────────────────────────│
│                                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ ✦ El protagonista corre bajo la lluvia    │    │
│  │   hacia la meta final...                  │    │
│  └───────────────────────────────────────────┘    │
│  [Generar con IA]                                 │
│                                                   │
│  ── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ── separador   │
│                                                   │
│  Titulo *                                         │
│  [Escena 9 — Sprint final      ] [✦]             │
│                                                   │
│  Fase ──────────── Tipo ─────────────             │
│  [Peak ▼]          [Original ▼]                   │
│                                                   │
│  Duracion                                         │
│  [━━━━━━━━━━━━━━━━━ 4s]                          │
│                                                   │
│  Descripcion visual                               │
│  ┌───────────────────────────────────────┐        │
│  │ Plano medio de Marco corriendo a     │ [✦]    │
│  │ toda velocidad, lluvia cayendo,       │        │
│  │ luces de neon reflejandose...         │        │
│  └───────────────────────────────────────┘        │
│                                                   │
│  Dialogo / Narracion                              │
│  ┌───────────────────────────────────────┐        │
│  │ "No importa cuanto duela, no voy     │ [✦]    │
│  │  a parar ahora."                     │        │
│  └───────────────────────────────────────┘        │
│                                                   │
│  Personaje ──────── Fondo ───────────── ★ NUEVO   │
│  [Marco ▼]          [Calle nocturna ▼]            │
│                                                   │
│───────────────────────────────────────────────────│
│            [Cancelar]  [Crear Escena]             │
└───────────────────────────────────────────────────┘
```

---

## 9. Detalle de Escena

**Ruta:** `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]`

### Layout completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Volver   Escena 3 — "Salida a correr"         ● Borrador    [⋮]    │
├────────────────────────────────────────┬────────────────────────────────┤
│                                        │                                │
│  CONTENIDO (flex-1)                    │  PANEL IA (w-72, sticky)       │
│                                        │                                │
│  ┌─ Descripcion visual ────────────┐   │  ┌─ ✦ Acciones IA ──────────┐ │
│  │ Marco sale del apartamento con  │   │  │                          │ │
│  │ ropa deportiva, el cielo esta   │   │  │  [Generar prompt IMG]    │ │
│  │ anaranjado por el amanecer...   │   │  │  [Generar prompt VID]    │ │
│  └─────────────────────────────────┘   │  │  [Mejorar descripcion]   │ │
│                                        │  │  [Sugerir camara]        │ │
│  ┌─ Dialogo ───────────────────────┐   │  │  [Generar preview]       │ │
│  │ NARRADOR: "El primer paso       │   │  │  [Variantes de prompt]   │ │
│  │ siempre es el mas dificil."     │   │  │  [Traducir prompt]       │ │
│  └─────────────────────────────────┘   │  │  [Sugerir transicion]    │ │
│                                        │  │                          │ │
│  ┌─ Camara ────────────────────────┐   │  └──────────────────────────┘ │
│  │ Angulo: [Medium shot ▼]        │   │                                │
│  │ Movimiento: [Dolly out ▼]      │   │  ┌─ Prompt imagen ──────────┐ │
│  │ Iluminacion: [Golden hour ▼]   │   │  │ Medium shot of athletic  │ │
│  │ Mood: [Hopeful ▼]             │   │  │ man stepping out of...   │ │
│  └─────────────────────────────────┘   │  │                          │ │
│                                        │  │ [Copiar] [Editar] [✦]   │ │
│  ┌─ Personajes ────────────────────┐   │  └──────────────────────────┘ │
│  │ 👤 Marco (protagonista)        │   │                                │
│  │    [Cambiar] [+ Anadir]        │   │  ┌─ Prompt video ───────────┐ │
│  └─────────────────────────────────┘   │  │ Camera slowly pulls back │ │
│                                        │  │ as subject walks...      │ │
│  ┌─ Fondo ─────────────────────────┐   │  │                          │ │
│  │ 🏞 Apartamento (interior, dia) │   │  │ [Copiar] [Editar] [✦]   │ │
│  │    [Cambiar]                    │   │  └──────────────────────────┘ │
│  └─────────────────────────────────┘   │                                │
│                                        │  ┌─ Preview ────────────────┐ │
│  ┌─ Notas del director ───────────┐   │  │ ┌──────────────────────┐ │ │
│  │ Transicion suave desde la       │   │  │ │                      │ │ │
│  │ escena anterior con fade.       │   │  │ │   [Imagen preview]   │ │ │
│  └─────────────────────────────────┘   │  │ │                      │ │ │
│                                        │  │ └──────────────────────┘ │ │
│  ┌─ Anotacion cliente ────────────┐   │  │ [Regenerar] [Descargar] │ │
│  │ Aprobado, pero ajustar luz.    │   │  └──────────────────────────┘ │
│  └─────────────────────────────────┘   │                                │
│                                        │                                │
├────────────────────────────────────────┴────────────────────────────────┤
│ [← Escena 2]                                          [Escena 4 →]    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Panel IA lateral (derecho)

No es un chat. Es una columna fija con acciones y resultados.

```
Contenedor:
  w-72 (288px)
  shrink-0
  sticky top-0
  h-full overflow-y-auto
  space-y-4
  pl-4 border-l border-border

Seccion "Acciones IA":
  rounded-xl border border-border bg-card p-4

  Cada boton de accion:
    w-full justify-start
    h-8 px-3 text-xs font-medium
    rounded-lg
    bg-transparent text-muted-foreground
    hover:bg-primary/5 hover:text-primary
    Sparkles icon (h-3.5 w-3.5 text-primary/60)
    transition-colors

Seccion "Prompt imagen/video":
  rounded-xl border border-border bg-card p-4
  Titulo: text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2
  Texto: text-xs font-mono text-foreground leading-relaxed
  Acciones: flex gap-2 mt-3
    Botones: h-7 px-2 text-[11px] rounded-md
    Copiar: ghost (Copy icon)
    Editar: ghost (Pencil icon)
    Mejorar: ghost con Sparkles text-primary

Seccion "Preview":
  rounded-xl border border-border bg-card overflow-hidden
  Imagen: aspect-video w-full object-cover
  Botones: p-3 flex gap-2
```

**Responsive:** En mobile (< lg), el panel IA se convierte en un boton flotante `[✦]` que abre un bottom sheet con las mismas acciones.

---

## 10. Storyboard

**Ruta:** `/project/[shortId]/video/[videoShortId]/storyboard`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Storyboard (8 escenas · 23s · obj 30s)                  │
│                  [Dialogos 👁] [Notas 👁] [Copiar] [PDF]│
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │[1] 3s    │ │[2] 5s    │ │[3] 4s    │ │[4] 3s    │   │
│ │ Thumbnail│ │ Thumbnail│ │ Thumbnail│ │ Thumbnail│   │
│ │ IMG VID  │ │ IMG      │ │          │ │ IMG VID  │   │
│ │──────────│ │──────────│ │──────────│ │──────────│   │
│ │ Titulo   │ │ Titulo   │ │ Titulo   │ │ Titulo   │   │
│ │ Desc...  │ │ Desc...  │ │ Desc...  │ │ Desc...  │   │
│ │ "Dialog" │ │ "Dialog" │ │ "Dialog" │ │ "Dialog" │   │
│ │ 👤🏞    │ │ 👤🏞    │ │ 👤🏞    │ │ 👤🏞    │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │[5] 5s    │ │[6] 2s    │ │[7] 3s    │ │[8] 3s    │   │
│ │ ...      │ │ ...      │ │ ...      │ │ ...      │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Storyboard

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que quieres mejorar del storyboard?            │   │
│ └───────────────────────────────────────────────────┘   │
│ [Completar (3 sin prompt)] [Revisar coherencia]         │
│ [Generar todas las imagenes] [Exportar PDF pro]         │
└─────────────────────────────────────────────────────────┘
```

**Indicador visual de escenas incompletas:**
Las escenas sin prompts tienen un borde punteado y un icono de advertencia:
```
border-dashed border-amber-500/30
Badge: "Sin prompt" (bg-amber-500/10 text-amber-500 text-[10px])
```

---

## 11. Timeline

**Ruta:** `/project/[shortId]/video/[videoShortId]/timeline`

### Layout (se mantiene similar + AiAssistBar)

```
┌─────────────────────────────────────────────────────────┐
│ Timeline                                                │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ 0s          8s          16s          24s          30s    │
│ [██ Hook ██████ Build ███████ Peak ██████ Close ███]     │
├─────────────────────────────────────────────────────────┤
│ Lista de escenas con rango temporal                      │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Timeline

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que ajustes necesitas en el timing?            │   │
│ └───────────────────────────────────────────────────┘   │
│ [Optimizar para plataforma] [Equilibrar fases]          │
│ [Detectar problemas de ritmo] [Rellenar huecos]         │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Guion / Script

**Ruta:** `/project/[shortId]/video/[videoShortId]/script`

### Layout completo

```
┌─────────────────────────────────────────────────────────┐
│ Guion                                                    │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ Arco narrativo                                           │
│ [██ Hook ██████ Build █████ Peak ████ Close]              │
├─────────────────────────────────────────────────────────┤
│ [Por escena] [Continuo] [Sin narracion]   ← Tabs        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ MODO "Continuo":                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ El sol se asoma tras las montanas mientras la     │   │
│ │ camara desciende lentamente hacia la ciudad       │   │
│ │ dormida. Las calles vacias empiezan a cobrar     │   │
│ │ vida con los primeros rayos de luz.               │   │
│ │                                                   │   │
│ │ NARRADOR: "Cada manana trae una nueva             │   │
│ │ oportunidad para ser mejor."                      │   │
│ │                                                   │   │
│ │ Marco sale de su apartamento, estirando los       │   │
│ │ musculos. El aire fresco le golpea la cara.       │   │
│ └───────────────────────────────────────────────────┘   │
│ 234 palabras · ~28s a 1.0x · ✓ Encaja en 30s           │
│                                                          │
│ MODO "Por escena":                                       │
│ ┌─ Escena 1 — Hook: Amanecer ──────────────────────┐   │
│ │ "El sol se asoma tras las montanas..."           │   │
│ │ 42 palabras · ~5s                          [✦]   │   │
│ └──────────────────────────────────────────────────┘   │
│ ┌─ Escena 2 — Build: Preparacion ─────────────────┐   │
│ │ "Marco se prepara para su rutina diaria..."      │   │
│ │ 38 palabras · ~4s                          [✦]   │   │
│ └──────────────────────────────────────────────────┘   │
│ ... mas escenas                                         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Voz ──────────── Estilo ──────── Velocidad ────         │
│ [Elena (ES) ▼]   [Profesional]   [━━━━━ 1.0x]          │
│                                                          │
│              [Guardar]  [Generar audio TTS]              │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Guion

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que necesitas para el guion?                   │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar guion completo] [Traducir] [Cambiar tono]      │
│ [Optimizar para TTS] [Dividir en escenas]               │
└─────────────────────────────────────────────────────────┘
```

### Edicion inline con IA (seleccion de texto)

Cuando el usuario selecciona texto en el textarea, aparece un toolbar flotante:

```
                    ┌──────────────────────────────────────┐
Texto seleccionado → │ [Reescribir] [Expandir] [Simplificar]│
                    │ [Mas dramatico] [Mas casual]          │
                    └──────────────────────────────────────┘

Toolbar flotante:
  absolute, posicionado sobre la seleccion
  rounded-lg border border-border bg-card shadow-lg
  px-1.5 py-1 flex gap-1

  Cada boton:
    h-7 px-2.5 text-xs rounded-md
    text-muted-foreground hover:text-foreground hover:bg-accent
    transition-colors
```

---

## 13. Narracion / TTS

**Ruta:** `/project/[shortId]/video/[videoShortId]/narration`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Narracion   v1 de 3                      ● Listo        │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ ┌─ Voz ─────────────────────────────────────────────┐   │
│ │ 🎙 Elena (ES) — Profesional            [Cambiar]  │   │
│ │ Velocidad: [━━━━━━━━ 1.0x]                        │   │
│ └───────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ ┌─ Texto de narracion ─────────────────────────────┐   │
│ │ El sol se asoma tras las montanas mientras...    │   │
│ │ ...                                              │   │
│ │                                                  │   │
│ └──────────────────────────────────────────────────┘   │
│ 234 palabras                                            │
├─────────────────────────────────────────────────────────┤
│ ┌─ Audio ──────────────────────────────────────────┐   │
│ │ [▶ ━━━━━━━━━━━━━━━━━━━━━━━━ 0:00 / 0:28]       │   │
│ │                                    [⬇ Descargar] │   │
│ └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│               [Guardar]  [Generar audio TTS]            │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Narracion

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que necesitas para la narracion?               │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar texto] [Traducir a ingles] [Optimizar TTS]     │
│ [Recomendar voz] [Ajustar velocidad auto]               │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Analisis de Video

**Ruta:** `/project/[shortId]/video/[videoShortId]/analysis`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Analisis                                  [Re-analizar]  │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar (solo si no hay analisis)                  │
├─────────────────────────────────────────────────────────┤
│ ┌─ Puntuacion ────────────┬─ Resumen ────────────────┐  │
│ │                         │ El video tiene buena      │  │
│ │     ┌───────┐           │ estructura narrativa      │  │
│ │     │  72   │           │ pero el ritmo del hook    │  │
│ │     │ /100  │           │ podria mejorar...         │  │
│ │     └───────┘           │                           │  │
│ │   ScoreGauge            │ Modelo: gpt-4o            │  │
│ │                         │ Ultima vez: hace 2h       │  │
│ └─────────────────────────┴──────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│ Fortalezas (3)                                           │
│ ┌─ ✓ Buena progresion narrativa ───────────────────┐    │
│ │ El arco Build→Peak esta bien construido.         │    │
│ │ Escenas: [3] [4] [5]                             │    │
│ └──────────────────────────────────────────────────┘    │
│ ...                                                      │
├─────────────────────────────────────────────────────────┤
│ Debilidades (2)                                          │
│ ┌─ ⚠ Hook demasiado largo ────────────── Severidad: ██│  │
│ │ La escena 1 dura 8s, para TikTok deberia ser 3-5s│    │
│ │ Escenas: [1]                    [Aplicar fix ✓]   │    │
│ └──────────────────────────────────────────────────┘    │
│ ...                                                      │
├─────────────────────────────────────────────────────────┤
│ Sugerencias (4)                                          │
│ ┌─ 💡 Anadir transicion entre escena 3 y 4 ─────────┐  │
│ │ No hay conexion visual entre las escenas.          │  │
│ │ Escenas: [3] [4]               [Generar ✦]        │  │
│ └──────────────────────────────────────────────────┘    │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

### Botones de accion en cada sugerencia

```
Sugerencias aplicables automaticamente:
  Boton: "Aplicar fix"
  h-7 px-3 text-xs rounded-md
  bg-primary/10 text-primary hover:bg-primary/20
  Check icon

Sugerencias que necesitan generacion:
  Boton: "Generar" con Sparkles icon
  h-7 px-3 text-xs rounded-md
  bg-primary/10 text-primary hover:bg-primary/20
  → Abre AiResultDrawer con el resultado
```

---

## 15. Exportacion

**Ruta:** `/project/[shortId]/video/[videoShortId]/export`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Exportar — Runner Pro                                    │
│ 8 escenas · 23s                                          │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ 📄 PDF   │ │ 🌐 HTML  │ │ {} JSON  │                 │
│ │Storyboard│ │ Viewer   │ │ Datos    │                 │
│ │Proximam. │ │Proximam. │ │ ✓ Listo  │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ # MD     │ │ 🎵 MP3   │ │ 📦 ZIP   │                 │
│ │ Markdown │ │ Audio    │ │ Completo │                 │
│ │ ✓ Listo  │ │Proximam. │ │Proximam. │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Export

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que necesitas exportar?                        │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar titulo YouTube] [Generar thumbnail]            │
│ [Checklist pre-export] [Descripcion para redes]         │
└─────────────────────────────────────────────────────────┘
```

---

## 16. Derivar Video

**Ruta:** `/project/[shortId]/video/[videoShortId]/derive`

### Layout (reemplazar chat actual)

```
┌─────────────────────────────────────────────────────────┐
│ Derivar: "Runner Pro"                                    │
│ Video fuente: 8 escenas · 23s · Instagram Reels          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ¿Que version quieres crear?                             │
│                                                          │
│  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │ 📱 TikTok            │ │ 📺 YouTube Short      │      │
│  │ 9:16 · 15-30s        │ │ 9:16 · hasta 60s     │      │
│  │ Recortar a lo mejor  │ │ Expandir narrativa   │      │
│  └──────────────────────┘ └──────────────────────┘      │
│  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │ 🌍 Traducir          │ │ ✂️ Version corta      │      │
│  │ Nuevo idioma          │ │ Solo highlights      │      │
│  │ Dialogos + narracion │ │ 10-15s               │      │
│  └──────────────────────┘ └──────────────────────┘      │
│  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │ 🎭 Cambiar tono      │ │ ♿ Accesible          │      │
│  │ Dramatico, casual... │ │ Audiodescripcion     │      │
│  │ Reescribir dialogos  │ │ Subtitulos detallados│      │
│  └──────────────────────┘ └──────────────────────┘      │
│                                                          │
│  ── o describe lo que necesitas ──                       │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ✦ Quiero una version mas rapida para...           │  │
│  └───────────────────────────────────────────────────┘  │
│  [Crear derivacion]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Estilo de las tarjetas de opcion:**

```
rounded-xl border border-border bg-card p-4
hover:border-primary/30 hover:shadow-md
transition-all cursor-pointer

Seleccionada:
  border-primary bg-primary/5
  shadow-sm

Icono: text-2xl mb-2
Titulo: text-sm font-semibold
Subtitulos: text-xs text-muted-foreground (2 lineas)
```

---

## 17. Personajes

**Ruta:** `/project/[shortId]/resources/characters`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Personajes (6)                          [+ Nuevo]        │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│ │   [MR]    │ │   [AS]    │ │   [LP]    │ │   [CG]    ││
│ │  Marco R. │ │  Ana S.   │ │  Luis P.  │ │  Carmen   ││
│ │ Protagon. │ │ Secundar. │ │   Extra   │ │ Narrador  ││
│ │ Atleta... │ │ Entrena.. │ │ Corredor  │ │ Voz en... ││
│ │ 🎬5 📷2  │ │ 🎬3 📷0  │ │ 🎬1 📷0  │ │ 🎬8 📷1  ││
│ │      [⋮]  │ │      [⋮]  │ │      [⋮]  │ │      [⋮]  ││
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘│
│ ┌───────────┐ ┌───────────┐                             │
│ │   [DP]    │ │   [RV]    │                             │
│ │  Diego P. │ │  Rosa V.  │                             │
│ └───────────┘ └───────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Personajes

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ Describe un personaje o lo que necesitas...     │   │
│ └───────────────────────────────────────────────────┘   │
│ [Crear con IA] [Sugerir elenco] [Auditar personajes]    │
│ [Generar snippets] [Generar imagenes de referencia]     │
└─────────────────────────────────────────────────────────┘
```

### CharacterCreateModal + IA (ver seccion 2.3 tipo `form`)

El drawer tiene la seccion de input IA arriba + todos los campos editables debajo.

**Flujo:**
1. Usuario escribe "Un detective cansado de 45 anos con gabardina"
2. Click "Generar con IA"
3. Los campos se rellenan con animacion fade-in secuencial (50ms entre cada campo)
4. Cada campo tiene chip `✦ IA` y borde `border-primary/20`
5. Usuario puede editar cualquier campo
6. Click "Crear Personaje"

---

## 18. Detalle de Personaje

**Ruta:** `/project/[shortId]/resources/characters/[charId]`

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Volver   Marco Ramirez                     Protagonista    [✏ Edit] │
├────────────────────────────────────────┬────────────────────────────────┤
│                                        │                                │
│  ┌─ Imagen de referencia ──────────┐   │  ┌─ ✦ Acciones IA ──────────┐ │
│  │ ┌──────────────────────────┐    │   │  │                          │ │
│  │ │                          │    │   │  │  [Enriquecer campos]     │ │
│  │ │     [Imagen o upload]    │    │   │  │  [Regenerar snippet]     │ │
│  │ │                          │    │   │  │  [Generar galeria]       │ │
│  │ └──────────────────────────┘    │   │  │  [Analizar en escenas]   │ │
│  │ [Subir imagen] [Generar ✦]     │   │  │  [Sugerir evolucion]     │ │
│  └─────────────────────────────────┘   │  │                          │ │
│                                        │  └──────────────────────────┘ │
│  ┌─ Informacion ───────────────────┐   │                                │
│  │ Nombre:       Marco Ramirez     │   │  ┌─ Prompt Snippet ─────────┐ │
│  │ Rol:          Protagonista      │   │  │ Athletic man, 28yo,      │ │
│  │ Color acento: ■ #2563EB Azul    │   │  │ short brown hair, blue   │ │
│  └─────────────────────────────────┘   │  │ running outfit, lean...  │ │
│                                        │  │                          │ │
│  ┌─ Descripcion ───────────────────┐   │  │ [Copiar] [Editar] [✦]   │ │
│  │ Atleta profesional de 28 anos,  │   │  └──────────────────────────┘ │
│  │ disciplinado y competitivo...   │   │                                │
│  └─────────────────────────────────┘   │  ┌─ Apariciones ────────────┐ │
│                                        │  │ Escena 1 — Hook (3s)     │ │
│  ┌─ Apariencia ────────────────────┐   │  │ Escena 2 — Build (5s)    │ │
│  │ Pelo:      Castano corto        │   │  │ Escena 3 — Build (4s)    │ │
│  │ Ropa:      Conjunto deportivo   │   │  │ Escena 5 — Peak (5s)     │ │
│  │ Accesorios: Reloj deportivo     │   │  │ Escena 7 — Close (3s)    │ │
│  └─────────────────────────────────┘   │  │                          │ │
│                                        │  │ 5 de 8 escenas           │ │
│  ┌─ Personalidad ──────────────────┐   │  └──────────────────────────┘ │
│  │ Disciplinado, competitivo,      │   │                                │
│  │ resiliente pero humano...       │   │                                │
│  └─────────────────────────────────┘   │                                │
│                                        │                                │
└────────────────────────────────────────┴────────────────────────────────┘
```

**Cada seccion editable tiene boton `[✦]` para mejorar ese campo con IA.**

---

## 19. Fondos / Localizaciones

**Ruta:** `/project/[shortId]/resources/backgrounds`

### Layout (analogo a Personajes)

```
┌─────────────────────────────────────────────────────────┐
│ Fondos (5)                                [+ Nuevo]      │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│ │ [Thumbnail]│ │ [Thumbnail]│ │ [Thumbnail]│ │ [Thumbnail]││
│ │ Calle     │ │ Apartam.  │ │ Parque    │ │ Estadio   ││
│ │ Exterior  │ │ Interior  │ │ Exterior  │ │ Interior  ││
│ │ Noche     │ │ Dia       │ │ Amanecer  │ │ Dia       ││
│ │ 🎬3 📐4  │ │ 🎬2 📐3  │ │ 🎬2 📐5  │ │ 🎬1 📐2  ││
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘│
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Fondos

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ Describe una localizacion o lo que necesitas... │   │
│ └───────────────────────────────────────────────────┘   │
│ [Crear con IA] [Sugerir localizaciones] [Generar vistas]│
│ [Detectar fondos faltantes]                             │
└─────────────────────────────────────────────────────────┘
```

---

## 20. Detalle de Fondo

**Ruta:** `/project/[shortId]/resources/backgrounds/[bgId]`

Layout analogo al Detalle de Personaje (seccion 18) pero con campos propios:
- Nombre, codigo, tipo (interior/exterior), hora del dia
- Descripcion detallada, angulos disponibles
- Prompt snippet, imagen de referencia
- Panel IA lateral con: Mejorar descripcion, Regenerar snippet, Generar vistas por angulo, Analizar uso, Variantes horarias

---

## 21. Recursos Hub

**Ruta:** `/project/[shortId]/resources`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Recursos                                                 │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ [Personajes (6)] [Fondos (5)] [Estilos (1)] [Templates]│  ← Tabs
├─────────────────────────────────────────────────────────┤
│ Contenido del tab seleccionado (preview + "Ver todos")  │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Recursos

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que recursos necesitas generar?                │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar elenco completo] [Generar todas las locaciones]│
│ [Auditar recursos] [Crear style preset]                 │
└─────────────────────────────────────────────────────────┘
```

---

## 22. Tareas

**Ruta:** `/project/[shortId]/tasks`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Tareas                           [Kanban] [Lista]        │
│                                          [+ Nueva tarea] │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ Vista Kanban:                                            │
│ ┌─ Pendiente ──┐ ┌─ En curso ──┐ ┌─ Revision ─┐ ┌─ Hecho ──┐│
│ │ border-t     │ │ border-t    │ │ border-t   │ │ border-t  ││
│ │ zinc-500     │ │ amber-500   │ │ blue-500   │ │ emerald   ││
│ │              │ │             │ │            │ │           ││
│ │ ┌──────────┐│ │ ┌──────────┐│ │            │ │ ┌────────┐││
│ │ │ Task 1   ││ │ │ Task 3   ││ │            │ │ │ Task 5 │││
│ │ │ 🔴 Alta  ││ │ │ 🟡 Media ││ │            │ │ │ ✓      │││
│ │ └──────────┘│ │ └──────────┘│ │            │ │ └────────┘││
│ │ ┌──────────┐│ │             │ │            │ │           ││
│ │ │ Task 2   ││ │             │ │            │ │           ││
│ │ │ ✦ IA     ││ │             │ │            │ │           ││
│ │ └──────────┘│ │             │ │            │ │           ││
│ └─────────────┘ └─────────────┘ └────────────┘ └───────────┘│
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Tareas

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que tareas necesitas?                          │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar plan completo] [Priorizar con IA]              │
│ [Detectar tareas pendientes] [Resumen de progreso]      │
└─────────────────────────────────────────────────────────┘
```

**Tareas generadas por IA** tienen un indicador:
```
Chip en la task card:
  ✦ IA
  text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5
```

---

## 23. Publicaciones

**Ruta:** `/project/[shortId]/publications`

### Layout (se mantiene + AiAssistBar)

```
┌─────────────────────────────────────────────────────────┐
│ Publicaciones (3)                [Grid] [Calendario]     │
│                                          [+ Nueva]       │
├─────────────────────────────────────────────────────────┤
│ ★ AiAssistBar                                            │
├─────────────────────────────────────────────────────────┤
│ Grid de publication cards...                             │
└─────────────────────────────────────────────────────────┘
```

### AiAssistBar en Publicaciones

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✦ ¿Que quieres publicar?                          │   │
│ └───────────────────────────────────────────────────┘   │
│ [Generar plan de publicacion] [Analizar rendimiento]    │
│ [Sugerir proximo post] [Generar calendario]             │
└─────────────────────────────────────────────────────────┘
```

---

## 24. Nueva Publicacion

**Ruta:** `/project/[shortId]/publications/new`

### Layout mejorado con IA

```
┌─────────────────────────────────────────────────────────┐
│ Nueva Publicacion                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Perfil social *                                         │
│  [Instagram — @brand ▼]                                  │
│                                                          │
│  Tipo                                                    │
│  [Post] [Reel] [Story] [Carousel] [Video] [Short]       │
│                                                          │
│  Video fuente (opcional)                     ★ NUEVO     │
│  [Runner Pro — Instagram Reels ▼]                        │
│                                                          │
│  Titulo *                                                │
│  [                                       ] [✦]          │
│                                                          │
│  Caption                                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│  [✦ Generar caption] [✦ Cambiar tono] [✦ Traducir]     │
│                                                          │
│  Hashtags                                                │
│  [                                       ] [✦]          │
│  Separados por coma                                      │
│                                                          │
│  Programar (opcional)                                    │
│  [2026-04-02  18:00]                     [✦ Mejor hora] │
│                                                          │
│                    [Cancelar]  [Crear Publicacion]        │
└─────────────────────────────────────────────────────────┘
```

**Botones IA debajo del caption:**
```
flex gap-2 mt-2
Cada boton:
  h-7 px-3 text-xs rounded-full
  border border-border bg-card
  text-muted-foreground
  hover:bg-primary/5 hover:text-primary hover:border-primary/30
  Sparkles icon h-3 w-3 mr-1
```

---

## 25. Configuracion del Proyecto

**Ruta:** `/project/[shortId]/settings`

### Layout (se mantiene + botones IA puntuales)

```
┌─────────────────────────────────────────────────────────┐
│ Configuracion del Proyecto                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Cover image                                             │
│  [████████████████████████████████]                       │
│  [Cambiar] [Eliminar] [✦ Generar con IA]    ★ NUEVO     │
│                                                          │
│  Titulo *                                                │
│  [Zapatillas Runner Pro             ]                    │
│                                                          │
│  Descripcion                                             │
│  ┌───────────────────────────────────────────────┐      │
│  │ Proyecto publicitario para la nueva linea...  │ [✦]  │
│  └───────────────────────────────────────────────┘      │
│                                                          │
│  Cliente ──────────── Estilo visual ─────────           │
│  [RunnerPro Inc.]     [Pixar 3D ▼]                      │
│                                                          │
│  Tags                                                    │
│  [zapatillas, deporte, running, fitness ] [✦]           │
│                                                          │
│  Colores                                                 │
│  Primario: [■ #2563EB]  Secundario: [■ #F59E0B]        │
│  [✦ Sugerir paleta]                         ★ NUEVO     │
│                                                          │
│  [🗑 Eliminar proyecto]              [Guardar cambios]  │
└─────────────────────────────────────────────────────────┘
```

---

## 26. Configuracion IA

**Ruta:** `/project/[shortId]/settings/ai`

### Layout (se mantiene + boton de test)

```
┌─────────────────────────────────────────────────────────┐
│ Configuracion IA                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ── Director IA ──                                       │
│                                                          │
│  Tipo de director                                        │
│  [Pixar] [Anime] [Realista] [Comic] [Custom]            │
│                                                          │
│  System prompt                                           │
│  ┌───────────────────────────────────────────────┐      │
│  │ Eres un director creativo especializado...    │ [✦]  │
│  └───────────────────────────────────────────────┘      │
│                                                          │
│  Tono ──── Idioma ──── Creatividad ───                  │
│  [Profesional calido ▼] [ES ▼] [━━━━━ 0.7]             │
│                                                          │
│  ── Generadores externos ──                              │
│                                                          │
│  Imagen ─── Video ─── TTS ─── Vision ───                │
│  [Grok ▼]   [Grok ▼]  [11Labs▼] [OpenAI▼]              │
│                                                          │
│  [✦ Recomendar configuracion]               ★ NUEVO     │
│  [✦ Probar configuracion]                   ★ NUEVO     │
│                                                          │
│                                    [Guardar cambios]     │
└─────────────────────────────────────────────────────────┘
```

**Boton "Probar configuracion":**
Al hacer click, abre un AiResultDrawer con:
- Un prompt de prueba pre-definido
- La respuesta del director con la configuracion actual
- El usuario ve como responde la IA antes de guardar

---

## Apendice: Resumen de Componentes Nuevos

| Componente | Tipo | Donde se usa |
|---|---|---|
| `AiAssistBar` | Barra contextual | Todas las paginas (20+) |
| `AiAssistBarCompact` | Input + boton IA | Dentro de modales |
| `AiResultDrawer` | Drawer derecho | Respuesta a acciones IA |
| `AiFieldAssist` | Boton `[✦]` por campo | Todos los formularios |
| `AiActionPanel` | Panel lateral sticky | Detalle de escena, personaje, fondo |
| `AiInlineToolbar` | Toolbar flotante | Editor de guion (seleccion de texto) |
| `AiSuggestionCard` | Card con accion | Analisis, storyboard |
| `AiPlanPreview` | Lista de pasos + "Crear" | Generacion masiva (escenas, tareas) |
| `AiOptionSelector` | Radio cards | Variantes de caption, estilos |

## Apendice A: Reglas Visuales IA

1. **Color IA:** Siempre `primary` (azul #006fee). El icono Sparkles siempre en `text-primary`.
2. **Chip IA:** `✦ IA` — `text-[10px] bg-primary/10 text-primary rounded px-1 ml-1`
3. **Borde campo IA:** `border-primary/20 bg-primary/5` cuando un campo fue pre-llenado por IA
4. **Acciones IA en dropdown:** Agrupadas y separadas por `Separator`, con Sparkles icon
5. **Loading IA:** Spinner `Loader2 animate-spin` + texto italico muted
6. **Animacion de llenado:** Campos aparecen con `fade-in` secuencial (50ms delay entre cada uno)
7. **Nunca chat:** La IA no conversa. Produce resultados accionables.

---

## Apendice B: Stack IA — Que modelo se usa donde

Referencia tecnica completa: `docs/v6/MY DOCUMENT/guia-director-creativo-stackB.md`

### Tres roles, tres proveedores

```
  👁 OJOS    → Gemini 2.5 Flash (Google AI Studio, USA)
               $0.15/M tokens · Tier gratis ~500 req/dia
               SOLO analiza imagenes. No genera texto ni imagenes.

  🧠 CEREBRO → Qwen 3.5 Flash ($0.065/M) — rapido, barato
               Qwen 3.5 Plus ($0.26/M) — potente, analitico
               Via OpenRouter (USA). Registro: solo email.
               Genera storyboards, prompts, escenas, guiones, campos.

  🎙 VOZ     → Voxtral TTS (Mistral, Francia)
               $0.016/1K caracteres
               Clona voz con 3 segundos de audio referencia.
               9 idiomas incluido espanol.
```

### Regla de seleccion de modelo

```
Qwen Flash (tareas rapidas, ~100ms):
  - Generar campos de formulario
  - Crear 1 escena / editar 1 escena
  - Generar prompt imagen/video
  - Escribir guion
  - Traducir texto
  - Generar caption/hashtags
  - Rellenar campos con AiFieldAssist [✦]

Qwen Plus (tareas complejas, ~500ms):
  - Analizar storyboard completo (getCreativeAdvice)
  - Insertar escenas entre existentes (insertScenesBetween)
  - Detectar inconsistencias entre escenas
  - Revisar coherencia visual del storyboard
  - Adaptar video a otra plataforma (derivar)
  - Analisis completo del video

Gemini Flash (vision):
  - Analizar imagen subida por el usuario
  - Extraer estilo/colores de referencia
  - Detectar composicion, sujetos, mood
  - SIEMPRE seguido de Qwen Flash para formatear

Voxtral TTS (audio):
  - Generar audio de narracion
  - Preview rapido (primeras 50 palabras)
  - Clonar voz desde referencia
  - Narracion multi-personaje (merge con ffmpeg)
```

### Mapeo visual: Que icono mostrar en la UI

```
Acciones de generacion de texto/formulario:
  Icono: Sparkles (✦)
  Color: text-primary
  Label: "Generar con IA"
  Modelo interno: Qwen Flash (no mostrar al usuario)

Acciones de analisis/consejo:
  Icono: BarChart3 o Lightbulb
  Color: text-primary
  Label: "Analizar" / "Revisar" / "Sugerir"
  Modelo interno: Qwen Plus (no mostrar al usuario)

Acciones de vision (subir imagen):
  Icono: Camera o ImagePlus
  Color: text-primary
  Label: "Subir referencia" / "Analizar imagen"
  Modelo interno: Gemini Flash → Qwen Flash

Acciones de voz:
  Icono: Mic
  Color: text-primary
  Label: "Generar audio" / "Preview voz"
  Modelo interno: Voxtral TTS
```

### Coste por proyecto — resumen para el diseno

```
El usuario NO ve costes internos. El diseno no muestra precios por accion.
Pero internamente:

  Crear proyecto completo (6 escenas): ~$0.003
  Analizar 4 imagenes de referencia:   ~$0.002
  Insertar 2 escenas de transicion:    ~$0.003
  Generar prompts para 8 escenas:      ~$0.005
  Guion + TTS 60 segundos:             ~$0.014
  ──────────────────────────────────────────────
  TOTAL proyecto con audio:            ~$0.022

Esto significa: 1.000 proyectos/mes = $22.
El pricing al usuario puede ser $9.99/mes por 50 proyectos (margen 92%).
```

### Variables de entorno necesarias

```env
GEMINI_API_KEY=...        # Google AI Studio (vision)
OPENROUTER_API_KEY=...    # Qwen via OpenRouter (cerebro)
MISTRAL_API_KEY=...       # Voxtral TTS (voz)
```

### Endpoints API a crear/adaptar

```
EXISTENTES (adaptar al Stack B):
  /api/ai/chat              → reemplazar por acciones directas
  /api/ai/generate-narration → usar Qwen Flash
  /api/ai/generate-voice     → usar Voxtral TTS (reemplaza ElevenLabs)

NUEVOS (del Stack B):
  /api/ai/generate-storyboard  → Qwen Flash: genera proyecto/escenas desde brief
  /api/ai/analyze-scenes       → Gemini Flash: analiza imagenes subidas
  /api/ai/insert-scenes        → Qwen Plus: inserta escenas entre existentes
  /api/ai/get-advice           → Qwen Plus: analisis y consejos creativos
  /api/ai/edit-scene           → Qwen Flash: edita/regenera 1 escena
  /api/ai/generate-script      → Qwen Flash: genera guion de narracion
  /api/ai/export-project       → empaqueta JSON + prompts + audio
```
