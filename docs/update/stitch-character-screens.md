# Stitch IA - Diseno de pantallas de Characters

## Objetivo

Este documento define con precision visual y funcional como debe verse la experiencia de personajes de Kiyoko AI para generar mockups en Stitch IA.

Incluye:

- Prompt completo para la pagina de lista de personajes.
- Prompt completo para la pagina de detalle de un personaje.
- Direccion visual dark mode.
- Colores de referencia.
- Tamaños sugeridos de navbar, menus, tablas, tarjetas, inputs y popovers.
- Jerarquia de contenido.
- Todo lo que debe aparecer en cada pantalla.
- Todo lo que debe poder hacerse en cada pantalla.

La intencion es que Stitch genere pantallas de producto con un look Notion + cinematic, sobrio, premium, oscuro y muy orientado a herramienta profesional de produccion creativa.

---

## Direccion visual general

### Estilo

La interfaz debe sentirse como una mezcla entre:

- claridad estructural de Notion,
- atmosfera cinematica sofisticada,
- software creativo premium,
- panel editorial oscuro,
- herramienta profesional para direccion visual y consistencia de personajes.

No debe verse como:

- dashboard SaaS generico,
- panel administrativo convencional,
- UI recargada o gamer,
- layout con exceso de brillos o neones,
- producto infantil.

### Sensacion general

La experiencia debe comunicar:

- precision,
- calma,
- jerarquia clara,
- control creativo,
- inteligencia aplicada a produccion audiovisual,
- orden operacional,
- consistencia visual.

La IA debe sentirse integrada como una herramienta silenciosa de trabajo, no como un gimmick.

---

## Dark mode de referencia

Usar un dark mode refinado, con contraste limpio y capas suaves.

### Colores base sugeridos

- Fondo general de app: #0B0D10
- Fondo secundario: #0F1216
- Superficie principal: #14181D
- Superficie elevada: #181D23
- Panel suave: #1C2229
- Borde principal: rgba(255,255,255,0.08)
- Borde suave: rgba(255,255,255,0.05)
- Texto principal: #F3F5F7
- Texto secundario: #B7BDC6
- Texto tenue: #8B93A1
- Accent azul principal: #4C8DFF
- Accent azul suave: rgba(76,141,255,0.14)
- Accent verde exito: #34D399
- Accent verde suave: rgba(52,211,153,0.14)
- Accent ambar warning: #FBBF24
- Accent ambar suave: rgba(251,191,36,0.14)
- Accent rojo error: #F87171
- Accent rojo suave: rgba(248,113,113,0.14)

### Color cinematico complementario

Para dar atmósfera sin romper el look Notion:

- Gradiente ambiental azul-gris: rgba(70,100,160,0.10)
- Gradiente ambiental ambar suave: rgba(190,140,60,0.08)
- Glow sutil premium: rgba(76,141,255,0.18)

### Uso del color

- El color debe usarse con moderacion.
- El fondo no debe ser plano absoluto; puede tener microgradientes o capas muy sutiles.
- Los estados de IA usan azul accent.
- Los estados listos usan verde suave.
- Los estados pendientes usan ambar suave.
- Las acciones destructivas usan rojo suave.

---

## Tipografia y tono

### Estilo tipografico

- Titulos: sobrios, fuertes, compactos, sin exagerar peso.
- Subtitulos: limpios, discretos, alta legibilidad.
- Labels: pequenos, precisos, con tracking leve.
- Texto operativo: claro y corto.
- Copys de ayuda: concretos y profesionales.

### Escala sugerida

- Titulo de pagina: 28px a 34px
- Subtitulo de pagina: 14px a 16px
- Titulo de seccion: 18px a 20px
- Label de tabla: 11px a 12px uppercase
- Texto de celda principal: 14px
- Texto secundario: 12px a 13px
- Caption tenue: 11px a 12px

---

## Reglas de layout global

### Navbar superior

Debe existir una barra superior refinada.

Caracteristicas:

- Altura: 46px a 52px
- Fondo: surface elevada muy discreta
- Borde inferior fino
- Espaciado horizontal: 16px a 20px
- Titulo o breadcrumb contextual cuando aplique
- No sobrecargar con demasiados controles

### Sidebar general

