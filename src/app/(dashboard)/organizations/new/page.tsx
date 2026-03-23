'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Briefcase, Laptop, Building2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useOrganizations } from '@/hooks/useOrganizations';

const WORKSPACE_TYPES = [
  {
    value: 'personal',
    label: 'Personal',
    description: 'Proyectos propios y experimentación',
    icon: Briefcase,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/40',
  },
  {
    value: 'freelance',
    label: 'Freelance',
    description: 'Trabajo para múltiples clientes',
    icon: Laptop,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
  },
  {
    value: 'team',
    label: 'Empresa',
    description: 'Equipo o empresa con proyectos corporativos',
    icon: Building2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/40',
  },
] as const;

type WorkspaceTypeValue = typeof WORKSPACE_TYPES[number]['value'];

export default function NewWorkspacePage() {
  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState<WorkspaceTypeValue>('freelance');
  const router = useRouter();
  const { createOrg, createOrgMutation, canCreateOrg } = useOrganizations();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !canCreateOrg) return;

    try {
      await createOrg(name.trim(), orgType);
      toast.success('Workspace creado');
      router.push('/organizations');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el workspace');
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Link
            href="/organizations"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-[#1A1A1D] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Nuevo workspace</h1>
            <p className="text-sm text-muted-foreground">
              Crea un espacio de trabajo independiente
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Type selector */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-medium text-foreground">Tipo de workspace</p>
            <div className="grid grid-cols-3 gap-3">
              {WORKSPACE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = orgType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setOrgType(type.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all',
                      isSelected
                        ? `${type.border} ${type.bg}`
                        : 'border-border hover:border-border/60 hover:bg-[#1A1A1D]',
                    )}
                  >
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      isSelected ? type.bg : 'bg-secondary',
                    )}>
                      <Icon className={cn('h-5 w-5', isSelected ? type.color : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <p className={cn('text-xs font-semibold', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                        {type.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="rounded-xl border border-border bg-card p-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Nombre del workspace
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                orgType === 'personal' ? 'Mi espacio personal' :
                orgType === 'freelance' ? 'Mi estudio freelance' :
                'Mi empresa'
              }
              required
              autoFocus
              className="h-10 w-full rounded-lg border border-border bg-[#151517] px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Puedes cambiarlo después desde los ajustes
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/organizations"
              className="flex-1 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted-foreground transition hover:bg-[#1A1A1D] hover:text-foreground"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!name.trim() || createOrgMutation.isPending || !canCreateOrg}
              className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createOrgMutation.isPending ? 'Creando...' : 'Crear workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
