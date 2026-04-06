'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';

/**
 * `/settings/subscription` es un entrypoint para abrir el modal en la seccion correcta.
 * La UI vive en `SettingsModal` y se renderiza en `src/app/(dashboard)/layout.tsx`.
 */
export default function SubscriptionPage() {
  const router = useRouter();
  const openModal = useUIStore((s) => s.openSettingsModal);

  useEffect(() => {
    openModal('suscripcion');
    router.replace('/dashboard');
  }, [openModal, router]);

  return null;
}
