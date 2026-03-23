'use client';
import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RollbackButtonProps {
  conversationId: string;
  onRollback: (conversationId: string) => Promise<void>;
}

export function RollbackButton({ conversationId, onRollback }: RollbackButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRollback = async () => {
    if (!confirm('\u00bfDeshacer los cambios de esta acci\u00f3n?')) return;
    setLoading(true);
    try {
      await onRollback(conversationId);
      toast.success('Cambios revertidos');
    } catch {
      toast.error('Error al revertir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRollback}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RotateCcw className="h-3 w-3" />
      )}
      Deshacer
    </button>
  );
}
