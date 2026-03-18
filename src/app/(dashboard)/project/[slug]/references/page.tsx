'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Scene {
  id: string;
  scene_number: string;
  title: string;
  required_references: string[];
  reference_tip: string;
  sort_order: number;
}

interface Character {
  id: string;
  name: string;
  initials: string;
}

interface Background {
  id: string;
  code: string;
  name: string;
}

export default function ReferencesPage() {
  const params = useParams();
  const projectId = params.slug as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [scenesRes, charsRes, bgsRes] = await Promise.all([
      supabase
        .from('scenes')
        .select('id, scene_number, title, required_references, reference_tip, sort_order')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('characters')
        .select('id, name, initials')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('backgrounds')
        .select('id, code, name')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
    ]);

    setScenes(scenesRes.data ?? []);
    setCharacters(charsRes.data ?? []);
    setBackgrounds(bgsRes.data ?? []);
    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build reference columns: backgrounds + characters
  const refColumns = [
    ...backgrounds.map((bg) => ({ key: bg.code, label: bg.name, type: 'bg' as const })),
    ...characters.map((ch) => ({ key: ch.name, label: ch.name, type: 'char' as const })),
  ];

  if (loading) {
    return (

      <div className="space-y-6">
        <div>
          <div className="h-6 w-56 animate-pulse rounded bg-surface-secondary" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface-secondary" />
        </div>
        <div className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Que subir en cada escena?
        </h2>
        <p className="text-sm text-foreground-muted">
          Guia de referencias visuales necesarias para cada escena del
          storyboard
        </p>
      </div>

      {/* Reference table */}
      {scenes.length > 0 && refColumns.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-surface-tertiary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-tertiary bg-surface-secondary">
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  Escena
                </th>
                {refColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-center font-semibold text-foreground-muted"
                  >
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs ${
                        col.type === 'bg'
                          ? 'bg-purple-500/10 text-purple-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {col.label}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  Tip
                </th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene) => {
                const refs = scene.required_references ?? [];
                return (
                  <tr
                    key={scene.id}
                    className="border-b border-surface-tertiary last:border-b-0 hover:bg-surface-secondary/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                      {scene.scene_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {scene.title}
                    </td>
                    {refColumns.map((col) => {
                      const isRequired = refs.some(
                        (r) =>
                          r.toLowerCase() === col.key.toLowerCase() ||
                          r.toLowerCase() === col.label.toLowerCase()
                      );
                      return (
                        <td key={col.key} className="px-3 py-3 text-center">
                          {isRequired ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                              ✓
                            </span>
                          ) : (
                            <span className="text-foreground-muted/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="max-w-xs px-4 py-3 text-xs text-foreground-secondary">
                      {scene.reference_tip || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : scenes.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-surface-tertiary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-tertiary bg-surface-secondary">
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  Escena
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  Referencia
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-foreground-muted"
                >
                  No hay escenas. Crea escenas primero para ver que
                  referencias necesitas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-secondary p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No hay personajes ni fondos definidos. Crea personajes y fondos para
            ver la tabla de referencias.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-brand-500/10 bg-brand-500/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-brand-600">
          Instrucciones para subir imagenes a Grok
        </h3>
        <ul className="space-y-1 text-sm text-foreground-secondary">
          <li>
            1. Abre Grok (grok.x.ai) en tu navegador
          </li>
          <li>
            2. Sube las imagenes de referencia de personajes y fondos marcados con ✓
          </li>
          <li>
            3. Pega el prompt de imagen de la escena correspondiente
          </li>
          <li>
            4. Descarga la imagen generada y subela a la escena en Kiyoko
          </li>
          <li>
            5. Las referencias ayudan a la IA a generar imagenes mas consistentes y precisas
          </li>
        </ul>
      </div>
    </div>
  );
}
