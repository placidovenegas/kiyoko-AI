'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PendingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Check if role has been updated — redirect if no longer pending
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role && profile.role !== 'pending') {
        if (profile.role === 'blocked') {
          router.push('/blocked');
        } else {
          router.push('/dashboard');
        }
      }
    }
    checkRole();
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="rounded-2xl bg-surface p-8 text-center shadow-dialog">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">
        ⏳
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        Tu cuenta está pendiente de aprobación
      </h1>
      <p className="mt-3 text-sm text-foreground-secondary">
        Un administrador revisará tu solicitud pronto. Recibirás un email
        cuando tu cuenta sea activada.
      </p>
      <button
        onClick={handleSignOut}
        className="mt-6 rounded-lg border border-surface-tertiary px-6 py-2.5 text-sm font-medium text-foreground-secondary transition hover:bg-surface-secondary"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
