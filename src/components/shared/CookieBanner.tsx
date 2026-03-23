'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';

const COOKIE_KEY = 'kiyoko-cookies';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { openSettingsModal } = useUIStore();

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl',
      'animate-in slide-in-from-bottom-4 fade-in-0 duration-300 z-60',
    )}>
      <div className="mx-4 rounded-xl border border-border bg-popover shadow-xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <Cookie className="h-4 w-4 text-primary" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-snug mb-0.5">Usamos cookies</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Utilizamos cookies para mejorar tu experiencia. Puedes{' '}
            <button
              onClick={() => { openSettingsModal('preferencias'); setVisible(false); }}
              className="text-primary hover:underline font-medium"
            >
              personalizar
            </button>
            {' '}tus preferencias en cualquier momento.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <Button variant="bordered" color="default" size="sm" onClick={decline}>
            Rechazar
          </Button>
          <Button variant="solid" color="primary" size="sm" onClick={accept}>
            Aceptar
          </Button>
        </div>

        {/* Dismiss */}
        <button
          onClick={decline}
          className="shrink-0 flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
