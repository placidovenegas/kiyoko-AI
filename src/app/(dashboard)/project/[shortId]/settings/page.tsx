'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface ProjectForm {
  title: string;
  description: string;
  client: string;
  style: string;
  platform: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.slug as string;
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProjectForm>({
    title: '',
    description: '',
    client: '',
    style: '',
    platform: '',
    primaryColor: '#F5930B',
    secondaryColor: '#1D9E75',
  });

  const { data: coverImageUrl = null } = useQuery({
    queryKey: ['project-settings', projectId],
    queryFn: async () => {
      const { data: proj, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', projectId)
        .single();

      if (error) throw error;
      if (proj) {
        const p = proj as Record<string, unknown>;
        setForm({
          title: (p.title as string) ?? '',
          description: (p.description as string) ?? '',
          client: (p.client_name as string) ?? '',
          style: (p.style as string) ?? '',
          platform: (p.platform as string) ?? '',
          primaryColor: (p.primary_color as string) ?? '#F5930B',
          secondaryColor: (p.secondary_color as string) ?? '#1D9E75',
        });
        return (p.cover_image_url as string) ?? null;
      }
      return null;
    },
    enabled: !!projectId,
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/cover.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ cover_image_url: publicUrl })
        .eq('slug', projectId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      toast.success('Imagen subida');
      queryClient.invalidateQueries({ queryKey: ['project-settings', projectId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al subir imagen');
    },
  });

  const deleteCoverMutation = useMutation({
    mutationFn: async () => {
      const possibleExts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
      const paths = possibleExts.map((ext) => `${projectId}/cover.${ext}`);
      await supabase.storage.from('project-assets').remove(paths);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ cover_image_url: null })
        .eq('slug', projectId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Imagen eliminada');
      queryClient.invalidateQueries({ queryKey: ['project-settings', projectId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al eliminar imagen');
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function handleCoverUpload(file: File) {
    if (!projectId) return;
    uploadCoverMutation.mutate(file);
  }

  function handleCoverDelete() {
    if (!projectId || !coverImageUrl) return;
    deleteCoverMutation.mutate();
  }

  const uploadingCover = uploadCoverMutation.isPending;

  return (

    <div className="mx-auto max-w-2xl h-full overflow-y-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Configuracion del Proyecto
        </h2>
        <p className="text-sm text-muted-foreground">
          Ajusta los datos generales del proyecto
        </p>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Imagen de portada
        </label>
        <div className="group relative">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
              e.target.value = '';
            }}
          />

          {coverImageUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <img
                src={coverImageUrl}
                alt="Cover"
                className="h-full w-full object-cover"
              />
              {/* Delete button on hover */}
              <button
                onClick={handleCoverDelete}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
              >
                <IconX size={16} />
              </button>
              {/* Re-upload button on hover */}
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-primary group-hover:opacity-100"
              >
                <IconUpload size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border transition hover:border-primary/50 hover:bg-primary/5"
            >
              {uploadingCover ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <IconPhoto size={32} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Subir imagen de portada
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 rounded-xl bg-card p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Titulo del proyecto
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Mi storyboard..."
            className="w-full rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Descripcion
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Breve descripcion del proyecto..."
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Cliente
          </label>
          <input
            type="text"
            value={form.client}
            onChange={(e) => handleChange('client', e.target.value)}
            placeholder="Nombre del cliente..."
            className="w-full rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Estilo visual
          </label>
          <select
            value={form.style}
            onChange={(e) => handleChange('style', e.target.value)}
            className="w-full rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="">Seleccionar estilo...</option>
            <option value="realistic">Realista</option>
            <option value="anime">Anime</option>
            <option value="cartoon">Cartoon</option>
            <option value="3d">3D Render</option>
            <option value="watercolor">Acuarela</option>
            <option value="minimal">Minimalista</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Plataforma
          </label>
          <select
            value={form.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
            className="w-full rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="">Seleccionar plataforma...</option>
            <option value="instagram-reels">Instagram Reels</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube-shorts">YouTube Shorts</option>
            <option value="youtube">YouTube</option>
            <option value="tv">TV / Cine</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Color primario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="flex-1 rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Color secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                value={form.secondaryColor}
                onChange={(e) =>
                  handleChange('secondaryColor', e.target.value)
                }
                className="flex-1 rounded-lg border border-border bg-inputpx-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
          Eliminar proyecto
        </Button>
        <Button variant="primary">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
