import { InDevelopment } from '@/components/shared/InDevelopment';

export default function ScheduledPublicationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">Calendario de publicaciones en redes sociales</p>
      </div>
      <InDevelopment
        title="Publicaciones en desarrollo"
        description="Podras programar publicaciones en Instagram, TikTok, YouTube y otras plataformas directamente desde tus proyectos."
      />
    </div>
  );
}
