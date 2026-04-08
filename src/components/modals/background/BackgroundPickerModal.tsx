'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import type { Background } from '@/types';

interface BackgroundPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sceneId: string;
  assignedBackgroundIds: string[];
  onAssign: (backgroundId: string) => void;
}

export function BackgroundPickerModal({
  open,
  onOpenChange,
  projectId,
  sceneId,
  assignedBackgroundIds,
  onAssign,
}: BackgroundPickerModalProps) {
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const supabase = createClient();

  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: queryKeys.backgrounds.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backgrounds')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Background[];
    },
    enabled: open && !!projectId,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return backgrounds;
    const q = search.toLowerCase();
    return backgrounds.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description ?? '').toLowerCase().includes(q) ||
        (b.location_type ?? '').toLowerCase().includes(q),
    );
  }, [backgrounds, search]);

  function handleAssign(backgroundId: string) {
    setAssigning(backgroundId);
    onAssign(backgroundId);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Asignar fondo</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar fondo..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* Background list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Sin resultados' : 'No hay fondos en este proyecto'}
              </p>
            </div>
          ) : (
            filtered.map((bg) => {
              const isAssigned = assignedBackgroundIds.includes(bg.id);

              return (
                <div
                  key={bg.id}
                  className={`rounded-xl border border-border bg-background p-4 transition ${
                    isAssigned ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {bg.reference_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={bg.reference_image_url}
                        alt={bg.name}
                        className="h-9 w-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{bg.name}</p>
                        {bg.location_type && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {bg.location_type}
                          </span>
                        )}
                        {bg.time_of_day && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {bg.time_of_day}
                          </span>
                        )}
                        {isAssigned && (
                          <span className="text-[10px] text-primary font-medium ml-auto shrink-0">
                            Ya asignado
                          </span>
                        )}
                      </div>
                      {bg.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {bg.description}
                        </p>
                      )}

                      {!isAssigned && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => handleAssign(bg.id)}
                            disabled={assigning === bg.id}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {assigning === bg.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Asignar como principal'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
