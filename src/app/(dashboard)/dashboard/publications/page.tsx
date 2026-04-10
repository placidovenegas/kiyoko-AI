'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { Loader2, CalendarDays, Instagram, Youtube, Twitter, Globe, Hash } from 'lucide-react';
import type { Publication, Project, SocialProfile } from '@/types';

type PublicationWithDetails = Publication & {
  projects: Pick<Project, 'title' | 'short_id'> | null;
  social_profiles: Pick<SocialProfile, 'platform' | 'account_name'> | null;
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Hash,
};

function PlatformIcon({ platform }: { platform: string }) {
  const Icon = platformIcons[platform.toLowerCase()] ?? Globe;
  return <Icon className="h-4 w-4" />;
}

function StatusBadge({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    draft: 'bg-muted-foreground/20 text-muted-foreground',
    scheduled: 'bg-blue-500/20 text-blue-400',
    published: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
  };
  const s = status ?? 'draft';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[s] ?? colors.draft}`}>
      {s}
    </span>
  );
}

export default function ScheduledPublicationsPage() {
  const supabase = createClient();

  const { data: publications = [], isLoading } = useQuery({
    queryKey: queryKeys.publications.allForUser,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch projects owned by user, then their publications
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id);

      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);

      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          projects:project_id (title, short_id),
          social_profiles:social_profile_id (platform, account_name)
        `)
        .in('project_id', projectIds)
        .order('scheduled_at', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data ?? []) as unknown as PublicationWithDetails[];
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
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">{publications.length} publicacion{publications.length !== 1 ? 'es' : ''} en todos los proyectos</p>
      </div>

      {/* Empty state */}
      {publications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Sin publicaciones
          </h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Crea publicaciones desde tus proyectos para verlas aqui en el calendario global.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
            >
              {/* Top: platform + status */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <PlatformIcon platform={pub.social_profiles?.platform ?? 'web'} />
                  <span className="text-xs text-muted-foreground">
                    {pub.social_profiles?.account_name ?? 'Sin perfil'}
                  </span>
                </div>
                <StatusBadge status={pub.status} />
              </div>

              {/* Title */}
              <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
                {pub.title}
              </h3>

              {/* Project name */}
              <p className="mb-3 truncate text-xs text-muted-foreground">
                {pub.projects?.title ?? 'Proyecto'}
              </p>

              {/* Type badge */}
              <div className="mb-3">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {pub.publication_type}
                </span>
              </div>

              {/* Date */}
              <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {pub.scheduled_at
                  ? new Date(pub.scheduled_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sin programar'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
