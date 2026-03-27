# Sidebar Menu — Análisis Completo de Opciones

> Basado en las 48 tablas de Supabase, enums y rutas existentes.

---

## 1. DASHBOARD (nivel global)

### Menú fijo (siempre visible)
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| Buscar | Search | ⌘K modal | — | ✅ Existe |
| Inicio | Home | `/dashboard` | projects, project_favorites | ✅ Existe |
| Inbox | Inbox | `/dashboard/notifications` | notifications | ⚠️ Falta página |
| Tareas | CheckSquare | `/dashboard/tasks` | tasks (cross-project) | ✅ Existe |
| Kiyoko IA | Sparkles | toggle chat | ai_conversations | ✅ Existe |

### Menú secundario
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| Compartidos | Share2 | `/dashboard/shared` | project_shares | ✅ Existe |
| Publicaciones | Calendar | `/dashboard/publications` | publications | ✅ Existe |

### Secciones con datos
| Sección | Tabla(s) | Estado |
|---------|----------|--------|
| Favoritos | project_favorites + projects | ✅ Existe |
| Proyectos | projects | ✅ Existe |
| Admin | profiles (role=admin) | ✅ Existe |

### Páginas nuevas propuestas para Dashboard
| Página | Ruta | Tabla(s) | Descripción |
|--------|------|----------|-------------|
| **Inbox** | `/dashboard/notifications` | notifications | Lista de notificaciones con filtros (no leídas, por tipo, por proyecto). Mark as read, mark all. |
| **Actividad global** | `/dashboard/activity` | activity_log | Feed de actividad de todos los proyectos de la org. Filtrable por proyecto, usuario, acción. |
| **Uso de IA** | `/dashboard/usage` | ai_usage_logs, ai_usage_monthly, usage_tracking | Dashboard con gráficos: tokens, imágenes, videos, TTS, storage. Por proveedor y mes. |
| **Calendario** | `/dashboard/calendar` | tasks (due_date, scheduled_date), publications (scheduled_at) | Vista calendario con tareas y publicaciones programadas. |
| **Time tracking** | `/dashboard/time` | time_entries (cross-project) | Resumen de horas por proyecto/video. Timer activo. |
| **Comentarios** | `/dashboard/comments` | comments (cross-project) | Todos los comentarios no resueltos agrupados por proyecto. |

---

## 2. PROYECTO (dentro de `/project/[shortId]`)

### Menú principal
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| Vista general | LayoutDashboard | `/project/[id]` | projects | ✅ Existe |
| Tareas | CheckSquare | `/project/[id]/tasks` | tasks | ✅ Existe |
| Publicaciones | Smartphone | `/project/[id]/publications` | publications, social_profiles | ✅ Existe |

### Sección Videos
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| Lista de videos | Film | `/project/[id]/videos` | videos | ✅ Existe |
| Video individual | Film | `/project/[id]/video/[vid]` | videos | ✅ Existe |
| + Nuevo vídeo | Plus | modal/route | videos | ✅ Existe |

### Sección Recursos (expandible)
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| Personajes | Users | `/project/[id]/resources/characters` | characters, character_images | ✅ Existe |
| Fondos | Mountain | `/project/[id]/resources/backgrounds` | backgrounds | ✅ Existe |
| Estilos | Paintbrush | `/project/[id]/resources/styles` | style_presets | ✅ Existe |
| Templates | FileText | `/project/[id]/resources/templates` | prompt_templates | ✅ Existe |

### Sección Ajustes
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| General | Settings | `/project/[id]/settings` | projects | ✅ Existe |
| IA y Agente | Bot | `/project/[id]/settings/ai` | project_ai_settings, project_ai_agents | ✅ Existe |
| Colaboradores | UserPlus | `/project/[id]/settings/sharing` | project_members, project_shares | ✅ Existe |

### Páginas nuevas propuestas para Proyecto
| Página | Ruta | Tabla(s) | Descripción |
|--------|------|----------|-------------|
| **Actividad** | `/project/[id]/activity` | activity_log | Feed de actividad del proyecto: quién hizo qué, cuándo. Con filtros por entidad (video, escena, personaje). |
| **Comentarios** | `/project/[id]/comments` | comments | Todos los comentarios del proyecto, agrupados por video/escena/tarea. Resolver, responder. Hilos (parent_id). |
| **Time tracking** | `/project/[id]/time` | time_entries | Registro de horas por video/tarea. Timer activo. Resumen semanal. |
| **Perfiles sociales** | `/project/[id]/publications/profiles` | social_profiles | Gestión de cuentas sociales vinculadas al proyecto. Existe en ruta pero no en menú. |
| **Exportaciones** | `/project/[id]/exports` | exports | Historial de exportaciones del proyecto (PDF, HTML, JSON, MP4). Descargar, re-exportar. |
| **Derivaciones** | `/project/[id]/derivations` | video_derivations | Árbol de adaptaciones entre videos (YouTube → TikTok → Reel). Visual tree/graph. |
| **Historial IA** | `/project/[id]/ai-history` | entity_snapshots, ai_conversations | Historial de cambios hechos por IA con opción de undo. Snapshots de escenas/videos antes/después. |

