'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@heroui/react';
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
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextPath = (() => {
    const raw = searchParams.get('next') ?? '/dashboard';
    return raw.startsWith('/') ? raw : '/dashboard';
  })();

  const systemMessage = (() => {
    const reason = searchParams.get('reason');
    const callbackError = searchParams.get('error');

    if (callbackError === 'auth_callback_failed') {
      return 'No se pudo completar el callback de autenticacion. Intenta iniciar sesion de nuevo.';
    }

    switch (reason) {
      case 'session_missing':
        return 'Tu sesion no esta disponible. Inicia sesion para continuar.';
      case 'session_invalid':
        return 'Tu sesion ya no es valida. Vuelve a iniciar sesion.';
      case 'already_authenticated':
        return 'Ya tienes una sesion activa.';
      case 'admin_required':
        return 'Necesitas permisos de administrador para acceder a esa ruta.';
      default:
        return '';
    }
  })();

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
          router.push(nextPath);
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
        <AuthError message={error || systemMessage} />

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

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
          Iniciar sesion
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-white/40 lg:text-muted-foreground">
        <p>
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-brand-400 hover:text-brand-300 lg:text-primary lg:hover:text-primary/90">
            Regístrate
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-white/40 hover:text-white/60 lg:text-muted-foreground lg:hover:text-foreground">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
