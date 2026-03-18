'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/project';

interface ProjectContextValue {
  project: Project | null;
  loading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextValue>({
  project: null,
  loading: true,
  error: null,
});

export function useProject() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const projectId = params.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    async function fetchProject() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', projectId)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setProject(data as Project);
      }
      setLoading(false);
    }

    fetchProject();
  }, [projectId]);

  return (
    <ProjectContext.Provider value={{ project, loading, error }}>
      {children}
    </ProjectContext.Provider>
  );
}
