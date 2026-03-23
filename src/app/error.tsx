'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">Error</h1>
        <p className="mt-4 text-muted-foreground">
          {error.message || 'Algo salió mal'}
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
