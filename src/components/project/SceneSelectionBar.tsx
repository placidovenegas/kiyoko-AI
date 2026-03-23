'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  IconTrash,
  IconReplace,
  IconLoader2,
  IconX,
  IconAlertTriangle,
  IconSparkles,
} from '@tabler/icons-react';
import type { Scene } from '@/types';
import type { Character } from '@/types';
import type { Background } from '@/types';

interface SceneSelectionBarProps {
  selectedIds: string[];
  scenes: Scene[];
  characters: Character[];
  backgrounds: Background[];
  projectId: string;
  projectStyle: string;
  onClearSelection: () => void;
  onScenesUpdated: () => void;
}

export function SceneSelectionBar({
  selectedIds,
  scenes,
  characters,
  backgrounds,
  projectId,
  projectStyle,
  onClearSelection,
  onScenesUpdated,
}: SceneSelectionBarProps) {
  const [action, setAction] = useState<'idle' | 'confirming-delete' | 'replacing' | 'deleting'>('idle');
  const [replaceInstruction, setReplaceInstruction] = useState('');
  const [showReplaceInput, setShowReplaceInput] = useState(false);
  const supabase = createClient();

  const selectedScenes = scenes.filter(s => selectedIds.includes(s.id));
  const selectedTitles = selectedScenes.map(s => `${s.scene_number} "${s.title}"`).join(', ');

  async function handleDelete() {
    setAction('deleting');
    try {
      const { error } = await supabase
        .from('scenes')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      // Reorder remaining scenes
      const remaining = scenes
        .filter(s => !selectedIds.includes(s.id))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].sort_order !== i) {
          await supabase
            .from('scenes')
            .update({ sort_order: i })
            .eq('id', remaining[i].id);
        }
      }

      // Recalc project stats
      await (supabase.rpc as unknown as (fn: string, params: Record<string, string>) => Promise<unknown>)('recalc_project_stats', { p_id: projectId });

      toast.success(`${selectedIds.length} escena(s) eliminada(s)`);
      onClearSelection();
      onScenesUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error eliminando escenas');
    } finally {
      setAction('idle');
    }
  }

  async function handleReplace() {
    if (!replaceInstruction.trim()) {
      toast.error('Describe qué quieres en su lugar');
      return;
    }

    setAction('replacing');
    try {
      // Get context: scenes before and after the selection
      const sortedSelected = selectedScenes.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const firstOrder = sortedSelected[0].sort_order ?? 0;
      const lastOrder = sortedSelected[sortedSelected.length - 1].sort_order ?? 0;

      const prevScene = scenes.find(s => (s.sort_order ?? 0) === firstOrder - 1);
      const nextScene = scenes.find(s => (s.sort_order ?? 0) === lastOrder + 1);

      const context = {
        instruction: replaceInstruction,
        scenesToReplace: sortedSelected.map(s => ({
          number: s.scene_number,
          title: s.title,
          type: s.scene_type,
          description: s.description,
          duration: s.duration_seconds,
        })),
        previousScene: prevScene ? {
          number: prevScene.scene_number,
          title: prevScene.title,
          description: prevScene.description,
          arc_phase: prevScene.arc_phase,
        } : null,
        nextScene: nextScene ? {
          number: nextScene.scene_number,
          title: nextScene.title,
          description: nextScene.description,
          arc_phase: nextScene.arc_phase,
        } : null,
        characters: characters.map(c => ({ name: c.name, role: c.role, snippet: c.prompt_snippet })),
        backgrounds: backgrounds.map(b => ({ code: b.code, name: b.name, snippet: b.prompt_snippet })),
        style: projectStyle,
        totalReplaceDuration: sortedSelected.reduce((sum, s) => sum + Number(s.duration_seconds), 0),
      };

      // Call AI to generate replacement scenes
      const response = await fetch('/api/ai/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          instruction: `Sustituye estas ${sortedSelected.length} escenas: ${selectedTitles}.

El usuario quiere: ${replaceInstruction}

Contexto:
- Escena anterior: ${prevScene ? `${prevScene.scene_number} "${prevScene.title}" (${prevScene.arc_phase})` : 'inicio del vídeo'}
- Escena siguiente: ${nextScene ? `${nextScene.scene_number} "${nextScene.title}" (${nextScene.arc_phase})` : 'fin del vídeo'}
- Duración total a cubrir: ${context.totalReplaceDuration}s
- Personajes disponibles: ${characters.map(c => c.name).join(', ')}
- Fondos disponibles: ${backgrounds.map(b => `${b.code} "${b.name}"`).join(', ')}
- Estilo: ${projectStyle}

Genera escenas de reemplazo que encajen con la narrativa. Responde en JSON con el campo "scenes" que sea un array.`,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error generando escenas');
      }

      const data = await response.json();
      const newScenes = Array.isArray(data.scenes) ? data.scenes : data.scene ? [data.scene] : [];

      if (newScenes.length === 0) {
        throw new Error('La IA no generó escenas de reemplazo');
      }

      // Delete old scenes
      await supabase.from('scenes').delete().in('id', selectedIds);

      // Insert new scenes with correct sort_order
      for (let i = 0; i < newScenes.length; i++) {
        const ns = newScenes[i];
        await supabase.from('scenes').insert({
          project_id: projectId,
          scene_number: ns.scene_number || `S${firstOrder + i + 1}`,
          title: ns.title || 'Nueva escena',
          scene_type: ns.scene_type || 'new',
          category: ns.category || '',
          arc_phase: ns.arc_phase || sortedSelected[0]?.arc_phase || 'build',
          description: ns.description || '',
          duration_seconds: ns.duration_seconds || 5,
          lighting: ns.lighting || '',
          mood: ns.mood || '',
          status: 'draft',
          sort_order: firstOrder + i,
        } as never);
      }

      // Reorder all scenes after the insertion point
      const allScenes = await supabase
        .from('scenes')
        .select('id, sort_order')
        .eq('project_id', projectId)
        .order('sort_order');

      if (allScenes.data) {
        for (let i = 0; i < allScenes.data.length; i++) {
          if (allScenes.data[i].sort_order !== i) {
            await supabase.from('scenes').update({ sort_order: i }).eq('id', allScenes.data[i].id);
          }
        }
      }

      await (supabase.rpc as unknown as (fn: string, params: Record<string, string>) => Promise<unknown>)('recalc_project_stats', { p_id: projectId });

      toast.success(`${selectedIds.length} escena(s) sustituida(s) por ${newScenes.length} nueva(s)`);
      onClearSelection();
      onScenesUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error sustituyendo escenas');
    } finally {
      setAction('idle');
      setShowReplaceInput(false);
      setReplaceInstruction('');
    }
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-dialog">
        {/* Count */}
        <span className="text-sm font-medium text-foreground">
          {selectedIds.length} escena{selectedIds.length > 1 ? 's' : ''} seleccionada{selectedIds.length > 1 ? 's' : ''}
        </span>

        <div className="h-5 w-px bg-secondary" />

        {/* Actions */}
        {action === 'confirming-delete' ? (
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={16} className="text-red-500" />
            <span className="text-sm text-red-500">¿Eliminar {selectedIds.length} escena(s)?</span>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setAction('idle')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card"
            >
              Cancelar
            </button>
          </div>
        ) : showReplaceInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replaceInstruction}
              onChange={(e) => setReplaceInstruction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReplace()}
              placeholder="¿Qué quieres en su lugar? Ej: escenas de José asesorando clientes"
              className="w-80 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              autoFocus
            />
            <button
              onClick={handleReplace}
              disabled={action === 'replacing' || !replaceInstruction.trim()}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {action === 'replacing' ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconSparkles size={14} />
              )}
              {action === 'replacing' ? 'Generando...' : 'Sustituir con IA'}
            </button>
            <button
              onClick={() => { setShowReplaceInput(false); setReplaceInstruction(''); }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-card"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            {action === 'deleting' ? (
              <IconLoader2 size={16} className="animate-spin text-muted-foreground" />
            ) : (
              <>
                <button
                  onClick={() => setShowReplaceInput(true)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                    'bg-primary text-white hover:bg-primary/90'
                  )}
                >
                  <IconReplace size={14} />
                  Sustituir con IA
                </button>
                <button
                  onClick={() => setAction('confirming-delete')}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                >
                  <IconTrash size={14} />
                  Eliminar
                </button>
              </>
            )}
          </>
        )}

        <div className="h-5 w-px bg-secondary" />

        {/* Clear */}
        <button
          onClick={onClearSelection}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
        >
          <IconX size={14} />
        </button>
      </div>
    </div>
  );
}
