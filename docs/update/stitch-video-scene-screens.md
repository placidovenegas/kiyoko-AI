# Stitch IA - Diseno de pantallas de Videos y Scenes

## Objetivo

Este documento define como debe verse la experiencia de videos y escenas de Kiyoko AI para generar mockups de producto en Stitch IA.

Incluye:

- direccion visual completa,
- dark mode de referencia,
- tamanos sugeridos,
- todo lo que debe aparecer,
- todo lo que debe poder hacerse,
- prompt para la pagina de videos,
- prompt para la pagina de detalle de video con escenas,
- prompt para la vista de escenas.

La direccion general debe sentirse Notion + cinematic, con enfoque de software creativo premium para produccion audiovisual.

---

## Direccion visual general

### Sensacion

La experiencia debe transmitir:

- claridad estructural,
- control editorial,
- flujo de produccion serio,
- rapidez operacional,
- asistencia de IA integrada,
- elegancia oscura,
- precision cinematica.

No debe verse como:

- SaaS generico,
- editor de video amateur,
- panel gamer,
- UI saturada,
- mockup futurista exagerado.

### Colores dark mode de referencia

- background: #0B0D10
- background secondary: #0F1216
- surface: #14181D
- elevated surface: #181D23
- panel: #1C2229
- border: rgba(255,255,255,0.08)
- soft border: rgba(255,255,255,0.05)
- text primary: #F3F5F7
- text secondary: #B7BDC6
- text muted: #8B93A1
- accent blue: #4C8DFF
- accent blue soft: rgba(76,141,255,0.14)
- success: #34D399
- warning: #FBBF24
- danger: #F87171
- cinematic ambient blue: rgba(70,100,160,0.10)
- cinematic ambient amber: rgba(190,140,60,0.08)

### Tamanos base

- navbar: 48px
- sidebar expandido: 256px a 272px
- sidebar colapsado: 72px
- boton primario: 42px a 44px
- boton secundario: 36px a 40px
- cards grandes: radio 24px a 28px
- cards medias: radio 18px a 22px
- menus contextuales: 210px a 240px de ancho
- filas de tabla: 72px a 84px
- cards de escena: 240px a 320px de ancho si es grid

---

## Pantalla 1 - Pagina de Videos

### Objetivo de producto

La pagina de videos debe servir para:

- ver todos los videos de un proyecto,
- entender su estado de produccion,
- detectar cuellos de botella,
- abrir rapidamente un video,
- crear nuevos videos,
- revisar progreso de escenas,
- operar desde una vista clara y profesional.

### Todo lo que debe aparecer

La pagina debe incluir:

- titulo principal de pagina,
- subtitulo orientado a produccion,
- metricas superiores,
- total de videos,
- videos en progreso,
- videos en revision,
- videos aprobados,
- escenas totales,
- porcentaje de escenas aprobadas,
- accion primaria para crear video,
- buscador,
- filtros por estado,
- ordenacion,
- lista o tabla de videos.

### Datos que debe mostrar cada video

Cada item o fila de video debe mostrar:

- thumbnail o cover,
- titulo,
- plataforma,
- estado,
- duracion objetivo,
- numero total de escenas,
- numero de escenas aprobadas,
- progreso visual,
- fecha de actualizacion,
- acceso rapido al detalle,
- menu de acciones.

### Acciones por video

El menu contextual debe incluir:

- abrir video,
- editar datos,
- cambiar estado,
- duplicar,
- archivar o eliminar.

### Prompt final para Stitch - Pagina de videos

Design a premium dark-mode project videos management screen for Kiyoko AI, a professional AI storyboard and media production platform. The visual style must blend Notion-style structure with cinematic creative software atmosphere. The page must feel elegant, editorial, calm, highly organized, and made for serious production.

The screen must include:

- a refined top navbar,
- dark premium app shell,
- a page title for videos,
- a concise subtitle explaining this page manages production outputs inside a project,
- high-level metrics,
- total videos,
- videos in progress,
- videos in review,
- approved videos,
- total scenes,
- scene approval percentage,
- primary action to create a new video,
- search field,
- filters,
- sorting control,
- a professional table or list of videos.

Each video item must include:

- cover image or thumbnail,
- title,
- platform,
- status badge,
- target duration,
- scene count,
- approved scenes count,
- progress bar,
- updated timestamp,
- open detail action,
- three-dot actions menu.

