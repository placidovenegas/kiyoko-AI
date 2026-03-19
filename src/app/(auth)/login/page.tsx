'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  AuthCard,
  AuthHeader,
  AuthError,
  AuthInput,
  GoogleButton,
  AuthDivider,
} from '@/components/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error con Google');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'pending') {
          router.push('/pending');
        } else if (profile?.role === 'blocked') {
          router.push('/blocked');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Iniciar sesión"
        subtitle="AI Storyboard Production Studio"
      />

      <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />

      <AuthDivider />

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

        <AuthInput
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <KButton
          type="submit"
          size="lg"
          loading={loading}
          className="w-full shadow-lg shadow-brand-500/25"
        >
          Iniciar sesión
        </KButton>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-white/40 lg:text-foreground-muted">
        <p>
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-brand-400 hover:text-brand-300 lg:text-brand-500 lg:hover:text-brand-600">
            Regístrate
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-white/40 hover:text-white/60 lg:text-foreground-muted lg:hover:text-foreground">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
