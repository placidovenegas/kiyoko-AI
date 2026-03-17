'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ExportRecord {
  id: string;
  format: string;
  file_url: string | null;
  file_size_bytes: number;
  version: number;
  notes: string;
  created_at: string;
}

const EXPORT_FORMATS = [
  {
    name: 'HTML',
    description: 'Storyboard interactivo para navegador',
    icon: '🌐',
    extension: '.html',
    endpoint: '/api/export/html',
    contentType: 'text/html',
  },
  {
    name: 'JSON',
    description: 'Datos estructurados para integracion',
    icon: '📋',
    extension: '.json',
    endpoint: '/api/export/json',
    contentType: 'application/json',
  },
  {
    name: 'Markdown',
    description: 'Documento de texto formateado',
    icon: '📝',
    extension: '.md',
    endpoint: '/api/export/markdown',
    contentType: 'text/markdown',
  },
  {
    name: 'PDF',
    description: 'Documento listo para imprimir o compartir',
    icon: '📄',
    extension: '.pdf',
    endpoint: '/api/export/pdf',
    contentType: 'application/pdf',
  },
];

export default function ExportsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!project) {
      setLoading(false);
      return;
    }

    setProjectId(project.id);

    const { data: exportsData } = await supabase
      .from('exports')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    setExports(exportsData ?? []);
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (format: (typeof EXPORT_FORMATS)[number]) => {
    if (!projectId || exporting) return;

    setExporting(format.name);

    try {
      const response = await fetch(format.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}${format.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh exports history
      fetchData();
    } catch (error) {
      alert('Error al exportar. Intenta de nuevo.');
    } finally {
      setExporting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 w-32 animate-pulse rounded bg-surface-secondary" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-surface-secondary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Exportar</h2>
        <p className="text-sm text-foreground-muted">
          Descarga tu storyboard en diferentes formatos
        </p>
      </div>

      {/* Export format cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {EXPORT_FORMATS.map((format) => (
          <div
            key={format.name}
            className="flex items-start justify-between rounded-xl bg-surface-secondary p-4"
          >
            <div className="flex gap-3">
              <div className="text-2xl">{format.icon}</div>
              <div>
                <h3 className="font-semibold text-foreground">{format.name}</h3>
                <p className="text-sm text-foreground-muted">
                  {format.description}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {format.extension}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleExport(format)}
              disabled={exporting !== null}
              className="shrink-0 rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm font-medium text-foreground-secondary transition hover:bg-surface-tertiary disabled:opacity-50"
            >
              {exporting === format.name ? 'Exportando...' : 'Descargar'}
            </button>
          </div>
        ))}
      </div>

      {/* History section */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
          Historial de exportaciones
        </h3>
        {exports.length > 0 ? (
          <div className="space-y-2">
            {exports.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between rounded-xl bg-surface-secondary p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {EXPORT_FORMATS.find(
                      (f) => f.name.toLowerCase() === exp.format
                    )?.icon ?? '📁'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {exp.format.toUpperCase()} v{exp.version}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {formatDate(exp.created_at)} &middot;{' '}
                      {formatFileSize(exp.file_size_bytes)}
                    </p>
                  </div>
                </div>
                {exp.file_url && (
                  <a
                    href={exp.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm font-medium text-foreground-secondary transition hover:bg-surface-tertiary"
                  >
                    Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-center text-sm text-foreground-muted">
              No hay exportaciones previas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
