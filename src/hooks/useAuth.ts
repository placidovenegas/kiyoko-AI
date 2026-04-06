'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { logClientError } from '@/lib/observability/logger';
import { queryKeys } from '@/lib/query/keys';
import { clearPersistedQueryCache } from '@/lib/query/persistence';

async function fetchCurrentProfile() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (profile ?? null) as Profile | null;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: fetchCurrentProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    meta: {
      scope: 'auth.currentUser',
    },
  });
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data: user = null, isLoading: loading } = useCurrentUser();

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      logClientError('auth.signIn', error, { email });
      throw error;
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    router.refresh();
    router.push('/dashboard');
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      logClientError('auth.signUp', error, { email });
      throw error;
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    router.refresh();
    router.push('/pending');
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logClientError('auth.signOut', error);
      throw error;
    }

    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
    clearPersistedQueryCache();
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    router.refresh();
    router.push('/login');
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      logClientError('auth.signInWithGoogle', error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      logClientError('auth.resetPassword', error, { email });
      throw error;
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    isAdmin: user?.role === 'admin',
    isApproved: user?.role && ['admin', 'editor', 'viewer'].includes(user.role),
  };
}
