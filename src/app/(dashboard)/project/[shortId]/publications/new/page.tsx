'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@heroui/react';
import {
  Loader2, Plus, CalendarDays, Hash, FileText, Layers, Send,
} from 'lucide-react';
import type { SocialProfile } from '@/types';

function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function NewPublicationPage() {
  const params = useParams();
  const shortId = params.shortId as string;
  const router = useRouter();
  const { project } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Form state
  const [profileId, setProfileId] = useState('');
  const [title, setTitle] = useState('');
  const [pubType, setPubType] = useState('post');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Fetch social profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: queryKeys.socialProfiles.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_profiles')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data as SocialProfile[];
    },
    enabled: !!project?.id,
  });

  // Create mutation
  const createPub = useMutation({
    mutationFn: async () => {
      if (!project || !profileId || !title) throw new Error('Campos requeridos');

      const pubShortId = generateShortId();
      const { error } = await supabase
        .from('publications')
        .insert({
          project_id: project.id,
          social_profile_id: profileId,
          title,
          short_id: pubShortId,
          publication_type: pubType,
          caption: caption || null,
          hashtags: hashtags ? hashtags.split(',').map((t) => t.trim()).filter(Boolean) : null,
          scheduled_at: scheduledAt || null,
          status: scheduledAt ? 'scheduled' : 'draft',
        });
      if (error) throw error;
      return pubShortId;
    },
    onSuccess: (pubShortId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publications.byProject(project?.id ?? '') });
      router.push(`/project/${shortId}/publications/${pubShortId}`);
    },
  });

  if (profilesLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canSubmit = !!profileId && !!title.trim();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Plus className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Nueva publicacion</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Profile select */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers className="h-4 w-4 text-primary" />
            Perfil social *
          </label>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay perfiles sociales. Crea uno primero en la seccion de perfiles.
            </p>
          ) : (
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Seleccionar perfil...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.platform} - {p.account_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Titulo *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulo de la publicacion"
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Type */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers className="h-4 w-4 text-primary" />
            Tipo
          </label>
          <div className="flex flex-wrap gap-2">
            {['post', 'reel', 'story', 'carousel', 'video', 'short'].map((t) => (
              <button
                key={t}
                onClick={() => setPubType(t)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  pubType === t
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Texto de la publicacion..."
            rows={4}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Hashtags */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hash className="h-4 w-4 text-primary" />
            Hashtags
          </label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">Separados por comas</p>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            Programar
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">Dejar vacio para guardar como borrador</p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.back()}
            className="rounded-md"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => createPub.mutate()}
            disabled={!canSubmit || createPub.isPending}
            className="rounded-md"
          >
            <Send className="h-4 w-4 mr-2" />
            {createPub.isPending ? 'Creando...' : 'Crear publicacion'}
          </Button>
        </div>

        {createPub.isError && (
          <p className="text-sm text-red-400">
            Error: {createPub.error instanceof Error ? createPub.error.message : 'Error desconocido'}
          </p>
        )}
      </div>
    </div>
  );
}