---

## 3. VIDEO (dentro de `/project/[shortId]/video/[videoShortId]`)

### Menú actual
| Item | Icono | Ruta | Tabla(s) | Estado |
|------|-------|------|----------|--------|
| Vista general | LayoutDashboard | `/video/[vid]` | videos | ✅ Existe |
| Escenas | Film | `/video/[vid]/scenes` | scenes | ✅ Existe |
| Escena individual | — | `/video/[vid]/scene/[sid]` | scenes, scene_camera, scene_prompts, scene_media, scene_video_clips | ✅ Existe |
| Narración | Mic | `/video/[vid]/narration` | video_narrations | ✅ Existe |
| Análisis | BarChart | `/video/[vid]/analysis` | video_analysis | ✅ Existe |
| Exportar | Download | `/video/[vid]/export` | exports | ✅ Existe |

### Páginas nuevas propuestas para Video
| Página | Ruta | Tabla(s) | Descripción |
|--------|------|----------|-------------|
| **Timeline** | `/video/[vid]/timeline` | timeline_entries, narrative_arcs | Vista timeline visual tipo Adobe Premiere. Arcos narrativos (hook/build/peak/close) con colores. Drag & drop para reordenar escenas. |
| **Compartir escenas** | `/video/[vid]/share` | scene_shares, scene_annotations | Crear link de compartición pública/privada. Seleccionar escenas. Password optional. Ver anotaciones externas. |
| **Storyboard** | `/video/[vid]/storyboard` | scenes, scene_media | Vista storyboard: grid de thumbnails con diálogos debajo. Export a PDF. Print-friendly. |
| **Derivaciones** | `/video/[vid]/derivations` | video_derivations | Crear adaptación para otra plataforma (ej. YouTube → TikTok). Heredar escenas con ajustes. |
| **Historial** | `/video/[vid]/history` | entity_snapshots | Versiones anteriores del video/escenas. Diff visual. Restaurar snapshot. |

---

## 4. ESCENA (dentro de video)

### Datos disponibles por escena
| Tabla | Datos |
|-------|-------|
| scenes | title, description, dialogue, scene_number, duration, arc_phase, status, scene_type, notes, director_notes |
| scene_camera | camera_angle (10 valores), camera_movement (11 valores), lighting, mood |
| scene_prompts | prompt_text, result_url, generator, version, status |
| scene_media | media_type (image/video/audio), file_url, thumbnail, generator, version |
| scene_video_clips | clip_type, extension_number, duration, prompt_video, prompt_image, last_frame |
| scene_characters | character_id, role_in_scene, sort_order |
| scene_backgrounds | background_id, is_primary, angle, time_of_day |
| scene_annotations | author_name, content, timestamp_seconds, status |

### Opciones de la escena (tabs o secciones en la página de escena)
| Tab | Datos | Descripción |
|-----|-------|-------------|
| **Prompt** | scene_prompts | Editor de prompt con preview. Versiones. Regenerar. |
| **Cámara** | scene_camera | Ángulo, movimiento, iluminación, mood. Selector visual. |
| **Media** | scene_media | Imágenes y videos generados. Gallery con versiones. |
| **Video clips** | scene_video_clips | Clips base + extensiones. Cadena de clips. Preview. |
| **Personajes** | scene_characters + characters | Quién aparece en esta escena. Drag & drop desde recursos. |
| **Fondos** | scene_backgrounds + backgrounds | Fondo de la escena. Ángulo y hora del día. |
| **Diálogo** | scenes.dialogue | Editor de diálogo/narración de la escena. |
| **Notas** | scenes.notes, director_notes, client_annotation | Notas del director, anotaciones del cliente. |
| **Anotaciones** | scene_annotations | Feedback externo (de scene_shares). Resolver. |

---

## 5. AJUSTES (modal global)

