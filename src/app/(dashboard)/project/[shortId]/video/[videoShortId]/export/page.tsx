'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import {
  Loader2, FileText, Code, Music, Archive, Video, Globe,
  Download, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

type ExportFormat = 'pdf' | 'html' | 'json' | 'md' | 'mp3' | 'zip';

const EXPORT_OPTIONS: { label: string; desc: string; icon: React.ElementType; format: ExportFormat; ready: boolean }[] = [
  { label: 'PDF Storyboard', desc: 'Documento visual con escenas', icon: FileText, format: 'pdf', ready: false },
  { label: 'HTML Interactivo', desc: 'Web con imágenes y prompts', icon: Globe, format: 'html', ready: false },
  { label: 'JSON Datos', desc: 'Datos estructurados del video', icon: Code, format: 'json', ready: true },
  { label: 'Markdown Guion', desc: 'Guion en texto plano', icon: FileText, format: 'md', ready: true },
  { label: 'MP3 Narración', desc: 'Audio de narración', icon: Music, format: 'mp3', ready: false },
  { label: 'ZIP Completo', desc: 'Todo empaquetado', icon: Archive, format: 'zip', ready: false },
];

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
      return data ?? [];
    },
    enabled: !!video?.id,
  });

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
            prompts: (s.scene_prompts as Array<{ prompt_type: string; prompt_text: string; is_current: boolean }>)?.filter((p) => p.is_current),
            characters: (s.scene_characters as Array<{ character: unknown }>)?.map((sc) => sc.character),
            backgrounds: (s.scene_backgrounds as Array<{ background: unknown }>)?.map((sb) => sb.background),
          })),
          exported_at: new Date().toISOString(),
        };
        downloadFile(JSON.stringify(data, null, 2), `${video.title.replace(/\s+/g, '_')}.json`, 'application/json');
        toast.success('JSON exportado');
      }

      if (format === 'md') {
        let md = `# ${video.title}\n\n`;
        md += `**Proyecto:** ${project.title}\n`;
        md += `**Plataforma:** ${video.platform} | **Duración:** ${video.target_duration_seconds}s | **Aspecto:** ${video.aspect_ratio}\n\n`;
        md += `---\n\n`;

        for (const s of fullScenes) {
          md += `## Escena ${s.scene_number}: ${s.title}\n\n`;
          md += `- **Fase:** ${s.arc_phase} | **Duración:** ${s.duration_seconds}s | **Estado:** ${s.status}\n`;
          if (s.description) md += `\n${s.description}\n`;
          if (s.dialogue) md += `\n> ${s.dialogue}\n`;
          if (s.director_notes) md += `\n*Notas:* ${s.director_notes}\n`;

          const prompts = (s.scene_prompts as Array<{ prompt_type: string; prompt_text: string; is_current: boolean }>)?.filter((p) => p.is_current);
          if (prompts?.length) {
            md += `\n### Prompts\n\n`;
            for (const p of prompts) {
              md += `**${p.prompt_type}:**\n\`\`\`\n${p.prompt_text}\n\`\`\`\n\n`;
            }
          }
          md += `---\n\n`;
        }
        downloadFile(md, `${video.title.replace(/\s+/g, '_')}.md`, 'text/markdown');
        toast.success('Markdown exportado');
      }

      if (!['json', 'md'].includes(format)) {
        toast.info(`${EXPORT_OPTIONS.find((o) => o.format === format)?.label} — próximamente`);
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
      <div className="flex flex-col items-center justify-center py-20">
        <Video className="h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-semibold">Video no encontrado</h3>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Exportar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {video.title} — {scenes.length} escena{scenes.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_OPTIONS.map((opt) => (
          <button
            key={opt.format}
            type="button"
            onClick={() => handleExport(opt.format)}
            disabled={exporting !== null}
            className={cn(
              'group flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left transition cursor-pointer',
              opt.ready
                ? 'border-border hover:border-primary/30 hover:shadow-md'
                : 'border-border/50 opacity-60',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition',
                opt.ready
                  ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                  : 'bg-muted text-muted-foreground',
              )}>
                {exporting === opt.format ? <Loader2 className="h-5 w-5 animate-spin" /> : <opt.icon className="h-5 w-5" />}
              </div>
              {opt.ready && <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              {!opt.ready && <span className="text-[10px] text-muted-foreground">Próximamente</span>}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{opt.label}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
