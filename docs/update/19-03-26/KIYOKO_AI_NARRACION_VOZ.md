# KIYOKO AI — Sistema de Narración y Generación de Voz

**Documento Funcional y Técnico Completo**

**Fecha:** Marzo 2026  
**Versión:** 1.0  
**Página:** `/project/[slug]/videos/[videoSlug]/narration`

---

## Índice

1. [Visión General](#1-visión-general)
2. [Diseño de la Página — Layout Completo](#2-diseño-página)
3. [Sidebar de Narración — Menú Lateral](#3-sidebar)
4. [Flujo con IA — El Chat Pregunta Qué Quieres](#4-flujo-ia)
5. [Generación por Escena (escena a escena)](#5-por-escena)
6. [Generación Completa (todo el video)](#6-completa)
7. [Estilos de Narración (Cartoon, Pixar, Documental...)](#7-estilos)
8. [Reproductor de Audio (preview y controles)](#8-reproductor)
9. [Estados de la UI (generando, cancelando, error, listo)](#9-estados)
10. [Subir a Supabase y Asociar a Escena/Video](#10-supabase)
11. [Descargar MP3](#11-descargar)
12. [Modelo de Datos (tablas y campos)](#12-modelo-datos)
13. [API Routes](#13-api-routes)
14. [Integración con ElevenLabs — Código](#14-elevenlabs)
15. [Zustand Store](#15-store)
16. [Componentes React](#16-componentes)
17. [Edge Cases y Errores](#17-edge-cases)

---

## 1. Visión General

### Qué es

Una página dedicada dentro de cada video donde el usuario puede generar, previsualizar, editar y descargar las narraciones de audio para cada escena o para el video completo. La IA asiste en todo el proceso: desde escribir el guión hasta generar la voz con el estilo deseado.

### Principio de diseño

```
SIEMPRE hay dos caminos:

1. MANUAL: El usuario escribe el texto, elige la voz, y genera
2. IA: El usuario le dice a Kiyoko "genera narración estilo Pixar 
   para todo el video" y la IA escribe los textos + genera las voces

Ambos caminos llegan al mismo resultado: audio asociado a escena/video.
```

### Qué puede hacer el usuario

- Generar narración para UNA escena específica
- Generar narración para TODAS las escenas de un video de golpe
- Generar narración completa del video (un solo audio continuo)
- Elegir entre múltiples voces (masculina, femenina, niño, anciano...)
- Elegir estilo de narración (cartoon, documental, épico, ASMR, Pixar...)
- Previsualizar el audio antes de guardarlo
- Descargar como MP3
- Cancelar la generación mientras está en proceso
- Regenerar con otra voz o estilo
- Editar el texto de narración inline
- Ver la forma de onda del audio generado
- Ajustar velocidad de la narración (0.7x a 1.3x)
- Subir audio propio (upload manual)
- Asociar el audio a una escena o al video completo
- Ver el estado de cada escena (con audio / sin audio / generando)

---

## 2. Diseño de la Página — Layout Completo

### Estructura general

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (existente de Kiyoko)                                                │
├─────────┬───────────────────────────────────────────────────────┬───────────┤
│         │                                                       │           │
│ SIDEBAR │              ÁREA PRINCIPAL                           │  CHAT IA  │
│ NARRAC. │                                                       │  (panel   │
│         │  ┌─────────────────────────────────────────────────┐  │  lateral  │
│ [Modos] │  │  BARRA SUPERIOR DEL VIDEO                      │  │  existente│
│ [Voces] │  │  "Spot YouTube 75s" — 28 escenas — 12 con audio│  │  de       │
│ [Estilo]│  └─────────────────────────────────────────────────┘  │  Kiyoko)  │
│ [Config]│                                                       │           │
│         │  ┌─────────────────────────────────────────────────┐  │           │
│         │  │  LISTA DE ESCENAS CON AUDIO                     │  │           │
│         │  │  (el contenido principal)                        │  │           │
│         │  │                                                  │  │           │
│         │  │  E1: Cold Open Tijeras ▶ [====] 3.2s  ✅       │  │           │
│         │  │  E2: Logo Reveal       ▶ [====] 5.1s  ✅       │  │           │
│         │  │  E3: Salón Interior    ○ Sin audio     🔴       │  │           │
│         │  │  E4: Corte José        ● Generando...  🟡       │  │           │
│         │  │  E5: Transformación    ○ Sin audio     🔴       │  │           │
│         │  │  ...                                             │  │           │
│         │  └─────────────────────────────────────────────────┘  │           │
│         │                                                       │           │
│         │  ┌─────────────────────────────────────────────────┐  │           │
│         │  │  REPRODUCTOR GLOBAL (cuando hay audio completo) │  │           │
│         │  │  ▶ 00:00 [═══════════════════════════] 01:15    │  │           │
│         │  │  🔊 ████░░ │ ⏬ MP3 │ 🔄 Regenerar │ 🗑 Borrar │  │           │
│         │  └─────────────────────────────────────────────────┘  │           │
│         │                                                       │           │
├─────────┴───────────────────────────────────────────────────────┴───────────┤
│ FOOTER                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Barra superior del video

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🎙️ Narración · Spot YouTube 75s                                         │
│                                                                          │
│ Escenas: 28 total │ ✅ 12 con audio │ 🔴 14 sin audio │ 🟡 2 generando │
│                                                                          │
│ [████████████░░░░░░░░░░░░░░░░] 43% completado                          │
│                                                                          │
│ [🤖 Generar Todo con IA]  [📤 Upload Audio]  [⏬ Descargar Todo MP3]    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Sidebar de Narración — Menú Lateral

### Secciones del sidebar

```
┌─────────────────────────┐
│ 🎙️ NARRACIÓN            │
│                          │
│ ── MODO ──               │
│ ○ Por escena             │
│ ● Por video completo     │
│                          │
│ ── VOZ ──                │
│ [▼ Seleccionar voz    ]  │
│                          │
│ ┌────────────────────┐   │
│ │ 🎤 Lucía (ES)      │   │
│ │ Femenina · Cálida   │   │
│ │ ▶ Preview  ★ Fav    │   │
│ ├────────────────────┤   │
│ │ 🎤 Carlos (ES)     │   │
│ │ Masculino · Firme   │   │
│ │ ▶ Preview  ★ Fav    │   │
│ ├────────────────────┤   │
│ │ 🎤 Sofía (ES)      │   │
│ │ Femenina · Joven    │   │
│ │ ▶ Preview  ★ Fav    │   │
│ ├────────────────────┤   │
│ │ 🎤 Narrator (EN)   │   │
│ │ Masculino · Épico   │   │
│ │ ▶ Preview  ★ Fav    │   │
│ └────────────────────┘   │
│ [+ Buscar más voces]     │
│                          │
│ ── ESTILO ──             │
│ [▼ Estilo narración   ]  │
│ ○ Narrador documental    │
│ ○ Cartoon / Animación    │
│ ○ Pixar (cálido/emotivo) │
│ ○ Épico / Cinemático     │
│ ○ ASMR / Susurro         │
│ ○ Comercial / Energético │
│ ○ Infantil               │
│ ○ Misterioso / Thriller  │
│ ● Custom (definir abajo) │
│                          │
│ ── CONFIGURACIÓN ──      │
│ Velocidad:               │
│ 0.7x [═══●═══] 1.3x     │
│ Actual: 1.0x             │
│                          │
│ Estabilidad:             │
│ Baja [═══●═══] Alta      │
│ (más variación ↔ estable)│
│                          │
│ Idioma: [Español ▼]      │
│                          │
│ ── INSTRUCCIONES IA ──   │
│ ┌────────────────────┐   │
│ │ "Narra como si     │   │
│ │ fuera un trailer    │   │
│ │ de Pixar, tono      │   │
│ │ cálido y emotivo"   │   │
│ └────────────────────┘   │
│                          │
│ ── ACCIONES ──           │
│ [🤖 Generar Todo]        │
│ [⏹ Cancelar Todo]        │
│ [⏬ Descargar ZIP]        │
│ [🗑 Borrar Todo Audio]    │
└─────────────────────────┘
```

---

## 4. Flujo con IA — El Chat Pregunta Qué Quieres

### Cuando el usuario abre la página de narración por primera vez

Si no hay narración generada, el área principal muestra un estado vacío con asistente:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     🎙️                                       │
│                                                              │
│           Aún no hay narración en este video                 │
│                                                              │
│     Kiyoko puede ayudarte a crear la narración perfecta.     │
│     ¿Cómo quieres empezar?                                  │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ 🤖 Generar con IA    │  │ ✏️ Escribir manual    │         │
│  │                       │  │                       │         │
│  │ Dile a Kiyoko qué     │  │ Escribe el texto de   │         │
│  │ estilo quieres y      │  │ narración para cada    │         │
│  │ genera todo automático│  │ escena manualmente     │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ 📤 Subir audio        │  │ 🎯 Escena por escena  │         │
│  │                       │  │                       │         │
│  │ Sube un archivo MP3   │  │ Ve escena a escena    │         │
│  │ de narración que ya   │  │ escribiendo y generando│         │
│  │ tengas grabado        │  │ una a una             │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Flujo "Generar con IA"

Al pulsar "Generar con IA" se abre un diálogo conversacional (o el chat lateral):

```
┌──────────────────────────────────────────────────────────────┐
│ 🤖 Kiyoko — Asistente de Narración                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🤖 ¡Vamos a crear la narración para "Spot YouTube"!         │
│    Tu video tiene 28 escenas y dura 75 segundos.             │
│                                                              │
│    Necesito saber algunas cosas:                             │
│                                                              │
│    1. ¿Qué estilo de narración quieres?                      │
│       [Documental] [Pixar] [Cartoon] [Épico] [Comercial]    │
│                                                              │
│    2. ¿Idioma?                                               │
│       [Español] [Inglés] [Ambos]                             │
│                                                              │
│    3. ¿Quieres narración en TODAS las escenas o solo algunas?│
│       [Todas] [Solo hook y close] [Yo elijo cuáles]          │
│                                                              │
│    4. ¿Voz masculina o femenina?                             │
│       [Masculina] [Femenina] [Alternar] [Da igual]           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Usuario: Quiero estilo Pixar, en español, narración en       │
│ todas las escenas, voz femenina cálida                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🤖 Perfecto. He analizado las 28 escenas y he escrito la     │
│    narración para cada una en estilo Pixar (cálido, emotivo, │
│    con pausas dramáticas). Aquí va el plan:                   │
│                                                              │
│    E1: "En un mundo donde cada mechón cuenta..."  (3s)       │
│    E2: "Domenech. Donde el arte se hace en cada corte." (5s) │
│    E3: [SILENCIO — escena visual] (0s)                       │
│    E4: "José toma las tijeras con la precisión de..." (4s)   │
│    ...                                                       │
│                                                              │
│    Total: 22 escenas con texto, 6 en silencio.               │
│    Duración estimada de narración: ~62 segundos.             │
│    Voz seleccionada: Lucía (femenina, cálida, español)       │
│                                                              │
│    [✅ Aprobar y Generar Todo]  [✏️ Editar Textos]  [❌ Cancelar]│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Después de aprobar: progreso de generación

```
┌──────────────────────────────────────────────────────────────┐
│ 🎙️ Generando narración — 8/22 escenas                       │
│ [████████████░░░░░░░░░░░░░░░░] 36%          [⏹ Cancelar]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ✅ E1: "En un mundo donde cada mechón..."    ▶ 3.2s  ⏬     │
│ ✅ E2: "Domenech. Donde el arte..."          ▶ 5.1s  ⏬     │
│ ✅ E4: "José toma las tijeras..."            ▶ 4.3s  ⏬     │
│ ✅ E5: "La transformación comienza..."       ▶ 3.8s  ⏬     │
│ ✅ E6: "Cada corte es una promesa..."        ▶ 2.9s  ⏬     │
│ ✅ E7: "El espejo revela la magia..."        ▶ 3.5s  ⏬     │
│ ✅ E8: "Una sonrisa que lo dice todo..."     ▶ 4.1s  ⏬     │
│ ✅ E9: "Porque en Domenech..."               ▶ 3.0s  ⏬     │
│ 🟡 E10: Generando...                        ●●●            │
│ ○ E11: En cola                                               │
│ ○ E12: En cola                                               │
│ ○ ...                                                        │
│ ⬜ E3: SILENCIO (sin narración)                               │
│ ⬜ E15: SILENCIO                                              │
│                                                              │
│ Tiempo estimado restante: ~45 segundos                       │
│ Voz: Lucía (ES) · Estilo: Pixar · Velocidad: 1.0x           │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Generación por Escena (una a una)

### Card de escena expandida con narración

```
┌──────────────────────────────────────────────────────────────────┐
│ #1  Cold Open Tijeras                              Hook · 3s    │
│ Apertura en frío: primer plano extremo de tijeras...            │
│                                                                  │
│ ┌─── 🎙️ NARRACIÓN ──────────────────────────────────────────┐   │
│ │                                                             │   │
│ │  Texto:                                                     │   │
│ │  ┌──────────────────────────────────────────────────────┐  │   │
│ │  │ En un mundo donde cada mechón cuenta una historia,   │  │   │
│ │  │ las tijeras son el pincel del artista.                │  │   │
│ │  └──────────────────────────────────────────────────────┘  │   │
│ │  [🤖 Reescribir con IA]  [✏️ Editar]  Chars: 98           │   │
│ │                                                             │   │
│ │  Audio: ✅ Generado                                         │   │
│ │  ┌──────────────────────────────────────────────────────┐  │   │
│ │  │ ▶  00:00 [═══════●═══════════] 00:03.2   🔊 ██░░    │  │   │
│ │  │                                                       │  │   │
│ │  │ Onda: ▁▂▃▅▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇▅▃▂▁                  │  │   │
│ │  └──────────────────────────────────────────────────────┘  │   │
│ │                                                             │   │
│ │  Voz: Lucía (ES) · Estilo: Pixar · 1.0x · 3.2s            │   │
│ │                                                             │   │
│ │  [🔄 Regenerar]  [🎤 Cambiar Voz]  [⏬ MP3]  [🗑 Borrar]   │   │
│ │  [📤 Subir mi audio]                                       │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Escena SIN audio (estado vacío)

```
┌──────────────────────────────────────────────────────────────────┐
│ #3  Salón Interior                              Build · 5s      │
│ Interior del salón con José atendiendo a un cliente             │
│                                                                  │
│ ┌─── 🎙️ NARRACIÓN ──────────────────────────────────────────┐   │
│ │                                                             │   │
│ │  Texto:                                                     │   │
│ │  ┌──────────────────────────────────────────────────────┐  │   │
│ │  │ (vacío — escribe o genera con IA)                    │  │   │
│ │  └──────────────────────────────────────────────────────┘  │   │
│ │  [🤖 Generar texto con IA]  [⬜ Marcar como silencio]       │   │
│ │                                                             │   │
│ │  Audio: 🔴 Sin generar                                      │   │
│ │  ┌──────────────────────────────────────────────────────┐  │   │
│ │  │                                                       │  │   │
│ │  │   🎙️ Escribe el texto arriba y pulsa "Generar"        │  │   │
│ │  │      o sube tu propio audio                           │  │   │
│ │  │                                                       │  │   │
│ │  │   [🤖 Generar Audio]  [📤 Subir MP3]                  │  │   │
│ │  │                                                       │  │   │
│ │  └──────────────────────────────────────────────────────┘  │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Escena GENERANDO (estado loading)

```
┌──────────────────────────────────────────────────────────────────┐
│ #4  Corte José                                  Build · 4s      │
│                                                                  │
│ ┌─── 🎙️ NARRACIÓN ──────────────────────────────────────────┐   │
│ │                                                             │   │
│ │  Texto: "José toma las tijeras con la precisión de un..."   │   │
│ │                                                             │   │
│ │  Audio: 🟡 Generando...                                     │   │
│ │  ┌──────────────────────────────────────────────────────┐  │   │
│ │  │                                                       │  │   │
│ │  │   ●●● Generando audio con ElevenLabs...               │  │   │
│ │  │   Voz: Lucía · Estilo: Pixar · ~4 segundos            │  │   │
│ │  │                                                       │  │   │
│ │  │   [████████████░░░░░░░░] 60%                          │  │   │
│ │  │                                                       │  │   │
│ │  │              [⏹ Cancelar generación]                   │  │   │
│ │  │                                                       │  │   │
│ │  └──────────────────────────────────────────────────────┘  │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Generación Completa (todo el video)

### Modo "Narración continua"

En vez de generar audio escena por escena, se concatena todo el texto y se genera un solo audio continuo:

```
Texto completo del video:

"En un mundo donde cada mechón cuenta una historia, las tijeras son el 
pincel del artista. [PAUSA 1s] Domenech. Donde el arte se hace en cada 
corte. [PAUSA 2s] José toma las tijeras con la precisión de un cirujano. 
[PAUSA 1s] La transformación comienza... [PAUSA 1.5s] ..."
```

La IA inserta `[PAUSA Xs]` entre escenas según la duración de cada una.

### Reproductor del audio completo

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎙️ NARRACIÓN COMPLETA DEL VIDEO                                 │
│ Spot YouTube · 75 segundos · Voz: Lucía · Estilo: Pixar         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Forma de onda:                                                   │
│ ▁▂▃▅▇█▇▅▃▁ ▁▂▃▅▇▅▃▂▁ ▁▃▅▇█▇▅▃▁▂▃▅▇█▇▅▃▁ ▁▂▃▅▇▅▃▂▁▁▂▃▅▇█▇▅  │
│ |  E1  | E2 |  PAUSA  |     E4     | E5 |  E6  |    E7    |     │
│                                                                  │
│ ▶  00:23 [═══════════════●═══════════════════════] 01:02         │
│                                                                  │
│ 🔊 ████████░░  ×1.0                                              │
│                                                                  │
│ Escena actual: E4 — "José toma las tijeras con la precisión..."  │
│                                                                  │
│ [⏬ Descargar MP3]  [🔄 Regenerar Todo]  [✏️ Editar Guión]       │
│ [📋 Copiar Guión]   [🗑 Borrar]          [📤 Subir a Video]      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Estilos de Narración

### Estilos predefinidos con instrucciones para ElevenLabs

| Estilo | Descripción | Instrucciones para IA (text prompt) | Parámetros ElevenLabs |
|--------|-------------|--------------------------------------|----------------------|
| **Narrador Documental** | Voz seria, informativa, ritmo pausado | "Narra como un documental de National Geographic. Tono serio, informativo, con pausas para dar peso a las palabras." | stability: 0.7, similarity: 0.8, style: 0.3 |
| **Cartoon / Animación** | Voz exagerada, divertida, expresiva | "Narra con energía de dibujo animado. Exagera las emociones, usa exclamaciones, sé juguetón." | stability: 0.3, similarity: 0.7, style: 0.8 |
| **Pixar (cálido/emotivo)** | Voz cálida, con emoción contenida | "Narra como un trailer de Pixar. Cálido, emotivo, con momentos de asombro. Haz que el oyente sienta nostalgia y esperanza." | stability: 0.5, similarity: 0.8, style: 0.6 |
| **Épico / Cinemático** | Voz grave, dramática, con eco | "Narra como un trailer de película épica. Voz profunda, dramática, con pausas largas y énfasis en palabras clave." | stability: 0.6, similarity: 0.9, style: 0.5 |
| **ASMR / Susurro** | Voz suave, íntima, muy cercana | "Narra en un susurro íntimo. Muy suave, como si hablaras al oído. Sin prisa, cada palabra con cuidado." | stability: 0.8, similarity: 0.9, style: 0.2, speed: 0.8 |
| **Comercial / Energético** | Voz fuerte, rápida, motivadora | "Narra como un anuncio de TV. Energético, positivo, con llamadas a la acción claras. Ritmo rápido." | stability: 0.5, similarity: 0.7, style: 0.7, speed: 1.15 |
| **Infantil** | Voz dulce, simple, clara | "Narra para niños de 6 años. Vocabulario simple, tono dulce, con asombro en cada frase." | stability: 0.4, similarity: 0.7, style: 0.6, speed: 0.9 |
| **Misterioso / Thriller** | Voz baja, tensa, con suspense | "Narra como un thriller. Voz baja, tensa, con pausas que generan suspense. Algo oscuro acecha." | stability: 0.6, similarity: 0.8, style: 0.4, speed: 0.9 |
| **Custom** | El usuario define sus instrucciones | Texto libre del usuario en el sidebar | Parámetros del sidebar |

### Cómo funciona el estilo

```
1. El usuario elige estilo "Pixar" en el sidebar
2. La IA usa las instrucciones del estilo para:
   a) ESCRIBIR el texto de narración (si no existe): adapta el tono, vocabulario, ritmo
   b) CONFIGURAR ElevenLabs: stability, similarity, style, speed
   c) ELEGIR la voz más adecuada (sugiere voces cálidas para Pixar, graves para épico)
3. Se genera el audio con esos parámetros
4. El resultado suena coherente con el estilo elegido
```

---

## 8. Reproductor de Audio

### Componente `AudioPlayer`

Reproductor reutilizable con estas funcionalidades:

```
┌──────────────────────────────────────────────────────────────┐
│ ▶  00:12 [═══════════●═══════════════════════] 00:03.2       │
│                                                              │
│ Onda: ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇▅▃▂▁▁▂▃▅▇█▇▅▃▁                       │
│                                                              │
│ 🔊 ████░░░░  ×1.0  [0.7] [0.8] [1.0] [1.1] [1.2] [1.3]    │
└──────────────────────────────────────────────────────────────┘

Controles:
- Play/Pause (click o barra espaciadora)
- Barra de progreso (click para saltar)
- Forma de onda visual (Web Audio API)
- Control de volumen (slider)
- Velocidad de reproducción (6 opciones)
- Tiempo actual / tiempo total
```

### Implementación técnica del waveform

```typescript
// Usar Web Audio API para generar forma de onda visual
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

// Al cargar el audio:
const response = await fetch(audioUrl);
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

// Extraer datos de forma de onda para visualización estática
const rawData = audioBuffer.getChannelData(0);
const samples = 100; // número de barras en la visualización
const blockSize = Math.floor(rawData.length / samples);
const waveformData = [];
for (let i = 0; i < samples; i++) {
  let sum = 0;
  for (let j = 0; j < blockSize; j++) {
    sum += Math.abs(rawData[i * blockSize + j]);
  }
  waveformData.push(sum / blockSize);
}
// Renderizar waveformData como barras SVG o divs
```

---

## 9. Estados de la UI

### Estados posibles de cada escena

| Estado | Icono | Color | Descripción | Acciones disponibles |
|--------|-------|-------|-------------|---------------------|
| `no_text` | ○ | Gris | Sin texto de narración | Escribir texto, Generar con IA, Upload audio |
| `has_text` | ◐ | Azul | Tiene texto pero no audio | Generar audio, Editar texto, Upload audio |
| `silence` | ⬜ | Gris claro | Marcada como silencio (intencionalmente sin narración) | Desmarcar silencio |
| `generating` | 🟡 | Amarillo pulsante | Audio generándose con ElevenLabs | Cancelar generación |
| `generated` | ✅ | Verde | Audio generado y listo | Play, Descargar, Regenerar, Borrar |
| `uploaded` | 📤 | Verde + icono | Audio subido manualmente | Play, Descargar, Reemplazar, Borrar |
| `error` | ❌ | Rojo | Error al generar | Reintentar, Editar texto, Ver error |
| `cancelled` | ⏹ | Naranja | Generación cancelada por el usuario | Reintentar |

### Transiciones de estado

```
no_text ──→ has_text (usuario escribe o IA genera texto)
no_text ──→ silence (usuario marca como silencio)
has_text ──→ generating (usuario pulsa "Generar Audio")
generating ──→ generated (ElevenLabs responde OK)
generating ──→ error (ElevenLabs falla)
generating ──→ cancelled (usuario cancela)
generated ──→ has_text (usuario borra el audio)
generated ──→ generating (usuario regenera)
no_text ──→ uploaded (usuario sube MP3 sin texto)
any ──→ no_text (usuario borra todo)
```

### Cancelación de generación

```typescript
// Cada generación tiene un AbortController
const controller = new AbortController();

const generateAudio = async (text: string, voiceId: string) => {
  try {
    const response = await fetch('/api/ai/generate-narration', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId, sceneId }),
      signal: controller.signal, // ← permite cancelar
    });
    // ...procesar respuesta
  } catch (error) {
    if (error.name === 'AbortError') {
      // Cancelado por el usuario → estado 'cancelled'
      updateSceneNarrationStatus(sceneId, 'cancelled');
    } else {
      // Error real → estado 'error'
      updateSceneNarrationStatus(sceneId, 'error', error.message);
    }
  }
};

// Para cancelar:
const cancelGeneration = () => {
  controller.abort();
};
```

---

## 10. Subir a Supabase y Asociar

### Flujo de guardado

```
1. ElevenLabs genera audio → devuelve ArrayBuffer (MP3)
2. Crear blob: new Blob([arrayBuffer], { type: 'audio/mpeg' })
3. Subir a Supabase Storage:
   Ruta: {projectId}/narration/{sceneId}/{timestamp}.mp3
   O para video completo: {projectId}/narration/full/{videoId}/{timestamp}.mp3
4. Obtener URL pública del archivo
5. Actualizar la tabla scenes o videos:
   - scenes.narration_audio_url = url
   - scenes.narration_audio_duration_ms = duración
   - scenes.narration_text = texto
   O para video completo:
   - videos.narration_full_audio_url = url
   - videos.narration_full_text = texto completo
6. Mostrar el reproductor con el audio
```

### Código de upload

```typescript
async function uploadNarrationAudio(
  projectId: string,
  sceneId: string,
  audioBlob: Blob,
  durationMs: number,
  text: string
) {
  const timestamp = Date.now();
  const path = `${projectId}/narration/${sceneId}/${timestamp}.mp3`;

  // 1. Subir a Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('narration-audio')
    .upload(path, audioBlob, {
      contentType: 'audio/mpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 2. Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('narration-audio')
    .getPublicUrl(path);

  // 3. Actualizar escena en la BD
  const { error: updateError } = await supabase
    .from('scenes')
    .update({
      narration_audio_url: publicUrl,
      narration_audio_duration_ms: durationMs,
      narration_text: text,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sceneId);

  if (updateError) throw updateError;

  return { url: publicUrl, path, durationMs };
}
```

---

## 11. Descargar MP3

### Opciones de descarga

| Tipo | Qué descarga | Nombre del archivo | Formato |
|------|-------------|-------------------|---------|
| **Escena individual** | Audio de una sola escena | `E01-cold-open-tijeras.mp3` | MP3 128kbps |
| **Todas las escenas (ZIP)** | ZIP con un MP3 por escena | `spot-youtube-narraciones.zip` | ZIP con MP3s |
| **Audio completo** | Un solo MP3 con toda la narración concatenada | `spot-youtube-narracion-completa.mp3` | MP3 192kbps |
| **Audio + guión** | ZIP con MP3s + archivo de texto con el guión | `spot-youtube-narracion-pack.zip` | ZIP (MP3 + TXT) |

### Implementación de descarga

```typescript
// Descarga individual
function downloadSceneAudio(audioUrl: string, sceneName: string) {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = `${sceneName}.mp3`;
  link.click();
}

// Descarga ZIP (todas las escenas) — usar JSZip en el navegador
import JSZip from 'jszip';

async function downloadAllAsZip(scenes: SceneWithAudio[], videoTitle: string) {
  const zip = new JSZip();
  const folder = zip.folder('narraciones');

  for (const scene of scenes) {
    if (scene.narration_audio_url) {
      const response = await fetch(scene.narration_audio_url);
      const blob = await response.blob();
      const fileName = `${scene.scene_number}-${slugify(scene.title)}.mp3`;
      folder.file(fileName, blob);
    }
  }

  // Añadir guión como TXT
  const script = scenes
    .map(s => `[${s.scene_number}] ${s.title}\n${s.narration_text || '(SILENCIO)'}\n`)
    .join('\n');
  folder.file('guion-completo.txt', script);

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${slugify(videoTitle)}-narraciones.zip`;
  link.click();
}
```

---

## 12. Modelo de Datos

### Campos existentes que ya usamos (tabla `scenes`)

```sql
-- Ya existen en la BD:
narration_text          TEXT        -- Texto de la narración
narration_audio_url     TEXT        -- URL del audio en Supabase Storage
narration_audio_duration_ms INTEGER -- Duración en milisegundos
```

### Nuevos campos a añadir a `scenes`

```sql
ALTER TABLE scenes
  ADD COLUMN narration_status VARCHAR(20) DEFAULT 'no_text',
    -- 'no_text', 'has_text', 'silence', 'generating', 'generated', 'uploaded', 'error'
  ADD COLUMN narration_voice_id VARCHAR(100),
    -- ID de la voz de ElevenLabs usada
  ADD COLUMN narration_voice_name VARCHAR(100),
    -- Nombre legible: "Lucía (ES)"
  ADD COLUMN narration_style VARCHAR(50),
    -- 'documentary', 'cartoon', 'pixar', 'epic', 'asmr', 'commercial', 'kids', 'thriller', 'custom'
  ADD COLUMN narration_speed FLOAT DEFAULT 1.0,
    -- Velocidad de narración (0.7 a 1.3)
  ADD COLUMN narration_audio_path TEXT,
    -- Path en Supabase Storage (para poder borrar)
  ADD COLUMN narration_metadata JSONB DEFAULT '{}';
    -- Datos extra: { stability, similarity, style_exaggeration, generated_at, provider, model }
```

### Nuevos campos a añadir a `videos`

```sql
ALTER TABLE videos
  ADD COLUMN narration_full_text TEXT,
    -- Guión completo concatenado
  ADD COLUMN narration_full_audio_url TEXT,
    -- URL del audio completo del video
  ADD COLUMN narration_full_audio_path TEXT,
  ADD COLUMN narration_full_audio_duration_ms INTEGER,
  ADD COLUMN narration_voice_id VARCHAR(100),
  ADD COLUMN narration_voice_name VARCHAR(100),
  ADD COLUMN narration_style VARCHAR(50),
  ADD COLUMN narration_config JSONB DEFAULT '{}';
    -- { speed, stability, similarity, style, language, instructions }
```

### Nueva tabla: `narration_history`

Historial de versiones de narración (para poder volver a versiones anteriores):

```sql
CREATE TABLE narration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  narration_text TEXT,
  audio_url TEXT,
  audio_path TEXT,
  audio_duration_ms INTEGER,
  voice_id VARCHAR(100),
  voice_name VARCHAR(100),
  style VARCHAR(50),
  speed FLOAT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_narration_history_scene ON narration_history(scene_id);
CREATE INDEX idx_narration_history_video ON narration_history(video_id);
```

---

## 13. API Routes

| Método | Ruta | Body | Response | Descripción |
|--------|------|------|----------|-------------|
| POST | `/api/ai/generate-narration` | `{ text, voiceId, sceneId, style, speed, stability, similarity }` | `{ audioUrl, audioPath, durationMs }` | Genera audio para UNA escena |
| POST | `/api/ai/generate-narration-batch` | `{ videoId, scenes[{sceneId, text}], voiceId, style, speed }` | SSE stream con progreso | Genera audio para múltiples escenas en secuencia |
| POST | `/api/ai/generate-narration-full` | `{ videoId, fullText, voiceId, style, speed }` | `{ audioUrl, audioPath, durationMs }` | Genera audio completo del video (un solo archivo) |
| POST | `/api/ai/generate-narration-text` | `{ videoId, style, sceneIds? }` | `{ scenes[{sceneId, text}] }` | La IA genera textos de narración (sin audio) |
| GET | `/api/ai/voices` | — | `{ voices[{id, name, language, gender, preview_url, tags}] }` | Lista voces disponibles de ElevenLabs |
| POST | `/api/narration/upload` | FormData (audio file + sceneId) | `{ audioUrl, audioPath, durationMs }` | Upload manual de audio |
| DELETE | `/api/narration/[sceneId]` | — | `{ success }` | Borrar audio de una escena |
| DELETE | `/api/narration/video/[videoId]` | — | `{ success, deletedCount }` | Borrar todo el audio de un video |
| GET | `/api/narration/history/[sceneId]` | — | `{ versions[] }` | Historial de versiones de narración |

### API Route principal: `/api/ai/generate-narration`

```typescript
// app/api/ai/generate-narration/route.ts
import { ElevenLabsClient } from 'elevenlabs';

export async function POST(req: Request) {
  const { text, voiceId, sceneId, style, speed, stability, similarity } = await req.json();

  // 1. Verificar auth
  const supabase = createClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Verificar límites del plan del usuario
  const usage = await checkNarrationUsage(user.id);
  if (usage.exceeded) {
    return Response.json({ error: 'Narration limit exceeded', limit: usage.limit }, { status: 429 });
  }

  // 3. Generar audio con ElevenLabs
  const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: stability ?? 0.5,
      similarity_boost: similarity ?? 0.8,
      style: getStyleExaggeration(style) ?? 0.5,
      use_speaker_boost: true,
    },
    // Velocidad (solo en modelos Turbo v2.5)
    ...(speed !== 1.0 && { speed }),
  });

  // 4. Convertir stream a buffer
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  const audioBuffer = Buffer.concat(chunks);

  // 5. Calcular duración (parseando header MP3 o usando ffprobe)
  const durationMs = await getAudioDuration(audioBuffer);

  // 6. Subir a Supabase Storage
  const path = `${projectId}/narration/${sceneId}/${Date.now()}.mp3`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('narration-audio')
    .upload(path, audioBuffer, { contentType: 'audio/mpeg' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('narration-audio')
    .getPublicUrl(path);

  // 7. Actualizar escena
  await supabaseAdmin.from('scenes').update({
    narration_text: text,
    narration_audio_url: publicUrl,
    narration_audio_path: path,
    narration_audio_duration_ms: durationMs,
    narration_status: 'generated',
    narration_voice_id: voiceId,
    narration_style: style,
    narration_speed: speed,
    narration_metadata: { stability, similarity, generated_at: new Date().toISOString(), provider: 'elevenlabs' },
  }).eq('id', sceneId);

  // 8. Guardar en historial
  await supabaseAdmin.from('narration_history').insert({
    scene_id: sceneId,
    narration_text: text,
    audio_url: publicUrl,
    audio_path: path,
    audio_duration_ms: durationMs,
    voice_id: voiceId,
    style,
    speed,
  });

  // 9. Registrar uso
  await incrementNarrationUsage(user.id, text.length);

  return Response.json({ audioUrl: publicUrl, audioPath: path, durationMs });
}
```

### Batch generation con SSE (Server-Sent Events)

```typescript
// app/api/ai/generate-narration-batch/route.ts
export async function POST(req: Request) {
  const { videoId, scenes, voiceId, style, speed } = await req.json();

  // Usar SSE para enviar progreso al cliente
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let completed = 0;

      for (const scene of scenes) {
        // Enviar estado "generating" para esta escena
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'generating', sceneId: scene.sceneId, index: completed + 1, total: scenes.length })}\n\n`
        ));

        try {
          // Generar audio para esta escena
          const result = await generateSingleNarration(scene.sceneId, scene.text, voiceId, style, speed);

          completed++;
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'completed', sceneId: scene.sceneId, audioUrl: result.audioUrl, durationMs: result.durationMs, index: completed, total: scenes.length })}\n\n`
          ));
        } catch (error) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', sceneId: scene.sceneId, error: error.message })}\n\n`
          ));
        }
      }

      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: 'done', completed, total: scenes.length })}\n\n`
      ));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

---

## 14. Integración con ElevenLabs

### Voces recomendadas para español

| Voice ID | Nombre | Género | Tono | Mejor para |
|----------|--------|--------|------|-----------|
| `EXAVITQu4vr4xnSDxMaL` | Bella | Femenino | Cálido, suave | Pixar, Documental |
| `ErXwobaYiN019PkySvjV` | Antoni | Masculino | Firme, profesional | Comercial, Épico |
| `MF3mGyEYCl7XYWbV9V6O` | Elli | Femenino | Joven, energético | Cartoon, Infantil |
| `TxGEqnHWrfWFTfGW9XjX` | Josh | Masculino | Narrativo, profundo | Documental, Thriller |
| `pNInz6obpgDQGcFmaJgB` | Adam | Masculino | Grave, autoridad | Épico, Misterioso |
| `21m00Tcm4TlvDq8ikWAM` | Rachel | Femenino | Clara, neutral | Comercial |

### Configuración por estilo

```typescript
const STYLE_CONFIGS: Record<string, ElevenLabsConfig> = {
  documentary: {
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.3,
    speed: 0.95,
    recommended_voices: ['TxGEqnHWrfWFTfGW9XjX', 'ErXwobaYiN019PkySvjV'],
  },
  cartoon: {
    stability: 0.3,
    similarity_boost: 0.7,
    style: 0.8,
    speed: 1.1,
    recommended_voices: ['MF3mGyEYCl7XYWbV9V6O'],
  },
  pixar: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.6,
    speed: 1.0,
    recommended_voices: ['EXAVITQu4vr4xnSDxMaL', 'TxGEqnHWrfWFTfGW9XjX'],
  },
  epic: {
    stability: 0.6,
    similarity_boost: 0.9,
    style: 0.5,
    speed: 0.9,
    recommended_voices: ['pNInz6obpgDQGcFmaJgB', 'ErXwobaYiN019PkySvjV'],
  },
  asmr: {
    stability: 0.8,
    similarity_boost: 0.9,
    style: 0.2,
    speed: 0.8,
    recommended_voices: ['EXAVITQu4vr4xnSDxMaL'],
  },
  commercial: {
    stability: 0.5,
    similarity_boost: 0.7,
    style: 0.7,
    speed: 1.15,
    recommended_voices: ['21m00Tcm4TlvDq8ikWAM', 'ErXwobaYiN019PkySvjV'],
  },
  kids: {
    stability: 0.4,
    similarity_boost: 0.7,
    style: 0.6,
    speed: 0.9,
    recommended_voices: ['MF3mGyEYCl7XYWbV9V6O'],
  },
  thriller: {
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.4,
    speed: 0.9,
    recommended_voices: ['pNInz6obpgDQGcFmaJgB'],
  },
};
```

---

## 15. Zustand Store

```typescript
// stores/useNarrationStore.ts
interface NarrationState {
  // Configuración global (sidebar)
  mode: 'per_scene' | 'full_video';
  selectedVoiceId: string | null;
  selectedVoiceName: string | null;
  selectedStyle: NarrationStyle;
  speed: number;
  stability: number;
  similarity: number;
  language: string;
  customInstructions: string;

  // Estado de generación
  generatingSceneIds: Set<string>;
  generationProgress: { current: number; total: number } | null;
  abortControllers: Map<string, AbortController>;

  // Audio del video completo
  fullVideoAudioUrl: string | null;
  fullVideoAudioDuration: number | null;
  fullVideoText: string | null;

  // Reproductor
  playingSceneId: string | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playbackSpeed: number;

  // Acciones
  setConfig: (config: Partial<NarrationConfig>) => void;
  generateForScene: (sceneId: string, text: string) => Promise<void>;
  generateBatch: (videoId: string, scenes: SceneForNarration[]) => Promise<void>;
  generateFullVideo: (videoId: string, fullText: string) => Promise<void>;
  cancelGeneration: (sceneId?: string) => void;
  cancelAllGenerations: () => void;
  deleteNarration: (sceneId: string) => Promise<void>;
  deleteAllNarrations: (videoId: string) => Promise<void>;
  downloadScene: (sceneId: string) => void;
  downloadAll: (videoId: string) => Promise<void>;
  playScene: (sceneId: string) => void;
  stopPlaying: () => void;
  uploadAudio: (sceneId: string, file: File) => Promise<void>;
  reset: () => void;
}
```

---

## 16. Componentes React

### Árbol de componentes

```
NarrationPage
├── NarrationHeader                    ← Barra superior (stats, acciones globales)
├── NarrationSidebar                   ← Sidebar lateral con configuración
│   ├── ModeSelector                   ← Por escena / Video completo
│   ├── VoiceSelector                  ← Lista de voces con preview
│   │   └── VoiceCard                  ← Card individual de voz
│   ├── StyleSelector                  ← Grid de estilos predefinidos
│   ├── SpeedSlider                    ← Slider de velocidad
│   ├── StabilitySlider                ← Slider de estabilidad
│   ├── LanguageSelector               ← Dropdown de idioma
│   ├── CustomInstructionsInput        ← Textarea para instrucciones custom
│   └── SidebarActions                 ← Botones: Generar Todo, Cancelar, Descargar ZIP
├── NarrationSceneList                 ← Lista de escenas con narración
│   └── NarrationSceneCard             ← Card individual de escena
│       ├── NarrationTextEditor        ← Textarea editable para el texto
│       ├── NarrationAudioPlayer       ← Reproductor de audio (waveform)
│       ├── NarrationStatusBadge       ← Badge de estado (generado, error, etc)
│       ├── NarrationActions           ← Botones: Generar, Regenerar, Descargar, Borrar
│       └── NarrationGeneratingState   ← Estado loading con barra de progreso
├── NarrationFullPlayer                ← Reproductor del audio completo del video
│   └── WaveformVisualization          ← Forma de onda con marcadores de escena
├── NarrationEmptyState                ← Estado vacío con onboarding
├── NarrationBatchProgress             ← Progreso de generación batch (overlay)
└── NarrationAIDialog                  ← Diálogo conversacional con Kiyoko
```

### Componente principal

```typescript
// app/project/[slug]/videos/[videoSlug]/narration/page.tsx
'use client';

import { useEffect } from 'react';
import { useNarrationStore } from '@/stores/useNarrationStore';
import { useVideoStore } from '@/stores/useVideoStore';
import { useRealtimeVideo } from '@/hooks/useRealtimeVideo';
import { NarrationHeader } from '@/components/narration/NarrationHeader';
import { NarrationSidebar } from '@/components/narration/NarrationSidebar';
import { NarrationSceneList } from '@/components/narration/NarrationSceneList';
import { NarrationFullPlayer } from '@/components/narration/NarrationFullPlayer';
import { NarrationEmptyState } from '@/components/narration/NarrationEmptyState';
import { NarrationBatchProgress } from '@/components/narration/NarrationBatchProgress';

export default function NarrationPage({ params }: { params: { slug: string; videoSlug: string } }) {
  const { fetchVideoWithScenes, videoScenes, getActiveVideo } = useVideoStore();
  const { generationProgress, fullVideoAudioUrl } = useNarrationStore();
  const video = getActiveVideo();

  useEffect(() => {
    fetchVideoWithScenes(params.videoSlug, params.slug);
  }, [params.videoSlug]);

  // Realtime: actualizar cuando la IA genere narración via chat
  useRealtimeVideo(video?.id ?? null);

  const scenesWithAudio = videoScenes.filter(vs => vs.scene?.narration_audio_url);
  const scenesWithoutAudio = videoScenes.filter(vs => !vs.scene?.narration_audio_url && vs.scene?.narration_status !== 'silence');
  const hasAnyAudio = scenesWithAudio.length > 0 || fullVideoAudioUrl;

  if (!video) return <div>Cargando...</div>;

  return (
    <div className="flex h-full">
      {/* Sidebar izquierdo */}
      <NarrationSidebar videoId={video.id} />

      {/* Área principal */}
      <div className="flex-1 overflow-y-auto">
        <NarrationHeader
          video={video}
          totalScenes={videoScenes.length}
          withAudio={scenesWithAudio.length}
          withoutAudio={scenesWithoutAudio.length}
        />

        {!hasAnyAudio && videoScenes.length > 0 && (
          <NarrationEmptyState videoId={video.id} />
        )}

        <NarrationSceneList
          videoScenes={videoScenes}
          videoId={video.id}
        />

        {fullVideoAudioUrl && (
          <NarrationFullPlayer
            audioUrl={fullVideoAudioUrl}
            videoTitle={video.title}
            scenes={videoScenes}
          />
        )}
      </div>

      {/* Overlay de progreso batch */}
      {generationProgress && (
        <NarrationBatchProgress
          current={generationProgress.current}
          total={generationProgress.total}
        />
      )}
    </div>
  );
}
```

---

## 17. Edge Cases y Errores

### Textos largos

```
Límite ElevenLabs por request: ~5,000 caracteres
Si el texto de una escena es más largo:
  → Dividir en chunks de 4,500 chars
  → Generar audio por chunk
  → Concatenar los audios con FFmpeg.wasm en el navegador
  → Resultado: un solo archivo MP3 sin cortes
```

### ElevenLabs rate limit

```
Si la API devuelve 429 (Too Many Requests):
  → Esperar el tiempo indicado en retry-after header
  → Reintentar automáticamente
  → Mostrar al usuario: "Esperando... reintentando en 15s"
  → Si falla 3 veces → error con opción de reintentar manual
```

### Audio muy corto (< 1 segundo)

```
ElevenLabs puede tener problemas con textos de < 10 caracteres.
Si el texto es muy corto:
  → Añadir padding de silencio
  → O mostrar aviso: "El texto es muy corto. ¿Quieres añadir más?"
```

### Escena marcada como silencio

```
Si la escena está marcada como "silencio":
  → No generar audio
  → Mostrar icono ⬜ con texto "(Silencio intencionado)"
  → En la exportación del video, insertar silencio de la duración de la escena
  → El usuario puede desmarcar en cualquier momento
```

### Cambio de voz a mitad del batch

```
Si el usuario cambia la voz en el sidebar mientras se genera un batch:
  → Las escenas ya generadas mantienen la voz anterior
  → Las escenas pendientes usan la nueva voz
  → Mostrar aviso: "⚠️ Has cambiado la voz. Las escenas ya generadas 
    mantienen la voz anterior. ¿Regenerar las completadas?"
    [Sí, regenerar todas] [No, solo las pendientes]
```

### Pérdida de conexión

```
Si la conexión se pierde durante la generación:
  → Las escenas ya completadas se mantienen (ya están en Supabase)
  → La escena en proceso se marca como 'error'
  → Al reconectar: "Se perdió la conexión. 5 escenas se completaron,
    1 falló. ¿Continuar con las 16 restantes?"
    [Continuar] [Cancelar]
```

### Usuario cierra la página durante generación

```
beforeunload handler:
window.addEventListener('beforeunload', (e) => {
  if (narrationStore.generatingSceneIds.size > 0) {
    e.preventDefault();
    e.returnValue = '¿Seguro? Hay narración generándose. Si sales, las 
    escenas completadas se guardarán pero las pendientes se cancelarán.';
  }
});
```

---

*Documento funcional y técnico del sistema de narración de Kiyoko AI*  
*Versión 1.0 — Marzo 2026*