### Secciones actuales
| Sección | Tabla(s) | Estado |
|---------|----------|--------|
| Perfil | profiles | ✅ Existe |
| Preferencias | profiles.preferences | ✅ Existe |
| Notificaciones | profiles.preferences.notifications | ✅ Existe |
| Seguridad | auth (2FA) | ✅ Existe |
| Organizaciones | organizations, organization_members | ✅ Existe |
| Org General | organizations | ✅ Existe |
| Org Miembros | organization_members | ✅ Existe |
| API Keys | user_api_keys | ✅ Existe |
| Suscripción | user_plans, usage_tracking | ✅ Existe |

### Secciones nuevas propuestas
| Sección | Tabla(s) | Descripción |
|---------|----------|-------------|
| **Uso de IA** | ai_usage_logs, ai_usage_monthly | Gráfico de uso por proveedor/mes. Top modelos. Coste estimado. |
| **Billing** | billing_events, user_plans | Historial de pagos, facturas, método de pago. |
| **Importar/Exportar** | exports | Importar proyecto desde JSON. Exportar todo. |
| **Atajos de teclado** | — | Lista de shortcuts configurables. |
| **Feedback** | feedback | Ver feedback enviado, estado de resolución. |
| **Apariencia avanzada** | profiles.preferences | Densidad de UI (compacta/normal), sidebar position, default views. |

---

## 6. ENUMS — Referencia para UI

### Estados de proyecto (project_status)
`draft` → `in_progress` → `review` → `completed` → `archived`

### Estados de video (video_status)
`draft` → `prompting` → `generating` → `review` → `approved` → `exported`

### Estados de escena (scene_status)
`draft` → `prompt_ready` → `generating` → `generated` → `approved` / `rejected`

### Estados de tarea (task_status)
`pending` → `in_progress` → `in_review` → `completed` / `blocked`

### Tipos de video (video_type)
`long`, `short`, `reel`, `story`, `ad`, `custom`

### Plataformas (target_platform)
`youtube`, `instagram_reels`, `tiktok`, `tv_commercial`, `web`, `custom`

### Estilos de proyecto (project_style)
`pixar`, `realistic`, `anime`, `watercolor`, `flat_2d`, `cyberpunk`, `custom`

### Fases del arco narrativo (arc_phase)
`hook`, `build`, `peak`, `close`

### Ángulos de cámara (camera_angle)
`wide`, `medium`, `close_up`, `extreme_close_up`, `pov`, `low_angle`, `high_angle`, `birds_eye`, `dutch`, `over_shoulder`

### Movimientos de cámara (camera_movement)
`static`, `dolly_in`, `dolly_out`, `pan_left`, `pan_right`, `tilt_up`, `tilt_down`, `tracking`, `crane`, `handheld`, `orbit`

### Categorías de tarea (task_category)
`script`, `prompt`, `image_gen`, `video_gen`, `review`, `export`, `meeting`, `voiceover`, `editing`, `issue`, `annotation`, `other`

### Prioridades de tarea (task_priority)
`low`, `medium`, `high`, `urgent`

### Formatos de exportación (export_format)
`html`, `json`, `markdown`, `pdf`, `mp4`, `mov`

### Roles de organización (org_role)
`owner`, `admin`, `editor`, `viewer`

### Tipos de organización (org_type)
`personal`, `team`, `agency`, `freelance`, `school`

---

## 7. RESUMEN — Páginas que FALTAN

### Prioridad ALTA (datos existen, UI no)
1. `/dashboard/notifications` — Inbox de notificaciones
2. `/dashboard/activity` — Feed de actividad global
3. `/project/[id]/activity` — Feed de actividad del proyecto
4. `/project/[id]/comments` — Comentarios del proyecto
5. `/video/[vid]/timeline` — Timeline visual con arcos narrativos
6. `/video/[vid]/share` — Compartir escenas con clientes
7. `/video/[vid]/storyboard` — Vista storyboard exportable

### Prioridad MEDIA (mejoraría la experiencia)
8. `/dashboard/usage` — Dashboard de uso de IA
9. `/dashboard/calendar` — Calendario de tareas/publicaciones
10. `/project/[id]/time` — Time tracking por proyecto
11. `/project/[id]/exports` — Historial de exportaciones
12. `/project/[id]/ai-history` — Historial de acciones IA con undo
13. Ajustes → Uso de IA (sección en modal)
14. Ajustes → Atajos de teclado

### Prioridad BAJA (nice to have)
15. `/dashboard/time` — Time tracking global
16. `/dashboard/comments` — Comentarios globales
17. `/project/[id]/derivations` — Árbol de adaptaciones
18. `/video/[vid]/derivations` — Crear adaptación
19. `/video/[vid]/history` — Historial de snapshots
20. Ajustes → Feedback enviado
