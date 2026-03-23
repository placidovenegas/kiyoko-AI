'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { KButton } from '@/components/ui/kiyoko-button';
import { ShieldX, LogOut } from 'lucide-react';
import { AuthCard } from '@/components/auth';

export default function BlockedPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <AuthCard className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <ShieldX className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        Cuenta bloqueada
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Tu cuenta ha sido bloqueada por un administrador. Si crees que esto
        es un error, contacta al soporte.
      </p>
      <KButton
        variant="outline"
        size="lg"
        onClick={handleSignOut}
        icon={<LogOut className="h-4 w-4" />}
        className="mt-6"
      >
        Cerrar sesión
      </KButton>
    </AuthCard>
  );
}
