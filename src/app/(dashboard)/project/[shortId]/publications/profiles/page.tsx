'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/button';
import {
  Loader2, Plus, Instagram, Youtube, Twitter, Globe, Users, Hash, Trash2, X,
} from 'lucide-react';
import type { SocialProfile, SocialProfileInsert } from '@/types';

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Hash,
};

const platformOptions = ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin', 'threads', 'other'];

export default function SocialProfilesPage() {
  const { project } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formPlatform, setFormPlatform] = useState('instagram');
  const [formName, setFormName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formBio, setFormBio] = useState('');

  const { data: profiles = [], isLoading } = useQuery({
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

  const createProfile = useMutation({
    mutationFn: async () => {
      if (!project || !formName) throw new Error('Nombre requerido');
      const insert: SocialProfileInsert = {
        project_id: project.id,
        platform: formPlatform,
        account_name: formName,
        account_handle: formHandle || null,
        bio: formBio || null,
      };
      const { error } = await supabase.from('social_profiles').insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.socialProfiles.byProject(project?.id ?? '') });
      setShowForm(false);
      setFormName('');
      setFormHandle('');
      setFormBio('');
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.socialProfiles.byProject(project?.id ?? '') });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Perfiles sociales{' '}
            <span className="font-normal text-muted-foreground">({profiles.length})</span>
          </h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowForm(true)}
          className="rounded-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo perfil
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Nuevo perfil social</h3>
            <Button variant="ghost" size="sm" isIconOnly className="h-6 w-6" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Plataforma</label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {platformOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nombre *</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre de la cuenta"
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Handle</label>
              <input
                value={formHandle}
                onChange={(e) => setFormHandle(e.target.value)}
                placeholder="@handle"
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bio</label>
              <input
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="Bio del perfil"
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => createProfile.mutate()}
              disabled={!formName.trim() || createProfile.isPending}
              className="rounded-md"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              {createProfile.isPending ? 'Creando...' : 'Crear perfil'}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {profiles.length === 0 && !showForm ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">Sin perfiles sociales</h2>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Agrega perfiles de redes sociales para gestionar tus publicaciones.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowForm(true)}
            className="rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear primer perfil
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const Icon = platformIcons[profile.platform.toLowerCase()] ?? Globe;
            return (
              <div
                key={profile.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{profile.account_name}</h3>
                      {profile.account_handle && (
                        <p className="text-xs text-muted-foreground">{profile.account_handle}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProfile.mutate(profile.id)}
                    className="text-muted-foreground transition hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <span className="mb-2 self-start rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                  {profile.platform}
                </span>

                {profile.bio && (
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{profile.bio}</p>
                )}

                {profile.followers_count != null && (
                  <div className="mt-auto text-xs text-muted-foreground">
                    {profile.followers_count.toLocaleString()} seguidores
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
