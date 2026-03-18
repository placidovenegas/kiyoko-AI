'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FavoriteProject {
  id: string;
  slug: string;
  title: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProject[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('project_favorites')
      .select('project_id, projects:project_id(id, slug, title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const projects = data
        .map((f) => {
          const p = f.projects as unknown as FavoriteProject | null;
          return p ? { id: p.id, slug: p.slug, title: p.title } : null;
        })
        .filter((p): p is FavoriteProject => p !== null);

      setFavorites(projects);
      setFavoriteIds(new Set(projects.map((p) => p.id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (projectId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isFav = favoriteIds.has(projectId);

    if (isFav) {
      await supabase
        .from('project_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
      setFavorites((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      await supabase
        .from('project_favorites')
        .insert({ user_id: user.id, project_id: projectId });

      // Refetch to get full project info
      await fetchFavorites();
    }
  }, [favoriteIds, fetchFavorites]);

  const isFavorite = useCallback((projectId: string) => {
    return favoriteIds.has(projectId);
  }, [favoriteIds]);

  return { favorites, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
}