Debe sentirse limpia, profesional y modular.

Caracteristicas:

- Ancho expandido: 248px a 272px
- Ancho colapsado: 68px a 76px
- Superficie ligeramente distinta del fondo principal
- Borde derecho muy sutil
- Separacion clara entre navegacion global y contexto del proyecto

### Contenedor principal

- Ancho maximo sugerido: 1440px a 1600px
- Padding horizontal principal: 24px a 32px
- Padding vertical: 20px a 28px
- Separacion entre bloques: 20px a 28px

### Tarjetas y paneles

- Radio: 20px a 28px
- Sombra: muy suave
- Borde: tenue, siempre visible
- Superficie: ligeramente mas clara que el fondo

### Menus y popovers

- Radio: 14px a 18px
- Padding interno: 8px a 10px
- Alto de item: 36px a 42px
- Ancho de menu contextual: 200px a 240px
- Sombra: premium y controlada
- Fondo: popover oscuro con borde fino

### Botones

- Altura primaria: 40px a 44px
- Altura secundaria: 36px a 40px
- Radio: 12px a 14px
- Peso tipografico: medio o semibold

---

## Pantalla 1 - Lista de personajes

### Objetivo de producto

La pagina de Characters debe servir para:

- ver rapidamente todo el elenco,
- detectar personajes incompletos,
- copiar prompts rapido,
- abrir el detalle de cada personaje,
- entender quien tiene imagen principal,
- ver quienes ya estan listos para escenas,
- trabajar de forma operacional.

La IA no debe dominar visualmente esta pagina.
La pagina es una tabla de trabajo profesional.

### Que tiene que aparecer

La pantalla debe incluir:

- titulo principal de pagina: Characters o Personajes,
- subtitulo corto que explique que aqui se gestiona el elenco del proyecto,
- una fila superior con metricas,
- metrica total de personajes,
- metrica de personajes con imagen principal,
- metrica de personajes con prompt listo,
- metrica de personajes usados en escenas,
- accion primaria para crear personaje,
- opcion de buscar,
- opcion de filtrar,
- opcion de ordenar,
- una tabla profesional y elegante,
- columnas de informacion bien legibles,
- feedback visual claro al hover,
- acciones rapidas por fila,
- empty state si no hay personajes.

### Tabla de personajes - columnas obligatorias

La tabla debe contener:

- personaje,
- rol,
- referencia principal,
- prompt de escena,
- descripcion IA,
- turnaround prompt,
- escenas,
- imagenes,
- actualizado,
- acciones.

### Contenido por fila

Cada fila debe mostrar:

- thumbnail del personaje o avatar fallback,
- nombre,
- breve preview de descripcion visual,
- badge de rol,
- estado de referencia principal,
- estado de prompt de escena,
- estado de descripcion IA,
- estado de turnaround prompt,
- numero de escenas donde aparece,
- cantidad de imagenes guardadas,
- fecha o estado reciente,
- boton rapido para copiar prompt,
- boton para abrir detalle,
- boton de tres puntos con menu contextual.

### Acciones por fila

El menu contextual de cada fila debe incluir:

- abrir detalle,
- copiar prompt,
- duplicar personaje,
- eliminar personaje.

### Estados que deben verse bien

La UI debe mostrar claramente:

- personaje listo,
- personaje sin referencia,
- personaje sin prompt,
- personaje incompleto,
- personaje ya conectado a escenas,
- personaje con varias imagenes.

### Comportamientos visuales

- Hover en fila con fondo levemente elevado.
- Cursor pointer en elementos accionables.
- Boton de copiar prompt visible y rapido.
- Menu de tres puntos discreto pero claro.
- Estado activo o seleccionado elegante.

### Tamaños recomendados

- Alto de fila: 68px a 84px
- Thumbnail personaje: 40px a 52px
- Badge de rol: 22px a 26px de alto
- Boton de icono: 32px a 36px
- Columnas con bastante aire, no compactadas en exceso

### Prompt final para Stitch - Lista de personajes

Design a premium dark-mode characters management screen for Kiyoko AI, a professional AI storyboard and media production platform. The page should feel like Notion clarity combined with cinematic creative software atmosphere. The interface must look editorial, minimal, elegant, and operational, not generic SaaS.

