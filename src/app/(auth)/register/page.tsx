'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AuthCard,
  AuthHeader,
  AuthError,
  AuthInput,
  GoogleButton,
  AuthDivider,
  PasswordStrength,
} from '@/components/auth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleSignUp() {
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
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (authError) throw authError;
      router.push('/pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Crear cuenta"
        subtitle="Empieza a crear storyboards con IA"
      />

      <GoogleButton
        onClick={handleGoogleSignUp}
        loading={googleLoading}
        label="Registrarse con Google"
      />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <AuthInput
          label="Nombre completo"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Tu nombre"
          autoComplete="name"
        />

        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
          autoComplete="email"
        />

        <div className="space-y-2">
          <AuthInput
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <AuthInput
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          error={
            confirmPassword && password !== confirmPassword
              ? 'Las contraseñas no coinciden'
              : undefined
          }
        />

        <Button
          type="submit"
          size="lg"
          isLoading={loading}
          className="w-full shadow-lg shadow-primary/25 rounded-md"
        >
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/40 lg:text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300 lg:text-primary lg:hover:text-primary/90">
          Iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}
