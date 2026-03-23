import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-2xl font-bold text-foreground">Proyecto no encontrado</h2>
      <p className="text-sm text-muted-foreground">Este proyecto no existe o no tienes acceso.</p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/80"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}
