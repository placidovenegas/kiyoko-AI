'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SceneDetailPage() {
  const params = useParams();
  const projectId = params.slug as string;
  const sceneId = params.sceneId as string;
  const basePath = `/project/${projectId}/scenes`;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={basePath}
          className="text-sm text-foreground-muted transition hover:text-foreground"
        >
          &larr; Volver a Escenas
        </Link>
        <div className="flex gap-2">
          <button className="rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-foreground-secondary transition hover:bg-surface-secondary">
            &larr; Anterior
          </button>
          <span className="flex items-center px-2 text-sm text-foreground-muted">
            Escena {sceneId}
          </span>
          <button className="rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-foreground-secondary transition hover:bg-surface-secondary">
            Siguiente &rarr;
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: Image + Prompt (60%) */}
        <div className="space-y-4 lg:col-span-3">
          {/* Image placeholder */}
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-secondary">
            <div className="text-center">
              <div className="mb-2 text-4xl">🖼</div>
              <p className="text-sm text-foreground-muted">
                Imagen de la escena
              </p>
              <button className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
                Generar imagen
              </button>
            </div>
          </div>

          {/* Prompt editor */}
          <div className="rounded-xl bg-surface-secondary p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Prompt
            </h3>
            <textarea
              className="w-full resize-none rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
              rows={4}
              placeholder="Describe la escena para generar la imagen..."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button className="rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-foreground-secondary transition hover:bg-surface-tertiary">
                Mejorar con IA
              </button>
              <button className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600">
                Generar
              </button>
            </div>
          </div>

          {/* Negative prompt */}
          <div className="rounded-xl bg-surface-secondary p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Prompt Negativo
            </h3>
            <textarea
              className="w-full resize-none rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
              rows={2}
              placeholder="Elementos a evitar en la generación..."
            />
          </div>
        </div>

        {/* Right column: Metadata (40%) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Scene info */}
          <div className="rounded-xl bg-surface-secondary p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Información
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">Tipo</dt>
                <dd className="font-medium text-foreground">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">Fase</dt>
                <dd className="font-medium text-foreground">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">Duración</dt>
                <dd className="font-medium text-foreground">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">Plano</dt>
                <dd className="font-medium text-foreground">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">Movimiento</dt>
                <dd className="font-medium text-foreground">—</dd>
              </div>
            </dl>
          </div>

          {/* Dialogue */}
          <div className="rounded-xl bg-surface-secondary p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Diálogo / Texto
            </h3>
            <textarea
              className="w-full resize-none rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
              rows={3}
              placeholder="Texto o diálogo de la escena..."
            />
          </div>

          {/* Characters */}
          <div className="rounded-xl bg-surface-secondary p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Personajes
            </h3>
            <p className="text-sm text-foreground-muted">
              Sin personajes asignados
            </p>
          </div>

          {/* Background */}
          <div className="rounded-xl bg-surface-secondary p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Fondo
            </h3>
            <p className="text-sm text-foreground-muted">
              Sin fondo asignado
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg border border-red-500/20 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10">
              Eliminar
            </button>
            <button className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
