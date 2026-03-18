# Fase 17 — UI/UX Storyboard v3

## Estado: PENDIENTE

## Origen: docs/update/KIYOKO_MEJORAS_v6_UI.md

## Objetivo

Rediseño completo de la UI del storyboard y pestañas del proyecto: scene cards horizontales compactas, acciones hover en thumbnails, header mejorado con duración, overview con progreso desglosado, timeline visual, y mejoras en 10+ pantallas.

## Tareas

### 17.1 Scene Cards Compactas Horizontales
- [ ] Rediseñar card: thumbnail 120x68px a la izquierda, info a la derecha
- [ ] Cards colapsadas por defecto (solo título + badges + thumbnail)
- [ ] Click en expand: prompts, narración, mejoras, acciones
- [ ] Prompts colapsados: 3 líneas + "ver más"
- [ ] Caben ~5-8 escenas en pantalla (vs 1-2 ahora)

### 17.2 Acciones en Thumbnail (Hover)
- [ ] Overlay con iconos al hacer hover en thumbnail:
  - Regenerar imagen con IA
  - Subir/sustituir imagen
  - Descargar
  - Eliminar
- [ ] Si no hay imagen: placeholder "Generar o subir"

### 17.3 Línea de Inserción entre Escenas
- [ ] Línea [+] entre cada escena para insertar nueva
- [ ] Click abre diálogo de creación rápida

### 17.4 Header del Storyboard Mejorado
- [ ] Barra de duración: actual vs objetivo con % y warning si excede
- [ ] Vista Grid añadida (además de Completo y Compacto)
- [ ] Botón [Reordenar] que activa drag & drop
- [ ] Búsqueda mejorada

### 17.5 Overview Mejorado
- [ ] Hero compacto (120px si no hay cover, 200px si hay)
- [ ] Progreso desglosado: personajes ✅, fondos ✅, prompts ✅, imágenes ❌, narraciones ❌, aprobadas ❌
- [ ] Thumbnails de últimas escenas en grid

### 17.6 Diagnóstico Mejorado
- [ ] Issues vinculados a escenas específicas (click para ir)
- [ ] Botón "Arreglar con IA" que ejecuta acción desde el chat
- [ ] Feedback al resolver (qué se hizo)

### 17.7 Personajes Mejorado
- [ ] Card horizontal compacta (max 250px altura imagen)
- [ ] Badge "Aparece en X escenas" clickable
- [ ] Reglas del personaje visibles y editables (ver Fase 13)
- [ ] Prompt snippet con preview de cómo se usa en escenas
- [ ] Hover en imagen: regenerar, reemplazar, descargar
- [ ] Botón "Regenerar ficha desde foto"

### 17.8 Fondos Mejorado
- [ ] Card con max 200px altura imagen
- [ ] Botón "Generar con IA"
- [ ] Dropzone compacto para subir
- [ ] Hover actions en imagen

### 17.9 Timeline Visual
- [ ] Barra horizontal proporcional al tiempo
- [ ] Cada escena como bloque coloreado por fase
- [ ] Hover muestra tooltip con info
- [ ] Click navega a la escena
- [ ] Thumbnails 48x27px + drag handles
- [ ] Duración editable inline

### 17.10 Arco Narrativo Visual
- [ ] Barra de tiempo con marcadores de escena
- [ ] Badges clickables con hover previews

### 17.11 Referencias Mejorado
- [ ] Tabla limpia (celdas vacías en vez de guiones)
- [ ] Iconos para subidas/pendientes
- [ ] Celdas clickables

### 17.12 Reglas Globales de Tamaño de Imágenes
| Ubicación | Actual | Propuesto |
|-----------|--------|-----------|
| Storyboard colapsada | — | 48x27px |
| Storyboard expandida | 100% width | max 400px h, 50% w |
| Character card | ~500px h | max 250px h |
| Background card | ~300px h | max 200px h |
| Timeline entry | — | 48x27px |
| Overview thumbnails | — | 80x45px |

### 17.13 Indicadores de Estado por Borde
- [ ] Color de borde izquierdo según estado:
  - draft = gris
  - prompt_ready = azul
  - generating = amber pulsante
  - generated = verde
  - approved = dorado
  - rejected = rojo

### 17.14 Vista Grid de Escenas
- [ ] Grid de 3 columnas con thumbnails
- [ ] Toggle entre lista, grid, timeline

### 17.15 Atajos de Teclado
- [ ] Ctrl+K — Búsqueda global (CommandMenu)
- [ ] Ctrl+S — Guardar
- [ ] Ctrl+Z — Deshacer
- [ ] Flechas — Navegar entre escenas
- [ ] Tooltips en todos los badges

## Criterios de Aceptación
- [ ] Scene cards horizontales compactas por defecto
- [ ] Hover actions en todos los thumbnails
- [ ] Header con barra de duración funcional
- [ ] Overview con progreso desglosado
- [ ] Timeline visual con barra proporcional
- [ ] Imágenes respetar tamaños máximos definidos
- [ ] Indicadores de estado por borde de color
