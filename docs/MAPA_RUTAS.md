# Kiyoko AI — Mapa de Rutas y Páginas

## Rutas Públicas (sin autenticación)

| Ruta | Descripción |
|------|-------------|
| `/` | **Landing page**. Si el usuario ya está autenticado, redirige a `/dashboard`. Si no, muestra la página de presentación de Kiyoko AI. |
| `/login` | **Inicio de sesión**. Formulario de email/contraseña + botón de Google OAuth. |
| `/register` | **Registro**. Formulario de creación de cuenta con indicador de fortaleza de contraseña. |
| `/forgot-password` | **Recuperar contraseña**. Formulario para solicitar un email de reseteo de contraseña. |
| `/pending` | **Cuenta pendiente**. Pantalla informativa que indica que la cuenta está pendiente de aprobación por un admin. |
| `/blocked` | **Cuenta bloqueada**. Pantalla informativa que indica que la cuenta ha sido bloqueada. |
| `/terms` | **Términos de servicio**. Página legal con los términos y condiciones. |
| `/privacy` | **Política de privacidad**. Página legal con la política de privacidad. |
| `/docs` | **Documentación**. Página pública de documentación de la plataforma. |

---

## Rutas del Dashboard (requieren autenticación)

### Páginas principales

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | **Panel principal**. Grid de proyectos con filtros, búsqueda y ordenación (recientes/nombre/progreso). Muestra tarjetas de estadísticas: total de proyectos, total de escenas, proyectos activos. |
| `/new` | **Crear proyecto**. Formulario multi-paso para crear un nuevo proyecto O generación de proyecto asistida por IA. |
| `/settings` | **Ajustes de usuario**. Configuración de perfil, email, idioma y tema de la interfaz. |
| `/settings/api-keys` | **Claves API**. Gestión de claves API para proveedores de IA (OpenAI, etc.). |
| `/organizations` | **Organizaciones**. Listado y gestión de organizaciones del usuario. |
| `/organizations/new` | **Nueva organización**. Formulario para crear una nueva organización. |

### Páginas de administración

| Ruta | Descripción |
|------|-------------|
| `/admin` | **Dashboard admin**. Estadísticas del sistema: total de usuarios, proyectos, escenas y tokens consumidos. |
| `/admin/users` | **Gestión de usuarios**. Lista de usuarios con acciones para aprobar o bloquear cuentas. |

---

## Rutas de Proyecto (`/project/[slug]/...`)

Todas estas páginas comparten el `ProjectProvider` que da acceso al contexto del proyecto y sincronización en tiempo real.

| Ruta | Descripción |
|------|-------------|
| `/project/[slug]` | **Vista general del proyecto**. Imagen de portada, estadísticas (vídeos, escenas, personajes, fondos), botones de acción rápida, vídeos recientes, escenas recientes e info del proyecto. |
| `/project/[slug]/storyboard` | **Editor de storyboard**. Multi-vista (colapsado/expandido/timeline/arco narrativo). Permite editar escenas, generar imágenes con IA, mejorar textos con IA, gestionar audio y narración. |
| `/project/[slug]/scenes` | **Listado de escenas**. Gestión y visualización de todas las escenas del proyecto. |
| `/project/[slug]/scenes/[sceneId]` | **Detalle de escena**. Página individual con los detalles completos de una escena. |
| `/project/[slug]/videos` | **Listado de vídeos**. Grid de cortes de vídeo con info de plataforma y duración. Incluye botón para crear nuevo vídeo (abre modal). |
| `/project/[slug]/tasks` | **Gestión de tareas**. Tablero Kanban con columnas (pendiente/en progreso/revisión/completado), vista lista y vista calendario. Botón para crear nueva tarea (abre modal). |
| `/project/[slug]/characters` | **Personajes**. Gestión de personajes del proyecto. |
| `/project/[slug]/backgrounds` | **Fondos**. Gestión de fondos/escenarios del proyecto. |
| `/project/[slug]/resources` | **Recursos**. Vista combinada de personajes + fondos del proyecto. |
| `/project/[slug]/narration` | **Narración**. Gestión de narración y voces a nivel de proyecto. |
| `/project/[slug]/analysis` | **Análisis**. Insights y métricas del proyecto. |
| `/project/[slug]/timeline` | **Timeline**. Vista de cronograma/calendario del proyecto. |
| `/project/[slug]/arc` | **Arco narrativo**. Estructura narrativa y arco dramático del proyecto. |
| `/project/[slug]/chat` | **Chat IA (pantalla completa)**. Kiyoko AI en modo expandido dedicado al proyecto. |
| `/project/[slug]/exports` | **Exportaciones**. Historial de exportaciones y descargas del proyecto. |
| `/project/[slug]/settings` | **Ajustes del proyecto**. Imagen de portada, título, descripción, cliente, estilo, plataforma, colores. |
| `/project/[slug]/references` | **Referencias**. Materiales de referencia e inspiración visual del proyecto. |

---

## Rutas de Vídeo (`/project/[slug]/video/[videoSlug]/...`)

Páginas específicas dentro de un vídeo concreto del proyecto.

