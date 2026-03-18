'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, Plus, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useOrgStore } from '@/stores/useOrgStore';

interface OrgWithCount {
  id: string;
  name: string;
  slug: string;
  type: 'personal' | 'team';
  logo_url: string | null;
  created_at: string;
  project_count: number;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { setCurrentOrgId } = useOrgStore();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .order('type', { ascending: true })
        .order('created_at', { ascending: true });

      if (orgData) {
        const orgsWithCounts: OrgWithCount[] = [];
        for (const org of orgData) {
          const { count } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          orgsWithCounts.push({ ...org, project_count: count ?? 0 } as OrgWithCount);
        }
        setOrgs(orgsWithCounts);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelectOrg(orgId: string) {
    setCurrentOrgId(orgId);
    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Tus Organizaciones</h1>

      {/* Search + Actions */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Buscar organizacion..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-foreground/10 bg-surface-secondary px-3 py-2 pl-9 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand-500"
          />
        </div>
        <Link
          href="/organizations/new"
          className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <Plus size={14} />
          Nueva organizacion
        </Link>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-foreground/8 bg-surface-secondary p-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-foreground/8" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-foreground/8" />
                <div className="h-3 w-20 rounded bg-foreground/6" />
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.map((org) => (
          <button
            key={org.id}
            type="button"
            onClick={() => handleSelectOrg(org.id)}
            className={cn(
              'flex items-center gap-4 rounded-lg border border-foreground/8 bg-surface-secondary p-5 text-left',
              'transition-all duration-150 hover:border-foreground/20 hover:bg-surface',
            )}
          >
            <div className={cn(
              'flex items-center justify-center size-10 rounded-full shrink-0',
              org.type === 'personal' ? 'bg-brand-500/15 text-brand-500' : 'bg-foreground/10 text-foreground/50',
            )}>
              {org.type === 'personal' ? <User size={18} /> : <Building2 size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">{org.name}</p>
              <p className="text-xs text-foreground/40 mt-0.5">
                {org.type === 'personal' ? 'Personal' : 'Equipo'} · {org.project_count} {org.project_count === 1 ? 'proyecto' : 'proyectos'}
              </p>
            </div>
          </button>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-foreground/40 text-sm">
            No se encontraron organizaciones
          </div>
        )}
      </div>
    </div>
  );
}
