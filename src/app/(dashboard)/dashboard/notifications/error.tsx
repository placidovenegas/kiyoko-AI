'use client';

import { Button } from '@heroui/react';

export default function DashboardInboxError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-medium text-foreground">No se pudo cargar Inbox</p>
      <p className="max-w-md text-sm text-muted-foreground">Intenta recargar la vista o vuelve más tarde.</p>
      <Button variant="primary" className="kiyoko-panel-primary-button" onPress={reset}>Reintentar</Button>
    </div>
  );
}