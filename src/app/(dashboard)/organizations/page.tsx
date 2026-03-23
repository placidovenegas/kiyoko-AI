'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/useOrgStore';
import { useOrganizations, ORG_TYPE_LABELS } from '@/hooks/useOrganizations';
import { useUIStore } from '@/stores/useUIStore';
import { Building2, Briefcase, Laptop, GraduationCap, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Organization } from '@/types';

const ORG_TYPE_ICONS: Record<string, React.ReactNode> = {
  personal: <Briefcase className="h-5 w-5" />,
  freelance: <Laptop className="h-5 w-5" />,
  team: <Building2 className="h-5 w-5" />,
  agency: <Building2 className="h-5 w-5" />,
  school: <GraduationCap className="h-5 w-5" />,
};

const ORG_TYPE_COLORS: Record<string, string> = {
  personal: 'bg-teal-500/15 text-teal-400',
  freelance: 'bg-blue-500/15 text-blue-400',
  team: 'bg-purple-500/15 text-purple-400',
  agency: 'bg-amber-500/15 text-amber-400',
  school: 'bg-rose-500/15 text-rose-400',
};

type OrgWithCount = Organization & { project_count: number };

export default function WorkspacesPage() {
  const router = useRouter();
  const { currentOrgId, setCurrentOrgId } = useOrgStore();
  const { canCreateOrg } = useOrganizations();
  const { openWorkspaceModal } = useUIStore();
  const supabase = createClient();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations', 'with-counts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      const orgIds = (memberships ?? []).map((m) => m.organization_id);
      if (orgIds.length === 0) return [];

      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .order('created_at', { ascending: true });

      if (!orgData) return [];

      const result: OrgWithCount[] = await Promise.all(
        orgData.map(async (org) => {
          const { count } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id);
          return { ...org, project_count: count ?? 0 };
        })
      );

      return result.sort((a, b) => {
        if (a.org_type === 'personal') return -1;
        if (b.org_type === 'personal') return 1;
        return 0;
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  function handleSelect(orgId: string) {
    setCurrentOrgId(orgId);
    router.push('/dashboard');
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Workspaces</h1>
            <p className="text-sm text-muted-foreground">
              Cada workspace es un espacio de trabajo independiente
            </p>
          </div>
          {canCreateOrg && (
            <button
              onClick={openWorkspaceModal}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500"
            >
              <Plus className="h-4 w-4" />
              Nuevo workspace
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => {
              const isActive = org.id === currentOrgId;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelect(org.id)}
                  className={cn(
                    'group w-full rounded-xl border bg-card p-5 text-left transition-all',
                    isActive
                      ? 'border-teal-500/50 ring-1 ring-teal-500/20'
                      : 'border-border hover:border-border/80 hover:bg-[#1A1A1D]',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                      ORG_TYPE_COLORS[org.org_type ?? 'team'],
                    )}>
                      {ORG_TYPE_ICONS[org.org_type ?? 'team']}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{org.name}</p>
                        {isActive && (
                          <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ORG_TYPE_LABELS[org.org_type ?? 'team']} · {org.project_count}{' '}
                        {org.project_count === 1 ? 'proyecto' : 'proyectos'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {isActive ? 'Workspace activo' : 'Cambiar →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!isLoading && !canCreateOrg && (
          <p className="text-center text-xs text-muted-foreground">
            Has alcanzado el límite de 5 workspaces
          </p>
        )}
      </div>
    </div>
  );
}
