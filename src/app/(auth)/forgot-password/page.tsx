'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KButton } from '@/components/ui/kiyoko-button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthCard, AuthError, AuthInput } from '@/components/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Email enviado</h1>
        <p className="mt-3 text-sm text-foreground-secondary">
          Si existe una cuenta con <strong className="text-foreground">{email}</strong>,
          recibirás instrucciones para restablecer tu contraseña.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
          <Mail className="h-7 w-7 text-brand-500" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Te enviaremos un email con instrucciones
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
          autoComplete="email"
        />

        <KButton
          type="submit"
          size="lg"
          loading={loading}
          className="w-full"
        >
          Enviar instrucciones
        </KButton>
      </form>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </p>
    </AuthCard>
  );
}
