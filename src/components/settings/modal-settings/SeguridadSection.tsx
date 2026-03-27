'use client';

import { useState, useEffect } from 'react';
import { Button, TextField, Input } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Check } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, Row, FieldLabel } from './shared';

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
    <SettingsCard className="mb-5">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Autenticación de dos factores</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled ? 'Activa — tu cuenta está protegida con 2FA.' : 'Añade una capa extra de seguridad con una app TOTP.'}
            </p>
          </div>
          {enabled ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Activo</span>
              <Button variant="danger-soft" size="sm" onPress={disable} isDisabled={loading}>
                {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Desactivar
              </Button>
            </div>
          ) : step === 'idle' ? (
            <Button variant="outline" size="sm" onPress={startSetup} isDisabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus size={13} className="mr-1" />}
              Activar 2FA
            </Button>
          ) : null}
        </div>
      </div>

      {step === 'setup' && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Escanea este código QR con tu app de autenticación (Google Authenticator, Authy…) y luego introduce el código de 6 dígitos.
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR Code 2FA" className="h-36 w-36 rounded-lg border border-border bg-white p-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">O introduce el código manualmente:</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <code className="flex-1 text-xs font-mono text-foreground tracking-widest">{secret}</code>
              <Button variant="ghost" size="sm" isIconOnly onPress={() => { navigator.clipboard.writeText(secret); toast.success('Copiado'); }}>
                <Check size={13} />
              </Button>
            </div>
          </div>
          <div>
            <FieldLabel>Código de verificación</FieldLabel>
            <div className="flex gap-2">
              <TextField
                variant="secondary"
                value={code}
                onChange={(val) => setCode(val.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
              >
                <Input placeholder="000000" className="font-mono tracking-widest text-center text-base" />
              </TextField>
              <Button variant="primary" size="md" onPress={verify} isDisabled={code.length !== 6} className="shrink-0">
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verificar
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onPress={() => setStep('idle')}>Cancelar</Button>
        </div>
      )}
    </SettingsCard>
  );
}

export function SeguridadSection() {
  return (
    <div>
      <SectionTitle>Seguridad</SectionTitle>
      <SectionDescription>Protege tu cuenta y gestiona el acceso.</SectionDescription>

      <SettingsCard className="mb-5">
        <Row label="Contraseña" description="Recibirás un email para restablecerla">
          <Button variant="outline" size="sm" onPress={() => toast.info('Se ha enviado un email para restablecer tu contraseña')}>
            Cambiar contraseña
          </Button>
        </Row>
      </SettingsCard>

      <TwoFactorCard />

      <SettingsCard className="border-destructive/20 bg-destructive/5">
        <div className="p-4">
          <p className="text-sm font-semibold text-destructive mb-1">Zona de peligro</p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Eliminar tu cuenta es irreversible. Se eliminarán todos tus proyectos, vídeos y datos.</p>
          <Button variant="danger-soft" size="sm" onPress={() => toast.error('Función no disponible todavía')}>
            Eliminar mi cuenta
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