The page should communicate operational control, production flow, scene progress, and creative system clarity.

Use dark premium colors based on:

- background #0B0D10
- secondary background #0F1216
- surface #14181D
- elevated surface #181D23
- panel #1C2229
- primary text #F3F5F7
- secondary text #B7BDC6
- muted text #8B93A1
- primary accent #4C8DFF
- success #34D399
- warning #FBBF24
- danger #F87171

Use a top navbar around 48px high, premium rounded panels, contextual menus around 220px wide, elegant table or list spacing, and a polished cinematic creative-tool atmosphere.

---

## Pantalla 2 - Detalle de video

### Objetivo de producto

La pagina de detalle de video debe servir para:

- entender el estado general del video,
- revisar escenas,
- detectar huecos narrativos,
- revisar prompts e IA,
- entrar a timeline o escenas,
- tener una vista central de produccion.

### Todo lo que debe aparecer

La pantalla debe incluir:

- titulo del video,
- plataforma,
- estado,
- duracion objetivo,
- descripcion breve,
- acciones superiores,
- abrir timeline,
- generar escenas,
- abrir ajustes,
- abrir chat contextual,
- resumen de progreso,
- escenas totales,
- escenas aprobadas,
- escenas pendientes,
- personajes conectados,
- fondos conectados,
- lista o grid de escenas,
- resumen de actividad reciente,
- checklist de preparacion IA.

### Prompt final para Stitch - Detalle de video

Design a premium dark-mode video detail screen for Kiyoko AI, an AI storyboard and media production platform. The screen must feel like a cinematic production cockpit with Notion-like information architecture and premium creative software polish.

The page must include:

- refined top navbar,
- dark app shell,
- video title,
- platform badge,
- production status badge,
- target duration,
- supporting description,
- top actions for timeline, generate scenes, settings, and contextual AI assistance,
- progress summary,
- total scenes,
- approved scenes,
- pending scenes,
- connected characters,
- connected backgrounds,
- scene list or scene grid,
- activity summary,
- AI preparation checklist.

The result must feel like a serious production workspace for planning, supervising, and refining a video before export.

---

## Pantalla 3 - Vista de escenas

### Objetivo de producto

La vista de escenas debe servir para:

- revisar la secuencia narrativa,
- editar rapidamente,
- ver estado de cada escena,
- entender continuidad,
- detectar escenas sin prompt o sin recursos,
- operar como storyboard profesional.

### Todo lo que debe aparecer

Debe incluir:

- titulo de seccion de escenas,
- selector de vista grid o timeline o list,
- filtros por estado,
- metricas de escenas,
- cards o filas de escenas,
- numero de escena,
- titulo,
- descripcion breve,
- tipo de escena,
- estado,
- personajes vinculados,
- fondo vinculado,
- estado de prompt,
- estado de media,
- menu contextual,
- accion para abrir detalle de escena,
- accion para regenerar prompt,
- accion para cambiar estado,
- accion para duplicar o insertar.

### Prompt final para Stitch - Vista de escenas

Design a premium dark-mode scenes management screen for Kiyoko AI, a cinematic AI production platform. The visual style should combine Notion-like structure, storyboard software clarity, and editorial creative-tool atmosphere.

The screen must include:

- scene section title,
- view switcher for grid, list, or timeline,
- filters by status,
- scene metrics,
- professional scene cards or rows,
- scene number,
- title,
- short description,
- scene type,
- status,
- linked characters,
- linked background,
- prompt status,
- media readiness status,
- contextual actions menu,
- open detail action,
- regenerate prompt action,
- change status action,
- duplicate or insert action.

The design should feel like a professional storyboard control panel, calm but powerful, cinematic but highly structured.

---

## Notas para Stitch IA

### Lo que debe evitar

- vistas de tabla aburridas sin jerarquia,
- cards sin ritmo visual,
- exceso de color,
- look gamer,
- look de editor casual,
- mockup futurista exagerado.

### Lo que debe potenciar

- orden,
- continuidad,
- lenguaje de produccion,
- claridad editorial,
- software creativo serio,
- atmosfera cinematica sutil,
- jerarquia tipografica limpia,
- acciones rapidas y entendibles.
