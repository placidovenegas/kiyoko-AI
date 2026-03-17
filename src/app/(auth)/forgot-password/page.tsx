'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Supabase resetPasswordForEmail
      setSent(true);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-dialog">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✉️
        </div>
        <h1 className="text-xl font-semibold text-foreground">Email enviado</h1>
        <p className="mt-3 text-sm text-foreground-secondary">
          Si existe una cuenta con ese email, recibirás instrucciones para
          restablecer tu contraseña.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-8 shadow-dialog">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Te enviaremos un email con instrucciones
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground-secondary">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-surface-tertiary bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/login" className="font-medium text-brand-500 hover:text-brand-600">
          Volver al login
        </Link>
      </p>
    </div>
  );
}
