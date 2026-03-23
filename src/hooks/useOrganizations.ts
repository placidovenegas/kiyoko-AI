'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/useOrgStore';
import type { Organization } from '@/types';

const MAX_ORGS = 5;

export const ORG_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal',
  freelance: 'Freelance',
  team: 'Empresa',
  agency: 'Agencia',
  school: 'Educación',
};

async function fetchUserOrgs(supabase: ReturnType<typeof createClient>): Promise<Organization[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id);

  const orgIds = (memberships ?? []).map((m) => m.organization_id);
  if (orgIds.length === 0) return [];

  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .order('created_at', { ascending: true });

  return (orgs ?? []).sort((a, b) => {
    // personal always first
    if (a.org_type === 'personal') return -1;
    if (b.org_type === 'personal') return 1;
    return 0;
  });
}

export function useOrganizations() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { currentOrgId, setCurrentOrgId } = useOrgStore();

  const { data: organizations = [], isLoading: loading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => fetchUserOrgs(supabase),
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select personal org if no org selected (or selected org no longer exists)
  const validCurrentOrgId = organizations.find((o) => o.id === currentOrgId)
    ? currentOrgId
    : null;

  useEffect(() => {
    if (!validCurrentOrgId && organizations.length > 0) {
      const personal = organizations.find((o) => o.org_type === 'personal');
      setCurrentOrgId(personal?.id ?? organizations[0].id);
    }
  }, [validCurrentOrgId, organizations, setCurrentOrgId]);

  const currentOrg = organizations.find((o) => o.id === (validCurrentOrgId ?? currentOrgId)) ?? null;

  const switchOrg = useCallback((orgId: string) => {
    setCurrentOrgId(orgId);
  }, [setCurrentOrgId]);

  const createOrgMutation = useMutation({
    mutationFn: async ({ name, orgType }: { name: string; orgType: string }) => {
      if (organizations.length >= MAX_ORGS) {
        throw new Error(`Máximo ${MAX_ORGS} workspaces permitidos`);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);

      const { data: org, error } = await supabase
        .from('organizations')
        .insert({ name, slug, org_type: orgType as 'personal' | 'freelance' | 'team' | 'agency' })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner' as const,
      });

      return org;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setCurrentOrgId(org.id);
    },
  });

  const personalOrg = organizations.find((o) => o.org_type === 'personal') ?? null;
  const canCreateOrg = organizations.length < MAX_ORGS;

  return {
    organizations,
    currentOrg,
    currentOrgId: validCurrentOrgId ?? currentOrgId,
    personalOrg,
    loading,
    switchOrg,
    createOrg: (name: string, orgType = 'team') => createOrgMutation.mutateAsync({ name, orgType }),
    createOrgMutation,
    canCreateOrg,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  };
}
