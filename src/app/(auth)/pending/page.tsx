'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@heroui/react';
import { Clock, LogOut } from 'lucide-react';
import { AuthCard } from '@/components/auth';

export default function PendingPage() {
  const router = useRouter();
  const supabase = createClient();

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
    const interval = setInterval(checkRole, 10000);
    return () => clearInterval(interval);
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <AuthCard className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
        <Clock className="h-7 w-7 text-amber-500" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        Cuenta pendiente de aprobación
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Un administrador revisará tu solicitud pronto. Recibirás un email
        cuando tu cuenta sea activada.
      </p>
      <div className="mt-2 text-xs text-muted-foreground">
        Comprobando estado automáticamente...
      </div>
      <Button
        variant="outline"
        size="lg"
        onClick={handleSignOut}
        startContent={<LogOut className="h-4 w-4" />}
        className="mt-6 rounded-md"
      >
        Cerrar sesión
      </Button>
    </AuthCard>
  );
}
