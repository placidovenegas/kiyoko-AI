'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchDashboardOverview } from '@/lib/queries/dashboard';

export function useDashboardOverview(userId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dashboard.overview(userId ?? 'anonymous'),
    queryFn: () => fetchDashboardOverview(supabase, { userId: userId! }),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
