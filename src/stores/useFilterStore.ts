'use client';

import { create } from 'zustand';
import type { SceneType, ArcPhase } from '@/types';

interface FilterState {
  sceneTypeFilter: SceneType | 'all';
  arcPhaseFilter: ArcPhase | 'all';
  backgroundFilter: string | 'all';
  characterFilter: string | 'all';
  searchQuery: string;

  setSceneTypeFilter: (filter: SceneType | 'all') => void;
  setArcPhaseFilter: (filter: ArcPhase | 'all') => void;
  setBackgroundFilter: (filter: string | 'all') => void;
  setCharacterFilter: (filter: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()((set) => ({
  sceneTypeFilter: 'all',
  arcPhaseFilter: 'all',
  backgroundFilter: 'all',
  characterFilter: 'all',
  searchQuery: '',

  setSceneTypeFilter: (sceneTypeFilter) => set({ sceneTypeFilter }),
  setArcPhaseFilter: (arcPhaseFilter) => set({ arcPhaseFilter }),
  setBackgroundFilter: (backgroundFilter) => set({ backgroundFilter }),
  setCharacterFilter: (characterFilter) => set({ characterFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () =>
    set({
      sceneTypeFilter: 'all',
      arcPhaseFilter: 'all',
      backgroundFilter: 'all',
      characterFilter: 'all',
      searchQuery: '',
    }),
}));
