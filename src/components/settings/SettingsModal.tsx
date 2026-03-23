'use client';

import { useState, useEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
import { useOrganizations, ORG_TYPE_LABELS } from '@/hooks/useOrganizations';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X, User, Settings, Bell, Shield, Building2, Users,
  Key, CreditCard, Check,
  Loader2, Plus, Trash2, Eye, EyeOff, ExternalLink, Zap,
  LayoutGrid,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Cuenta',
    items: [
      { id: 'perfil', label: 'Perfil', icon: User },
      { id: 'preferencias', label: 'Preferencias', icon: Settings },
      { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
      { id: 'seguridad', label: 'Seguridad', icon: Shield },
    ],
  },
  {
    group: 'Organización',
    items: [
      { id: 'organizaciones', label: 'Mis organizaciones', icon: LayoutGrid },
      { id: 'org-general', label: 'General', icon: Building2 },
      { id: 'org-miembros', label: 'Miembros', icon: Users },
    ],
  },
  {
    group: 'Integraciones',
    items: [
      { id: 'api-keys', label: 'Proveedores de IA', icon: Key },
    ],
  },
  {
    group: 'Facturación',
    items: [
      { id: 'suscripcion', label: 'Suscripción', icon: CreditCard },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-muted-foreground mb-2 tracking-wide">{children}</label>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[20px] font-semibold text-foreground mb-1.5">{children}</h2>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted-foreground mb-8">{children}</p>;
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {children}
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// Preferences group header
function PrefGroup({ title }: { title: string }) {
  return (
    <div className="mb-1 mt-8 first:mt-0">
      <h3 className="text-[14px] font-semibold text-foreground mb-2">{title}</h3>
      <div className="h-px bg-border" />
    </div>
  );
}

// Small select for preferences rows
function SettingsSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-[120px] text-[13px] px-3">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[13px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Perfil
// ─────────────────────────────────────────────────────────────────────────────

function PerfilSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: '' });
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

  const { data: authUser } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? '' });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!authUser) throw new Error('No autenticado');
      const { error } = await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', authUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil guardado');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: () => toast.error('Error al guardar'),
  });

  const initials = (form.full_name || authUser?.email || '?')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <SectionTitle>Perfil</SectionTitle>
      <SectionDescription>Gestiona tu información personal.</SectionDescription>

      {/* Avatar card */}
      <SettingsCard className="mb-6">
        <div className="flex items-center gap-5 p-5">
          <div className="h-16 w-16 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center text-xl font-bold shrink-0">
            {profile?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt="avatar" className="h-16 w-16 rounded-xl object-cover" />
              : initials}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">{form.full_name || authUser?.email}</p>
            <p className="text-[12px] text-muted-foreground">{authUser?.email}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Miembro desde {authUser?.created_at
                ? new Date(authUser.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
                : '–'}
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Form */}
      <SettingsCard className="mb-6">
        <div className="p-5 space-y-5">
          <Input
            variant="bordered"
            label="Nombre completo"
            value={form.full_name}
            onChange={(e) => { setForm({ full_name: e.target.value }); setDirty(true); }}
            placeholder="Tu nombre completo"
          />
          <div>
            <Input
              variant="bordered"
              label="Email"
              value={authUser?.email ?? ''}
              readOnly
              disabled
              placeholder="email"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">El email no se puede cambiar desde aquí.</p>
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button
          variant="solid"
          color="primary"
          size="md"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          isLoading={saveMutation.isPending}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Preferencias
// ─────────────────────────────────────────────────────────────────────────────

