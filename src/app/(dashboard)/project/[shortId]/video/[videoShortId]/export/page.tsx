'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import {
  Loader2, FileText, Music, Archive, Video, Globe,
  Download, CheckCircle2, FileJson, FileCode2, Copy, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

type ExportFormat = 'pdf' | 'html' | 'json' | 'md' | 'mp3' | 'zip';

interface ScenePrompt {
  prompt_type: string;
  prompt_text: string;
  is_current: boolean;
}

interface SceneCharacterJoin {
  character: { name: string; role: string; visual_description: string } | null;
}

interface SceneBackgroundJoin {
  background: { name: string; location_type: string; time_of_day: string } | null;
}

interface SceneCameraRow {
  camera_angle: string | null;
  camera_movement: string | null;
  lighting: string | null;
  mood: string | null;
}

interface FullScene {
  id: string;
  short_id: string;
  title: string;
  description: string | null;
  dialogue: string | null;
  scene_number: number;
  duration_seconds: number | null;
  arc_phase: string | null;
  status: string | null;
  scene_type: string | null;
  notes: string | null;
  director_notes: string | null;
  scene_camera: SceneCameraRow | SceneCameraRow[] | null;
  scene_prompts: ScenePrompt[] | null;
  scene_characters: SceneCharacterJoin[] | null;
  scene_backgrounds: SceneBackgroundJoin[] | null;
}

