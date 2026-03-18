'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/useOrgStore';
import type { Organization } from '@/types/organization';

const MAX_ORGS = 3;

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrgId, setCurrentOrgId } = useOrgStore();

  const fetchOrgs = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Directly query organizations owned by user (simpler, avoids RLS recursion)
      const { data: ownedOrgs, error: ownedErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('type', { ascending: true })
        .order('created_at', { ascending: true });

      if (ownedErr) {
        console.error('[useOrganizations] Error fetching orgs:', ownedErr.message);
        setLoading(false);
        return;
      }

      // Also get orgs where user is a member (not owner)
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      const memberOrgIds = (memberships ?? [])
        .map((m) => m.organization_id)
        .filter((id) => !ownedOrgs?.some((o) => o.id === id));

      let memberOrgs: Organization[] = [];
      if (memberOrgIds.length > 0) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .in('id', memberOrgIds);
        if (data) memberOrgs = data as Organization[];
      }

      const allOrgs = [...(ownedOrgs as Organization[] ?? []), ...memberOrgs];
      setOrganizations(allOrgs);
    } catch (err) {
      console.error('[useOrganizations] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const currentOrg = organizations.find((o) => o.id === currentOrgId) ?? null;

  const switchOrg = useCallback((orgId: string | null) => {
    setCurrentOrgId(orgId);
  }, [setCurrentOrgId]);

  const createOrg = useCallback(async (name: string): Promise<Organization | null> => {
    if (organizations.length >= MAX_ORGS) {
      throw new Error(`Máximo ${MAX_ORGS} organizaciones permitidas`);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: `${slug}-${Date.now().toString(36)}`,
        type: 'team',
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
      });

    await fetchOrgs();
    return org as Organization;
  }, [organizations.length, fetchOrgs]);

  const canCreateOrg = organizations.length < MAX_ORGS;

  return {
    organizations,
    currentOrg,
    currentOrgId,
    loading,
    switchOrg,
    createOrg,
    canCreateOrg,
    refetch: fetchOrgs,
  };
}
