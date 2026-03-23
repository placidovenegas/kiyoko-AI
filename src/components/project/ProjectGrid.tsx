'use client';

import Link from 'next/link';
import { ProjectCard, type Project } from './ProjectCard';
import { Film, Sparkles, Plus } from 'lucide-react';
import { KButton } from '@/components/ui/kiyoko-button';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-border py-20 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
            <Film className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-foreground">
            Crea tu primer proyecto
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Empieza a diseñar tu storyboard con ayuda de IA. Describe tu idea y
            Kiyoko se encargará de generar escenas, personajes y fondos.
          </p>
        </div>

        <Link href="/new">
          <KButton size="lg" icon={<Plus className="h-4 w-4" />}>
            Nuevo Proyecto
          </KButton>
        </Link>
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