Create a full cast management page for a project workspace.

The screen must include a refined top navbar, a dark premium app shell, subtle sidebar context, and a clean main content area.

The page must show:

- a page title for characters,
- a concise subtitle explaining this page manages the cast used for prompts, visual continuity, and scene production,
- high-level metrics cards,
- total characters,
- characters with main reference image,
- characters with scene prompt ready,
- characters already used in scenes,
- primary action to create a new character,
- search field,
- filters,
- sorting control,
- a professional cast table.

Each row in the table must include:

- character thumbnail or fallback avatar,
- character name,
- brief visual description preview,
- role badge,
- main reference image status,
- scene prompt status,
- AI image description status,
- turnaround sheet prompt status,
- scene usage count,
- image count,
- updated status,
- quick copy prompt button,
- open detail button,
- three-dot contextual actions menu.

The three-dot menu should include:

- open detail,
- copy prompt,
- duplicate character,
- delete character.

The design must include polished hover states, subtle focus hierarchy, pointer-ready interactions, soft elevated row states, muted dark surfaces, refined borders, premium spacing, editorial typography, and cinematic micro-atmosphere.

The page should clearly communicate efficient cast operations, prompt readiness, reference completeness, and production consistency.

Use dark premium colors with the following references:

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
- error #F87171

Use a top navbar around 48px high, rounded panels around 20px to 28px radius, contextual menus around 200px to 240px wide, icon buttons around 32px to 36px, and table rows around 72px high. Make the page feel calm, cinematic, highly structured, and premium.

---

## Pantalla 2 - Detalle de un personaje

### Objetivo de producto

La pagina de detalle de personaje debe servir para:

- definir visualmente al personaje,
- mantener una referencia principal,
- almacenar multiples imagenes,
- generar prompts de imagen y prompts de turnaround,
- editar todos los campos clave,
- generar contenido con IA por campo,
- copiar prompts rapidamente,
- controlar reglas de consistencia,
- revisar en que escenas aparece.

Esta pantalla es el centro operativo del personaje.

### Que tiene que aparecer

La pantalla debe incluir:

- nombre del personaje,
- rol,
- texto de apoyo sobre el uso del personaje,
- acciones principales superiores,
- subir imagenes,
- generar prompt de referencia,
- ver uso en escenas,
- bloque de galeria de referencias,
- imagen principal destacada,
- galeria secundaria,
- estados del personaje,
- campos descriptivos,
- campos de prompts,
- reglas,
- resumen de escenas.

### Galeria de referencias

La galeria debe incluir:

- multiples imagenes del personaje,
- una imagen principal claramente marcada,
- hover evidente sobre cada imagen,
- cursor pointer,
- overlay sutil al pasar el raton,
- boton de tres puntos en una esquina al hover,
- menu contextual por imagen,
- preview o apertura de imagen,
- opcion de usar como principal,
- opcion de generar prompt de imagen desde esa imagen,
- opcion de eliminar imagen,
- etiqueta que indique principal o galeria,
- accion global para subir nuevas imagenes.

### Si se elimina la imagen principal

El diseño debe comunicar que:

- si se elimina la referencia principal,
- otra imagen disponible pasa automaticamente a ser principal,
- el sistema siempre intenta mantener una base visual activa.

### Campos obligatorios del personaje

La pagina debe incluir todos estos campos:

- name,
- role,
- initials,
- visual description,
- general narrative description,
- personality,
- hair description,
- signature clothing,
- accessories,
- signature tools,
- color accent,
- AI image description,
- scene prompt snippet,
- turnaround sheet prompt,
- consistency rules always,
- consistency rules never.

### Comportamiento de cada campo importante

Los campos mas importantes deben mostrar:

- contenido actual,
- accion de editar,
- accion de copiar,
- pequeno boton IA,
- indicador de generacion si esta cargando,
- aspecto de panel de contenido serio y limpio.

### Campos con IA por propiedad

Debe quedar claro que la IA puede generar o mejorar:

- visual description,
- personality,
- hair description,
- signature clothing,
- AI image description,
- scene prompt snippet,
- turnaround sheet prompt.

### Prompt de turnaround

Debe existir una seccion especifica para un prompt largo de turnaround sheet.

