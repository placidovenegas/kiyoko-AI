'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: () => void;
}

const CATEGORIES = [
  { value: 'script', label: 'Guion' },
  { value: 'prompt', label: 'Prompts' },
  { value: 'image_gen', label: 'Imagen' },
  { value: 'video_gen', label: 'Video' },
  { value: 'review', label: 'Revision' },
  { value: 'export', label: 'Exportar' },
  { value: 'meeting', label: 'Reunion' },
  { value: 'other', label: 'Otro' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'medium', label: 'Media', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'high', label: 'Alta', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500/20 text-red-400' },
] as const;

export function TaskCreateModal({ open, onClose, projectId, onCreated }: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) { toast.error('El titulo es obligatorio'); return; }
    setCreating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        due_date: dueDate || null,
        scheduled_date: dueDate || null,
        status: 'pending',
        created_by: 'manual',
        sort_order: Math.floor(Date.now() / 1000) % 100000,
      });
      if (error) throw error;
      toast.success(`Tarea "${title}" creada`);
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('medium');
      setDueDate('');
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la tarea');
    } finally {
      setCreating(false);
    }
  }, [title, description, category, priority, dueDate, projectId, onCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-tertiary bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Nueva Tarea</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-foreground-muted hover:bg-surface-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Generar imagenes para E1-E5..."
              autoFocus
              aria-label="Titulo de la tarea"
              className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Descripcion (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              aria-label="Descripcion de la tarea"
              className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition',
                    category === c.value ? 'bg-brand-500 text-white' : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-secondary',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Prioridad</label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-medium transition',
                    priority === p.value ? p.color + ' ring-1 ring-current' : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-secondary',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Fecha limite (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Fecha limite"
              className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? 'Creando...' : 'Crear tarea'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-surface-tertiary px-4 py-2.5 text-sm text-foreground-muted transition hover:bg-surface-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
