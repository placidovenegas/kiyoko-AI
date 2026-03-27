'use client';

import { Button } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/useOrganizations';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, SectionLoading } from './shared';

export function OrgMiembrosSection() {
  const supabase = createClient();
  const { currentOrg } = useOrganizations();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['org-members', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('organization_members')
        .select('*, profile:profiles!user_id(full_name, email, avatar_url)')
        .eq('organization_id', currentOrg.id);
      return data ?? [];
    },
    enabled: !!currentOrg,
  });

  const roleLabel: Record<string, string> = { owner: 'Propietario', admin: 'Admin', member: 'Miembro', viewer: 'Visor' };

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <SectionTitle>Miembros</SectionTitle>
          <SectionDescription>Gestiona quién tiene acceso a tu organización.</SectionDescription>
        </div>
        <Button variant="primary" size="sm" onPress={() => toast.info('Próximamente podrás invitar miembros por email')} className="shrink-0">
          <Plus size={13} className="mr-1" />
          Invitar
        </Button>
      </div>

      {isLoading ? (
        <SectionLoading />
      ) : members.length === 0 ? (
        <SettingsCard>
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No hay miembros todavía</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
              Invita a personas a tu organización para colaborar.
            </p>
            <Button variant="primary" size="md" onPress={() => toast.info('Próximamente podrás invitar miembros por email')}>
              <Plus size={14} className="mr-1" />
              Invitar primer miembro
            </Button>
          </div>
        </SettingsCard>
      ) : (
        <SettingsCard>
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30">
            <p className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Usuario</p>
            <p className="w-24 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rol</p>
          </div>
          {(members as Array<{ user_id: string; role: string; profile: { full_name?: string; email?: string; avatar_url?: string } | null }>).map((m) => {
            const p = m.profile;
            const memberName = p?.full_name || p?.email || 'Usuario';
            const inits = memberName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={m.user_id} className="flex items-center gap-4 px-4 py-2.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                    {p?.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatar_url} alt={memberName} className="h-7 w-7 rounded-md object-cover" />
                      : inits}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{memberName}</p>
                    {p?.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                  </div>
                </div>
                <span className="w-24 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-center">
                  {roleLabel[m.role] ?? m.role}
                </span>
              </div>
            );
          })}
        </SettingsCard>
      )}
    </div>
  );
}
