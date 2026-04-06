'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

/**
 * `/project/[shortId]/settings/ai` es un entrypoint para abrir el modal de settings del proyecto en la seccion de IA.
 * La UI vive en `ProjectSettingsModal` y se renderiza en el layout del proyecto.
 */
export default function AISettingsPage() {
  const openModal = useUIStore((s) => s.openProjectSettingsModal);

  useEffect(() => {
    openModal('ia');
  }, [openModal]);

  return null;
}
