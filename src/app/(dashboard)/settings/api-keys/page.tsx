'use client';

const TEXT_PROVIDERS = [
  { name: 'Gemini', description: 'Google Gemini API', status: 'inactive' },
  { name: 'Claude', description: 'Anthropic Claude API', status: 'inactive' },
  { name: 'OpenAI', description: 'OpenAI GPT API', status: 'inactive' },
  { name: 'Groq', description: 'Groq LPU Inference', status: 'inactive' },
];

const IMAGE_PROVIDERS = [
  {
    name: 'Flux',
    description: 'Black Forest Labs Flux',
    status: 'inactive',
  },
  {
    name: 'DALL-E',
    description: 'OpenAI DALL-E 3',
    status: 'inactive',
  },
  {
    name: 'Stable Diffusion',
    description: 'Stability AI',
    status: 'inactive',
  },
  {
    name: 'Midjourney',
    description: 'Midjourney API',
    status: 'inactive',
  },
];

function ProviderCard({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: string;
}) {
  const isActive = status === 'active';

  return (

    <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
      <div className="flex items-center gap-3">
        <div
          className={`h-3 w-3 rounded-full ${
            isActive ? 'bg-green-500' : 'bg-foreground-muted/30'
          }`}
        />
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-foreground-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            isActive
              ? 'bg-green-500/10 text-green-600'
              : 'bg-surface-tertiary text-foreground-muted'
          }`}
        >
          {isActive ? 'Activa' : 'Inactiva'}
        </span>
        <button className="rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-foreground-secondary transition hover:bg-surface-tertiary">
          {isActive ? 'Editar' : 'Añadir clave'}
        </button>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Claves API
        </h1>
        <p className="text-sm text-foreground-muted">
          Configura tus proveedores de IA para texto e imágenes
        </p>
      </div>

      {/* Text providers */}
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
          Texto
        </h2>
        <p className="mb-3 text-xs text-foreground-muted">
          Proveedores de modelos de lenguaje para análisis y generación de texto
        </p>
        <div className="space-y-2">
          {TEXT_PROVIDERS.map((provider) => (
            <ProviderCard key={provider.name} {...provider} />
          ))}
        </div>
      </div>

      {/* Image providers */}
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
          Imágenes
        </h2>
        <p className="mb-3 text-xs text-foreground-muted">
          Proveedores de generación de imágenes para las escenas del storyboard
        </p>
        <div className="space-y-2">
          {IMAGE_PROVIDERS.map((provider) => (
            <ProviderCard key={provider.name} {...provider} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-brand-500/10 bg-brand-500/5 p-4">
        <p className="text-sm text-foreground-secondary">
          Las claves API se almacenan de forma segura y cifrada. Nunca se
          comparten con terceros ni se muestran completas tras guardarlas.
        </p>
      </div>
    </div>
  );
}
