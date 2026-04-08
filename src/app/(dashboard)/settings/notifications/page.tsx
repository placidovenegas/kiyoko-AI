'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  Loader2, Bell, Save, Check,
} from 'lucide-react';
import type { Profile } from '@/types';

interface NotificationPreferences {
  email_new_share: boolean;
  email_publication_ready: boolean;
  email_task_assigned: boolean;
  email_comments: boolean;
  push_enabled: boolean;
  push_generation_complete: boolean;
  push_export_ready: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_new_share: true,
  email_publication_ready: true,
  email_task_assigned: true,
  email_comments: true,
  push_enabled: false,
  push_generation_complete: false,
  push_export_ready: false,
};

const notificationLabels: Record<keyof NotificationPreferences, { label: string; description: string; group: string }> = {
  email_new_share: { label: 'Proyecto compartido', description: 'Cuando alguien comparte un proyecto contigo', group: 'Email' },
  email_publication_ready: { label: 'Publicacion lista', description: 'Cuando una publicacion esta lista para publicar', group: 'Email' },
  email_task_assigned: { label: 'Tarea asignada', description: 'Cuando te asignan una nueva tarea', group: 'Email' },
  email_comments: { label: 'Comentarios', description: 'Cuando hay nuevos comentarios en tus escenas', group: 'Email' },
  push_enabled: { label: 'Notificaciones push', description: 'Habilitar notificaciones push en el navegador', group: 'Push' },
  push_generation_complete: { label: 'Generacion completa', description: 'Cuando termina una generacion de imagen o video', group: 'Push' },
  push_export_ready: { label: 'Exportacion lista', description: 'Cuando una exportacion esta lista para descargar', group: 'Push' },
};

export default function NotificationsPage() {
  const supabase = createClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return <NotificationsSettings key={`${profile.id}:${JSON.stringify(profile.preferences ?? {})}`} profile={profile} />;
}

function NotificationsSettings({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const stored = (profile.preferences ?? {}) as Record<string, unknown>;
  const notifications = (stored.notifications ?? {}) as Partial<NotificationPreferences>;
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...defaultPreferences,
    ...notifications,
  });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingPrefs = (profile.preferences ?? {}) as Record<string, unknown>;
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: JSON.parse(JSON.stringify({ ...existingPrefs, notifications: prefs })),
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function togglePref(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  const groups = ['Email', 'Push'] as const;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Preferencias de notificaciones</h1>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? 'Guardado' : saveMutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-8">
        {groups.map((group) => {
          const items = (Object.entries(notificationLabels) as [keyof NotificationPreferences, (typeof notificationLabels)[keyof NotificationPreferences]][])
            .filter(([, v]) => v.group === group);

          return (
            <div key={group}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {group === 'Email' ? 'Notificaciones por email' : 'Notificaciones push'}
              </h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                {items.map(([key, meta]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between px-5 py-4 transition hover:bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[key]}
                      onClick={() => togglePref(key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                        prefs[key] ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          prefs[key] ? 'translate-x-5.5' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
