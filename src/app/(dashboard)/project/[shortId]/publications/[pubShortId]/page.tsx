'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@heroui/react';
import {
  Loader2, CalendarDays, Hash, FileText, Image as ImageIcon,
  Save, Instagram, Youtube, Twitter, Globe,
} from 'lucide-react';
import type { Publication, PublicationItem } from '@/types';

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
};

function StatusBadge({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    draft: 'bg-muted-foreground/20 text-muted-foreground',
    scheduled: 'bg-blue-500/20 text-blue-400',
    published: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
  };
  const s = status ?? 'draft';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[s] ?? colors.draft}`}>
      {s}
    </span>
  );
}

export default function PublicationDetailPage() {
  const params = useParams();
  const pubShortId = params.pubShortId as string;
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [editCaption, setEditCaption] = useState<string | null>(null);
  const [editHashtags, setEditHashtags] = useState<string | null>(null);

  // Fetch publication
  const { data: pub, isLoading: pubLoading } = useQuery({
    queryKey: queryKeys.publications.detail(pubShortId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('short_id', pubShortId)
        .single();
      if (error) throw error;
      return data as Publication;
    },
  });

  // Fetch items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: [...queryKeys.publications.detail(pubShortId), 'items'],
    queryFn: async () => {
      if (!pub) return [];
      const { data, error } = await supabase
        .from('publication_items')
        .select('*')
        .eq('publication_id', pub.id)
        .order('sort_order');
      if (error) throw error;
      return data as PublicationItem[];
    },
    enabled: !!pub,
  });

  // Mutation: update caption/hashtags
  const updatePub = useMutation({
    mutationFn: async (updates: { caption?: string; hashtags?: string[] }) => {
      if (!pub) return;
      const { error } = await supabase
        .from('publications')
        .update(updates)
        .eq('id', pub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publications.detail(pubShortId) });
      setEditCaption(null);
      setEditHashtags(null);
    },
  });

  const isLoading = pubLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Publicacion no encontrada</p>
      </div>
    );
  }

  const PlatformIcon = platformIcons[pub.publication_type.toLowerCase()] ?? Globe;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <PlatformIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{pub.title}</h1>
            <StatusBadge status={pub.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5">{pub.publication_type}</span>
            {pub.scheduled_at && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(pub.scheduled_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Caption */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Caption
              </h3>
              {editCaption === null ? (
                <button
                  onClick={() => setEditCaption(pub.caption ?? '')}
                  className="text-xs text-primary hover:underline"
                >
                  Editar
                </button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updatePub.mutate({ caption: editCaption })}
                  className="rounded-md"
                >
                  <Save className="h-3 w-3 mr-1.5" />
                  Guardar
                </Button>
              )}
            </div>
            {editCaption !== null ? (
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
                rows={4}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pub.caption || 'Sin caption'}
              </p>
            )}
          </div>

          {/* Hashtags */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Hash className="h-4 w-4 text-primary" />
                Hashtags
              </h3>
              {editHashtags === null ? (
                <button
                  onClick={() => setEditHashtags((pub.hashtags ?? []).join(', '))}
                  className="text-xs text-primary hover:underline"
                >
                  Editar
                </button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    updatePub.mutate({
                      hashtags: editHashtags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  className="rounded-md"
                >
                  <Save className="h-3 w-3 mr-1.5" />
                  Guardar
                </Button>
              )}
            </div>
            {editHashtags !== null ? (
              <input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(pub.hashtags ?? []).length > 0 ? (
                  (pub.hashtags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Sin hashtags</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {pub.description && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Descripcion</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{pub.description}</p>
            </div>
          )}
        </div>

        {/* Right: items */}
        <div className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ImageIcon className="h-4 w-4 text-primary" />
            Items <span className="font-normal text-muted-foreground">({items.length})</span>
          </h3>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
              <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sin items en esta publicacion</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  {/* Thumbnail */}
                  {item.file_url || item.thumbnail_url ? (
                    <div className="mb-3 overflow-hidden rounded-lg">
                      <img
                        src={item.thumbnail_url ?? item.file_url ?? ''}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-secondary">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {item.item_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{item.version ?? 1}
                    </span>
                  </div>

                  {item.prompt_text && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {item.prompt_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
