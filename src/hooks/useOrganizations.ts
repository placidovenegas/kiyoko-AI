'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
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
    if (a.org_type === 'personal') return -1;
    if (b.org_type === 'personal') return 1;
    return 0;
  });
}

export function useOrganizations() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentOrgId = useUIStore((s) => s.currentOrgId);
  const setCurrentOrgId = useUIStore((s) => s.setCurrentOrgId);

  const { data: organizations = [], isLoading: loading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => fetchUserOrgs(supabase),
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select: if stored ID is invalid, pick personal or first org
  const storedIsValid = organizations.some((o) => o.id === currentOrgId);
  const effectiveOrgId = storedIsValid
    ? currentOrgId
    : (organizations.find((o) => o.org_type === 'personal')?.id ?? organizations[0]?.id ?? null);

  useEffect(() => {
    if (effectiveOrgId && effectiveOrgId !== currentOrgId) {
      setCurrentOrgId(effectiveOrgId);
    }
  }, [effectiveOrgId, currentOrgId, setCurrentOrgId]);

  const currentOrg = organizations.find((o) => o.id === effectiveOrgId) ?? null;

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
    currentOrgId: effectiveOrgId,
    personalOrg,
    loading,
    switchOrg,
    createOrg: (name: string, orgType = 'team') => createOrgMutation.mutateAsync({ name, orgType }),
    createOrgMutation,
    canCreateOrg,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  };
}
