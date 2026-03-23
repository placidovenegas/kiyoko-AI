'use client';

import { useState } from 'react';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import { GitBranch, Send, Film, Clock, Layers, Info } from 'lucide-react';

export default function DerivePage() {
  const { video, scenes, loading: videoLoading } = useVideo();
  const { project } = useProject();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message },
      {
        role: 'assistant',
        content: 'La funcionalidad de derivacion de videos esta en desarrollo. Pronto podras crear nuevas versiones de tus videos basandote en el contenido existente.',
      },
    ]);
    setMessage('');
  };

  // ── Loading skeleton ──
  if (videoLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="h-32 animate-pulse rounded-xl bg-secondary" />
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Derivar video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea una nueva version del video basandote en el contenido existente
        </p>
      </div>

      {/* ── Source video info ── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Film className="h-4 w-4 text-primary" />
          Video origen
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Titulo</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{video?.title ?? 'Sin titulo'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Escenas</p>
            <div className="mt-0.5 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{scenes.length}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duracion estimada</p>
            <div className="mt-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {scenes.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0)}s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-primary">Funcionalidad en desarrollo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Describe como quieres modificar el video. Puedes cambiar el tono, reenfocar el contenido,
            o crear una version para otra plataforma. La IA se encargara de generar las nuevas escenas.
          </p>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Describe las diferencias que quieres en el nuevo video
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  'Version corta para TikTok',
                  'Cambiar tono a mas informal',
                  'Adaptar para Instagram Reels',
                  'Version en ingles',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'border border-border bg-background text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe como quieres derivar este video..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
