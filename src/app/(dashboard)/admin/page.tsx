const STATS = [
  { label: 'Usuarios totales', value: '—', change: '' },
  { label: 'Proyectos activos', value: '—', change: '' },
  { label: 'Escenas generadas', value: '—', change: '' },
  { label: 'Tokens consumidos', value: '—', change: '' },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Panel de Administración
        </h1>
        <p className="text-sm text-foreground-muted">
          Vista general del sistema
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-surface-secondary p-4"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm font-medium text-foreground-secondary">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="/admin/users"
          className="rounded-xl bg-surface-secondary p-4 transition hover:shadow-[var(--shadow-card-hover)]"
        >
          <h3 className="mb-1 font-semibold text-foreground">
            Gestión de Usuarios
          </h3>
          <p className="text-sm text-foreground-muted">
            Ver, aprobar y gestionar cuentas de usuario
          </p>
        </a>
        <div className="rounded-xl bg-surface-secondary p-4">
          <h3 className="mb-1 font-semibold text-foreground">
            Logs del sistema
          </h3>
          <p className="text-sm text-foreground-muted">
            Actividad reciente y errores
          </p>
        </div>
      </div>
    </div>
  );
}
