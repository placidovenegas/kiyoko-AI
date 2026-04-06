'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

/**
 * `/project/[shortId]/settings` es un entrypoint para abrir el modal de settings del proyecto.
 * La UI vive en `ProjectSettingsModal` y se renderiza en el layout del proyecto.
 */
export default function ProjectSettingsPage() {
  const openModal = useUIStore((s) => s.openProjectSettingsModal);

  useEffect(() => {
    openModal('general');
  }, [openModal]);

  return null;
}
