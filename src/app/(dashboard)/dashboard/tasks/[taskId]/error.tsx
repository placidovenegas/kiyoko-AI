'use client';

import { useEffect } from 'react';
import { Button } from '@heroui/react';

export default function TaskDetailError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[TaskDetailError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-medium text-foreground">No se pudo cargar la tarea</p>
      <p className="max-w-md text-sm text-muted-foreground">Puede que ya no exista o que no tengas acceso al proyecto.</p>
      <pre className="mt-2 max-w-lg overflow-auto rounded-lg border border-border bg-card p-3 text-left text-xs text-danger">{error?.message ?? 'Error desconocido'}</pre>
      <Button variant="primary" className="kiyoko-panel-primary-button" onPress={reset}>Reintentar</Button>
    </div>
  );
}
