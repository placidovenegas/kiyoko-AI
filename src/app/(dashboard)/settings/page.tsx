'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

/**
 * En esta app, `/settings/*` es solo un “entrypoint” para abrir el modal.
 * La UI real vive en `SettingsModal` (ruta siempre presente en `layout.tsx`).
 */
export default function UserSettingsPage() {
  const { openSettingsModal } = useUIStore();

  useEffect(() => {
    openSettingsModal('perfil');
  }, [openSettingsModal]);

  return null;
}

