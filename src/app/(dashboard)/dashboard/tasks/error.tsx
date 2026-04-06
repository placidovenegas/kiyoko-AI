'use client';

import { Button } from '@heroui/react';

export default function DashboardTasksError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-medium text-foreground">No se pudo cargar Tasks</p>
      <p className="max-w-md text-sm text-muted-foreground">Intenta recargar la vista o revisa el acceso al workspace.</p>
      <Button variant="primary" className="kiyoko-panel-primary-button" onPress={reset}>Reintentar</Button>
    </div>
  );
}