'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SocialProfile } from '@/types';

export function useSocialProfiles(projectId: string | undefined) {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('social_profiles')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setProfiles((data as SocialProfile[]) ?? []);
    setLoading(false);
  }, [projectId]);

  return { profiles, loading, fetchProfiles };
}
