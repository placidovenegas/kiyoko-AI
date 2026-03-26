'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { value: 'low', label: 'Baja', color: 'bg-muted0/20 text-muted-foreground' },
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
      } as never);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Nueva Tarea</h3>
          <Button type="button" variant="ghost" size="xs" isIconOnly onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Generar imagenes para E1-E5..."
              autoFocus
              aria-label="Titulo de la tarea"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripcion (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              aria-label="Descripcion de la tarea"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition',
                    category === c.value ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-card',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridad</label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-medium transition',
                    priority === p.value ? p.color + ' ring-1 ring-current' : 'bg-secondary text-muted-foreground hover:bg-card',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha limite (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Fecha limite"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? 'Creando...' : 'Crear tarea'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-card"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
