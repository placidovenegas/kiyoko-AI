'use client';

import { cn } from '@/lib/utils/cn';
import { KiyokoIcon } from '@/components/ui/logo';
import { useAIStore } from '@/stores/ai-store';

interface KiyokoButtonProps {
  className?: string;
}

/**
 * Floating button to open Kiyoko chat.
 * Only visible inside projects (the parent layout controls this).
 * Opens in the user's preferred mode (persisted in store).
 */
export function KiyokoButton({ className }: KiyokoButtonProps) {
  const { isOpen, openChat } = useAIStore();

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={() => openChat()}
      className={cn(
        'fixed bottom-5 right-5 z-50',
        'flex items-center justify-center size-12 rounded-full',
        'bg-primary hover:bg-primary active:scale-95',
        'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
        'transition-all duration-200',
        'group',
        className,
      )}
      title="Abrir Kiyoko"
    >
      <KiyokoIcon size={22} className="text-white group-hover:scale-110 transition-transform" />
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none" />
    </button>
  );
}
