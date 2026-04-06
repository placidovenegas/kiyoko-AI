'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/button';
import {
  Loader2, CreditCard, Sparkles, CalendarDays, AlertTriangle,
} from 'lucide-react';
import type { UserPlan } from '@/types';

const planDetails: Record<string, { name: string; color: string; features: string[] }> = {
  free: {
    name: 'Free',
    color: 'text-muted-foreground',
    features: ['1 proyecto', '100 generaciones/mes', 'Exportacion basica'],
  },
  pro: {
    name: 'Pro',
    color: 'text-primary',
    features: ['Proyectos ilimitados', '1,000 generaciones/mes', 'Exportacion HD', 'Colaboradores'],
  },
  enterprise: {
    name: 'Enterprise',
    color: 'text-amber-400',
    features: ['Todo de Pro', 'Generaciones ilimitadas', 'API access', 'Soporte prioritario'],
  },
};

export default function SubscriptionPage() {
  const supabase = createClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['user-plan'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as UserPlan) ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = plan?.plan ?? 'free';
  const details = planDetails[currentPlan] ?? planDetails.free;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Suscripcion</h1>
      </div>

      {/* Current plan */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Plan actual</p>
            <h2 className={`mt-1 text-2xl font-bold ${details.color}`}>{details.name}</h2>
          </div>
          <Sparkles className={`h-8 w-8 ${details.color}`} />
        </div>

        {/* Features */}
        <ul className="mb-6 space-y-2">
          {details.features.map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {feat}
            </li>
          ))}
        </ul>

        {/* Period */}
        {plan?.current_period_start && plan?.current_period_end && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              Periodo: {new Date(plan.current_period_start).toLocaleDateString('es-ES')} -{' '}
              {new Date(plan.current_period_end).toLocaleDateString('es-ES')}
            </span>
          </div>
        )}

        {/* Cancel warning */}
        {plan?.cancel_at_period_end && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Tu suscripcion se cancelara al final del periodo actual.
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {currentPlan === 'free' && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Actualiza a Pro</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Desbloquea proyectos ilimitados, mas generaciones y funciones de colaboracion.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="rounded-md"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Actualizar plan
          </Button>
        </div>
      )}

      {currentPlan === 'pro' && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Necesitas mas?</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Enterprise incluye generaciones ilimitadas, acceso API y soporte prioritario.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="rounded-md"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Contactar ventas
          </Button>
        </div>
      )}
    </div>
  );
}
