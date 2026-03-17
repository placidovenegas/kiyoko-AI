'use client';

import Link from 'next/link';
import { ProjectCard, type Project } from './ProjectCard';
import {
  IconMovie,
  IconSparkles,
  IconPlus,
} from '@tabler/icons-react';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-surface-tertiary py-20 text-center">
        {/* Illustration area */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-500/10">
            <IconMovie size={40} className="text-brand-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 shadow-lg">
            <IconSparkles size={16} className="text-white" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-foreground">
            Crea tu primer proyecto
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-foreground-muted">
            Empieza a disenar tu storyboard con ayuda de IA. Describe tu idea y
            Kiyoko se encargara de generar escenas, personajes y fondos.
          </p>
        </div>

        <Link
          href="/new"
          className="mt-2 flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-600 hover:shadow-lg"
        >
          <IconPlus size={18} />
          Nuevo Proyecto
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
