# Sidebar estilo Notion para Kiyoko AI

## Objetivo

Replicar la sensación del sidebar de Notion en Kiyoko AI sin copiarlo de forma ciega.
La meta no es solo “parecerse”, sino conservar la claridad visual de Notion y adaptarla a la estructura real de Kiyoko:

- `dashboard`
- `project`
- `video`

Además, el diseño debe respetar las entidades y tablas existentes de la app.

## Referencia visual observada en las capturas

### 1. Densidad

Notion usa una sidebar muy compacta:

- ancho visual cercano a `240px`
- items de `32px` a `34px` de alto
- padding horizontal corto
- iconos pequeños y texto muy cerca del icono
- separaciones mínimas entre grupos

La sensación general es de “árbol de navegación continuo”, no de bloques independientes.

### 2. Jerarquía

La jerarquía principal en Notion se construye con cinco cosas:

- color de fondo
- peso tipográfico
- indentación
- hover muy sutil
- acciones ocultas hasta hover

No depende de tarjetas, bordes pesados ni secciones demasiado aisladas.

### 3. Colores

En oscuro, la referencia de las capturas se acerca a este sistema:

- fondo sidebar: `#1f1f1f` a `#202020`
- hover item: `#2a2a2a` a `#2d2d2d`
- item activo: `#2f2f2f`
- borde general: casi invisible
- texto principal: `#ebebeb`
- texto secundario: `#9b9b9b`
- labels de grupo: `#8a8a8a`

El contraste es medio. Notion evita tanto el negro puro como los acentos muy saturados.

### 4. Tipografía

Patrón visible en capturas:

- texto principal de item: `13px` aprox
- labels de grupo: `11px`
- peso normal o semibold puntual
- line-height corto

La sidebar no usa titulares fuertes. Todo está contenido.

### 5. Comportamiento

Notion se siente “vivo” por estos patrones:

- acciones secundarias aparecen en hover
- items con hijos muestran control de expansión
- el item activo no rompe el layout, solo cambia el fondo
- el menú superior mezcla cambio de workspace, ajustes rápidos y cuenta
- el colapso lateral está disponible desde arriba, no escondido lejos del trigger

## Auditoría de la implementación actual de Kiyoko

## Lo que ya va en la dirección correcta

- El ancho base del sidebar ya está cerca del patrón objetivo.
- Ya existe separación real por contexto: `dashboard`, `project`, `video`.
- Hay árbol parcial en proyectos con vídeos hijos.
- Ya existen hover actions y menús contextuales en proyectos.
- El modo colapsado ya está soportado por `src/components/ui/sidebar.tsx`.

## Lo que hoy se siente menos Notion

### 1. Exceso de “bloques”

La estructura actual agrupa la navegación en varios bloques visuales:

- `SidebarNavFixed`
- `SidebarNavMain`
- `SidebarProjects`
- `SidebarFavorites`
- `SidebarAdmin`
- `SidebarProjectNav`
- `SidebarVideoNav`

Eso hace que el sidebar se lea más como panel administrativo que como árbol continuo.

### 2. Los labels son demasiado estructurales

Notion usa labels, pero no domina la interfaz con ellos.
En Kiyoko hay secciones que pesan más visualmente de lo necesario.

### 3. La navegación superior no estaba externalizada

Antes de este cambio, el selector superior mezclaba:

- layout
- datos de usuario
- datos de organizaciones
- popover
- colapso del sidebar

todo dentro de `SidebarHeader.tsx`.

Eso hacía más difícil reutilizarlo y evolucionarlo.

### 4. El dashboard actual no refleja todavía el modelo mental de Notion

Notion tiene:

- navegación fija global
- recents
- favorites
- teamspaces / private
- apps
- settings

Kiyoko hoy mezcla navegación global con secciones funcionales, pero todavía no organiza la información como “espacios + contenido reciente + favoritos + herramientas”.

## Modelo de datos real disponible

Se intentó usar el MCP de Supabase configurado en `.mcp.json`, pero en esta sesión no expuso recursos legibles. Para no inventar nada, la fuente real usada fue el esquema tipado y las migraciones locales.

## Tablas clave para el sidebar

### Espacios de trabajo

- `organizations`
- `organization_members`

Uso en UI:

- switcher superior de workspace
- permisos por espacio
- tipo de organización

### Navegación principal de trabajo

- `projects`
- `videos`

Uso en UI:

- lista de proyectos
- árbol proyecto > vídeos
- cambio de contexto `dashboard -> project -> video`

### Personalización del usuario

- `project_favorites`

Uso en UI:

- sección `Favoritos`

### Áreas relacionadas con navegación secundaria

- `tasks`
- `publications`
- `video_analysis`
- `video_narrations`
- `timeline_entries`
- `scene_shares`