const EXPORT_OPTIONS: {
  label: string;
  desc: string;
  detail: string;
  icon: React.ElementType;
  format: ExportFormat;
  ready: boolean;
  estimatePerScene: number;
}[] = [
  {
    label: 'JSON Datos',
    desc: 'Datos estructurados',
    detail: 'Exporta todas las escenas, prompts, personajes y configuracion de camara en formato JSON legible.',
    icon: FileJson,
    format: 'json',
    ready: true,
    estimatePerScene: 2048,
  },
  {
    label: 'Markdown Guion',
    desc: 'Guion en texto plano',
    detail: 'Genera un documento Markdown con el guion completo, dialogos, notas del director y prompts.',
    icon: FileText,
    format: 'md',
    ready: true,
    estimatePerScene: 1024,
  },
  {
    label: 'HTML Interactivo',
    desc: 'Web navegable',
    detail: 'Pagina web autocontenida con navegacion entre escenas, imagenes y prompts visuales.',
    icon: Globe,
    format: 'html',
    ready: true,
    estimatePerScene: 4096,
  },
  {
    label: 'PDF Storyboard',
    desc: 'Documento visual',
    detail: 'Storyboard en PDF con imagenes de cada escena, dialogos y notas de produccion.',
    icon: FileCode2,
    format: 'pdf',
    ready: false,
    estimatePerScene: 0,
  },
  {
    label: 'MP3 Narracion',
    desc: 'Audio completo',
    detail: 'Archivo de audio con la narracion generada por IA para todas las escenas.',
    icon: Music,
    format: 'mp3',
    ready: false,
    estimatePerScene: 0,
  },
  {
    label: 'ZIP Completo',
    desc: 'Todo empaquetado',
    detail: 'Paquete completo con JSON, Markdown, HTML, imagenes y audio en un solo archivo.',
    icon: Archive,
    format: 'zip',
    ready: false,
    estimatePerScene: 0,
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `~${bytes} B`;
  if (bytes < 1024 * 1024) return `~${(bytes / 1024).toFixed(1)} KB`;
  return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VideoExportPage() {
  const { project } = useProject();
  const { video, loading, scenes } = useVideo();
  const supabase = createClient();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exported, setExported] = useState<Set<ExportFormat>>(new Set());
  const [promptsCopied, setPromptsCopied] = useState(false);

  // Fetch full scene data for export
  const { data: fullScenes } = useQuery({
    queryKey: ['export-scenes', video?.id],
    queryFn: async () => {
      if (!video) return [];
      const { data } = await supabase
        .from('scenes')
        .select(`
          id, short_id, title, description, dialogue, scene_number, duration_seconds,
          arc_phase, status, scene_type, notes, director_notes,
          scene_camera(camera_angle, camera_movement, lighting, mood),
          scene_prompts(prompt_type, prompt_text, is_current),
          scene_characters(character:characters!character_id(name, role, visual_description)),
          scene_backgrounds(background:backgrounds!background_id(name, location_type, time_of_day))
        `)
        .eq('video_id', video.id)
        .order('sort_order');
      return (data as unknown as FullScene[]) ?? [];
    },
    enabled: !!video?.id,
  });

  const sceneCount = scenes.length || fullScenes?.length || 0;

  // --- Copy all prompts ---
  const handleCopyAllPrompts = async () => {
    if (!fullScenes || !video || !project) return;

    let output = `=== ${project.title?.toUpperCase() ?? 'PROYECTO'} -- ${video.title} ===\n`;
    output += `=== PROMPTS DE IMAGEN ===\n\n`;

    for (const s of fullScenes) {
      const imagePrompts = s.scene_prompts?.filter(
        (p) => p.is_current && (p.prompt_type === 'image' || p.prompt_type === 'imagen')
      ) ?? [];
      if (imagePrompts.length > 0) {
        output += `#${s.scene_number} ${s.title}\n`;
        for (const p of imagePrompts) {
          output += `${p.prompt_text}\n`;
        }
        output += `\n`;
      }
    }

    output += `=== PROMPTS DE VIDEO ===\n\n`;

    for (const s of fullScenes) {
      const videoPrompts = s.scene_prompts?.filter(
        (p) => p.is_current && (p.prompt_type === 'video' || p.prompt_type === 'motion')
      ) ?? [];
      if (videoPrompts.length > 0) {
        output += `#${s.scene_number} ${s.title}\n`;
        for (const p of videoPrompts) {
          output += `${p.prompt_text}\n`;
        }
        output += `\n`;
      }
    }

    // If no prompts were separated by type, dump all current prompts
    const hasTyped = fullScenes.some((s) =>
      s.scene_prompts?.some((p) => p.is_current && ['image', 'imagen', 'video', 'motion'].includes(p.prompt_type))
    );
    if (!hasTyped) {
      output = `=== ${project.title?.toUpperCase() ?? 'PROYECTO'} -- ${video.title} ===\n`;
      output += `=== TODOS LOS PROMPTS ===\n\n`;
      for (const s of fullScenes) {
        const currentPrompts = s.scene_prompts?.filter((p) => p.is_current) ?? [];
        if (currentPrompts.length > 0) {
          output += `#${s.scene_number} ${s.title}\n`;
          for (const p of currentPrompts) {
            output += `[${p.prompt_type}] ${p.prompt_text}\n`;
          }
          output += `\n`;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(output.trim());
      setPromptsCopied(true);
      toast.success('Prompts copiados al portapapeles');
      setTimeout(() => setPromptsCopied(false), 3000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  // --- Copy single scene prompt ---
  const handleCopyScenePrompt = async (scene: FullScene) => {
    const currentPrompts = scene.scene_prompts?.filter((p) => p.is_current) ?? [];
    if (currentPrompts.length === 0) {
      toast.info('Esta escena no tiene prompts');
      return;
    }

    let text = `#${scene.scene_number} ${scene.title}\n`;
    for (const p of currentPrompts) {
      text += `[${p.prompt_type}] ${p.prompt_text}\n`;
    }

    try {
      await navigator.clipboard.writeText(text.trim());
      toast.success(`Prompt de escena ${scene.scene_number} copiado`);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!video || !project || !fullScenes) return;
    setExporting(format);

    try {
      if (format === 'json') {
        const data = {
          project: { title: project.title, style: project.style, description: project.description },
          video: { title: video.title, platform: video.platform, target_duration: video.target_duration_seconds, aspect_ratio: video.aspect_ratio },
          scenes: fullScenes.map((s) => ({
            number: s.scene_number,
            title: s.title,
            description: s.description,
            dialogue: s.dialogue,
            duration: s.duration_seconds,
            phase: s.arc_phase,
            status: s.status,
            type: s.scene_type,
            camera: Array.isArray(s.scene_camera) ? s.scene_camera[0] : s.scene_camera,
            prompts: s.scene_prompts?.filter((p) => p.is_current),
            characters: s.scene_characters?.map((sc) => sc.character),
            backgrounds: s.scene_backgrounds?.map((sb) => sb.background),
          })),
          exported_at: new Date().toISOString(),
        };
        downloadFile(JSON.stringify(data, null, 2), `${video.title.replace(/\s+/g, '_')}.json`, 'application/json');
        setExported((prev) => new Set(prev).add('json'));
        toast.success('JSON exportado correctamente');
      }

      if (format === 'md') {
        let md = `# ${video.title}\n\n`;
        md += `**Proyecto:** ${project.title}\n`;
        md += `**Plataforma:** ${video.platform} | **Duracion:** ${video.target_duration_seconds}s | **Aspecto:** ${video.aspect_ratio}\n\n`;
        md += `---\n\n`;

        for (const s of fullScenes) {
          md += `## Escena ${s.scene_number}: ${s.title}\n\n`;
          md += `- **Fase:** ${s.arc_phase} | **Duracion:** ${s.duration_seconds}s | **Estado:** ${s.status}\n`;
          if (s.description) md += `\n${s.description}\n`;
          if (s.dialogue) md += `\n> ${s.dialogue}\n`;
          if (s.director_notes) md += `\n*Notas:* ${s.director_notes}\n`;

          const prompts = s.scene_prompts?.filter((p) => p.is_current);
          if (prompts?.length) {
            md += `\n### Prompts\n\n`;
            for (const p of prompts) {
              md += `**${p.prompt_type}:**\n\`\`\`\n${p.prompt_text}\n\`\`\`\n\n`;
            }
          }
          md += `---\n\n`;
        }
        downloadFile(md, `${video.title.replace(/\s+/g, '_')}.md`, 'text/markdown');
        setExported((prev) => new Set(prev).add('md'));
        toast.success('Markdown exportado correctamente');
      }

      if (format === 'html') {
        let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${video.title} - Storyboard</title>
  <style>
    :root { color-scheme: dark; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0b; color: #e4e4e7; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.75rem; font-weight: 600; margin-bottom: 0.5rem; }
    .meta { color: #71717a; font-size: 0.875rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #27272a; }
    .scene { background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .scene h2 { font-size: 1.125rem; margin-bottom: 0.75rem; }
    .scene-meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .badge { background: #27272a; padding: 0.125rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; color: #a1a1aa; }
    .desc { color: #a1a1aa; font-size: 0.875rem; }
    .dialogue { background: #1e1e22; border-left: 3px solid #3b82f6; padding: 0.75rem 1rem; margin-top: 0.75rem; border-radius: 0 0.5rem 0.5rem 0; font-style: italic; color: #d4d4d8; }
    .prompt { background: #1a1a2e; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-top: 0.75rem; font-family: monospace; font-size: 0.8rem; color: #a1a1aa; white-space: pre-wrap; }
    .prompt-label { font-size: 0.75rem; font-weight: 600; color: #6366f1; margin-bottom: 0.25rem; text-transform: uppercase; }
    .footer { text-align: center; padding: 2rem 0 1rem; color: #52525b; font-size: 0.75rem; }
  </style>
</head>
<body>
  <h1>${video.title}</h1>
  <div class="meta">Proyecto: ${project.title} | Plataforma: ${video.platform} | Duracion: ${video.target_duration_seconds}s | Aspecto: ${video.aspect_ratio}</div>
`;
        for (const s of fullScenes) {
          html += `  <div class="scene">
    <h2>Escena ${s.scene_number}: ${s.title}</h2>
    <div class="scene-meta">
      <span class="badge">Fase: ${s.arc_phase ?? 'N/A'}</span>
      <span class="badge">Duracion: ${s.duration_seconds ?? 0}s</span>
      <span class="badge">Estado: ${s.status ?? 'draft'}</span>
    </div>
`;
          if (s.description) html += `    <p class="desc">${s.description}</p>\n`;
          if (s.dialogue) html += `    <div class="dialogue">${s.dialogue}</div>\n`;

          const prompts = s.scene_prompts?.filter((p) => p.is_current);
          if (prompts?.length) {
            for (const p of prompts) {
              html += `    <div class="prompt"><div class="prompt-label">${p.prompt_type}</div>${p.prompt_text}</div>\n`;
            }
          }
          html += `  </div>\n`;
        }
        html += `  <div class="footer">Exportado desde Kiyoko AI &mdash; ${new Date().toLocaleDateString('es')}</div>
</body>
</html>`;
        downloadFile(html, `${video.title.replace(/\s+/g, '_')}.html`, 'text/html');
        setExported((prev) => new Set(prev).add('html'));
        toast.success('HTML exportado correctamente');
      }

      if (!['json', 'md', 'html'].includes(format)) {
        toast.info(`${EXPORT_OPTIONS.find((o) => o.format === format)?.label} -- proximamente`);
      }
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video || !project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
          <Video className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Video no encontrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">No se pudo cargar la informacion del video.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Exportar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {video.title} -- {sceneCount} escena{sceneCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Copy all prompts card */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Copiar prompts
        </p>
        <button
          type="button"
          onClick={handleCopyAllPrompts}
          className={cn(
            'group flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all cursor-pointer',
            'border-border hover:border-primary/30 hover:shadow-lg bg-card',
            promptsCopied && 'border-emerald-500/30',
          )}
        >
          <div className={cn(
            'flex shrink-0 items-center justify-center size-10 rounded-xl transition',
            promptsCopied
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
          )}>
            {promptsCopied ? <ClipboardCheck className="size-5" /> : <Copy className="size-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">Prompts para generacion</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Todos los prompts de imagen y video en orden, listos para copiar a Grok, Flow o Runway.
            </p>
          </div>
        </button>

        {/* Per-scene prompt copy */}
        {fullScenes && fullScenes.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-muted-foreground ml-1">Copiar prompt individual:</p>
            <div className="flex flex-wrap gap-1.5">
              {fullScenes.map((s) => {
                const hasPrompts = s.scene_prompts?.some((p) => p.is_current);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleCopyScenePrompt(s)}
                    disabled={!hasPrompts}
                    className={cn(
                      'rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition',
                      hasPrompts
                        ? 'text-foreground hover:bg-secondary cursor-pointer'
                        : 'text-muted-foreground/40 cursor-not-allowed',
                    )}
                    title={`Copiar prompts de: ${s.title}`}
                  >
                    E{s.scene_number}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Available exports */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Formatos disponibles
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_OPTIONS.filter((o) => o.ready).map((opt) => {
            const isExporting = exporting === opt.format;
            const wasExported = exported.has(opt.format);
            const sizeEstimate = opt.estimatePerScene * sceneCount;

            return (
              <button
                key={opt.format}
                type="button"
                onClick={() => handleExport(opt.format)}
                disabled={exporting !== null}
                className={cn(
                  'group flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all',
                  'border-border hover:border-primary/30 hover:shadow-lg cursor-pointer bg-card',
                  wasExported && 'border-emerald-500/30',
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                    {isExporting ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : wasExported ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <opt.icon className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <Download className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{opt.detail}</p>
                {sizeEstimate > 0 && (
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatFileSize(sizeEstimate)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coming soon exports */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Proximamente
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_OPTIONS.filter((o) => !o.ready).map((opt) => (
            <div
              key={opt.format}
              className="flex flex-col items-start gap-3 rounded-xl border border-border/50 p-5 opacity-50 cursor-not-allowed bg-card"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center size-10 rounded-xl bg-muted text-muted-foreground">
                  <opt.icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{opt.detail}</p>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Proximamente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
