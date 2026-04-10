import { InDevelopment } from '@/components/shared/InDevelopment';

export default function SharedProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compartidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Proyectos compartidos contigo por otros usuarios</p>
      </div>
      <InDevelopment
        title="Colaboracion en desarrollo"
        description="Podras invitar a otros usuarios a tus proyectos, asignar roles y colaborar en tiempo real."
      />
    </div>
  );
}
