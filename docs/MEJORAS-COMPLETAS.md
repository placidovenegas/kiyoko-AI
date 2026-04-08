# Kiyoko AI — Plan de Mejoras Completo

## Objetivo Final
Crear videos de alta calidad: el usuario describe lo que quiere, la IA genera escenas con prompts optimizados para herramientas de generacion de imagen/video (Grok, Flow, Runway, etc.), y al final el usuario puede unir las piezas en un video coherente.

---

## 1. SETTINGS — Lo que falta

### 1.1 API Keys (Critico)
- [ ] Pagina real de configuracion de API keys (no modal escondido)
- [ ] Campos para: OpenRouter, Gemini, Stability, ElevenLabs/Voxtral
- [ ] Boton "Probar conexion" por cada key
- [ ] Indicador visual: verde = conectado, rojo = error, gris = no configurado
- [ ] Encriptacion de keys en BD (ya existe pero sin feedback visual)

### 1.2 Preferencias de IA
- [ ] Selector de modelo preferido por tipo de tarea:
  - Generacion de escenas: Qwen / Claude / GPT-4
  - Analisis de imagen: Gemini Vision
  - Prompts: Qwen Flash / GPT-4o-mini
- [ ] Slider de creatividad (temperatura): Conservador ←→ Creativo
- [ ] Idioma de prompts: siempre ingles (pero UI en espanol)
- [ ] Estilo visual por defecto: Pixar 3D / Realista / Anime / Flat 2D

### 1.3 Perfil de Proyecto (por proyecto)
- [ ] Estilo visual global (se aplica a todos los prompts)
- [ ] Reglas globales de prompt (ej: "siempre incluir iluminacion cinematica")
- [ ] Paleta de colores del proyecto
- [ ] Aspecto ratio por defecto

---

## 2. SIDEBAR / NAVEGACION — Lo que falta

### 2.1 Navegacion
- [ ] Breadcrumbs en la barra superior: Proyecto > Video > Escena #3
- [ ] Busqueda global (Cmd+K): buscar proyectos, videos, escenas, personajes
- [ ] Indicador de progreso por video en sidebar: "3/8 prompts generados"
- [ ] Menu contextual (click derecho) en items de sidebar: editar, duplicar, eliminar

### 2.2 Estado Visual
- [ ] Iconos de estado por escena en sidebar:
  - Circulo gris: borrador
  - Circulo azul: prompt generado
  - Circulo verde: imagen generada
  - Check verde: aprobada
- [ ] Contador de escenas pendientes por video
- [ ] Notificacion inline cuando la IA termina de generar

### 2.3 Mobile
- [ ] Menu hamburguesa funcional en < 768px
- [ ] Drawer lateral con gesto swipe
- [ ] Bottom navigation bar en mobile

---

## 3. PAGINAS — Mejoras por pagina

### 3.1 Dashboard
- [x] Minimal, sin IA innecesaria
- [ ] Widget de "Continuar donde lo dejaste" (ultimo video editado)
- [ ] Resumen: X escenas pendientes de prompt, X imagenes por generar

### 3.2 Proyecto — Vista General
- [x] Action pills, progress bars
- [ ] Checklist de "listo para generar": personajes, fondos, escenas, prompts
- [ ] Boton "Generar todo el video" que ejecuta el pipeline completo

