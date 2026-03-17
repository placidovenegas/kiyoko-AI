'use client';

import { useState } from 'react';

export default function UserSettingsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    language: 'es',
    theme: 'system',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (

    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-sm text-foreground-muted">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-xl bg-surface-secondary p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-2xl font-bold text-brand-500">
          ?
        </div>
        <div>
          <p className="font-medium text-foreground">Avatar</p>
          <p className="text-sm text-foreground-muted">JPG, PNG. Max 2MB.</p>
          <button className="mt-2 rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-foreground-secondary transition hover:bg-surface-tertiary">
            Cambiar avatar
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 rounded-xl bg-surface-secondary p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Nombre completo
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Tu nombre..."
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Idioma
          </label>
          <select
            value={form.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground-secondary">
            Tema
          </label>
          <select
            value={form.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none"
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
