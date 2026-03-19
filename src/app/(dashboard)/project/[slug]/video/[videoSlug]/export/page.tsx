'use client';

import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import { KButton } from '@/components/ui/kiyoko-button';
import { Loader2, FileOutput, FileText, Code, Music, Archive, Video, Globe } from 'lucide-react';
import { toast } from 'sonner';

const EXPORT_OPTIONS = [
  { label: 'PDF Storyboard', desc: 'Documento visual con todas las escenas', icon: FileText, format: 'pdf' },
  { label: 'HTML Interactivo', desc: 'Web navegable con imágenes y prompts', icon: Globe, format: 'html' },
  { label: 'JSON Datos', desc: 'Datos estructurados para integración', icon: Code, format: 'json' },
  { label: 'Markdown Guion', desc: 'Texto del guion en Markdown', icon: FileText, format: 'md' },
  { label: 'MP3 Narración', desc: 'Audio completo de narración', icon: Music, format: 'mp3' },
  { label: 'ZIP Completo', desc: 'Todo: PDF + imágenes + audio + datos', icon: Archive, format: 'zip' },
] as const;

export default function VideoExportPage() {
  const { project } = useProject();
  const { video, loading, scenes } = useVideo();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!video || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Video className="h-10 w-10 text-foreground-muted" />
        <h3 className="mt-4 text-lg font-semibold">Video no encontrado</h3>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Exportar</h2>
        <p className="text-sm text-foreground-muted">
          {video.name} — {scenes.length} escena{scenes.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_OPTIONS.map((opt) => (
          <button
            key={opt.format}
            type="button"
            onClick={() => toast.info(`Exportar ${opt.label} — próximamente`)}
            className="group flex flex-col items-start gap-3 rounded-xl border border-surface-tertiary bg-surface p-5 text-left transition hover:border-brand-500/30 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white">
              <opt.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{opt.label}</h3>
              <p className="mt-0.5 text-xs text-foreground-muted">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