| Ruta | Descripción |
|------|-------------|
| `/project/[slug]/video/[videoSlug]` | **Detalle del vídeo**. Vista principal del vídeo con su información y edición. |
| `/project/[slug]/video/[videoSlug]/script` | **Editor de guión**. Editor del script/diálogos del vídeo. |
| `/project/[slug]/video/[videoSlug]/narration` | **Narración del vídeo**. Gestión de voice-over con TTS (text-to-speech) de ElevenLabs. |
| `/project/[slug]/video/[videoSlug]/storyboard` | **Storyboard del vídeo**. Storyboard específico para este vídeo. |
| `/project/[slug]/video/[videoSlug]/export` | **Exportar vídeo**. Opciones de renderizado y exportación del vídeo final. |

---

## Modales

### Modal de Kiyoko AI (Chat IA)

- **Componente**: `src/components/chat/KiyokoChat.tsx`
- **Dónde aparece**: En **TODAS las páginas del dashboard**. Se activa desde el botón "Kiyoko AI" en el Header.
- **Modos**:
  - **Panel lateral** (`mode: 'panel'`): Se muestra como sidebar redimensionable a la derecha. Permite chatear sin salir de la página actual.
  - **Expandido** (`mode: 'expanded'`): Ocupa toda la pantalla con sidebar de historial de conversaciones.
- **Funcionalidades**:
  - Chat con IA contextual (detecta automáticamente el proyecto desde la URL)
  - Historial de conversaciones (en modo expandido)
  - Selector de corte de vídeo
  - Ejecución de planes de acción (action plans)
  - Barra de sugerencias rápidas
  - Botones de acción rápida: revisar personajes, reducir escenas, ordenar timeline, explicar proyecto, generar prompts, estado de BD, paleta de colores, revisar issues
  - Soporte para adjuntar narraciones e imágenes
  - Streaming de mensajes en tiempo real
- **Componentes relacionados**:
  - `ChatMessage.tsx` — Renderizado de mensajes individuales
  - `ChatInput.tsx` — Input de mensajes con subida de archivos
  - `ChatHistorySidebar.tsx` — Historial de conversaciones (modo expandido)
  - `ActionPlanCard.tsx` — Visualización de planes de acción de la IA

### Modal de Crear Vídeo

- **Componente**: `src/components/videos/VideoCreateModal.tsx`
- **Dónde aparece**: Solo en `/project/[slug]/videos`, botón "Nuevo video".
- **Funcionalidades**:
  - Toggle entre modo manual y generación con IA
  - Modo manual: input de título del vídeo
  - Modo IA: textarea para describir el vídeo deseado
  - Selector de plataforma (YouTube 16:9, Instagram Reels 9:16, TikTok 9:16, TV 16:9, Web 16:9)
  - Input de duración (5-600 segundos)
  - Selector de aspect ratio (16:9, 9:16, 1:1, 4:5) con preview visual

### Modal de Crear Tarea

- **Componente**: `src/components/tasks/TaskCreateModal.tsx`
- **Dónde aparece**: Solo en `/project/[slug]/tasks`, botón "Nueva tarea".
- **Funcionalidades**:
  - Input de título (obligatorio)
  - Textarea de descripción (opcional)
  - Selector de categoría (script, prompt, image_gen, video_gen, review, export, meeting, other)
  - Selector de prioridad (low, medium, high, urgent)
  - Date picker para fecha límite

### Modal de Feedback

- **Componente**: `src/components/shared/FeedbackDialog.tsx`
- **Dónde aparece**: En **TODAS las páginas del dashboard**, desde el botón de feedback en el Header.
- **Funcionalidades**:
  - Flujo de 2 pasos: elegir tipo de feedback → escribir mensaje
  - Tipos: "Problema" (issue) o "Idea" (mejora)
  - Textarea para el mensaje
  - Envía el feedback a la tabla `feedback` en Supabase con user_id, tipo, mensaje y URL de la página

### Diálogos de Confirmación

- **Componente**: `src/components/ui/alert-dialog.tsx` (Shadcn/ui)
- **Dónde aparece**: En varias páginas cuando se requiere confirmación (ej: eliminar vídeo, eliminar escena).

---

## Resumen visual de navegación

```
Landing (/)
├── Login (/login)
├── Register (/register)
├── Forgot Password (/forgot-password)
├── Terms (/terms)
├── Privacy (/privacy)
└── Docs (/docs)

Dashboard (/dashboard)  ← [Header + KiyokoChat + FeedbackDialog en todas]
├── Nuevo proyecto (/new)
├── Ajustes usuario (/settings)
│   └── API Keys (/settings/api-keys)
├── Organizaciones (/organizations)
│   └── Nueva org (/organizations/new)
├── Admin (/admin)
│   └── Usuarios (/admin/users)
└── Proyecto (/project/[slug])
    ├── Vista general
    ├── Storyboard (/storyboard)
    ├── Escenas (/scenes)
    │   └── Detalle escena (/scenes/[sceneId])
    ├── Vídeos (/videos)  ← [VideoCreateModal]
    │   └── Vídeo (/video/[videoSlug])
    │       ├── Script (/script)
    │       ├── Narración (/narration)
    │       ├── Storyboard (/storyboard)
    │       └── Exportar (/export)
    ├── Tareas (/tasks)  ← [TaskCreateModal]
    ├── Personajes (/characters)
    ├── Fondos (/backgrounds)
    ├── Recursos (/resources)
    ├── Narración (/narration)
    ├── Análisis (/analysis)
    ├── Timeline (/timeline)
    ├── Arco narrativo (/arc)
    ├── Chat IA (/chat)
    ├── Exportaciones (/exports)
    ├── Ajustes proyecto (/settings)
    └── Referencias (/references)
```
