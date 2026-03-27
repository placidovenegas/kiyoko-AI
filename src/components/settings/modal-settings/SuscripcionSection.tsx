'use client';

import { Button } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Check, Zap, BarChart3, Image, Video, Mic, HardDrive } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, Row, SectionLoading } from './shared';

function UsageStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export function SuscripcionSection() {
  const supabase = createClient();

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['user-plan'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: usage } = useQuery({
    queryKey: ['usage-tracking'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const now = new Date();
      const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_start', periodStart)
        .maybeSingle();
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  if (planLoading) return <SectionLoading />;

  const planName = plan?.plan === 'pro' ? 'Pro' : 'Gratuito';
  const isPro = plan?.plan === 'pro';
  const periodEnd = plan?.current_period_end
    ? new Date(plan.current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const formatStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div>
      <SectionTitle>Suscripción</SectionTitle>
      <SectionDescription>Tu plan actual, uso del mes y opciones de actualización.</SectionDescription>

      {/* ── Plan actual ───────────────────────────────── */}
      <SettingsCard className="mb-5">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Plan {planName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPro && periodEnd
                  ? `Renovación: ${periodEnd}${plan?.cancel_at_period_end ? ' (no se renovará)' : ''}`
                  : 'Acceso a funciones básicas de Kiyoko AI'}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Activo
            </span>
          </div>
          <div className="space-y-1.5">
            {(isPro
              ? ['Proyectos ilimitados', 'Todos los proveedores de IA', 'Exportación avanzada', 'Colaboración en equipo']
              : ['5 proyectos activos', 'Proveedores de IA gratuitos', 'Exportación básica']
            ).map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* ── Uso del mes ───────────────────────────────── */}
      <SettingsCard className="mb-5">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Uso este mes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="px-4 py-2 divide-y divide-border">
          <UsageStat icon={BarChart3} label="Mensajes de IA" value={String(usage?.ai_text_messages ?? 0)} />
          <UsageStat icon={Image} label="Imágenes generadas" value={String(usage?.ai_images_generated ?? 0)} />
          <UsageStat icon={Video} label="Vídeos generados" value={String(usage?.ai_videos_generated ?? 0)} />
          <UsageStat icon={Mic} label="Caracteres TTS" value={String(usage?.tts_characters ?? 0)} />
          <UsageStat icon={HardDrive} label="Almacenamiento" value={formatStorage(Number(usage?.storage_bytes ?? 0))} />
        </div>
      </SettingsCard>

      {/* ── Upgrade CTA ───────────────────────────────── */}
      {!isPro && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/15">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Plan Pro <span className="text-xs font-normal text-muted-foreground ml-1">— Próximamente</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Proyectos ilimitados, exportación avanzada, prioridad en IA, colaboración en equipo y más.
          </p>
          <Button variant="primary" size="md" onPress={() => toast.info('El plan Pro estará disponible próximamente')}>
            Notificarme cuando esté disponible
          </Button>
        </div>
      )}
    </div>
  );
}
