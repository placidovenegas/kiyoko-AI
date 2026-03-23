'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key, Plus, Trash2, Eye, EyeOff, Check, X, Loader2, ExternalLink, Shield, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------

interface ProviderDef {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  signupUrl: string;
  placeholder: string;
  prefix: string; // expected key prefix for validation hint
}

const TEXT_PROVIDERS: ProviderDef[] = [
  { id: 'groq', name: 'Groq', description: 'LLaMA 3.3 70B — Ultrarrapido, gratis ilimitado', isFree: true, signupUrl: 'https://console.groq.com/keys', placeholder: 'gsk_...', prefix: 'gsk_' },
  { id: 'cerebras', name: 'Cerebras', description: 'LLaMA 3.1 8B — La inferencia mas rapida del mundo, gratis', isFree: true, signupUrl: 'https://cloud.cerebras.ai', placeholder: 'csk-...', prefix: '' },
  { id: 'mistral', name: 'Mistral', description: 'Mistral Large — Preciso, 1B tokens gratis/mes', isFree: true, signupUrl: 'https://console.mistral.ai', placeholder: 'Tu API key de Mistral', prefix: '' },
  { id: 'gemini', name: 'Gemini', description: 'Gemini 2.0 Flash — Versatil, cuota gratuita limitada', isFree: true, signupUrl: 'https://aistudio.google.com/apikey', placeholder: 'AIza...', prefix: 'AIza' },
  { id: 'grok', name: 'Grok (xAI)', description: 'Grok 3 Fast — Creativo (requiere creditos)', isFree: false, signupUrl: 'https://console.x.ai', placeholder: 'xai-...', prefix: 'xai-' },
  { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek V3 — Narrativas profundas ($0.14/M tokens)', isFree: false, signupUrl: 'https://platform.deepseek.com', placeholder: 'sk-...', prefix: 'sk-' },
  { id: 'claude', name: 'Claude', description: 'Claude Sonnet 4 — El mejor en personajes vivos (premium)', isFree: false, signupUrl: 'https://console.anthropic.com', placeholder: 'sk-ant-...', prefix: 'sk-ant-' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o Mini + DALL-E 3 (premium)', isFree: false, signupUrl: 'https://platform.openai.com', placeholder: 'sk-proj-...', prefix: 'sk-' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserKey {
  id: string;
  provider: string;
  api_key_hint: string;
  is_active: boolean;
  monthly_budget_usd: number | null;
  monthly_spent_usd: number | null;
  created_at: string;
}

interface ServerProvider {
  id: string;
  name: string;
  status: 'available' | 'cooldown' | 'no_key';
  isFree: boolean;
  retryInSeconds: number | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiKeysPage() {
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const queryClient = useQueryClient();

  const { data: apiKeysData, isLoading: loading } = useQuery({
    queryKey: ['api-keys-data'],
    queryFn: async () => {
      const [keysRes, statusRes] = await Promise.all([
        fetch('/api/user/api-keys').then((r) => r.ok ? r.json() : { keys: [] }),
        fetch('/api/ai/providers/status').then((r) => r.ok ? r.json() : { providers: [] }),
      ]);
      return {
        userKeys: (keysRes.keys ?? []) as UserKey[],
        serverProviders: (statusRes.providers ?? []) as ServerProvider[],
      };
    },
  });

  const userKeys = apiKeysData?.userKeys ?? [];
  const serverProviders = apiKeysData?.serverProviders ?? [];

  // Test a key
  const handleTest = useCallback(async (provider: string, apiKey: string) => {
    setTesting(true);
    try {
      const res = await fetch('/api/user/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (res.ok) {
        toast.success('API key valida');
      } else {
        const err = await res.json();
        toast.error(err.error || 'API key invalida');
      }
    } catch {
      toast.error('Error al verificar la key');
    } finally {
      setTesting(false);
    }
  }, []);

  // Save a key
  const saveMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
    },
    onSuccess: () => {
      toast.success('API key guardada');
      setAddingProvider(null);
      setNewKeyValue('');
      queryClient.invalidateQueries({ queryKey: ['api-keys-data'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Delete a key
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
    },
    onSuccess: () => {
      toast.success('API key eliminada');
      queryClient.invalidateQueries({ queryKey: ['api-keys-data'] });
    },
    onError: () => {
      toast.error('Error al eliminar');
    },
  });

  const handleSave = useCallback((provider: string) => {
    if (!newKeyValue.trim()) return;
    saveMutation.mutate({ provider, apiKey: newKeyValue.trim() });
  }, [newKeyValue, saveMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const saving = saveMutation.isPending;

  // Get server status for a provider
  function getServerStatus(providerId: string): ServerProvider | undefined {
    return serverProviders.find((p) => p.id === providerId);
  }

  // Check if user has a key for a provider
  function getUserKey(providerId: string): UserKey | undefined {
    return userKeys.find((k) => k.provider === providerId);
  }

  return (
    <div className="mx-auto max-w-2xl h-full overflow-y-auto space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Key size={22} />
          Proveedores de IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tus API keys. Los proveedores gratuitos ya estan activos por defecto.
        </p>
      </div>

      {/* Server status banner */}
      {!loading && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Estado del servidor</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {serverProviders.filter(p => p.status !== 'no_key').map((p) => (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  p.status === 'available' && 'bg-emerald-500/10 text-emerald-600',
                  p.status === 'cooldown' && 'bg-amber-500/10 text-amber-600',
                )}
              >
                <span className={cn(
                  'size-1.5 rounded-full',
                  p.status === 'available' && 'bg-emerald-500',
                  p.status === 'cooldown' && 'bg-amber-500 animate-pulse',
                )} />
                {p.name}
                {p.status === 'cooldown' && p.retryInSeconds && (
                  <span className="text-[10px] opacity-70">({p.retryInSeconds}s)</span>
                )}
              </div>
            ))}
            {serverProviders.filter(p => p.status !== 'no_key').length === 0 && (
              <span className="text-xs text-muted-foreground">Ningun provider activo en el servidor</span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {TEXT_PROVIDERS.map((provider) => {
            const userKey = getUserKey(provider.id);
            const serverStatus = getServerStatus(provider.id);
            const isServerActive = serverStatus?.status === 'available';
            const isAdding = addingProvider === provider.id;

            return (
              <div key={provider.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Provider row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Status dot */}
                  <div className={cn(
                    'size-2.5 rounded-full shrink-0',
                    userKey?.is_active || isServerActive ? 'bg-emerald-500' :
                    serverStatus?.status === 'cooldown' ? 'bg-amber-500 animate-pulse' :
                    'bg-muted-foreground/20',
                  )} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{provider.name}</span>
                      {provider.isFree && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 uppercase">Gratis</span>
                      )}
                      {!provider.isFree && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 uppercase">Premium</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                    {userKey && (
                      <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                        {userKey.api_key_hint}
                      </p>
                    )}
                    {serverStatus?.status === 'cooldown' && serverStatus.retryInSeconds && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Cuota agotada — se reactiva en {serverStatus.retryInSeconds}s
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isServerActive && !userKey && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded mr-1">
                        Servidor
                      </span>
                    )}
                    {userKey ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(userKey.id)}
                        className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Eliminar key"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingProvider(isAdding ? null : provider.id);
                          setNewKeyValue('');
                          setShowKey(false);
                        }}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isAdding
                            ? 'bg-secondary text-muted-foreground'
                            : 'bg-primary/10 text-primary hover:bg-primary/20',
                        )}
                      >
                        {isAdding ? <X size={12} /> : <Plus size={12} />}
                        {isAdding ? 'Cancelar' : 'Anadir key'}
                      </button>
                    )}
                    <a
                      href={provider.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Obtener API key"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* Add key form */}
                {isAdding && (
                  <div className="px-4 pb-4 pt-0 border-t border-border mt-0">
                    <div className="flex items-center gap-2 mt-3">
                      <div className="relative flex-1">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                          placeholder={provider.placeholder}
                          className="w-full h-9 px-3 pr-9 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTest(provider.id, newKeyValue)}
                        disabled={!newKeyValue.trim() || testing}
                        className={cn(
                          'flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors',
                          'bg-accent text-foreground hover:bg-accent/80',
                          (!newKeyValue.trim() || testing) && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {testing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Probar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(provider.id)}
                        disabled={!newKeyValue.trim() || saving}
                        className={cn(
                          'flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors',
                          'bg-primary text-primary-foreground hover:bg-primary/90',
                          (!newKeyValue.trim() || saving) && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                        Guardar
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Obtener key gratis en{' '}
                      <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {provider.signupUrl.replace('https://', '')}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Security info */}
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex items-start gap-3">
        <Shield size={16} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Seguridad</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Las API keys se cifran con AES-256 antes de guardarse. Nunca se muestran completas.
            Las keys del servidor son globales y no se pueden ver desde aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
