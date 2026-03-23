'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Globe, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import type { Profile } from '@/types';

const TABS = [
  { label: 'Perfil', href: '/settings' },
  { label: 'API Keys', href: '/settings/api-keys' },
  { label: 'Suscripción', href: '/settings/subscription' },
  { label: 'Notificaciones', href: '/settings/notifications' },
];

export default function UserSettingsPage() {
  const supabase = createClient();
  const pathname = usePathname();
  const [form, setForm] = useState({
    full_name: '',
    avatar_url: '',
    language: 'es',
    timezone: 'Europe/Madrid',
  });
  const [dirty, setDirty] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        avatar_url: profile.avatar_url ?? '',
        language: (profile as Profile & { language?: string }).language ?? 'es',
        timezone: (profile as Profile & { timezone?: string }).timezone ?? 'Europe/Madrid',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autenticado');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          avatar_url: form.avatar_url || null,
        })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil guardado');
      setDirty(false);
    },
    onError: () => toast.error('Error al guardar'),
  });

  const initials = form.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {/* Page title */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">Ajustes</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu cuenta y preferencias</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                  isActive
                    ? 'border-teal-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Avatar section */}
            <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-600/20 text-xl font-bold text-teal-400">
                {form.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatar_url}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{form.full_name || 'Sin nombre'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Miembro desde {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
                    : '–'}
                </p>
              </div>
            </div>

            {/* Profile form */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Información personal</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => { setForm((f) => ({ ...f, full_name: e.target.value })); setDirty(true); }}
                    placeholder="Tu nombre completo"
                    className="h-10 w-full rounded-lg border border-border bg-[#151517] px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      className="h-10 w-full rounded-lg border border-border bg-[#0E0E10] pl-9 pr-3 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">El email no se puede cambiar desde aquí.</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Preferencias</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Idioma</label>
                  <select
                    value={form.language}
                    onChange={(e) => { setForm((f) => ({ ...f, language: e.target.value })); setDirty(true); }}
                    className="h-10 w-full rounded-lg border border-border bg-[#151517] px-3 text-sm text-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Zona horaria</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => { setForm((f) => ({ ...f, timezone: e.target.value })); setDirty(true); }}
                    className="h-10 w-full rounded-lg border border-border bg-[#151517] px-3 text-sm text-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  >
                    <option value="Europe/Madrid">Europe/Madrid</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Seguridad</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Contraseña</p>
                  <p className="text-xs text-muted-foreground">Última actualización: desconocida</p>
                </div>
                <button
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-[#1A1A1D] hover:text-foreground"
                  onClick={() => toast.info('Recibirás un email para restablecer tu contraseña')}
                >
                  Cambiar contraseña
                </button>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!dirty || saveMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