function PreferenciasSection() {
  const { theme, setTheme } = useUIStore();
  const [cookieStatus, setCookieStatus] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('kiyoko-cookies') : null;
    if (stored === 'accepted' || stored === 'declined') setCookieStatus(stored);
  }, []);

  const applyTheme = (v: 'light' | 'dark' | 'system') => {
    setTheme(v);
    if (typeof document === 'undefined') return;
    if (v === 'dark') document.documentElement.classList.add('dark');
    else if (v === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  const cookieLabel = cookieStatus === 'accepted' ? 'Aceptadas' : cookieStatus === 'declined' ? 'Rechazadas' : 'No configuradas';

  return (
    <div>
      <SectionTitle>Preferencias</SectionTitle>
      <SectionDescription>Personaliza el aspecto y comportamiento de la app.</SectionDescription>

      {/* Apariencia */}
      <PrefGroup title="Apariencia" />
      <Row label="Tema" description="Elige cómo se ve Kiyoko AI en este dispositivo">
        <SettingsSelect
          value={theme}
          onChange={(v) => applyTheme(v as 'light' | 'dark' | 'system')}
          options={[
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Oscuro' },
            { value: 'system', label: 'Sistema' },
          ]}
        />
      </Row>

      {/* Idioma */}
      <PrefGroup title="Idioma y región" />
      <Row label="Idioma" description="Elige el idioma de la aplicación">
        <SettingsSelect
          value="es"
          onChange={() => toast.info('Inglés disponible próximamente')}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English (próx.)' },
          ]}
        />
      </Row>
      <Row label="Zona horaria" description="Usada para mostrar fechas y horas correctamente">
        <SettingsSelect
          value="Europe/Madrid"
          onChange={() => {}}
          options={[
            { value: 'Europe/Madrid', label: '(GMT+1) Madrid' },
            { value: 'Europe/London', label: '(GMT+0) Londres' },
            { value: 'America/New_York', label: '(GMT-5) Nueva York' },
            { value: 'America/Los_Angeles', label: '(GMT-8) Los Ángeles' },
          ]}
        />
      </Row>

      {/* Privacidad */}
      <PrefGroup title="Privacidad" />
      <Row label="Configuración de cookies" description={`Estado actual: ${cookieLabel}`}>
        <div className="flex items-center gap-2">
          {cookieStatus && (
            <span className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full',
              cookieStatus === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
            )}>
              {cookieLabel}
            </span>
          )}
          <Button
            variant="bordered"
            color="default"
            size="sm"
            onClick={() => {
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
      <Row label="Cookies analíticas" description="Nos ayudan a mejorar la app entendiendo cómo la usas">
        <Switch
          checked={cookieStatus === 'accepted'}
          onCheckedChange={(checked) => {
            const next = checked ? 'accepted' : 'declined';
            localStorage.setItem('kiyoko-cookies', next);
            setCookieStatus(next);
          }}
        />
      </Row>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Notificaciones
// ─────────────────────────────────────────────────────────────────────────────

function NotificacionesSection() {
  const [prefs, setPrefs] = useState({ email_activity: true, email_digest: false, inapp_comments: true, inapp_updates: true });
  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <SectionTitle>Notificaciones</SectionTitle>
      <SectionDescription>Decide cuándo y cómo quieres recibir notificaciones.</SectionDescription>

      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Email</p>
          <SettingsCard>
            <Row label="Actividad del proyecto" description="Comentarios, menciones y cambios importantes">
              <Switch checked={prefs.email_activity} onCheckedChange={() => toggle('email_activity')} />
            </Row>
            <Row label="Resumen semanal" description="Resumen de actividad de tu organización">
              <Switch checked={prefs.email_digest} onCheckedChange={() => toggle('email_digest')} />
            </Row>
          </SettingsCard>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">En la app</p>
          <SettingsCard>
            <Row label="Comentarios y menciones" description="Cuando alguien te menciona o comenta en tu trabajo">
              <Switch checked={prefs.inapp_comments} onCheckedChange={() => toggle('inapp_comments')} />
            </Row>
            <Row label="Actualizaciones del sistema" description="Nuevas funciones y mejoras de Kiyoko AI">
              <Switch checked={prefs.inapp_updates} onCheckedChange={() => toggle('inapp_updates')} />
            </Row>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Seguridad
// ─────────────────────────────────────────────────────────────────────────────

function TwoFactorCard() {
  const supabase = createClient();
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [enrolled, setEnrolled] = useState<{ id: string; friendly_name: string } | null>(null);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find((f) => f.status === 'verified');
      if (totp) { setEnabled(true); setEnrolled({ id: totp.id, friendly_name: totp.friendly_name ?? '' }); }
    });
  }, [supabase]);

  const startSetup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Kiyoko AI' });
    setLoading(false);
    if (error || !data) { toast.error('Error al iniciar 2FA'); return; }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
    setStep('setup');
  };

  const verify = async () => {
    if (code.length !== 6) { toast.error('El código debe tener 6 dígitos'); return; }
    setLoading(true);
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
    if (!challenge) { toast.error('Error al verificar'); setLoading(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setLoading(false);
    if (error) { toast.error('Código incorrecto'); return; }
    toast.success('Autenticación de dos factores activada');
    setEnabled(true); setStep('idle'); setCode('');
  };

  const disable = async () => {
    if (!enrolled) return;
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolled.id });
    setLoading(false);
    if (error) { toast.error('Error al desactivar 2FA'); return; }
    toast.success('2FA desactivado');
    setEnabled(false); setEnrolled(null);
  };

  return (
    <SettingsCard className="mb-6">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-foreground">Autenticación de dos factores</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {enabled ? 'Activa — tu cuenta está protegida con 2FA.' : 'Añade una capa extra de seguridad con una app TOTP.'}
            </p>
          </div>
          {enabled ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">Activo</span>
              <Button variant="bordered" color="danger" size="sm" onClick={disable} isLoading={loading}>
                Desactivar
              </Button>
            </div>
          ) : step === 'idle' ? (
            <Button variant="bordered" color="default" size="sm" onClick={startSetup} isLoading={loading} startContent={!loading ? <Plus size={13} /> : undefined}>
              Activar 2FA
            </Button>
          ) : null}
        </div>
      </div>

      {step === 'setup' && (
        <div className="p-5 space-y-5">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Escanea este código QR con tu app de autenticación (Google Authenticator, Authy…) y luego introduce el código de 6 dígitos.
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR Code 2FA" className="h-36 w-36 rounded-lg border border-border bg-white p-2" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">O introduce el código manualmente:</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <code className="flex-1 text-[12px] font-mono text-foreground tracking-widest">{secret}</code>
              <button onClick={() => { navigator.clipboard.writeText(secret); toast.success('Copiado'); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <Check size={13} />
              </button>
            </div>
          </div>
          <div>
            <FieldLabel>Código de verificación</FieldLabel>
            <div className="flex gap-2">
              <Input
                variant="bordered"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="font-mono tracking-widest text-center text-[16px]"
                maxLength={6}
                autoFocus
              />
              <Button
                variant="solid"
                color="primary"
                size="md"
                onClick={verify}
                disabled={code.length !== 6}
                isLoading={loading}
                className="shrink-0"
              >
                Verificar
              </Button>
            </div>
          </div>
          <Button variant="light" color="default" size="sm" onClick={() => setStep('idle')}>
            Cancelar
          </Button>
        </div>
      )}
    </SettingsCard>
  );
}

