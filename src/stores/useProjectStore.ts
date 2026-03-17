'use client';

import { create } from 'zustand';
import type { Project, Scene, Character, Background } from '@/types';

interface ProjectState {
  currentProject: Project | null;
  scenes: Scene[];
  characters: Character[];
  backgrounds: Background[];
  loading: boolean;
  error: string | null;

  setCurrentProject: (project: Project | null) => void;
  setScenes: (scenes: Scene[]) => void;
  setCharacters: (characters: Character[]) => void;
  setBackgrounds: (backgrounds: Background[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  currentProject: null,
  scenes: [],
  characters: [],
  backgrounds: [],
  loading: false,
  error: null,

  setCurrentProject: (currentProject) => set({ currentProject }),
  setScenes: (scenes) => set({ scenes }),
  setCharacters: (characters) => set({ characters }),
  setBackgrounds: (backgrounds) => set({ backgrounds }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentProject: null,
      scenes: [],
      characters: [],
      backgrounds: [],
      loading: false,
      error: null,
    }),
}));
