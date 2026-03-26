'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

/**
 * `/settings/api-keys` es un entrypoint para abrir el modal en la sección correcta.
 * La UI vive en `SettingsModal` y se renderiza en `src/app/(dashboard)/layout.tsx`.
 */
export default function ApiKeysPage() {
  const { openSettingsModal } = useUIStore();

  useEffect(() => {
    openSettingsModal('api-keys');
  }, [openSettingsModal]);

  return null;
}

