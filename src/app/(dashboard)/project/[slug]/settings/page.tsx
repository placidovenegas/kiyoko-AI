'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.slug as string;
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    client: '',
    style: '',
    platform: '',
    primaryColor: '#F5930B',
    secondaryColor: '#1D9E75',
  });

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    async function fetchProject() {
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', projectId)
        .single();

      if (proj) {
        setCoverImageUrl(proj.cover_image_url ?? null);
        setForm({
          title: proj.title ?? '',
          description: proj.description ?? '',
          client: proj.client ?? '',
          style: proj.style ?? '',
          platform: proj.platform ?? '',
          primaryColor: proj.primary_color ?? '#F5930B',
          secondaryColor: proj.secondary_color ?? '#1D9E75',
        });
      }
    }

    fetchProject();
  }, [projectId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleCoverUpload(file: File) {
    if (!projectId) return;
    setUploadingCover(true);

    try {
      const supabase = createClient();
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

      setCoverImageUrl(publicUrl);
      toast.success('Imagen subida');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir imagen');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleCoverDelete() {
    if (!projectId || !coverImageUrl) return;

    try {
      const supabase = createClient();

      // Try to remove from storage (best effort - path may vary)
      const possibleExts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
      const paths = possibleExts.map((ext) => `${projectId}/cover.${ext}`);
      await supabase.storage.from('project-assets').remove(paths);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ cover_image_url: null })
        .eq('slug', projectId);

      if (updateError) throw updateError;

      setCoverImageUrl(null);
      toast.success('Imagen eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar imagen');
    }
  }

  return (

    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Configuracion del Proyecto
        </h2>
        <p className="text-sm text-foreground-muted">
          Ajusta los datos generales del proyecto
        </p>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground-secondary">
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
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-brand-500 group-hover:opacity-100"
              >
                <IconUpload size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-tertiary transition hover:border-brand-500/50 hover:bg-brand-500/5"
            >
              {uploadingCover ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              ) : (
                <>
                  <IconPhoto size={32} className="text-foreground-muted" />
                  <span className="text-sm text-foreground-muted">
                    Subir imagen de portada
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 rounded-xl bg-surface-secondary p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Titulo del proyecto
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Mi storyboard..."
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Descripcion
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Breve descripcion del proyecto..."
            rows={3}
            className="w-full resize-none rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Cliente
          </label>
          <input
            type="text"
            value={form.client}
            onChange={(e) => handleChange('client', e.target.value)}
            placeholder="Nombre del cliente..."
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Estilo visual
          </label>
          <select
            value={form.style}
            onChange={(e) => handleChange('style', e.target.value)}
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none"
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
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Plataforma
          </label>
          <select
            value={form.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none"
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
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              Color primario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-surface-tertiary"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="flex-1 rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              Color secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-surface-tertiary"
              />
              <input
                type="text"
                value={form.secondaryColor}
                onChange={(e) =>
                  handleChange('secondaryColor', e.target.value)
                }
                className="flex-1 rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button className="rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10">
          Eliminar proyecto
        </button>
        <button className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
