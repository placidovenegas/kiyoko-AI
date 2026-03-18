'use client';

import { useState } from 'react';
import { X, AlertTriangle, Lightbulb, Send, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

type FeedbackStep = 'choose' | 'write';
type FeedbackType = 'issue' | 'idea';

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const [step, setStep] = useState<FeedbackStep>('choose');
  const [type, setType] = useState<FeedbackType>('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  function handleChoose(t: FeedbackType) {
    setType(t);
    setStep('write');
  }

  function handleClose() {
    setStep('choose');
    setMessage('');
    onClose();
  }

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type,
        message: message.trim(),
        page_url: window.location.href,
      });

      if (error) throw error;
      toast.success(type === 'issue' ? 'Problema reportado' : 'Idea enviada');
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pt-14">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Dialog */}
      <div className={cn(
        'relative z-10 w-80 rounded-xl border border-foreground/10 bg-surface-secondary shadow-2xl',
        'animate-in fade-in slide-in-from-top-2 duration-200',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/6">
          <p className="text-sm font-semibold text-foreground">
            {step === 'choose' ? 'Que quieres compartir?' : type === 'issue' ? 'Reportar problema' : 'Compartir idea'}
          </p>
          <button type="button" onClick={handleClose} className="text-foreground/30 hover:text-foreground/60 transition-colors">
            <X size={16} />
          </button>
        </div>

        {step === 'choose' && (
          <div className="p-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChoose('issue')}
              className="flex flex-col items-center gap-2 rounded-lg border border-foreground/8 p-4 text-center transition-all hover:border-red-500/30 hover:bg-red-500/5"
            >
              <AlertTriangle size={24} className="text-red-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Problema</p>
                <p className="text-[11px] text-foreground/40">con mi proyecto</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleChoose('idea')}
              className="flex flex-col items-center gap-2 rounded-lg border border-foreground/8 p-4 text-center transition-all hover:border-amber-500/30 hover:bg-amber-500/5"
            >
              <Lightbulb size={24} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Idea</p>
                <p className="text-[11px] text-foreground/40">para mejorar Kiyoko</p>
              </div>
            </button>
          </div>
        )}

        {step === 'write' && (
          <div className="p-4 space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'issue' ? 'Describe el problema...' : 'Mi idea para mejorar Kiyoko es...'}
              rows={4}
              autoFocus
              className="w-full rounded-lg border border-foreground/10 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 resize-none focus:outline-none focus:border-brand-500"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                {type === 'issue' ? 'Mejor enviar idea' : 'Mejor reportar problema'}
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                <Send size={12} />
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
