'use client';

import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface FavoriteProject {
  id: string;
  slug: string;
  title: string;
}

// Shared global store — all components see the same favorites
interface FavoritesState {
  favorites: FavoriteProject[];
  favoriteIds: Set<string>;
  loaded: boolean;
  setFavorites: (favs: FavoriteProject[]) => void;
  removeFavorite: (id: string) => void;
}

const useFavoritesStore = create<FavoritesState>((set) => ({
  favorites: [],
  favoriteIds: new Set(),
  loaded: false,
  setFavorites: (favs) => set({
    favorites: favs,
    favoriteIds: new Set(favs.map((f) => f.id)),
    loaded: true,
  }),
  removeFavorite: (id) => set((state) => {
    const next = state.favorites.filter((f) => f.id !== id);
    return { favorites: next, favoriteIds: new Set(next.map((f) => f.id)) };
  }),
}));

async function fetchFavoritesFromDB() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('project_favorites')
    .select('project_id, projects:project_id(id, slug, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data
    .map((f) => {
      const p = f.projects as unknown as FavoriteProject | null;
      return p ? { id: p.id, slug: p.slug, title: p.title } : null;
    })
    .filter((p): p is FavoriteProject => p !== null);
}

export function useFavorites() {
  const { favorites, favoriteIds, loaded, setFavorites, removeFavorite } = useFavoritesStore();

  // Load once on first mount
  useEffect(() => {
    if (!loaded) {
      fetchFavoritesFromDB().then(setFavorites);
    }
  }, [loaded, setFavorites]);

  const toggleFavorite = useCallback(async (projectId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isFav = favoriteIds.has(projectId);

    if (isFav) {
      // Optimistic remove
      removeFavorite(projectId);
      await supabase
        .from('project_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);
    } else {
      // Insert then refetch to get full data
      await supabase
        .from('project_favorites')
        .insert({ user_id: user.id, project_id: projectId });
      const fresh = await fetchFavoritesFromDB();
      setFavorites(fresh);
    }
  }, [favoriteIds, removeFavorite, setFavorites]);

  const isFavorite = useCallback((projectId: string) => {
    return favoriteIds.has(projectId);
  }, [favoriteIds]);

  return { favorites, loading: !loaded, toggleFavorite, isFavorite };
}
