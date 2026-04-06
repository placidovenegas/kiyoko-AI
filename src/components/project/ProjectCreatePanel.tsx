'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Folder, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { useUIStore } from '@/stores/useUIStore';
import type { Database } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { generateProjectSlug } from '@/lib/utils/slugify';

type ProjectStyle = Database['public']['Enums']['project_style'];

const VISUAL_STYLES: readonly { value: ProjectStyle; label: string }[] = [
  { value: 'pixar', label: 'Pixar' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'flat_2d', label: 'Flat 2D' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'custom', label: 'Custom' },
];

const INPUT_CLASSES =
  'mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/10';

const LABEL_CLASSES = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

export function ProjectCreatePanel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const projectCreatePanelOpen = useUIStore((s) => s.projectCreatePanelOpen);
  const closeProjectCreatePanel = useUIStore((s) => s.closeProjectCreatePanel);

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState<ProjectStyle>('pixar');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setClientName('');
    setDescription('');
    setStyle('pixar');
  };

  const handleClose = () => {
    closeProjectCreatePanel();
    resetForm();
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      const shortId = generateShortId();
      const slug = generateProjectSlug(title);

      const { error } = await supabase.from('projects').insert({
        short_id: shortId,
        slug,
        title: title.trim(),
        client_name: clientName.trim() || '',
        description: description.trim() || '',
        style,
        owner_id: user.id,
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto creado');
      closeProjectCreatePanel();
      resetForm();
      router.push(`/project/${shortId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al crear el proyecto'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {projectCreatePanelOpen && (
        <motion.div
          key="project-create-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative flex h-[min(860px,92vh)] w-full max-w-4xl flex-col rounded-[28px] border border-border bg-card mx-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Folder className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                Nuevo proyecto
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Título */}
              <div>
                <label className={LABEL_CLASSES}>Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className={INPUT_CLASSES}
                  autoFocus
                />
              </div>

              {/* Cliente / marca */}
              <div>
                <label className={LABEL_CLASSES}>Cliente / marca</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre del cliente o marca (opcional)"
                  className={INPUT_CLASSES}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className={LABEL_CLASSES}>Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe brevemente el proyecto (opcional)"
                  rows={4}
                  className={INPUT_CLASSES + ' resize-none'}
                />
              </div>

              {/* Estilo visual */}
              <div>
                <label className={LABEL_CLASSES}>Estilo visual *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VISUAL_STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStyle(s.value)}
                      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                        style === s.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || submitting}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creando...' : 'Crear proyecto'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
