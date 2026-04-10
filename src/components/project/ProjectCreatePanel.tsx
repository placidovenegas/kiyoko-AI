'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import { Loader2, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { generateProjectSlug } from '@/lib/utils/slugify';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';

const STYLES = [
  { value: 'pixar', label: 'Pixar 3D', desc: 'Volumen, personajes expresivos, look cinematografico' },
  { value: 'realistic', label: 'Realista', desc: 'Acabado cinematografico, 35mm, natural' },
  { value: 'anime', label: 'Anime', desc: 'Cel-shading, energia visual alta' },
  { value: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon, contraste fuerte, futurista' },
  { value: 'watercolor', label: 'Acuarela', desc: 'Tono editorial, texturas suaves' },
  { value: 'flat_2d', label: 'Flat 2D', desc: 'Vector, colores planos, claridad' },
  { value: 'custom', label: 'Otro', desc: 'Definir despues en ajustes' },
] as const;

type Style = (typeof STYLES)[number]['value'];

export function ProjectCreatePanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useDashboard();
  const open = useUIStore((s) => s.projectCreatePanelOpen);
  const close = useUIStore((s) => s.closeProjectCreatePanel);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [style, setStyle] = useState<Style>('pixar');
  const [saving, setSaving] = useState(false);

  function reset() { setTitle(''); setDescription(''); setClientName(''); setStyle('pixar'); }
  function handleClose() { reset(); close(); }

  async function handleCreate() {
    if (!title.trim()) { toast.error('Escribe un nombre'); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user: auth } } = await supabase.auth.getUser();
      if (!auth) throw new Error('Inicia sesion');

      const { data, error } = await supabase.from('projects').insert({
        owner_id: auth.id,
        short_id: generateShortId(),
        slug: generateProjectSlug(title.trim()),
        title: title.trim(),
        description: description.trim() || null,
        client_name: clientName.trim() || null,
        style: style as never,
        status: 'draft' as never,
      } as never).select('short_id').single();

      if (error || !data) throw error ?? new Error('Error al crear');

      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(user.id) });

      toast.success('Proyecto creado');
      handleClose();
      router.push(`/project/${data.short_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold text-foreground">Nuevo proyecto</p>
          <button type="button" onClick={handleClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <TextField variant="secondary" value={title} onChange={setTitle} isRequired autoFocus>
            <Label>Titulo *</Label>
            <Input placeholder="Nombre del proyecto" />
          </TextField>

          <TextField variant="secondary" value={clientName} onChange={setClientName}>
            <Label>Cliente</Label>
            <Input placeholder="Marca o cliente (opcional)" />
          </TextField>

          <TextField variant="secondary" value={description} onChange={setDescription}>
            <Label>Descripcion</Label>
            <TextArea placeholder="De que trata el proyecto, que se va a crear..." rows={3} />
          </TextField>

          {/* Style selector */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Estilo visual</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLES.map(s => (
                <button key={s.value} type="button" onClick={() => setStyle(s.value)}
                  className={cn('rounded-lg border px-3 py-2 text-left transition-all',
                    style === s.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20')}>
                  <p className={cn('text-xs font-medium', style === s.value ? 'text-primary' : 'text-foreground')}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={handleClose}
            className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleCreate} disabled={!title.trim() || saving}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Crear proyecto
          </button>
        </div>
      </div>
    </div>
  );
}
