'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserApiKey, AiProviderId } from '@/types';
import { toast } from 'sonner';

export function useApiKeys() {
  const [keys, setKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_api_keys')
      .select('*')
      .order('created_at');
    setKeys((data || []) as UserApiKey[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function addKey(provider: AiProviderId, apiKey: string, monthlyBudget?: number) {
    const response = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, monthlyBudget }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to add key');
    }

    toast.success('API key añadida');
    fetchKeys();
  }

  async function removeKey(id: string) {
    const response = await fetch(`/api/user/api-keys/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to remove key');
    setKeys(keys.filter((k) => k.id !== id));
    toast.success('API key eliminada');
  }

  async function testKey(provider: AiProviderId, apiKey: string): Promise<boolean> {
    const response = await fetch('/api/user/api-keys/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });

    return response.ok;
  }

  return { keys, loading, addKey, removeKey, testKey, refetch: fetchKeys };
}
