'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { Loader2, Share2, FolderOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { ProjectShare, Project, Profile } from '@/types';

type ShareWithDetails = ProjectShare & {
  projects: Pick<Project, 'title' | 'short_id' | 'cover_image_url' | 'status'> | null;
  shared_by_profile: Pick<Profile, 'full_name' | 'email' | 'avatar_url'> | null;
};

export default function SharedProjectsPage() {
  const supabase = createClient();

  const { data: shares = [], isLoading } = useQuery({
    queryKey: queryKeys.projectShares.sharedWithMe,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          projects:project_id (title, short_id, cover_image_url, status),
          shared_by_profile:shared_by (full_name, email, avatar_url)
        `)
        .eq('shared_with_user', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ShareWithDetails[];
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
      <div className="mb-6 flex items-center gap-3">
        <Share2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">
          Proyectos compartidos{' '}
          <span className="font-normal text-muted-foreground">({shares.length})</span>
        </h1>
      </div>

      {/* Empty state */}
      {shares.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <Share2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No tienes proyectos compartidos
          </h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Cuando alguien comparta un proyecto contigo, aparecera aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shares.map((share) => (
            <Link
              key={share.id}
              href={share.projects ? `/project/${share.projects.short_id}` : '#'}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Cover */}
              {share.projects?.cover_image_url ? (
                <div className="mb-3 h-28 overflow-hidden rounded-lg">
                  <img
                    src={share.projects.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-secondary">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
                {share.projects?.title ?? 'Proyecto eliminado'}
              </h3>

              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {share.role}
                </span>
                {share.projects?.status && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {share.projects.status}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Compartido por: {share.shared_by_profile?.full_name ?? share.shared_by_profile?.email ?? 'Desconocido'}
                </span>
              </div>

              {share.created_at && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(share.created_at).toLocaleDateString('es-ES')}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
