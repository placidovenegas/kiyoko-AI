'use client';

import { ProjectCard, type Project } from './ProjectCard';
import { Film, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { useUIStore } from '@/stores/useUIStore';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const openProjectCreatePanel = useUIStore((state) => state.openProjectCreatePanel);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-border py-20 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
            <Film className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-foreground">
            Crea tu primer proyecto
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Define el brief inicial, el cliente y la direccion visual para arrancar tu proyecto con una base clara.
          </p>
        </div>

        <Button size="lg" startContent={<Plus className="h-4 w-4" />} className="rounded-md" onPress={openProjectCreatePanel}>
          Nuevo Proyecto
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
