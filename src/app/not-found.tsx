import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand-500">404</h1>
        <p className="mt-4 text-xl text-foreground-secondary">
          Página no encontrada
        </p>
        <p className="mt-2 text-foreground-muted">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
