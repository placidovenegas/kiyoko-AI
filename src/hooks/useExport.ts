'use client';

import { useState } from 'react';
import type { ExportFormat } from '@/types';
import { toast } from 'sonner';

export function useExport(projectId: string | undefined) {
  const [exporting, setExporting] = useState(false);

  async function exportProject(format: ExportFormat) {
    if (!projectId) throw new Error('No project loaded');

    setExporting(true);
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-export.${format === 'markdown' ? 'md' : format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exportado como ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  return { exportProject, exporting };
}
