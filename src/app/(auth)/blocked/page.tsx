'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function BlockedPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="rounded-2xl bg-surface p-8 text-center shadow-dialog">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
        🚫
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        Cuenta bloqueada
      </h1>
      <p className="mt-3 text-sm text-foreground-secondary">
        Tu cuenta ha sido bloqueada por un administrador. Si crees que esto
        es un error, contacta al soporte.
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