function SeguridadSection() {
  return (
    <div>
      <SectionTitle>Seguridad</SectionTitle>
      <SectionDescription>Protege tu cuenta y gestiona el acceso.</SectionDescription>

      <SettingsCard className="mb-6">
        <Row label="Contraseña" description="Recibirás un email para restablecerla">
          <Button
            variant="bordered"
            color="default"
            size="sm"
            onClick={() => toast.info('Se ha enviado un email para restablecer tu contraseña')}
          >
            Cambiar contraseña
          </Button>
        </Row>
      </SettingsCard>

      <TwoFactorCard />

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <p className="text-[14px] font-semibold text-destructive mb-1.5">Zona de peligro</p>
        <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">Eliminar tu cuenta es irreversible. Se eliminarán todos tus proyectos, vídeos y datos.</p>
        <Button
          variant="bordered"
          color="danger"
          size="sm"
          onClick={() => toast.error('Función no disponible todavía')}
        >
          Eliminar mi cuenta
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Mis Organizaciones
// ─────────────────────────────────────────────────────────────────────────────

const ORG_TYPE_COLORS: Record<string, string> = {
  personal:  'bg-teal-500/20 text-teal-500',
  freelance: 'bg-blue-500/20 text-blue-500',
  team:      'bg-purple-500/20 text-purple-500',
  agency:    'bg-orange-500/20 text-orange-500',
};

function OrgBadge({ name, orgType, size = 'md' }: { name: string; orgType?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const colors = ORG_TYPE_COLORS[orgType ?? 'team'] ?? ORG_TYPE_COLORS.team;
  const sizeClass =
    size === 'lg' ? 'h-10 w-10 text-sm rounded-lg' :
    size === 'sm' ? 'h-6 w-6 text-[10px] rounded-md' :
                    'h-8 w-8 text-xs rounded-lg';
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cn('flex shrink-0 items-center justify-center font-bold', sizeClass, colors)}>
      {initials}
    </span>
  );
}

function OrganizacionesSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { organizations, currentOrgId, switchOrg, loading } = useOrganizations();
  const { openSettingsModal, openWorkspaceModal } = useUIStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const saveMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('organizations').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Nombre actualizado');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => toast.error('Error al guardar'),
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-1.5">
        <SectionTitle>Mis organizaciones</SectionTitle>
        <Button
          variant="solid"
          color="primary"
          size="sm"
          onClick={openWorkspaceModal}
          startContent={<Plus size={13} />}
          className="mt-1 shrink-0"
        >
          Nueva
        </Button>
      </div>
      <SectionDescription>Gestiona todas las organizaciones a las que perteneces.</SectionDescription>

      {organizations.length === 0 ? (
        <SettingsCard>
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground mb-1">No hay organizaciones</p>
            <p className="text-[12px] text-muted-foreground max-w-xs leading-relaxed mb-5">
              Crea tu primera organización para empezar a colaborar.
            </p>
            <Button variant="solid" color="primary" size="md" onClick={openWorkspaceModal} startContent={<Plus size={14} />}>
              Crear organización
            </Button>
          </div>
        </SettingsCard>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => {
            const isActive = org.id === currentOrgId;
            const isEditing = editingId === org.id;
            return (
              <SettingsCard key={org.id}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <OrgBadge name={org.name} orgType={org.org_type} size="lg" />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input
                          variant="bordered"
                          size="sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-foreground truncate">{org.name}</p>
                            {isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                Activa
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-muted-foreground">
                            {ORG_TYPE_LABELS[org.org_type ?? 'team']} · Plan Gratis
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!isActive && (
                      <Button
                        variant="bordered"
                        color="default"
                        size="sm"
                        onClick={() => { switchOrg(org.id); toast.success(`Cambiado a ${org.name}`); }}
                      >
                        Cambiar a esta
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        variant="bordered"
                        color="default"
                        size="sm"
                        onClick={() => openSettingsModal('org-general')}
                      >
                        Gestionar
                      </Button>
                    )}
                    {isEditing ? (
                      <>
                        <Button
                          variant="solid"
                          color="primary"
                          size="sm"
                          isLoading={saveMutation.isPending}
                          onClick={() => saveMutation.mutate({ id: org.id, name: editName })}
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="light"
                          color="default"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="light"
                        color="default"
                        size="sm"
                        onClick={() => { setEditingId(org.id); setEditName(org.name); }}
                      >
                        Renombrar
                      </Button>
                    )}
                  </div>
                </div>
              </SettingsCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Org General
// ─────────────────────────────────────────────────────────────────────────────

function OrgGeneralSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganizations();
  const [name, setName] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (currentOrg) setName(currentOrg.name); }, [currentOrg]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg) return;
      const { error } = await supabase.from('organizations').update({ name }).eq('id', currentOrg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Organización actualizada');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => toast.error('Error al guardar'),
  });

  if (!currentOrg) return <div className="py-8 text-center text-muted-foreground text-[13px]">No hay organización seleccionada.</div>;

  return (
    <div>
      <SectionTitle>General</SectionTitle>
      <SectionDescription>Configura el nombre y tipo de tu organización activa.</SectionDescription>

      <SettingsCard className="mb-6">
        <div className="p-5 space-y-5">
          <Input
            variant="bordered"
            label="Nombre de la organización"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
          />
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div className="h-10 flex items-center px-3.5 rounded-lg border border-border bg-muted/30 text-[13px] text-muted-foreground">
              {ORG_TYPE_LABELS[currentOrg.org_type ?? 'team']}
            </div>
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button
          variant="solid"
          color="primary"
          size="md"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          isLoading={saveMutation.isPending}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Org Miembros
// ─────────────────────────────────────────────────────────────────────────────

function OrgMiembrosSection() {
  const supabase = createClient();
  const { currentOrg } = useOrganizations();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['org-members', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('organization_members')
        .select('*, profile:profiles!user_id(full_name, email, avatar_url)')
        .eq('organization_id', currentOrg.id);
      return data ?? [];
    },
    enabled: !!currentOrg,
  });

  const roleLabel: Record<string, string> = { owner: 'Propietario', admin: 'Admin', member: 'Miembro', viewer: 'Visor' };

  return (
    <div>
      <div className="flex items-start justify-between mb-1.5">
        <SectionTitle>Miembros</SectionTitle>
        <Button
          variant="solid"
          color="primary"
          size="sm"
          onClick={() => toast.info('Próximamente podrás invitar miembros por email')}
          startContent={<Plus size={13} />}
          className="mt-1 shrink-0"
        >
          Invitar
        </Button>
      </div>
      <SectionDescription>Gestiona quién tiene acceso a tu organización.</SectionDescription>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <SettingsCard>
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground mb-1">No hay miembros todavía</p>
            <p className="text-[12px] text-muted-foreground max-w-xs leading-relaxed mb-5">
              Invita a personas a tu organización para colaborar en proyectos y vídeos.
            </p>
            <Button
              variant="solid"
              color="primary"
              size="md"
              onClick={() => toast.info('Próximamente podrás invitar miembros por email')}
              startContent={<Plus size={14} />}
            >
              Invitar primer miembro
            </Button>
          </div>
        </SettingsCard>
      ) : (
        <SettingsCard>
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
            <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Usuario</p>
            <p className="w-28 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rol</p>
          </div>
          {(members as Array<{ user_id: string; role: string; profile: { full_name?: string; email?: string; avatar_url?: string } | null }>).map((m) => {
            const p = m.profile;
            const memberName = p?.full_name || p?.email || 'Usuario';
            const inits = memberName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={m.user_id} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {p?.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatar_url} alt={memberName} className="h-8 w-8 rounded-lg object-cover" />
                      : inits}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{memberName}</p>
                    {p?.email && <p className="text-[11px] text-muted-foreground truncate">{p.email}</p>}
                  </div>
                </div>
                <span className="w-28 text-[12px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full text-center inline-block">
                  {roleLabel[m.role] ?? m.role}
                </span>
              </div>
            );
          })}
        </SettingsCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: API Keys
// ─────────────────────────────────────────────────────────────────────────────

const TEXT_PROVIDERS = [
  { id: 'groq', name: 'Groq', description: 'LLaMA 3.3 70B — Ultrarrapido, gratis ilimitado', isFree: true, signupUrl: 'https://console.groq.com/keys', placeholder: 'gsk_...' },
  { id: 'cerebras', name: 'Cerebras', description: 'LLaMA 3.1 8B — La inferencia más rápida del mundo', isFree: true, signupUrl: 'https://cloud.cerebras.ai', placeholder: 'csk-...' },
  { id: 'mistral', name: 'Mistral', description: 'Mistral Large — 1B tokens gratis/mes', isFree: true, signupUrl: 'https://console.mistral.ai', placeholder: 'Tu API key de Mistral' },
  { id: 'gemini', name: 'Gemini', description: 'Gemini 2.0 Flash — Cuota gratuita limitada', isFree: true, signupUrl: 'https://aistudio.google.com/apikey', placeholder: 'AIza...' },
  { id: 'grok', name: 'Grok (xAI)', description: 'Grok 3 Fast — Creativo (requiere créditos)', isFree: false, signupUrl: 'https://console.x.ai', placeholder: 'xai-...' },
  { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek V3 — Narrativas profundas', isFree: false, signupUrl: 'https://platform.deepseek.com', placeholder: 'sk-...' },
  { id: 'claude', name: 'Claude', description: 'Claude Sonnet 4 — El mejor en personajes vivos', isFree: false, signupUrl: 'https://console.anthropic.com', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o Mini + DALL-E 3', isFree: false, signupUrl: 'https://platform.openai.com', placeholder: 'sk-proj-...' },
];

function ApiKeysSection() {
  const queryClient = useQueryClient();
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: userKeys = [], isLoading } = useQuery<{ id: string; provider: string; api_key_hint: string; is_active: boolean }[]>({
    queryKey: ['api-keys-data'],
    queryFn: async () => {
      const res = await fetch('/api/user/api-keys');
      if (!res.ok) return [];
      const d = await res.json();
      return d.keys ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await fetch('/api/user/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, apiKey }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    },
    onSuccess: () => { toast.success('API key guardada'); setAddingProvider(null); setNewKeyValue(''); queryClient.invalidateQueries({ queryKey: ['api-keys-data'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
    },
    onSuccess: () => { toast.success('API key eliminada'); queryClient.invalidateQueries({ queryKey: ['api-keys-data'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const getUserKey = useCallback((pid: string) => userKeys.find((k) => k.provider === pid), [userKeys]);

  return (
    <div>
      <SectionTitle>Proveedores de IA</SectionTitle>
      <p className="text-[13px] text-muted-foreground mb-6">Añade tus API keys para usar proveedores premium. Los gratuitos ya están activos.</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {TEXT_PROVIDERS.map((provider) => {
            const userKey = getUserKey(provider.id);
            const isAdding = addingProvider === provider.id;
            return (
              <div key={provider.id} className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={cn('size-2 rounded-full shrink-0', userKey?.is_active ? 'bg-emerald-500' : 'bg-border')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{provider.name}</span>
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase', provider.isFree ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
                        {provider.isFree ? 'Gratis' : 'Premium'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{provider.description}</p>
                    {userKey && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{userKey.api_key_hint}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {userKey ? (
                      <Button
                        variant="light"
                        color="danger"
                        size="xs"
                        isIconOnly
                        onClick={() => deleteMutation.mutate(userKey.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    ) : (
                      <Button
                        variant={isAdding ? 'flat' : 'light'}
                        color={isAdding ? 'default' : 'primary'}
                        size="xs"
                        onClick={() => { setAddingProvider(isAdding ? null : provider.id); setNewKeyValue(''); setShowKey(false); }}
                        startContent={<Plus size={11} />}
                      >
                        {isAdding ? 'Cancelar' : 'Añadir'}
                      </Button>
                    )}
                    <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center size-7 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
                {isAdding && (
                  <div className="px-4 pb-3 pt-2 border-t border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          variant="bordered"
                          type={showKey ? 'text' : 'password'}
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                          placeholder={provider.placeholder}
                          className="font-mono pr-8"
                          autoFocus
                          endContent={
                            <button type="button" onClick={() => setShowKey(!showKey)} className="text-muted-foreground hover:text-foreground">
                              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          }
                        />
                      </div>
                      <Button
                        variant="solid"
                        color="primary"
                        size="sm"
                        onClick={() => saveMutation.mutate({ provider: provider.id, apiKey: newKeyValue })}
                        disabled={!newKeyValue.trim()}
                        isLoading={saveMutation.isPending}
                        startContent={!saveMutation.isPending ? <Check size={12} /> : undefined}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-3 flex items-start gap-2">
        <Shield size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">Las API keys se cifran con AES-256 antes de guardarse. Nunca se muestran completas.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Suscripción
// ─────────────────────────────────────────────────────────────────────────────

function SuscripcionSection() {
  return (
    <div>
      <SectionTitle>Suscripción</SectionTitle>
      <SectionDescription>Tu plan actual y opciones de actualización.</SectionDescription>

      <SettingsCard className="mb-5">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[15px] font-semibold text-foreground">Plan Gratuito</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Acceso a funciones básicas de Kiyoko AI</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Activo</span>
          </div>
          <div className="space-y-2">
            {['5 proyectos activos', 'Proveedores de IA gratuitos', 'Exportación básica'].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/15">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[15px] font-semibold text-foreground">Plan Pro <span className="text-[12px] font-normal text-muted-foreground ml-1">— Próximamente</span></p>
        </div>
        <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">Proyectos ilimitados, exportación avanzada, prioridad en IA, colaboración en equipo y más.</p>
        <Button
          variant="solid"
          color="primary"
          size="md"
          onClick={() => toast.info('El plan Pro estará disponible próximamente')}
        >
          Notificarme cuando esté disponible
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  perfil: PerfilSection,
  preferencias: PreferenciasSection,
  notificaciones: NotificacionesSection,
  seguridad: SeguridadSection,
  organizaciones: OrganizacionesSection,
  'org-general': OrgGeneralSection,
  'org-miembros': OrgMiembrosSection,
  'api-keys': ApiKeysSection,
  suscripcion: SuscripcionSection,
};

export function SettingsModal() {
  const { settingsModalOpen, settingsSection, closeSettingsModal, openSettingsModal } = useUIStore();

  const SectionComponent = SECTION_COMPONENTS[settingsSection] ?? PerfilSection;

  return (
    <DialogPrimitive.Root open={settingsModalOpen} onOpenChange={(open) => { if (!open) closeSettingsModal(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-[90vw] max-w-4xl h-[85vh] max-h-[780px]',
            'flex overflow-hidden rounded-xl border border-border bg-background shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          {/* ── Left nav ─────────────────────────────────────────────── */}
          <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
            <div className="px-4 pt-5 pb-3">
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2">Ajustes</p>
            </div>

            <nav className="flex-1 px-2 pb-4 space-y-0.5">
              {NAV.map((group) => (
                <div key={group.group} className="mb-3">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5">{group.group}</p>
                  {group.items.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => openSettingsModal(id)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-[13px] rounded-lg transition-colors',
                        settingsSection === id
                          ? 'bg-accent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          {/* ── Right content ────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-xl mx-auto px-10 py-10">
              <SectionComponent />
            </div>
          </main>

          {/* ── Close button ─────────────────────────────────────────── */}
          <DialogPrimitive.Close className="absolute right-4 top-4 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
