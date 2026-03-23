'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { KButton } from '@/components/ui/kiyoko-button';
import { Loader2, Building2, UserPlus, Users, Mail, Shield } from 'lucide-react';
import type { Organization, OrganizationMember, Profile } from '@/types';

type MemberWithProfile = OrganizationMember & {
  profiles: Pick<Profile, 'full_name' | 'email' | 'avatar_url'> | null;
};

export default function OrganizationPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const supabase = createClient();

  // Fetch organization
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      if (error) throw error;
      return data as Organization;
    },
  });

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: queryKeys.organizations.members(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles:user_id (full_name, email, avatar_url)
        `)
        .eq('organization_id', orgId)
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as unknown as MemberWithProfile[];
    },
  });

  const isLoading = orgLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Organizacion no encontrada</p>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/20 text-amber-400',
    admin: 'bg-blue-500/20 text-blue-400',
    member: 'bg-primary/20 text-primary',
    viewer: 'bg-muted-foreground/20 text-muted-foreground',
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{org.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {org.org_type}
              </span>
              <span className="text-xs text-muted-foreground">/{org.slug}</span>
            </div>
          </div>
        </div>
        <KButton
          variant="primary"
          size="md"
          icon={<UserPlus className="h-4 w-4" />}
        >
          Invitar miembro
        </KButton>
      </div>

      {/* Info card */}
      {org.billing_email && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Email de facturacion:</span>
          <span className="text-sm text-foreground">{org.billing_email}</span>
        </div>
      )}

      {/* Members */}
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Miembros <span className="font-normal text-muted-foreground">({members.length})</span>
        </h2>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-4 px-5 py-4">
            {member.profiles?.avatar_url ? (
              <img
                src={member.profiles.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground">
                {(member.profiles?.full_name ?? member.profiles?.email ?? '?').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {member.profiles?.full_name ?? 'Sin nombre'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {member.profiles?.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[member.role] ?? roleColors.member}`}>
                <Shield className="h-3 w-3" />
                {member.role}
              </span>
              {member.accepted_at ? (
                <span className="text-xs text-green-400">Aceptado</span>
              ) : (
                <span className="text-xs text-amber-400">Pendiente</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