### 3.3 Video — Storyboard (PAGINA MAS IMPORTANTE)
- [x] Tarjetas con prompts expandibles y boton copiar
- [x] Dropdown con duplicar, eliminar, insertar
- [x] Generacion paralela de prompts
- [ ] **Vista previa de prompt** en la tarjeta sin abrir modal
- [ ] **Indicador de calidad de prompt**: la IA evalua si el prompt es bueno
- [ ] **Copiar prompt formateado**: opcion de copiar con metadata (escena #, duracion)
- [ ] **Regenerar con variacion**: "Regenerar pero mas dramatico" / "mas suave"
- [ ] **Arrastrar para reordenar** con feedback visual (linea de insercion)
- [ ] **Vista split**: ver prompt EN + descripcion ES lado a lado
- [ ] **Boton "Copiar todo para Grok/Flow"**: formatea todos los prompts para pegar directamente

### 3.4 Escena Detalle
- [ ] **Edicion inline de prompts**: poder editar el texto del prompt manualmente
- [ ] **Historial de versiones**: ver y restaurar versiones anteriores del prompt
- [ ] **Preview de imagen**: si el usuario sube la imagen generada, mostrarla
- [ ] **Galeria de versiones**: multiples imagenes por escena, comparar lado a lado
- [ ] **Notas del director**: campo para instrucciones especificas
- [ ] **Modo "refinar"**: la IA sugiere mejoras al prompt actual

### 3.5 Personajes
- [ ] **Edicion post-creacion**: poder modificar nombre, descripcion, snippet
- [ ] **Prompt snippet editor**: editar el snippet directamente con preview
- [ ] **Generacion de turnaround**: crear hoja de referencia multi-angulo
- [ ] **Reglas visuales**: "siempre lleva gafas", "nunca sin chaqueta"
- [ ] **Variantes de expresion**: generar diferentes expresiones del personaje
- [ ] **Coherencia visual**: mostrar todas las escenas donde aparece para verificar

### 3.6 Fondos
- [ ] **Edicion post-creacion**: modificar descripcion, tipo, hora del dia
- [ ] **Angulos disponibles**: configurar que angulos de camara son posibles
- [ ] **Variantes de iluminacion**: generar el mismo fondo en diferentes horas
- [ ] **Categorias**: organizar por tipo (interior, exterior, urbano, naturaleza)

### 3.7 Timeline
- [ ] **Reordenar escenas arrastrando** en la timeline visual
- [ ] **Editar duracion** directamente en la barra
- [ ] **Marcadores de audio**: donde empieza musica, dialogo, SFX
- [ ] **Vista de coherencia**: mostrar si hay saltos bruscos de camara/iluminacion

### 3.8 Narracion
- [ ] **Selector de voz**: elegir entre voces disponibles
- [ ] **Editar texto** antes de generar audio
- [ ] **Preview por escena**: escuchar la narracion escena por escena
- [ ] **Sincronizacion visual**: marcar en que segundo empieza cada frase

### 3.9 Exportar
- [ ] **PDF storyboard funcional**: con imagenes, prompts, y metadata
- [ ] **ZIP completo**: todas las imagenes + prompts + script
- [ ] **Formato "Copiar para IA"**: un documento optimizado para pegar en Grok/Flow
- [ ] **Export por escena**: exportar solo escenas seleccionadas
- [ ] **Formato CSV**: para importar en otras herramientas

---

## 4. IA — Mejoras para Mejor Calidad de Prompts

### 4.1 Consistencia Visual (CRITICO)
Problema actual: cada prompt se genera aislado, sin verificar que sea visualmente coherente con el anterior/siguiente.

- [ ] **Inyectar contexto de escenas adyacentes**: antes de generar el prompt de escena #3, enviar a la IA un resumen del prompt de escena #2 y #4
- [ ] **Regla de continuidad**: "mantener la misma iluminacion/estilo que la escena anterior"
- [ ] **Verificacion post-generacion**: la IA compara los prompts de todas las escenas y flag inconsistencias
- [ ] **Snippet lock**: si un personaje lleva "chaqueta azul" en escena 1, forzar "chaqueta azul" en todas

### 4.2 Calidad de Prompts de Imagen
Los prompts deben ser entendidos perfectamente por Grok, Midjourney, DALL-E, Flux, etc.

- [ ] **Estructura estandarizada**: Subject → Action → Setting → Camera → Lighting → Style → Quality
- [ ] **Peso de tokens**: permitir enfasis con () o {} segun la herramienta destino
- [ ] **Negative prompts**: generar automaticamente lo que NO debe aparecer
- [ ] **Aspecto ratio explicito**: incluir "16:9" o "9:16" en el prompt
- [ ] **Seed consistency**: sugerir usar el mismo seed para mantener estilo
- [ ] **Referencia de estilo**: "in the style of [referencia]" cuando el proyecto tiene un estilo definido
- [ ] **Longitud optima**: limitar a 60-80 palabras (sweet spot para la mayoria de modelos)

### 4.3 Calidad de Prompts de Video
Los prompts de video deben funcionar en Runway, Kling, Pika, etc.

- [ ] **Movimiento frame-by-frame**: describir que pasa en cada segundo
- [ ] **Transiciones entre escenas**: "fade in from black", "cut to", "dissolve to"
- [ ] **Velocidad de camara**: "slow dolly in over 3 seconds" vs "quick pan"
- [ ] **Lip sync markers**: si hay dialogo, indicar cuando habla el personaje
- [ ] **Loop-friendly**: para videos cortos (Reels), indicar si el final conecta con el inicio
- [ ] **Duracion exacta**: siempre incluir "Duration: exactly Xs"

### 4.4 Motor de Prompt Mejorado
- [ ] **Template por herramienta destino**: diferentes formatos para Grok vs Midjourney vs Flux
- [ ] **Modo "detallado" vs "minimalista"**: el usuario elige cuanto detalle quiere
- [ ] **Auto-mejora**: la IA revisa su propio prompt y lo refina en 2 pasadas
- [ ] **A/B testing**: generar 2 variantes del prompt para que el usuario elija
- [ ] **Prompt scoring**: evaluar de 1-10 la calidad del prompt antes de mostrarlo
- [ ] **Historial de prompts efectivos**: aprender de prompts que dieron buenos resultados

### 4.5 Agentes IA Especializados
- [ ] **Agente de continuidad**: verifica que personajes y fondos sean consistentes
- [ ] **Agente de ritmo**: verifica que la duracion y fases narrativas fluyan bien
- [ ] **Agente de calidad**: evalua cada prompt y sugiere mejoras especificas
- [ ] **Agente de transiciones**: genera prompts de transicion entre escenas

---

## 5. FLUJO COMPLETO — El Pipeline Ideal

```
1. Crear proyecto
   → Definir estilo visual, paleta, reglas globales

2. Crear personajes
   → Nombre, descripcion, prompt_snippet, reglas (siempre/nunca)
   → Generar hoja de referencia (turnaround)
   → Subir imagen de referencia

3. Crear fondos
   → Nombre, tipo, hora del dia, prompt_snippet
   → Angulos disponibles
   → Subir imagen de referencia

4. Crear video
   → Plataforma, duracion, aspecto ratio

5. Crear escenas (manual o con IA)
   → La IA sugiere escenas basadas en el brief del proyecto
   → Cada escena tiene: titulo, descripcion, fase, camara, personajes, fondo
   → Al crear → auto-genera prompts de imagen Y video

6. Revisar prompts
   → Ver cada prompt, editarlo si es necesario
   → La IA verifica consistencia entre escenas
   → Regenerar los que no sean buenos

7. Copiar prompts → Generar en herramienta externa
   → "Copiar todo para Grok": formatea todos los prompts listos para pegar
   → El usuario genera las imagenes/videos en Grok, Flow, Runway, etc.
   → Sube las imagenes/videos generados a Kiyoko

8. Revision final
   → Ver todas las imagenes lado a lado
   → La IA compara con los prompts y detecta problemas
   → Aprobar o regenerar

9. Exportar
   → PDF storyboard con imagenes + prompts
   → ZIP con todo el material
   → Script para edicion de video
```

---

## 6. PRIORIDADES DE IMPLEMENTACION

### Sprint 1 — Calidad de Prompts (1-2 dias)
1. Inyectar contexto de escenas adyacentes al generar prompts
2. Estructura estandarizada de prompts (Subject → Action → Setting → ...)
3. Negative prompts automaticos
4. Prompt scoring (evaluacion de calidad)
5. Edicion manual de prompts en escena detalle

### Sprint 2 — Consistencia Visual (1-2 dias)
1. Verificacion de snippet lock (personajes coherentes)
2. Comparacion post-generacion entre escenas
3. Reglas de continuidad (iluminacion, estilo)
4. Agente de calidad que revisa cada prompt

### Sprint 3 — UX y Flujo (2-3 dias)
1. Breadcrumbs y busqueda global
2. Vista split prompt EN + descripcion ES
3. Boton "Copiar todo para Grok/Flow" formateado
4. Edicion inline de prompts
5. Historial de versiones de prompts

### Sprint 4 — Personajes y Fondos (1-2 dias)
1. Edicion post-creacion
2. Prompt snippet editor con preview
3. Turnaround de personajes
4. Variantes de iluminacion para fondos
5. Vista de coherencia por personaje

### Sprint 5 — Export y Publicacion (1-2 dias)
1. PDF storyboard funcional
2. ZIP completo
3. Formato "Copiar para IA" optimizado
4. Export selectivo por escenas

### Sprint 6 — Mobile y Polish (1-2 dias)
1. Menu hamburguesa mobile
2. Bottom navigation
3. Busqueda global Cmd+K
4. Indicadores de progreso en sidebar
5. Notificaciones cuando la IA termina

---

## 7. METRICAS DE EXITO

- **Calidad de prompt**: > 8/10 en scoring automatico
- **Consistencia visual**: < 2 inconsistencias por video de 10 escenas
- **Velocidad**: generar prompts de 10 escenas en < 30 segundos
- **Usabilidad**: crear un video completo (10 escenas) en < 15 minutos
- **Coherencia**: las imagenes generadas externamente se ven como del mismo video
