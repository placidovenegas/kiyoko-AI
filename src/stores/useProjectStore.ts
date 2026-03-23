'use client';

import { create } from 'zustand';
import type { Project, Video, Character, Background, StylePreset } from '@/types';

interface ProjectState {
  project: Project | null;
  videos: Video[];
  characters: Character[];
  backgrounds: Background[];
  stylePresets: StylePreset[];
  loading: boolean;
  error: string | null;

  setProject: (project: Project | null) => void;
  setVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;
  updateVideo: (id: string, data: Partial<Video>) => void;
  removeVideo: (id: string) => void;
  setCharacters: (characters: Character[]) => void;
  setBackgrounds: (backgrounds: Background[]) => void;
  setStylePresets: (presets: StylePreset[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  project: null,
  videos: [],
  characters: [],
  backgrounds: [],
  stylePresets: [],
  loading: false,
  error: null,

  setProject: (project) => set({ project }),
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((s) => ({ videos: [...s.videos, video] })),
  updateVideo: (id, data) => set((s) => ({
    videos: s.videos.map((v) => v.id === id ? { ...v, ...data } : v),
  })),
  removeVideo: (id) => set((s) => ({
    videos: s.videos.filter((v) => v.id !== id),
  })),
  setCharacters: (characters) => set({ characters }),
  setBackgrounds: (backgrounds) => set({ backgrounds }),
  setStylePresets: (stylePresets) => set({ stylePresets }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    project: null,
    videos: [],
    characters: [],
    backgrounds: [],
    stylePresets: [],
    loading: false,
    error: null,
  }),
}));
