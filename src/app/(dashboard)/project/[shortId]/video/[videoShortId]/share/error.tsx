'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-danger-500/10 mb-3">
        <svg className="size-6 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
      </div>
      <h3 className="text-sm font-medium text-foreground">Algo salio mal</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        Reintentar
      </button>
    </div>
  );
}
