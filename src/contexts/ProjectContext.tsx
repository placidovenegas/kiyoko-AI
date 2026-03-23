'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useProjectQuery } from '@/hooks/queries/useProjectQuery';
import type { Project, Video, Character, Background, StylePreset } from '@/types';

interface ProjectContextValue {
  project: Project | null;
  videos: Video[];
  characters: Character[];
  backgrounds: Background[];
  stylePresets: StylePreset[];
  loading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextValue>({
  project: null,
  videos: [],
  characters: [],
  backgrounds: [],
  stylePresets: [],
  loading: true,
  error: null,
});

export function useProject() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const shortId = params.shortId as string;

  const { project, videos, characters, backgrounds, stylePresets, isLoading, error } = useProjectQuery(shortId);

  return (
    <ProjectContext.Provider value={{
      project,
      videos,
      characters,
      backgrounds,
      stylePresets,
      loading: isLoading,
      error,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