Debe comunicar que sirve para generar una imagen de referencia como:

- personaje 3D animated Pixar-style,
- multiple views,
- solid bright green chroma key background,
- front view,
- side profile,
- back view,
- 3/4 angle view,
- close-up facial detail,
- portrait panel,
- consistent studio lighting,
- clean professional layout,
- polished character turnaround sheet.

### Reglas de consistencia

Debe existir una seccion visual limpia para:

- always rules,
- never rules,
- chips o items compactos,
- crear nueva regla,
- borrar regla,
- lectura clara y rapida.

### Escenas

Debe verse:

- lista de escenas donde aparece,
- numero o identificador de escena,
- titulo o resumen,
- bloque corto y elegante.

### Estado del personaje

Debe incluir estado visual de:

- imagen principal,
- descripcion IA,
- prompt de escena,
- turnaround sheet,
- consistencia.

### Tamaños recomendados

- Navbar superior: 48px
- Botones primarios: 42px a 44px de alto
- Campos tipo panel: 180px a 260px de alto segun contenido
- Thumbnail de galeria: formato cuadrado o vertical suave
- Menu contextual por imagen: 210px a 240px de ancho
- Boton de tres puntos: 36px
- Chips de estado: 22px a 26px de alto
- Cards grandes: radio 24px a 28px

### Prompt final para Stitch - Detalle de personaje

Design a premium dark-mode character detail screen for Kiyoko AI, an AI storyboard and media production platform. The visual language must blend Notion-style clarity and spacing with cinematic creative software atmosphere. Make the page elegant, calm, editorial, premium, structured, and clearly built for production-ready character management.

The screen must include:

- refined top navbar,
- dark app shell,
- premium page header,
- character name,
- role badge,
- short supporting description,
- top actions for uploading images,
- generating reference prompt,
- viewing scene usage.

The page must include a rich character reference gallery with:

- a clear main reference image,
- multiple gallery images,
- hover emphasis on each image,
- pointer cursor,
- soft overlay on hover,
- visible three-dot action button in a corner on hover,
- image preview behavior,
- action to set image as main reference,
- action to generate image prompt from that image,
- action to generate turnaround prompt from that image,
- action to delete image,
- upload more images,
- a clear visual marker for the primary image.

The detail page must include all these editable and AI-assisted fields:

- name,
- role,
- initials,
- visual description,
- general narrative description,
- personality,
- hair description,
- signature clothing,
- accessories,
- signature tools,
- color accent,
- AI image description,
- scene prompt snippet,
- turnaround sheet prompt,
- consistency rules always,
- consistency rules never.

Important fields should visually include:

- content area,
- edit action,
- copy action,
- small AI generate button,
- loading state,
- clean premium panel appearance.

The page must include a dedicated section for the long turnaround sheet prompt used to generate a Pixar-style 3D animated character reference sheet with multiple views on a solid bright green chroma key background, including front view, side profile, back view, 3/4 angle view, close-up facial detail, portrait panel, consistent studio lighting, and clean professional layout.

The page must also include:

- a section for consistency rules,
- always and never rules,
- compact rule chips or rule rows,
- add new rule input,
- delete rule interaction,
- a section showing scene usage,
- a section showing character readiness status,
- polished AI-assisted creative workflow feeling.

Use premium dark colors with these references:

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
- error #F87171

Use a top navbar around 48px high, rounded panels around 20px to 28px radius, image action menus around 210px to 240px wide, icon buttons around 36px, primary buttons around 42px to 44px high, and large elegant content panels with calm spacing and editorial hierarchy.

The result should feel like a premium creative operating panel for building character consistency across prompts, scenes, and image generation.

---

## Notas para Stitch IA

### Lo que debe evitar

- No hacerlo como dashboard generico.
- No usar tarjetas aleatorias sin jerarquia.
- No abusar de glow o colores saturados.
- No hacer algo infantil.
- No hacerlo demasiado futurista tipo sci-fi exagerado.
- No convertirlo en una tabla aburrida de admin.

### Lo que debe potenciar

- claridad,
- elegancia,
- densidad controlada,
- precision editorial,
- look premium,
- atmosfera cinematica discreta,
- software creativo serio,
- acciones rapidas y comprensibles,
- IA silenciosa pero poderosa.