Uso en UI:

- subsecciones de `project`
- subsecciones de `video`

## Mapping recomendado entre Notion y Kiyoko

## 1. Dashboard

Este nivel debe parecerse al “root workspace” de Notion.

### Arriba

- workspace switcher
- colapsar sidebar

### Navegación fija

- Buscar
- Inicio
- Tareas
- Kiyoko IA

### Contenido vivo

- Recientes
  - proyectos abiertos recientemente
  - vídeos recientes si quieres una experiencia más parecida a Notion
- Favoritos
  - basado en `project_favorites`
- Espacios o colecciones
  - lista de proyectos

### Utilidades

- Ajustes
- Admin

## 2. Project

Este nivel debe sentirse como cuando en Notion entras a una página contenedora con bases de datos y vistas hijas.

### Arriba

- mismo workspace switcher
- nombre del proyecto destacado como contexto local

### Navegación recomendada

- Vista general
- Vídeos
- Recursos
  - Personajes
  - Fondos
  - Estilos
  - Templates
- Publicaciones
- Tareas
- Actividad
- Ajustes

### Comportamiento recomendado

- mantener un botón de vuelta, pero con menos peso visual
- mantener expandibles con chevron pequeño y hover actions
- si hay muchos recursos, el árbol debe sentirse igual que en dashboard

## 3. Video

Este nivel debe sentirse como una página concreta dentro de un proyecto.

### Arriba

- mismo workspace switcher
- selector del vídeo actual

### Navegación recomendada

- Overview
- Escenas
- Timeline
- Narración
- Análisis
- Compartir
- Exportar

### Comportamiento recomendado

- el selector del vídeo debería parecer más un page switcher de Notion y menos un botón outline suelto
- si el vídeo tiene subrecursos, se puede valorar árbol secundario futuro

## Componente extraído en esta iteración

Se creó un componente reusable para el encabezado superior:

- `src/components/layout/sidebar/WorkspaceSwitcher.tsx`

### Qué resuelve

- extrae la lógica del switcher superior fuera de `SidebarHeader.tsx`
- unifica cuenta + workspace + acciones rápidas
- funciona en `dashboard`, `project` y `video`
- muestra el contexto actual como etiqueta
- deja el botón de colapso arriba, como en el patrón de Notion

### Qué no resuelve todavía

- reordenación total del sidebar
- sección de recents real
- persistencia del árbol expandido por proyecto
- selector de vídeos con look definitivo tipo Notion
- virtualización o optimización para árboles muy largos

## Decisiones visuales recomendadas para la siguiente fase

### Reducir la sensación de “app enterprise con bloques”

- menos separación entre grupos
- labels más discretos
- más continuidad vertical

### Compactar items

- apuntar a `h-8`
- textos `13px`
- subitems `12px`

### Hacer el hover más sutil

- fondo activo y hover muy cercanos
- evitar estados demasiado azules o saturados en la sidebar

### Unificar iconografía

- iconos pequeños y consistentes
- menos mezcla entre botón, badge y estilos de acción

### Convertir `projects` en eje principal del dashboard

Ahora mismo `SidebarProjects` ya es la pieza más parecida a Notion.
Conviene convertirla en la columna vertebral del dashboard y colgar de ella:

- recientes
- favoritos
- hijos de vídeo
- acciones contextuales

## Plan técnico recomendado

### Fase 1

- mantener `WorkspaceSwitcher` como cabecera común
- ajustar spacing y altura de items globales
- suavizar labels y secciones

### Fase 2

- introducir `Recents`
- reordenar dashboard como árbol continuo
- homogeneizar `SidebarProjects`, `SidebarFavorites` y `SidebarNavMain`

### Fase 3

- rediseñar `SidebarProjectNav` y `SidebarVideoNav` para que parezcan una continuación natural del dashboard
- sustituir botones aislados por patrones de lista continua

### Fase 4

- añadir persistencia de expand/collapse por proyecto y por vídeo
- añadir datos de uso real para ordenar recientes

## Riesgos a tener en cuenta

- Si copiamos demasiado a Notion, podemos perder señales propias de Kiyoko como IA, producción de vídeo y estados del flujo.
- Si dejamos demasiados bloques, seguirá sintiéndose como otro producto aunque cambie el color.
- Si usamos demasiadas consultas separadas en el sidebar, el rendimiento se resentirá cuando la cuenta tenga muchos proyectos y vídeos.

## Recomendación final

La mejor dirección no es “clonar Notion”, sino usar su gramática:

- compacta
- silenciosa
- jerárquica
- centrada en árbol
- acciones en hover
- workspace arriba

y adaptarla a la ontología real de Kiyoko:

- organizaciones
- proyectos
- vídeos
- recursos
- IA
