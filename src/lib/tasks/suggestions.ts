import type { Project, Scene, TaskCategory, TaskPriority, Video, VideoAnalysis, VideoNarration } from '@/types';

export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  videoId?: string;
  rationale: string;
}

interface BuildTaskSuggestionsInput {
  project: Project | null;
  videos: Video[];
  currentVideo: Video | null;
  scenes: Scene[];
  analysis: VideoAnalysis | null;
  narration: VideoNarration | null;
}

function suggestion(id: string, title: string, description: string, category: TaskCategory, priority: TaskPriority, rationale: string, videoId?: string): TaskSuggestion {
  return { id, title, description, category, priority, rationale, videoId };
}

export function buildTaskSuggestions(input: BuildTaskSuggestionsInput) {
  const { project, videos, currentVideo, scenes, analysis, narration } = input;
  const items: TaskSuggestion[] = [];

  if (!project) return items;

  if (!project.description?.trim()) {
    items.push(
      suggestion(
        'project-brief',
        'Definir brief operativo del proyecto',
        `Documentar objetivo, tono, entregables y criterio de exito para ${project.title}.`,
        'script',
        'high',
        'El proyecto no tiene una descripcion clara y eso suele bloquear el resto de tareas.',
      ),
    );
  }

  if (videos.length === 0) {
    items.push(
      suggestion(
        'first-video',
        'Crear el primer video del proyecto',
        `Abrir la primera pieza audiovisual de ${project.title} y definir formato, objetivo y duracion.`,
        'video_gen',
        'high',
        'El proyecto aun no tiene videos asociados, asi que la siguiente accion natural es abrir su primera pieza.',
      ),
    );
  }

  for (const video of videos.slice(0, 4)) {
    if (video.status === 'draft') {
      items.push(
        suggestion(
          `video-script-${video.id}`,
          `Definir guion de ${video.title}`,
          `Aterrizar narrativa, estructura y objetivos de la pieza antes de producir escenas.`,
          'script',
          'high',
          'El video sigue en borrador y necesita una base narrativa para avanzar con menos retrabajo.',
          video.id,
        ),
      );
    }

    if (video.status === 'prompting') {
      items.push(
        suggestion(
          `video-prompts-${video.id}`,
          `Revisar prompts de ${video.title}`,
          `Ajustar prompts visuales y reglas de estilo antes de lanzar generacion.`,
          'prompt',
          'high',
          'El video esta en fase de prompting y conviene cerrar prompts antes de generar contenido.',
          video.id,
        ),
      );
    }

    if (video.status === 'generating') {
      items.push(
        suggestion(
          `video-monitor-${video.id}`,
          `Supervisar generacion de ${video.title}`,
          `Validar resultados intermedios, detectar fallos y preparar correcciones.`,
          'review',
          'medium',
          'La generacion esta en marcha y suele requerir una tarea de seguimiento para evitar cuellos de botella.',
          video.id,
        ),
      );
    }

    if (video.status === 'review') {
      items.push(
        suggestion(
          `video-review-${video.id}`,
          `Cerrar revision de ${video.title}`,
          `Revisar calidad, continuidad y feedback pendiente para decidir si se aprueba o vuelve a iteracion.`,
          'review',
          'high',
          'El video ya esta en revision y necesita una accion clara para no quedarse atascado.',
          video.id,
        ),
      );
    }

    if (video.status === 'approved') {
      items.push(
        suggestion(
          `video-export-${video.id}`,
          `Preparar exportacion de ${video.title}`,
          `Confirmar version final, naming y assets antes de exportar o publicar.`,
          'export',
          'medium',
          'El video ya esta aprobado y lo eficiente es moverlo cuanto antes a salida o publicacion.',
          video.id,
        ),
      );
    }
  }

  if (currentVideo) {
    if (scenes.length === 0) {
      items.push(
        suggestion(
          `scenes-${currentVideo.id}`,
          `Desglosar escenas de ${currentVideo.title}`,
          `Definir la estructura por escenas para producir el video con menos ambiguedad.`,
          'script',
          'high',
          'El video actual no tiene escenas, asi que falta el desglose minimo para producirlo bien.',
          currentVideo.id,
        ),
      );
    }

    const pendingScenes = scenes.filter((scene) => scene.status !== 'approved');
    if (pendingScenes.length > 0) {
      items.push(
        suggestion(
          `scene-review-${currentVideo.id}`,
          `Revisar ${pendingScenes.length} escenas pendientes`,
          `Ordenar correcciones y aprobaciones de escenas abiertas en ${currentVideo.title}.`,
          'review',
          pendingScenes.length > 3 ? 'high' : 'medium',
          'Hay escenas sin aprobar en el video actual y eso suele frenar el cierre del video.',
          currentVideo.id,
        ),
      );
    }

    if (!narration) {
      items.push(
        suggestion(
          `narration-${currentVideo.id}`,
          `Preparar narracion de ${currentVideo.title}`,
          `Definir texto, tono y voz para la narracion o locucion del video.`,
          'voiceover',
          'medium',
          'El video actual no tiene narracion activa y eso puede bloquear revision o exportacion.',
          currentVideo.id,
        ),
      );
    }

    if (!analysis) {
      items.push(
        suggestion(
          `analysis-${currentVideo.id}`,
          `Analizar calidad de ${currentVideo.title}`,
          `Ejecutar o revisar analisis del video para detectar riesgos antes de aprobar.`,
          'review',
          'medium',
          'Todavia no hay analisis actual del video y una revision automatizada puede ahorrar iteraciones.',
          currentVideo.id,
        ),
      );
    } else if ((analysis.overall_score ?? 100) < 75) {
      items.push(
        suggestion(
          `analysis-fix-${currentVideo.id}`,
          `Aplicar mejoras del analisis en ${currentVideo.title}`,
          analysis.summary?.trim() || 'Revisar hallazgos del analisis actual y traducirlos a acciones concretas.',
          'review',
          'high',
          'El analisis del video actual indica margen claro de mejora y conviene convertirlo en tarea accionable.',
          currentVideo.id,
        ),
      );
    }
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  }).slice(0, 6);
}