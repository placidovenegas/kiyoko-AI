import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-lg text-foreground">Pagina no encontrada</p>
      <p className="text-sm text-muted-foreground">La pagina que buscas no existe o ha sido movida.</p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary/80"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}
