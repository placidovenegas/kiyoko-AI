'use client';

import { useState } from 'react';
import { Button, Switch } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, Row, PrefGroup, SettingsSelect, SectionLoading } from './shared';

interface Preferences {
  theme: string;
  language: string;
  default_style: string;
  notifications: boolean;
}

const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  language: 'es',
  default_style: 'pixar',
  notifications: true,
};

function getInitialCookieStatus(): 'accepted' | 'declined' | null {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem('kiyoko-cookies');
  if (stored === 'accepted' || stored === 'declined') return stored;
  return null;
}

export function PreferenciasSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useUIStore();
  const [cookieStatus, setCookieStatus] = useState<'accepted' | 'declined' | null>(getInitialCookieStatus);
  const [localPrefs, setLocalPrefs] = useState<Partial<Preferences>>({});
  const [dirty, setDirty] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const serverPrefs = (profile?.preferences ?? DEFAULT_PREFS) as unknown as Preferences;
  const prefs: Preferences = { ...DEFAULT_PREFS, ...serverPrefs, ...localPrefs };

  const savePreferences = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const merged = { ...serverPrefs, ...localPrefs };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: merged })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preferencias guardadas');
      setDirty(false);
      setLocalPrefs({});
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: () => toast.error('Error al guardar preferencias'),
  });

  const updatePref = (key: keyof Preferences, value: string | boolean) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const applyTheme = (v: string) => {
    setTheme(v as 'light' | 'dark' | 'system');
    updatePref('theme', v);
    if (typeof document === 'undefined') return;
    if (v === 'dark') document.documentElement.classList.add('dark');
    else if (v === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  const cookieLabel = cookieStatus === 'accepted' ? 'Aceptadas' : cookieStatus === 'declined' ? 'Rechazadas' : 'No configuradas';

  if (isLoading) return <SectionLoading />;

  return (
    <div>
      <SectionTitle>Preferencias</SectionTitle>
      <SectionDescription>Personaliza el aspecto y comportamiento de la app.</SectionDescription>

      {/* ── Apariencia ────────────────────────────────── */}
      <PrefGroup title="Apariencia" />
      <SettingsCard className="mb-5">
        <Row label="Tema" description="Elige cómo se ve Kiyoko AI en este dispositivo">
          <SettingsSelect
            value={theme}
            onChange={applyTheme}
            label="Tema"
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
              { value: 'system', label: 'Sistema' },
            ]}
          />
        </Row>
        <Row label="Estilo visual por defecto" description="Estilo predeterminado al crear nuevas escenas">
          <SettingsSelect
            value={prefs.default_style}
            onChange={(v) => updatePref('default_style', v)}
            label="Estilo"
            options={[
              { value: 'pixar', label: 'Pixar 3D' },
              { value: 'anime', label: 'Anime' },
              { value: 'realistic', label: 'Realista' },
              { value: 'watercolor', label: 'Acuarela' },
              { value: 'comic', label: 'Cómic' },
              { value: 'minimal', label: 'Minimalista' },
            ]}
          />
        </Row>
      </SettingsCard>

      {/* ── Idioma y región ───────────────────────────── */}
      <PrefGroup title="Idioma y región" />
      <SettingsCard className="mb-5">
        <Row label="Idioma" description="Idioma de la interfaz">
          <SettingsSelect
            value={prefs.language}
            onChange={(v) => updatePref('language', v)}
            label="Idioma"
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'Français' },
              { value: 'pt', label: 'Português' },
            ]}
          />
        </Row>
      </SettingsCard>

      {/* ── Notificaciones rápidas ────────────────────── */}
      <PrefGroup title="Notificaciones" />
      <SettingsCard className="mb-5">
        <Row label="Notificaciones en la app" description="Recibir notificaciones de actividad y actualizaciones">
          <Switch
            isSelected={prefs.notifications}
            onChange={(val: boolean) => updatePref('notifications', val)}
            size="sm"
            aria-label="Notificaciones"
          />
        </Row>
      </SettingsCard>

      {/* ── Privacidad ────────────────────────────────── */}
      <PrefGroup title="Privacidad" />
      <SettingsCard className="mb-5">
        <Row label="Cookies" description={`Estado actual: ${cookieLabel}`}>
          <div className="flex items-center gap-2">
            {cookieStatus && (
              <span className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                cookieStatus === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
              )}>
                {cookieLabel}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                const next = cookieStatus === 'accepted' ? 'declined' : 'accepted';
                localStorage.setItem('kiyoko-cookies', next);
                setCookieStatus(next);
                toast.success(next === 'accepted' ? 'Cookies aceptadas' : 'Cookies rechazadas');
              }}
            >
              {cookieStatus === 'accepted' ? 'Rechazar' : 'Aceptar'}
            </Button>
          </div>
        </Row>
        <Row label="Cookies analíticas" description="Nos ayudan a mejorar la app">
          <Switch
            isSelected={cookieStatus === 'accepted'}
            onChange={(checked: boolean) => {
              const next = checked ? 'accepted' : 'declined';
              localStorage.setItem('kiyoko-cookies', next);
              setCookieStatus(next as 'accepted' | 'declined');
            }}
            size="sm"
            aria-label="Cookies analíticas"
          />
        </Row>
      </SettingsCard>

      {/* ── Save ──────────────────────────────────────── */}
      {dirty && (
        <div className="flex justify-end sticky bottom-0 py-3 bg-background/80 backdrop-blur-sm">
          <Button
            variant="primary"
            size="md"
            onPress={() => savePreferences.mutate()}
            isDisabled={savePreferences.isPending}
          >
            {savePreferences.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar preferencias
          </Button>
        </div>
      )}
    </div>
  );
}
