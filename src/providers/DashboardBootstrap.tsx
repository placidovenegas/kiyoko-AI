'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  preferences: Record<string, unknown> | null;
}

interface BootstrapContext {
  user: UserProfile;
}

const Ctx = createContext<BootstrapContext | null>(null);

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardBootstrap');
  return ctx;
}

export function DashboardBootstrap({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const { data: user, isLoading: userLoading } = useCurrentUser();

  if (userLoading) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{t('loadingProfile')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('preparingWorkspace')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t('sessionNotFound')}</p>
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ user: user as UserProfile }}>
      {children}
    </Ctx.Provider>
  );
}
