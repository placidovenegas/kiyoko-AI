'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Description, Input, Label, ListBox, Select, TextArea, TextField } from '@heroui/react';
import { CheckCircle2, FolderKanban, LayoutTemplate, Loader2, Palette, SwatchBook, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { generateProjectSlug } from '@/lib/utils/slugify';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import type { Key } from 'react';

const STYLE_OPTIONS = [
  { value: 'pixar', label: 'Pixar 3D' },
  { value: 'realistic', label: 'Realista' },
  { value: 'anime', label: 'Anime' },
  { value: 'watercolor', label: 'Acuarela' },
  { value: 'flat_2d', label: 'Flat 2D' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'custom', label: 'Personalizado' },
] as const;

type ProjectStyle = (typeof STYLE_OPTIONS)[number]['value'];

const STYLE_NOTES: Record<ProjectStyle, string> = {
  pixar: 'Volumen, personajes amables y look cinematografico accesible.',
  realistic: 'Acabado sobrio para marcas, casos de uso o demostraciones creibles.',
  anime: 'Energia visual alta, siluetas marcadas y expresividad rapida.',
  watercolor: 'Tono editorial, sensible y con textura artesanal.',
  flat_2d: 'Claridad grafica para explicar ideas, features o procesos.',
  cyberpunk: 'Direccion intensa, futurista y con contraste fuerte.',
  custom: 'Brief abierto para definir una direccion propia desde cero.',
};

const PROJECT_STYLE_OPTIONS = STYLE_OPTIONS.map((option) => ({
  key: option.value,
  label: option.label,
}));

export function ProjectCreatePanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useDashboard();
  const open = useUIStore((state) => state.projectCreatePanelOpen);
  const closePanel = useUIStore((state) => state.closeProjectCreatePanel);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [style, setStyle] = useState<ProjectStyle>('pixar');
  const [saving, setSaving] = useState(false);

  const isValid = title.trim().length > 0;
  const activeStyleLabel = useMemo(
    () => STYLE_OPTIONS.find((option) => option.value === style)?.label ?? 'Personalizado',
    [style],
  );
  const activeStyleNote = useMemo(() => STYLE_NOTES[style], [style]);
  const fieldClassName =
    "[&_input]:bg-background/95 [&_input]:border-border [&_input]:text-foreground [&_input]:shadow-none [&_input]:placeholder:text-muted-foreground [&_input]:hover:border-foreground/15 [&_input]:focus-visible:border-primary/45 [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-primary/20 [&_textarea]:bg-background/95 [&_textarea]:border-border [&_textarea]:text-foreground [&_textarea]:shadow-none [&_textarea]:placeholder:text-muted-foreground [&_textarea]:hover:border-foreground/15 [&_textarea]:focus-visible:border-primary/45 [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20 [&_[data-slot='trigger']]:bg-background/95 [&_[data-slot='trigger']]:border-border [&_[data-slot='trigger']]:text-foreground [&_[data-slot='trigger']]:shadow-none [&_[data-slot='trigger']]:hover:border-foreground/15 [&_[data-slot='trigger']]:focus-within:border-primary/45 [&_[data-slot='trigger']]:focus-within:ring-2 [&_[data-slot='trigger']]:focus-within:ring-primary/20";

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClientName('');
    setStyle('pixar');
  };

  const handleClose = () => {
    resetForm();
    closePanel();
  };

  const handleCreateProject = async () => {
    if (!isValid) {
      toast.error('Escribe un nombre para el proyecto');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error('Debes iniciar sesion para crear un proyecto');
      }

      const shortId = generateShortId();
      const slug = generateProjectSlug(title.trim());

      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: authUser.id,
          short_id: shortId,
          slug,
          title: title.trim(),
          description: description.trim() || null,
          client_name: clientName.trim() || null,
          style: style as never,
          status: 'draft' as never,
        } as never)
        .select('id, short_id')
        .single();

      if (error || !data) {
        throw error ?? new Error('No se pudo crear el proyecto');
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(user.id) });

      toast.success('Proyecto creado correctamente');
      resetForm();
      closePanel();
      router.push(`/project/${data.short_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear proyecto');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex h-[min(860px,92vh)] w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-3">
          <Button isIconOnly variant="ghost" size="sm" onPress={handleClose} aria-label="Cerrar modal" className="text-foreground/70 hover:bg-accent hover:text-foreground">
            <X size={16} />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <FolderKanban className="size-3.5 text-primary" />
              <span className="truncate uppercase tracking-[0.14em]">Nuevo proyecto</span>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <section className="kiyoko-panel-section space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Crear proyecto</h2>
                  <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    Define el proyecto con un brief claro, estilo visual y contexto suficiente para empezar a producir.
                  </p>
                </div>
                <span className="kiyoko-panel-chip shrink-0 text-[10px] uppercase tracking-[0.12em]">
                  Personal
                </span>
              </div>
            </section>

            <section className="kiyoko-panel-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Datos del proyecto</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Rellena lo esencial. El proyecto se crea en borrador para poder desarrollarlo despues.
                  </p>
                </div>
                <span className="kiyoko-panel-chip max-w-60 truncate text-[10px] uppercase tracking-[0.12em]">
                  Workspace: Personal
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <TextField variant="secondary" value={title} onChange={setTitle} isRequired className={fieldClassName}>
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Titulo</Label>
                  <Input placeholder="Nombre del proyecto" autoFocus />
                  <Description className="text-xs leading-5 text-muted-foreground">Debe ser corto y reconocible para el equipo.</Description>
                </TextField>

                <TextField variant="secondary" value={clientName} onChange={setClientName} className={fieldClassName}>
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Cliente</Label>
                  <Input placeholder="Marca o cliente" />
                </TextField>

                <TextField variant="secondary" value={description} onChange={setDescription} className={cn(fieldClassName, "[&_textarea]:min-h-32") }>
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Descripcion</Label>
                  <TextArea placeholder="Objetivo creativo, formato, entregables" rows={4} />
                  <Description className="text-xs leading-5 text-muted-foreground">Incluye objetivo, tono, formato o entregables esperados.</Description>
                </TextField>

                <Select
                  variant="secondary"
                  aria-label="Estilo visual"
                  selectedKey={style}
                  onSelectionChange={(key: Key | null) => {
                    if (key) setStyle(key as ProjectStyle);
                  }}
                  className={cn(fieldClassName, "w-full")}
                >
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground">Estilo visual</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {PROJECT_STYLE_OPTIONS.map((option) => (
                        <ListBox.Item key={option.key} id={option.key}>{option.label}</ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/85 px-3 py-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
                    <p className="mt-1 font-medium text-foreground">Personal</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Estilo</p>
                    <p className="mt-1 font-medium text-foreground">{activeStyleLabel}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/85 p-4">
                  <div className="flex items-center gap-2">
                    <Palette className="size-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Direccion visual</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeStyleNote}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((option) => {
                      const active = option.value === style;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStyle(option.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background/85 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <LayoutTemplate className="size-4 text-primary" />
                      Brief claro
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Resume el objetivo, publico y formato para arrancar con contexto suficiente.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/85 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <SwatchBook className="size-4 text-primary" />
                      Estilo definido
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">El estilo ayuda a orientar recursos, escenas y tono visual desde el inicio.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/85 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle2 className="size-4 text-primary" />
                      Borrador listo
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Se crea en estado draft para que puedas seguir ajustando videos, recursos y tareas.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="border-t border-border bg-card/98 px-5 py-4 backdrop-blur-xl">
          <div className="mb-3 rounded-lg border border-border bg-background/85 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Resumen rapido</p>
            <p className="mt-1 text-sm font-medium text-foreground">{title.trim() || 'Sin titulo aun'}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{activeStyleLabel} · Workspace personal</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="kiyoko-panel-secondary-button flex-1" onPress={handleClose} isDisabled={saving}>Cancelar</Button>
            <Button variant="primary" className="kiyoko-panel-primary-button flex-1" onPress={handleCreateProject} isDisabled={!isValid || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear proyecto
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}