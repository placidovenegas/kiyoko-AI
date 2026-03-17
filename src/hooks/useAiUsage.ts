'use client';

import { useCallback, useEffect, useState } from 'react';

interface UsageSummary {
  provider: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
}

export function useAiUsage() {
  const [usage, setUsage] = useState<UsageSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const totalCost = usage.reduce((sum, u) => sum + u.total_cost, 0);
  const totalRequests = usage.reduce((sum, u) => sum + u.total_requests, 0);

  return { usage, loading, totalCost, totalRequests, refetch: fetchUsage };
}
